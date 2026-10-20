-- ============================================================
-- Migration 002: Session Recap table
-- Run in Supabase SQL Editor after 001_dashboard_tables.sql
-- ============================================================

-- ------------------------------------------------------------
-- Table: session_recaps
-- Stores the AI-generated recap and quiz for each voice session.
-- One row per session_history.id (created after session ends).
-- ------------------------------------------------------------
create table if not exists public.session_recaps (
  id              uuid        primary key default gen_random_uuid(),
  session_id      uuid        references public.session_history(id) on delete cascade,
  user_id         text        not null,
  companion_id    text        not null,
  subject         text        not null,
  topic           text        not null,
  summary         text        not null,
  key_learnings   jsonb       not null default '[]',  -- array of strings
  quiz            jsonb       not null default '[]',  -- array of quiz question objects
  created_at      timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.session_recaps enable row level security;

-- Policy: users can only read their own recaps
create policy "Users read their own recaps"
  on public.session_recaps
  for select
  using (auth.jwt() ->> 'sub' = user_id);

-- Policy: server-side inserts are allowed (service role key bypasses RLS,
-- but with anon key + JWT we still scope inserts to the requesting user)
create policy "Users insert their own recaps"
  on public.session_recaps
  for insert
  with check (auth.jwt() ->> 'sub' = user_id);

-- Index for fast lookup by session or user
create index if not exists session_recaps_session_id_idx on public.session_recaps (session_id);
create index if not exists session_recaps_user_id_idx    on public.session_recaps (user_id);
create index if not exists session_recaps_created_at_idx on public.session_recaps (created_at desc);
