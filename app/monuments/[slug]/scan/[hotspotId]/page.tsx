'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { getClientSession } from '@/lib/session-client'
import { getWebSocketClient } from '@/lib/websocket'

/**
 * /monuments/[slug]/scan/[hotspotId]
 *
 * This page is what the QR code opens on the participant's phone.
 *
 * hotspotId === '__access__'
 *   → Gate scan: registers that this participant has access to the monument.
 *     No chapters are unlocked yet — the explore page will show chapter 1 immediately.
 *
 * hotspotId === <actual hotspot id>  (kept for direct AR scanner flow)
 *   → Records that specific chapter as completed and broadcasts via WebSocket.
 */
export default function ScanPage({ params }: { params: Promise<{ slug: string; hotspotId: string }> }) {
  const { slug, hotspotId } = React.use(params)
  const router = useRouter()
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving')
  const [errorMsg, setErrorMsg] = useState('')

  const isGateScan = hotspotId === '__access__'

  useEffect(() => {
    let cancelled = false

    async function saveAndBroadcast() {
      const player = getClientSession()
      if (!player) {
        router.replace(`/signin?redirect=/monuments/${slug}/scan/${hotspotId}`)
        return
      }

      try {
        // Save to DB — single record regardless of gate vs chapter scan
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monumentSlug: slug, hotspotId }),
        })

        if (!res.ok && res.status !== 409) {
          const data = await res.json().catch(() => ({}))
          throw new Error((data as { error?: string }).error || `HTTP ${res.status}`)
        }

        if (cancelled) return

        // Broadcast via WebSocket so the display device updates in real time
        try {
          const ws = getWebSocketClient(player.id, player.displayName)
          if (!ws.isConnected()) await ws.connect()
          ws.joinMonument(slug)
          ws.sendScannerDetection(slug, hotspotId)
        } catch {
          // non-fatal
        }

        if (cancelled) return
        setStatus('success')

        setTimeout(() => {
          if (!cancelled) {
            // Always redirect back to the explore page; the display device handles the story
            router.push(`/monuments/${slug}/explore?unlocked=${hotspotId}`)
          }
        }, 1500)
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')
        setTimeout(() => {
          if (!cancelled) router.push(`/monuments/${slug}/explore`)
        }, 3000)
      }
    }

    saveAndBroadcast()
    return () => { cancelled = true }
  }, [slug, hotspotId, isGateScan, router])

  const bgGradient =
    status === 'success'
      ? 'linear-gradient(135deg, #168447 0%, #0d5230 100%)'
      : status === 'error'
        ? 'linear-gradient(135deg, #d92e35 0%, #7f0007 100%)'
        : 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: bgGradient, color: '#fff', padding: '24px', textAlign: 'center',
      transition: 'background 0.6s ease',
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
          {status === 'saving' && (
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '4px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
              animation: 'spin 0.8s linear infinite',
            }} />
          )}
          {status === 'success' && <CheckCircle2 size={48} />}
          {status === 'error' && <XCircle size={48} />}
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 600, marginBottom: '12px' }}>
          {status === 'saving' && 'Registering…'}
          {status === 'success' && (isGateScan ? 'Access granted!' : 'Chapter unlocked!')}
          {status === 'error' && 'Scan failed'}
        </h1>

        <p style={{ fontSize: '15px', opacity: 0.88, lineHeight: 1.6 }}>
          {status === 'saving' && 'Please wait…'}
          {status === 'success' && (isGateScan
            ? 'You now have access. Taking you to explore…'
            : 'Chapter saved. Returning to explore…')}
          {status === 'error' && (errorMsg || 'Could not save. Returning…')}
        </p>
      </div>

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
