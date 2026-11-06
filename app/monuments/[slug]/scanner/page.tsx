'use client'

/**
 * AR Scanner Page — MindAR Image Tracking
 *
 * Flow:
 * 1. Fetch which hotspot is currently active (the pulsating one) from the progress API
 * 2. Load Three.js + MindAR via CDN, then compile the portrait image into a
 *    MindAR image target in the browser (no pre-built .mind file needed)
 * 3. Start the MindAR Controller — it opens the device back camera and looks
 *    for the portrait image in the viewfinder
 * 4. When the portrait is stably detected for STABLE_TRACK_MS → the participant
 *    is pointing at the correct display → auto-unlock the current pulsating hotspot
 * 5. Persist to DB, broadcast via WebSocket, navigate to explore
 *
 * The pulsating hotspot on the explore page is NOT clickable.
 * Detection requires the participant to physically point their phone camera at
 * the organiser's screen displaying the portrait. That is the AR scanning action.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, CheckCircle2, X, AlertCircle, ScanLine } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { getClientSession } from '@/lib/session-client'
import { markHotspotExplored } from '@/lib/storage'
import { getWebSocketClient } from '@/lib/websocket'

// ── MindAR global types (loaded via CDN at runtime) ────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    THREE: any
    MINDAR: {
      IMAGE: {
        MindARThree: new (options: {
          container: HTMLElement
          imageTargetSrc: string
          maxTrack?: number
          uiLoading?: string
          uiScanning?: string
          uiError?: string
        }) => MindARThreeInstance
        Compiler: new () => MindARCompiler
      }
    }
  }
}

interface MindARThreeInstance {
  start(): Promise<void>
  stop(): void
  addAnchor(targetIndex: number): MindARAnchor
}

interface MindARAnchor {
  onTargetFound?: () => void
  onTargetLost?: () => void
}

interface MindARCompiler {
  compileImageTargets(
    images: HTMLImageElement[],
    progress: (p: number) => void
  ): Promise<unknown[]>
  exportData(): Promise<ArrayBuffer>
}

// ── Phase type ─────────────────────────────────────────────────────────────

type Phase =
  | 'loading'      // waiting for monument + progress API
  | 'compiling'    // loading CDN scripts + compiling portrait to .mind
  | 'starting'     // starting camera / MindAR
  | 'scanning'     // camera active, watching for portrait
  | 'saving'       // portrait detected, persisting to DB
  | 'success'      // saved, showing success screen
  | 'no-target'    // all hotspots already scanned
  | 'error'        // something went wrong

// ── CDN script loaders ─────────────────────────────────────────────────────

// Track in-flight script loads so a second call doesn't resolve before the
// script has actually executed (the script tag exists but onload hasn't fired yet).
const scriptLoadPromises = new Map<string, Promise<void>>()

function loadScript(src: string): Promise<void> {
  // Return the existing promise if already in-flight or completed
  if (scriptLoadPromises.has(src)) {
    return scriptLoadPromises.get(src)!
  }

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)
    if (existing) {
      // Tag exists but may still be loading — wait for its events
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load: ${src}`)), { once: true })
      // If it already finished loading (readyState isn't a thing for scripts,
      // but if MINDAR/THREE are already on window we can resolve immediately)
      if (
        (src.includes('three') && window.THREE) ||
        (src.includes('mindar') && window.MINDAR?.IMAGE)
      ) {
        resolve()
      }
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load: ${src}`))
    document.head.appendChild(s)
  })

  scriptLoadPromises.set(src, promise)
  return promise
}

/** Poll until window.MINDAR.IMAGE is set (it may be assigned a tick after onload) */
function waitForMindAR(timeoutMs = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.MINDAR?.IMAGE) { resolve(); return }
    const deadline = Date.now() + timeoutMs
    const id = setInterval(() => {
      if (window.MINDAR?.IMAGE) {
        clearInterval(id)
        resolve()
      } else if (Date.now() > deadline) {
        clearInterval(id)
        reject(new Error('MindAR did not initialise after script load'))
      }
    }, 50)
  })
}

async function ensureMindAR(): Promise<void> {
  if (window.MINDAR?.IMAGE) return

  // Three.js must load before MindAR
  if (!window.THREE) {
    await loadScript('https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.min.js')
  }
  await loadScript(
    'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js'
  )

  // window.MINDAR may be set a microtask after onload — poll briefly
  await waitForMindAR()
}

// ── Constants ──────────────────────────────────────────────────────────────

/** Portrait must be continuously tracked for this many ms before triggering */
const STABLE_TRACK_MS = 800

/** Minimum ms between consecutive triggers */
const COOLDOWN_MS = 4000

// ── Component ──────────────────────────────────────────────────────────────

export default function ScannerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router = useRouter()

  const [monument, setMonument] = useState<Monument | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [compileProgress, setCompileProgress] = useState(0)
  const [targetLabel, setTargetLabel] = useState('')
  const [detectedLabel, setDetectedLabel] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // These never need to trigger re-renders — use refs
  const targetHotspotIdRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mindARRef = useRef<MindARThreeInstance | null>(null)
  const trackingStartRef = useRef<number>(0)
  const lastTriggerRef = useRef<number>(0)
  const isSavingRef = useRef(false)
  const isMountedRef = useRef(true)
  const objectUrlRef = useRef<string | null>(null)

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      teardownMindAR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const teardownMindAR = useCallback(() => {
    try { mindARRef.current?.stop() } catch { /* ignore */ }
    mindARRef.current = null
    trackingStartRef.current = 0

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }, [])

  // ── Step 1: load monument ──────────────────────────────────────────────────

  useEffect(() => {
    const m = getMonument(slug)
    if (!m) { router.replace('/monuments'); return }
    setMonument(m)
  }, [slug, router])

  // ── Step 2: fetch active hotspot ───────────────────────────────────────────

  useEffect(() => {
    if (!monument) return
    let cancelled = false

    async function fetchTarget() {
      try {
        const res = await fetch(`/api/progress?monumentSlug=${slug}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load progress')

        const { progress } = await res.json()
        const scannedIds = new Set<string>(
          (progress as Array<{ hotspot_id: string }>).map(p => p.hotspot_id)
        )
        const sorted = [...monument!.hotspots].sort((a, b) => a.displayOrder - b.displayOrder)
        const next = sorted.find(h => !scannedIds.has(h.id))

        if (cancelled) return

        if (!next) {
          setPhase('no-target')
          return
        }

        targetHotspotIdRef.current = next.id
        setTargetLabel(next.label)
        setPhase('compiling')       // signal to next effect
      } catch (err) {
        if (cancelled) return
        console.error('[Scanner] fetchTarget:', err)
        setErrorMsg('Could not load your progress. Please try again.')
        setPhase('error')
      }
    }

    fetchTarget()
    return () => { cancelled = true }
  }, [monument, slug])

  // ── Step 3: compile portrait + start MindAR ────────────────────────────────
  // Runs only once when phase becomes 'compiling'

  useEffect(() => {
    if (phase !== 'compiling') return
    if (!monument || !targetHotspotIdRef.current || !containerRef.current) return

    let cancelled = false
    let checkIntervalId: ReturnType<typeof setInterval> | null = null

    async function initAR() {
      try {
        // Load CDN scripts
        await ensureMindAR()
        if (cancelled || !isMountedRef.current) return

        // Load portrait image
        const portraitSrc = monument!.slug === 'tinubu' ? '/tinubu.png' : '/sanwo-olu.png'
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load portrait image'))
          img.src = portraitSrc
        })
        if (cancelled || !isMountedRef.current) return

        // Compile portrait → .mind buffer in the browser
        const compiler = new window.MINDAR.IMAGE.Compiler()
        await compiler.compileImageTargets([img], (p: number) => {
          if (isMountedRef.current) setCompileProgress(Math.round(p))
        })
        if (cancelled || !isMountedRef.current) return

        const buffer = await compiler.exportData()
        if (cancelled || !isMountedRef.current) return

        // Create a blob URL for the compiled target data
        const blob = new Blob([buffer])
        const targetSrc = URL.createObjectURL(blob)
        objectUrlRef.current = targetSrc

        // Create MindAR instance
        setPhase('starting')
        const mindAR = new window.MINDAR.IMAGE.MindARThree({
          container: containerRef.current!,
          imageTargetSrc: targetSrc,
          maxTrack: 1,
          uiLoading: 'no',
          uiScanning: 'no',
          uiError: 'no',
        })
        mindARRef.current = mindAR

        // Anchor for image target index 0 (our portrait)
        const anchor = mindAR.addAnchor(0)

        anchor.onTargetFound = () => {
          if (!isMountedRef.current || isSavingRef.current) return
          console.log('[Scanner] Portrait found')
          trackingStartRef.current = Date.now()
        }

        anchor.onTargetLost = () => {
          if (!isMountedRef.current) return
          console.log('[Scanner] Portrait lost')
          trackingStartRef.current = 0
        }

        // Start camera tracking
        await mindAR.start()
        if (cancelled || !isMountedRef.current) return

        setPhase('scanning')

        // Poll: trigger once the portrait has been stably tracked
        checkIntervalId = setInterval(() => {
          if (!isMountedRef.current || isSavingRef.current) return
          if (trackingStartRef.current === 0) return

          const elapsed = Date.now() - trackingStartRef.current
          const cooldownOk = Date.now() - lastTriggerRef.current > COOLDOWN_MS

          if (elapsed >= STABLE_TRACK_MS && cooldownOk) {
            lastTriggerRef.current = Date.now()
            if (checkIntervalId) clearInterval(checkIntervalId)
            triggerDetection()
          }
        }, 100)

      } catch (err) {
        if (cancelled || !isMountedRef.current) return
        console.error('[Scanner] initAR error:', err)
        const msg = err instanceof Error ? err.message : 'Failed to start AR scanner'
        setErrorMsg(
          msg.includes('camera') || msg.includes('permission')
            ? 'Camera permission denied. Please allow camera access and try again.'
            : msg
        )
        setPhase('error')
      }
    }

    initAR()

    return () => {
      cancelled = true
      if (checkIntervalId) clearInterval(checkIntervalId)
      teardownMindAR()
    }
  // phase is the only trigger; monument/targetHotspotId don't change once compiling starts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Trigger detection (portrait stably in frame) ───────────────────────────

  async function triggerDetection() {
    if (isSavingRef.current) return
    isSavingRef.current = true

    const hotspotId = targetHotspotIdRef.current
    if (!hotspotId || !monument) {
      isSavingRef.current = false
      return
    }

    const player = getClientSession()
    if (!player) {
      router.replace(`/signin?redirect=/monuments/${slug}/scanner`)
      return
    }

    setDetectedLabel(targetLabel)
    setPhase('saving')

    try {
      // 1. Persist to database
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monumentSlug: slug, hotspotId }),
      })
      if (!res.ok && res.status !== 409) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
      }

      // 2. Mirror to localStorage
      markHotspotExplored(slug, hotspotId)

      // 3. Broadcast via WebSocket
      try {
        const ws = getWebSocketClient(player.id, player.displayName)
        if (!ws.isConnected()) {
          await Promise.race([ws.connect(), new Promise(r => setTimeout(r, 2000))])
        }
        ws.joinMonument(slug)
        ws.sendScannerDetection(slug, hotspotId)
      } catch (wsErr) {
        console.warn('[Scanner] WS broadcast failed (non-fatal):', wsErr)
      }

      if (!isMountedRef.current) return
      setPhase('success')

      setTimeout(() => {
        if (!isMountedRef.current) return
        teardownMindAR()
        router.push(`/monuments/${slug}/explore`)
      }, 2200)

    } catch (err) {
      console.error('[Scanner] save error:', err)
      if (!isMountedRef.current) return
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save scan.')
      setPhase('error')
      isSavingRef.current = false
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!monument) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000' }}>
        <span className="spinner spinner--lg" style={{ color: '#fff' }} />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'

  // ── Success ────────────────────────────────────────────────────────────────
  if (phase === 'success') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${accentColor}, ${monument.accent === 'green' ? '#0d5230' : '#2d5a7b'})`,
        color: '#fff', padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          borderRadius: '24px', padding: '48px 32px', maxWidth: '400px', width: '100%',
          border: '2px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{
            width: '80px', height: '80px', margin: '0 auto 24px',
            background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle2 size={48} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px' }}>Hotspot Unlocked!</h1>
          <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: 1.6, marginBottom: '8px' }}>
            <strong>{detectedLabel}</strong>
          </p>
          <p style={{ fontSize: '14px', opacity: 0.7 }}>Returning to exploration…</p>
        </div>
      </div>
    )
  }

  // ── All scanned ────────────────────────────────────────────────────────────
  if (phase === 'no-target') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f0f0f', color: '#fff', padding: '32px', textAlign: 'center',
      }}>
        <div style={{
          background: `${accentColor}20`, border: `1px solid ${accentColor}40`,
          borderRadius: '16px', padding: '40px 32px', maxWidth: '360px',
        }}>
          <CheckCircle2 size={48} style={{ color: accentColor, marginBottom: '20px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>All hotspots scanned!</h2>
          <p style={{ fontSize: '14px', opacity: 0.7, lineHeight: 1.6, marginBottom: '24px' }}>
            You've completed all chapters. Head back to start the challenge.
          </p>
          <Link
            href={`/monuments/${slug}/explore`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: accentColor, color: '#fff',
              padding: '12px 24px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}
          >
            Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0f0f0f', color: '#fff', padding: '32px', textAlign: 'center',
      }}>
        <div style={{
          background: 'rgba(217,46,53,0.1)', border: '1px solid rgba(217,46,53,0.3)',
          borderRadius: '16px', padding: '40px 32px', maxWidth: '380px',
        }}>
          <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px' }}>Scanner Error</h2>
          <p style={{ fontSize: '14px', color: '#ff9999', lineHeight: 1.6, marginBottom: '24px' }}>
            {errorMsg}
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setErrorMsg('')
                setCompileProgress(0)
                isSavingRef.current = false
                setPhase('compiling')
              }}
              style={{
                background: accentColor, color: '#fff', border: 'none',
                padding: '12px 24px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <Link
              href={`/monuments/${slug}/explore`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                padding: '12px 24px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Active scanner UI (compiling / starting / scanning / saving) ───────────

  const isScanning = phase === 'scanning'

  return (
    <div style={{ minHeight: '100vh', background: '#000', position: 'relative', overflow: 'hidden' }}>

      {/* Back / close header — always visible */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        padding: '16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none',
      }}>
        <Link
          href={`/monuments/${slug}/explore`}
          onClick={teardownMindAR}
          style={{
            color: '#fff', display: 'flex', alignItems: 'center',
            gap: '8px', fontSize: '14px', textDecoration: 'none',
            pointerEvents: 'all',
          }}
        >
          <ArrowLeft size={20} /> Back
        </Link>
        {isScanning && (
          <button
            onClick={() => { teardownMindAR(); router.push(`/monuments/${slug}/explore`) }}
            aria-label="Close scanner"
            style={{
              background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', pointerEvents: 'all',
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* MindAR injects its camera video + canvas here */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', inset: 0,
          // Only show when actually scanning; otherwise the loading UI sits on top
          visibility: isScanning ? 'visible' : 'hidden',
        }}
      />

      {/* Scanning frame + instructions (only when camera is active) */}
      {isScanning && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {/* Portrait-shaped detection frame */}
          <div style={{
            width: '240px', height: '324px',        // matches ~759:1024 portrait ratio
            position: 'relative',
            border: `2px solid ${accentColor}`,
            borderRadius: '12px',
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.5), 0 0 40px ${accentColor}55`,
          }}>
            {/* Corner brackets */}
            {(['tl', 'tr', 'bl', 'br'] as const).map(pos => (
              <div key={pos} style={{
                position: 'absolute', width: '24px', height: '24px',
                ...(pos.includes('t') ? { top: '-2px' } : { bottom: '-2px' }),
                ...(pos.includes('l') ? { left: '-2px' } : { right: '-2px' }),
                borderTop: pos.includes('t') ? `4px solid ${accentColor}` : 'none',
                borderBottom: pos.includes('b') ? `4px solid ${accentColor}` : 'none',
                borderLeft: pos.includes('l') ? `4px solid ${accentColor}` : 'none',
                borderRight: pos.includes('r') ? `4px solid ${accentColor}` : 'none',
                borderRadius:
                  pos === 'tl' ? '4px 0 0 0'
                  : pos === 'tr' ? '0 4px 0 0'
                  : pos === 'bl' ? '0 0 0 4px'
                  : '0 0 4px 0',
              }} />
            ))}

            {/* Animated scan laser */}
            <div style={{
              position: 'absolute', left: '8px', right: '8px', height: '2px',
              background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              borderRadius: '1px',
              animation: 'scan-laser 2.4s ease-in-out infinite',
            }} />

            {/* Dashed inner guide */}
            <div style={{
              position: 'absolute', inset: '16px',
              border: `1px dashed ${accentColor}33`,
              borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: '9px', letterSpacing: '1px',
                textTransform: 'uppercase', color: `${accentColor}66`,
              }}>
                portrait here
              </span>
            </div>
          </div>

          {/* Status text below frame */}
          <div style={{
            position: 'absolute', bottom: '80px', left: 0, right: 0,
            textAlign: 'center', color: '#fff', padding: '0 24px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', marginBottom: '8px',
            }}>
              <ScanLine size={18} style={{ color: accentColor }} />
              <p style={{ fontSize: '16px', fontWeight: 600, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                Aim at the portrait display
              </p>
            </div>
            <p style={{
              fontSize: '13px', opacity: 0.7,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              marginBottom: '12px',
            }}>
              Point your camera at the screen showing the pulsating hotspot
            </p>
            {targetLabel && (
              <span style={{
                display: 'inline-block',
                background: `${accentColor}25`,
                border: `1px solid ${accentColor}50`,
                borderRadius: '20px',
                padding: '5px 14px',
                fontSize: '12px', fontWeight: 600, color: accentColor,
              }}>
                Target: {targetLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading / compiling / starting overlay */}
      {!isScanning && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 25,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0f0f0f', color: '#fff',
          padding: '32px', textAlign: 'center',
        }}>
          <div style={{
            width: '80px', height: '80px', margin: '0 auto 24px',
            background: `${accentColor}20`, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${accentColor}`,
          }}>
            <Camera size={40} style={{ color: accentColor }} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
            {phase === 'loading'   && 'Loading…'}
            {phase === 'compiling' && 'Preparing AR…'}
            {phase === 'starting'  && 'Starting camera…'}
            {phase === 'saving'    && 'Unlocking hotspot…'}
          </h2>

          {phase === 'compiling' && (
            <>
              <p style={{ fontSize: '13px', opacity: 0.6, marginBottom: '16px' }}>
                Analysing portrait image ({compileProgress}%)
              </p>
              <div style={{
                width: '200px', height: '4px',
                background: 'rgba(255,255,255,0.15)', borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${compileProgress}%`, height: '100%',
                  background: accentColor, borderRadius: '2px',
                  transition: 'width 0.3s ease-out',
                }} />
              </div>
            </>
          )}

          {(phase === 'starting' || phase === 'saving') && (
            <div style={{
              width: '36px', height: '36px', marginTop: '12px',
              borderRadius: '50%',
              border: `3px solid rgba(255,255,255,0.2)`,
              borderTopColor: accentColor,
              animation: 'spin 0.8s linear infinite',
            }} />
          )}

          {phase === 'starting' && (
            <p style={{ fontSize: '12px', opacity: 0.5, marginTop: '12px' }}>
              Allow camera access when prompted
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes scan-laser {
          0%   { top: 8px;                  opacity: 1;   }
          50%  { top: calc(100% - 10px);    opacity: 0.8; }
          100% { top: 8px;                  opacity: 1;   }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
