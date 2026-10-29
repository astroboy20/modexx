'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Trophy, Medal, RotateCcw } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { getRankedLeaderboard, type LeaderboardEntry } from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'

type RankedEntry = LeaderboardEntry & { rank: number }

export default function LeaderboardPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [entries, setEntries] = useState<RankedEntry[]>([])
  const [myEntry, setMyEntry] = useState<RankedEntry | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const m = getMonument(params.slug)
    if (!m) { router.replace('/monuments'); return }

    const ranked = getRankedLeaderboard(params.slug)
    const player = getClientSession()
    const mine = player ? ranked.find((e) => e.playerId === player.id) ?? null : null

    setMonument(m)
    setEntries(ranked.slice(0, 10))
    setMyEntry(mine)
    setReady(true)
  }, [params.slug, router])

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

  function getRankIcon(rank: number) {
    if (rank === 1) return <Medal size={18} style={{ color: '#f59e0b' }} aria-hidden="true" />
    if (rank === 2) return <Medal size={18} style={{ color: '#9ca3af' }} aria-hidden="true" />
    if (rank === 3) return <Medal size={18} style={{ color: '#b45309' }} aria-hidden="true" />
    return null
  }

  return (
    <main className="leaderboard-page">
      <header className="site-header detail-header">
        <Link href={`/monuments/${monument.slug}`} className="text-link">
          <ArrowLeft size={16} /> Monument
        </Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <span className="detail-index" style={{ color: accentColor }}>{monument.name}</span>
      </header>

      <div className="leaderboard-body">
        <div className="leaderboard-inner">
          <div className="leaderboard-hero">
            <Trophy size={40} style={{ color: accentColor }} aria-hidden="true" />
            <p className="eyebrow" style={{ color: accentColor, justifyContent: 'center', marginTop: 16 }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              Competition rankings
            </p>
            <h1 className="leaderboard-title">{monument.name}</h1>
            <p className="leaderboard-subtitle">{monument.subject} · {monument.scope}</p>
            <p className="leaderboard-demo-note">Local demo leaderboard — rankings reflect this device only.</p>
          </div>

          {myEntry && !entries.find((e) => e.playerId === myEntry.playerId) && (
            <div className="my-position-banner" style={{ borderColor: accentColor }}>
              <p className="my-pos-label" style={{ color: accentColor }}>Your position</p>
              <div className="leaderboard-row my-row">
                <span className="lb-rank">#{myEntry.rank}</span>
                <span className="lb-name">@{myEntry.displayName} <span className="lb-you">(you)</span></span>
                <span className="lb-score" style={{ color: accentColor }}>{myEntry.score}</span>
                <span className="lb-correct">{myEntry.correctCount}/10</span>
                <span className="lb-time">{formatTime(myEntry.completionSeconds)}</span>
              </div>
            </div>
          )}

          <div className="leaderboard-table">
            <div className="leaderboard-table-header">
              <span>Rank</span><span>Name</span><span>Score</span><span>Correct</span><span>Time</span>
            </div>
            {entries.length === 0 ? (
              <div className="leaderboard-empty">
                <p>No entries yet. Be the first to complete the challenge!</p>
                <Link href={`/challenge/${monument.slug}/instructions`} className="button button-primary" style={{ marginTop: 16 }}>
                  Start challenge <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              entries.map((entry) => {
                const isMe = player && entry.playerId === player.id
                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-row${isMe ? ' leaderboard-row--me' : ''}${entry.rank <= 3 ? ' leaderboard-row--top' : ''}`}
                    style={isMe ? { borderLeftColor: accentColor } : undefined}
                  >
                    <span className="lb-rank">{getRankIcon(entry.rank) ?? `#${entry.rank}`}</span>
                    <span className="lb-name">
                      @{entry.displayName}
                      {isMe && <span className="lb-you"> (you)</span>}
                    </span>
                    <span className="lb-score" style={{ color: accentColor }}>{entry.score}</span>
                    <span className="lb-correct">{entry.correctCount}/10</span>
                    <span className="lb-time">{formatTime(entry.completionSeconds)}</span>
                  </div>
                )
              })
            )}
          </div>

          <div className="leaderboard-cta-row">
            <Link href={`/challenge/${monument.slug}/instructions`} className="button button-dark">
              <RotateCcw size={16} /> Play challenge <ArrowRight size={16} />
            </Link>
            <Link href="/monuments" className="text-link">
              Explore more monuments <ArrowRight size={15} />
            </Link>
          </div>

          <div className="leaderboard-other">
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>Also available on Modexx</p>
            {monument.slug === 'tinubu' ? (
              <Link href="/leaderboard/sanwo-olu" className="text-link">Sanwo-Olu Challenge leaderboard <ArrowRight size={14} /></Link>
            ) : (
              <Link href="/leaderboard/tinubu" className="text-link">Tinubu Challenge leaderboard <ArrowRight size={14} /></Link>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
