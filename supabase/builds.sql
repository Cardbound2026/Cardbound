-- ============================================================
-- Deck Planner (Nov 13): run this once in the Supabase SQL editor.
-- builds:      one row per posted build (name, class, codex, the card list and talent picks, a description). Everyone signed in
--              can read; only the author can post, change or delete their own.
-- build_votes: one row per player per build (+1 or -1). The up/down/score columns on builds are kept by a trigger, and a
--              second trigger stops an author from writing those columns themselves.
-- ============================================================
create table if not exists public.builds (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author      text not null check (char_length(author) between 1 and 40),
  name        text not null check (char_length(name) between 1 and 60),
  cls         text not null check (cls in ('Warrior', 'Rogue', 'Mage', 'Paladin', 'Warlock')),
  codex       text,
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) < 20000),
  descr       text not null default '' check (char_length(descr) <= 4000),
  up          integer not null default 0,
  down        integer not null default 0,
  score       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists builds_score_idx on public.builds (score desc, created_at desc);
create index if not exists builds_cls_idx on public.builds (cls);
alter table public.builds enable row level security;
drop policy if exists "builds: signed-in can read" on public.builds;
create policy "builds: signed-in can read" on public.builds for select to authenticated using (true);
drop policy if exists "builds: insert own" on public.builds;
create policy "builds: insert own" on public.builds for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "builds: update own" on public.builds;
create policy "builds: update own" on public.builds for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "builds: delete own" on public.builds;
create policy "builds: delete own" on public.builds for delete to authenticated using ((select auth.uid()) = user_id);

create table if not exists public.build_votes (
  build_id  uuid not null references public.builds (id) on delete cascade,
  user_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vote      smallint not null check (vote in (-1, 1)),
  primary key (build_id, user_id)
);
alter table public.build_votes enable row level security;
drop policy if exists "build_votes: read own" on public.build_votes;
create policy "build_votes: read own" on public.build_votes for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "build_votes: insert own" on public.build_votes;
create policy "build_votes: insert own" on public.build_votes for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "build_votes: update own" on public.build_votes;
create policy "build_votes: update own" on public.build_votes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "build_votes: delete own" on public.build_votes;
create policy "build_votes: delete own" on public.build_votes for delete to authenticated using ((select auth.uid()) = user_id);

-- vote counts: recounted for the build whenever one of its votes changes
create or replace function public.builds_recount() returns trigger language plpgsql security definer set search_path = public as $$
declare b uuid := coalesce(new.build_id, old.build_id);
begin
  update public.builds set
    up = (select count(*) from public.build_votes where build_id = b and vote = 1),
    down = (select count(*) from public.build_votes where build_id = b and vote = -1),
    score = (select coalesce(sum(vote), 0) from public.build_votes where build_id = b)
  where id = b;
  return null;
end $$;
drop trigger if exists build_votes_recount on public.build_votes;
create trigger build_votes_recount after insert or update or delete on public.build_votes for each row execute function public.builds_recount();

-- an author cannot set their own counts: outside the recount trigger the three columns keep their old values
create or replace function public.builds_guard() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then new.up := 0; new.down := 0; new.score := 0;
  elsif pg_trigger_depth() < 2 then new.up := old.up; new.down := old.down; new.score := old.score; new.user_id := old.user_id; new.created_at := old.created_at; new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists builds_guard on public.builds;
create trigger builds_guard before insert or update on public.builds for each row execute function public.builds_guard();
