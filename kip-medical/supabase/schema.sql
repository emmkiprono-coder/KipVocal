-- ============================================================
-- KIP VOCAL INTELLIGENCE — SUPABASE SCHEMA
-- Run this entire script in your Supabase SQL Editor
-- Project: https://supabase.com/dashboard
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────────────────────────
-- One profile per authenticated user. Linked to Supabase Auth (auth.users).
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null,
  role          text,
  mode          text check (mode in ('clinician','patient','life')) default 'clinician',
  focus         text,
  attach_style  text check (attach_style in ('secure','anxious','avoidant','disorganized')),
  app           text check (app in ('medical','life')) default 'medical',
  partner_name  text,
  partner_style text check (partner_style in ('secure','anxious','avoidant','disorganized')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── SESSIONS ──────────────────────────────────────────────────────────────────
-- Every recording session from either app.
create table if not exists sessions (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  app           text check (app in ('medical','life')) not null,
  type          text not null,                    -- 'Free recording' | 'Scenario'
  scenario      text,                             -- scenario title if applicable
  scenario_id   text,                             -- scenario id slug
  mode          text,                             -- clinician | patient | null
  conf          integer,                          -- confidence score 0-100
  fluency       integer,
  load          integer,                          -- cognitive load
  stress        integer,
  pace          integer,                          -- words per minute
  filler_count  integer default 0,
  word_count    integer default 0,
  ttr           integer,                          -- type-token ratio (vocab diversity)
  overall_score integer,                          -- weighted scenario rubric score
  transcript    text,
  rubric_scores jsonb,                            -- {clarity: 82, pace: 74, ...}
  created_at    timestamptz default now()
);

-- ── COACHING REPORTS ──────────────────────────────────────────────────────────
-- AI-generated coaching reports linked to sessions.
create table if not exists coaching_reports (
  id            uuid primary key default uuid_generate_v4(),
  session_id    uuid not null references sessions(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  report_text   text not null,
  created_at    timestamptz default now()
);

-- ── INDEXES ───────────────────────────────────────────────────────────────────
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_created_at_idx on sessions(created_at desc);
create index if not exists sessions_app_idx on sessions(app);
create index if not exists coaching_reports_session_id_idx on coaching_reports(session_id);
create index if not exists coaching_reports_user_id_idx on coaching_reports(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
-- Users can only see and modify their own data.

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table coaching_reports enable row level security;

-- Profiles: users manage only their own
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Sessions: users manage only their own
create policy "sessions_select_own" on sessions for select using (auth.uid() = user_id);
create policy "sessions_insert_own" on sessions for insert with check (auth.uid() = user_id);
create policy "sessions_delete_own" on sessions for delete using (auth.uid() = user_id);

-- Coaching reports: users manage only their own
create policy "coaching_select_own" on coaching_reports for select using (auth.uid() = user_id);
create policy "coaching_insert_own" on coaching_reports for insert with check (auth.uid() = user_id);
create policy "coaching_delete_own" on coaching_reports for delete using (auth.uid() = user_id);

-- ── ADMIN VIEW (optional) ─────────────────────────────────────────────────────
-- Useful for a future admin dashboard showing aggregate interpreter progress.
-- Requires a separate admin role — do not expose to regular users.
create or replace view admin_session_summary as
select
  p.name,
  p.role,
  p.mode,
  p.app,
  p.attach_style,
  s.type,
  s.scenario,
  s.conf,
  s.fluency,
  s.stress,
  s.load,
  s.pace,
  s.overall_score,
  s.filler_count,
  s.created_at
from sessions s
join profiles p on p.id = s.user_id
order by s.created_at desc;

-- ── TRIGGERS ──────────────────────────────────────────────────────────────────
-- Auto-update updated_at on profiles
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- DONE. Your schema is ready.
-- Next: set these env vars in Vercel dashboard:
--   VITE_SUPABASE_URL     = https://your-project.supabase.co
--   VITE_SUPABASE_ANON_KEY = your-anon-key
--   ANTHROPIC_API_KEY      = your-anthropic-key
-- ============================================================
