-- ============================================================
-- Migration 001: Dashboard support tables
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- ------------------------------------------------------------
-- Table: user_settings
-- Stores per-user preferences: weekly study goal and timezone.
-- One row per Clerk userId (upserted on first dashboard load).
-- ------------------------------------------------------------
create table if not exists public.user_settings (
  user_id              text        primary key,
  weekly_goal_minutes  integer     not null default 60,
  timezone             text        not null default 'UTC',
  updated_at           timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_settings enable row level security;

-- Policy: each user can only read/write their own settings
create policy "Users manage their own settings"
  on public.user_settings
  for all
  using  (auth.jwt() ->> 'sub' = user_id)
  with check (auth.jwt() ->> 'sub' = user_id);

-- ------------------------------------------------------------
-- Table: voice_usage
-- Logs actual spoken seconds from each Vapi session.
-- The dashboard aggregates this for accurate "minutes studied".
-- Falls back to companion.duration if this table has no rows yet.
-- ------------------------------------------------------------
create table if not exists public.voice_usage (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null,
  session_id  uuid        references public.session_history(id) on delete set null,
  seconds     integer     not null check (seconds >= 0),
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.voice_usage enable row level security;

-- Policy: each user can insert and read their own usage rows
create policy "Users manage their own voice usage"
  on public.voice_usage
  for all
  using  (auth.jwt() ->> 'sub' = user_id)
  with check (auth.jwt() ->> 'sub' = user_id);

-- Optional performance indexes
create index if not exists voice_usage_user_id_idx    on public.voice_usage (user_id);
create index if not exists voice_usage_created_at_idx on public.voice_usage (created_at desc);
create index if not exists user_settings_user_id_idx  on public.user_settings (user_id);
