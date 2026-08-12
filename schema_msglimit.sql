-- Limite de messages/jour en gratuit : compteur + date du jour.
alter table public.profiles add column if not exists msgs_used integer default 0;
alter table public.profiles add column if not exists msgs_date text;
