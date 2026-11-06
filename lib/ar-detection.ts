/**
 * AR Detection Utilities
 *
 * Primary detection: QR code scanning via jsQR
 * - Each pulsating hotspot displays a QR code encoding its scan URL
 * - The scanner reads the QR and extracts the hotspot ID
 * - This is reliable, deterministic, and only triggers for the correct target
 *
 * Legacy fallback methods (color/brightness) are retained for reference but
 * are NOT used in production — they produce too many false positives.
 */

import jsQR from 'jsqr'

// ── Types ──────────────────────────────────────────────────────────────────

export interface QRDetectionResult {
  hotspotId: string | null
  rawValue: string | null
  confidence: 100 | 0
  method: 'qr'
}

// ── Primary: QR code detection ─────────────────────────────────────────────

/**
 * Scan a video frame for a QR code and extract the hotspot ID.
 *
 * @param imageData   ImageData from canvas.getImageData()
 * @param expectedSlug  The current monument slug (validates the URL in the QR)
 * @param hotspotIds  Set of valid hotspot IDs for this monument (validates the ID)
 */
export function detectQRHotspot(
  imageData: ImageData,
  expectedSlug: string,
  hotspotIds: Set<string>
): QRDetectionResult {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })

    if (!code?.data) {
      return { hotspotId: null, rawValue: null, confidence: 0, method: 'qr' }
    }

    const hotspotId = parseHotspotId(code.data, expectedSlug, hotspotIds)
    return {
      hotspotId,
      rawValue: code.data,
      confidence: hotspotId ? 100 : 0,
      method: 'qr',
    }
  } catch (err) {
    console.error('[AR] QR detection error:', err)
    return { hotspotId: null, rawValue: null, confidence: 0, method: 'qr' }
  }
}

/**
 * Parse the hotspot ID from a QR code value.
 *
 * Supported formats:
 * 1. Full URL:  https://<origin>/monuments/<slug>/scan/<hotspotId>
 * 2. Path-only: /monuments/<slug>/scan/<hotspotId>
 * 3. Bare ID:   <hotspotId>  (must exist in hotspotIds set)
 */
export function parseHotspotId(
  value: string,
  expectedSlug: string,
  hotspotIds: Set<string>
): string | null {
  if (!value) return null

  // Try URL / path format
  try {
    const url = new URL(value, 'https://placeholder.local')
    const parts = url.pathname.split('/').filter(Boolean)
    // ['monuments', slug, 'scan', hotspotId]
    if (
      parts.length >= 4 &&
      parts[0] === 'monuments' &&
      parts[1] === expectedSlug &&
      parts[2] === 'scan'
    ) {
      const id = decodeURIComponent(parts[3])
      return hotspotIds.has(id) ? id : null
    }
  } catch {
    // Not a URL
  }

  // Bare hotspot ID (legacy or direct encoding)
  const stripped = value.replace(/^hotspot-/, '')
  if (hotspotIds.has(stripped)) return stripped
  if (hotspotIds.has(value)) return value

  return null
}

// ── Stability smoother ─────────────────────────────────────────────────────

/**
 * Requires the same QR value to appear N times in a row before confirming.
 * Prevents single-frame noise or partial reads from triggering.
 */
export class DetectionSmoother {
  private lastValue = ''
  private count = 0
  private readonly required: number

  constructor(requiredFrames = 3) {
    this.required = requiredFrames
  }

  /**
   * Feed a new detection value.
   * Returns the confirmed value if stability threshold is met, otherwise null.
   */
  feed(value: string | null): string | null {
    const v = value ?? ''

    if (v === this.lastValue && v !== '') {
      this.count++
      if (this.count >= this.required) {
        return v
      }
    } else {
      this.lastValue = v
      this.count = v ? 1 : 0
    }

    return null
  }

  reset(): void {
    this.lastValue = ''
    this.count = 0
  }
}
