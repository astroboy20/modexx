'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, X, ExternalLink, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument, Hotspot, Story } from '@/lib/data/index'
import {
  getProfile,
  getExploredHotspots,
  markHotspotExplored,
} from '@/lib/storage'

// ── Story Panel ────────────────────────────────────────────────────────────

interface StoryPanelProps {
  monument: Monument
  hotspot: Hotspot
  story: Story | undefined
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  accentColor: string
}

function StoryPanel({ monument, hotspot, story, onClose, onPrev, onNext, hasPrev, hasNext, accentColor }: StoryPanelProps) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onPrev()
      if (e.key === 'ArrowRight' && hasNext) onNext()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, onPrev, onNext, hasPrev, hasNext])

  return (
    <div className="story-overlay" role="dialog" aria-modal="true" aria-label={`Story: ${hotspot.label}`} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="story-panel">
        <div className="story-panel-header">
          <span className="story-chapter-label" style={{ color: accentColor }}>{hotspot.chapter}</span>
          <button className="story-close" onClick={onClose} aria-label="Close story"><X size={20} /></button>
        </div>

        <div className="story-panel-body">
          <p className="story-metaphor">{hotspot.metaphor}</p>
          <h2 className="story-title">{story?.headline || hotspot.label}</h2>
          <p className="story-date">{story?.dateLabel}</p>

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
          <button className="story-nav-btn" onClick={onPrev} disabled={!hasPrev} aria-label="Previous chapter">
            <ChevronLeft size={18} /> Prev
          </button>
          <span className="story-progress-label">
            {hotspot.displayOrder} / {monument.hotspots.length}
          </span>
          <button className="story-nav-btn" onClick={onNext} disabled={!hasNext} aria-label="Next chapter">
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Explorer ──────────────────────────────────────────────────────────

interface ExploreClientProps {
  monument: Monument
}

function ExploreClient({ monument }: ExploreClientProps) {
  const router = useRouter()
  const [exploredIds, setExploredIds] = useState<string[]>([])
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const isComplete = exploredIds.length >= monument.hotspots.length

  // Load persisted progress
  useEffect(() => {
    setExploredIds(getExploredHotspots(monument.slug))
  }, [monument.slug])

  function openHotspot(hotspot: Hotspot) {
    setActiveHotspot(hotspot)
    if (!exploredIds.includes(hotspot.id)) {
      markHotspotExplored(monument.slug, hotspot.id)
      setExploredIds((prev) => [...prev, hotspot.id])
    }
  }

  function closePanel() {
    setActiveHotspot(null)
  }

  const sortedHotspots = [...monument.hotspots].sort((a, b) => a.displayOrder - b.displayOrder)

  function navigatePanel(direction: 'prev' | 'next') {
    if (!activeHotspot) return
    const idx = sortedHotspots.findIndex((h) => h.id === activeHotspot.id)
    const next = direction === 'prev' ? sortedHotspots[idx - 1] : sortedHotspots[idx + 1]
    if (next) {
      openHotspot(next)
    }
  }

  const activeIdx = activeHotspot ? sortedHotspots.findIndex((h) => h.id === activeHotspot.id) : -1
  const activeStory = activeHotspot ? monument.stories.find((s) => s.hotspotId === activeHotspot.id) : undefined

  // Gate challenge CTA: need a profile to start the quiz
  function handleChallengeClick(e: React.MouseEvent) {
    const profile = getProfile()
    if (!profile) {
      e.preventDefault()
      router.push(`/signup?redirect=/challenge/${monument.slug}/instructions`)
    }
  }

  return (
    <main className={`explore-page explore-page--full ${monument.accent}`}>
      {/* Header */}
      <header className="site-header detail-header explore-fixed-header">
        <Link href={`/monuments/${monument.slug}`} className="text-link">
          <ArrowLeft size={16} /> Monument
        </Link>
        <Link href="/" className="wordmark"><span>mod</span>exx<span className="wordmark-dot">.</span></Link>
        <span className="detail-index">{exploredIds.length} / {monument.hotspots.length} explored</span>
      </header>

      <div className="explorer-layout">
        {/* Left: Info + chapter list */}
        <aside className="explorer-sidebar">
          <div className="explorer-sidebar-inner">
            <p className="eyebrow" style={{ color: accentColor }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              {monument.subject}
            </p>
            <h1 className="explorer-title">{monument.name}</h1>

            {/* Progress bar */}
            <div className="explorer-progress-bar-wrap">
              <div className="explorer-progress-bar">
                <div
                  className="explorer-progress-fill"
                  style={{
                    width: `${(exploredIds.length / monument.hotspots.length) * 100}%`,
                    background: accentColor,
                  }}
                />
              </div>
              <span className="explorer-progress-label">
                {exploredIds.length} of {monument.hotspots.length} chapters explored
              </span>
            </div>

            {/* Chapter list */}
            <div className="chapter-list-explorer">
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
                    <span className="chapter-item-number" style={{ color: accentColor }}>
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

            {/* CTA */}
            {isComplete ? (
              <div className="explorer-unlock">
                <div className="explorer-unlock-badge" style={{ borderColor: accentColor, color: accentColor }}>
                  <CheckCircle2 size={18} /> All 10 chapters explored
                </div>
                <Link
                  href={`/challenge/${monument.slug}/instructions`}
                  className="button button-dark explorer-challenge-btn"
                  onClick={handleChallengeClick}
                >
                  Begin the challenge <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <p className="explorer-cta-hint">
                Tap any hotspot on the portrait to open a chapter. Explore all {monument.hotspots.length} to unlock the trivia challenge.
              </p>
            )}
          </div>
        </aside>

        {/* Right: Portrait with hotspots */}
        <div className="explorer-portrait-wrap">
          <div className="explorer-portrait-container">
            {/* Portrait placeholder — replace src with real portrait */}
            <div className="explorer-portrait-bg" aria-label={`${monument.subject} portrait`}>
              {/* Placeholder silhouette */}
              <div className="portrait-silhouette" style={{ background: monument.accent === 'green' ? '#d6ead9' : '#d5eaf5' }}>
                <div className="silhouette-figure" style={{ background: accentColor }} />
                <span className="portrait-label">{monument.subject}</span>
              </div>

              {/* Hotspot buttons */}
              {sortedHotspots.map((hotspot) => {
                const explored = exploredIds.includes(hotspot.id)
                const active = activeHotspot?.id === hotspot.id
                return (
                  <button
                    key={hotspot.id}
                    className={`hotspot-btn${explored ? ' hotspot-explored' : ''}${active ? ' hotspot-active' : ''}`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      borderColor: accentColor,
                      background: explored ? accentColor : '#fff',
                      color: explored ? '#fff' : accentColor,
                      ...(active ? { transform: 'translate(-50%, -50%) scale(1.2)', zIndex: 10 } : {}),
                    }}
                    onClick={() => openHotspot(hotspot)}
                    aria-label={`Chapter ${hotspot.displayOrder}: ${hotspot.label}${explored ? ' — explored' : ''}`}
                    title={`${hotspot.metaphor}: ${hotspot.label}`}
                  >
                    {hotspot.displayOrder}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mobile chapter selector hint */}
          <p className="portrait-mobile-hint">Tap a numbered marker to explore that chapter</p>
        </div>
      </div>

      {/* Story Panel Overlay */}
      {activeHotspot && (
        <StoryPanel
          monument={monument}
          hotspot={activeHotspot}
          story={activeStory}
          onClose={closePanel}
          onPrev={() => navigatePanel('prev')}
          onNext={() => navigatePanel('next')}
          hasPrev={activeIdx > 0}
          hasNext={activeIdx < sortedHotspots.length - 1}
          accentColor={accentColor}
        />
      )}
    </main>
  )
}

// ── Route component ────────────────────────────────────────────────────────

export default function ExplorePage({ params }: { params: { slug: string } }) {
  const [monument, setMonument] = useState<Monument | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const m = getMonument(params.slug)
    if (!m) {
      window.location.replace('/monuments')
      return
    }
    setMonument(m)
    setReady(true)
  }, [params.slug])

  if (!ready || !monument) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Loading…</p>
      </div>
    )
  }

  return <ExploreClient monument={monument} />
}
