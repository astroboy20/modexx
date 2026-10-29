'use client'

import { useRef, useState } from 'react'
import { X, Download, Share2, Copy, CheckCircle2 } from 'lucide-react'
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
  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60
  const completedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.download = `modexx-${monument.slug}-scorecard.png`
      link.href = dataUrl
      link.click()
    } catch (e) {
      console.error('Scorecard download failed', e)
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    const text = `I completed ${monument.name} on Modexx.\n10 hotspots explored. ${correctCount}/10 correct. ${score}/1,000 points.${rank ? ` Ranked #${rank}.` : ''}\nCan you beat my score?\nmodexx.app/monuments/${monument.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: `My ${monument.name} result`, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="scorecard-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Scorecard preview">
      <div className="scorecard-modal">
        <div className="scorecard-modal-header">
          <h2>Your scorecard</h2>
          <button className="story-close" onClick={onClose} aria-label="Close scorecard"><X size={20} /></button>
        </div>

        {/* The actual card — designed as a 4:5 flyer */}
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

            {/* Monument identity */}
            <div className="sc-monument-section">
              <div className="sc-monument-art" style={{ background: monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8' }}>
                <div className="sc-figure" style={{ background: accentColor }} />
              </div>
              <div className="sc-monument-info">
                <p className="sc-challenge-name" style={{ color: accentColor }}>{monument.name}</p>
                <p className="sc-subject">{monument.subject}</p>
                <p className="sc-office">{monument.office}</p>
              </div>
            </div>

            {/* Divider */}
            <div className="sc-divider" style={{ background: accentColor }} />

            {/* Score hero */}
            <div className="sc-score-section">
              <p className="sc-player-name">@{displayName}</p>
              <div className="sc-score-display">
                <span className="sc-score-number" style={{ color: accentColor }}>{score}</span>
                <span className="sc-score-denom">/ 1,000</span>
              </div>
              <p className="sc-score-label">points scored</p>
            </div>

            {/* Stats row */}
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
                    <span className="sc-stat-label">Rank*</span>
                  </div>
                </>
              )}
            </div>

            {/* Challenge prompt */}
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
            {copied ? <><CheckCircle2 size={16} /> Copied!</> : <><Share2 size={16} /> Share result</>}
          </button>
        </div>

        {rank && <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>* Local demo rank — not a verified global ranking.</p>}
      </div>
    </div>
  )
}
