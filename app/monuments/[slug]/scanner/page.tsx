'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Camera, Target, CheckCircle2, X } from 'lucide-react'
import { getMonument } from '@/lib/data/index'
import type { Monument } from '@/lib/data/index'
import { getClientSession } from '@/lib/session-client'
import { getWebSocketClient } from '@/lib/websocket'

export default function ScannerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params)
  const router = useRouter()
  const [monument, setMonument] = useState<Monument | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [detected, setDetected] = useState(false)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [targetHotspot, setTargetHotspot] = useState<string | null>(null)
  const [error, setError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectionFrameRef = useRef<number>(0)
  const isDetectingRef = useRef(false)

  useEffect(() => {
    const m = getMonument(slug)
    if (!m) {
      router.replace('/monuments')
      return
    }
    setMonument(m)
  }, [slug, router])

  // Fetch current target hotspot (the pulsating one)
  const fetchTargetHotspot = useCallback(async () => {
    if (!monument) return null
    
    try {
      const res = await fetch(`/api/progress?monumentSlug=${slug}`)
      if (!res.ok) return null
      
      const { progress } = await res.json()
      const scannedIds = new Set(progress.map((p: { hotspot_id: string }) => p.hotspot_id))
      
      // Find first unscanned hotspot (this is what's pulsating)
      const nextHotspot = monument.hotspots
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .find(h => !scannedIds.has(h.id))
      
      return nextHotspot ? nextHotspot.id : null
    } catch (err) {
      console.error('Failed to fetch target hotspot:', err)
      return null
    }
  }, [monument, slug])

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
        
        // Fetch and set target hotspot
        const target = await fetchTargetHotspot()
        setTargetHotspot(target)
        
        // Wait for video to be ready before starting detection
        videoRef.current.onloadedmetadata = () => {
          setCameraActive(true)
          setScanning(true)
          
          // Start detection loop after video is ready
          if (target) {
            console.log('Starting detection for target:', target)
            setTimeout(() => startDetectionLoop(), 500) // Small delay to ensure video is rendering
          }
        }
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
    if (detectionFrameRef.current) {
      cancelAnimationFrame(detectionFrameRef.current)
      detectionFrameRef.current = 0
    }
    setCameraActive(false)
    setScanning(false)
    isDetectingRef.current = false
  }

  // Color detection algorithm to find pulsating hotspot
  function detectPulsatingMarker(): number {
    if (!videoRef.current || !canvasRef.current || !monument) {
      console.log('Detection skipped: missing refs')
      return 0
    }
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Detection skipped: video not ready', video.readyState)
      return 0
    }
    
    // Set canvas size to match video (only if needed)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      console.log('Canvas sized:', canvas.width, 'x', canvas.height)
    }
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Get image data from center region (where user should point camera)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const sampleSize = Math.min(canvas.width, canvas.height) * 0.4 // 40% of frame
    
    const startX = Math.floor(centerX - sampleSize / 2)
    const startY = Math.floor(centerY - sampleSize / 2)
    
    try {
      const imageData = ctx.getImageData(startX, startY, sampleSize, sampleSize)
      const data = imageData.data
      
      // Detect accent color (green or blue pulsating marker)
      const accentColor = monument.accent === 'green' 
        ? { r: 22, g: 132, b: 71, name: 'green' }  // #168447
        : { r: 70, g: 169, b: 216, name: 'blue' }   // #46a9d8
      
      let colorMatches = 0
      let brightPixels = 0
      const totalPixels = data.length / 4
      
      // Sample every 4th pixel for performance
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Check if pixel matches accent color (with tolerance)
        const colorDistance = Math.sqrt(
          Math.pow(r - accentColor.r, 2) +
          Math.pow(g - accentColor.g, 2) +
          Math.pow(b - accentColor.b, 2)
        )
        
        // Color match threshold
        if (colorDistance < 80) {
          colorMatches++
        }
        
        // Check for bright pixels (pulsating glow)
        const brightness = (r + g + b) / 3
        if (brightness > 180) {
          brightPixels++
        }
      }
      
      const sampledPixels = totalPixels / 4
      const colorScore = (colorMatches / sampledPixels) * 100
      const brightnessScore = (brightPixels / sampledPixels) * 100
      
      // Combined confidence score
      const confidence = (colorScore * 0.7 + brightnessScore * 0.3)
      
      // Debug logging (remove after testing)
      if (Math.random() < 0.1) { // Log 10% of frames to avoid spam
        console.log('Detection:', {
          colorScore: colorScore.toFixed(1),
          brightnessScore: brightnessScore.toFixed(1),
          confidence: confidence.toFixed(1)
        })
      }
      
      return Math.min(100, confidence * 2) // Amplify for better UX
    } catch (err) {
      console.error('Detection error:', err)
      return 0
    }
  }

  // Detection loop
  function startDetectionLoop() {
    let consecutiveDetections = 0
    const requiredStableFrames = 3 // Need 3 consecutive frames above threshold
    let lastDetectionTime = 0
    
    const detect = () => {
      if (!scanning || !cameraActive || isDetectingRef.current) {
        return
      }
      
      const confidence = detectPulsatingMarker()
      setDetectionProgress(confidence)
      
      // Threshold for detection (70% confidence)
      if (confidence >= 70) {
        consecutiveDetections++
        
        if (consecutiveDetections >= requiredStableFrames) {
          // Debounce: prevent duplicate detections
          const now = Date.now()
          if (now - lastDetectionTime > 2000) {
            lastDetectionTime = now
            handleAutoDetection()
          }
          return // Stop detection loop
        }
      } else {
        consecutiveDetections = 0 // Reset if confidence drops
      }
      
      // Continue loop
      detectionFrameRef.current = requestAnimationFrame(detect)
    }
    
    detect()
  }

  // Auto-detection handler - saves to database and broadcasts via WebSocket
  async function handleAutoDetection() {
    if (isDetectingRef.current || !monument || !targetHotspot) return
    
    isDetectingRef.current = true
    const player = getClientSession()
    if (!player) {
      isDetectingRef.current = false
      return
    }
    
    setDetected(true)
    
    try {
      // Save scan to database
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monumentSlug: slug,
          hotspotId: targetHotspot
        })
      })
      
      // Broadcast via WebSocket to other devices
      try {
        const ws = getWebSocketClient(player.id, player.displayName)
        if (ws.isConnected()) {
          ws.sendScannerDetection(slug, targetHotspot)
        }
      } catch (wsErr) {
        console.warn('WebSocket broadcast failed, but scan saved:', wsErr)
      }
      
      console.log(`Auto-detected hotspot: ${targetHotspot}`)
      
      // Redirect back to explore
      setTimeout(() => {
        stopCamera()
        router.push(`/monuments/${slug}/explore`)
      }, 1500)
    } catch (err) {
      console.error('Scan error:', err)
      setDetected(false)
      setError('Failed to save scan. Please try again.')
      isDetectingRef.current = false
    }
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
      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
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

      {/* AR Overlay with Detection Feedback */}
      {cameraActive && (
        <>
          {/* Scanning frame with dynamic color based on detection */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '280px',
            height: '280px',
            border: `3px solid ${detectionProgress >= 70 ? '#4ade80' : accentColor}`,
            borderRadius: '20px',
            boxShadow: `0 0 0 2000px rgba(0,0,0,0.5), 0 0 ${Math.max(30, detectionProgress / 2)}px ${detectionProgress >= 70 ? '#4ade80' : accentColor}`,
            zIndex: 10,
            animation: detectionProgress >= 70 ? 'scanSuccess 0.5s ease-in-out' : 'scanPulse 2s ease-in-out infinite',
            transition: 'border-color 0.3s, box-shadow 0.3s'
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
                  border: `4px solid ${detectionProgress >= 70 ? '#4ade80' : accentColor}`,
                  borderRadius: '4px',
                  [pos.top !== undefined ? 'borderBottom' : 'borderTop']: 'none',
                  [pos.left !== undefined ? 'borderRight' : 'borderLeft']: 'none',
                  transition: 'border-color 0.3s'
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
              border: `2px solid ${detectionProgress >= 70 ? '#4ade80' : accentColor}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.3s'
            }}>
              <Target size={24} style={{ color: detectionProgress >= 70 ? '#4ade80' : accentColor }} />
            </div>
            
            {/* Detection progress bar */}
            <div style={{
              position: 'absolute',
              bottom: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '6px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${detectionProgress}%`,
                height: '100%',
                background: detectionProgress >= 70 ? '#4ade80' : accentColor,
                transition: 'width 0.2s, background 0.3s'
              }} />
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            position: 'absolute',
            bottom: '100px',
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
              {detectionProgress >= 70 ? 'Target Locked!' : 'Point at the pulsating hotspot'}
            </p>
            <p style={{ 
              fontSize: '13px',
              opacity: 0.9,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)'
            }}>
              {detectionProgress >= 70 ? 'Scanning...' : `Align the glowing marker (${Math.floor(detectionProgress)}%)`}
            </p>
          </div>
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
            Point your camera at the pulsating hotspot on the display screen. Detection is automatic!
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
        @keyframes scanSuccess {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  )
}
