'use client'

import { useRef, useState, useEffect } from 'react'
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

// Election date for 2027 Lagos gubernatorial election (assuming similar timing to 2023 - March 18)
const ELECTION_DATE = new Date('2027-03-18T00:00:00')

function getCountdown() {
  const now = new Date()
  const diff = ELECTION_DATE.getTime() - now.getTime()
  
  if (diff <= 0) return 'Election Day!'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 365) {
    const years = Math.floor(days / 365)
    const remainingDays = days % 365
    return `${years}y ${remainingDays}d`
  }
  
  return `${days}d ${hours}h`
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
  const [countdown, setCountdown] = useState(getCountdown())
  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60
  const completedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Update countdown every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdown())
    }, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  // Get deputy governor image and name based on monument
  const deputyGovernorInfo = monument.slug === 'sanwo-olu' ? {
    name: 'Obafemi Hamzat',
    image: '/hamzat.jpg', // You'll need to add this image
    message: 'Vote for Hamzat'
  } : {
    name: 'President Tinubu & Obafemi Hamzat',
    image: '/hamzat.jpg', // You'll need to add this image
    message: 'Vote for Hamzat'
  }

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
    const text = `I completed ${monument.name} on Modexx.\n10 hotspots explored. ${correctCount}/10 correct. ${score}/1,000 points.${rank ? ` Ranked #${rank}.` : ''}\n\n${deputyGovernorInfo.message} for 2027 Lagos election!\nCountdown: ${countdown}\n\nCan you beat my score?\nmodexx.co/monuments/${monument.slug}`
    if (navigator.share) {
      try { await navigator.share({ title: `My ${monument.name} result`, text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

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

            {/* Monument identity — uses actual portrait photo */}
            <div className="sc-monument-section">
              <div className="sc-monument-art" style={{ 
                background: monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8',
                overflow: 'hidden',
                borderRadius: '8px',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={monument.slug === 'tinubu' ? '/tinubu.png' : '/sanwo-olu.png'}
                  alt={monument.subject}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    const parent = (e.target as HTMLImageElement).parentElement
                    if (parent) {
                      const fallback = document.createElement('div')
                      fallback.className = 'sc-figure'
                      fallback.style.background = accentColor
                      parent.appendChild(fallback)
                    }
                  }}
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

            {/* Election countdown */}
            <div style={{ 
              margin: '16px 0 0', 
              padding: '14px 16px', 
              background: `${accentColor}12`, 
              borderRadius: '10px',
              border: `1.5px solid ${accentColor}30`,
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: accentColor, marginBottom: '6px' }}>
                🗳 Your Vote Counts
              </p>
              <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink, #111)' }}>
                Get your Permanent Voter Card (PVC)
              </p>
              <div style={{ 
                display: 'inline-block',
                padding: '5px 14px',
                background: accentColor,
                color: '#fff',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                ⏱ {countdown} to 2027 election
              </div>
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
