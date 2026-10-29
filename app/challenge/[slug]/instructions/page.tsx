'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, HelpCircle, Star, Trophy } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { getProfile, getExploredHotspots, saveProfile, generateId } from '@/lib/storage'

function ensureSession(): void {
  if (typeof window === 'undefined') return
  if (!getProfile()) {
    saveProfile({ id: generateId(), displayName: 'Explorer', createdAt: new Date().toISOString() })
  }
}

export default function InstructionsPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [exploredCount, setExploredCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(true)

  useEffect(() => {
    ensureSession()
    const m = getMonument(params.slug)
    if (!m) { router.replace('/monuments'); return }
    const explored = getExploredHotspots(params.slug)
    const count = explored.length
    setMonument(m)
    setExploredCount(count)
    setLocked(count < m.hotspots.length)
    setReady(true)
  }, [params.slug, router])

  if (!ready || !monument) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</p></div>
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const accentSoft = monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8'
  const total = monument.hotspots.length

  return (
    <main className="challenge-page">
      <header className="site-header detail-header">
        <Link href={`/monuments/${monument.slug}/explore`} className="text-link">
          <ArrowLeft size={16} /> Back to monument
        </Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <Link href={`/leaderboard/${monument.slug}`} className="text-link" style={{ fontSize: 12 }}>
          Leaderboard <ArrowRight size={14} />
        </Link>
      </header>

      <div className="instructions-body">
        <div className="instructions-inner">
          <p className="eyebrow" style={{ color: accentColor }}>
            <span className="eyebrow-line" style={{ background: accentColor }} />
            {monument.subject}
          </p>
          <h1 className="instructions-title">{monument.name}</h1>
          <p className="instructions-subtitle">The knowledge challenge</p>

          <div className="instructions-status" style={{ borderColor: locked ? 'var(--line)' : accentColor, background: locked ? 'var(--soft)' : accentSoft }}>
            <div className="status-row">
              {locked
                ? <Lock size={20} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                : <CheckCircle2 size={20} style={{ color: accentColor, flexShrink: 0 }} />}
              <div>
                <p className="status-label">{locked ? 'Challenge locked' : 'Challenge unlocked!'}</p>
                <p className="status-desc">
                  {locked
                    ? `Explore all ${total} chapters to unlock. You have explored ${exploredCount} of ${total}.`
                    : `You have explored all ${total} chapters. You are ready to begin.`}
                </p>
              </div>
            </div>
            {locked && (
              <div className="status-progress-bar">
                <div className="status-progress-fill" style={{ width: `${(exploredCount / total) * 100}%`, background: accentColor }} />
              </div>
            )}
          </div>

          <div className="instructions-rules">
            <h2 className="instructions-rules-title">How the challenge works</h2>
            <div className="rules-grid">
              {[
                { icon: <HelpCircle size={22} style={{ color: accentColor }} />, title: '10 questions', text: "Each challenge draws 10 distinct questions from the monument's question bank." },
                { icon: <Star size={22} style={{ color: accentColor }} />, title: '100 pts per answer', text: 'Each correct answer earns 100 points. Maximum score is 1,000 points.' },
                { icon: <CheckCircle2 size={22} style={{ color: accentColor }} />, title: 'One submission', text: 'Once you submit, answers are locked. Review your results and explanations afterwards.' },
                { icon: <Trophy size={22} style={{ color: accentColor }} />, title: 'Leaderboard', text: 'Your best score enters the independent leaderboard for this challenge only.' },
              ].map((rule) => (
                <div className="rule-card" key={rule.title}>
                  {rule.icon}
                  <h3>{rule.title}</h3>
                  <p>{rule.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="score-table">
            <p className="score-table-label">Score breakdown</p>
            <div className="score-table-grid">
              {[10, 9, 8, 7, 6, 5].map((n) => (
                <div key={n} className="score-row">
                  <span>{n}/10 correct</span>
                  <span style={{ color: accentColor, fontWeight: 700 }}>{n * 100} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="instructions-cta">
            {locked ? (
              <Link href={`/monuments/${monument.slug}/explore`} className="button button-dark">
                Continue exploring <ArrowRight size={16} />
              </Link>
            ) : (
              <Link href={`/challenge/${monument.slug}/quiz`} className="button button-primary">
                Start the challenge <ArrowRight size={16} />
              </Link>
            )}
            <Link href={`/leaderboard/${monument.slug}`} className="text-link">
              View leaderboard <ArrowRight size={15} />
            </Link>
          </div>

          <p className="instructions-demo-note">
            Frontend prototype — scoring is calculated locally in your browser.
          </p>
        </div>
      </div>
    </main>
  )
}
