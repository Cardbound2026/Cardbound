-- ============================================================
-- Hall of Records (Nov 1): run this once in the Supabase SQL editor (it is also at the end of schema.sql).
-- hero_records: one public row per hero (progress, map records, and a snapshot of gear, deck and talents) that
--   everyone signed in can read; only the owner can write their own heroes.
-- raid_kills: one row per raid boss kill, written by the raid leader; everyone signed in can read.
-- ============================================================
create table if not exists public.hero_records (
  user_id     uuid not null references auth.users (id) on delete cascade,
  hero_key    text not null,
  hero_name   text not null,
  hero_class  text not null,
  guild_name  text,
  progress    integer not null default 0,
  power       integer not null default 0,
  maps        jsonb not null default '{}'::jsonb,
  snapshot    jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  primary key (user_id, hero_key)
);
alter table public.hero_records enable row level security;
drop policy if exists "hero_records: signed-in can read" on public.hero_records;
create policy "hero_records: signed-in can read" on public.hero_records for select to authenticated using (true);
drop policy if exists "hero_records: insert own" on public.hero_records;
create policy "hero_records: insert own" on public.hero_records for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "hero_records: update own" on public.hero_records;
create policy "hero_records: update own" on public.hero_records for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "hero_records: delete own" on public.hero_records;
create policy "hero_records: delete own" on public.hero_records for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.raid_kills (
  id          bigint generated always as identity primary key,
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  map         text not null,
  level       integer not null default 0,
  rounds      integer not null,
  guild_id    uuid,
  guild_name  text,
  heroes      jsonb not null default '[]'::jsonb,
  killed_at   timestamptz not null default now()
);
alter table public.raid_kills enable row level security;
drop policy if exists "raid_kills: signed-in can read" on public.raid_kills;
create policy "raid_kills: signed-in can read" on public.raid_kills for select to authenticated using (true);
drop policy if exists "raid_kills: leader records" on public.raid_kills;
create policy "raid_kills: leader records" on public.raid_kills for insert to authenticated with check ((select auth.uid()) = created_by);
