# Quick Reference - AR Monument Experience

## 🚀 Start Development

```bash
npm run dev
```

Opens: `http://localhost:3000`  
WebSocket: Running on same port

---

## 📱 Test Two-Device Sync

### Device 1 (Display - Laptop/Tablet)
1. Open `http://localhost:3000`
2. Sign in as **participant**
3. Navigate to monument → Explore
4. See one pulsating hotspot
5. **Leave this window open**

### Device 2 (Scanner - Phone)
1. Find your computer's local IP:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`
2. Open `http://[YOUR-IP]:3000` on phone
3. Sign in with **SAME account**
4. Navigate to same monument
5. Click "Open AR Scanner"
6. Click "Start Scanning"
7. Point at Device 1 screen
8. Click camera button
9. **Watch Device 1 update instantly!** ⚡

---

## 📂 Key Files

### WebSocket
- `server.js` - WebSocket server
- `lib/websocket.ts` - Client library

### Pages
- `app/monuments/[slug]/explore/page.tsx` - Main experience
- `app/monuments/[slug]/scanner/page.tsx` - AR scanner
- `app/challenge/[slug]/quiz/page.tsx` - Quiz with voter card

### APIs
- `app/api/auth/route.ts` - Sign up/in
- `app/api/progress/route.ts` - Progress sync
- `app/api/leaderboard/route.ts` - Leaderboard + voter card

### Configuration
- `.env` - Environment variables
- `package.json` - Scripts and dependencies
- `supabase/schema.sql` - Database schema

---

## 🎯 Key Concepts

### Roles
- **Participant:** Sequential hotspot scanning, one at a time
- **Organizer:** View all hotspots, setup mode

### Two-Device Flow
```
Device 1 (Display) ←→ [WebSocket] ←→ Device 2 (Scanner)
         ↓                              ↓
    Supabase Database (shared state)
```

### Sync Latency
- WebSocket: **50-150ms** ⚡
- Database persistence: Always saved
- Auto-reconnect: Exponential backoff

---

## 🐛 Debug Checklist

### WebSocket Not Connected?
1. Check server running: `npm run dev`
2. Look for: "WebSocket server running"
3. Browser console: `[WebSocket] Connected`
4. Network tab → Filter: WS

### Scan Not Syncing?
1. Same user on both devices? ✅
2. Both connected? Check console
3. Server logs showing events?
4. Try manual refresh as fallback

### Camera Issues?
1. Permissions granted?
2. Browser supports camera API?
3. Use Chrome/Safari

---

## 📊 Status

| Feature | Status |
|---------|--------|
| Participant Flow | ✅ |
| Organizer Flow | ✅ |
| Sequential Scanning | ✅ |
| Two-Device Sync | ✅ |
| Voter Card Collection | ✅ |
| Election Content | ✅ |
| Dynamic Questions | ✅ |
| AR Auto-Detection | ⏭️ Next |

---

## 📚 Documentation

- `WEBSOCKET_IMPLEMENTATION.md` - Technical deep dive
- `TWO_DEVICE_SYNC_GUIDE.md` - Architecture details
- `TESTING_WEBSOCKET.md` - Testing instructions
- `IMPLEMENTATION_COMPLETE.md` - What's been built
- `PROJECT_STATUS.md` - Complete overview
- `QUICK_REFERENCE.md` - This file

---

## ⚡ Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Install dependencies
npm install
```

---

## 🔧 Environment Variables

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# WebSocket (already configured)
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

---

## ✅ What Works

- ✅ Role selection (participant/organizer)
- ✅ Sequential hotspot scanning
- ✅ Pulsating animation
- ✅ Real-time WebSocket sync (50-150ms)
- ✅ Database persistence
- ✅ Multi-user isolation
- ✅ Auto-reconnection
- ✅ Voter card collection
- ✅ Dynamic questions
- ✅ Election campaign content
- ✅ Scorecard sharing

---

## ⏭️ What's Next

**Priority:** Automatic AR detection
- Replace manual scan button
- Auto-detect pulsating hotspot
- Color/brightness detection
- No click required

See `PROJECT_STATUS.md` for detailed plan.

---

## 🎉 Quick Win

Want to see it working right now?

```bash
# Terminal
npm run dev

# Browser 1
http://localhost:3000
→ Sign in as participant
→ Explore monument

# Browser 2 (new window)
http://localhost:3000
→ Sign in with same account
→ Open scanner → Scan
→ Watch Browser 1 update instantly! ⚡
```

---

**That's it!** You're ready to develop and test. 🚀
