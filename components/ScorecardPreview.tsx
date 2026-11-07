'use client'

import { useRef, useState, useEffect } from 'react'
import { X, Download, Share2, CheckCircle2 } from 'lucide-react'
import type { Monument } from '@/lib/data/index'

interface ScorecardPreviewProps {
  monument: Monument
  displayName: string
  score: number
  correctCount: number
  completionSeconds: number
  rank: number | null
  onClose: () => void
}

// Lagos governorship election: 6 February 2027 (INEC official date)
const LAGOS_ELECTION = new Date('2027-02-06T08:00:00')
// Presidential election: 16 January 2027
const PRESIDENTIAL_ELECTION = new Date('2027-01-16T08:00:00')

function getCountdown(date: Date): string {
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'Election Day!'
  const days = Math.floor(diff / 86400000)
  if (days > 365) {
    const y = Math.floor(days / 365)
    const d = days % 365
    return `${y}yr ${d}d`
  }
  return `${days} days`
}

// Per-monument config: who to show + what to say
const ELECTION_CONFIG = {
  tinubu: {
    portrait: '/President-Bola-Ahmed-Tinubu.jpg',
    name: 'President Bola Tinubu',
    cta: 'Vote Tinubu 2027',
    electionDate: PRESIDENTIAL_ELECTION,
    electionLabel: 'Presidential Election',
  },
  'sanwo-olu': {
    portrait: '/Obafemi-Hamzat.jpg',
    name: 'Dr. Obafemi Hamzat',
    cta: 'Vote Hamzat 2027',
    electionDate: LAGOS_ELECTION,
    electionLabel: 'Lagos Governorship Election',
  },
}

export default function ScorecardPreview({
  monument,
  displayName,
  score,
  correctCount,
  completionSeconds,
  rank,
  onClose,
}: ScorecardPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [, setTick] = useState(0)

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60
  const completedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  const electionCfg = ELECTION_CONFIG[monument.slug as keyof typeof ELECTION_CONFIG] ?? ELECTION_CONFIG.tinubu

  // Re-render every minute so countdown stays current
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const countdown = getCountdown(electionCfg.electionDate)

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const a = document.createElement('a')
      a.download = `modexx-${monument.slug}-scorecard.png`
      a.href = dataUrl
      a.click()
    } catch (e) {
      console.error('Scorecard download failed', e)
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    const text = [
      `I completed ${monument.name} on Modexx.`,
      `${correctCount}/10 correct · ${score}/1,000 pts${rank ? ` · #${rank}` : ''}`,
      `${electionCfg.cta} — ${countdown} to go.`,
      `modexx.app/monuments/${monument.slug}`,
    ].join('\n')

    if (navigator.share) {
      try { await navigator.share({ title: `My ${monument.name} result`, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="scorecard-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label="Scorecard preview">
      <div className="scorecard-modal">
        <div className="scorecard-modal-header">
          <h2>Your scorecard</h2>
          <button className="story-close" onClick={onClose} aria-label="Close scorecard"><X size={20} /></button>
        </div>

        <div className="scorecard-card-wrap">
          <div
            ref={cardRef}
            className="scorecard-card"
            style={{ '--accent': accentColor, '--accent-soft': monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8' } as React.CSSProperties}
          >
            {/* Top bar */}
            <div className="sc-top-bar" style={{ background: accentColor }}>
              <div className="sc-wordmark">mod<span>exx</span><span className="sc-dot">.</span></div>
              <div className="sc-apc-badge">APC</div>
            </div>

            {/* Monument identity — actual portrait photo */}
            <div className="sc-monument-section">
              <div className="sc-monument-art" style={{ background: monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8', overflow: 'hidden', borderRadius: '8px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={monument.slug === 'tinubu' ? '/tinubu.png' : '/sanwo-olu.png'}
                  alt={monument.subject}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                />
              </div>
              <div className="sc-monument-info">
                <p className="sc-challenge-name" style={{ color: accentColor }}>{monument.name}</p>
                <p className="sc-subject">{monument.subject}</p>
                <p className="sc-office">{monument.office}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="sc-divider" style={{ background: accentColor }} />

            {/* Score */}
            <div className="sc-score-section">
              <p className="sc-player-name">@{displayName}</p>
              <div className="sc-score-display">
                <span className="sc-score-number" style={{ color: accentColor }}>{score}</span>
                <span className="sc-score-denom">/ 1,000</span>
              </div>
              <p className="sc-score-label">points scored</p>
            </div>

            {/* Stats */}
            <div className="sc-stats-row">
              <div className="sc-stat">
                <span className="sc-stat-value" style={{ color: accentColor }}>{correctCount}/10</span>
                <span className="sc-stat-label">Correct</span>
              </div>
              <div className="sc-stat-divider" />
              <div className="sc-stat">
                <span className="sc-stat-value" style={{ color: accentColor }}>10/10</span>
                <span className="sc-stat-label">Explored</span>
              </div>
              <div className="sc-stat-divider" />
              <div className="sc-stat">
                <span className="sc-stat-value" style={{ color: accentColor }}>{mins}m {secs}s</span>
                <span className="sc-stat-label">Time</span>
              </div>
              {rank && (
                <>
                  <div className="sc-stat-divider" />
                  <div className="sc-stat">
                    <span className="sc-stat-value" style={{ color: accentColor }}>#{rank}</span>
                    <span className="sc-stat-label">Rank</span>
                  </div>
                </>
              )}
            </div>

            {/* Election call-to-action — portrait of candidate */}
            <div style={{
              margin: '14px 20px 0',
              padding: '14px',
              background: `${accentColor}10`,
              border: `1.5px solid ${accentColor}30`,
              borderRadius: '10px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              {/* Candidate photo */}
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${accentColor}`,
                background: '#f0f0f0',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={electionCfg.portrait}
                  alt={electionCfg.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: accentColor, margin: '0 0 2px' }}>
                  {electionCfg.cta}
                </p>
                <p style={{ fontSize: '11px', color: '#555', margin: '0 0 6px' }}>
                  {electionCfg.electionLabel}
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: accentColor, color: '#fff',
                  padding: '3px 10px', borderRadius: '20px',
                  fontSize: '11px', fontWeight: 700,
                }}>
                  ⏱ {countdown}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="sc-cta-section">
              <p className="sc-cta-text">Can you beat my score?</p>
              <p className="sc-url">modexx.app/monuments/{monument.slug}</p>
            </div>

            {/* Bottom bar */}
            <div className="sc-bottom-bar">
              <span className="sc-date">{completedDate}</span>
              <span className="sc-brand">Digital Monumental Experiences</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="scorecard-actions">
          <button className="button button-primary" onClick={handleDownload} disabled={downloading}>
            <Download size={16} /> {downloading ? 'Generating…' : 'Download PNG'}
          </button>
          <button className="button" style={{ background: 'var(--soft)' }} onClick={handleShare}>
            {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Share2 size={16} /> Share</>}
          </button>
        </div>
      </div>
    </div>
  )
}
