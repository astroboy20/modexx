import { cookies } from 'next/headers'

const COOKIE_NAME = 'modexx_session'

export interface SessionUser {
  id: string
  displayName: string
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(COOKIE_NAME)?.value
    if (!raw) return null
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as SessionUser
  } catch {
    return null
  }
}
