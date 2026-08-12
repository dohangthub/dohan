-- Messages enrichis : type (text/image/audio) + URL du média.
alter table public.messages add column if not exists kind text default 'text';
alter table public.messages add column if not exists media_url text;
