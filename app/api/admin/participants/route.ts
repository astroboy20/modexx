import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

const COOKIE_NAME = 'modexx_session'

async function getSessionPlayer() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as {
      id: string
      displayName: string
      userRole: 'participant' | 'organizer'
    }
  } catch { return null }
}

// GET /api/admin/participants — organizer only
// Returns all leaderboard entries joined with player voter card numbers
export async function GET() {
  const player = await getSessionPlayer()
  if (!player) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  if (player.userRole !== 'organizer') return NextResponse.json({ error: 'Access denied.' }, { status: 403 })

  // Get all leaderboard entries with voters card numbers
  const { data: entries, error } = await supabaseAdmin
    .from('leaderboard_entries')
    .select(`
      id,
      display_name,
      monument_slug,
      score,
      correct_count,
      completion_seconds,
      completed_at,
      voters_card_number
    `)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Admin participants fetch error:', error)
    return NextResponse.json({ error: 'Failed to load participants.' }, { status: 500 })
  }

  // Also get players who registered but haven't completed
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, display_name, user_role, created_at')
    .eq('user_role', 'participant')
    .order('created_at', { ascending: false })

  // Merge: entries are the primary source, players fill in anyone who hasn't submitted yet
  const entryPlayerIds = new Set((entries || []).map(e => e.display_name.toLowerCase()))
  const unsubmittedPlayers = (players || [])
    .filter(p => !entryPlayerIds.has(p.display_name.toLowerCase()))
    .map(p => ({
      id: p.id,
      display_name: p.display_name,
      monument_slug: null,
      score: null,
      correct_count: null,
      completion_seconds: null,
      completed_at: null,
      voters_card_number: null,
      created_at: p.created_at,
    }))

  const allParticipants = [
    ...(entries || []),
    ...unsubmittedPlayers,
  ]

  return NextResponse.json({ participants: allParticipants })
}
