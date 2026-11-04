# Testing Guide - AR Scanner Two-Device Experience

## Quick Start

### Prerequisites
- ✅ Two devices (laptop + phone) OR two browser windows
- ✅ Same WiFi network (for real two-device test)
- ✅ Modern browser with camera support

### Start the Server

```bash
npm run dev
```

Server will start on `http://localhost:3000` with WebSocket enabled.

---

## Test Scenario 1: Single Device (Quick Test)

**Purpose:** Verify basic functionality without two devices

### Steps

1. **Open Browser:** `http://localhost:3000`

2. **Sign In:**
   - Click "Sign In"
   - Create account: "TestUser"
   - Select "I'm a Participant"
   - Click "Sign Up"

3. **Navigate:**
   - Click "Monuments"
   - Choose "Bola Ahmed Tinubu" or "Babajide Sanwo-Olu"
   - Click "Explore Monument"

4. **Verify Explore Page:**
   - ✅ See portrait with ONE pulsating hotspot
   - ✅ Progress shows "0 / X discovered"
   - ✅ Console shows: `[WebSocket] Connected`
   - ✅ Console shows: `[Explore] WebSocket connected`

5. **Click Pulsating Hotspot:**
   - Click the glowing number on portrait
   - ✅ See scanning animation (spinning circle)
   - ✅ After 1.5 seconds, story panel appears
   - ✅ Progress updates to "1 / X discovered"

6. **Verify Database Persistence:**
   - Refresh page (F5)
   - ✅ Progress remains: "1 / X discovered"
   - ✅ Next hotspot is now pulsating
   - ✅ Previous hotspot shows checkmark

**✅ PASS:** Data synchronization working!

---

## Test Scenario 2: Two Browser Windows (WebSocket Test)

**Purpose:** Test WebSocket real-time sync on same computer

### Steps

1. **Window 1 - Display:**
   - Open: `http://localhost:3000`
   - Sign in as "TestUser" (participant)
   - Navigate to monument → Explore
   - **Leave this window visible**

2. **Window 2 - Scanner Simulation:**
   - Open NEW browser window (not tab)
   - Navigate: `http://localhost:3000`
   - Sign in as **SAME USER** ("TestUser")
   - Navigate to same monument → Explore
   - Click "Open AR Scanner"

3. **In Window 2 (Scanner):**
   - Click "Start Scanning"
   - Allow camera permissions
   - Click the camera button (manual trigger)

4. **Watch Window 1:**
   - ✅ Should update **INSTANTLY** (within 200ms)
   - ✅ Shows scanning animation
   - ✅ Reveals story panel
   - ✅ Progress increments

5. **Verify WebSocket:**
   - Check Window 1 console:
   ```
   [WebSocket] Connected
   [Explore] WebSocket connected
   [WebSocket] Scanner detection: hotspot-id
   ```

**✅ PASS:** WebSocket real-time sync working!

---

## Test Scenario 3: Two Physical Devices (Full AR Test)

**Purpose:** Test complete two-device AR experience with camera

### Setup

1. **Find Your Local IP:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address"
   # Example: 192.168.1.100
   
   # Mac/Linux
   ifconfig
   # Look for "inet"
   ```

2. **Ensure Firewall Allows Port 3000:**
   ```bash
   # Windows
   # Open Windows Firewall → Inbound Rules → Allow Port 3000
   ```

### Device 1: Display (Laptop/Tablet)

1. **Open:** `http://localhost:3000`

2. **Sign In:**
   - Username: "Participant1"
   - Role: "I'm a Participant"

3. **Navigate:**
   - Monuments → Choose one → Explore

4. **Verify Display:**
   - ✅ ONE pulsating hotspot visible
   - ✅ Number glowing on portrait
   - ✅ WebSocket connected (check console)

5. **Important:**
   - **Maximize window** to full screen
   - **Keep screen on** (disable sleep mode)
   - **Good lighting** on screen

### Device 2: Scanner (Phone)

1. **Open:** `http://[YOUR-LOCAL-IP]:3000`
   - Example: `http://192.168.1.100:3000`

2. **Sign In:**
   - Username: **"Participant1"** (SAME as Device 1!)
   - Role: "I'm a Participant"

3. **Navigate:**
   - Monuments → Same monument → Explore

4. **Open Scanner:**
   - Click "Open AR Scanner" link
   - Click "Start Scanning"
   - **Allow camera permissions**

5. **Point Camera:**
   - Point phone camera at Device 1 screen
   - **Aim at the pulsating hotspot**
   - Hold steady for 2-3 seconds
   - Watch progress bar increase

6. **Automatic Detection:**
   - ✅ Progress bar reaches 70%+
   - ✅ Frame turns green
   - ✅ "Target Locked!" message
   - ✅ Auto-triggers after 3 stable frames
   - ✅ "Marker Detected!" screen
   - ✅ Redirects to explore page

### Verify Device 1:

- ✅ Updates **INSTANTLY** (within 200ms)
- ✅ Shows scanning animation
- ✅ Story panel appears automatically
- ✅ Progress bar updates

**✅ PASS:** Complete AR two-device sync working!

---

## AR Detection Settings

### Confidence Threshold
- **Minimum:** 70% confidence
- **Stability:** 3 consecutive frames above threshold
- **Debounce:** 2-second cooldown between scans

### Color Detection
- **Green Monument:** RGB(22, 132, 71) - #168447
- **Blue Monument:** RGB(70, 169, 216) - #46a9d8
- **Tolerance:** ±80 units Euclidean distance

### Brightness Detection
- **Pulsating Glow:** Pixels > 180 brightness
- **Weight:** 30% of confidence score

---

## Troubleshooting

### Issue: WebSocket Not Connected

**Symptoms:**
- Console shows: `[WebSocket] Connection error`
- Updates don't sync between devices

**Solutions:**
1. Check server running: Terminal shows "WebSocket server running"
2. Verify port 3000 not blocked by firewall
3. Check `.env` has `NEXT_PUBLIC_WS_URL=http://localhost:3000`
4. Restart server: `Ctrl+C` then `npm run dev`

### Issue: Scanner Not Detecting

**Symptoms:**
- Progress bar stays at 0%
- Camera shows but nothing happens

**Solutions:**
1. **Check Lighting:**
   - Ensure good lighting on display screen
   - Avoid glare or reflections
   - Increase screen brightness

2. **Check Alignment:**
   - Point camera directly at pulsating hotspot
   - Not too close (arm's length)
   - Not too far (within 1-2 feet)

3. **Check Color:**
   - Verify pulsating hotspot is clearly visible
   - Green or blue should be prominent
   - No color filters or night mode on display

4. **Check Camera:**
   - Grant camera permissions
   - Use back camera (not selfie camera)
   - Clear camera lens

### Issue: Can't Access from Phone

**Symptoms:**
- Phone can't load `http://192.168.1.100:3000`

**Solutions:**
1. **Same Network:**
   - Both devices on same WiFi
   - Not on cellular data

2. **Correct IP:**
   - Verify IP with `ipconfig` or `ifconfig`
   - Try http://YOUR-IP:3000 in phone browser

3. **Firewall:**
   - Windows: Allow port 3000 in firewall
   - Mac: System Preferences → Security → Firewall → Allow Node

### Issue: Detection Too Sensitive/Insensitive

**Adjust Thresholds:**

Edit `app/monuments/[slug]/scanner/page.tsx`:

```typescript
// Line ~150: Color tolerance
if (colorDistance < 80) { // Increase to 100 for more tolerance
  colorMatches++
}

// Line ~160: Brightness threshold
if (brightness > 180) { // Lower to 160 for dimmer detection
  brightPixels++
}

// Line ~290: Confidence threshold
if (confidence >= 70) { // Lower to 60 for easier detection
  consecutiveDetections++
}
```

---

## Performance Expectations

### Latency
- **WebSocket Sync:** 50-150ms (typically ~75ms)
- **Detection Rate:** 60fps (requestAnimationFrame)
- **Scan Cooldown:** 2 seconds between detections

### Network
- **WebSocket:** Persistent connection, ~1KB per event
- **Database:** REST API, ~2KB per request
- **Bandwidth:** Minimal, suitable for mobile networks

---

## Console Debugging

### Expected Logs (Device 1 - Display)

```javascript
[WebSocket] Connected
[Explore] WebSocket connected
// After Device 2 scans:
[WebSocket] Scanner detection: chapter-1-hotspot
```

### Expected Logs (Device 2 - Scanner)

```javascript
[WebSocket] Connected
Auto-detected hotspot: chapter-1-hotspot
Scanned hotspot: chapter-1-hotspot
```

### Server Logs

```
> Ready on http://localhost:3000
> WebSocket server running
[WebSocket] Player abc-123 connected
[WebSocket] Player abc-123 joined monument:tinubu:abc-123
[WebSocket] Scanner detection: chapter-1-hotspot
[WebSocket] Progress broadcast: chapter-1-hotspot for player abc-123
```

---

## Next Steps After Testing

### If Tests Pass ✅

1. **Document Results:**
   - Note detection accuracy
   - Record sync latency
   - Screenshot successful detection

2. **Production Deployment:**
   - See `FINAL_IMPLEMENTATION_REPORT.md` section E
   - Deploy to Railway/Render (includes WebSocket)
   - Update `NEXT_PUBLIC_WS_URL` to production domain

3. **User Testing:**
   - Test with actual participants
   - Gather feedback on detection UX
   - Adjust thresholds if needed

### If Tests Fail ❌

1. **Check Build:**
   ```bash
   npm run build
   # Should show: ✓ Compiled successfully
   ```

2. **Check TypeScript:**
   - No errors in VS Code
   - All files green checkmarks

3. **Review Implementation:**
   - See `FINAL_IMPLEMENTATION_REPORT.md` for details
   - Verify all files modified correctly

4. **Debug WebSocket:**
   - Browser DevTools → Network tab → WS filter
   - Should show WebSocket connection
   - Status 101 Switching Protocols

---

## Success Criteria

### Data Synchronization ✅
- [ ] Progress persists after page refresh
- [ ] Database shows all scanned hotspots
- [ ] Multiple users don't interfere
- [ ] WebSocket events broadcast correctly

### AR Scanner ✅
- [ ] Camera initializes successfully
- [ ] Progress bar shows confidence %
- [ ] Detection triggers at 70%+ confidence
- [ ] Only pulsating hotspot triggers (not entire portrait)
- [ ] Debouncing prevents duplicate scans
- [ ] Redirects to explore after success

### WebSocket Real-Time ✅
- [ ] Devices connect successfully
- [ ] Events broadcast within 200ms
- [ ] Auto-reconnection after disconnect
- [ ] Database reconciliation on reconnect
- [ ] No memory leaks or duplicate listeners

---

**For detailed technical information, see:** `FINAL_IMPLEMENTATION_REPORT.md`

**For production deployment, see:** Report Section E - Environment Configuration
