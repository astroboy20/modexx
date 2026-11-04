-- ============================================================
-- Add Exploration Progress Table (Incremental Migration)
-- Safe to run on existing database
-- ============================================================

-- Create exploration progress table if it doesn't exist
create table if not exists public.exploration_progress (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null references public.players(id) on delete cascade,
  monument_slug     varchar(50) not null,
  hotspot_id        varchar(50) not null,
  scanned_at        timestamptz not null default now(),
  unique(player_id, monument_slug, hotspot_id)
);

-- Create index if it doesn't exist
create index if not exists exploration_progress_player_idx
  on public.exploration_progress (player_id, monument_slug);

-- Enable RLS
alter table public.exploration_progress enable row level security;

-- Drop and recreate policy (safe to run multiple times)
drop policy if exists "Public read progress" on public.exploration_progress;

create policy "Public read progress"
  on public.exploration_progress for select
  using (true);

-- Verify table was created
select 
  'exploration_progress table created successfully!' as status,
  count(*) as existing_records
from public.exploration_progress;
