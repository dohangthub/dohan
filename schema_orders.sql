-- ============================================================
--  SenLove — commandes de paiement (Unitech Pay) — SQL Editor puis RUN
-- ============================================================
create table if not exists public.orders (
  reference   text primary key,          -- référence renvoyée par Unitech
  user_id     text not null default 'me',
  kind        text not null,             -- 'pass' | 'credits'
  item        text not null,             -- day/weekend/week | small/medium/large
  amount      int  not null,
  method      text,                      -- wave | om
  status      text default 'pending',    -- pending | completed | failed
  created_at  timestamptz default now()
);
alter table public.orders enable row level security;
