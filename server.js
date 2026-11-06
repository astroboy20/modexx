/**
 * WebSocket Server for Real-Time Synchronization
 * Handles progress updates, AR scans, and multi-device sync
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { createClient } = require('@supabase/supabase-js')

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// We validate sessions by checking the player exists in Supabase
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? (process.env.NEXT_PUBLIC_APP_URL || true)
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
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

    // sessionToken is the base64-encoded session cookie value
    // Validate it decodes correctly and matches the claimed playerId
    try {
      if (sessionToken) {
        const decoded = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'))
        if (!decoded || decoded.id !== playerId) {
          return next(new Error('Authentication failed: session mismatch'))
        }
      } else {
        // Fall back to DB check
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
    } catch (err) {
      return next(new Error('Authentication failed: invalid session'))
    }

    socket.playerId = playerId
    next()
  })

  // ── Connection handling ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[WS] Player ${socket.playerId} connected (${socket.id})`)

    // Each player has their own room for cross-device sync
    socket.join(`player:${socket.playerId}`)

    // ── Join monument room (for monument-scoped broadcasts) ──────────────────
    socket.on('join:monument', ({ monumentSlug }) => {
      if (!monumentSlug || typeof monumentSlug !== 'string') return

      // Join a shared monument room (all devices exploring same monument)
      const sharedRoom = `monument:${monumentSlug}`
      // Join a player+monument room (all devices of same player for this monument)
      const playerRoom = `monument:${monumentSlug}:player:${socket.playerId}`

      socket.join(sharedRoom)
      socket.join(playerRoom)

      console.log(`[WS] Player ${socket.playerId} joined rooms: ${sharedRoom}, ${playerRoom}`)
      socket.emit('joined:monument', { monumentSlug })
    })

    // ── Leave monument room ──────────────────────────────────────────────────
    socket.on('leave:monument', ({ monumentSlug }) => {
      if (!monumentSlug) return
      socket.leave(`monument:${monumentSlug}`)
      socket.leave(`monument:${monumentSlug}:player:${socket.playerId}`)
    })

    // ── Progress update (scanner detected a hotspot) ─────────────────────────
    // NOTE: Database persistence happens in the API route.
    // This event is only for real-time cross-device notification AFTER the DB write.
    socket.on('progress:update', ({ monumentSlug, hotspotId, scannedAt }) => {
      if (!monumentSlug || !hotspotId) return

      const payload = {
        playerId: socket.playerId,
        monumentSlug,
        hotspotId,
        scannedAt: scannedAt || new Date().toISOString(),
      }

      // Broadcast to ALL of this player's connected devices
      io.to(`player:${socket.playerId}`).emit('progress:scanned', payload)
      // Also broadcast to monument-player room (catches any other joined sockets)
      io.to(`monument:${monumentSlug}:player:${socket.playerId}`).emit('hotspot:unlocked', {
        monumentSlug,
        hotspotId,
        timestamp: payload.scannedAt,
      })

      console.log(`[WS] Progress: hotspot ${hotspotId} for player ${socket.playerId}`)
    })

    // ── Scanner detected event ────────────────────────────────────────────────
    socket.on('scanner:detected', ({ monumentSlug, hotspotId }) => {
      if (!monumentSlug || !hotspotId) return

      const payload = {
        monumentSlug,
        hotspotId,
        timestamp: new Date().toISOString(),
      }

      // Broadcast to all connected devices of this player
      io.to(`player:${socket.playerId}`).emit('hotspot:unlocked', payload)
      io.to(`monument:${monumentSlug}:player:${socket.playerId}`).emit('hotspot:unlocked', payload)

      console.log(`[WS] Scanner: ${hotspotId} by player ${socket.playerId}`)
    })

    // ── Quiz submitted ────────────────────────────────────────────────────────
    socket.on('quiz:submitted', ({ monumentSlug, score, correctCount }) => {
      if (!monumentSlug) return

      io.to(`player:${socket.playerId}`).emit('quiz:complete', {
        monumentSlug,
        score,
        correctCount,
        timestamp: new Date().toISOString(),
      })
    })

    // ── Leaderboard update (broadcast to all) ─────────────────────────────────
    socket.on('leaderboard:update', ({ monumentSlug, entry }) => {
      if (!monumentSlug || !entry) return

      io.emit('leaderboard:newEntry', {
        monumentSlug,
        entry,
        timestamp: new Date().toISOString(),
      })
    })

    // ── Heartbeat ─────────────────────────────────────────────────────────────
    socket.on('ping', () => {
      socket.emit('pong', { ts: Date.now() })
    })

    // ── Disconnection ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[WS] Player ${socket.playerId} disconnected: ${reason}`)
    })

    socket.on('error', (error) => {
      console.error(`[WS] Error for player ${socket.playerId}:`, error)
    })
  })

  // ── Start server ──────────────────────────────────────────────────────────
  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket server running`)
    })
})
