/**
 * WebSocket Client Service
 * Real-time synchronization for two-device AR experience
 *
 * Architecture:
 * - Singleton per player session (one socket connection per tab/device)
 * - Reconnects automatically with exponential back-off
 * - Emits events AFTER database writes (server is source of truth)
 * - On reconnect, callers should re-fetch latest state from the API
 */

import { io, Socket } from 'socket.io-client'

// ── Event payload types ────────────────────────────────────────────────────

export interface ProgressData {
  playerId: string
  monumentSlug: string
  hotspotId: string
  scannedAt: string
}

export interface HotspotUnlockedData {
  monumentSlug: string
  hotspotId: string
  timestamp: string
}

export interface QuizCompleteData {
  monumentSlug: string
  score: number
  correctCount: number
  timestamp: string
}

export interface LeaderboardEntryData {
  monumentSlug: string
  entry: {
    displayName: string
    score: number
    correctCount: number
  }
  timestamp: string
}

type AnyCallback = (...args: unknown[]) => void

// ── WebSocket Client class ─────────────────────────────────────────────────

export class WebSocketClient {
  private socket: Socket | null = null
  private readonly playerId: string
  private readonly sessionToken: string
  private connectPromise: Promise<void> | null = null
  private reconnectFetchCallbacks: Array<() => void> = []

  constructor(playerId: string, sessionToken: string) {
    this.playerId = playerId
    this.sessionToken = sessionToken
  }

  // ── Connect ──────────────────────────────────────────────────────────────

  connect(): Promise<void> {
    // Return existing in-flight promise to avoid double connections
    if (this.connectPromise) return this.connectPromise

    if (this.socket?.connected) return Promise.resolve()

    this.connectPromise = new Promise<void>((resolve, reject) => {
      const url =
        typeof window !== 'undefined'
          ? process.env.NEXT_PUBLIC_WS_URL || window.location.origin
          : process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

      this.socket = io(url, {
        auth: {
          playerId: this.playerId,
          sessionToken: this.sessionToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        reconnectionAttempts: Infinity,
        timeout: 10000,
      })

      const onConnect = () => {
        console.log('[WS] Connected:', this.socket?.id)
        this.connectPromise = null
        resolve()
      }

      const onConnectError = (err: Error) => {
        console.warn('[WS] Connection error:', err.message)
        // Don't reject — socket.io will retry automatically
        // Resolve anyway so callers aren't blocked
        this.connectPromise = null
        resolve()
      }

      this.socket.once('connect', onConnect)
      this.socket.once('connect_error', onConnectError)

      // After initial connection, set up persistent reconnect handler
      this.socket.on('connect', () => {
        console.log('[WS] Reconnected')
        // Notify all registered callbacks so they can re-fetch missed updates
        this.reconnectFetchCallbacks.forEach((cb) => {
          try { cb() } catch {}
        })
      })

      this.socket.on('disconnect', (reason) => {
        console.log('[WS] Disconnected:', reason)
        if (reason === 'io server disconnect') {
          // Server forced disconnect — attempt manual reconnect
          this.socket?.connect()
        }
      })

      this.socket.on('error', (err) => {
        console.error('[WS] Socket error:', err)
      })
    })

    return this.connectPromise
  }

  // ── Disconnect ───────────────────────────────────────────────────────────

  disconnect(): void {
    this.connectPromise = null
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
    }
  }

  // ── Connection state ─────────────────────────────────────────────────────

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  // ── Register a callback to run after reconnect ────────────────────────────
  // Use this to re-fetch missed updates from the API after a disconnect

  onReconnectFetch(cb: () => void): () => void {
    this.reconnectFetchCallbacks.push(cb)
    return () => {
      this.reconnectFetchCallbacks = this.reconnectFetchCallbacks.filter((f) => f !== cb)
    }
  }

  // ── Rooms ────────────────────────────────────────────────────────────────

  joinMonument(monumentSlug: string): void {
    if (!this.socket?.connected) {
      console.warn('[WS] joinMonument called while disconnected')
      return
    }
    this.socket.emit('join:monument', { monumentSlug })
  }

  leaveMonument(monumentSlug: string): void {
    if (!this.socket) return
    this.socket.emit('leave:monument', { monumentSlug })
  }

  // ── Emit events ──────────────────────────────────────────────────────────

  /**
   * Notify other devices that a hotspot was scanned.
   * Call AFTER the API route has persisted the record.
   */
  sendProgressUpdate(monumentSlug: string, hotspotId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('progress:update', {
      monumentSlug,
      hotspotId,
      scannedAt: new Date().toISOString(),
    })
  }

  /**
   * Alias used by the scanner page — same as sendProgressUpdate.
   */
  sendScannerDetection(monumentSlug: string, hotspotId: string): void {
    if (!this.socket?.connected) return
    this.socket.emit('scanner:detected', { monumentSlug, hotspotId })
  }

  sendQuizSubmission(monumentSlug: string, score: number, correctCount: number): void {
    if (!this.socket?.connected) return
    this.socket.emit('quiz:submitted', { monumentSlug, score, correctCount })
  }

  sendLeaderboardUpdate(
    monumentSlug: string,
    entry: { displayName: string; score: number; correctCount: number }
  ): void {
    if (!this.socket?.connected) return
    this.socket.emit('leaderboard:update', { monumentSlug, entry })
  }

  ping(): void {
    if (!this.socket?.connected) return
    this.socket.emit('ping')
  }

  // ── Subscribe to events ──────────────────────────────────────────────────

  onHotspotUnlocked(callback: (data: HotspotUnlockedData) => void): void {
    if (!this.socket) return
    this.socket.on('hotspot:unlocked', callback as AnyCallback)
  }

  onProgressScanned(callback: (data: ProgressData) => void): void {
    if (!this.socket) return
    this.socket.on('progress:scanned', callback as AnyCallback)
  }

  onQuizComplete(callback: (data: QuizCompleteData) => void): void {
    if (!this.socket) return
    this.socket.on('quiz:complete', callback as AnyCallback)
  }

  onLeaderboardUpdate(callback: (data: LeaderboardEntryData) => void): void {
    if (!this.socket) return
    this.socket.on('leaderboard:newEntry', callback as AnyCallback)
  }

  onConnect(callback: () => void): void {
    if (!this.socket) return
    this.socket.on('connect', callback)
  }

  onDisconnect(callback: () => void): void {
    if (!this.socket) return
    this.socket.on('disconnect', callback as AnyCallback)
  }

  // ── Remove listeners ─────────────────────────────────────────────────────

  off(event: string, callback?: AnyCallback): void {
    if (!this.socket) return
    if (callback) {
      this.socket.off(event, callback)
    } else {
      this.socket.off(event)
    }
  }
}

// ── Singleton management ───────────────────────────────────────────────────

let wsInstance: WebSocketClient | null = null
let wsPlayerId: string | null = null

/**
 * Get or create the WebSocket singleton.
 * If the playerId changes (different user), the old connection is torn down.
 */
export function getWebSocketClient(playerId: string, sessionToken: string): WebSocketClient {
  if (wsInstance && wsPlayerId !== playerId) {
    // Different player — tear down stale connection
    wsInstance.disconnect()
    wsInstance = null
    wsPlayerId = null
  }

  if (!wsInstance) {
    wsInstance = new WebSocketClient(playerId, sessionToken)
    wsPlayerId = playerId
  }

  return wsInstance
}

/**
 * Disconnect and destroy the singleton.
 * Call this on sign-out.
 */
export function disconnectWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect()
    wsInstance = null
    wsPlayerId = null
  }
}
