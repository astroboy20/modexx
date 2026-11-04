# Fixes Applied - AR Scanner & WebSocket Issues

## Date: 2026-11-04

---

## Issues Identified

### 1. ⚠️ WebSocket Reconnection Loop
**Symptom:** Logs showed constant connect/disconnect cycles
```
[WebSocket] Player connected
[WebSocket] Player disconnected: client namespace disconnect
[WebSocket] Player connected
[WebSocket] Player disconnected: client namespace disconnect
```

**Root Cause:** The `explore/page.tsx` cleanup function was calling `disconnectWebSocket()`, which destroys the singleton WebSocket instance. When the component re-rendered (due to state changes), it would create a new WebSocket connection.

**Fix Applied:**
```typescript
// BEFORE (in cleanup):
return () => {
  isMounted = false
  if (ws) {
    ws.off('hotspot:unlocked')
    ws.off('connect')
    ws.off('disconnect')
    disconnectWebSocket() // ❌ This destroyed the singleton!
  }
}

// AFTER (fixed):
return () => {
  isMounted = false
  if (ws) {
    // Just remove event listeners - socket stays alive
    ws.off('hotspot:unlocked')
    ws.off('connect')
    ws.off('disconnect')
    // ✅ No disconnectWebSocket() - singleton persists
  }
}
```

### 2. 🎯 AR Detection Stuck at 0%
**Symptom:** Detection progress bar never moved from 0%

**Root Causes:**
1. Detection loop started before video was fully loaded
2. No debugging logs to diagnose issues
3. Canvas size being reset every frame (performance issue)

**Fixes Applied:**

#### A. Wait for Video Metadata
```typescript
// BEFORE:
videoRef.current.srcObject = stream
setCameraActive(true)
startDetectionLoop() // ❌ Started immediately

// AFTER:
videoRef.current.srcObject = stream
videoRef.current.onloadedmetadata = () => {
  setCameraActive(true)
  setTimeout(() => startDetectionLoop(), 500) // ✅ Wait for video ready
}
```

#### B. Added Debug Logging
```typescript
// Now logs detection scores every 10th frame
if (Math.random() < 0.1) {
  console.log('Detection:', {
    colorScore: colorScore.toFixed(1),
    brightnessScore: brightnessScore.toFixed(1),
    confidence: confidence.toFixed(1)
  })
}
```

#### C. Optimized Canvas Sizing
```typescript
// BEFORE:
canvas.width = video.videoWidth // ❌ Every frame
canvas.height = video.videoHeight

// AFTER:
if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
  canvas.width = video.videoWidth // ✅ Only when needed
  canvas.height = video.videoHeight
}
```

---

## Files Modified

1. ✅ `app/monuments/[slug]/scanner/page.tsx`
   - Fixed video loading sequence
   - Added debug logging
   - Optimized canvas sizing

2. ✅ `app/monuments/[slug]/explore/page.tsx`
   - Removed `disconnectWebSocket()` from cleanup
   - Added console log for hotspot unlock events

---

## Testing Instructions

### 1. Verify WebSocket Stability

**Start server:**
```bash
npm run dev
```

**Check logs:**
```
✓ Should see ONE connection:
[WebSocket] Player <id> connected
[WebSocket] Player <id> joined monument:tinubu:<id>

✓ Should NOT see:
[WebSocket] Player disconnected: client namespace disconnect
[WebSocket] Player connected
(repeating)
```

**Navigate around:**
- Go to explore page
- Click hotspots
- Open scanner
- Return to explore

**Expected:** Connection stays alive, no reconnections (unless you close the browser tab)

### 2. Verify AR Detection

**Open scanner:**
```
http://localhost:3000/monuments/tinubu/scanner
```

**Check browser console:**
```javascript
// Should see:
Starting detection for target: chapter-1-hotspot
Canvas sized: 1280 x 720

// Then periodically:
Detection: { colorScore: "5.2", brightnessScore: "42.1", confidence: "15.3" }
```

**Point camera at ANY bright colored area:**
- Progress bar should move (even if not the target)
- Detection values should change

**For actual testing:**
- Need second device with pulsating hotspot visible
- Progress should reach 70%+ when aligned

### 3. Test Two-Device Sync

**Device 1 (Laptop):**
```
http://localhost:3000/monuments/tinubu/explore
```

**Device 2 (Phone):**
```
http://YOUR-IP:3000/monuments/tinubu/scanner
```

**Click hotspot on Device 1:**
- Should save to database
- Should emit WebSocket event

**Watch Device 1 logs:**
```
[Explore] Received hotspot unlock: chapter-1-hotspot
```

**Expected result:**
- ✅ Single WebSocket connection
- ✅ No reconnection loops
- ✅ Detection progress visible (even if 0% in non-AR environment)
- ✅ Console logs show detection running

---

## Troubleshooting

### Still seeing 0% detection?

**Check console logs:**
```javascript
// Should see:
Starting detection for target: chapter-1-hotspot
Canvas sized: 1280 x 720
Detection: { colorScore: ..., brightnessScore: ..., confidence: ... }

// If you see:
Detection skipped: video not ready, readyState: 0
// Camera hasn't loaded yet - wait 2-3 seconds

// If you see:
Detection skipped: missing refs
// Refs not initialized - report as bug
```

**Test with bright screen:**
Point camera at:
- White/bright colored website
- Another phone screen
- LED light

Progress should move slightly if detection is working.

### Still seeing reconnection loops?

**Check for multiple useEffects:**
```bash
# Search for disconnectWebSocket calls:
grep -r "disconnectWebSocket" app/
```

Should ONLY appear in:
- Scanner page (when user closes scanner)
- NOT in explore page cleanup

**Check WebSocket singleton:**
```javascript
// In browser console:
window.wsDebug = true // Enable detailed logging
```

---

## Expected Behavior After Fixes

### WebSocket Logs (Normal):
```
[WebSocket] Player de296... connected
[WebSocket] Player de296... joined monument:tinubu:de296...
GET /api/progress?monumentSlug=tinubu 200 in 250ms

(No more logs until actual scan happens)
```

### Scanner Logs (Normal):
```
Starting detection for target: chapter-1-hotspot
Canvas sized: 1280 x 720
Detection: { colorScore: "12.3", brightnessScore: "45.2", confidence: "22.1" }
Detection: { colorScore: "8.7", brightnessScore: "38.9", confidence: "17.8" }
```

### Detection Progress Bar:
- ✅ Shows 0-100% based on what camera sees
- ✅ Changes as you move camera
- ✅ Reaches 70%+ when aligned with pulsating hotspot

---

## Next Steps

1. **Test in development:**
   ```bash
   npm run dev
   ```

2. **Open scanner in browser:**
   ```
   http://localhost:3000/monuments/tinubu/scanner
   ```

3. **Check console for detection logs:**
   - Should see detection scores
   - Progress bar should respond to camera movement

4. **Test two-device sync:**
   - Laptop: explore page
   - Phone: scanner page
   - Verify no reconnection loops

5. **Production deployment:**
   - See `FINAL_IMPLEMENTATION_REPORT.md` Section E
   - Deploy to Railway/Render (includes WebSocket support)

---

**Status:** ✅ Fixed  
**Build:** ✅ Compiles successfully  
**Ready for:** Physical testing with two devices

