-- ============================================================
-- Save backups (Nov 1): run this once in the Supabase SQL editor.
-- profile_backups: copies of a player's whole save. The game writes one every day you play, and one of each side
-- whenever two browsers disagree about your progress (so the version you don't pick is never lost).
-- Players can only see, add and delete their own backups. The game keeps the newest 30 per player.
-- ============================================================
create table if not exists public.profile_backups (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  reason      text,
  device      text,
  created_at  timestamptz not null default now()
);
create index if not exists profile_backups_user_time on public.profile_backups (user_id, created_at desc);
alter table public.profile_backups enable row level security;
drop policy if exists "profile_backups: read own" on public.profile_backups;
create policy "profile_backups: read own" on public.profile_backups for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "profile_backups: insert own" on public.profile_backups;
create policy "profile_backups: insert own" on public.profile_backups for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "profile_backups: delete own" on public.profile_backups;
create policy "profile_backups: delete own" on public.profile_backups for delete to authenticated using ((select auth.uid()) = user_id);
