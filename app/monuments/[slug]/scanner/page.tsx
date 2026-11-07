'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { getClientSession } from '@/lib/session-client'
import { markHotspotExplored } from '@/lib/storage'
import { getWebSocketClient } from '@/lib/websocket'

// ── Types ──────────────────────────────────────────────────────────────────

type Phase =
  | 'loading'   // fetching monument + progress
  | 'scanning'  // iframe AR scanner is live
  | 'saving'    // detected — persisting to DB
  | 'success'   // done
  | 'no-target' // all hotspots already scanned
  | 'error'     // something went wrong

// ── Component ──────────────────────────────────────────────────────────────

export default function ScannerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router   = useRouter()

  const [monument,     setMonument]     = useState<Monument | null>(null)
  const [phase,        setPhase]        = useState<Phase>('loading')
  const [targetLabel,  setTargetLabel]  = useState('')
  const [errorMsg,     setErrorMsg]     = useState('')
  const [detectedLabel,setDetectedLabel] = useState('')

  const targetHotspotIdRef = useRef<string | null>(null)
  const isMountedRef       = useRef(true)
  const isSavingRef        = useRef(false)

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // ── Load monument ──────────────────────────────────────────────────────

  useEffect(() => {
    const m = getMonument(slug)
    if (!m) { router.replace('/monuments'); return }
    setMonument(m)
  }, [slug, router])

  // ── Fetch next hotspot ────────────────────────────────────────────────

  useEffect(() => {
    if (!monument) return
    let cancelled = false

    async function fetchTarget() {
      try {
        const res = await fetch(`/api/progress?monumentSlug=${slug}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load progress')

        const { progress } = await res.json()
        const scannedIds = new Set<string>(
          (progress as Array<{ hotspot_id: string }>).map((p) => p.hotspot_id)
        )
        const sorted = [...monument!.hotspots].sort((a, b) => a.displayOrder - b.displayOrder)
        const next   = sorted.find((h) => !scannedIds.has(h.id))

        if (cancelled) return
        if (!next) { setPhase('no-target'); return }

        targetHotspotIdRef.current = next.id
        setTargetLabel(next.label)
        setPhase('scanning')
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

  // ── Listen for messages from the AR iframe ────────────────────────────

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== 'object') return

      if (e.data.type === 'AR_DETECTED') {
        if (!isMountedRef.current || isSavingRef.current) return
        saveDetection()
      }

      if (e.data.type === 'AR_ERROR') {
        if (!isMountedRef.current) return
        setErrorMsg(e.data.message || 'AR scanner failed')
        setPhase('error')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Save detection ────────────────────────────────────────────────────

  const saveDetection = useCallback(async () => {
    if (isSavingRef.current) return
    isSavingRef.current = true

    const hotspotId = targetHotspotIdRef.current
    if (!hotspotId || !monument) { isSavingRef.current = false; return }

    const player = getClientSession()
    if (!player) {
      router.replace(`/signin?redirect=/monuments/${slug}/scanner`)
      return
    }

    setDetectedLabel(targetLabel)
    setPhase('saving')

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monumentSlug: slug, hotspotId }),
      })
      if (!res.ok && res.status !== 409) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
      }

      markHotspotExplored(slug, hotspotId)

      try {
        const ws = getWebSocketClient(player.id, player.displayName)
        if (!ws.isConnected()) await Promise.race([ws.connect(), new Promise(r => setTimeout(r, 2000))])
        ws.joinMonument(slug)
        ws.sendScannerDetection(slug, hotspotId)
      } catch { /* non-fatal */ }

      if (!isMountedRef.current) return
      setPhase('success')

      setTimeout(() => {
        if (!isMountedRef.current) return
        router.push(`/monuments/${slug}/explore`)
      }, 2200)

    } catch (err) {
      console.error('[Scanner] save error:', err)
      if (!isMountedRef.current) return
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save scan.')
      setPhase('error')
      isSavingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monument, slug, targetLabel])

  // ── Render ─────────────────────────────────────────────────────────────

  if (!monument) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000' }}>
        <span className="spinner spinner--lg" style={{ color: '#fff' }} />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'

  // Build the iframe URL — everything the HTML page needs comes via query params
  const iframeParams = new URLSearchParams({
    slug,
    hotspotId: targetHotspotIdRef.current ?? '',
    label:     targetLabel,
    accent:    monument.accent,
    mind:      `/${slug}.mind`,
  })
  const iframeSrc = `/ar-scanner.html?${iframeParams}`

  // ── Success ──────────────────────────────────────────────────────────
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
          <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: 1.6 }}>
            <strong>{detectedLabel}</strong>
          </p>
          <p style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>Returning to exploration…</p>
        </div>
      </div>
    )
  }

  // ── All scanned ──────────────────────────────────────────────────────
  if (phase === 'no-target') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f0f', color: '#fff', padding: '32px', textAlign: 'center',
      }}>
        <div style={{
          background: `${accentColor}20`, border: `1px solid ${accentColor}40`,
          borderRadius: '16px', padding: '40px 32px', maxWidth: '360px',
        }}>
          <CheckCircle2 size={48} style={{ color: accentColor, marginBottom: '20px' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>All hotspots scanned!</h2>
          <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '24px' }}>
            You've completed all chapters.
          </p>
          <Link href={`/monuments/${slug}/explore`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: accentColor, color: '#fff',
            padding: '12px 24px', borderRadius: '10px',
            fontSize: '14px', fontWeight: 600, textDecoration: 'none',
          }}>
            Back to Explore
          </Link>
        </div>
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                setPhase('scanning')
              }}
              style={{
                background: accentColor, color: '#fff', border: 'none',
                padding: '12px 24px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <Link href={`/monuments/${slug}/explore`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              padding: '12px 24px', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Loading / saving overlay ──────────────────────────────────────────
  if (phase === 'loading' || phase === 'saving') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f0f', color: '#fff', padding: '32px', textAlign: 'center',
        fontFamily: '-apple-system, sans-serif',
      }}>
        <div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 20px',
            border: `4px solid rgba(255,255,255,0.15)`,
            borderTopColor: accentColor,
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ fontSize: '18px', fontWeight: 600 }}>
            {phase === 'saving' ? 'Unlocking hotspot…' : 'Loading…'}
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  // ── Scanning — fullscreen iframe ──────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      {/* Back button floating above iframe */}
      <Link
        href={`/monuments/${slug}/explore`}
        style={{
          position: 'fixed', top: '16px', left: '16px', zIndex: 9999,
          color: '#fff', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px', textDecoration: 'none',
          background: 'rgba(0,0,0,0.5)', padding: '8px 14px', borderRadius: '20px',
          backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
        }}
      >
        <ArrowLeft size={16} /> Back
      </Link>

      {/* AR scanner in a fullscreen iframe — plain HTML page, no module bundler issues */}
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        allow="camera; microphone; accelerometer; gyroscope"
        allowFullScreen
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none',
        }}
      />
    </div>
  )
}
