import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

const COOKIE_NAME = 'modexx_session'

async function getSessionPlayer() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as { id: string; displayName: string }
  } catch {
    return null
  }
}

// ── GET /api/leaderboard?slug=tinubu 
// Returns the top 20 entries for a monument, ranked by score

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('leaderboard_best')
    .select('id, player_id, monument_slug, display_name, score, correct_count, completion_seconds, completed_at')
    .eq('monument_slug', slug)
    .order('score', { ascending: false })
    .order('correct_count', { ascending: false })
    .order('completion_seconds', { ascending: true })
    .limit(20)

  if (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json({ error: 'Failed to load leaderboard.' }, { status: 500 })
  }

  return NextResponse.json({ entries: data ?? [] })
}

// ── POST /api/leaderboard 
// Submits a quiz result and upserts the leaderboard entry

export async function POST(req: NextRequest) {
  const player = await getSessionPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: {
    monumentSlug?: string
    score?: number
    correctCount?: number
    completionSeconds?: number
    votersCardNumber?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { monumentSlug, score, correctCount, completionSeconds, votersCardNumber } = body

  // Validate — each attempt scores max 100 (10 questions × 10 pts)
  if (!monumentSlug) return NextResponse.json({ error: 'Missing monumentSlug.' }, { status: 400 })
  if (typeof score !== 'number' || score < 0 || score > 100)
    return NextResponse.json({ error: 'Invalid score.' }, { status: 400 })
  if (typeof correctCount !== 'number' || correctCount < 0 || correctCount > 10)
    return NextResponse.json({ error: 'Invalid correctCount.' }, { status: 400 })
  if (typeof completionSeconds !== 'number' || completionSeconds < 0)
    return NextResponse.json({ error: 'Invalid completionSeconds.' }, { status: 400 })

  // Fetch current cumulative score for this player+monument
  const { data: existing } = await supabaseAdmin
    .from('leaderboard_entries')
    .select('score, attempt_number')
    .eq('player_id', player.id)
    .eq('monument_slug', monumentSlug)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const previousTotal = existing?.score ?? 0
  const nextAttemptNumber = (existing?.attempt_number ?? 0) + 1

  // Guard: max 10 retakes, max cumulative 1000
  if (nextAttemptNumber > 10) {
    return NextResponse.json({ error: 'Maximum retakes reached.' }, { status: 400 })
  }

  const cumulativeScore = Math.min(previousTotal + score, 1000)

  // Always insert — the view handles best score display
  const { data: entry, error } = await supabaseAdmin
    .from('leaderboard_entries')
    .insert({
      player_id: player.id,
      monument_slug: monumentSlug,
      display_name: player.displayName,
      voters_card_number: votersCardNumber || null,
      score: cumulativeScore,          // cumulative total stored
      correct_count: correctCount,
      completion_seconds: completionSeconds,
      attempt_number: nextAttemptNumber,
    })
    .select('id')
    .single()

  if (error || !entry) {
    console.error('Leaderboard insert error:', error)
    return NextResponse.json({ error: 'Failed to save score.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, entryId: entry.id, cumulativeScore, attemptNumber: nextAttemptNumber })
}
