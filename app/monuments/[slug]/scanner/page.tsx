'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Target, CheckCircle2, X } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'

export default function ScannerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [detected, setDetected] = useState(false)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const m = getMonument(slug)
    if (!m) {
      router.replace('/monuments')
      return
    }
    setMonument(m)
  }, [slug, router])

  async function startCamera() {
    try {
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
        setScanning(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Unable to access camera. Please allow camera permissions.')
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setScanning(false)
  }

  // Simulate AR marker detection (in real implementation, use AR.js or similar)
  function handleScanClick() {
    if (!scanning) return
    
    setDetected(true)
    
    // Simulate detection delay
    setTimeout(() => {
      stopCamera()
      // Store scan result
      const currentHotspot = monument?.hotspots[0] // Would be dynamically detected
      if (currentHotspot) {
        const scannedKey = `scanned_${slug}_${currentHotspot.id}`
        localStorage.setItem(scannedKey, 'true')
      }
      
      // Redirect back to explore
      setTimeout(() => {
        router.push(`/monuments/${slug}/explore`)
      }, 1500)
    }, 1000)
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  if (!monument) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <span className="spinner spinner--lg" />
      </div>
    )
  }

  const accentColor = monument.accent === 'green' ? '#168447' : '#46a9d8'

  if (detected) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${accentColor} 0%, ${monument.accent === 'green' ? '#0d5230' : '#2d5a7b'} 100%)`,
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
            <CheckCircle2 size={48} />
          </div>
          
          <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '12px' }}>
            Marker Detected!
          </h1>
          
          <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: 1.6 }}>
            Hotspot unlocked! Returning to exploration...
          </p>
        </div>

        <style jsx>{`
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        padding: '16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link 
          href={`/monuments/${slug}/explore`}
          style={{ 
            color: '#fff', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '14px',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={20} /> Back
        </Link>
        <button
          onClick={stopCamera}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Camera View */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100vh',
          objectFit: 'cover',
          display: cameraActive ? 'block' : 'none'
        }}
      />

      {/* AR Overlay */}
      {cameraActive && (
        <>
          {/* Scanning frame */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            height: '280px',
            border: `3px solid ${accentColor}`,
            borderRadius: '20px',
            boxShadow: `0 0 0 2000px rgba(0,0,0,0.5), 0 0 30px ${accentColor}`,
            zIndex: 10,
            animation: 'scanPulse 2s ease-in-out infinite'
          }}>
            {/* Corner markers */}
            {[
              { top: '-3px', left: '-3px' },
              { top: '-3px', right: '-3px' },
              { bottom: '-3px', left: '-3px' },
              { bottom: '-3px', right: '-3px' }
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  ...pos,
                  width: '30px',
                  height: '30px',
                  border: `4px solid ${accentColor}`,
                  borderRadius: '4px',
                  [pos.top !== undefined ? 'borderBottom' : 'borderTop']: 'none',
                  [pos.left !== undefined ? 'borderRight' : 'borderLeft']: 'none'
                }}
              />
            ))}

            {/* Center crosshair */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '40px',
              border: `2px solid ${accentColor}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={24} style={{ color: accentColor }} />
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            position: 'absolute',
            bottom: '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff',
            zIndex: 15,
            maxWidth: '320px',
            padding: '0 20px'
          }}>
            <p style={{ 
              fontSize: '16px', 
              marginBottom: '8px',
              fontWeight: 600,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)'
            }}>
              Point at the pulsating hotspot
            </p>
            <p style={{ 
              fontSize: '13px',
              opacity: 0.9,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)'
            }}>
              Align the marker in the center frame
            </p>
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScanClick}
            disabled={!scanning}
            style={{
              position: 'absolute',
              bottom: '40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: accentColor,
              border: '4px solid #fff',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'transform 0.2s',
              opacity: scanning ? 1 : 0.5
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
          >
            <Camera size={32} />
          </button>
        </>
      )}

      {/* Start Camera View */}
      {!cameraActive && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#fff',
          padding: '32px',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 24px',
            background: `${accentColor}20`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `3px solid ${accentColor}`
          }}>
            <Camera size={48} style={{ color: accentColor }} />
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px' }}>
            AR Scanner
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.8, marginBottom: '24px', lineHeight: 1.6 }}>
            Use your camera to scan the pulsating hotspots on the display screen
          </p>

          {error && (
            <p style={{ 
              color: '#ff6b6b', 
              fontSize: '13px', 
              marginBottom: '16px',
              padding: '12px',
              background: 'rgba(255,107,107,0.1)',
              borderRadius: '8px'
            }}>
              {error}
            </p>
          )}

          <button
            onClick={startCamera}
            style={{
              background: accentColor,
              color: '#fff',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Camera size={20} /> Start Scanning
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes scanPulse {
          0%, 100% { box-shadow: 0 0 0 2000px rgba(0,0,0,0.5), 0 0 30px ${accentColor}; }
          50% { box-shadow: 0 0 0 2000px rgba(0,0,0,0.5), 0 0 50px ${accentColor}; }
        }
      `}</style>
    </div>
  )
}
