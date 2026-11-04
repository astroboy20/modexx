-- ============================================================
-- Modexx — Complete Database Reset (Use with Caution!)
-- This will DELETE ALL DATA and recreate tables from scratch
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- WARNING: This will delete all existing data!
-- Make sure you have backups before running this script.

-- Drop existing objects
DROP VIEW IF EXISTS public.leaderboard_best CASCADE;
DROP TABLE IF EXISTS public.leaderboard_entries CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;

-- ============================================================
-- Recreate tables with updated schema
-- ============================================================

-- Players table
CREATE TABLE public.players (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name VARCHAR(20) NOT NULL,
  display_name_key VARCHAR(20) NOT NULL UNIQUE,  -- lowercase for uniqueness check
  user_role    VARCHAR(20) NOT NULL DEFAULT 'participant' CHECK (user_role IN ('participant', 'organizer')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Leaderboard entries table
CREATE TABLE public.leaderboard_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  monument_slug       VARCHAR(50) NOT NULL,
  display_name        VARCHAR(20) NOT NULL,
  voters_card_number  VARCHAR(50),
  score               INT NOT NULL CHECK (score >= 0 AND score <= 1000),
  correct_count       INT NOT NULL CHECK (correct_count >= 0 AND correct_count <= 10),
  completion_seconds  INT NOT NULL CHECK (completion_seconds >= 0),
  completed_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast leaderboard queries per monument
CREATE INDEX leaderboard_entries_monument_idx
  ON public.leaderboard_entries (monument_slug, score DESC, correct_count DESC, completion_seconds ASC);

-- Index for finding a player's best score
CREATE INDEX leaderboard_entries_player_idx
  ON public.leaderboard_entries (player_id, monument_slug);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read players and leaderboard (public competition)
CREATE POLICY "Public read players"
  ON public.players FOR SELECT USING (true);

CREATE POLICY "Public read leaderboard"
  ON public.leaderboard_entries FOR SELECT USING (true);

-- Only server-side (service role) can insert/update — no direct client writes
-- This means all writes go through our API routes which use the service role key

-- ============================================================
-- Helper view: best score per player per monument
-- ============================================================

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

-- ============================================================
-- Verification
-- ============================================================

-- Show table structures
SELECT 'Tables created successfully!' AS status;

SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('players', 'leaderboard_entries')
ORDER BY table_name, ordinal_position;


-- ============================================================
-- Exploration Progress Tracking (for two-device sync)
-- ============================================================

-- Add exploration progress tracking table
create table if not exists public.exploration_progress (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players(id) on delete cascade,
  monument_slug     varchar(50) not null,
  hotspot_id        varchar(50) not null,
  scanned_at        timestamptz not null default now(),
  unique(player_id, monument_slug, hotspot_id)
);

-- Index for fast progress queries
create index if not exists exploration_progress_player_idx
  on public.exploration_progress (player_id, monument_slug);

-- Enable RLS
alter table public.exploration_progress enable row level security;

-- Anyone can read progress (for public display)
create policy "Public read progress"
  on public.exploration_progress for select
  using (true);
