-- Cardbound database setup. Paste this whole file into Supabase: SQL Editor > New query > Run.
-- Safe to run more than once.

-- One saved profile per player: characters, stash, gold, decks (the same data the game keeps in the browser).
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Each player can read and write only their own profile.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ============================================================
-- Social: public player cards (name, hero, friend code) and friend lists.
-- ============================================================

-- One public card per player so friends can find each other and see names.
create table if not exists public.players (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Adventurer',
  hero_name    text,
  hero_class   text,
  friend_code  text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  updated_at   timestamptz not null default now()
);
alter table public.players enable row level security;

drop policy if exists "players: signed-in can read" on public.players;
create policy "players: signed-in can read" on public.players
  for select to authenticated using (true);
drop policy if exists "players: insert own" on public.players;
create policy "players: insert own" on public.players
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "players: update own" on public.players;
create policy "players: update own" on public.players
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Friend links. The sender creates a pending row; the receiver accepts it; either side can remove it.
create table if not exists public.friends (
  user_id    uuid not null references auth.users (id) on delete cascade,  -- who sent the request
  friend_id  uuid not null references auth.users (id) on delete cascade,  -- who received it
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friends enable row level security;

drop policy if exists "friends: see own" on public.friends;
create policy "friends: see own" on public.friends
  for select to authenticated using ((select auth.uid()) in (user_id, friend_id));
drop policy if exists "friends: send request" on public.friends;
create policy "friends: send request" on public.friends
  for insert to authenticated with check ((select auth.uid()) = user_id and status = 'pending');
drop policy if exists "friends: accept request" on public.friends;
create policy "friends: accept request" on public.friends
  for update to authenticated using ((select auth.uid()) = friend_id) with check ((select auth.uid()) = friend_id and status = 'accepted');
drop policy if exists "friends: remove" on public.friends;
create policy "friends: remove" on public.friends
  for delete to authenticated using ((select auth.uid()) in (user_id, friend_id));
