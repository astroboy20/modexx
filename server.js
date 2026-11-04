/**
 * WebSocket Server for Real-Time Synchronization
 * Handles progress updates, AR scans, and multi-device sync
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

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

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_APP_URL 
        : 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  })

  // Middleware for authentication
  io.use((socket, next) => {
    const { playerId, sessionToken } = socket.handshake.auth
    
    if (!playerId || !sessionToken) {
      return next(new Error('Authentication required'))
    }
    
    // Attach player info to socket
    socket.playerId = playerId
    socket.sessionToken = sessionToken
    next()
  })

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`[WebSocket] Player ${socket.playerId} connected`)

    // Join player-specific room
    socket.join(`player:${socket.playerId}`)

    // Handle monument exploration room
    socket.on('join:monument', ({ monumentSlug }) => {
      if (!monumentSlug) return
      
      const room = `monument:${monumentSlug}:${socket.playerId}`
      socket.join(room)
      console.log(`[WebSocket] Player ${socket.playerId} joined ${room}`)
      
      socket.emit('joined:monument', { monumentSlug })
    })

    // Handle progress updates (broadcast to player's devices)
    socket.on('progress:update', async ({ monumentSlug, hotspotId, scannedAt }) => {
      if (!monumentSlug || !hotspotId) return

      const progressData = {
        playerId: socket.playerId,
        monumentSlug,
        hotspotId,
        scannedAt: scannedAt || new Date().toISOString()
      }

      // Broadcast to all devices of this player
      io.to(`player:${socket.playerId}`).emit('progress:scanned', progressData)
      
      console.log(`[WebSocket] Progress broadcast: ${hotspotId} for player ${socket.playerId}`)
    })

    // Handle scanner detection events
    socket.on('scanner:detected', ({ monumentSlug, hotspotId }) => {
      if (!monumentSlug || !hotspotId) return

      // Notify all player's devices
      io.to(`player:${socket.playerId}`).emit('hotspot:unlocked', {
        monumentSlug,
        hotspotId,
        timestamp: new Date().toISOString()
      })
      
      console.log(`[WebSocket] Scanner detection: ${hotspotId}`)
    })

    // Handle quiz submissions
    socket.on('quiz:submitted', ({ monumentSlug, score, correctCount }) => {
      if (!monumentSlug) return

      io.to(`player:${socket.playerId}`).emit('quiz:complete', {
        monumentSlug,
        score,
        correctCount,
        timestamp: new Date().toISOString()
      })
    })

    // Handle leaderboard updates (broadcast to all)
    socket.on('leaderboard:update', ({ monumentSlug, entry }) => {
      if (!monumentSlug || !entry) return

      io.emit('leaderboard:newEntry', {
        monumentSlug,
        entry,
        timestamp: new Date().toISOString()
      })
    })

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong')
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[WebSocket] Player ${socket.playerId} disconnected: ${reason}`)
    })

    // Error handling
    socket.on('error', (error) => {
      console.error(`[WebSocket] Socket error for player ${socket.playerId}:`, error)
    })
  })

  // Start server
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
