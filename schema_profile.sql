-- ============================================================
--  Doxan — photo de profil + téléphone (à coller dans SQL Editor puis RUN)
-- ============================================================
alter table public.profiles add column if not exists photo text;
alter table public.profiles add column if not exists phone text;
