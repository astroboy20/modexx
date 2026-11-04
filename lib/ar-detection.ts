/**
 * AR Detection Utilities
 * Multiple detection methods for robust pulsating hotspot recognition
 */

import jsQR from 'jsqr'

interface ColorTarget {
  r: number
  g: number
  b: number
  name: string
}

interface DetectionResult {
  confidence: number
  method: 'color' | 'brightness' | 'qr' | 'combined'
  hotspotId?: string
}

/**
 * Color-based detection - looks for specific accent color
 */
export function detectByColor(
  imageData: ImageData,
  targetColor: ColorTarget,
  tolerance: number = 80
): number {
  const data = imageData.data
  let colorMatches = 0
  const totalPixels = data.length / 4
  
  // Sample every 4th pixel for performance
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // Euclidean distance in RGB space
    const colorDistance = Math.sqrt(
      Math.pow(r - targetColor.r, 2) +
      Math.pow(g - targetColor.g, 2) +
      Math.pow(b - targetColor.b, 2)
    )
    
    if (colorDistance < tolerance) {
      colorMatches++
    }
  }
  
  const sampledPixels = totalPixels / 4
  const colorScore = (colorMatches / sampledPixels) * 100
  
  return Math.min(100, colorScore * 2) // Amplify for better UX
}

/**
 * Brightness-based detection - looks for glowing/pulsating effect
 */
export function detectByBrightness(
  imageData: ImageData,
  minBrightness: number = 180
): number {
  const data = imageData.data
  let brightPixels = 0
  let veryBrightPixels = 0
  const totalPixels = data.length / 4
  
  // Sample every 4th pixel
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    const brightness = (r + g + b) / 3
    
    if (brightness > minBrightness) {
      brightPixels++
    }
    
    if (brightness > 220) {
      veryBrightPixels++
    }
  }
  
  const sampledPixels = totalPixels / 4
  const brightnessScore = (brightPixels / sampledPixels) * 100
  const glowScore = (veryBrightPixels / sampledPixels) * 100
  
  // Combined score - glow effect weighted higher
  return Math.min(100, (brightnessScore * 0.4 + glowScore * 0.6) * 1.5)
}

/**
 * Pattern detection - looks for circular patterns (hotspot markers)
 */
export function detectCircularPattern(
  imageData: ImageData,
  targetColor: ColorTarget
): number {
  const { width, height, data } = imageData
  const centerX = Math.floor(width / 2)
  const centerY = Math.floor(height / 2)
  
  // Check for circular pattern around center
  const radiusSteps = [10, 20, 30, 40, 50] // Multiple radii to check
  let totalMatches = 0
  let totalChecks = 0
  
  radiusSteps.forEach(radius => {
    const angleSteps = 16 // Check 16 points around circle
    
    for (let i = 0; i < angleSteps; i++) {
      const angle = (i / angleSteps) * Math.PI * 2
      const x = Math.floor(centerX + radius * Math.cos(angle))
      const y = Math.floor(centerY + radius * Math.sin(angle))
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        
        const colorDistance = Math.sqrt(
          Math.pow(r - targetColor.r, 2) +
          Math.pow(g - targetColor.g, 2) +
          Math.pow(b - targetColor.b, 2)
        )
        
        totalChecks++
        if (colorDistance < 100) {
          totalMatches++
        }
      }
    }
  })
  
  if (totalChecks === 0) return 0
  
  const patternScore = (totalMatches / totalChecks) * 100
  return Math.min(100, patternScore * 1.2)
}

/**
 * QR code detection - reliable fallback method
 */
export function detectQRCode(imageData: ImageData): string | null {
  try {
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })
    
    if (code && code.data) {
      // QR code should contain hotspot ID in format: "hotspot-{id}"
      const match = code.data.match(/^hotspot-(.+)$/)
      if (match) {
        return match[1]
      }
    }
  } catch (err) {
    console.error('QR detection error:', err)
  }
  
  return null
}

/**
 * Combined detection - uses multiple methods for robust detection
 */
export function detectPulsatingHotspot(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  accentColor: 'green' | 'blue'
): DetectionResult {
  const ctx = canvasElement.getContext('2d', { willReadFrequently: true })
  
  if (!ctx || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
    return { confidence: 0, method: 'combined' }
  }
  
  // Set canvas size to match video
  canvasElement.width = videoElement.videoWidth
  canvasElement.height = videoElement.videoHeight
  
  // Draw current video frame
  ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height)
  
  // Get image data from center region (where user points camera)
  const centerX = canvasElement.width / 2
  const centerY = canvasElement.height / 2
  const sampleSize = Math.min(canvasElement.width, canvasElement.height) * 0.4
  
  const startX = Math.floor(centerX - sampleSize / 2)
  const startY = Math.floor(centerY - sampleSize / 2)
  
  try {
    const imageData = ctx.getImageData(startX, startY, sampleSize, sampleSize)
    
    // Define target color
    const targetColor: ColorTarget = accentColor === 'green'
      ? { r: 22, g: 132, b: 71, name: 'green' }
      : { r: 70, g: 169, b: 216, name: 'blue' }
    
    // Try QR code detection first (most reliable)
    const qrHotspotId = detectQRCode(imageData)
    if (qrHotspotId) {
      return {
        confidence: 100,
        method: 'qr',
        hotspotId: qrHotspotId
      }
    }
    
    // Use multiple visual detection methods
    const colorScore = detectByColor(imageData, targetColor)
    const brightnessScore = detectByBrightness(imageData)
    const patternScore = detectCircularPattern(imageData, targetColor)
    
    // Weighted combination
    const combinedScore = (
      colorScore * 0.4 +
      brightnessScore * 0.3 +
      patternScore * 0.3
    )
    
    return {
      confidence: Math.min(100, combinedScore),
      method: 'combined'
    }
  } catch (err) {
    console.error('Detection error:', err)
    return { confidence: 0, method: 'combined' }
  }
}

/**
 * Temporal smoothing - prevents flickering by requiring stable detection
 */
export class DetectionSmoother {
  private history: number[] = []
  private readonly historySize = 5
  
  addSample(confidence: number): number {
    this.history.push(confidence)
    
    if (this.history.length > this.historySize) {
      this.history.shift()
    }
    
    // Return average of recent samples
    const sum = this.history.reduce((a, b) => a + b, 0)
    return sum / this.history.length
  }
  
  reset(): void {
    this.history = []
  }
  
  isStable(threshold: number = 70): boolean {
    if (this.history.length < 3) return false
    
    // Check if last 3 samples are all above threshold
    return this.history.slice(-3).every(v => v >= threshold)
  }
}
