'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, User, LogIn } from 'lucide-react'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/monuments'

  const [tab, setTab] = useState<'signup' | 'signin'>('signup')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const MAX_LEN = 20

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplayName(e.target.value.slice(0, MAX_LEN + 1))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) { setError('Please enter a display name.'); return }
    if (name.length < 2) { setError('Must be at least 2 characters.'); return }
    if (name.length > MAX_LEN) { setError(`Max ${MAX_LEN} characters.`); return }
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(name)) { setError('Letters, numbers, spaces, _ - . only.'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: tab, displayName: name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }
      // Session cookie is set by the server — navigate to destination
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="signup-page">
      <header className="site-header signup-header">
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <Link href="/" className="text-link" style={{ fontSize: 13 }}>
          <ArrowLeft size={15} /> Home
        </Link>
      </header>

      <div className="signup-body">
        <div className="signup-card">
          <div className="signup-icon">
            {tab === 'signup' ? <User size={28} /> : <LogIn size={28} />}
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`}
              onClick={() => { setTab('signup'); setError('') }}
              type="button"
            >
              Create account
            </button>
            <button
              className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`}
              onClick={() => { setTab('signin'); setError('') }}
              type="button"
            >
              Sign in
            </button>
          </div>

          {tab === 'signup' ? (
            <>
              <h1 className="signup-title">Choose your<br /><em>display name.</em></h1>
              <p className="signup-lede">
                This name appears on the leaderboard and your scorecard. Pick something you&apos;re happy to be known by.
              </p>
            </>
          ) : (
            <>
              <h1 className="signup-title">Welcome<br /><em>back.</em></h1>
              <p className="signup-lede">
                Enter the display name you signed up with to restore your profile and scores.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate className="signup-form">
            <div className="form-field">
              <label htmlFor="displayName" className="form-label">Display name</label>
              <div className="form-input-wrap">
                <input
                  id="displayName"
                  type="text"
                  autoComplete="off"
                  autoFocus
                  value={displayName}
                  onChange={handleChange}
                  maxLength={MAX_LEN + 1}
                  className={`form-input${error ? ' form-input--error' : ''}`}
                  placeholder={tab === 'signup' ? 'e.g. Adaeze_K' : 'Your display name'}
                  aria-describedby={error ? 'name-error' : 'name-hint'}
                  aria-invalid={!!error}
                />
                {tab === 'signup' && (
                  <span className="char-count" aria-live="polite">
                    {displayName.length}/{MAX_LEN}
                  </span>
                )}
              </div>
              {error ? (
                <p id="name-error" className="form-error" role="alert">{error}</p>
              ) : (
                <p id="name-hint" className="form-hint">
                  {tab === 'signup'
                    ? 'Letters, numbers, spaces, _ - . allowed · Max 20 characters'
                    : 'Enter the exact name you used when you signed up'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="button button-primary signup-submit"
              disabled={loading || !displayName.trim()}
            >
              {loading
                ? tab === 'signup' ? 'Creating account…' : 'Signing in…'
                : tab === 'signup'
                ? <>Create account <ArrowRight size={16} /></>
                : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="auth-switch">
            {tab === 'signup' ? (
              <>Already have an account?{' '}
                <button className="auth-switch-btn" onClick={() => { setTab('signin'); setError('') }}>Sign in</button>
              </>
            ) : (
              <>New to Modexx?{' '}
                <button className="auth-switch-btn" onClick={() => { setTab('signup'); setError('') }}>Create account</button>
              </>
            )}
          </p>

          <p className="signup-note">
            Your display name is stored server-side for this prototype session.
            No passwords or personal data are collected.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  )
}
