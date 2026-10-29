'use client'

// Leaderboard data fetching — reads from Supabase via API route
// Falls back to empty array if the API is unavailable

export interface LeaderboardEntry {
  id: string
  player_id: string
  monument_slug: string
  display_name: string
  score: number
  correct_count: number
  completion_seconds: number
  completed_at: string
}

export type RankedEntry = LeaderboardEntry & { rank: number }

export async function fetchLeaderboard(slug: string): Promise<RankedEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?slug=${slug}`, { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return rankEntries(data.entries ?? [])
  } catch {
    return []
  }
}

export async function submitScore(payload: {
  monumentSlug: string
  score: number
  correctCount: number
  completionSeconds: number
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Network error.' }
  }
}

function rankEntries(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count
    return a.completion_seconds - b.completion_seconds
  })

  let rank = 1
  return sorted.map((entry, index) => {
    if (index > 0) {
      const prev = sorted[index - 1]
      if (
        entry.score !== prev.score ||
        entry.correct_count !== prev.correct_count ||
        entry.completion_seconds !== prev.completion_seconds
      ) {
        rank = index + 1
      }
    }
    return { ...entry, rank }
  })
}
