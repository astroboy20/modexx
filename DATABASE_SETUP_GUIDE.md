# Database Setup Guide

## Problem
You're getting a policy conflict error because the database already has some structure from the original schema.

## Solutions

You have **two options** depending on whether you want to keep existing data:

---

## Option 1: Keep Existing Data (Migration)

**Use this if you have test data you want to keep.**

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migration-add-participant-flow.sql`
5. Click **Run**

This will:
- ✅ Add `user_role` column to existing players (defaults to 'participant')
- ✅ Add `voters_card_number` column to leaderboard entries
- ✅ Update the leaderboard_best view
- ✅ Keep all existing data intact

### After Migration:
Existing players will have `user_role = 'participant'` by default. If you need to change any to organizer:

```sql
UPDATE public.players 
SET user_role = 'organizer' 
WHERE display_name = 'YourOrganizerName';
```

---

## Option 2: Complete Reset (Fresh Start)

**Use this if you want to start completely fresh with no data.**

⚠️ **WARNING: This will delete ALL existing data!**

### Steps:
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/reset-database.sql`
5. Click **Run**

This will:
- ❌ Delete all existing players
- ❌ Delete all existing leaderboard entries
- ✅ Create fresh tables with updated schema
- ✅ Set up all policies and indexes
- ✅ Create the leaderboard_best view

---

## Option 3: Manual Column Addition (Quick Fix)

If the migration script doesn't work, you can add columns manually:

### Step 1: Add user_role to players
```sql
ALTER TABLE public.players 
ADD COLUMN user_role VARCHAR(20) NOT NULL DEFAULT 'participant';

ALTER TABLE public.players 
ADD CONSTRAINT user_role_check CHECK (user_role IN ('participant', 'organizer'));
```

### Step 2: Add voters_card_number to leaderboard_entries
```sql
ALTER TABLE public.leaderboard_entries 
ADD COLUMN voters_card_number VARCHAR(50);
```

### Step 3: Update the view
```sql
DROP VIEW IF EXISTS public.leaderboard_best;

CREATE VIEW public.leaderboard_best AS
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

---

## Recommended Approach

### For Development/Testing:
**Use Option 2 (Complete Reset)** - Start fresh with the correct schema from the beginning.

### For Production (if you have real user data):
**Use Option 1 (Migration)** - Preserves existing data while adding new columns.

---

## Verification

After running either option, verify the setup:

```sql
-- Check players table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'players' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check leaderboard_entries table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leaderboard_entries' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify view exists
SELECT * FROM public.leaderboard_best LIMIT 1;
```

Expected columns in `players`:
- id
- display_name
- display_name_key
- **user_role** ← NEW
- created_at

Expected columns in `leaderboard_entries`:
- id
- player_id
- monument_slug
- display_name
- **voters_card_number** ← NEW
- score
- correct_count
- completion_seconds
- completed_at

---

## Troubleshooting

### Error: "column already exists"
This means the migration has already been partially applied. Either:
1. Use Option 2 (reset everything), or
2. Skip the specific column that exists and only add the missing ones

### Error: "permission denied"
Make sure you're using the service_role key or have the correct permissions in Supabase.

### Error: "view depends on"
Drop the view first before modifying tables:
```sql
DROP VIEW IF EXISTS public.leaderboard_best;
-- Then make your changes
-- Then recreate the view
```

---

## After Database Setup

Once your database is set up correctly:

1. ✅ Clear your browser cookies (to remove old session data)
2. ✅ Restart your development server
3. ✅ Create a new test account to verify the role selection works
4. ✅ Test both participant and organizer flows

---

## Need Help?

If you encounter issues:
1. Check the Supabase logs in Dashboard → Logs
2. Verify your environment variables in `.env`
3. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
4. Try the verification queries above to see what's missing
