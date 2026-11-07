/**
 * Real-time sync via Supabase Realtime Broadcast.
 *
 * Replaces Socket.io — works on Vercel (serverless) with no extra infra.
 * All devices subscribed to `monument:<slug>` receive each other's events.
 *
 * API is identical to the old WebSocketClient so all call-sites work unchanged.
 */

import { getSupabaseBrowser } from './supabase-browser'
import type { RealtimeChannel } from '@supabase/supabase-js'

// ── Types ──────────────────────────────────────────────────────────────────

export interface HotspotUnlockedData {
  monumentSlug: string
  hotspotId: string
  timestamp: string
}

export interface ProgressData {
  playerId: string
  monumentSlug: string
  hotspotId: string
  scannedAt: string
}

export interface QuizCompleteData {
  monumentSlug: string
  score: number
  correctCount: number
  timestamp: string
}

export interface LeaderboardEntryData {
  monumentSlug: string
  entry: { displayName: string; score: number; correctCount: number }
  timestamp: string
}

type AnyCallback = (...args: unknown[]) => void

// ── WebSocketClient ────────────────────────────────────────────────────────

export class WebSocketClient {
  private readonly playerId: string
  private channels = new Map<string, RealtimeChannel>()
  private reconnectFetchCallbacks: Array<() => void> = []

  // Pending event listeners registered before joinMonument is called
  private pendingListeners: Array<{ event: string; cb: AnyCallback }> = []

  constructor(playerId: string, _sessionToken: string) {
    this.playerId = playerId
  }

  connect(): Promise<void> {
    return Promise.resolve()
  }

  disconnect(): void {
    const sb = getSupabaseBrowser()
    this.channels.forEach((ch) => sb.removeChannel(ch))
    this.channels.clear()
  }

  isConnected(): boolean {
    return true // Supabase handles its own connection
  }

  onReconnectFetch(cb: () => void): () => void {
    this.reconnectFetchCallbacks.push(cb)
    return () => {
      this.reconnectFetchCallbacks = this.reconnectFetchCallbacks.filter((f) => f !== cb)
    }
  }

  // ── Join a monument channel ───────────────────────────────────────────────

  joinMonument(monumentSlug: string): void {
    if (this.channels.has(monumentSlug)) return

    const sb = getSupabaseBrowser()
    const channelName = `monument:${monumentSlug}`

    // Build channel, attach all pending listeners BEFORE subscribing
    let ch = sb.channel(channelName, {
      config: { broadcast: { self: true } },
    })

    // Register any listeners that were queued before joinMonument was called
    for (const { event, cb } of this.pendingListeners) {
      ch = ch.on('broadcast', { event }, ({ payload }) => cb(payload))
    }

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[RT] Subscribed: ${channelName}`)
        // Notify reconnect callbacks so callers can re-fetch missed events
        this.reconnectFetchCallbacks.forEach((fn) => { try { fn() } catch {} })
      }
    })

    this.channels.set(monumentSlug, ch)
    this.pendingListeners = [] // consumed
  }

  leaveMonument(monumentSlug: string): void {
    const ch = this.channels.get(monumentSlug)
    if (!ch) return
    getSupabaseBrowser().removeChannel(ch)
    this.channels.delete(monumentSlug)
  }

  // ── Emit ──────────────────────────────────────────────────────────────────

  sendScannerDetection(monumentSlug: string, hotspotId: string): void {
    const ch = this.channels.get(monumentSlug)
    if (!ch) { console.warn('[RT] sendScannerDetection: no channel for', monumentSlug); return }
    ch.send({
      type: 'broadcast',
      event: 'hotspot:unlocked',
      payload: { monumentSlug, hotspotId, playerId: this.playerId, timestamp: new Date().toISOString() },
    })
  }

  sendProgressUpdate(monumentSlug: string, hotspotId: string): void {
    this.sendScannerDetection(monumentSlug, hotspotId)
  }

  sendQuizSubmission(monumentSlug: string, score: number, correctCount: number): void {
    const ch = this.channels.get(monumentSlug)
    if (!ch) return
    ch.send({
      type: 'broadcast',
      event: 'quiz:complete',
      payload: { monumentSlug, score, correctCount, timestamp: new Date().toISOString() },
    })
  }

  sendLeaderboardUpdate(
    monumentSlug: string,
    entry: { displayName: string; score: number; correctCount: number }
  ): void {
    const ch = this.channels.get(monumentSlug)
    if (!ch) return
    ch.send({
      type: 'broadcast',
      event: 'leaderboard:newEntry',
      payload: { monumentSlug, entry, timestamp: new Date().toISOString() },
    })
  }

  ping(): void { /* no-op */ }

  // ── Subscribe to events ───────────────────────────────────────────────────
  // These may be called before joinMonument — queue them if so.

  private _on(event: string, cb: AnyCallback): void {
    if (this.channels.size === 0) {
      // No channels yet — queue the listener
      this.pendingListeners.push({ event, cb })
      return
    }
    // Already have channels — attach directly
    this.channels.forEach((ch) => {
      ch.on('broadcast', { event }, ({ payload }) => cb(payload))
    })
  }

  onHotspotUnlocked(callback: (data: HotspotUnlockedData) => void): void {
    this._on('hotspot:unlocked', callback as AnyCallback)
  }

  onProgressScanned(callback: (data: ProgressData) => void): void {
    this._on('hotspot:unlocked', callback as AnyCallback)
  }

  onQuizComplete(callback: (data: QuizCompleteData) => void): void {
    this._on('quiz:complete', callback as AnyCallback)
  }

  onLeaderboardUpdate(callback: (data: LeaderboardEntryData) => void): void {
    this._on('leaderboard:newEntry', callback as AnyCallback)
  }

  onConnect(callback: () => void): void {
    setTimeout(callback, 0)
  }

  onDisconnect(_callback: () => void): void { /* no-op */ }

  off(_event: string, _callback?: AnyCallback): void { /* no-op — channels handle cleanup */ }
}

// ── Singleton ──────────────────────────────────────────────────────────────

let wsInstance: WebSocketClient | null = null
let wsPlayerId: string | null = null

export function getWebSocketClient(playerId: string, sessionToken: string): WebSocketClient {
  if (wsInstance && wsPlayerId !== playerId) {
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

export function disconnectWebSocket(): void {
  if (wsInstance) {
    wsInstance.disconnect()
    wsInstance = null
    wsPlayerId = null
  }
}
