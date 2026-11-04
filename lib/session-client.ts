'use client'


export interface SessionUser {
  id: string
  displayName: string
  userRole: 'participant' | 'organizer'
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
