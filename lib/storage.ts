'use client'

// Safe localStorage wrapper — handles SSR, unavailable storage, and malformed data

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable — fail silently
  }
}

function safeRemove(key: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(key)
  } catch {
    // fail silently
  }
}

// ── Player Profile ─────────────────────────────────────────────────────────

export interface PlayerProfile {
  id: string
  displayName: string
  createdAt: string
}

const PROFILE_KEY = 'modexx_player'

export function getProfile(): PlayerProfile | null {
  return safeGet<PlayerProfile | null>(PROFILE_KEY, null)
}

export function saveProfile(profile: PlayerProfile): void {
  safeSet(PROFILE_KEY, profile)
}

export function clearProfile(): void {
  safeRemove(PROFILE_KEY)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// ── Exploration Progress ───────────────────────────────────────────────────
// Keys are scoped to playerId so different users on the same device
// don't share exploration state.

import { getClientSession } from './session-client'

function currentPlayerId(): string {
  if (typeof window === 'undefined') return 'anon'
  const session = getClientSession()
  return session?.id ?? 'anon'
}

const EXPLORATION_KEY = (slug: string) => `modexx_explore_${currentPlayerId()}_${slug}`

export function getExploredHotspots(slug: string): string[] {
  return safeGet<string[]>(EXPLORATION_KEY(slug), [])
}

export function markHotspotExplored(slug: string, hotspotId: string): void {
  const current = getExploredHotspots(slug)
  if (!current.includes(hotspotId)) {
    safeSet(EXPLORATION_KEY(slug), [...current, hotspotId])
  }
}

export function resetExploration(slug: string): void {
  safeRemove(EXPLORATION_KEY(slug))
}

// ── Quiz Attempt ───────────────────────────────────────────────────────────

export interface QuizAttempt {
  id: string
  monumentSlug: string
  playerId: string
  assignedQuestionIds: string[]
  answers: Record<string, number> // questionId -> selectedIndex
  startedAt: string
  submittedAt: string | null
  score: number          // score for THIS attempt (max 100)
  correctCount: number
  status: 'in_progress' | 'completed'
  attemptNumber?: number // which retake this is (1-based)
}

const ACTIVE_ATTEMPT_KEY  = (slug: string) => `modexx_attempt_${slug}`
const ATTEMPT_HISTORY_KEY = (slug: string) => `modexx_history_${slug}`
// All question IDs ever answered by this player for a monument (for deduplication)
const USED_QUESTIONS_KEY  = (slug: string) => `modexx_used_qs_${slug}`

export function getActiveAttempt(slug: string): QuizAttempt | null {
  return safeGet<QuizAttempt | null>(ACTIVE_ATTEMPT_KEY(slug), null)
}

export function saveAttempt(attempt: QuizAttempt): void {
  safeSet(ACTIVE_ATTEMPT_KEY(attempt.monumentSlug), attempt)
}

export function clearActiveAttempt(slug: string): void {
  safeRemove(ACTIVE_ATTEMPT_KEY(slug))
}

export function getAttemptHistory(slug: string): QuizAttempt[] {
  return safeGet<QuizAttempt[]>(ATTEMPT_HISTORY_KEY(slug), [])
}

export function addToHistory(attempt: QuizAttempt): void {
  const history = getAttemptHistory(attempt.monumentSlug)
  safeSet(ATTEMPT_HISTORY_KEY(attempt.monumentSlug), [attempt, ...history])
  // Record the answered question IDs so future retakes get different questions
  if (attempt.status === 'completed') {
    recordUsedQuestions(attempt.monumentSlug, attempt.assignedQuestionIds)
  }
}

export function getBestAttempt(slug: string): QuizAttempt | null {
  const history = getAttemptHistory(slug).filter((a) => a.status === 'completed')
  if (history.length === 0) return null
  return history.reduce((best, a) => {
    if (a.score > best.score) return a
    if (a.score === best.score && a.correctCount > best.correctCount) return a
    return best
  })
}

// ── Cumulative score across attempts (max 1000) ────────────────────────────

export function getCumulativeScore(slug: string): number {
  const history = getAttemptHistory(slug).filter((a) => a.status === 'completed')
  return history.reduce((sum, a) => sum + a.score, 0)
}

export function getAttemptCount(slug: string): number {
  return getAttemptHistory(slug).filter((a) => a.status === 'completed').length
}

// ── Used question tracking for retake deduplication ───────────────────────

export function getUsedQuestionIds(slug: string): string[] {
  return safeGet<string[]>(USED_QUESTIONS_KEY(slug), [])
}

function recordUsedQuestions(slug: string, ids: string[]): void {
  const existing = new Set(getUsedQuestionIds(slug))
  ids.forEach((id) => existing.add(id))
  safeSet(USED_QUESTIONS_KEY(slug), Array.from(existing))
}

export function clearUsedQuestions(slug: string): void {
  safeRemove(USED_QUESTIONS_KEY(slug))
}

// ── Leaderboard ────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id: string
  playerId: string
  displayName: string
  monumentSlug: string
  score: number
  correctCount: number
  completionSeconds: number
  completedAt: string
}

const LEADERBOARD_KEY = (slug: string) => `modexx_leaderboard_${slug}`

export function getLeaderboard(slug: string): LeaderboardEntry[] {
  return safeGet<LeaderboardEntry[]>(LEADERBOARD_KEY(slug), [])
}

export function addLeaderboardEntry(entry: LeaderboardEntry): void {
  const board = getLeaderboard(entry.monumentSlug)
  // Keep cumulative best per player (cumulative score always goes up)
  const filtered = board.filter((e) => e.playerId !== entry.playerId)
  const existing = board.find((e) => e.playerId === entry.playerId)
  if (existing && existing.score >= entry.score) return
  safeSet(LEADERBOARD_KEY(entry.monumentSlug), [...filtered, entry])
}

export function getRankedLeaderboard(slug: string): (LeaderboardEntry & { rank: number })[] {
  const board = getLeaderboard(slug)
  const sorted = [...board].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount
    return a.completionSeconds - b.completionSeconds
  })
  let rank = 1
  return sorted.map((entry, index) => {
    if (index > 0) {
      const prev = sorted[index - 1]
      if (
        entry.score !== prev.score ||
        entry.correctCount !== prev.correctCount ||
        entry.completionSeconds !== prev.completionSeconds
      ) {
        rank = index + 1
      }
    }
    return { ...entry, rank }
  })
}
