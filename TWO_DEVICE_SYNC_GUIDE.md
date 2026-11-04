# Two-Device Sync Guide

## 🔄 How Progress Syncing Works

### **Problem Solved:**
- ❌ localStorage doesn't sync between devices
- ✅ **Supabase database** syncs in real-time!

---

## 🎯 Architecture

### **Database Table: `exploration_progress`**
```sql
- player_id         (links to authenticated user)
- monument_slug     (tinubu or sanwo-olu)
- hotspot_id        (which hotspot was scanned)
- scanned_at        (timestamp)
- UNIQUE constraint (player_id, monument_slug, hotspot_id)
```

### **API Endpoints:**

#### **GET /api/progress?monumentSlug=tinubu**
- Returns all scanned hotspots for the current user
- Used by both devices to load progress

#### **POST /api/progress**
```json
{
  "monumentSlug": "tinubu",
  "hotspotId": "hotspot-1"
}
```
- Saves a scanned hotspot
- Called when AR scanner detects or user clicks

---

## 📱 Two-Device Flow

### **Device 1 (Display - Laptop/Tablet):**

```
1. User signs in as participant
   ↓
2. Opens /monuments/tinubu/explore
   ↓
3. Page loads progress from database (GET /api/progress)
   ↓
4. Shows current unscanned hotspot pulsating
   ↓
5. Polls database every 2 seconds for updates
   ↓
6. When Device 2 scans, detects new progress
   ↓
7. Automatically unlocks hotspot with animation
   ↓
8. Shows story content
   ↓
9. User clicks "Continue Journey"
   ↓
10. Next hotspot starts pulsating
```

### **Device 2 (Scanner - Phone):**

```
1. User opens AR Scanner on phone
   ↓
2. Opens /monuments/tinubu/scanner
   ↓
3. Activates camera
   ↓
4. Points at pulsating hotspot on Device 1
   ↓
5. Taps camera button
   ↓
6. Loads progress from database (GET /api/progress)
   ↓
7. Finds next unscanned hotspot
   ↓
8. Saves scan to database (POST /api/progress)
   ↓
9. Shows "Marker Detected!" success
   ↓
10. Redirects back to explore page
   ↓
11. Device 1 detects the scan via polling
   ↓
12. Both devices now show updated progress
```

---

## ⚡ Real-Time Sync

### **How Devices Stay In Sync:**

1. **Initial Load:**
   - Both devices query `/api/progress` on page load
   - Get current scanned hotspots from database

2. **Polling (Every 2 seconds):**
   - Device 1 (display) polls `/api/progress` continuously
   - Detects when Device 2 completes a scan
   - Triggers unlock animation automatically

3. **Database as Source of Truth:**
   - All progress stored in Supabase
   - No localStorage dependency
   - Works across any number of devices

---

## 🔐 Security & User Isolation

### **Session-Based:**
- Uses cookies for authentication
- Each user only sees their own progress
- Scans tied to `player_id` from session

### **Database RLS:**
```sql
-- Public read (for leaderboard)
create policy "Public read progress"
  on public.exploration_progress for select
  using (true);

-- Write controlled via service role (API only)
```

---

## 📊 Example Scenario

### **Participant: @Adaeze_K**

**Device 1 (Laptop at station):**
- Shows Tinubu portrait
- Hotspot #1 pulsating
- Progress: 0/10

**Device 2 (Her phone):**
- Opens AR Scanner
- Scans hotspot #1
- Success! → Saves to DB

**Result:**
```
Database now contains:
{
  player_id: "abc-123",
  monument_slug: "tinubu", 
  hotspot_id: "hotspot-1",
  scanned_at: "2026-11-04T..."
}
```

**Device 1 (2 seconds later):**
- Polls and finds new progress
- Triggers unlock animation
- Shows hotspot #1 story
- Progress: 1/10
- Hotspot #2 now pulsating

**Both devices synced!** ✅

---

## 🎮 Multiple Participants

### **Station Setup:**

**Station A:**
- Device 1A (laptop): User @Adaeze_K signed in
- Device 2A (phone): Scans for @Adaeze_K

**Station B:**
- Device 1B (laptop): User @Chidi_O signed in  
- Device 2B (phone): Scans for @Chidi_O

**No Conflicts:**
- Each user has own `player_id`
- Database tracks separately
- Progress isolated per user

---

## 🔄 Fallback Options

### **If Device 2 Unavailable:**
- Click pulsating hotspot directly on Device 1
- Still saves to database
- Works without AR scanner

### **If Polling Fails:**
- Refresh Device 1 page
- Loads latest progress from database
- Manual sync

---

## 📈 Benefits

### **Why Database Sync:**

✅ **Real-time** - Updates within 2 seconds
✅ **Reliable** - Supabase handles consistency
✅ **Multi-device** - Works on any device count
✅ **Persistent** - Progress saved permanently
✅ **Secure** - User isolation via player_id
✅ **Scalable** - Handles multiple concurrent users
✅ **Resumable** - Can leave and come back
✅ **Analytics-ready** - Track all scans in DB

---

## 🚀 Setup Required

### **1. Run Database Migration:**
```sql
-- Add exploration_progress table
-- See: supabase/reset-database.sql (bottom)
```

### **2. Verify API Endpoints:**
- `/api/progress` - GET and POST working
- Test with Postman/Thunder Client

### **3. Test Two-Device Flow:**
- Device 1: Open explore page
- Device 2: Open scanner on phone
- Scan and verify Device 1 updates

---

## 🐛 Debugging

### **Check Database:**
```sql
-- View all progress for a user
select * from exploration_progress
where player_id = 'your-player-id'
order by scanned_at desc;

-- View progress for a monument
select * from exploration_progress
where monument_slug = 'tinubu'
order by scanned_at desc;
```

### **Check API:**
```bash
# Get progress
curl http://localhost:3000/api/progress?monumentSlug=tinubu \
  -H "Cookie: modexx_session=..."

# Save progress
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -H "Cookie: modexx_session=..." \
  -d '{"monumentSlug":"tinubu","hotspotId":"hotspot-1"}'
```

### **Check Console:**
- Device 1: Watch for polling logs
- Device 2: Check "Scanned hotspot: X" log
- Look for API errors

---

## ✅ Success Checklist

- [ ] Database table created
- [ ] API endpoints working
- [ ] Device 1 loads progress on mount
- [ ] Device 1 polls every 2 seconds
- [ ] Device 2 can save scans
- [ ] Device 1 detects Device 2 scans
- [ ] Progress persists across page refreshes
- [ ] Multiple users don't interfere
- [ ] Fallback click still works

---

## 🎉 Result

**True two-device syncing via Supabase!**

No localStorage, no conflicts - just clean real-time database sync that works across any devices! 🚀
