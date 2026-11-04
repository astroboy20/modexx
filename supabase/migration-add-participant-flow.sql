-- ============================================================
-- Modexx — Migration: Add Participant Flow Features
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Add user_role column to players table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players' 
    AND column_name = 'user_role'
  ) THEN
    ALTER TABLE public.players 
    ADD COLUMN user_role VARCHAR(20) NOT NULL DEFAULT 'participant' 
    CHECK (user_role IN ('participant', 'organizer'));
  END IF;
END $$;

-- Add voters_card_number column to leaderboard_entries (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'leaderboard_entries' 
    AND column_name = 'voters_card_number'
  ) THEN
    ALTER TABLE public.leaderboard_entries 
    ADD COLUMN voters_card_number VARCHAR(50);
  END IF;
END $$;

-- Update the leaderboard_best view to include voters_card_number
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

-- Migration complete
SELECT 'Migration completed successfully!' AS status;
