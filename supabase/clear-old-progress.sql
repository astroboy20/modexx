-- Run this in Supabase SQL Editor to clear the old bulk-unlock data.
-- This removes the stale '__all__' records that were inserted by the old gate scan flow.
-- It also clears all chapter progress so participants start fresh with the new sequential flow.

-- Step 1: Remove old __all__ gate records (no longer used)
DELETE FROM public.exploration_progress
WHERE hotspot_id = '__all__';

-- Step 2 (optional): Clear ALL exploration progress so everyone starts fresh.
-- Comment this out if you want to keep existing per-chapter progress.
DELETE FROM public.exploration_progress
WHERE hotspot_id NOT IN ('__access__');

-- After running this:
-- - Participants who already scanned the gate QR (__access__) will still have access.
-- - All chapter progress is reset — they'll go through chapters 1-by-1.
-- - Participants who haven't scanned the gate QR yet will see the gate screen.
