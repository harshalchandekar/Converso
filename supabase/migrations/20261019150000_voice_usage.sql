-- Migration: Add voice_usage table for tracking call durations per user
-- Rolling 24-hour quota guardrails enforce free and pro limits

create table if not exists public.voice_usage (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id text null,
  seconds integer not null check (seconds >= 0),
  created_at timestamptz not null default now()
);

-- Index for fast user-specific rolling 24-hour aggregations
create index if not exists idx_voice_usage_user_created_at
  on public.voice_usage (user_id, created_at desc);

-- Enable Row Level Security
alter table public.voice_usage enable row level security;

-- Policy for select: user can read their own usage rows
create policy "Users can view their own voice usage"
  on public.voice_usage
  for select
  using (
    (select auth.jwt() ->> 'sub') = user_id
    or auth.uid()::text = user_id
  );

-- Policy for insert: user can insert their own usage rows
create policy "Users can insert their own voice usage"
  on public.voice_usage
  for insert
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    or auth.uid()::text = user_id
  );
