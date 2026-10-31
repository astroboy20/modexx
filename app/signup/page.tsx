'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, User, AlertCircle } from 'lucide-react'
import { saveProfile, generateId } from '@/lib/storage'

function Spinner() {
  return <span className="spinner spinner--sm spinner--white" aria-hidden />
}

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/monuments'

  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)

  const MAX_LEN = 20
  const MIN_LEN = 2
  const VALID_PATTERN = /^[a-zA-Z0-9_\-. ]+$/

  function validate(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) return 'Please choose a display name.'
    if (trimmed.length < MIN_LEN) return `Must be at least ${MIN_LEN} characters.`
    if (trimmed.length > MAX_LEN) return `Max ${MAX_LEN} characters.`
    if (!VALID_PATTERN.test(trimmed)) return 'Letters, numbers, spaces, _ - . only.'
    return ''
  }

  const validationError = touched ? validate(displayName) : ''
  const isValid = !validate(displayName)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.slice(0, MAX_LEN + 1)
    setDisplayName(val)
    if (error) setError('')
  }

  function handleBlur() {
    setTouched(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    const err = validate(displayName)
    if (err) { setError(err); return }
    setLoading(true)
    const profile = {
      id: generateId(),
      displayName: displayName.trim(),
      createdAt: new Date().toISOString(),
    }
    saveProfile(profile)
    setTimeout(() => router.push(redirect), 300)
  }

  return (
    <main className="signup-page">
      <header className="site-header signup-header">
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <Link href={redirect} className="text-link" style={{ fontSize: 13 }}>
          <ArrowLeft size={15} /> Back
        </Link>
      </header>

      <div className="signup-body">
        <div className="signup-card">
          <div className="signup-icon"><User size={28} /></div>
          <p className="eyebrow" style={{ justifyContent: 'center' }}>
            <span className="eyebrow-line" /> Create your explorer profile
          </p>
          <h1 className="signup-title">Choose your<br /><em>display name.</em></h1>
          <p className="signup-lede">
            This is the name that will appear on the leaderboard and your scorecard.
            You can only have one active name per device.
          </p>

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
                  onBlur={handleBlur}
                  maxLength={MAX_LEN + 1}
                  className={`form-input${(error || validationError) ? ' form-input--error' : touched && isValid && displayName.trim() ? ' form-input--valid' : ''}`}
                  placeholder="e.g. Adaeze_K"
                  aria-describedby={(error || validationError) ? 'name-error' : 'name-hint'}
                  aria-invalid={!!(error || validationError)}
                />
                {displayName.length > 0 && (
                  <span className={`char-count${displayName.length > MAX_LEN ? ' char-count--over' : displayName.length >= MAX_LEN * 0.8 ? ' char-count--warn' : ''}`} aria-live="polite">
                    {displayName.length}/{MAX_LEN}
                  </span>
                )}
              </div>
              {(error || validationError) ? (
                <p id="name-error" className="form-error" role="alert">
                  <AlertCircle size={12} aria-hidden /> {error || validationError}
                </p>
              ) : (
                <p id="name-hint" className="form-hint">Letters, numbers, spaces, _ - . allowed · Max {MAX_LEN} characters</p>
              )}
            </div>

            <button
              type="submit"
              className="button button-primary signup-submit"
              disabled={loading}
            >
              {loading ? <><Spinner /> Creating profile…</> : <>Enter the experience <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="signup-note">
            This prototype stores your profile in your browser only.
            No personal data is sent to a server.
          </p>
        </div>
      </div>
    </main>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  )
}
