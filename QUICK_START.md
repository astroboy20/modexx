# Quick Start Guide - Participant Flow

## 🚀 Get Up and Running in 3 Steps

### Step 1: Database Setup (Choose One)

#### Option A: Fresh Start (Recommended for testing)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/reset-database.sql`
3. Paste and click **Run**
4. ✅ Done! All tables created with correct schema

#### Option B: Keep Existing Data
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migration-add-participant-flow.sql`
3. Paste and click **Run**
4. ✅ Done! Columns added, data preserved

📖 **Detailed instructions:** See `DATABASE_SETUP_GUIDE.md`

---

### Step 2: Add Deputy Governor Image

1. Find or create an image of Obafemi Hamzat (Lagos Deputy Governor)
2. Name it `hamzat.jpg`
3. Place it in `/public/hamzat.jpg`
4. Recommended: 400x400px, square format

📖 **Image requirements:** See `IMAGE_ASSETS_TODO.md`

---

### Step 3: Test the Flow

1. **Clear browser data** (cookies, cache)
2. **Start dev server:** `npm run dev`
3. **Create accounts:**
   - Sign up as **Participant** (test AR scanning flow)
   - Sign up as **Organizer** (test setup flow)

#### Test Participant Flow:
- ✅ Sign up with "Participant" role
- ✅ Click "Explore Monument" (Sanwo-Olu or Tinubu)
- ✅ See one hotspot at a time (pulsating)
- ✅ Click "Scan Location in AR"
- ✅ Read the topic revealed
- ✅ Continue to next hotspot
- ✅ Complete all 10 hotspots
- ✅ Take the quiz (questions should be different each time)
- ✅ Enter voter card number before submission
- ✅ View results and create scorecard
- ✅ Verify Hamzat image and election countdown appear

#### Test Organizer Flow:
- ✅ Sign up with "Organizer" role
- ✅ Click "Explore Monument"
- ✅ See all hotspots at once on portrait
- ✅ Click through all chapters
- ✅ Take the quiz (no voter card required)
- ✅ View results

---

## 📁 Key Files Modified

### Core Functionality:
- `app/signin/component/signup-tab.tsx` - Role selection UI
- `app/monuments/[slug]/explore/page.tsx` - AR scanning + organizer flow
- `app/challenge/[slug]/quiz/page.tsx` - Voter card collection
- `components/ScorecardPreview.tsx` - Election countdown & Hamzat image

### Backend:
- `app/api/auth/route.ts` - User role handling
- `app/api/leaderboard/route.ts` - Voter card storage
- `lib/quiz.ts` - Dynamic question randomization
- `lib/session-client.ts` - Session with role

### Database:
- `supabase/schema.sql` - Updated schema (reference)
- `supabase/migration-add-participant-flow.sql` - Migration script
- `supabase/reset-database.sql` - Full reset script

---

## 🎯 What's New

### For Participants:
1. **Role Selection** - Choose "Participant" during signup
2. **AR Scanning** - Sequential hotspot exploration (one at a time)
3. **Dynamic Questions** - Different questions for each attempt
4. **Voter Card** - Required before quiz submission
5. **Campaign Integration** - Hamzat photo + election countdown on scorecard

### For Organizers:
1. **Role Selection** - Choose "Organizer" during signup
2. **Full Access** - View all hotspots simultaneously
3. **No Voter Card** - Skip voter card collection
4. **Setup Mode** - Configure challenges and content

---

## 📊 Admin Dashboard (Next Steps)

To view participant data:

```sql
-- Get all participants with voter cards
SELECT 
  display_name,
  voters_card_number,
  monument_slug,
  score,
  completed_at
FROM public.leaderboard_entries
WHERE voters_card_number IS NOT NULL
ORDER BY completed_at DESC;
```

📖 **Full admin guide:** See `ADMIN_DASHBOARD_REQUIREMENTS.md`

---

## 🐛 Troubleshooting

### "Policy already exists" error
→ Use `supabase/reset-database.sql` to start fresh

### "Column already exists" error
→ Column was already added, skip that step

### Role selection not showing
→ Clear browser cookies and refresh

### Questions are the same each time
→ Working as expected! They're random per NEW attempt/session

### Voter card modal not appearing
→ Make sure you're signed in as a "Participant"

### Hamzat image not showing
→ Verify `public/hamzat.jpg` exists

### Election countdown shows wrong date
→ Check `ELECTION_DATE` in `components/ScorecardPreview.tsx`

---

## ✅ Success Checklist

- [ ] Database migration completed (no errors)
- [ ] `hamzat.jpg` added to `/public/`
- [ ] Development server running
- [ ] Created participant test account
- [ ] Created organizer test account
- [ ] Tested participant AR scanning flow
- [ ] Tested organizer view all hotspots flow
- [ ] Completed quiz as participant with voter card
- [ ] Completed quiz as organizer without voter card
- [ ] Generated scorecard with Hamzat image
- [ ] Verified election countdown displays
- [ ] Different participants get different questions
- [ ] Voter card stored in database

---

## 🎉 You're Ready!

Once all items are checked, your participant flow is fully operational!

**Next Steps:**
1. Build admin dashboard (see `ADMIN_DASHBOARD_REQUIREMENTS.md`)
2. Add real AR camera integration (optional enhancement)
3. Set up analytics tracking
4. Deploy to production

---

## 📚 Documentation Index

- `QUICK_START.md` ← You are here
- `DATABASE_SETUP_GUIDE.md` - Detailed database instructions
- `PARTICIPANT_FLOW_IMPLEMENTATION.md` - Technical implementation details
- `ADMIN_DASHBOARD_REQUIREMENTS.md` - Admin dashboard specs
- `IMAGE_ASSETS_TODO.md` - Image requirements
