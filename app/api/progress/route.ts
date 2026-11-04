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

// ── GET /api/progress?monumentSlug=tinubu
// Returns player's scanned hotspots for a monument

export async function GET(req: NextRequest) {
  const player = await getSessionPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const monumentSlug = req.nextUrl.searchParams.get('monumentSlug')
  if (!monumentSlug) {
    return NextResponse.json({ error: 'Missing monumentSlug.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('exploration_progress')
    .select('hotspot_id, scanned_at')
    .eq('player_id', player.id)
    .eq('monument_slug', monumentSlug)
    .order('scanned_at', { ascending: true })

  if (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json({ error: 'Failed to load progress.' }, { status: 500 })
  }

  return NextResponse.json({ progress: data || [] })
}

// ── POST /api/progress
// Records a scanned hotspot

export async function POST(req: NextRequest) {
  const player = await getSessionPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: {
    monumentSlug?: string
    hotspotId?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { monumentSlug, hotspotId } = body

  if (!monumentSlug || !hotspotId) {
    return NextResponse.json({ error: 'Missing monumentSlug or hotspotId.' }, { status: 400 })
  }

  // Upsert - won't create duplicates due to unique constraint
  const { data, error } = await supabaseAdmin
    .from('exploration_progress')
    .upsert({
      player_id: player.id,
      monument_slug: monumentSlug,
      hotspot_id: hotspotId,
    }, {
      onConflict: 'player_id,monument_slug,hotspot_id'
    })
    .select('id')
    .single()

  if (error && error.code !== '23505') { // Ignore duplicate key errors
    console.error('Progress insert error:', error)
    return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, progress: data })
}
