"use client"
import { AlertCircle, ArrowRight } from "lucide-react"
import Spinner from "./spinner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { MAX_LEN, validate } from "./auth-form"

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

export default SignInTab