# Database Migration Guide

## Error: "policy already exists"

If you see this error:
```
ERROR: 42710: policy "Public read players" for table "players" already exists
```

This means you're running the schema on an existing database that already has some tables and policies.

---

## Solution: Use Incremental Migration

Instead of running the full `schema.sql`, use the incremental migration script:

### Step 1: Run the Incremental Migration

**File:** `supabase/add-exploration-progress.sql`

1. Open your Supabase project
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/add-exploration-progress.sql`
5. Click **Run**

This script will:
- ✅ Create `exploration_progress` table (if it doesn't exist)
- ✅ Create indexes (if they don't exist)
- ✅ Enable RLS
- ✅ Create/update policies safely
- ✅ Show confirmation message

### Step 2: Verify Table Was Created

Run this query in SQL Editor:
```sql
select * from public.exploration_progress;
```

You should see an empty table with columns:
- `id`
- `player_id`
- `monument_slug`
- `hotspot_id`
- `scanned_at`

---

## Alternative: Clean Database Reset

⚠️ **WARNING: This deletes ALL data!**

If you want to start fresh:

### Step 1: Run Reset Script

**File:** `supabase/reset-database.sql`

1. Open Supabase SQL Editor
2. Copy contents of `supabase/reset-database.sql`
3. Click **Run**

This will:
- Drop all existing tables
- Recreate from scratch
- You'll lose all players, leaderboard entries, and progress

### Step 2: Verify

Run:
```sql
select 
  table_name 
from information_schema.tables 
where table_schema = 'public' 
  and table_type = 'BASE TABLE';
```

You should see:
- `players`
- `leaderboard_entries`
- `exploration_progress`

---

## Understanding the Migration Scripts

### Full Schema (`supabase/schema.sql`)
**Use for:** New database setup  
**Includes:** All tables, indexes, policies, views

**Updated to be idempotent:**
- Uses `create table if not exists`
- Uses `drop policy if exists` before creating
- Safe to run multiple times

### Incremental Migration (`supabase/add-exploration-progress.sql`)
**Use for:** Existing database with players + leaderboard  
**Includes:** Only exploration_progress table

**Safe because:**
- Only creates missing table
- Uses `if not exists` checks
- Won't affect existing data

### Reset Script (`supabase/reset-database.sql`)
**Use for:** Complete fresh start  
**Warning:** Deletes ALL data

**When to use:**
- Development environment reset
- Testing clean state
- Fixing corrupted data

---

## Recommended Approach

### For Existing Database (Has Data)
```sql
-- Run: supabase/add-exploration-progress.sql
-- This adds only the missing table
```

### For New Database (Empty)
```sql
-- Run: supabase/schema.sql
-- This creates all tables from scratch
```

### For Development Reset (Local Testing)
```sql
-- Run: supabase/reset-database.sql
-- WARNING: Deletes everything!
```

---

## Troubleshooting

### Error: "table already exists"

**Cause:** Table was created previously

**Solution:** This is actually fine! The error just means the table exists.

To verify:
```sql
\d exploration_progress  -- Shows table structure
select count(*) from exploration_progress;  -- Shows record count
```

### Error: "relation does not exist"

**Cause:** Table wasn't created

**Solution:** Run the incremental migration:
```sql
-- Copy from: supabase/add-exploration-progress.sql
```

### Error: "column does not exist"

**Cause:** Table structure mismatch

**Solution:** Drop and recreate table:
```sql
drop table if exists public.exploration_progress cascade;
-- Then run: supabase/add-exploration-progress.sql
```

---

## Verifying Migration Success

### Check Tables Exist
```sql
select 
  table_name,
  (select count(*) 
   from information_schema.columns 
   where columns.table_name = tables.table_name) as column_count
from information_schema.tables 
where table_schema = 'public' 
  and table_type = 'BASE TABLE';
```

Expected output:
```
table_name              | column_count
------------------------|-------------
players                 | 5
leaderboard_entries     | 9
exploration_progress    | 5
```

### Check Policies Exist
```sql
select 
  tablename,
  policyname
from pg_policies
where schemaname = 'public';
```

Expected output:
```
tablename              | policyname
-----------------------|-------------------
players                | Public read players
leaderboard_entries    | Public read leaderboard
exploration_progress   | Public read progress
```

### Check Indexes Exist
```sql
select 
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

Should include:
- `leaderboard_entries_monument_idx`
- `leaderboard_entries_player_idx`
- `exploration_progress_player_idx`

---

## Quick Reference

### Just Add Missing Table
```bash
# File: supabase/add-exploration-progress.sql
# Safe for existing database
```

### Complete Fresh Setup
```bash
# File: supabase/schema.sql
# Safe to run multiple times (now idempotent)
```

### Nuclear Option (Delete Everything)
```bash
# File: supabase/reset-database.sql
# WARNING: Deletes all data!
```

---

## Next Steps After Migration

1. **Verify table exists:**
   ```sql
   select * from exploration_progress limit 1;
   ```

2. **Test the API:**
   ```bash
   # In browser console after signing in:
   fetch('/api/progress?monumentSlug=tinubu')
   ```

3. **Test a scan:**
   - Go to explore page
   - Click pulsating hotspot
   - Check database:
   ```sql
   select * from exploration_progress 
   order by scanned_at desc 
   limit 5;
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

---

**Recommended:** Use `add-exploration-progress.sql` for existing databases to avoid the policy error!
