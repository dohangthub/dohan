-- ============================================================
--  Doxan — Feed social (à coller dans SQL Editor puis RUN)
-- ============================================================
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  author_id  text not null,
  kind       text not null default 'photo',   -- 'photo' | 'text'
  body       text,
  photo      text,                              -- URL image (null si texte)
  likes      int  default 0,
  created_at timestamptz default now()
);
create index if not exists idx_posts_created on public.posts(created_at desc);
alter table public.posts enable row level security;
