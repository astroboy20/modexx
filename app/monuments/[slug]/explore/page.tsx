'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  QrCode,
  RefreshCw,
  X,
} from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument, Hotspot, Story } from '@/lib/data/index'
import { getExploredHotspots, markHotspotExplored } from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'
import { getWebSocketClient } from '@/lib/websocket'
import SiteHeader from '@/components/SiteHeader'
import HotspotQRCode from '@/components/HotspotQRCode'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Pick white or near-black text, whichever has better contrast on the accent. */
function readableOn(hex: string): string {
  const h = hex.replace('#', '')
  const lin = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  })
  const L = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
  const darkL = 0.009
  return 1.05 / (L + 0.05) >= (L + 0.05) / (darkL + 0.05) ? '#ffffff' : '#0f1a20'
}

function scopeStyle(accent: string): React.CSSProperties {
  return { '--xp-accent': accent, '--xp-on': readableOn(accent) } as React.CSSProperties
}

type Connection = 'connecting' | 'live' | 'offline'

// ── Styles (scoped by the xp- prefix; accent comes from CSS variables) ─────

const STYLES = `
.xp-scope{--xp-line:color-mix(in srgb,currentColor 14%,transparent);--xp-tint:color-mix(in srgb,var(--xp-accent) 8%,transparent)}

/* progress */
.xp-progress{display:flex;gap:4px;margin-top:20px}
.xp-seg{flex:1;height:6px;border-radius:3px;background:var(--xp-line);transition:background .4s ease}
.xp-seg.on{background:var(--xp-accent)}
.xp-count{margin:8px 0 0;font-size:13px;color:var(--muted)}
.xp-muted{font-size:13px;color:var(--muted)}

/* cards */
.xp-card{margin-top:24px;padding:20px;border:1px solid var(--xp-line);border-radius:14px;background:var(--xp-tint)}
.xp-card--active{border-color:var(--xp-accent)}
.xp-label{margin:0 0 8px;font-size:13px;color:var(--muted)}
.xp-clue{margin:0 0 16px;padding:0 0 0 14px;border-left:3px solid var(--xp-accent);font-size:16px;line-height:1.55;font-style:italic;color:var(--ink)}
.xp-steps{margin:0 0 18px;padding-left:20px;display:grid;gap:6px;font-size:13px;line-height:1.5;color:var(--ink-light)}
.xp-actions{display:grid;gap:8px}
.xp-title{margin:0 0 4px;font-size:16px;font-weight:600;color:var(--ink)}

/* buttons */
.xp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 16px;border-radius:10px;border:1px solid transparent;font:inherit;font-size:14px;font-weight:600;text-decoration:none;cursor:pointer;transition:filter .15s,background .15s}
.xp-btn--solid{background:var(--xp-accent);color:var(--xp-on)}
.xp-btn--solid:hover{filter:brightness(.94)}
.xp-btn--ghost{background:transparent;border-color:var(--xp-line);color:var(--ink)}
.xp-btn--ghost:hover{background:var(--xp-tint)}
.xp-btn:focus-visible,.xp-marker:focus-visible,.xp-trail-item:focus-visible{outline:2px solid var(--xp-accent);outline-offset:2px}

/* live status */
.xp-status{display:flex;align-items:center;gap:8px;margin:14px 0 0;font-size:13px;color:var(--muted)}
.xp-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;background:#9ca3af}
.xp-dot--live{background:#22a559;animation:xp-blink 1.8s ease-in-out infinite}
.xp-dot--offline{background:#d97706}

/* alert */
.xp-alert{display:flex;align-items:center;gap:10px;margin-top:20px;padding:12px 14px;border-radius:10px;border:1px solid #d9770655;background:#d9770614;font-size:13px;color:var(--ink)}
.xp-alert button{margin-left:auto;display:inline-flex;align-items:center;gap:6px;background:none;border:0;font:inherit;font-weight:600;color:inherit;cursor:pointer;text-decoration:underline}

/* scan feedback */
.xp-scanned{display:flex;align-items:center;gap:14px}
.xp-scanned-icon{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--xp-accent);color:var(--xp-on);animation:xp-pop .35s ease-out}

/* chapter trail */
.xp-trail-wrap{margin-top:28px}
.xp-trail-title{margin:0 0 8px;font-size:15px;font-weight:600;color:var(--ink)}
.xp-trail{list-style:none;margin:0;padding:0;display:grid;gap:2px}
.xp-trail-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px;border:0;border-radius:10px;background:transparent;font:inherit;text-align:left;color:var(--ink)}
button.xp-trail-item{cursor:pointer}
button.xp-trail-item:hover{background:var(--xp-tint)}
.xp-trail-item--locked{color:var(--muted)}
.xp-trail-text{display:grid;flex:1;min-width:0}
.xp-trail-main{font-size:14px;font-weight:500}
.xp-mark{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;flex-shrink:0;font-size:12px;font-weight:700;border:1.5px solid var(--xp-line);color:var(--muted)}
.xp-mark--done{background:var(--xp-accent);border-color:var(--xp-accent);color:var(--xp-on)}
.xp-mark--current{border-color:var(--xp-accent);color:var(--ink);box-shadow:0 0 0 3px var(--xp-tint)}

/* completion */
.xp-complete{display:grid;gap:12px}
.xp-complete-head{display:flex;align-items:center;gap:10px;font-size:17px;font-weight:600;color:var(--ink)}

/* portrait markers */
.xp-marker{position:absolute;transform:translate(-50%,-50%);z-index:5;display:grid;place-items:center;width:40px;height:40px;padding:0;border-radius:50%;border:2px solid var(--xp-accent);background:#fff;color:#14181c;font:inherit;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.28);transition:scale .15s ease,background .2s}
.xp-marker:hover{scale:1.1}
.xp-marker--sm{width:28px;height:28px;font-size:11px}
.xp-marker.is-done{background:var(--xp-accent);color:var(--xp-on);border-color:#fff}
.xp-marker.is-active{scale:1.2;z-index:10}
.xp-marker.is-current{width:36px;height:36px;z-index:10;background:var(--xp-accent);color:var(--xp-on);border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35)}
.xp-marker.is-current::after{content:"";position:absolute;right:-18px;top:50%;transform:translateY(-50%);width:0;height:0;border-top:7px solid transparent;border-bottom:7px solid transparent;border-left:10px solid var(--xp-accent);pointer-events:none}
.xp-marker.is-scanned::after{opacity:0}
.xp-hint{margin:16px 0 0;text-align:center;font-size:13px;color:var(--muted)}

/* QR modal */
.xp-modal{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:24px;background:rgba(8,10,12,.82);backdrop-filter:blur(6px)}
.xp-qr-card{display:grid;gap:14px;justify-items:center;width:min(340px,100%);padding:24px;border-radius:20px;background:#fff;color:#14181c;text-align:center;animation:xp-pop .25s ease-out}
.xp-qr-frame{padding:12px;border-radius:16px;border:3px solid var(--xp-accent);background:#fff}
.xp-qr-card .xp-status{margin:0;color:#4b5563}
.xp-qr-card .xp-btn{width:100%}

/* organizer next-target card */
.xp-qr-side{display:grid;gap:12px;justify-items:center;text-align:center}

@keyframes xp-blink{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes xp-pop{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
@media (prefers-reduced-motion:reduce){
  .xp-dot--live,.xp-scanned-icon,.xp-qr-card{animation:none}
  .xp-marker,.xp-seg{transition:none}
}
`

// ── Small shared pieces ────────────────────────────────────────────────────

function ProgressSegments({ total, count, label }: { total: number; count: number; label: string }) {
  return (
    <>
      <div className="xp-progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={count}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`xp-seg${i < count ? ' on' : ''}`} />
        ))}
      </div>
      <p className="xp-count">
        {count} of {total} {label}
      </p>
    </>
  )
}

function LiveStatus({ connection }: { connection: Connection }) {
  const text =
    connection === 'live'
      ? ''
      : connection === 'offline'
        ? 'Connection lost. Reconnecting…'
        : 'Connecting…'
  return (
    <p className="xp-status">
      {/* <span className={`xp-dot xp-dot--${connection}`} aria-hidden="true" /> */}
      {text}
    </p>
  )
}

// ── Chapter Card Deck ──────────────────────────────────────────────────────

const CARD_STYLES = `
/* ── Card deck wrapper ───────────────────────────────────────────── */
.ccd-overlay{position:fixed;inset:0;z-index:900;display:grid;place-items:center;padding:20px;background:rgba(8,10,12,.75);backdrop-filter:blur(6px)}
.ccd-scene{perspective:1200px;width:min(480px,100%)}
.ccd-flipper{position:relative;transform-style:preserve-3d;animation:none}
.ccd-flipper.spinning{animation:ccd-spin .65s cubic-bezier(.4,0,.2,1) forwards}
.ccd-flipper.chapter-spinning{animation:ccd-spin-big .7s cubic-bezier(.4,0,.2,1) forwards}
@keyframes ccd-spin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
@keyframes ccd-spin-big{0%{transform:rotateY(0deg) scale(1)}40%{transform:rotateY(180deg) scale(.92)}100%{transform:rotateY(360deg) scale(1)}}
.ccd-card{backface-visibility:hidden;border-radius:20px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35);background:#fff}

/* header */
.ccd-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 0}
.ccd-chapter-badge{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;letter-spacing:.5px;color:var(--xp-accent)}
.ccd-close{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.07);color:inherit;cursor:pointer}
.ccd-close:hover{background:rgba(0,0,0,.12)}

/* body */
.ccd-body{padding:18px 20px 14px;min-height:220px;display:grid;align-content:start;gap:10px}
.ccd-headline{margin:0;font-size:17px;font-weight:700;color:#14181c;line-height:1.3}
.ccd-date{margin:0;font-size:12px;color:#68736d}
.ccd-text{margin:0;font-size:15px;line-height:1.65;color:#2b342e}

/* dots */
.ccd-dots{display:flex;justify-content:center;gap:7px;padding:12px 0 4px}
.ccd-dot{width:8px;height:8px;border-radius:50%;background:#dde3de;transition:background .25s,transform .25s}
.ccd-dot.active{background:var(--xp-accent);transform:scale(1.25)}

/* footer */
.ccd-footer{padding:14px 20px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid #edf0ee}
.ccd-counter{font-size:12px;color:#68736d}
.ccd-next-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 20px;border-radius:10px;border:0;background:var(--xp-accent);color:var(--xp-on);font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:filter .15s}
.ccd-next-btn:hover{filter:brightness(.9)}
.ccd-next-btn:disabled{opacity:.5;cursor:not-allowed}
.ccd-prev-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:10px;border:1px solid #dde3de;background:transparent;color:#2b342e;font:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:filter .15s}
.ccd-prev-btn:hover{background:#f5f7f5}
.ccd-prev-btn:disabled{opacity:.4;cursor:not-allowed}

/* chapter-transition overlay text */
.ccd-chapter-done{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;min-height:260px;text-align:center;padding:28px 24px}
.ccd-chapter-done h3{margin:0;font-size:20px;font-weight:700;color:#14181c}
.ccd-chapter-done p{margin:0;font-size:14px;color:#68736d;line-height:1.6}

@media(prefers-reduced-motion:reduce){
  .ccd-flipper.spinning,.ccd-flipper.chapter-spinning{animation-duration:.01ms}
}
`

/** Split a story body (double-newline separated) into up to 4 talking points. */
function splitIntoTalkingPoints(body: string): string[] {
  const paras = body.split('\n\n').map((p) => p.trim()).filter(Boolean)
  if (paras.length <= 4) return paras
  // Combine extras into the last bucket so we always have ≤4
  const result = paras.slice(0, 3)
  result.push(paras.slice(3).join('\n\n'))
  return result
}

interface ChapterCardDeckProps {
  monument: Monument
  hotspot: Hotspot
  story: Story | undefined
  onClose: () => void
  accentColor?: string
  /** nav for review (browse) mode */
  nav?: { onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean }
  /** action for reveal mode */
  action?: { label: string; onClick: () => void }
}

function ChapterCardDeck({ monument, hotspot, story, onClose, accentColor = '#168447', nav, action }: ChapterCardDeckProps) {
  const talkingPoints = useMemo(
    () => splitIntoTalkingPoints(story?.body || 'Story content — editorial review required.'),
    [story?.body]
  )
  const total = talkingPoints.length

  const [pointIndex, setPointIndex] = useState(0)
  const [displayIndex, setDisplayIndex] = useState(0) // what's visually shown (swaps at mid-spin)
  const [spinning, setSpinning] = useState(false)
  const [chapterSpinning, setChapterSpinning] = useState(false)
  const [spinKey, setSpinKey] = useState(0)  // bump to remount flipper and replay animation
  // Wrap callbacks in { fn } so React doesn't treat them as state updaters
  const [pendingAction, setPendingAction] = useState<{ fn: () => void; targetDisplayIdx?: number } | null>(null)
  const midTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flipperRef = useRef<HTMLDivElement>(null)
  const nextBtnRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Reset to card 0 when the hotspot changes
  useEffect(() => {
    setPointIndex(0)
    setDisplayIndex(0)
    setSpinning(false)
    setChapterSpinning(false)
    setPendingAction(null)
    setSpinKey((k) => k + 1)
    if (midTimerRef.current) clearTimeout(midTimerRef.current)
  }, [hotspot.id])

  // Lock scroll, focus trap
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    nextBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      prev?.focus?.()
      if (midTimerRef.current) clearTimeout(midTimerRef.current)
    }
  }, [])

  // Keyboard handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  /** Fire after the card spin ends — advance to the next point or chapter */
  function handleSpinEnd() {
    if (!spinning && !chapterSpinning) return
    if (midTimerRef.current) clearTimeout(midTimerRef.current)
    setSpinning(false)
    setChapterSpinning(false)
    setSpinKey((k) => k + 1)   // remount for next spin
    if (pendingAction) {
      const { fn, targetDisplayIdx } = pendingAction
      setPendingAction(null)
      // Sync displayIndex in case the mid-timer didn't fire (e.g. reduced-motion)
      if (targetDisplayIdx !== undefined) setDisplayIndex(targetDisplayIdx)
      fn()
    }
  }

  /** Called when user presses Next on a talking-point card */
  function handleNext() {
    if (spinning || chapterSpinning) return
    const isLastPoint = pointIndex >= total - 1

    if (!isLastPoint) {
      const nextIdx = pointIndex + 1
      // Swap content at the halfway point (325ms ≈ half of 650ms)
      midTimerRef.current = setTimeout(() => setDisplayIndex(nextIdx), 325)
      setSpinning(true)
      setPendingAction({ fn: () => setPointIndex(nextIdx), targetDisplayIdx: nextIdx })
    } else {
      // Last point — spin the whole chapter card then fire the chapter-level action
      const chapterAction = action
        ? action.onClick
        : nav?.hasNext
        ? nav.onNext
        : onClose

      setChapterSpinning(true)
      setPendingAction({ fn: chapterAction })
    }
  }

  function handlePrev() {
    if (spinning || chapterSpinning) return
    if (pointIndex > 0) {
      const prevIdx = pointIndex - 1
      midTimerRef.current = setTimeout(() => setDisplayIndex(prevIdx), 325)
      setSpinning(true)
      setPendingAction({ fn: () => setPointIndex(prevIdx), targetDisplayIdx: prevIdx })
    } else if (nav?.hasPrev) {
      nav.onPrev()
    }
  }

  const isLastPoint = pointIndex >= total - 1
  const isLastChapter = action ? false : !nav?.hasNext
  const nextLabel = isLastPoint
    ? action
      ? action.label
      : isLastChapter
      ? 'Finish'
      : 'Next Chapter'
    : 'Next'

  return (
    <div
      className="ccd-overlay"
      style={scopeStyle(accentColor)}
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${hotspot.chapter}: ${hotspot.label}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{CARD_STYLES}</style>

      <div className="ccd-scene">
        <div
          key={spinKey}
          ref={flipperRef}
          className={`ccd-flipper${spinning ? ' spinning' : ''}${chapterSpinning ? ' chapter-spinning' : ''}`}
          onAnimationEnd={handleSpinEnd}
        >
          <div className="ccd-card">
            {/* Header */}
            <div className="ccd-header">
              <span className="ccd-chapter-badge">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--xp-accent)', display: 'inline-block' }} aria-hidden="true" />
                {hotspot.chapter} · {hotspot.label}
              </span>
              <button className="ccd-close" onClick={onClose} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="ccd-body">
              {displayIndex === 0 && (
                <>
                  <h2 className="ccd-headline">{story?.headline || hotspot.label}</h2>
                  {story?.dateLabel && <p className="ccd-date">{story.dateLabel}</p>}
                </>
              )}
              <p className="ccd-text">{talkingPoints[displayIndex]}</p>
            </div>

            {/* Progress dots */}
            <div className="ccd-dots" aria-hidden="true">
              {talkingPoints.map((_, i) => (
                <span key={i} className={`ccd-dot${i === pointIndex ? ' active' : ''}`} />
              ))}
            </div>

            {/* Footer */}
            <div className="ccd-footer">
              <button
                className="ccd-prev-btn"
                onClick={handlePrev}
                disabled={pointIndex === 0 && !nav?.hasPrev}
                aria-label={pointIndex === 0 ? 'Previous chapter' : 'Previous point'}
              >
                <ChevronLeft size={16} />
                {pointIndex === 0 ? 'Prev' : 'Back'}
              </button>
              <span className="ccd-counter" aria-live="polite">
                {pointIndex + 1} / {total}
              </span>
              <button
                ref={nextBtnRef}
                className="ccd-next-btn"
                onClick={handleNext}
                disabled={spinning || chapterSpinning}
                aria-label={nextLabel}
              >
                {nextLabel}
                {isLastPoint ? <ArrowRight size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Story Panel ────────────────────────────────────────────────────────────

interface StoryPanelProps {
  monument: Monument
  hotspot: Hotspot
  story: Story | undefined
  onClose: () => void
  /** Browse mode: previous / next chapter buttons */
  nav?: { onPrev: () => void; onNext: () => void; hasPrev: boolean; hasNext: boolean }
  /** Reveal mode: a single primary action replaces prev / next */
  action?: { label: string; onClick: () => void }
}

function StoryPanel({ monument, hotspot, story, onClose, nav, action }: StoryPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Lock page scroll, move focus into the dialog, restore it on close
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      previous?.focus?.()
    }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (nav && e.key === 'ArrowLeft' && nav.hasPrev) nav.onPrev()
      if (nav && e.key === 'ArrowRight' && nav.hasNext) nav.onNext()
      if (e.key === 'Tab' && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled])')
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, nav])

  return (
    <div
      className="story-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Story: ${hotspot.label}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="story-panel" ref={panelRef}>
        <div className="story-panel-header">
          <span className="story-chapter-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--xp-accent)' }} />
            {hotspot.chapter}
          </span>
          <button ref={closeRef} className="story-close" onClick={onClose} aria-label="Close story">
            <X size={20} />
          </button>
        </div>

        <div className="story-panel-body">
          <p className="story-metaphor">{hotspot.metaphor}</p>
          <h2 className="story-title">{story?.headline || hotspot.label}</h2>
          {story?.dateLabel && <p className="story-date">{story.dateLabel}</p>}

          <div className="story-body">
            {(story?.body || 'Story content — editorial review required.').split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {story?.editorialNote && (
            <div className="story-editorial-note">
              <AlertCircle size={13} />
              <span>{story.editorialNote}</span>
            </div>
          )}

          {story?.sources && story.sources.length > 0 && (
            <div className="story-sources">
              <p className="story-sources-label">Sources</p>
              <ul>
                {story.sources.map((src) => (
                  <li key={src.url}>
                    <a href={src.url} target="_blank" rel="noopener noreferrer">
                      {src.title} — {src.publisher} <ExternalLink size={11} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="story-panel-footer">
          {action ? (
            <>
              <span className="story-progress-label">
                {hotspot.displayOrder} / {monument.hotspots.length}
              </span>
              <button className="xp-btn xp-btn--solid" onClick={action.onClick}>
                {action.label} <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button className="story-nav-btn" onClick={nav?.onPrev} disabled={!nav?.hasPrev} aria-label="Previous chapter">
                <ChevronLeft size={18} /> Prev
              </button>
              <span className="story-progress-label">
                {hotspot.displayOrder} / {monument.hotspots.length}
              </span>
              <button className="story-nav-btn" onClick={nav?.onNext} disabled={!nav?.hasNext} aria-label="Next chapter">
                Next <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── QR modal (participant) ─────────────────────────────────────────────────

function QRModal({
  monument,
  hotspot,
  connection,
  onClose,
}: {
  monument: Monument
  hotspot: Hotspot
  connection: Connection
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="xp-modal" role="dialog" aria-modal="true" aria-label="QR code to scan" onClick={onClose}>
      <div className="xp-qr-card" onClick={(e) => e.stopPropagation()}>
        <div className="xp-qr-frame">
          {/* Dark modules on white keep the code reliably scannable on any accent */}
          <HotspotQRCode slug={monument.slug} hotspotId={hotspot.id} size={208} bgColor="#ffffff" fgColor="#101418" />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Scan with your phone</p>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4b5563' }}>
            Open your camera and point it at the code. The story opens on this screen.
          </p>
        </div>
        <LiveStatus connection={connection} />
        <button ref={closeRef} className="xp-btn xp-btn--ghost" style={{ color: '#14181c' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

// ── Participant flow ───────────────────────────────────────────────────────

interface ParticipantExploreProps {
  monument: Monument
  accentColor: string
  justUnlockedId?: string
}

function ParticipantExplore({ monument, accentColor, justUnlockedId }: ParticipantExploreProps) {
  const router = useRouter()
  const sortedHotspots = useMemo(
    () => [...monument.hotspots].sort((a, b) => a.displayOrder - b.displayOrder),
    [monument.hotspots]
  )
  const total = sortedHotspots.length

  const [found, setFound] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [connection, setConnection] = useState<Connection>('connecting')
  const [scanDetectedId, setScanDetectedId] = useState<string | null>(null)
  const [story, setStory] = useState<{ id: string; mode: 'reveal' | 'review' } | null>(null)
  const [showQR, setShowQR] = useState(false)
  // Gate: show full-screen QR for chapter 1 before exploration starts
  const [gateScanned, setGateScanned] = useState(false)

  const foundRef = useRef(found)
  foundRef.current = found
  const timersRef = useRef<number[]>([])
  const reloadRef = useRef<() => void>(() => {})
  const justUnlockedRef = useRef(justUnlockedId)

  // Derived state: the clue to chase is always the first chapter not yet found.
  const nextHotspot = sortedHotspots.find((h) => !found.has(h.id))
  const scanDetectedHotspot = scanDetectedId ? sortedHotspots.find((h) => h.id === scanDetectedId) : undefined
  const focusHotspot = scanDetectedHotspot ?? nextHotspot
  const allFound = !focusHotspot

  // Load progress from the database and listen for live scans
  useEffect(() => {
    const player = getClientSession()
    if (!player) {
      setLoading(false)
      return
    }

    let isMounted = true
    let ws: ReturnType<typeof getWebSocketClient> | null = null
    let removeReconnectCb: (() => void) | null = null
    const validIds = new Set(sortedHotspots.map((h) => h.id))

    async function loadProgress(showSpinner = true) {
      if (showSpinner && isMounted) setLoading(true)
      try {
        const res = await fetch(`/api/progress?monumentSlug=${monument.slug}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Progress request failed (${res.status})`)
        const { progress } = await res.json()
        if (!isMounted) return

        const ids = new Set<string>()
        for (const p of progress as Array<{ hotspot_id: string }>) {
          if (validIds.has(p.hotspot_id)) {
            ids.add(p.hotspot_id)
            markHotspotExplored(monument.slug, p.hotspot_id) // mirror to localStorage
          }
        }
        setFound(ids)
        setLoadError(false)

        // If the participant already has at least chapter 1, skip the gate
        if (ids.size > 0) setGateScanned(true)

        // Arrived from the scanner page — handle both single and gate (all) unlocks
        const unlockId = justUnlockedRef.current
        if (unlockId) {
          if (unlockId === '__all__') {
            // Gate scan unlocked everything — gate is already bypassed via ids.size > 0
            justUnlockedRef.current = undefined
            router.replace(`/monuments/${monument.slug}/explore`, { scroll: false })
          } else if (ids.has(unlockId)) {
            justUnlockedRef.current = undefined
            setStory({ id: unlockId, mode: 'reveal' })
            // Drop ?unlocked= so a refresh doesn't replay the reveal
            router.replace(`/monuments/${monument.slug}/explore`, { scroll: false })
          }
        }
      } catch (err) {
        console.error('[Explore] Failed to load progress:', err)
        if (isMounted && showSpinner) setLoadError(true)
      } finally {
        if (isMounted && showSpinner) setLoading(false)
      }
    }
    reloadRef.current = () => loadProgress(true)

    async function setupWebSocket() {
      if (!player) return
      try {
        ws = getWebSocketClient(player.id, player.displayName)
        await ws.connect()
        if (!isMounted) return
        setConnection('live')

        ws.joinMonument(monument.slug)

        // On reconnect: re-fetch so we don't miss scans that happened while offline
        removeReconnectCb = ws.onReconnectFetch(() => {
          if (isMounted) loadProgress(false)
        })

        ws.onHotspotUnlocked((data: { monumentSlug: string; hotspotId: string }) => {
          if (!isMounted || data.monumentSlug !== monument.slug) return
          const hotspot = sortedHotspots.find((h) => h.id === data.hotspotId)
          if (!hotspot || foundRef.current.has(hotspot.id)) return

          markHotspotExplored(monument.slug, hotspot.id)
          setFound((prev) => new Set(prev).add(hotspot.id))
          setShowQR(false)

          // If this is part of a bulk gate unlock (found was empty), just
          // silently add all chapters — don't cascade story panels
          const wasEmpty = foundRef.current.size === 0
          setGateScanned(true)

          if (wasEmpty) {
            // First event of a gate scan — just mark and move on, no story popup
            return
          }

          // Single-hotspot scan — show the scan feedback then open the story
          setScanDetectedId(hotspot.id)
          const t = window.setTimeout(() => {
            if (!isMounted) return
            setScanDetectedId(null)
            setStory({ id: hotspot.id, mode: 'reveal' })
          }, 1200)
          timersRef.current.push(t)
        })
        ws.onConnect(() => isMounted && setConnection('live'))
        ws.onDisconnect(() => isMounted && setConnection('offline'))
      } catch (err) {
        console.error('[Explore] WebSocket setup failed:', err)
        if (isMounted) setConnection('offline')
      }
    }

    loadProgress()
    setupWebSocket()

    return () => {
      isMounted = false
      timersRef.current.forEach((t) => window.clearTimeout(t))
      timersRef.current = []
      removeReconnectCb?.()
      if (ws) {
        ws.off('hotspot:unlocked')
        ws.off('connect')
        ws.off('disconnect')
        // Do NOT disconnect the socket — other pages share the singleton
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monument.slug, sortedHotspots])

  const discovered = sortedHotspots.filter((h) => found.has(h.id))
  const storyHotspot = story ? sortedHotspots.find((h) => h.id === story.id) : undefined
  const storyIdx = storyHotspot ? discovered.findIndex((h) => h.id === storyHotspot.id) : -1

  function closeStory() {
    setStory(null)
  }
  function stepStory(dir: -1 | 1) {
    const target = discovered[storyIdx + dir]
    if (target) setStory({ id: target.id, mode: 'review' })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', alignContent: 'center', gap: 12 }}>
        <span className="spinner spinner--lg" aria-hidden="true" />
        <p className="xp-muted" role="status">Loading your progress…</p>
      </div>
    )
  }

  // ── Gate screen: participant hasn't scanned anything yet ──────────────────
  const firstHotspot = sortedHotspots[0]
  const showGate = !gateScanned && found.size === 0 && firstHotspot

  if (showGate) {
    return (
      <div className="xp-scope" style={{ ...scopeStyle(accentColor), minHeight: '100vh', background: 'var(--bg, #f8f9fa)' }}>
        <style>{STYLES}</style>
        <style>{`
          .gate-layout {
            min-height: 100vh;
            display: grid;
            grid-template-rows: auto 1fr;
          }
          .gate-body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 32px 24px;
          }
          .gate-inner {
            display: grid;
            gap: 0;
            width: 100%;
            max-width: 900px;
            grid-template-columns: 1fr;
          }
          .gate-info {
            display: grid;
            gap: 16px;
            padding: 32px 0 0;
            text-align: center;
            justify-items: center;
          }
          .gate-qr-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px 0 0;
          }
          .gate-chapters {
            display: none;
          }
          @media (min-width: 768px) {
            .gate-inner {
              grid-template-columns: 1fr 1fr;
              gap: 48px;
              align-items: center;
            }
            .gate-info {
              text-align: left;
              justify-items: start;
              padding: 0;
              order: 1;
            }
            .gate-qr-wrap {
              order: 2;
              padding: 0;
              flex-direction: column;
              gap: 16px;
            }
            .gate-chapters {
              display: grid;
              gap: 6px;
              width: 100%;
              max-height: 320px;
              overflow-y: auto;
            }
          }
        `}</style>

        <SiteHeader
          className="detail-header explore-fixed-header"
          left={
            <Link href={`/monuments/${monument.slug}`} className="text-link">
              <ArrowLeft size={16} /> Back
            </Link>
          }
        />

        <div className="gate-layout" style={{ paddingTop: 56 }}>
          <div className="gate-body">
            <div className="gate-inner">

              {/* Left / top — info */}
              <div className="gate-info">
                <p className="eyebrow" style={{ color: 'var(--ink)', margin: 0 }}>
                  <span className="eyebrow-line" style={{ background: accentColor }} />
                  {monument.subject}
                </p>
                <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25 }}>
                  {monument.name}
                </h1>
                <p style={{ margin: 0, fontSize: 15, color: 'var(--muted)', lineHeight: 1.65, maxWidth: 400 }}>
                  Scan the QR code with your phone to unlock all {total} chapters and begin the exploration.
                </p>

                {/* Chapter list — desktop only */}
                <div className="gate-chapters">
                  {sortedHotspots.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 10px',
                        borderRadius: 8,
                        background: 'color-mix(in srgb, var(--xp-accent) 6%, transparent)',
                      }}
                    >
                      <span
                        style={{
                          display: 'grid',
                          placeItems: 'center',
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: accentColor,
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {h.displayOrder}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{h.label}</span>
                    </div>
                  ))}
                </div>

                <LiveStatus connection={connection} />

                {loadError && (
                  <div className="xp-alert" role="alert">
                    <AlertCircle size={16} />
                    <span>Couldn&apos;t load your progress.</span>
                    <button type="button" onClick={() => reloadRef.current()}>
                      <RefreshCw size={13} /> Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Right / bottom — QR code */}
              <div className="gate-qr-wrap">
                <div className="xp-qr-frame">
                  <HotspotQRCode
                    slug={monument.slug}
                    hotspotId="__all__"
                    size={240}
                    bgColor="#ffffff"
                    fgColor="#101418"
                  />
                </div>
              
              </div>

            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className={`explore-page explore-page--full xp-scope ${monument.accent}`} style={scopeStyle(accentColor)}>
      <style>{STYLES}</style>

      <SiteHeader
        className="detail-header explore-fixed-header"
        left={
          <Link href={`/monuments/${monument.slug}`} className="text-link">
            <ArrowLeft size={16} /> Back
          </Link>
        }
        right={
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {found.size} / {total}
          </span>
        }
      />

      <div className="explorer-layout">
        <aside className="explorer-sidebar">
          <div className="explorer-sidebar-inner">
            <p className="eyebrow" style={{ color: 'var(--ink)' }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              {monument.subject}
            </p>
            <h1 className="explorer-title">{monument.name}</h1>

            <ProgressSegments total={total} count={found.size} label="chapters found" />

            {loadError && (
              <div className="xp-alert" role="alert">
                <AlertCircle size={16} />
                <span>Couldn&apos;t load your progress.</span>
                <button type="button" onClick={() => reloadRef.current()}>
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            )}

            {allFound ? (
              <section className="xp-card xp-card--active xp-complete" aria-live="polite">
                <p className="xp-complete-head">
                  <CheckCircle2 size={22} style={{ flexShrink: 0 }} /> All chapters found
                </p>
                <p className="xp-muted" style={{ margin: 0, lineHeight: 1.6 }}>
                  You&apos;ve unlocked every chapter of {monument.name}. Reread any of them below, or start the
                  challenge when you&apos;re ready.
                </p>
                <button
                  type="button"
                  className="xp-btn xp-btn--solid"
                  onClick={() => router.push(`/challenge/${monument.slug}/instructions`)}
                >
                  Start the challenge <ArrowRight size={16} />
                </button>
              </section>
            ) : (
              <section className="xp-card xp-card--active" aria-live="polite">
                {scanDetectedHotspot ? (
                  <div className="xp-scanned">
                    <span className="xp-scanned-icon" aria-hidden="true">
                      <Check size={20} />
                    </span>
                    <div>
                      <p className="xp-title">Marker scanned</p>
                      <p className="xp-muted" style={{ margin: 0 }}>Opening {scanDetectedHotspot.chapter}…</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="xp-label">
                      Clue {focusHotspot!.displayOrder} of {total}
                    </p>
                    <blockquote className="xp-clue">{focusHotspot!.metaphor}</blockquote>
                    <ol className="xp-steps">
                      <li>Find the numbered marker on the portrait — it has an arrow.</li>
                      <li>Show its QR code and scan it with your phone.</li>
                      <li>The story opens here automatically.</li>
                    </ol>
                    <div className="xp-actions">
                      <button type="button" className="xp-btn xp-btn--solid" onClick={() => setShowQR(true)}>
                        <QrCode size={18} /> Show QR code
                      </button>
                      <Link href={`/monuments/${monument.slug}/scanner`} className="xp-btn xp-btn--ghost">
                        <Camera size={18} /> Scan with this device
                      </Link>
                    </div>
                    <LiveStatus connection={connection} />
                  </>
                )}
              </section>
            )}

            <div className="xp-trail-wrap">
              <h2 className="xp-trail-title">Chapters</h2>
              <ul className="xp-trail">
                {sortedHotspots.map((h) => {
                  const done = found.has(h.id)
                  const current = h.id === focusHotspot?.id
                  if (done) {
                    return (
                      <li key={h.id}>
                        <button
                          type="button"
                          className="xp-trail-item"
                          onClick={() => setStory({ id: h.id, mode: 'review' })}
                          aria-label={`Read ${h.chapter}: ${h.label}`}
                        >
                          <span className="xp-mark xp-mark--done"><Check size={14} /></span>
                          <span className="xp-trail-text">
                            <span className="xp-trail-main">{h.label}</span>
                            <span className="xp-muted">{h.chapter}</span>
                          </span>
                          <ChevronRight size={16} style={{ color: 'var(--muted)' }} aria-hidden="true" />
                        </button>
                      </li>
                    )
                  }
                  return (
                    <li key={h.id}>
                      <div className={`xp-trail-item ${current ? '' : 'xp-trail-item--locked'}`}>
                        <span className={`xp-mark${current ? ' xp-mark--current' : ''}`}>
                          {current ? h.displayOrder : <Lock size={12} />}
                        </span>
                        <span className="xp-trail-text">
                          <span className="xp-trail-main">Chapter {h.displayOrder}</span>
                          <span className="xp-muted">{current ? 'Find this one next' : 'Not found yet'}</span>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </aside>

        <div className="explorer-portrait-wrap">
          <div className="explorer-portrait-container">
            <div className="explorer-portrait-bg" aria-label={`${monument.subject} portrait`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={monument.image}
                alt={monument.subject}
                className="portrait-image"
                draggable={false}
                style={{ objectFit: monument.portraitFit ?? 'cover' }}
              />

              {/* Found chapters: small markers you can tap to reread */}
              {discovered
                .filter((h) => h.id !== focusHotspot?.id)
                .map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className="xp-marker xp-marker--sm is-done"
                    style={{ left: `${h.x}%`, top: `${h.y}%` }}
                    onClick={() => setStory({ id: h.id, mode: 'review' })}
                    aria-label={`Reread ${h.chapter}: ${h.label}`}
                    title={h.label}
                  >
                    <Check size={14} />
                  </button>
                ))}

              {/* The one marker to find */}
              {focusHotspot && (
                <button
                  type="button"
                  className={`xp-marker is-current${scanDetectedHotspot ? ' is-scanned' : ''}`}
                  style={{ left: `${focusHotspot.x}%`, top: `${focusHotspot.y}%` }}
                  onClick={() => setShowQR(true)}
                  aria-label={`Show QR code for clue ${focusHotspot.displayOrder}`}
                  data-ar-marker={`hotspot-${focusHotspot.id}`}
                >
                  {scanDetectedHotspot ? <Check size={20} /> : focusHotspot.displayOrder}
                </button>
              )}
            </div>
          </div>

          {!allFound && <p className="xp-hint">Tap the numbered marker → to show its QR code.</p>}
        </div>
      </div>

      {showQR && focusHotspot && !scanDetectedHotspot && (
        <QRModal monument={monument} hotspot={focusHotspot} connection={connection} onClose={() => setShowQR(false)} />
      )}

      {story && storyHotspot && (
        <ChapterCardDeck
          key={storyHotspot.id}
          monument={monument}
          hotspot={storyHotspot}
          story={monument.stories.find((s) => s.hotspotId === storyHotspot.id)}
          accentColor={accentColor}
          onClose={closeStory}
          {...(story.mode === 'reveal'
            ? { action: { label: nextHotspot ? 'Continue to next clue' : 'Finish', onClick: closeStory } }
            : {
                nav: {
                  onPrev: () => stepStory(-1),
                  onNext: () => stepStory(1),
                  hasPrev: storyIdx > 0,
                  hasNext: storyIdx >= 0 && storyIdx < discovered.length - 1,
                },
              })}
        />
      )}
    </main>
  )
}

// ── Organizer explorer ─────────────────────────────────────────────────────

function OrganizerExplore({ monument, accentColor }: { monument: Monument; accentColor: string }) {
  const [exploredIds, setExploredIds] = useState<string[]>([])
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const isComplete = exploredIds.length >= monument.hotspots.length

  // Start from localStorage for instant render, then reconcile with the DB
  useEffect(() => {
    const localIds = getExploredHotspots(monument.slug)
    setExploredIds(localIds)

    fetch(`/api/progress?monumentSlug=${monument.slug}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.progress) return
        const dbIds: string[] = data.progress.map((p: { hotspot_id: string }) => p.hotspot_id)
        const merged = Array.from(new Set([...localIds, ...dbIds]))
        merged.forEach((id) => markHotspotExplored(monument.slug, id))
        setExploredIds(merged)
      })
      .catch(() => {
        /* non-fatal */
      })
  }, [monument.slug])

  const sortedHotspots = useMemo(
    () => [...monument.hotspots].sort((a, b) => a.displayOrder - b.displayOrder),
    [monument.hotspots]
  )
  // The first unexplored chapter is the one participants need to scan next
  const nextTarget = sortedHotspots.find((h) => !exploredIds.includes(h.id))

  function openHotspot(hotspot: Hotspot) {
    setActiveHotspot(hotspot)
    if (!exploredIds.includes(hotspot.id)) {
      markHotspotExplored(monument.slug, hotspot.id)
      setExploredIds((prev) => [...prev, hotspot.id])
    }
  }

  const activeIdx = activeHotspot ? sortedHotspots.findIndex((h) => h.id === activeHotspot.id) : -1
  const activeStory = activeHotspot ? monument.stories.find((s) => s.hotspotId === activeHotspot.id) : undefined

  function navigatePanel(direction: 'prev' | 'next') {
    const target = sortedHotspots[activeIdx + (direction === 'prev' ? -1 : 1)]
    if (target) openHotspot(target)
  }

  return (
    <main className={`explore-page explore-page--full xp-scope ${monument.accent}`} style={scopeStyle(accentColor)}>
      <style>{STYLES}</style>

      <SiteHeader
        className="detail-header explore-fixed-header"
        left={
          <Link href={`/monuments/${monument.slug}`} className="text-link">
            <ArrowLeft size={16} /> Monument
          </Link>
        }
        right={
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>
            {exploredIds.length} / {monument.hotspots.length} explored
          </span>
        }
      />

      <div className="explorer-layout">
        <aside className="explorer-sidebar">
          <div className="explorer-sidebar-inner">
            <p className="eyebrow" style={{ color: 'var(--ink)' }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              {monument.subject}
            </p>
            <h1 className="explorer-title">{monument.name}</h1>

            <ProgressSegments total={monument.hotspots.length} count={exploredIds.length} label="chapters explored" />

            {isComplete ? (
              <section className="xp-card xp-card--active xp-complete" aria-live="polite">
                <p className="xp-complete-head">
                  <CheckCircle2 size={22} style={{ flexShrink: 0 }} /> All chapters explored
                </p>
                <Link href={`/challenge/${monument.slug}/instructions`} className="xp-btn xp-btn--solid">
                  View challenge setup <ArrowRight size={16} />
                </Link>
              </section>
            ) : (
              nextTarget && (
                <section className="xp-card xp-card--active xp-qr-side">
                  <div>
                    <p className="xp-label" style={{ margin: 0 }}>Next marker to scan</p>
                    <p className="xp-title" style={{ margin: '4px 0 0' }}>
                      {nextTarget.chapter}: {nextTarget.label}
                    </p>
                  </div>
                  <div className="xp-qr-frame">
                    <HotspotQRCode
                      slug={monument.slug}
                      hotspotId={nextTarget.id}
                      size={168}
                      bgColor="#ffffff"
                      fgColor="#101418"
                    />
                  </div>
                  <p className="xp-muted" style={{ margin: 0 }}>
                    Participants scan this with their phones. Explore all {monument.hotspots.length} chapters to set up
                    the challenge.
                  </p>
                </section>
              )
            )}

            <div className="chapter-list-explorer" style={{ marginTop: 24 }}>
              {sortedHotspots.map((hotspot) => {
                const explored = exploredIds.includes(hotspot.id)
                const active = activeHotspot?.id === hotspot.id
                return (
                  <button
                    key={hotspot.id}
                    className={`chapter-item${explored ? ' explored' : ''}${active ? ' active' : ''}`}
                    onClick={() => openHotspot(hotspot)}
                    aria-label={`${hotspot.chapter}: ${hotspot.label}${explored ? ' (explored)' : ''}`}
                    style={active ? { borderLeftColor: accentColor } : undefined}
                  >
                    <span className="chapter-item-number" style={{ color: 'var(--ink)' }}>
                      {String(hotspot.displayOrder).padStart(2, '0')}
                    </span>
                    <span className="chapter-item-label">{hotspot.label}</span>
                    {explored ? (
                      <CheckCircle2 size={15} style={{ color: accentColor, flexShrink: 0 }} aria-hidden="true" />
                    ) : (
                      <div className="chapter-item-dot" aria-hidden="true" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <div className="explorer-portrait-wrap">
          <div className="explorer-portrait-container">
            <div className="explorer-portrait-bg" aria-label={`${monument.subject} portrait`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={monument.image}
                alt={monument.subject}
                className="portrait-image"
                draggable={false}
                style={{ objectFit: monument.portraitFit ?? 'cover' }}
              />

              {sortedHotspots.map((hotspot) => {
                const explored = exploredIds.includes(hotspot.id)
                const active = activeHotspot?.id === hotspot.id
                const isNext = nextTarget?.id === hotspot.id
                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    className={`xp-marker${explored ? ' is-done' : ''}${active ? ' is-active' : ''}${isNext ? ' is-current' : ''}`}
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    onClick={() => openHotspot(hotspot)}
                    aria-label={`Chapter ${hotspot.displayOrder}: ${hotspot.label}${explored ? ' (explored)' : ''}`}
                    title={`${hotspot.metaphor}: ${hotspot.label}`}
                  >
                    {hotspot.displayOrder}
                  </button>
                )
              })}

              {activeHotspot && (
                <div
                  className="hotspot-active-label"
                  style={{
                    left: `${activeHotspot.x}%`,
                    top: `${activeHotspot.y + 6}%`,
                    background: accentColor,
                    color: readableOn(accentColor),
                  }}
                >
                  {activeHotspot.metaphor}
                </div>
              )}
            </div>
          </div>

          <p className="xp-hint">Tap a numbered marker to open that chapter.</p>
        </div>
      </div>

      {activeHotspot && (
        <ChapterCardDeck
          key={activeHotspot.id}
          monument={monument}
          hotspot={activeHotspot}
          story={activeStory}
          accentColor={accentColor}
          onClose={() => setActiveHotspot(null)}
          nav={{
            onPrev: () => navigatePanel('prev'),
            onNext: () => navigatePanel('next'),
            hasPrev: activeIdx > 0,
            hasNext: activeIdx < sortedHotspots.length - 1,
          }}
        />
      )}
    </main>
  )
}

// ── Route component ────────────────────────────────────────────────────────

export default function ExplorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const searchParams = useSearchParams()
  const justUnlockedId = searchParams.get('unlocked') ?? undefined
  const [monument, setMonument] = useState<Monument | null>(null)
  const [userRole, setUserRole] = useState<'participant' | 'organizer'>('participant')
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const player = getClientSession()
    if (!player) {
      router.replace(`/signin?redirect=/monuments/${slug}/explore`)
      return
    }

    const m = getMonument(slug)
    if (!m) {
      router.replace('/monuments')
      return
    }

    setMonument(m)
    setUserRole(player.userRole)
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

  return userRole === 'participant' ? (
    <ParticipantExplore monument={monument} accentColor={accentColor} justUnlockedId={justUnlockedId} />
  ) : (
    <OrganizerExplore monument={monument} accentColor={accentColor} />
  )
}