'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, X, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, Scan, Camera } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument, Hotspot, Story } from '@/lib/data/index'
import {
  getExploredHotspots,
  markHotspotExplored,
} from '@/lib/storage'
import { getClientSession } from '@/lib/session-client'
import { getWebSocketClient } from '@/lib/websocket'
import SiteHeader from '@/components/SiteHeader'
import HotspotQRCode from '@/components/HotspotQRCode'

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

// ── Participant AR Scanning Flow (Two-Device Experience) ──────────────────

interface ParticipantExploreProps {
  monument: Monument
  accentColor: string
}

function ParticipantExplore({ monument, accentColor }: ParticipantExploreProps) {
  const router = useRouter()
  const [currentHotspotIndex, setCurrentHotspotIndex] = useState(0)
  const [scannedHotspots, setScannedHotspots] = useState<Set<number>>(new Set())
  const [showTopic, setShowTopic] = useState(false)
  const [scanDetected, setScanDetected] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const sortedHotspots = [...monument.hotspots].sort((a, b) => a.displayOrder - b.displayOrder)
  const currentHotspot = sortedHotspots[currentHotspotIndex]
  const allScanned = scannedHotspots.size === sortedHotspots.length

  // Stable hotspot IDs array — avoids re-running the effect on every render
  // (sortedHotspots is re-created each render but its contents don't change)
  const hotspotIds = sortedHotspots.map(h => h.id).join(',')

  // Load progress from database and set up WebSocket
  useEffect(() => {
    const player = getClientSession()
    if (!player) return

    let isMounted = true
    let ws: ReturnType<typeof getWebSocketClient> | null = null
    let removeReconnectCb: (() => void) | null = null

    // Re-usable: fetch latest progress from DB and reconcile local state
    async function loadProgress(showSpinner = true) {
      if (showSpinner && isMounted) setLoading(true)
      try {
        const res = await fetch(`/api/progress?monumentSlug=${monument.slug}`, { cache: 'no-store' })
        if (!res.ok || !isMounted) return

        const { progress } = await res.json()
        const scannedIds = new Set<string>(
          (progress as Array<{ hotspot_id: string }>).map(p => p.hotspot_id)
        )

        // Mirror to localStorage
        scannedIds.forEach(id => markHotspotExplored(monument.slug, id))

        const savedIndices = new Set<number>()
        sortedHotspots.forEach((hotspot, index) => {
          if (scannedIds.has(hotspot.id)) savedIndices.add(index)
        })

        if (!isMounted) return
        setScannedHotspots(savedIndices)

        if (savedIndices.size > 0) {
          const nextUnscanned = sortedHotspots.findIndex((_, i) => !savedIndices.has(i))
          setCurrentHotspotIndex(nextUnscanned !== -1 ? nextUnscanned : sortedHotspots.length - 1)
        }
      } catch (err) {
        console.error('[Explore] Failed to load progress:', err)
      } finally {
        if (isMounted && showSpinner) setLoading(false)
      }
    }

    async function setupWebSocket() {
      if (!player) return

      try {
        ws = getWebSocketClient(player.id, player.displayName)
        await ws.connect()
        if (!isMounted) return

        ws.joinMonument(monument.slug)

        // On reconnect: re-fetch so we don't miss events that arrived while offline
        removeReconnectCb = ws.onReconnectFetch(() => {
          if (isMounted) loadProgress(false)
        })

        const handleHotspotUnlocked = (data: { monumentSlug: string; hotspotId: string }) => {
          if (!isMounted || data.monumentSlug !== monument.slug) return
          console.log('[Explore] hotspot:unlocked', data.hotspotId)

          const hotspotIndex = sortedHotspots.findIndex(h => h.id === data.hotspotId)
          if (hotspotIndex === -1) return

          // Mirror to localStorage
          markHotspotExplored(monument.slug, data.hotspotId)

          setScannedHotspots(prev => {
            if (prev.has(hotspotIndex)) return prev // already tracked
            const next = new Set(prev)
            next.add(hotspotIndex)
            return next
          })

          setCurrentHotspotIndex(current => {
            if (hotspotIndex === current && isMounted) {
              setScanDetected(true)
              setTimeout(() => {
                if (isMounted) {
                  setShowTopic(true)
                  setScanDetected(false)
                }
              }, 1500)
            }
            return current
          })
        }

        const handleConnect = () => {
          if (isMounted) console.log('[Explore] WS connected')
        }
        const handleDisconnect = () => {
          if (isMounted) console.log('[Explore] WS disconnected')
        }

        ws.onHotspotUnlocked(handleHotspotUnlocked)
        ws.onConnect(handleConnect)
        ws.onDisconnect(handleDisconnect)

      } catch (err) {
        console.error('[Explore] WebSocket setup failed:', err)
      }
    }

    loadProgress()
    setupWebSocket()

    return () => {
      isMounted = false
      if (removeReconnectCb) removeReconnectCb()
      if (ws) {
        ws.off('hotspot:unlocked')
        ws.off('connect')
        ws.off('disconnect')
        // Do NOT disconnect the socket — other pages share the singleton
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monument.slug, hotspotIds])

  function handleNext() {
    setShowTopic(false)
    if (currentHotspotIndex < sortedHotspots.length - 1) {
      setCurrentHotspotIndex(currentHotspotIndex + 1)
    }
  }

  function handleStartChallenge() {
    router.push(`/challenge/${monument.slug}/instructions`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner spinner--lg" aria-label="Loading progress…" />
      </div>
    )
  }

  const story = monument.stories.find((s) => s.hotspotId === currentHotspot?.id)

  return (
    <main className={`explore-page explore-page--full ${monument.accent}`}>
      <SiteHeader
        className="detail-header explore-fixed-header"
        left={<Link href={`/monuments/${monument.slug}`} className="text-link"><ArrowLeft size={16} /> Back</Link>}
        right={<span style={{ fontSize: 13, color: 'var(--muted)' }}>{scannedHotspots.size} / {sortedHotspots.length}</span>}
      />

      <div className="explorer-layout">
        {/* Left sidebar - minimal, mysterious */}
        <aside className="explorer-sidebar">
          <div className="explorer-sidebar-inner">
            <p className="eyebrow" style={{ color: accentColor }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              {monument.subject}
            </p>
            <h1 className="explorer-title">{monument.name}</h1>

            {/* Progress bar - subtle */}
            <div className="explorer-progress-bar-wrap">
              <div className="explorer-progress-bar">
                <div
                  className="explorer-progress-fill"
                  style={{
                    width: `${(scannedHotspots.size / sortedHotspots.length) * 100}%`,
                    background: accentColor,
                  }}
                />
              </div>
              <span className="explorer-progress-label">
                {scannedHotspots.size} of {sortedHotspots.length} discovered
              </span>
            </div>

            {!allScanned ? (
              <>
                {/* Mysterious current hotspot hint */}
                {!showTopic && !scanDetected && (
                  <div style={{ 
                    padding: '24px', 
                    background: `${accentColor}05`, 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: `1px solid ${accentColor}20`
                  }}>
                    <p style={{ fontSize: '13px', color: 'var(--ink-light)', fontStyle: 'italic', lineHeight: 1.6 }}>
                      "{currentHotspot.metaphor}"
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px' }}>
                      Seek the glowing marker...
                    </p>
                  </div>
                )}

                {/* Scanning in progress */}
                {scanDetected && (
                  <div style={{ 
                    padding: '24px', 
                    background: `${accentColor}10`, 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: `2px solid ${accentColor}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      width: '60px', 
                      height: '60px', 
                      margin: '0 auto 16px',
                      borderRadius: '50%',
                      border: `3px solid ${accentColor}`,
                      borderTopColor: 'transparent',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ fontSize: '14px', fontWeight: 500, color: accentColor }}>
                      Scanning...
                    </p>
                  </div>
                )}

                {/* Topic revealed */}
                {showTopic && (
                  <div style={{ 
                    padding: '24px', 
                    background: `${accentColor}10`, 
                    borderRadius: '12px', 
                    marginBottom: '20px',
                    border: `2px solid ${accentColor}30`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <CheckCircle2 size={20} style={{ color: accentColor }} />
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: accentColor }}>
                        {currentHotspot.chapter}
                      </h4>
                    </div>
                    
                    <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                      {currentHotspot.label}
                    </h3>
                    
                    <div style={{ 
                      fontSize: '14px', 
                      lineHeight: 1.7, 
                      color: 'var(--ink)',
                      marginBottom: '16px'
                    }}>
                      {story?.body ? story.body.split('\n\n').map((para, i) => (
                        <p key={i} style={{ marginBottom: '12px' }}>{para}</p>
                      )) : <p>The story of {currentHotspot.label} unfolds here...</p>}
                    </div>
                    
                    <button 
                      className="button"
                      style={{ background: accentColor, color: '#fff', width: '100%' }}
                      onClick={handleNext}
                    >
                      {currentHotspotIndex < sortedHotspots.length - 1 ? 'Continue Journey →' : 'Complete Quest'}
                    </button>
                  </div>
                )}

                {/* Discovered chapters list */}
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--muted)' }}>
                    DISCOVERED
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sortedHotspots.map((hotspot, i) => {
                      const discovered = scannedHotspots.has(i)
                      const active = i === currentHotspotIndex
                      
                      if (!discovered && !active) return null // Hide undiscovered
                      
                      return (
                        <div
                          key={hotspot.id}
                          style={{
                            padding: '10px 12px',
                            background: discovered ? `${accentColor}08` : 'transparent',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            border: active ? `1px solid ${accentColor}40` : '1px solid transparent',
                            opacity: discovered ? 1 : 0.5
                          }}
                        >
                          {discovered ? (
                            <CheckCircle2 size={16} style={{ color: accentColor, flexShrink: 0 }} />
                          ) : (
                            <div style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%', 
                              border: `2px solid ${accentColor}`, 
                              flexShrink: 0 
                            }} />
                          )}
                          <span style={{ fontSize: '13px', fontWeight: discovered ? 500 : 400 }}>
                            {hotspot.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="explorer-unlock">
                <div className="explorer-unlock-badge" style={{ borderColor: accentColor, color: accentColor }}>
                  <CheckCircle2 size={18} /> Quest Complete
                </div>
                <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginTop: '12px', marginBottom: '20px' }}>
                  You've uncovered all secrets. The final challenge awaits...
                </p>
                <button
                  onClick={handleStartChallenge}
                  className="button button-dark explorer-challenge-btn"
                >
                  Accept the Challenge <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right: Portrait with mysterious pulsating hotspot */}
        <div className="explorer-portrait-wrap">
          <div className="explorer-portrait-container">
            <div
              className="explorer-portrait-bg"
              aria-label={`${monument.subject} portrait`}
            >
              {/* Portrait image */}
              {monument.slug === 'tinubu' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/tinubu.png"
                  alt="Discover the mysteries"
                  className="portrait-image"
                  draggable={false}
                  style={{ filter: !allScanned ? 'brightness(0.95)' : 'brightness(1)' }}
                />
              ) : monument.slug === 'sanwo-olu' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/sanwo-olu.png"
                  alt="Discover the mysteries"
                  className="portrait-image"
                  draggable={false}
                  style={{ filter: !allScanned ? 'brightness(0.95)' : 'brightness(1)' }}
                />
              ) : (
                <div className="portrait-silhouette" style={{ background: monument.accent === 'green' ? '#d6ead9' : '#d5eaf5' }}>
                  <div className="silhouette-figure" style={{ background: accentColor }} />
                </div>
              )}

              {/* ONLY current pulsating hotspot - AR marker (display only, not clickable) */}
              {!allScanned && !showTopic && (
                <div
                  className="hotspot-btn hotspot-active hotspot-pulsating"
                  role="img"
                  aria-label={`Active hotspot: ${currentHotspot.label} — scan with AR scanner`}
                  style={{
                    left: `${currentHotspot.x}%`,
                    top: `${currentHotspot.y}%`,
                    borderColor: accentColor,
                    background: scanDetected ? `${accentColor}dd` : accentColor,
                    color: '#fff',
                    transform: scanDetected ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(1.2)',
                    zIndex: 10,
                    boxShadow: scanDetected ? 'none' : `0 0 0 4px ${accentColor}33, 0 0 20px ${accentColor}66`,
                    animation: scanDetected ? 'none' : 'pulse-hotspot 2s infinite',
                    cursor: 'default',
                    transition: 'all 0.3s ease',
                    fontSize: '18px',
                    fontWeight: 700,
                    pointerEvents: 'none',
                  }}
                  data-ar-marker={`hotspot-${currentHotspot.id}`}
                >
                  {scanDetected ? <Scan size={16} /> : currentHotspot.displayOrder}
                </div>
              )}

              {/* Discovered hotspots - faded */}
              {sortedHotspots.map((hotspot, i) => {
                const isDiscovered = scannedHotspots.has(i)
                const isCurrent = i === currentHotspotIndex
                
                if (!isDiscovered || isCurrent) return null
                
                return (
                  <div
                    key={hotspot.id}
                    className="hotspot-btn hotspot-explored"
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      borderColor: `${accentColor}60`,
                      background: `${accentColor}30`,
                      color: '#fff',
                      pointerEvents: 'none',
                      opacity: 0.4,
                      fontSize: '10px'
                    }}
                  >
                    ✓
                  </div>
                )
              })}
            </div>
          </div>

          {/* Subtle hint with scanner link */}
          {!allScanned && !showTopic && (
            <div style={{ 
              padding: '16px', 
              textAlign: 'center',
              marginTop: '16px'
            }}>
              <p style={{ fontSize: '12px', color: 'var(--muted)', fontStyle: 'italic', marginBottom: '12px' }}>
                Use your phone to scan the glowing marker...
              </p>
              <Link
                href={`/monuments/${monument.slug}/scanner`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: `${accentColor}15`,
                  color: accentColor,
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  border: `1px solid ${accentColor}30`,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = `${accentColor}25`}
                onMouseLeave={(e) => e.currentTarget.style.background = `${accentColor}15`}
              >
                <Camera size={16} /> Open AR Scanner
              </Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-hotspot {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1.2); 
            box-shadow: 0 0 0 4px ${accentColor}33, 0 0 20px ${accentColor}66;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.4); 
            box-shadow: 0 0 0 8px ${accentColor}55, 0 0 30px ${accentColor}88;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  )
}

// ── Organizer Explorer (original implementation) ───────────────────────────

interface OrganizerExploreProps {
  monument: Monument
}

function OrganizerExplore({ monument }: OrganizerExploreProps) {
  const [exploredIds, setExploredIds] = useState<string[]>([])
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null)
  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'
  const isComplete = exploredIds.length >= monument.hotspots.length

  // Organizer: start from localStorage for instant render, then reconcile with DB
  useEffect(() => {
    // Show locally cached data immediately
    const localIds = getExploredHotspots(monument.slug)
    setExploredIds(localIds)

    // Reconcile with DB in the background (organizer may use different devices)
    fetch(`/api/progress?monumentSlug=${monument.slug}`, { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.progress) return
        const dbIds: string[] = data.progress.map((p: { hotspot_id: string }) => p.hotspot_id)
        // Merge: union of local + DB
        const merged = Array.from(new Set([...localIds, ...dbIds]))
        merged.forEach(id => markHotspotExplored(monument.slug, id))
        setExploredIds(merged)
      })
      .catch(() => { /* non-fatal */ })
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

  return (
    <main className={`explore-page explore-page--full ${monument.accent}`}>
      <SiteHeader
        className="detail-header explore-fixed-header"
        left={<Link href={`/monuments/${monument.slug}`} className="text-link"><ArrowLeft size={16} /> Monument</Link>}
        right={<span style={{ fontSize: 13, color: 'var(--muted)' }}>{exploredIds.length} / {monument.hotspots.length} explored</span>}
      />

      <div className="explorer-layout">
        <aside className="explorer-sidebar">
          <div className="explorer-sidebar-inner">
            <p className="eyebrow" style={{ color: accentColor }}>
              <span className="eyebrow-line" style={{ background: accentColor }} />
              {monument.subject}
            </p>
            <h1 className="explorer-title">{monument.name}</h1>

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

            {isComplete ? (
              <div className="explorer-unlock">
                <div className="explorer-unlock-badge" style={{ borderColor: accentColor, color: accentColor }}>
                  <CheckCircle2 size={18} /> All {monument.hotspots.length} chapters explored
                </div>
                <Link
                  href={`/challenge/${monument.slug}/instructions`}
                  className="button button-dark explorer-challenge-btn"
                >
                  View Challenge Setup <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <p className="explorer-cta-hint">
                Tap any hotspot on the portrait to open a chapter. Explore all {monument.hotspots.length} to set up the challenge.
              </p>
            )}
          </div>
        </aside>

        <div className="explorer-portrait-wrap">
          <div className="explorer-portrait-container">
            <div
              className="explorer-portrait-bg"
              aria-label={`${monument.subject} portrait`}
            >
              {monument.slug === 'tinubu' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/tinubu.png"
                  alt="President Bola Ahmed Tinubu"
                  className="portrait-image"
                  draggable={false}
                />
              ) : monument.slug === 'sanwo-olu' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/sanwo-olu.png"
                  alt="Governor Babajide Sanwo-Olu"
                  className="portrait-image"
                  draggable={false}
                />
              ) : (
                <div className="portrait-silhouette" style={{ background: monument.accent === 'green' ? '#d6ead9' : '#d5eaf5' }}>
                  <div className="silhouette-figure" style={{ background: accentColor }} />
                  <span className="portrait-label">{monument.subject}</span>
                </div>
              )}

              {sortedHotspots.map((hotspot) => {
                const explored = exploredIds.includes(hotspot.id)
                const active = activeHotspot?.id === hotspot.id
                // The next unexplored hotspot is the one participants need to scan
                const isNextTarget = !explored && exploredIds.length === sortedHotspots.indexOf(hotspot)
                return (
                  <button
                    key={hotspot.id}
                    className={`hotspot-btn${explored ? ' hotspot-explored' : ''}${active ? ' hotspot-active' : ''}`}
                    style={{
                      left: `${hotspot.x}%`,
                      top: `${hotspot.y}%`,
                      borderColor: accentColor,
                      background: explored ? accentColor : 'rgba(255,255,255,0.92)',
                      color: explored ? '#fff' : accentColor,
                      ...(active ? { transform: 'translate(-50%, -50%) scale(1.25)', zIndex: 10, boxShadow: `0 0 0 4px ${accentColor}33` } : {}),
                      ...(isNextTarget ? { animation: 'pulse-hotspot-org 2s infinite', zIndex: 10 } : {}),
                    }}
                    onClick={() => openHotspot(hotspot)}
                    aria-label={`Chapter ${hotspot.displayOrder}: ${hotspot.label}${explored ? ' — explored' : ''}`}
                    title={`${hotspot.metaphor}: ${hotspot.label}`}
                  >
                    {isNextTarget ? (
                      /* Show QR code for the active scan target */
                      <HotspotQRCode
                        slug={monument.slug}
                        hotspotId={hotspot.id}
                        size={64}
                        bgColor="transparent"
                        fgColor={accentColor}
                      />
                    ) : (
                      hotspot.displayOrder
                    )}
                  </button>
                )
              })}

              {activeHotspot && (
                <div
                  className="hotspot-active-label"
                  style={{
                    left: `${activeHotspot.x}%`,
                    top: `${activeHotspot.y + 5}%`,
                    background: accentColor,
                  }}
                >
                  {activeHotspot.metaphor}
                </div>
              )}
            </div>
          </div>

          <p className="portrait-mobile-hint">Tap a numbered marker to explore that chapter</p>
        </div>
      </div>

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

export default function ExplorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="spinner spinner--lg" aria-label="Loading…" />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'

  return userRole === 'participant' ? (
    <ParticipantExplore monument={monument} accentColor={accentColor} />
  ) : (
    <OrganizerExplore monument={monument} />
  )
}
