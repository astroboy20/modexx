'use client'

/**
 * AR Scanner Page — MindAR Image Tracking
 *
 * Flow:
 * 1. Fetch which hotspot is currently active (the pulsating one) from the progress API
 * 2. Dynamically import Three.js + MindAR (npm packages), then compile the portrait image into a
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

// ── MindAR global types ───────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __mindARThreeClass__: any
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

// ── Phase type ─────────────────────────────────────────────────────────────

type Phase =
  | 'loading'      // waiting for monument + progress API
  | 'starting'     // loading MindAR + starting camera
  | 'scanning'     // camera active, watching for portrait
  | 'saving'       // portrait detected, persisting to DB
  | 'success'      // saved, showing success screen
  | 'no-target'    // all hotspots already scanned
  | 'error'        // something went wrong

// ── MindAR loader ─────────────────────────────────────────────────────────
//
// MindAR v1.2+ is ES-module only.
// We inject an importmap + <script type="module"> that imports MindARThree
// and stashes it on window so the React component can use it.
// Pre-compiled .mind files (in /public) eliminate the need for Compiler.

let mindARLoadPromise: Promise<void> | null = null

function loadMindARClass(): Promise<void> {
  if (mindARLoadPromise) return mindARLoadPromise

  mindARLoadPromise = new Promise<void>((resolve, reject) => {
    if (window.__mindARThreeClass__) { resolve(); return }

    // Importmap must be injected before any module script
    const mapId = '__mindar-importmap__'
    if (!document.getElementById(mapId)) {
      const map = document.createElement('script')
      map.id = mapId
      map.type = 'importmap'
      map.textContent = JSON.stringify({
        imports: {
          'three': 'https://unpkg.com/three@0.160.0/build/three.module.js',
          'three/addons/': 'https://unpkg.com/three@0.160.0/examples/jsm/',
          'mindar-image-three': 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js',
        }
      })
      document.head.prepend(map)
    }

    // Module script stashes MindARThree on window then fires a custom event
    const scriptId = '__mindar-loader__'
    if (document.getElementById(scriptId)) {
      // Already injected — poll until the class appears
      const deadline = Date.now() + 20000
      const id = setInterval(() => {
        if (window.__mindARThreeClass__) { clearInterval(id); resolve() }
        else if (Date.now() > deadline) { clearInterval(id); reject(new Error('MindAR load timed out')) }
      }, 100)
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'module'
    script.textContent = `
      import { MindARThree } from 'mindar-image-three';
      window.__mindARThreeClass__ = MindARThree;
      window.dispatchEvent(new Event('__mindar-ready__'));
    `
    window.addEventListener('__mindar-ready__', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('MindAR module failed to load — check network')), { once: true })
    document.head.appendChild(script)

    setTimeout(() => reject(new Error('MindAR load timed out after 20s')), 20000)
  })

  mindARLoadPromise.catch(() => { mindARLoadPromise = null })
  return mindARLoadPromise
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
        setPhase('starting')       // signal to next effect
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

  // ── Step 3: start MindAR with pre-built .mind file ────────────────────────
  // Runs only once when phase becomes 'starting'

  useEffect(() => {
    if (phase !== 'starting') return
    if (!monument || !targetHotspotIdRef.current || !containerRef.current) return

    let cancelled = false
    let checkIntervalId: ReturnType<typeof setInterval> | null = null

    async function initAR() {
      try {
        // Load MindARThree class via importmap + ES module script in <head>
        await loadMindARClass()
        if (cancelled || !isMountedRef.current) return

        const MindARThree = window.__mindARThreeClass__

        // Use pre-compiled .mind file from /public — no runtime compilation needed
        const mindFileSrc = monument!.slug === 'tinubu' ? '/tinubu.mind' : '/sanwo-olu.mind'

        // Create MindAR instance
        const mindAR = new MindARThree({
          container: containerRef.current!,
          imageTargetSrc: mindFileSrc,
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
                isSavingRef.current = false
                setPhase('starting')
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

      {/* Loading / starting overlay */}
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
            {phase === 'loading'  && 'Loading…'}
            {phase === 'starting' && 'Starting camera…'}
            {phase === 'saving'   && 'Unlocking hotspot…'}
          </h2>

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
