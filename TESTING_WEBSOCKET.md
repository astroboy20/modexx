# Testing WebSocket Two-Device Sync

## Quick Start Guide

### Prerequisites
- Node.js installed
- Two devices (laptop + phone) or two browser windows
- Both devices on same WiFi network

### Step 1: Start the Server

```bash
# Install dependencies (if not already done)
npm install

# Start the WebSocket server
npm run dev
```

Expected output:
```
> Ready on http://localhost:3000
> WebSocket server running
```

### Step 2: Setup Device 1 (Display)

1. Open browser: `http://localhost:3000`
2. Click "Sign In"
3. Create test account:
   - Display Name: `TestUser`
   - Select: "I'm a Participant"
   - Click "Sign Up"
4. Navigate to "Monuments"
5. Choose "Bola Ahmed Tinubu" or "Babajide Sanwo-Olu"
6. Click "Explore Monument"
7. **Leave this window open** - you should see:
   - Portrait with one pulsating hotspot
   - Progress: 0/10 (or whatever the total is)
8. Open browser console (F12)
9. Look for these logs:
   ```
   [WebSocket] Connected
   [Explore] WebSocket connected
   ```

✅ Device 1 is ready!

### Step 3: Setup Device 2 (Scanner - Same Computer)

For testing on same computer:

1. Open **new browser window** (not tab)
2. Navigate to `http://localhost:3000`
3. Sign in with **SAME account** (TestUser)
4. Navigate to same monument
5. On explore page, click "Open AR Scanner" link
6. Click "Start Scanning"
7. Allow camera access
8. Point camera at Device 1's screen (or just click anywhere)
9. Click the camera button

### Step 3 Alternative: Setup Device 2 (Phone)

For real two-device testing:

1. Find your computer's local IP address:
   - **Windows**: Open Command Prompt → `ipconfig` → look for "IPv4 Address"
   - **Mac/Linux**: Open Terminal → `ifconfig` → look for "inet"
   - Example: `192.168.1.100`

2. On your phone, open browser
3. Navigate to: `http://[YOUR-IP]:3000`
   - Example: `http://192.168.1.100:3000`
4. Sign in with **SAME account** as Device 1
5. Navigate to same monument
6. Click "Open AR Scanner"
7. Click "Start Scanning"
8. Allow camera access
9. Point at Device 1's screen
10. Click camera button

### Step 4: Watch the Magic ✨

**When you scan on Device 2:**

1. Device 2 shows "Marker Detected!" ✅
2. **INSTANTLY** (within 100ms), Device 1:
   - Shows scanning animation 🔄
   - Reveals the hotspot topic 📖
   - Updates progress counter
   - Shows "Continue Journey" button

3. Click "Continue Journey" on Device 1
4. Next hotspot starts pulsating
5. Repeat scan on Device 2
6. Watch instant sync again!

### Expected Timing

- **Scan to Display Update**: 50-150ms (feels instant!)
- **Animation Duration**: 1.5 seconds
- **Total Experience**: ~2 seconds (1.5s animation + UI update)

### Success Indicators

✅ **WebSocket Working:**
- Console logs show `[WebSocket] Connected`
- No polling interval logs
- Updates happen instantly after scan

✅ **Database Working:**
- Progress persists after page refresh
- Can resume from any device
- Multiple users don't interfere

✅ **UI Working:**
- Smooth animations
- Clear visual feedback
- No lag or delays

---

## Troubleshooting

### Problem: "WebSocket not connected"

**Check:**
1. Is server running? Look for "WebSocket server running" in terminal
2. Is port 3000 available? Try `netstat -an | findstr 3000`
3. Are you using `npm run dev` (not `next dev`)?

**Solution:**
```bash
# Stop any running servers
# Restart with correct command
npm run dev
```

### Problem: "Scan doesn't update Device 1"

**Check:**
1. Are both devices signed in as **same user**?
2. Browser console on Device 1: Any WebSocket errors?
3. Server terminal: Do you see broadcast logs?

**Debug:**
```javascript
// In Device 1 browser console:
console.log('WS Connected:', window.location.origin)

// Look for WebSocket in Network tab (filter: WS)
// Should show: ws://localhost:3000 with status 101
```

### Problem: "Camera not working on Device 2"

**Check:**
1. Did you allow camera permissions?
2. Is camera already in use by another app?
3. Does browser support camera API? (Use Chrome/Safari)

**Solution:**
- Close other apps using camera
- Refresh page and allow permissions again
- Try different browser

### Problem: "Can't access from phone"

**Check:**
1. Is phone on same WiFi as computer?
2. Is firewall blocking port 3000?
3. Did you use correct IP address?

**Solution (Windows Firewall):**
```
1. Open Windows Firewall
2. Advanced Settings → Inbound Rules
3. New Rule → Port → TCP → 3000
4. Allow connection → Save
```

**Solution (Mac Firewall):**
```
System Preferences → Security & Privacy → Firewall
→ Firewall Options → Add Node.js → Allow
```

---

## Advanced Testing

### Test Multiple Users

**Terminal 1:**
```bash
npm run dev
```

**Browser 1 (User A):**
- Sign in as UserA (participant)
- Explore Tinubu

**Browser 2 (User A - Different Device):**
- Sign in as UserA
- Open scanner for Tinubu
- Scan → Browser 1 updates ✅

**Browser 3 (User B):**
- Sign in as UserB (participant)
- Explore Tinubu

**Browser 4 (User B - Different Device):**
- Sign in as UserB
- Open scanner for Tinubu
- Scan → Browser 3 updates ✅
- Browser 1 does NOT update ✅ (isolated)

### Test Reconnection

1. Device 1 connected and showing explore page
2. Stop server: `Ctrl+C` in terminal
3. Device 1 console: `[WebSocket] Disconnected`
4. Restart server: `npm run dev`
5. Within 10 seconds: `[WebSocket] Connected` (auto-reconnect)
6. Scan from Device 2 → Should work again ✅

### Test Fallback

1. Stop server completely
2. Device 2: Try to scan
3. Scan saves to database (falls back to HTTP)
4. Device 1: Refresh page
5. Progress loads from database ✅
6. Restart server
7. Real-time sync resumes ✅

---

## Performance Testing

### Measure Sync Latency

**Device 1 Console:**
```javascript
let scanTime = null;

// Listen for scan start
window.addEventListener('scan-detected', () => {
  scanTime = Date.now();
});

// Listen for UI update
window.addEventListener('hotspot-unlocked', () => {
  if (scanTime) {
    const latency = Date.now() - scanTime;
    console.log(`Sync latency: ${latency}ms`);
    scanTime = null;
  }
});
```

**Expected Results:**
- Local network: 50-100ms
- Same computer: 10-50ms
- Mobile network: 100-200ms

### Monitor WebSocket Traffic

1. Open DevTools → Network tab
2. Filter: WS (WebSocket)
3. Click on WebSocket connection
4. View Messages tab
5. Watch real-time events:
   - ⬆️ `scanner:detected` (outgoing from Device 2)
   - ⬇️ `hotspot:unlocked` (incoming to Device 1)

---

## Production Deployment

### Environment Variables

Update `.env` for production:

```env
# Production WebSocket URL
NEXT_PUBLIC_WS_URL=https://your-domain.com

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Build and Start

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Deploy to Vercel/Netlify

⚠️ **Important:** Standard Vercel deployment won't work for WebSocket!

**Options:**

1. **Self-hosted VPS/EC2:**
   - Deploy with PM2: `pm2 start server.js --name "ar-app"`
   - Use nginx for reverse proxy
   - SSL with Let's Encrypt

2. **Vercel + Separate WebSocket Server:**
   - Deploy Next.js app to Vercel (without WebSocket)
   - Deploy WebSocket server to Railway/Render
   - Update `NEXT_PUBLIC_WS_URL` to point to WebSocket server

3. **Railway/Render (Recommended):**
   - Deploy entire app (Next.js + WebSocket)
   - Built-in process management
   - Auto-scaling and SSL

---

## Success Checklist

Before marking as complete:

- [ ] Server starts without errors
- [ ] WebSocket connection shows in DevTools
- [ ] Device 1 receives instant updates (< 200ms)
- [ ] Progress persists after refresh
- [ ] Multiple users don't interfere
- [ ] Auto-reconnect works after server restart
- [ ] Fallback to database works without WebSocket
- [ ] Camera permissions work on mobile
- [ ] Tested on two physical devices
- [ ] Console shows no errors
- [ ] Animations are smooth

---

## Next Steps

- ✅ WebSocket implementation complete
- ⏭️ Implement proper AR marker detection
- ⏭️ Add color/brightness detection for pulsating hotspot
- ⏭️ Remove manual scan button (auto-detect)
- ⏭️ Test with real AR markers/QR codes

---

**Status:** Ready for testing! 🚀

**Expected Result:** Instant, seamless two-device sync with sub-200ms latency!
