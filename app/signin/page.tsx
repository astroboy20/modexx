'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, User, LogIn, AlertCircle } from 'lucide-react'

// ── Constants & helpers ────────────────────────────────────────────────────

const MAX_LEN = 20
const MIN_LEN = 2
const VALID_PATTERN = /^[a-zA-Z0-9_\-. ]+$/

function validate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Please enter a display name.'
  if (trimmed.length < MIN_LEN) return `Must be at least ${MIN_LEN} characters.`
  if (trimmed.length > MAX_LEN) return `Max ${MAX_LEN} characters.`
  if (!VALID_PATTERN.test(trimmed)) return 'Letters, numbers, spaces, _ - . only.'
  return ''
}

// ── Spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return <span className="spinner spinner--sm spinner--white" aria-hidden />
}

// ── Sign-up tab ────────────────────────────────────────────────────────────

function SignUpTab({ redirect }: { redirect: string }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const inlineError = touched ? validate(displayName) : ''
  const isValid = !!displayName.trim() && !validate(displayName)
  const shownError = error || inlineError

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplayName(e.target.value.slice(0, MAX_LEN + 1))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const err = validate(displayName)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', displayName: displayName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="signup-form">
      <div className="form-field">
        <label htmlFor="su-displayName" className="form-label">Display name</label>
        <div className="form-input-wrap">
          <input
            id="su-displayName"
            type="text"
            autoComplete="off"
            autoFocus
            value={displayName}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            maxLength={MAX_LEN + 1}
            className={`form-input${shownError ? ' form-input--error' : isValid ? ' form-input--valid' : ''}`}
            placeholder="e.g. Adaeze_K"
            aria-describedby={shownError ? 'su-name-error' : 'su-name-hint'}
            aria-invalid={!!shownError}
          />
          {displayName.length > 0 && (
            <span
              className={`char-count${displayName.length > MAX_LEN ? ' char-count--over' : displayName.length >= MAX_LEN * 0.8 ? ' char-count--warn' : ''}`}
              aria-live="polite"
            >
              {displayName.length}/{MAX_LEN}
            </span>
          )}
        </div>
        {shownError ? (
          <p id="su-name-error" className="form-error" role="alert">
            <AlertCircle size={12} aria-hidden /> {shownError}
          </p>
        ) : (
          <p id="su-name-hint" className="form-hint">Letters, numbers, spaces, _ - . allowed · Max {MAX_LEN} characters</p>
        )}
      </div>

      <button type="submit" className="button button-primary signup-submit" disabled={loading}>
        {loading ? <><Spinner /> Creating account…</> : <>Create account <ArrowRight size={16} /></>}
      </button>
    </form>
  )
}

// ── Sign-in tab ────────────────────────────────────────────────────────────

function SignInTab({ redirect }: { redirect: string }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const inlineError = touched ? validate(displayName) : ''
  const isValid = !!displayName.trim() && !validate(displayName)
  const shownError = error || inlineError

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setDisplayName(e.target.value.slice(0, MAX_LEN + 1))
    if (error) setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const err = validate(displayName)
    if (err) { setError(err); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signin', displayName: displayName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return }
      router.push(redirect)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="signup-form">
      <div className="form-field">
        <label htmlFor="si-displayName" className="form-label">Display name</label>
        <div className="form-input-wrap">
          <input
            id="si-displayName"
            type="text"
            autoComplete="off"
            autoFocus
            value={displayName}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            maxLength={MAX_LEN + 1}
            className={`form-input${shownError ? ' form-input--error' : isValid ? ' form-input--valid' : ''}`}
            placeholder="Your display name"
            aria-describedby={shownError ? 'si-name-error' : 'si-name-hint'}
            aria-invalid={!!shownError}
          />
        </div>
        {shownError ? (
          <p id="si-name-error" className="form-error" role="alert">
            <AlertCircle size={12} aria-hidden /> {shownError}
          </p>
        ) : (
          <p id="si-name-hint" className="form-hint">Enter the exact name you used when you signed up</p>
        )}
      </div>

      <button type="submit" className="button button-primary signup-submit" disabled={loading}>
        {loading ? <><Spinner /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
      </button>
    </form>
  )
}

// ── Shell (tabs + layout) ──────────────────────────────────────────────────

function AuthForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/monuments'
  const [tab, setTab] = useState<'signup' | 'signin'>('signup')

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
            {tab === 'signup' ? <User size={26} /> : <LogIn size={26} />}
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab${tab === 'signup' ? ' auth-tab--active' : ''}`}
              onClick={() => setTab('signup')}
              type="button"
            >
              Create account
            </button>
            <button
              className={`auth-tab${tab === 'signin' ? ' auth-tab--active' : ''}`}
              onClick={() => setTab('signin')}
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
              <SignUpTab redirect={redirect} />
            </>
          ) : (
            <>
              <h1 className="signup-title">Welcome<br /><em>back.</em></h1>
              <p className="signup-lede">
                Enter the display name you signed up with to restore your profile and scores.
              </p>
              <SignInTab redirect={redirect} />
            </>
          )}

          <p className="auth-switch">
            {tab === 'signup' ? (
              <>Already have an account?{' '}
                <button className="auth-switch-btn" type="button" onClick={() => setTab('signin')}>Sign in</button>
              </>
            ) : (
              <>New to Modexx?{' '}
                <button className="auth-switch-btn" type="button" onClick={() => setTab('signup')}>Create account</button>
              </>
            )}
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
