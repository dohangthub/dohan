-- ============================================================
--  SenLove — monétisation (crédits + passes) — SQL Editor puis RUN
-- ============================================================
alter table public.profiles add column if not exists credits       int default 0;
alter table public.profiles add column if not exists premium_until  timestamptz;  -- passes (premium temporaire)
alter table public.profiles add column if not exists boost_until    timestamptz;  -- boost de visibilité
