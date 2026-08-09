-- ============================================================
--  SenLove — modération (blocage + signalement) — SQL Editor puis RUN
-- ============================================================
alter table public.profiles add column if not exists blocked jsonb default '[]'::jsonb;

create table if not exists public.reports (
  id         bigint generated always as identity primary key,
  reporter   text not null default 'me',
  target     text not null,
  reason     text,
  created_at timestamptz default now()
);
alter table public.reports enable row level security;
