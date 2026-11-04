'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export default function ScanPage({ params }: { params: Promise<{ slug: string; hotspotId: string }> }) {
  const { slug, hotspotId } = React.use(params)
  const router = useRouter()

  useEffect(() => {
    // Store the scan in localStorage
    const scannedKey = `scanned_${slug}_${hotspotId}`
    localStorage.setItem(scannedKey, 'true')
    
    // Show success message for 2 seconds then redirect back
    const timer = setTimeout(() => {
      router.push(`/monuments/${slug}/explore`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [slug, hotspotId, router])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #168447 0%, #0d5230 100%)',
      color: '#fff',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '48px 32px',
        maxWidth: '400px',
        width: '100%',
        border: '2px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'scaleIn 0.5s ease-out'
        }}>
          <CheckCircle2 size={48} style={{ color: '#fff' }} />
        </div>
        
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 600, 
          marginBottom: '12px',
          animation: 'fadeIn 0.5s ease-out 0.2s both'
        }}>
          Scan Successful!
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          opacity: 0.9,
          lineHeight: 1.6,
          animation: 'fadeIn 0.5s ease-out 0.4s both'
        }}>
          Hotspot unlocked! Returning to exploration...
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
      `}</style>
    </div>
  )
}
