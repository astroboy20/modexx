# Participant Flow Implementation Summary

## Overview
Implemented a complete participant flow for the Modexx AR monument exploration platform with the following key features:

## 1. User Role Selection (Auth Page)
**File: `app/signin/component/signup-tab.tsx`**
- Added role selection toggle during registration
- Users can choose between "Participant" or "Organizer" role
- Role is stored in the database and session cookie

**Database Changes: `supabase/schema.sql`**
- Added `user_role` column to `players` table with values: 'participant' or 'organizer'
- Added `voters_card_number` column to `leaderboard_entries` table

**Session Updates:**
- Updated `lib/session-client.ts` to include `userRole` in session interface
- Updated `app/api/auth/route.ts` to handle user role in signup/signin

## 2. AR Scanning Experience (Participant Flow)
**File: `app/monuments/[slug]/explore/page.tsx`**

### For Participants:
- **Sequential hotspot scanning**: One hotspot shown at a time (not all at once)
- **Pulsating AR indicator**: Visual emphasis on scanning with animated circle
- **Topic revelation**: After scanning, the topic/story for that location is displayed
- **Progress tracking**: Visual progress bar showing scanned vs total hotspots
- **Complete exploration**: Must scan all hotspots before accessing the challenge

### For Organizers:
- **Original flow preserved**: Can view all hotspots at once on portrait
- **Setup mode**: Access to view all content and configure challenges
- **No AR scanning required**: Direct access to all information

## 3. Dynamic Question Randomization
**File: `lib/quiz.ts`**
- Enhanced `selectQuestions()` function with improved randomization
- Uses timestamp + random seed for better uniqueness
- Ensures 10 participants taking quiz simultaneously get different question sets

## 4. Voter Card Collection (Participants Only)
**File: `app/challenge/[slug]/quiz/page.tsx`**
- Before quiz submission, participants must enter voter's card number
- Modal dialog appears after answering all questions
- Voter card number required for submission
- Stored in leaderboard for admin dashboard visibility

**API Update: `app/api/leaderboard/route.ts`**
- Accepts `votersCardNumber` parameter
- Stores voter card with leaderboard entry
- Admin can view participant name + voter card in dashboard

## 5. Election Campaign Integration
**File: `components/ScorecardPreview.tsx`**

### Deputy Governor Promotion:
- **Sanwo-Olu monument**: Shows Obafemi Hamzat photo with "Vote for Hamzat" message
- **Tinubu monument**: Shows Hamzat photo with "Vote for Hamzat" message (linking both leaders)

### Countdown Timer:
- Live countdown to 2027 Lagos Gubernatorial Election (March 18, 2027)
- Updates every minute
- Displayed on scorecard downloads and shares
- Format: "Xd Xh" or "Xy Xd" for dates far in future

### Sharing Enhancement:
- Scorecard shares include:
  - Monument completion stats
  - Deputy governor campaign message
  - Election countdown
  - Challenge to beat score

## Database Migration Required

Run this SQL in your Supabase project:

```sql
-- Add user_role column to players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS user_role VARCHAR(20) NOT NULL DEFAULT 'participant' 
CHECK (user_role IN ('participant', 'organizer'));

-- Add voters_card_number column to leaderboard_entries
ALTER TABLE public.leaderboard_entries 
ADD COLUMN IF NOT EXISTS voters_card_number VARCHAR(50);

-- Update the leaderboard_best view to include voters_card_number
CREATE OR REPLACE VIEW public.leaderboard_best AS
  SELECT DISTINCT ON (player_id, monument_slug)
    id,
    player_id,
    monument_slug,
    display_name,
    voters_card_number,
    score,
    correct_count,
    completion_seconds,
    completed_at
  FROM public.leaderboard_entries
  ORDER BY player_id, monument_slug, score DESC, correct_count DESC, completion_seconds ASC;
```

## Required Assets

Add the following image to `/public/`:
- `hamzat.jpg` - Photo of Deputy Governor Obafemi Hamzat

## Key Features Summary

### Participant Experience:
1. ✅ Register as participant
2. ✅ Sequential AR scanning of hotspots (one at a time)
3. ✅ Read topic after each scan
4. ✅ Randomized quiz questions (dynamic per session)
5. ✅ Enter voter card before submission
6. ✅ Share results with election campaign messaging

### Organizer Experience:
1. ✅ Register as organizer
2. ✅ View all hotspots simultaneously
3. ✅ Access full content for setup
4. ✅ No voter card required
5. ✅ No AR scanning requirement

### Admin Dashboard Needs:
- Access to `leaderboard_entries` table
- View columns: `display_name`, `voters_card_number`, `score`, `completed_at`
- Filter by monument and date range

## Testing Checklist

- [ ] Create participant account
- [ ] Create organizer account  
- [ ] Test participant scanning flow
- [ ] Verify organizer sees all hotspots
- [ ] Complete quiz as participant with voter card
- [ ] Complete quiz as organizer without voter card
- [ ] Verify different participants get different questions
- [ ] Test scorecard generation with countdown
- [ ] Verify voter card appears in database
- [ ] Test both Sanwo-Olu and Tinubu monuments

## Notes

- Election date set to March 18, 2027 (based on typical Lagos election timing)
- Countdown updates every minute
- Voter card validation is basic (just required, not format-checked)
- All existing organizer functionality preserved
- Participant flow emphasizes "AR scanning" without actual AR implementation (can be enhanced with device camera later)
