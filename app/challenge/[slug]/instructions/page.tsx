'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Lock, CheckCircle2, HelpCircle, Trophy } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { getExploredHotspots } from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'
import SiteHeader from '@/components/SiteHeader'

export default function InstructionsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [exploredCount, setExploredCount] = useState(0)
  const [ready, setReady] = useState(false)
  const [locked, setLocked] = useState(true)

  useEffect(() => {
    const m = getMonument(slug)
    if (!m) { router.replace('/monuments'); return }

    const player = getClientSession()
    if (player?.userRole === 'organizer') {
      router.replace(`/monuments/${slug}/explore`)
      return
    }

    const explored = getExploredHotspots(slug)
    const count = explored.length
    setMonument(m)
    setExploredCount(count)
    setLocked(count < m.hotspots.length)
    setReady(true)
  }, [slug, router])

  if (!ready || !monument) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner spinner--lg" aria-label="Loading…" />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const accentSoft = monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8'
  const total = monument.hotspots.length

  return (
    <main className="challenge-page">
      <SiteHeader
        className="detail-header"
        left={<Link href={`/monuments/${monument.slug}/explore`} className="text-link"><ArrowLeft size={16} /> Back to monument</Link>}
        right={<Link href={`/leaderboard/${monument.slug}`} className="text-link" style={{ fontSize: 12 }}>Leaderboard <ArrowRight size={14} /></Link>}
      />

      <div className="instructions-body">
        <div className="instructions-inner">
          <h1 className="instructions-title">{monument.name}</h1>

          <div className="instructions-status" style={{ borderColor: locked ? 'var(--line)' : accentColor, background: locked ? 'var(--soft)' : accentSoft }}>
            <div className="status-row">
              {locked
                ? <Lock size={20} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                : <CheckCircle2 size={20} style={{ color: accentColor, flexShrink: 0 }} />}
              <div>
                <p className="status-label">{locked ? 'Challenge locked' : 'Ready to begin'}</p>
                {locked && <p className="status-desc">{exploredCount} of {total} chapters explored</p>}
              </div>
            </div>
            {locked && (
              <div className="status-progress-bar">
                <div className="status-progress-fill" style={{ width: `${(exploredCount / total) * 100}%`, background: accentColor }} />
              </div>
            )}
          </div>

          <div className="instructions-rules">
            <div className="rules-grid">
              {[
                { icon: <HelpCircle size={22} style={{ color: accentColor }} />, title: '10 questions' },
                { icon: <Trophy size={22} style={{ color: accentColor }} />, title: '100 pts each' },
                { icon: <CheckCircle2 size={22} style={{ color: accentColor }} />, title: 'One submission' },
                { icon: <Trophy size={22} style={{ color: accentColor }} />, title: 'Leaderboard ranked' },
              ].map((rule) => (
                <div className="rule-card" key={rule.title}>
                  {rule.icon}
                  <h3>{rule.title}</h3>
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
              Leaderboard <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}
