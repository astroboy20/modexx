/**
 * WebSocket Client Service
 * Real-time synchronization for two-device AR experience
 */

import { io, Socket } from 'socket.io-client'

interface ProgressData {
  playerId: string
  monumentSlug: string
  hotspotId: string
  scannedAt: string
}

interface QuizCompleteData {
  monumentSlug: string
  score: number
  correctCount: number
  timestamp: string
}

interface HotspotUnlockedData {
  monumentSlug: string
  hotspotId: string
  timestamp: string
}

interface LeaderboardEntry {
  monumentSlug: string
  entry: {
    displayName: string
    score: number
    correctCount: number
  }
  timestamp: string
}

type ProgressCallback = (data: ProgressData) => void
type QuizCallback = (data: QuizCompleteData) => void
type HotspotCallback = (data: HotspotUnlockedData) => void
type LeaderboardCallback = (data: LeaderboardEntry) => void
type ConnectionCallback = () => void

export class WebSocketClient {
  private socket: Socket | null = null
  private playerId: string
  private sessionToken: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second
  
  constructor(playerId: string, sessionToken: string) {
    this.playerId = playerId
    this.sessionToken = sessionToken
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      const url = process.env.NEXT_PUBLIC_WS_URL || window.location.origin
      
      this.socket = io(url, {
        auth: {
          playerId: this.playerId,
          sessionToken: this.sessionToken
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity
      })

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected')
        this.reconnectAttempts = 0
        this.reconnectDelay = 1000
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error.message)
        
        this.reconnectAttempts++
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached')
          reject(new Error('Failed to connect to WebSocket server'))
        }
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[WebSocket] Disconnected:', reason)
        
        // Auto-reconnect for certain disconnect reasons
        if (reason === 'io server disconnect') {
          // Server closed connection, try to reconnect
          setTimeout(() => this.connect(), this.reconnectDelay)
          this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000) // Exponential backoff
        }
      })

      this.socket.on('error', (error) => {
        console.error('[WebSocket] Socket error:', error)
      })

      // Heartbeat
      this.socket.on('pong', () => {
        // Connection is alive
      })
    })
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      console.log('[WebSocket] Disconnected')
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Join monument room for progress sync
   */
  joinMonument(monumentSlug: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Not connected')
      return
    }

    this.socket.emit('join:monument', { monumentSlug })
  }

  /**
   * Send progress update (scanned hotspot)
   */
  sendProgressUpdate(monumentSlug: string, hotspotId: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Not connected')
      return
    }

    this.socket.emit('progress:update', {
      monumentSlug,
      hotspotId,
      scannedAt: new Date().toISOString()
    })
  }

  /**
   * Send scanner detection event
   */
  sendScannerDetection(monumentSlug: string, hotspotId: string): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Not connected')
      return
    }

    this.socket.emit('scanner:detected', {
      monumentSlug,
      hotspotId
    })
  }

  /**
   * Send quiz submission
   */
  sendQuizSubmission(monumentSlug: string, score: number, correctCount: number): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Not connected')
      return
    }

    this.socket.emit('quiz:submitted', {
      monumentSlug,
      score,
      correctCount
    })
  }

  /**
   * Send leaderboard update
   */
  sendLeaderboardUpdate(monumentSlug: string, entry: { displayName: string; score: number; correctCount: number }): void {
    if (!this.socket?.connected) {
      console.error('[WebSocket] Not connected')
      return
    }

    this.socket.emit('leaderboard:update', {
      monumentSlug,
      entry
    })
  }

  /**
   * Listen for progress scans from other devices
   */
  onProgressScanned(callback: ProgressCallback): void {
    if (!this.socket) return
    this.socket.on('progress:scanned', callback)
  }

  /**
   * Listen for hotspot unlocks
   */
  onHotspotUnlocked(callback: HotspotCallback): void {
    if (!this.socket) return
    this.socket.on('hotspot:unlocked', callback)
  }

  /**
   * Listen for quiz completion
   */
  onQuizComplete(callback: QuizCallback): void {
    if (!this.socket) return
    this.socket.on('quiz:complete', callback)
  }

  /**
   * Listen for leaderboard updates
   */
  onLeaderboardUpdate(callback: LeaderboardCallback): void {
    if (!this.socket) return
    this.socket.on('leaderboard:newEntry', callback)
  }

  /**
   * Listen for connection events
   */
  onConnect(callback: ConnectionCallback): void {
    if (!this.socket) return
    this.socket.on('connect', callback)
  }

  onDisconnect(callback: ConnectionCallback): void {
    if (!this.socket) return
    this.socket.on('disconnect', callback)
  }

  /**
   * Remove specific event listener
   */
  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.socket) return
    this.socket.off(event, callback)
  }

  /**
   * Send heartbeat ping
   */
  ping(): void {
    if (!this.socket?.connected) return
    this.socket.emit('ping')
  }
}

// Singleton instance management
let wsClient: WebSocketClient | null = null

/**
 * Get or create WebSocket client instance
 */
export function getWebSocketClient(playerId: string, sessionToken: string): WebSocketClient {
  if (!wsClient) {
    wsClient = new WebSocketClient(playerId, sessionToken)
  }
  return wsClient
}

/**
 * Disconnect and cleanup WebSocket client
 */
export function disconnectWebSocket(): void {
  if (wsClient) {
    wsClient.disconnect()
    wsClient = null
  }
}
