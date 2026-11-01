"use client"
import { AlertCircle, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Spinner from "./spinner"
import { validate, MAX_LEN } from "./auth-form"

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

export default SignUpTab