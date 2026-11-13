'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { getClientSession } from '@/lib/session-client'
import { markHotspotExplored } from '@/lib/storage'
import { getWebSocketClient } from '@/lib/websocket'
import { getMonument } from '@/lib/data/index'

export default function ScanPage({ params }: { params: Promise<{ slug: string; hotspotId: string }> }) {
  const { slug, hotspotId } = React.use(params)
  const router = useRouter()
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving')
  const [errorMsg, setErrorMsg] = useState('')

  // __all__ is the special gate hotspot ID — unlock every chapter at once
  const isGateScan = hotspotId === '__all__'

  useEffect(() => {
    let cancelled = false

    async function saveAndBroadcast() {
      const player = getClientSession()
      if (!player) {
        router.replace(`/signin?redirect=/monuments/${slug}/scan/${hotspotId}`)
        return
      }

      try {
        if (isGateScan) {
          // ── Gate scan: unlock ALL hotspots for this monument ──────────────
          const monument = getMonument(slug)
          if (!monument) throw new Error('Monument not found')

          const allIds = monument.hotspots.map((h) => h.id)

          // 1. Bulk-save to database
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monumentSlug: slug, hotspotIds: allIds }),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || `HTTP ${res.status}`)
          }

          if (cancelled) return

          // 2. Mirror all to localStorage
          allIds.forEach((id) => markHotspotExplored(slug, id))

          // 3. Broadcast each hotspot unlock via WebSocket
          try {
            const ws = getWebSocketClient(player.id, player.displayName)
            if (!ws.isConnected()) await ws.connect()
            ws.joinMonument(slug)
            // Broadcast each ID so the explore page receives individual unlock events
            for (const id of allIds) {
              ws.sendScannerDetection(slug, id)
            }
          } catch (wsErr) {
            console.warn('[ScanPage] WebSocket broadcast failed:', wsErr)
          }

          if (cancelled) return
          setStatus('success')

          setTimeout(() => {
            if (!cancelled) router.push(`/monuments/${slug}/explore?unlocked=__all__`)
          }, 1800)
        } else {
          // ── Single hotspot scan ───────────────────────────────────────────
          const res = await fetch('/api/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monumentSlug: slug, hotspotId }),
          })

          if (!res.ok && res.status !== 409) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || `HTTP ${res.status}`)
          }

          if (cancelled) return

          markHotspotExplored(slug, hotspotId)

          try {
            const ws = getWebSocketClient(player.id, player.displayName)
            if (!ws.isConnected()) await ws.connect()
            ws.joinMonument(slug)
            ws.sendScannerDetection(slug, hotspotId)
          } catch (wsErr) {
            console.warn('[ScanPage] WebSocket broadcast failed:', wsErr)
          }

          if (cancelled) return
          setStatus('success')

          setTimeout(() => {
            if (!cancelled) router.push(`/monuments/${slug}/explore?unlocked=${hotspotId}`)
          }, 1800)
        }
      } catch (err) {
        if (cancelled) return
        console.error('[ScanPage] Save error:', err)
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')

        setTimeout(() => {
          if (!cancelled) router.push(`/monuments/${slug}/explore`)
        }, 3000)
      }
    }

    saveAndBroadcast()

    return () => {
      cancelled = true
    }
  }, [slug, hotspotId, isGateScan, router])

  const isSuccess = status === 'success'
  const bgGradient = isSuccess
    ? 'linear-gradient(135deg, #168447 0%, #0d5230 100%)'
    : status === 'error'
      ? 'linear-gradient(135deg, #d92e35 0%, #7f0007 100%)'
      : 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)'

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgGradient,
        color: '#fff',
        padding: '24px',
        textAlign: 'center',
        transition: 'background 0.6s ease',
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          padding: '48px 32px',
          maxWidth: '400px',
          width: '100%',
          border: '2px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: status !== 'saving' ? 'scaleIn 0.5s ease-out' : undefined,
          }}
        >
          {status === 'saving' && (
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '4px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite',
              }}
            />
          )}
          {status === 'success' && <CheckCircle2 size={48} style={{ color: '#fff' }} />}
          {status === 'error' && <XCircle size={48} style={{ color: '#fff' }} />}
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '12px',
            animation: status !== 'saving' ? 'fadeIn 0.5s ease-out 0.2s both' : undefined,
          }}
        >
          {status === 'saving' && 'Unlocking…'}
          {status === 'success' && 'All Chapters Unlocked!'}
          {status === 'error' && 'Scan Failed'}
        </h1>

        <p
          style={{
            fontSize: '16px',
            opacity: 0.9,
            lineHeight: 1.6,
            animation: status !== 'saving' ? 'fadeIn 0.5s ease-out 0.4s both' : undefined,
          }}
        >
          {status === 'saving' && (isGateScan ? 'Unlocking all chapters for you…' : 'Unlocking chapter…')}
          {status === 'success' && (isGateScan
            ? 'Every chapter is now open. Returning to exploration…'
            : 'Chapter unlocked! Returning to exploration…')}
          {status === 'error' && (errorMsg || 'Could not save. Returning to explore page…')}
        </p>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
