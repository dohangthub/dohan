-- Back-office admin : bannissement d'un utilisateur.
alter table public.profiles add column if not exists banned boolean default false;
