import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

const COOKIE_NAME = 'modexx_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

interface SessionPayload {
  id: string
  displayName: string
}

function setCookie(res: NextResponse, payload: SessionPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  res.cookies.set(COOKIE_NAME, encoded, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
}

// ── POST /api/auth ─────────────────────────────────────────────────────────
// Body: { action: 'signup' | 'signin', displayName: string }

export async function POST(req: NextRequest) {
  let body: { action?: string; displayName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { action, displayName } = body
  const name = (displayName ?? '').trim()

  // Validate display name
  if (!name)
    return NextResponse.json({ error: 'Display name is required.' }, { status: 400 })
  if (name.length < 2)
    return NextResponse.json({ error: 'Must be at least 2 characters.' }, { status: 400 })
  if (name.length > 20)
    return NextResponse.json({ error: 'Max 20 characters.' }, { status: 400 })
  if (!/^[a-zA-Z0-9_\-. ]+$/.test(name))
    return NextResponse.json({ error: 'Letters, numbers, spaces, _ - . only.' }, { status: 400 })

  const nameKey = name.toLowerCase()

  // ── Sign up ──────────────────────────────────────────────────────────────
  if (action === 'signup') {
    // Check if name is taken
    const { data: existing } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('display_name_key', nameKey)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: 'That name is already taken. Try signing in instead.' },
        { status: 409 }
      )
    }

    // Create player
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .insert({ display_name: name, display_name_key: nameKey })
      .select('id, display_name')
      .single()

    if (error || !player) {
      console.error('Supabase insert error:', JSON.stringify(error))
      // Return the real error in dev so we can diagnose it
      const msg = process.env.NODE_ENV === 'development'
        ? `Supabase error: ${error?.message ?? 'unknown'} | code: ${error?.code ?? ''} | hint: ${error?.hint ?? ''}`
        : 'Failed to create account. Please try again.'
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const res = NextResponse.json({ ok: true, displayName: player.display_name })
    setCookie(res, { id: player.id, displayName: player.display_name })
    return res
  }

  // ── Sign in ──────────────────────────────────────────────────────────────
  if (action === 'signin') {
    const { data: player, error } = await supabaseAdmin
      .from('players')
      .select('id, display_name')
      .eq('display_name_key', nameKey)
      .maybeSingle()

    if (error || !player) {
      return NextResponse.json(
        { error: 'Name not found. Create an account first.' },
        { status: 404 }
      )
    }

    const res = NextResponse.json({ ok: true, displayName: player.display_name })
    setCookie(res, { id: player.id, displayName: player.display_name })
    return res
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}

// ── GET /api/auth — return current session ────────────────────────────────
export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return NextResponse.json({ user: null })
  try {
    const user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as SessionPayload
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}

// ── DELETE /api/auth — sign out ───────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
