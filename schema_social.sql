-- ============================================================
--  Doxan — Interactions sociales (à coller dans SQL Editor puis RUN)
-- ============================================================

-- Réactions sur les posts (map emoji -> nombre)
alter table public.posts add column if not exists reactions jsonb default '{}'::jsonb;

-- Commentaires (réponses via parent_id) + likes + réactions
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts(id) on delete cascade,
  parent_id  bigint references public.comments(id) on delete cascade,  -- réponse à un commentaire
  author_id  text not null,
  body       text not null,
  likes      int  default 0,
  reactions  jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_comments_post on public.comments(post_id);
alter table public.comments enable row level security;
