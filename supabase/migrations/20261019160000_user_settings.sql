-- Migration: Add user_settings table for tracking weekly goal minutes and client timezone
-- Used by the Learning Dashboard (/dashboard)

create table if not exists public.user_settings (
  user_id text primary key,
  weekly_goal_minutes integer not null default 60 check (weekly_goal_minutes >= 10 and weekly_goal_minutes <= 600),
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_settings enable row level security;

-- Policy for select: users can read only their own settings
create policy "Users can view their own settings"
  on public.user_settings
  for select
  using (
    (select auth.jwt() ->> 'sub') = user_id
    or auth.uid()::text = user_id
  );

-- Policy for insert: users can create only their own settings
create policy "Users can insert their own settings"
  on public.user_settings
  for insert
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    or auth.uid()::text = user_id
  );

-- Policy for update: users can modify only their own settings
create policy "Users can update their own settings"
  on public.user_settings
  for update
  using (
    (select auth.jwt() ->> 'sub') = user_id
    or auth.uid()::text = user_id
  )
  with check (
    (select auth.jwt() ->> 'sub') = user_id
    or auth.uid()::text = user_id
  );
