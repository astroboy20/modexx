'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { getClientSession } from '@/lib/session-client'
import { markHotspotExplored } from '@/lib/storage'
import { getWebSocketClient } from '@/lib/websocket'

export default function ScanPage({ params }: { params: Promise<{ slug: string; hotspotId: string }> }) {
  const { slug, hotspotId } = React.use(params)
  const router = useRouter()
  const [status, setStatus] = useState<'saving' | 'success' | 'error'>('saving')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let cancelled = false

    async function saveAndBroadcast() {
      const player = getClientSession()
      if (!player) {
        // Not authenticated — redirect to sign-in
        router.replace(`/signin?redirect=/monuments/${slug}/scan/${hotspotId}`)
        return
      }

      try {
        // 1. Persist to database (source of truth)
        const res = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monumentSlug: slug, hotspotId }),
        })

        if (!res.ok && res.status !== 409) {
          // 409 = already exists (duplicate scan) — still treat as success
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || `HTTP ${res.status}`)
        }

        if (cancelled) return

        // 2. Mirror to localStorage for offline/fast reads
        markHotspotExplored(slug, hotspotId)

        // 3. Broadcast via WebSocket so the explore page updates in real time
        try {
          const ws = getWebSocketClient(player.id, player.displayName)
          if (!ws.isConnected()) await ws.connect()
          ws.joinMonument(slug)
          ws.sendScannerDetection(slug, hotspotId)
        } catch (wsErr) {
          // Non-fatal — DB already has the record
          console.warn('[ScanPage] WebSocket broadcast failed:', wsErr)
        }

        if (cancelled) return
        setStatus('success')

        // Redirect back to explore after a short celebration
        setTimeout(() => {
          if (!cancelled) router.push(`/monuments/${slug}/explore`)
        }, 1800)
      } catch (err) {
        if (cancelled) return
        console.error('[ScanPage] Save error:', err)
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setStatus('error')

        // Retry redirect after showing the error
        setTimeout(() => {
          if (!cancelled) router.push(`/monuments/${slug}/explore`)
        }, 3000)
      }
    }

    saveAndBroadcast()

    return () => {
      cancelled = true
    }
  }, [slug, hotspotId, router])

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
        {/* Icon */}
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

        {/* Title */}
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            marginBottom: '12px',
            animation: status !== 'saving' ? 'fadeIn 0.5s ease-out 0.2s both' : undefined,
          }}
        >
          {status === 'saving' && 'Saving scan…'}
          {status === 'success' && 'Scan Successful!'}
          {status === 'error' && 'Scan Failed'}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '16px',
            opacity: 0.9,
            lineHeight: 1.6,
            animation: status !== 'saving' ? 'fadeIn 0.5s ease-out 0.4s both' : undefined,
          }}
        >
          {status === 'saving' && 'Unlocking hotspot…'}
          {status === 'success' && 'Hotspot unlocked! Returning to exploration…'}
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
