-- ============================================================
--  Doxan — persistance des réglages "moi" (pour l'API serverless)
--  À coller dans SQL Editor puis RUN
-- ============================================================
alter table public.profiles add column if not exists verified  boolean default false;
alter table public.profiles add column if not exists dm_policy  text    default 'everyone';
