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

const LAGOS_ELECTION      = new Date('2027-02-06T08:00:00')
const PRESIDENTIAL_ELECTION = new Date('2027-01-16T08:00:00')

function daysUntil(date: Date): string {
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'Election Day!'
  const d = Math.floor(diff / 86400000)
  return `${d} days to go`
}

const ELECTION_CONFIG = {
  tinubu: {
    portrait:      '/President-Bola-Ahmed-Tinubu.jpg',
    subjectImg:    '/tinubu.png',
    cta:           'Vote Tinubu 2027',
    electionDate:  PRESIDENTIAL_ELECTION,
    electionLabel: 'Presidential Election · Jan 16, 2027',
  },
  'sanwo-olu': {
    portrait:      '/Obafemi-Hamzat.jpg',
    subjectImg:    '/sanwo-olu.png',
    cta:           'Vote Hamzat 2027',
    electionDate:  LAGOS_ELECTION,
    electionLabel: 'Lagos Governorship · Feb 6, 2027',
  },
} as const

// ── Load an image via fetch → blob → Image so it's CORS-safe on mobile ──
async function loadImage(src: string): Promise<HTMLImageElement> {
  const res  = await fetch(src)
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = reject
    img.src = url
  })
}

// ── Draw the scorecard on a canvas and return it as a blob ──────────────
async function renderScorecard(opts: {
  monument: Monument
  displayName: string
  score: number
  correctCount: number
  completionSeconds: number
  rank: number | null
  accentColor: string
  electionCfg: typeof ELECTION_CONFIG[keyof typeof ELECTION_CONFIG]
  countdown: string
}): Promise<Blob> {
  const W = 640, H = 900
  const canvas = document.createElement('canvas')
  canvas.width  = W * 2   // 2× for retina
  canvas.height = H * 2
  canvas.style.width  = `${W}px`
  canvas.style.height = `${H}px`
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)

  const { monument, displayName, score, correctCount, completionSeconds, rank, accentColor, electionCfg, countdown } = opts
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60
  const completedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Background ──────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // ── Top bar ─────────────────────────────────────────────────────────
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, W, 52)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 20px Arial, sans-serif'
  ctx.fillText('modexx.', 24, 34)
  ctx.font = 'bold 11px Arial'
  ctx.letterSpacing = '2px'
  const badge = 'APC'
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'
  ctx.lineWidth = 1.5
  const bw = ctx.measureText(badge).width + 20
  ctx.strokeRect(W - bw - 24, 16, bw, 22)
  ctx.fillText(badge, W - bw - 14, 31)
  ctx.letterSpacing = '0px'

  // ── Subject portrait ─────────────────────────────────────────────────
  try {
    const subjectImg = await loadImage(electionCfg.subjectImg)
    // Draw in a 88×110 rounded rect on the left
    const px = 24, py = 68, pw = 88, ph = 110
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(px, py, pw, ph, 6)
    ctx.clip()
    // maintain aspect ratio, fill from top
    const scale = Math.max(pw / subjectImg.width, ph / subjectImg.height)
    const sw = subjectImg.width * scale, sh = subjectImg.height * scale
    ctx.drawImage(subjectImg, px + (pw - sw) / 2, py, sw, sh)
    ctx.restore()
  } catch { /* skip if image fails */ }

  // Monument info beside portrait
  ctx.fillStyle = accentColor
  ctx.font = 'bold 12px Arial'
  ctx.fillText(monument.name, 126, 88)
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 18px Arial'
  ctx.fillText(monument.subject, 126, 112)
  ctx.fillStyle = '#777777'
  ctx.font = '12px Arial'
  ctx.fillText(monument.office, 126, 132)

  // ── Divider ──────────────────────────────────────────────────────────
  ctx.fillStyle = accentColor
  ctx.fillRect(24, 196, W - 48, 3)

  // ── Score section ────────────────────────────────────────────────────
  ctx.fillStyle = '#888888'
  ctx.font = '13px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`@${displayName}`, W / 2, 228)

  ctx.fillStyle = accentColor
  ctx.font = `bold 82px Arial`
  ctx.fillText(String(score), W / 2 - 30, 318)

  ctx.fillStyle = '#aaaaaa'
  ctx.font = '24px Arial'
  ctx.fillText('/ 1,000', W / 2 + 62, 318)

  ctx.fillStyle = '#aaaaaa'
  ctx.font = '11px Arial'
  ctx.letterSpacing = '2px'
  ctx.fillText('POINTS SCORED', W / 2, 342)
  ctx.letterSpacing = '0px'

  // ── Stats row ────────────────────────────────────────────────────────
  const stats = [
    { value: `${correctCount}/10`, label: 'CORRECT' },
    { value: '10/10',              label: 'EXPLORED' },
    { value: `${mins}m ${secs}s`,  label: 'TIME' },
    ...(rank ? [{ value: `#${rank}`, label: 'RANK' }] : []),
  ]
  const statW = (W - 48) / stats.length
  stats.forEach((s, i) => {
    const cx = 24 + statW * i + statW / 2
    ctx.fillStyle = accentColor
    ctx.font = 'bold 20px Arial'
    ctx.fillText(s.value, cx, 390)
    ctx.fillStyle = '#aaaaaa'
    ctx.font = '10px Arial'
    ctx.letterSpacing = '1px'
    ctx.fillText(s.label, cx, 408)
    ctx.letterSpacing = '0px'
    if (i < stats.length - 1) {
      ctx.fillStyle = '#e4e9e5'
      ctx.fillRect(24 + statW * (i + 1) - 1, 370, 1, 44)
    }
  })

  // ── Election section ─────────────────────────────────────────────────
  const ey = 432
  ctx.fillStyle = `${accentColor}18`
  roundRect(ctx, 24, ey, W - 48, 110, 10)
  ctx.fill()
  ctx.strokeStyle = `${accentColor}40`
  ctx.lineWidth = 1.5
  roundRect(ctx, 24, ey, W - 48, 110, 10)
  ctx.stroke()

  // Candidate portrait circle
  try {
    const candImg = await loadImage(electionCfg.portrait)
    ctx.save()
    ctx.beginPath()
    ctx.arc(80, ey + 55, 36, 0, Math.PI * 2)
    ctx.clip()
    const cs = Math.max(72 / candImg.width, 72 / candImg.height)
    const cw = candImg.width * cs, ch = candImg.height * cs
    ctx.drawImage(candImg, 80 - cw / 2, ey + 55 - ch / 2, cw, ch)
    ctx.restore()
    // Circle border
    ctx.beginPath()
    ctx.arc(80, ey + 55, 36, 0, Math.PI * 2)
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 2.5
    ctx.stroke()
  } catch { /* skip */ }

  ctx.textAlign = 'left'
  ctx.fillStyle = accentColor
  ctx.font = 'bold 15px Arial'
  ctx.fillText(electionCfg.cta, 132, ey + 40)
  ctx.fillStyle = '#555555'
  ctx.font = '12px Arial'
  ctx.fillText(electionCfg.electionLabel, 132, ey + 60)
  // Countdown pill
  ctx.fillStyle = accentColor
  roundRect(ctx, 132, ey + 72, 160, 26, 13)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 11px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`⏱ ${countdown}`, 132 + 80, ey + 89)

  // ── CTA ──────────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 16px Arial'
  ctx.fillText('Can you beat my score?', W / 2, 576)
  ctx.fillStyle = '#aaaaaa'
  ctx.font = '12px Arial'
  ctx.fillText(`modexx.app/monuments/${monument.slug}`, W / 2, 596)

  // ── Bottom bar ───────────────────────────────────────────────────────
  ctx.fillStyle = '#f7f9f7'
  ctx.fillRect(0, H - 40, W, 40)
  ctx.fillStyle = '#aaaaaa'
  ctx.font = '11px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(completedDate, 24, H - 16)
  ctx.textAlign = 'right'
  ctx.fillText('Digital Monumental Experiences', W - 24, H - 16)

  return new Promise(resolve => canvas.toBlob(b => resolve(b!), 'image/png', 1))
}

// Helper: path for rounded rect (works before roundRect is universal)
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ScorecardPreview({
  monument, displayName, score, correctCount, completionSeconds, rank, onClose,
}: ScorecardPreviewProps) {
  const [downloading, setDownloading] = useState(false)
  const [sharing,    setSharing]    = useState(false)
  const [copied,     setCopied]     = useState(false)
  const [,           setTick]       = useState(0)
  const blobRef = useRef<Blob | null>(null)

  const accentColor  = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const electionCfg  = ELECTION_CONFIG[monument.slug as keyof typeof ELECTION_CONFIG] ?? ELECTION_CONFIG.tinubu
  const countdown    = daysUntil(electionCfg.electionDate)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  async function getBlob(): Promise<Blob> {
    if (blobRef.current) return blobRef.current
    const blob = await renderScorecard({ monument, displayName, score, correctCount, completionSeconds, rank, accentColor, electionCfg, countdown })
    blobRef.current = blob
    return blob
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await getBlob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `modexx-${monument.slug}-scorecard.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch (e) {
      console.error('Download failed', e)
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    setSharing(true)
    try {
      const blob = await getBlob()
      const file = new File([blob], `modexx-scorecard.png`, { type: 'image/png' })

      // Try native share with image (works on mobile)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My ${monument.name} result`,
          text: `${score}/1,000 pts · ${correctCount}/10 correct · ${electionCfg.cta}`,
          files: [file],
        })
        return
      }

      // Fallback: share URL only
      const text = [
        `I scored ${score}/1,000 on the ${monument.name} challenge.`,
        `${correctCount}/10 correct${rank ? ` · Rank #${rank}` : ''}`,
        `${electionCfg.cta} — ${countdown}`,
        `modexx.app/monuments/${monument.slug}`,
      ].join('\n')

      if (navigator.share) {
        await navigator.share({ title: `My ${monument.name} result`, text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Share failed', e)
    } finally {
      setSharing(false)
    }
  }

  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60

  return (
    <div
      className="scorecard-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog" aria-modal="true" aria-label="Scorecard preview"
    >
      <div className="scorecard-modal">
        <div className="scorecard-modal-header">
          <h2>Your scorecard</h2>
          <button className="story-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        {/* Visual preview (DOM) */}
        <div className="scorecard-card-wrap">
          <div
            className="scorecard-card"
            style={{ '--accent': accentColor, '--accent-soft': monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8' } as React.CSSProperties}
          >
            <div className="sc-top-bar" style={{ background: accentColor }}>
              <div className="sc-wordmark">mod<span>exx</span><span className="sc-dot">.</span></div>
              <div className="sc-apc-badge">APC</div>
            </div>

            <div className="sc-monument-section">
              <div className="sc-monument-art" style={{ background: monument.accent === 'green' ? '#eaf2ee' : '#e7f2f8', overflow: 'hidden', borderRadius: '6px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={electionCfg.subjectImg} alt={monument.subject} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div className="sc-monument-info">
                <p className="sc-challenge-name" style={{ color: accentColor }}>{monument.name}</p>
                <p className="sc-subject">{monument.subject}</p>
                <p className="sc-office">{monument.office}</p>
              </div>
            </div>

            <div className="sc-divider" style={{ background: accentColor }} />

            <div className="sc-score-section">
              <p className="sc-player-name">@{displayName}</p>
              <div className="sc-score-display">
                <span className="sc-score-number" style={{ color: accentColor }}>{score}</span>
                <span className="sc-score-denom">/ 1,000</span>
              </div>
              <p className="sc-score-label">points scored</p>
            </div>

            <div className="sc-stats-row">
              {[
                { v: `${correctCount}/10`, l: 'Correct' },
                { v: '10/10',              l: 'Explored' },
                { v: `${mins}m ${secs}s`,  l: 'Time' },
                ...(rank ? [{ v: `#${rank}`, l: 'Rank' }] : []),
              ].map((s, i, arr) => (
                <>
                  <div key={s.l} className="sc-stat">
                    <span className="sc-stat-value" style={{ color: accentColor }}>{s.v}</span>
                    <span className="sc-stat-label">{s.l}</span>
                  </div>
                  {i < arr.length - 1 && <div key={`d${i}`} className="sc-stat-divider" />}
                </>
              ))}
            </div>

            {/* Election section */}
            <div style={{ margin: '14px 20px 0', padding: '14px', background: `${accentColor}10`, border: `1.5px solid ${accentColor}30`, borderRadius: '10px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${accentColor}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={electionCfg.portrait} alt={electionCfg.cta} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: accentColor, margin: '0 0 2px' }}>{electionCfg.cta}</p>
                <p style={{ fontSize: 11, color: '#555', margin: '0 0 6px' }}>{electionCfg.electionLabel}</p>
                <span style={{ display: 'inline-block', background: accentColor, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  ⏱ {countdown}
                </span>
              </div>
            </div>

            <div className="sc-cta-section">
              <p className="sc-cta-text">Can you beat my score?</p>
              <p className="sc-url">modexx.app/monuments/{monument.slug}</p>
            </div>

            <div className="sc-bottom-bar">
              <span className="sc-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="sc-brand">Digital Monumental Experiences</span>
            </div>
          </div>
        </div>

        <div className="scorecard-actions">
          <button className="button button-primary" onClick={handleDownload} disabled={downloading}>
            <Download size={16} />
            {downloading ? 'Generating…' : 'Download PNG'}
          </button>
          <button className="button" style={{ background: 'var(--soft)' }} onClick={handleShare} disabled={sharing}>
            {copied
              ? <><CheckCircle2 size={16} /> Copied!</>
              : sharing
                ? 'Sharing…'
                : <><Share2 size={16} /> Share</>}
          </button>
        </div>
      </div>
    </div>
  )
}
