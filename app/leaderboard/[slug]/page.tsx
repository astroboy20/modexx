'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Trophy, Medal, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { fetchLeaderboard, type RankedEntry } from '@/lib/leaderboard'
import { getClientSession } from '@/lib/session-client'
import SiteHeader from '@/components/SiteHeader'

// ── Vote config — monuments with an upcoming electoral candidate ──────────
// Only include monuments where the subject is actively running for office.
// Oyebanji's election (Jun 2026) is past; his leaderboard cross-promotes Tinubu.
interface VoteConfig {
  candidateName: string
  electionLabel: string
  electionDate: string
  portrait: string
  ctaLabel: string
}

const VOTE_CONFIG: Record<string, VoteConfig> = {
  tinubu: {
    candidateName: 'Bola Ahmed Tinubu',
    electionLabel: 'Presidential Election · 16 January 2027',
    electionDate: '2027-01-16',
    portrait: '/tinubu-president.jpg',
    ctaLabel: 'Vote Tinubu · January 2027',
  },
  hamzat: {
    candidateName: 'Dr. Kadri Obafemi Hamzat',
    electionLabel: 'Lagos Governorship · 6 February 2027',
    electionDate: '2027-02-06',
    portrait: '/hamzat-potrait.png',
    ctaLabel: 'Vote Hamzat · February 2027',
  },
  // oyebanji: election was June 2026 (past) — no vote card shown
  // ekiti-logo: not a candidate monument
}

// For non-electoral monuments (oyebanji, ekiti-logo) show a Tinubu cross-promo instead
const TINUBU_PROMO: VoteConfig = {
  candidateName: 'Bola Ahmed Tinubu',
  electionLabel: 'Presidential Election · 16 January 2027',
  electionDate: '2027-01-16',
  portrait: '/tinubu-president.jpg',
  ctaLabel: 'Also: Vote Tinubu · January 2027',
}

function daysUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now()
  if (diff <= 0) return 'Election Day!'
  const d = Math.floor(diff / 86400000)
  return `${d} day${d !== 1 ? 's' : ''} to go`
}

// ── Vote card — no external link button, just candidate info + countdown ──
function VoteCard({ config, accentColor }: { config: VoteConfig; accentColor: string }) {
  const countdown = daysUntil(config.electionDate)
  const isPast = new Date(config.electionDate).getTime() < Date.now()
  if (isPast) return null

  return (
    <div
      style={{
        marginTop: 24,
        padding: '16px 18px',
        borderRadius: 14,
        border: `1.5px solid ${accentColor}35`,
        background: `${accentColor}08`,
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}
    >
      {/* Portrait */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: `2px solid ${accentColor}`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={config.portrait}
          alt={config.candidateName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: accentColor }}>
          {config.ctaLabel}
        </p>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--muted)' }}>
          {config.electionLabel}
        </p>
        <span
          style={{
            display: 'inline-block',
            background: accentColor,
            color: '#fff',
            padding: '3px 10px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          ⏱ {countdown}
        </span>
      </div>
    </div>
  )
}

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

    const player = getClientSession()

    async function loadLeaderboard() {
      const ranked = await fetchLeaderboard(slug)
      const mine = player ? ranked.find((e) => e.player_id === player.id) ?? null : null
      setEntries(ranked.slice(0, 10))
      setMyEntry(mine)
      setLoading(false)
    }

    loadLeaderboard().catch(() => {
      toast.error('Failed to load rankings. Please refresh.')
      setLoading(false)
    })

    // Real-time leaderboard updates via WebSocket
    if (player) {
      let ws: ReturnType<typeof import('@/lib/websocket').getWebSocketClient> | null = null
      let isMounted = true

      async function setupWS() {
        const { getWebSocketClient } = await import('@/lib/websocket')
        ws = getWebSocketClient(player!.id, player!.displayName)
        await ws.connect().catch(() => {})
        if (!isMounted) return

        ws.onLeaderboardUpdate((data) => {
          if (!isMounted || data.monumentSlug !== slug) return
          fetchLeaderboard(slug).then(ranked => {
            if (!isMounted) return
            const mine = player ? ranked.find((e) => e.player_id === player.id) ?? null : null
            setEntries(ranked.slice(0, 10))
            setMyEntry(mine)
          }).catch(() => {})
        })
      }

      setupWS()

      return () => {
        isMounted = false
        if (ws) ws.off('leaderboard:newEntry')
      }
    }
  }, [slug, router])

  if (!ready || !monument) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner spinner--lg" aria-label="Loading…" />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const player = getClientSession()
  // Electoral monuments get their own vote card; others cross-promo Tinubu
  const voteConfig = VOTE_CONFIG[monument.slug] ?? (['tinubu', 'hamzat'].includes(monument.slug) ? null : TINUBU_PROMO)

  // Other monuments to cross-link (exclude current)
  const crossLinks: { slug: string; label: string }[] = [
    { slug: 'tinubu',    label: 'Tinubu Challenge' },
    { slug: 'hamzat',    label: 'Hamzat Challenge' },
    { slug: 'oyebanji',  label: 'Oyebanji Challenge' },
  ].filter((x) => x.slug !== slug)

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
      <SiteHeader
        className="lb-header"
        left={<Link href={`/monuments/${monument.slug}`} className="text-link"><ArrowLeft size={16} /> Monument</Link>}
      />

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
                <span className="lb-col-name">Player</span>
                <span className="lb-col-score">Score</span>
                <span className="lb-col-correct">Correct</span>
                <span className="lb-col-time">Time</span>
              </div>

              {loading ? (
                <div className="lb-empty">
                  <span className="spinner spinner--md" style={{ color: accentColor }} aria-label="Loading rankings…" />
                </div>
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

          {/* Vote card — only for electoral monuments */}
          {voteConfig && <VoteCard config={voteConfig} accentColor={accentColor} />}

          {/* CTAs */}
          <div className="lb-cta-row">
            <Link href={`/challenge/${monument.slug}/instructions`} className="button button-dark">
              <RotateCcw size={15} /> Play again <ArrowRight size={15} />
            </Link>
            <Link href="/monuments" className="text-link">
              Explore more <ArrowRight size={14} />
            </Link>
          </div>

          {/* Cross-links to other challenges */}
          <div className="lb-other">
            <p className="lb-other-label">Also on Modexx</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {crossLinks.map((x) => (
                <Link key={x.slug} href={`/leaderboard/${x.slug}`} className="text-link">
                  {x.label} leaderboard <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
