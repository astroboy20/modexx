-- ============================================================
-- Migration: Cumulative scoring system
-- Adds attempt_number column to leaderboard_entries
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add attempt_number column (safe to re-run)
alter table public.leaderboard_entries
  add column if not exists attempt_number int not null default 1
    check (attempt_number >= 1 and attempt_number <= 10);

-- 2. Backfill attempt numbers in chronological order per player+monument
with numbered as (
  select
    id,
    row_number() over (
      partition by player_id, monument_slug
      order by completed_at asc
    ) as rn
  from public.leaderboard_entries
)
update public.leaderboard_entries e
set attempt_number = n.rn
from numbered n
where e.id = n.id;

-- 3. Drop the old view first, then recreate with the new column
--    (CREATE OR REPLACE cannot reorder or rename existing columns)
drop view if exists public.leaderboard_best;

create view public.leaderboard_best as
  select distinct on (player_id, monument_slug)
    id,
    player_id,
    monument_slug,
    display_name,
    voters_card_number,
    score,
    correct_count,
    completion_seconds,
    attempt_number,
    completed_at
  from public.leaderboard_entries
  order by player_id, monument_slug, score desc, correct_count desc, completion_seconds asc;
