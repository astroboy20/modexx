'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Trophy, Medal, RotateCcw } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { fetchLeaderboard, type RankedEntry } from '@/lib/leaderboard'
import { getClientSession } from '@/lib/session-client'

export default function LeaderboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [entries, setEntries] = useState<RankedEntry[]>([])
  const [myEntry, setMyEntry] = useState<RankedEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const m = getMonument(slug)
    if (!m) { router.replace('/monuments'); return }
    setMonument(m)
    setReady(true)

    fetchLeaderboard(slug).then((ranked) => {
      const player = getClientSession()
      const mine = player ? ranked.find((e) => e.player_id === player.id) ?? null : null
      setEntries(ranked.slice(0, 10))
      setMyEntry(mine)
      setLoading(false)
    })
  }, [slug, router])

  if (!ready || !monument) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</p></div>
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const player = getClientSession()

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  function getRankBadge(rank: number) {
    if (rank === 1) return <Medal size={20} style={{ color: '#f59e0b' }} />
    if (rank === 2) return <Medal size={20} style={{ color: '#9ca3af' }} />
    if (rank === 3) return <Medal size={20} style={{ color: '#b45309' }} />
    return <span className="lb-rank-num">#{rank}</span>
  }

  function renderRow(entry: RankedEntry, isMe: boolean) {
    return (
      <div
        key={entry.id}
        className={`lb-row${isMe ? ' lb-row--me' : ''}${entry.rank <= 3 ? ' lb-row--top' : ''}`}
        style={isMe ? { borderLeftColor: accentColor } : undefined}
      >
        <span className="lb-col-rank">{getRankBadge(entry.rank)}</span>
        <span className="lb-col-name">
          <span className="lb-display-name">@{entry.display_name}</span>
          {isMe && <span className="lb-you-tag">you</span>}
        </span>
        <span className="lb-col-score" style={{ color: accentColor }}>{entry.score}</span>
        <span className="lb-col-correct">{entry.correct_count}/10</span>
        <span className="lb-col-time">{formatTime(entry.completion_seconds)}</span>
      </div>
    )
  }

  return (
    <main className="leaderboard-page">
      {/* Header — just back + wordmark, no cramped monument name */}
      <header className="site-header lb-header">
        <Link href={`/monuments/${monument.slug}`} className="text-link">
          <ArrowLeft size={16} /> Monument
        </Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <span style={{ width: 90 }} />
      </header>

      <div className="leaderboard-body">
        <div className="leaderboard-inner">

          {/* Hero */}
          <div className="leaderboard-hero">
            <Trophy size={36} style={{ color: accentColor }} />
            <p className="eyebrow lb-eyebrow" style={{ color: accentColor }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              Competition rankings
            </p>
            <h1 className="leaderboard-title">{monument.name}</h1>
            <p className="leaderboard-subtitle">
              <span>{monument.subject}</span>
              <span className="lb-subtitle-sep">·</span>
              <span>{monument.scope}</span>
            </p>
          </div>

          {/* Your position banner (only if outside top 10) */}
          {myEntry && !entries.find((e) => e.player_id === myEntry.player_id) && (
            <div className="lb-my-banner" style={{ borderColor: accentColor }}>
              <p className="lb-my-label" style={{ color: accentColor }}>Your position</p>
              {renderRow(myEntry, true)}
            </div>
          )}

          {/* Table */}
          <div className="lb-table-wrap">
            <div className="lb-table">
              <div className="lb-table-head">
                <span className="lb-col-rank">Rank</span>
                <span className="lb-col-name">Name</span>
                <span className="lb-col-score">Score</span>
                <span className="lb-col-correct">Correct</span>
                <span className="lb-col-time">Time</span>
              </div>

              {loading ? (
                <div className="lb-empty"><p>Loading rankings…</p></div>
              ) : entries.length === 0 ? (
                <div className="lb-empty">
                  <p>No entries yet. Be the first!</p>
                  <Link href={`/challenge/${monument.slug}/instructions`} className="button button-primary" style={{ marginTop: 16 }}>
                    Start challenge <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                entries.map((entry) => renderRow(entry, !!(player && entry.player_id === player.id)))
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="lb-cta-row">
            <Link href={`/challenge/${monument.slug}/instructions`} className="button button-dark">
              <RotateCcw size={15} /> Play again <ArrowRight size={15} />
            </Link>
            <Link href="/monuments" className="text-link">
              Explore more <ArrowRight size={14} />
            </Link>
          </div>

          {/* Cross-link */}
          <div className="lb-other">
            <p className="lb-other-label">Also available on Modexx</p>
            {monument.slug === 'tinubu'
              ? <Link href="/leaderboard/sanwo-olu" className="text-link">Sanwo-Olu Challenge leaderboard <ArrowRight size={14} /></Link>
              : <Link href="/leaderboard/tinubu" className="text-link">Tinubu Challenge leaderboard <ArrowRight size={14} /></Link>}
          </div>

        </div>
      </div>
    </main>
  )
}
