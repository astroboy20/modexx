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
    portrait:      '/tinubu-president.jpg',
    subjectImg:    '/tinubu-president.jpg',
    cta:           'Vote Tinubu 2027',
    electionDate:  PRESIDENTIAL_ELECTION,
    electionLabel: 'Presidential Election · Jan 16, 2027',
  },
  'sanwo-olu': {
    portrait:      '/hamzat.jpg',
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
  const { monument, displayName, score, correctCount, completionSeconds, rank, accentColor, electionCfg, countdown } = opts
  const mins = Math.floor(completionSeconds / 60)
  const secs = completionSeconds % 60
  const completedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Load all images up front in parallel
  const [subjectImg, candImg] = await Promise.all([
    loadImage(electionCfg.subjectImg).catch(() => null),
    loadImage(electionCfg.portrait).catch(() => null),
  ])

  // ── Tight layout — calculate height from content ──────────────────────
  // Sections: topBar(48) + identity(120) + divider(16) + score(120) + stats(56) + election(116) + cta(52) + bottomBar(36)
  const W  = 390   // phone width @ 1x
  const PAD = 20

  const TOPBAR_H  = 48
  const IDENT_H   = 120   // portrait thumb + info
  const DIV_Y     = TOPBAR_H + IDENT_H + 8
  const SCORE_Y   = DIV_Y + 12        // @name
  const BIG_Y     = SCORE_Y + 90      // big number baseline
  const LABEL_Y   = BIG_Y + 28
  const STATS_Y   = LABEL_Y + 24
  const STATS_H   = 52
  const ELEC_Y    = STATS_Y + STATS_H + 16
  const ELEC_H    = 108
  const CTA_Y     = ELEC_Y + ELEC_H + 24
  const CTA_H     = 44
  const BOT_Y     = CTA_Y + CTA_H + 12
  const BOT_H     = 34
  const H         = BOT_Y + BOT_H

  const DPR = 3   // 3× for sharp output
  const canvas = document.createElement('canvas')
  canvas.width  = W * DPR
  canvas.height = H * DPR
  const ctx = canvas.getContext('2d')!
  ctx.scale(DPR, DPR)

  // ── Background ────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // ── Top bar ───────────────────────────────────────────────────────────
  ctx.fillStyle = accentColor
  ctx.fillRect(0, 0, W, TOPBAR_H)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 18px Arial'
  ctx.textAlign = 'left'
  ctx.fillText('modexx.', PAD, 31)
  // APC badge
  ctx.font = 'bold 10px Arial'
  const bw = ctx.measureText('APC').width + 16
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'
  ctx.lineWidth = 1.2
  ctx.strokeRect(W - bw - PAD, 14, bw, 20)
  ctx.fillText('APC', W - bw - PAD + 8, 27)

  // ── Subject identity ──────────────────────────────────────────────────
  const iy = TOPBAR_H + 12
  if (subjectImg) {
    const pw = 72, ph = 90
    ctx.save()
    ctx.beginPath()
    roundRect(ctx, PAD, iy, pw, ph, 6)
    ctx.clip()
    const sc = Math.max(pw / subjectImg.width, ph / subjectImg.height)
    ctx.drawImage(subjectImg, PAD + (pw - subjectImg.width * sc) / 2, iy, subjectImg.width * sc, subjectImg.height * sc)
    ctx.restore()
  }
  ctx.fillStyle = accentColor
  ctx.font = 'bold 11px Arial'
  ctx.fillText(monument.name, 106, iy + 18)
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 16px Arial'
  ctx.fillText(monument.subject, 106, iy + 40)
  ctx.fillStyle = '#777777'
  ctx.font = '12px Arial'
  ctx.fillText(monument.office, 106, iy + 60)

  // ── Divider ───────────────────────────────────────────────────────────
  ctx.fillStyle = accentColor
  ctx.fillRect(PAD, DIV_Y, W - PAD * 2, 2)

  // ── Score ─────────────────────────────────────────────────────────────
  ctx.fillStyle = '#888888'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`@${displayName}`, W / 2, SCORE_Y + 16)

  // Score — measure text to centre the "800 / 1,000" group properly
  const scoreStr = String(score)
  const denomStr = ' / 1,000'
  ctx.font = 'bold 64px Arial'
  const scoreW = ctx.measureText(scoreStr).width
  ctx.font = '18px Arial'
  const denomW = ctx.measureText(denomStr).width
  const groupW = scoreW + denomW
  const groupX = (W - groupW) / 2

  ctx.fillStyle = accentColor
  ctx.font = 'bold 64px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(scoreStr, groupX, BIG_Y)

  ctx.fillStyle = '#aaaaaa'
  ctx.font = '18px Arial'
  ctx.fillText(denomStr, groupX + scoreW, BIG_Y - 4)  // slight offset for baseline alignment

  ctx.textAlign = 'center'

  ctx.fillStyle = '#aaaaaa'
  ctx.font = '10px Arial'
  ctx.fillText('POINTS SCORED', W / 2, LABEL_Y)

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = [
    { v: `${correctCount}/10`, l: 'CORRECT' },
    { v: '10/10',              l: 'EXPLORED' },
    { v: `${mins}m ${secs}s`,  l: 'TIME' },
    ...(rank ? [{ v: `#${rank}`, l: 'RANK' }] : []),
  ]
  const sw = (W - PAD * 2) / stats.length
  stats.forEach((s, i) => {
    const cx = PAD + sw * i + sw / 2
    ctx.fillStyle = accentColor
    ctx.font = 'bold 17px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(s.v, cx, STATS_Y + 22)
    ctx.fillStyle = '#aaaaaa'
    ctx.font = '9px Arial'
    ctx.fillText(s.l, cx, STATS_Y + 38)
    if (i < stats.length - 1) {
      ctx.fillStyle = '#e4e9e5'
      ctx.fillRect(PAD + sw * (i + 1) - 0.5, STATS_Y + 4, 1, 38)
    }
  })

  // ── Election section ──────────────────────────────────────────────────
  ctx.fillStyle = `${accentColor}15`
  roundRect(ctx, PAD, ELEC_Y, W - PAD * 2, ELEC_H, 10)
  ctx.fill()
  ctx.strokeStyle = `${accentColor}35`
  ctx.lineWidth = 1.2
  roundRect(ctx, PAD, ELEC_Y, W - PAD * 2, ELEC_H, 10)
  ctx.stroke()

  // Candidate circle
  const cx_ = PAD + 46, cy_ = ELEC_Y + ELEC_H / 2
  if (candImg) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx_, cy_, 34, 0, Math.PI * 2)
    ctx.clip()
    const cs = Math.max(68 / candImg.width, 68 / candImg.height)
    ctx.drawImage(candImg, cx_ - candImg.width * cs / 2, cy_ - candImg.height * cs / 2, candImg.width * cs, candImg.height * cs)
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(cx_, cy_, 34, 0, Math.PI * 2)
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.textAlign = 'left'
  const tx = PAD + 96
  ctx.fillStyle = accentColor
  ctx.font = 'bold 14px Arial'
  ctx.fillText(electionCfg.cta, tx, ELEC_Y + 34)
  ctx.fillStyle = '#555555'
  ctx.font = '11px Arial'
  ctx.fillText(electionCfg.electionLabel, tx, ELEC_Y + 54)

  // Countdown pill
  const pillW = 138, pillH = 24
  ctx.fillStyle = accentColor
  roundRect(ctx, tx, ELEC_Y + 64, pillW, pillH, 12)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`⏱ ${countdown}`, tx + pillW / 2, ELEC_Y + 80)

  // ── CTA ───────────────────────────────────────────────────────────────
  ctx.textAlign = 'center'
  ctx.fillStyle = '#111111'
  ctx.font = 'bold 14px Arial'
  ctx.fillText('Can you beat my score?', W / 2, CTA_Y + 18)
  ctx.fillStyle = '#aaaaaa'
  ctx.font = '11px Arial'
  ctx.fillText(`modexx.app/monuments/${monument.slug}`, W / 2, CTA_Y + 36)

  // ── Bottom bar ────────────────────────────────────────────────────────
  ctx.fillStyle = '#f7f9f7'
  ctx.fillRect(0, BOT_Y, W, BOT_H)
  ctx.fillStyle = '#aaaaaa'
  ctx.font = '10px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(completedDate, PAD, BOT_Y + 22)
  ctx.textAlign = 'right'
  ctx.fillText('modexx. Digital Monumental Experiences', W - PAD, BOT_Y + 22)

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

      const shareText = [
        `🏛 ${monument.name}`,
        ``,
        `I scored ${score}/1,000 pts — ${correctCount}/10 correct${rank ? ` · Ranked #${rank}` : ''}.`,
        ``,
        `🗳 ${electionCfg.cta} — ${countdown}`,
        ``,
        `Can you beat my score?`,
        `modexx.app/monuments/${monument.slug}`,
      ].join('\n')

      // Try native share with image attached (works on mobile)
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `My ${monument.name} result`,
          text: shareText,
          files: [file],
        })
        return
      }

      // Fallback: share without image
      if (navigator.share) {
        await navigator.share({ title: `My ${monument.name} result`, text: shareText })
      } else {
        await navigator.clipboard.writeText(shareText)
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
