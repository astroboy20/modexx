# Quick Fix: Policy Already Exists Error

## The Error
```
ERROR: 42710: policy "Public read players" for table "players" already exists
```

## The Solution (Choose One)

### Option 1: Use Incremental Migration Script ⭐ RECOMMENDED

**Run this file in Supabase SQL Editor:**
```
supabase/add-exploration-progress.sql
```

This safely adds only the missing `exploration_progress` table without touching existing tables.

---

### Option 2: Use Updated Schema File

The `schema.sql` file has been updated to be idempotent (safe to run multiple times).

**Run this file in Supabase SQL Editor:**
```
supabase/schema.sql
```

It now includes:
```sql
drop policy if exists "Public read players" on public.players;
drop policy if exists "Public read leaderboard" on public.leaderboard_entries;
drop policy if exists "Public read progress" on public.exploration_progress;

-- Then recreates them
```

---

### Option 3: Manual Fix (If You Prefer)

Run these commands in Supabase SQL Editor:

```sql
-- 1. Create the exploration_progress table
create table if not exists public.exploration_progress (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players(id) on delete cascade,
  monument_slug     varchar(50) not null,
  hotspot_id        varchar(50) not null,
  scanned_at        timestamptz not null default now(),
  unique(player_id, monument_slug, hotspot_id)
);

-- 2. Create index
create index if not exists exploration_progress_player_idx
  on public.exploration_progress (player_id, monument_slug);

-- 3. Enable RLS
alter table public.exploration_progress enable row level security;

-- 4. Create policy
drop policy if exists "Public read progress" on public.exploration_progress;
create policy "Public read progress"
  on public.exploration_progress for select using (true);

-- 5. Verify
select 'Success!' as status, count(*) as records 
from public.exploration_progress;
```

---

## Why This Happened

You were trying to create policies that already exist in your database. This happens when:
- Running schema.sql on an existing database
- Re-running migrations without dropping first
- Database already has the players and leaderboard tables

---

## What Changed

### Before (Error-Prone)
```sql
create policy "Public read players" 
  on public.players for select using (true);
-- ❌ Fails if policy already exists
```

### After (Idempotent)
```sql
drop policy if exists "Public read players" on public.players;
create policy "Public read players" 
  on public.players for select using (true);
-- ✅ Works every time
```

---

## Files Updated

1. ✅ `supabase/schema.sql` - Now idempotent (safe to re-run)
2. ✅ `supabase/add-exploration-progress.sql` - NEW incremental migration
3. ✅ `DATABASE_MIGRATION_GUIDE.md` - Complete migration guide

---

## Verify It Worked

After running any of the above options:

```sql
-- Check table exists
\d exploration_progress

-- Check it's empty (or has data)
select count(*) from exploration_progress;

-- Check policy exists
select policyname 
from pg_policies 
where tablename = 'exploration_progress';
```

Expected output:
```
policyname
-------------------
Public read progress
```

---

## Start Testing

Once migration is complete:

```bash
npm run dev
```

Then follow `TESTING_GUIDE.md` to test the two-device experience!

---

**Recommended:** Use Option 1 (incremental migration script) - it's the safest! ⭐
