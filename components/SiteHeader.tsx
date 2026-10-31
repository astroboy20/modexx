'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { getClientSession } from '@/lib/session-client'

interface SiteHeaderProps {
  /** Content to render on the left side (e.g. a back link) */
  left?: React.ReactNode
  /** Content to render on the right side — if omitted, shows user pill + sign-out */
  right?: React.ReactNode
  /** Extra class names on the <header> */
  className?: string
}

export default function SiteHeader({ left, right, className = '' }: SiteHeaderProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    const session = getClientSession()
    setDisplayName(session?.displayName ?? null)
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await fetch('/api/auth', { method: 'DELETE' })
    router.refresh()
    router.push('/')
  }

  return (
    <header className={`site-header ${className}`.trim()}>
      <div className="sh-left">{left}</div>

      <Link href="/" className="wordmark sh-wordmark">
        <span>mod</span>exx<span className="wordmark-dot">.</span>
      </Link>

      <div className="sh-right">
        {right !== undefined ? right : (
          displayName ? (
            <div className="sh-user-group">
              <div className="sh-user-pill">
                <User size={12} aria-hidden />
                <span>@{displayName}</span>
              </div>
              <button
                className="sh-signout-btn"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out"
                title="Sign out"
              >
                {signingOut
                  ? <span className="spinner spinner--sm" aria-hidden />
                  : <LogOut size={15} aria-hidden />}
              </button>
            </div>
          ) : (
            <Link href="/signin" className="sh-signin-link">Sign in</Link>
          )
        )}
      </div>
    </header>
  )
}
