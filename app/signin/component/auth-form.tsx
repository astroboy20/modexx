'use client'

import { useState,  } from 'react'
import {  useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, LogIn,  } from 'lucide-react'
import SignUpTab from './signup-tab'
import SignInTab from './signin-tab'



// ── Constants & helpers 

export const MAX_LEN = 20
const MIN_LEN = 2
const VALID_PATTERN = /^[a-zA-Z0-9_\-. ]+$/

export function validate(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Please enter a display name.'
  if (trimmed.length < MIN_LEN) return `Must be at least ${MIN_LEN} characters.`
  if (trimmed.length > MAX_LEN) return `Max ${MAX_LEN} characters.`
  if (!VALID_PATTERN.test(trimmed)) return 'Letters, numbers, spaces, _ - . only.'
  return ''
}








// ── Shell (tabs + layout) 

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

export default AuthForm