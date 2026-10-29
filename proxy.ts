import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'modexx_session'

const PROTECTED_PREFIXES = [
  '/monuments',
  '/challenge',
  '/leaderboard',
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const session = req.cookies.get(COOKIE_NAME)?.value
  if (!session) {
    const signinUrl = req.nextUrl.clone()
    signinUrl.pathname = '/signin'
    signinUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signinUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/monuments/:path*', '/challenge/:path*', '/leaderboard/:path*'],
}
