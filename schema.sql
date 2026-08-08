-- ============================================================
--  Doxan — Schéma Supabase (à coller dans SQL Editor puis RUN)
-- ============================================================

-- Profils (moi + candidats)
create table if not exists public.profiles (
  id          text primary key,
  seq         int  default 0,
  name        text not null,
  age         int  not null,
  city        text,
  gender      text,
  bio         text,
  interests   jsonb default '[]'::jsonb,
  grad        jsonb,
  emoji       text,
  online      boolean default false,
  likes_me    boolean default false,   -- démo : ce profil "m'aime" déjà
  is_me       boolean default false,
  premium     boolean default false,   -- utile seulement pour "moi"
  likes_used  int     default 0,       -- compteur likes du jour (moi)
  created_at  timestamptz default now()
);

-- Swipes (like / pass / crush)
create table if not exists public.swipes (
  id         bigint generated always as identity primary key,
  actor_id   text not null,
  target_id  text not null,
  action     text not null check (action in ('like','pass','crush')),
  created_at timestamptz default now(),
  unique (actor_id, target_id)
);

-- Matchs
create table if not exists public.matches (
  id         bigint generated always as identity primary key,
  user_a     text not null,   -- "moi"
  user_b     text not null,   -- le candidat
  created_at timestamptz default now(),
  unique (user_a, user_b)
);

-- Messages
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  match_id   bigint not null references public.matches(id) on delete cascade,
  sender     text not null,   -- 'me' ou l'id du candidat
  body       text not null,
  created_at timestamptz default now()
);

create index if not exists idx_messages_match on public.messages(match_id);
create index if not exists idx_swipes_actor on public.swipes(actor_id);

-- RLS : activé, aucune policy publique.
-- La clé SECRÈTE (service) utilisée côté serveur bypass la RLS, donc l'app marche.
-- Le navigateur (clé publishable) n'a AUCUN accès direct : sûr par défaut.
alter table public.profiles enable row level security;
alter table public.swipes   enable row level security;
alter table public.matches  enable row level security;
alter table public.messages enable row level security;
