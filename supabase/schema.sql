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
