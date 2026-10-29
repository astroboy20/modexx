-- ============================================================
-- Modexx — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Players table
create table if not exists public.players (
  id           uuid primary key default gen_random_uuid(),
  display_name varchar(20) not null,
  display_name_key varchar(20) not null unique,  -- lowercase for uniqueness check
  created_at   timestamptz not null default now()
);

-- Leaderboard entries table
create table if not exists public.leaderboard_entries (
  id                  uuid primary key default gen_random_uuid(),
  player_id           uuid not null references public.players(id) on delete cascade,
  monument_slug       varchar(50) not null,
  display_name        varchar(20) not null,
  score               int not null check (score >= 0 and score <= 1000),
  correct_count       int not null check (correct_count >= 0 and correct_count <= 10),
  completion_seconds  int not null check (completion_seconds >= 0),
  completed_at        timestamptz not null default now()
);

-- Index for fast leaderboard queries per monument
create index if not exists leaderboard_entries_monument_idx
  on public.leaderboard_entries (monument_slug, score desc, correct_count desc, completion_seconds asc);

-- Index for finding a player's best score
create index if not exists leaderboard_entries_player_idx
  on public.leaderboard_entries (player_id, monument_slug);

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table public.players enable row level security;
alter table public.leaderboard_entries enable row level security;

-- Anyone can read players and leaderboard (public competition)
create policy "Public read players"
  on public.players for select using (true);

create policy "Public read leaderboard"
  on public.leaderboard_entries for select using (true);

-- Only server-side (service role) can insert/update — no direct client writes
-- This means all writes go through our API routes which use the service role key

-- ── Helper view: best score per player per monument ─────────────────────────
create or replace view public.leaderboard_best as
  select distinct on (player_id, monument_slug)
    id,
    player_id,
    monument_slug,
    display_name,
    score,
    correct_count,
    completion_seconds,
    completed_at
  from public.leaderboard_entries
  order by player_id, monument_slug, score desc, correct_count desc, completion_seconds asc;
