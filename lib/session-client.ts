'use client'

// Client-side session reader — parses the modexx_session cookie
// that the server sets. Used in client components that need the user.

export interface SessionUser {
  id: string
  displayName: string
}

export function getClientSession(): SessionUser | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)modexx_session=([^;]+)/)
  if (!match) return null
  try {
    return JSON.parse(atob(decodeURIComponent(match[1]))) as SessionUser
  } catch {
    return null
  }
}
