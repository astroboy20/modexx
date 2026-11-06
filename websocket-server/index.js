/**
 * Standalone WebSocket Server — deploy this to Railway
 * The Next.js app on Vercel connects to this for real-time sync
 */

const { createServer } = require('http')
const { Server } = require('socket.io')
const { createClient } = require('@supabase/supabase-js')

const port = parseInt(process.env.PORT || '3001', 10)

// ── Supabase admin client (for session validation) ─────────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── HTTP server (Railway needs something to bind to) ───────────────────────
const httpServer = createServer((req, res) => {
  // Health check endpoint — Railway uses this to confirm the service is up
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'modexx-websocket' }))
    return
  }
  res.writeHead(404)
  res.end()
})

// ── CORS origins ───────────────────────────────────────────────────────────
// Set ALLOWED_ORIGIN in Railway environment variables to your Vercel URL
// e.g. https://your-app.vercel.app
// You can also set multiple origins as comma-separated: https://a.com,https://b.com
function getAllowedOrigins() {
  const env = process.env.ALLOWED_ORIGIN || ''
  if (!env) return '*'  // fallback for local dev — lock this down in production
  return env.split(',').map(s => s.trim()).filter(Boolean)
}

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ── Authentication middleware ──────────────────────────────────────────────
io.use(async (socket, next) => {
  const { playerId, sessionToken } = socket.handshake.auth

  if (!playerId) {
    return next(new Error('Authentication required: missing playerId'))
  }

  // Validate: decode the base64 session cookie and confirm it matches playerId
  try {
    if (sessionToken) {
      const decoded = JSON.parse(
        Buffer.from(sessionToken, 'base64').toString('utf8')
      )
      if (!decoded || decoded.id !== playerId) {
        return next(new Error('Authentication failed: session mismatch'))
      }
    } else {
      // No token — fall back to DB lookup
      const supabase = getSupabaseAdmin()
      if (supabase) {
        const { data, error } = await supabase
          .from('players')
          .select('id')
          .eq('id', playerId)
          .maybeSingle()

        if (error || !data) {
          return next(new Error('Authentication failed: player not found'))
        }
      }
    }
  } catch {
    return next(new Error('Authentication failed: invalid session token'))
  }

  socket.playerId = playerId
  next()
})

// ── Connection handling ────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[WS] Player ${socket.playerId} connected (${socket.id})`)

  // Each player gets their own room for cross-device sync
  socket.join(`player:${socket.playerId}`)

  // ── Join monument room ───────────────────────────────────────────────────
  socket.on('join:monument', ({ monumentSlug }) => {
    if (!monumentSlug || typeof monumentSlug !== 'string') return

    const sharedRoom = `monument:${monumentSlug}`
    const playerRoom = `monument:${monumentSlug}:player:${socket.playerId}`
    socket.join(sharedRoom)
    socket.join(playerRoom)

    console.log(`[WS] Player ${socket.playerId} joined ${sharedRoom}`)
    socket.emit('joined:monument', { monumentSlug })
  })

  // ── Leave monument room ──────────────────────────────────────────────────
  socket.on('leave:monument', ({ monumentSlug }) => {
    if (!monumentSlug) return
    socket.leave(`monument:${monumentSlug}`)
    socket.leave(`monument:${monumentSlug}:player:${socket.playerId}`)
  })

  // ── Progress update (after DB write on the Vercel side) ──────────────────
  socket.on('progress:update', ({ monumentSlug, hotspotId, scannedAt }) => {
    if (!monumentSlug || !hotspotId) return

    const payload = {
      playerId: socket.playerId,
      monumentSlug,
      hotspotId,
      scannedAt: scannedAt || new Date().toISOString(),
    }

    // Broadcast to all devices of this player
    io.to(`player:${socket.playerId}`).emit('progress:scanned', payload)
    io.to(`monument:${monumentSlug}:player:${socket.playerId}`).emit('hotspot:unlocked', {
      monumentSlug,
      hotspotId,
      timestamp: payload.scannedAt,
    })

    console.log(`[WS] Progress: ${hotspotId} for player ${socket.playerId}`)
  })

  // ── Scanner detection ────────────────────────────────────────────────────
  socket.on('scanner:detected', ({ monumentSlug, hotspotId }) => {
    if (!monumentSlug || !hotspotId) return

    const payload = {
      monumentSlug,
      hotspotId,
      timestamp: new Date().toISOString(),
    }

    io.to(`player:${socket.playerId}`).emit('hotspot:unlocked', payload)
    io.to(`monument:${monumentSlug}:player:${socket.playerId}`).emit('hotspot:unlocked', payload)

    console.log(`[WS] Scanner: ${hotspotId} by player ${socket.playerId}`)
  })

  // ── Quiz submitted ───────────────────────────────────────────────────────
  socket.on('quiz:submitted', ({ monumentSlug, score, correctCount }) => {
    if (!monumentSlug) return
    io.to(`player:${socket.playerId}`).emit('quiz:complete', {
      monumentSlug, score, correctCount,
      timestamp: new Date().toISOString(),
    })
  })

  // ── Leaderboard update (broadcast to everyone) ───────────────────────────
  socket.on('leaderboard:update', ({ monumentSlug, entry }) => {
    if (!monumentSlug || !entry) return
    io.emit('leaderboard:newEntry', {
      monumentSlug, entry,
      timestamp: new Date().toISOString(),
    })
  })

  // ── Heartbeat ────────────────────────────────────────────────────────────
  socket.on('ping', () => {
    socket.emit('pong', { ts: Date.now() })
  })

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    console.log(`[WS] Player ${socket.playerId} disconnected: ${reason}`)
  })

  socket.on('error', (err) => {
    console.error(`[WS] Error for player ${socket.playerId}:`, err)
  })
})

// ── Start ──────────────────────────────────────────────────────────────────
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`[WS] Socket.IO server listening on port ${port}`)
})
