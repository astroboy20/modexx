import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// ── In-memory user store (frontend-only prototype) ─────────────────────────
// In production this would be a database. For now it's a module-level Map
// that persists for the lifetime of the dev server process.

interface User {
  id: string
  displayName: string
  createdAt: string
}

const users = new Map<string, User>() // displayName (lowercase) -> User

function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

const COOKIE_NAME = 'modexx_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function setCookie(res: NextResponse, user: User) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, displayName: user.displayName })).toString('base64')
  res.cookies.set(COOKIE_NAME, payload, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    // secure: true — enable in production
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

  // Validate
  if (!name) return NextResponse.json({ error: 'Display name is required.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ error: 'Must be at least 2 characters.' }, { status: 400 })
  if (name.length > 20) return NextResponse.json({ error: 'Max 20 characters.' }, { status: 400 })
  if (!/^[a-zA-Z0-9_\-. ]+$/.test(name)) return NextResponse.json({ error: 'Letters, numbers, spaces, _ - . only.' }, { status: 400 })

  const key = name.toLowerCase()

  if (action === 'signup') {
    if (users.has(key)) {
      return NextResponse.json({ error: 'That name is already taken. Try signing in instead.' }, { status: 409 })
    }
    const user: User = { id: generateId(), displayName: name, createdAt: new Date().toISOString() }
    users.set(key, user)
    const res = NextResponse.json({ ok: true, displayName: user.displayName })
    setCookie(res, user)
    return res
  }

  if (action === 'signin') {
    const user = users.get(key)
    if (!user) {
      return NextResponse.json({ error: 'Name not found. Create an account first.' }, { status: 404 })
    }
    const res = NextResponse.json({ ok: true, displayName: user.displayName })
    setCookie(res, user)
    return res
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}

// ── GET /api/auth — return current session user ────────────────────────────
export async function GET() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return NextResponse.json({ user: null })
  try {
    const user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))
    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ user: null })
  }
}

// ── DELETE /api/auth — sign out ────────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
