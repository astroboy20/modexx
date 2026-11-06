'use client'

/**
 * HotspotQRCode
 * Renders a QR code for a specific hotspot using a canvas element.
 * The QR value encodes the full scan URL so any device can trigger it.
 *
 * QR value format:  <origin>/monuments/<slug>/scan/<hotspotId>
 * This matches the existing /monuments/[slug]/scan/[hotspotId] route.
 */

import { useEffect, useRef } from 'react'

interface HotspotQRCodeProps {
  /** The monument slug, e.g. "tinubu" */
  slug: string
  /** The hotspot ID, e.g. "tinubu-h1" */
  hotspotId: string
  /** Size in pixels (width = height) */
  size?: number
  /** Background colour (default transparent/white) */
  bgColor?: string
  /** Foreground colour */
  fgColor?: string
  /** Optional className for the wrapper div */
  className?: string
}

export default function HotspotQRCode({
  slug,
  hotspotId,
  size = 200,
  bgColor = '#ffffff',
  fgColor = '#000000',
  className,
}: HotspotQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        // Build the absolute scan URL
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const value = `${origin}/monuments/${slug}/scan/${hotspotId}`

        // Dynamically import qrcode to keep it out of the server bundle
        const QRCode = (await import('qrcode')).default

        if (cancelled || !canvasRef.current) return

        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: { dark: fgColor, light: bgColor },
          errorCorrectionLevel: 'M',
        })
      } catch (err) {
        console.error('[HotspotQRCode] Failed to render:', err)
      }
    }

    render()
    return () => { cancelled = true }
  }, [slug, hotspotId, size, bgColor, fgColor])

  return (
    <div className={className} style={{ display: 'inline-block', lineHeight: 0 }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-label={`QR code for hotspot ${hotspotId} in monument ${slug}`}
        role="img"
        style={{ display: 'block' }}
      />
    </div>
  )
}
