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

-- ============================================================
-- Guilds (Oct 31). One guild per player. The leader creates it; leaders and officers invite;
-- an invited player joins by adding their own member row; leaders/officers can remove members.
-- ============================================================
alter table public.players add column if not exists power integer not null default 0;

create table if not exists public.guilds (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 3 and 24),
  leader     uuid not null references auth.users (id) on delete cascade,
  motd       text not null default '',
  created_at timestamptz not null default now()
);
alter table public.guilds enable row level security;
drop policy if exists "guilds: signed-in can read" on public.guilds;
create policy "guilds: signed-in can read" on public.guilds for select to authenticated using (true);
drop policy if exists "guilds: create as leader" on public.guilds;
create policy "guilds: create as leader" on public.guilds for insert to authenticated with check ((select auth.uid()) = leader);
drop policy if exists "guilds: leader edits" on public.guilds;
create policy "guilds: leader edits" on public.guilds for update to authenticated using ((select auth.uid()) = leader) with check (true);
drop policy if exists "guilds: leader disbands" on public.guilds;
create policy "guilds: leader disbands" on public.guilds for delete to authenticated using ((select auth.uid()) = leader);

create table if not exists public.guild_members (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  guild_id  uuid not null references public.guilds (id) on delete cascade,
  rank      text not null default 'member' check (rank in ('leader', 'officer', 'member')),
  joined_at timestamptz not null default now()
);
alter table public.guild_members enable row level security;

create table if not exists public.guild_invites (
  guild_id   uuid not null references public.guilds (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);
alter table public.guild_invites enable row level security;

-- helper: is the signed-in player a leader/officer of this guild?
create or replace function public.is_guild_officer(g uuid) returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.guild_members m where m.guild_id = g and m.user_id = auth.uid() and m.rank in ('leader', 'officer'));
$$;

drop policy if exists "guild_members: signed-in can read" on public.guild_members;
create policy "guild_members: signed-in can read" on public.guild_members for select to authenticated using (true);
drop policy if exists "guild_members: join" on public.guild_members;
create policy "guild_members: join" on public.guild_members for insert to authenticated with check (
  (select auth.uid()) = user_id and (
    (rank = 'leader' and exists (select 1 from public.guilds g where g.id = guild_id and g.leader = (select auth.uid())))
    or (rank = 'member' and exists (select 1 from public.guild_invites i where i.guild_id = guild_members.guild_id and i.user_id = (select auth.uid())))
  ));
drop policy if exists "guild_members: officers set rank" on public.guild_members;
create policy "guild_members: officers set rank" on public.guild_members for update to authenticated using (public.is_guild_officer(guild_id)) with check (public.is_guild_officer(guild_id));
drop policy if exists "guild_members: leave or remove" on public.guild_members;
create policy "guild_members: leave or remove" on public.guild_members for delete to authenticated using ((select auth.uid()) = user_id or public.is_guild_officer(guild_id));

drop policy if exists "guild_invites: see own or guild's" on public.guild_invites;
create policy "guild_invites: see own or guild's" on public.guild_invites for select to authenticated using ((select auth.uid()) = user_id or public.is_guild_officer(guild_id));
drop policy if exists "guild_invites: officers invite" on public.guild_invites;
create policy "guild_invites: officers invite" on public.guild_invites for insert to authenticated with check ((select auth.uid()) = invited_by and public.is_guild_officer(guild_id));
drop policy if exists "guild_invites: answer or cancel" on public.guild_invites;
create policy "guild_invites: answer or cancel" on public.guild_invites for delete to authenticated using ((select auth.uid()) = user_id or public.is_guild_officer(guild_id));

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
