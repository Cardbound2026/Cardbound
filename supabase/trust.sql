-- ============================================================
-- Trust (Nov 2): the server keeps the books. Run once in the Supabase SQL editor, after schema.sql (it is safe to run again).
--
-- What it does:
--  1. Every save that reaches the server is checked (profiles trigger). It never blocks a save; it flags the account when
--     something can't have come from play: items with stats past what their level can roll, card ranks past +10,
--     gold or new items appearing faster than play, salvage and logged trades allow, map clears faster than runs allow,
--     test goods on a non-admin account, or an item that was traded away showing up again (a dupe).
--  2. The Hall of Records is written only by the server (submit_hero_record): progress, map records and gear come from the
--     account's saved hero, not from what the page sends. Flagged accounts and admins stay off the public boards.
--  3. Trades, Bazaar sales and Arena wagers go through the server (trade_submit, market_sale, wager_concede/wager_claim):
--     it checks you own what you hand over in your saved stash, and writes a ledger that the save checks use.
--  4. Admins: add your own user id to public.admins to get Tinker Pip's test goods (test items flag anyone else).
--
-- Reviewing flags: select * from public.trust_flags order by at desc;   Clearing one: update public.profiles set flagged = false where user_id = '...';
-- ============================================================

-- ---------- config, admins, flags
create table if not exists public.game_config (key text primary key, value jsonb not null);
insert into public.game_config (key, value) values ('season', '"0.02"') on conflict (key) do nothing;
alter table public.game_config enable row level security;
drop policy if exists "game_config: read" on public.game_config;
create policy "game_config: read" on public.game_config for select to authenticated, anon using (true);

create table if not exists public.admins (user_id uuid primary key references auth.users (id) on delete cascade);
alter table public.admins enable row level security;
drop policy if exists "admins: see self" on public.admins;
create policy "admins: see self" on public.admins for select to authenticated using ((select auth.uid()) = user_id);
create or replace function public.is_admin(u uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.admins where user_id = u) $$;

create table if not exists public.trust_flags (id bigint generated always as identity primary key, user_id uuid not null, at timestamptz not null default now(), reason text not null, detail jsonb);
alter table public.trust_flags enable row level security; -- no policies: only the server and the dashboard can read it

alter table public.profiles add column if not exists flagged boolean not null default false;
alter table public.profiles add column if not exists server_at timestamptz;

-- the most a gear stat can roll at item level 0 (from src/data.js gear.stats max); limits scale x1.5 (Epic, with room) x1.2 per level x2 (two-handers) x3 (repeated lines).
-- Checked against every base, rarity, level, codex and starter item the game can make: the closest is 85% of its limit.
create table if not exists public.stat_limits (stat text primary key, hi numeric not null);
insert into public.stat_limits (stat, hi) values
  ('Stamina', 10), ('Strength', 5), ('Intelligence', 5), ('Dexterity', 5), ('Spirit', 5), ('Initiative', 5), ('Crit Chance', 5), ('Crit Damage', 20),
  ('Resistance', 10), ('Elemental/Holy Damage', 10), ('Max Mana', 25), ('Mana Regen', 10), ('Health Regen', 10), ('Recovery', 10), ('Thorns', 3), ('Luck', 5),
  ('Multi-hit Chance', 5), ('Multiplay Chance', 5), ('Multicast Chance', 5), ('Bleed Chance', 5), ('Party Recovery', 5), ('Lifesteal', 5), ('Defense Gain', 10),
  ('All Resistances', 3), ('Efficiency', 5), ('Draw', 2), ('Regen', 30)
on conflict (stat) do update set hi = excluded.hi;
alter table public.stat_limits enable row level security;

-- ---------- the ledger: every trade, sale and settled wager, written only by the functions below
create table if not exists public.trade_ledger (id bigint generated always as identity primary key, at timestamptz not null default now(), kind text not null,
  giver uuid not null, receiver uuid not null, items jsonb not null default '[]'::jsonb, gold integer not null default 0, ref text);
create unique index if not exists trade_ledger_ref on public.trade_ledger (kind, ref, giver);
create index if not exists trade_ledger_giver on public.trade_ledger (giver, at); create index if not exists trade_ledger_receiver on public.trade_ledger (receiver, at);
alter table public.trade_ledger enable row level security;
drop policy if exists "trade_ledger: see own" on public.trade_ledger;
create policy "trade_ledger: see own" on public.trade_ledger for select to authenticated using ((select auth.uid()) in (giver, receiver));
create table if not exists public.trade_pending (tid text primary key, kind text not null, a uuid not null, b uuid not null, a_give jsonb not null, a_gold integer not null, b_give jsonb not null, b_gold integer not null, at timestamptz not null default now());
alter table public.trade_pending enable row level security;

-- ---------- helpers
-- every item an account holds: both stashes, both vaults, worn gear, Bazaar listings and an Arena stake
create or replace function public.cb_items(d jsonb) returns setof jsonb language sql immutable as $$
  select x from jsonb_array_elements(coalesce(d->'stash', '[]') || coalesce(d->'stashOther', '[]') || coalesce(d->'vault', '[]') || coalesce(d->'vaultOther', '[]') || coalesce(d->'arena'->'stake'->'items', '[]')) x
  union all select l->'it' from jsonb_array_elements(coalesce(d->'bazaar'->'items', '[]')) l where l ? 'it'
  union all select g from jsonb_each(coalesce(d->'chars', '{}')) c, jsonb_array_elements(coalesce(c.value->'gear', '[]')) g
$$;
-- items you can hand over: stashes, vaults and your Bazaar listings (not worn gear)
create or replace function public.cb_tradeable(d jsonb) returns setof jsonb language sql immutable as $$
  select x from jsonb_array_elements(coalesce(d->'stash', '[]') || coalesce(d->'stashOther', '[]') || coalesce(d->'vault', '[]') || coalesce(d->'vaultOther', '[]')) x
  union all select l->'it' from jsonb_array_elements(coalesce(d->'bazaar'->'items', '[]')) l where l ? 'it'
  union all select x from jsonb_array_elements(coalesce(d->'arena'->'stake'->'items', '[]')) x
$$;
drop function if exists public.cb_max_level(jsonb);
-- why an item can't be real, or null
drop function if exists public.cb_item_problem(jsonb, integer, boolean);
create or replace function public.cb_item_problem(it jsonb, admin boolean) returns text language plpgsql stable set search_path = public as $$
declare lvl integer; k text; v jsonb; hi numeric; base text;
begin
  if it is null or jsonb_typeof(it) <> 'object' then return null; end if;
  if (it ? 'test') and not admin then return 'test item: ' || coalesce(it->>'name', '?'); end if;
  lvl := case when (it->>'level') ~ '^[0-9]+$' then (it->>'level')::int when (it->>'ilvl') ~ '^[0-9]+$' then ((it->>'ilvl')::int / 5) else 0 end;
  if lvl > 19 then return 'item level ' || lvl || ': ' || coalesce(it->>'name', '?'); end if;
  for k, v in select key, value from jsonb_each(coalesce(it->'stats', '{}') || coalesce(it->'imp2', '{}')) loop
    if jsonb_typeof(v) <> 'number' then continue; end if;
    base := split_part(k, ':', 1); select s.hi into hi from public.stat_limits s where s.stat = base;
    if hi is null then return 'unknown stat ' || k || ' on ' || coalesce(it->>'name', '?'); end if;
    if (v::text)::numeric > hi * 1.5 * power(1.2, lvl) * 2 * 3 + 12 then return k || ' ' || v::text || ' is past what +' || lvl || ' gear can roll: ' || coalesce(it->>'name', '?'); end if;
  end loop;
  return null;
end $$;
create or replace function public.cb_gold(d jsonb) returns bigint language sql immutable as $$ select coalesce((d->>'gold')::bigint, 0) + coalesce((d->>'goldOther')::bigint, 0) $$;

-- ---------- the save check
create or replace function public.cb_profile_check() returns trigger language plpgsql security definer set search_path = public as $$
declare reasons text[] := '{}'; admin boolean; p text; gone integer; mins numeric; gin bigint; gout bigint; iin integer; newids integer; dup text; inc bigint; clears integer; since timestamptz;
begin
  new.server_at := now();
  if auth.uid() is not null then new.flagged := case when tg_op = 'UPDATE' then old.flagged else false end; end if; -- the game can't clear its own flag (you can, from the SQL editor)
  admin := public.is_admin(new.user_id);
  if admin then return new; end if;
  if (select count(*) from jsonb_object_keys(coalesce(new.data->'chars', '{}'))) > 20 then reasons := reasons || 'more than 20 heroes'; end if;
  if exists (select 1 from jsonb_each(coalesce(new.data->'chars', '{}')) c, jsonb_array_elements(coalesce(c.value->'deck', '[]') || coalesce(c.value->'cards', '[]')) k where (k->>'rank') ~ '^[0-9]+$' and (k->>'rank')::int > 10) then reasons := reasons || 'a card ranked past +10'; end if;
  if exists (select 1 from jsonb_each(coalesce(new.data->'chars', '{}')) c where jsonb_array_length(coalesce(c.value->'deck', '[]')) > 30) then reasons := reasons || 'a deck over 30 cards'; end if;
  select public.cb_item_problem(i, false) into p from public.cb_items(new.data) i where public.cb_item_problem(i, false) is not null limit 1;
  if p is not null then reasons := reasons || p; end if;
  if tg_op = 'UPDATE' then
    since := coalesce(old.server_at, now() - interval '1 day'); mins := greatest(0.5, extract(epoch from (now() - since)) / 60);
    select coalesce(sum(gold), 0), coalesce(sum(jsonb_array_length(items)), 0) into gin, iin from public.trade_ledger where receiver = new.user_id and at > since - interval '2 minutes';
    select coalesce(sum(gold), 0) into gout from public.trade_ledger where giver = new.user_id and at > since - interval '2 minutes';
    inc := public.cb_gold(new.data) - public.cb_gold(old.data);
    -- items that left the account can have been salvaged (at most ~100 gold each at +19)
    select count(*) into gone from (select distinct o->>'id' id from public.cb_items(old.data) o where o ? 'id') q where q.id not in (select i->>'id' from public.cb_items(new.data) i where i ? 'id');
    if inc > 3000 + 1500 * mins + 120 * gone + gin - gout then reasons := reasons || ('gold up ' || inc || ' in ' || round(mins, 1) || ' min'); end if;
    select count(*) into newids from (select distinct i->>'id' id from public.cb_items(new.data) i where i ? 'id') n where n.id not in (select o->>'id' from public.cb_items(old.data) o where o ? 'id');
    if newids > 60 + 10 * mins + iin then reasons := reasons || (newids || ' new items in ' || round(mins, 1) || ' min'); end if;
    -- one run clears at most one map per hero (a party can carry a hero several levels at once, so the size of the jump doesn't count)
    select coalesce(max(n), 0) into clears from (select c.key, count(*) n from jsonb_each(coalesce(new.data->'chars', '{}')) c, jsonb_each(coalesce(c.value->'mapKills', '{}')) k
      where jsonb_typeof(k.value) = 'number' and (k.value)::text::int > coalesce((old.data->'chars'->c.key->'mapKills'->>k.key)::int, -1) group by c.key) q;
    if clears > 1 + floor(mins / 3) or exists (select 1 from jsonb_each(coalesce(new.data->'chars', '{}')) c, jsonb_each(coalesce(c.value->'mapKills', '{}')) k where jsonb_typeof(k.value) = 'number' and (k.value)::text::int > 19) then reasons := reasons || ('map clears jumped in ' || round(mins, 1) || ' min'); end if;
  end if;
  select i->>'name' into dup from public.cb_items(new.data) i where i ? 'id' and exists (select 1 from public.trade_ledger l, jsonb_array_elements(l.items) t
    where l.giver = new.user_id and l.at < now() - interval '3 minutes' and t->>'id' = i->>'id'
      and not exists (select 1 from public.trade_ledger l2, jsonb_array_elements(l2.items) t2 where l2.receiver = new.user_id and l2.at > l.at and t2->>'id' = i->>'id')) limit 1;
  if dup is not null then reasons := reasons || ('kept an item it traded away: ' || dup); end if;
  if array_length(reasons, 1) > 0 then
    new.flagged := true;
    insert into public.trust_flags (user_id, reason, detail) values (new.user_id, array_to_string(reasons, '; '), jsonb_build_object('wid', new.data->>'wid'));
  end if;
  return new;
end $$;
drop trigger if exists cb_profile_check on public.profiles;
create trigger cb_profile_check before insert or update on public.profiles for each row execute function public.cb_profile_check();

-- ---------- the Hall of Records: written by the server from the saved hero
alter table public.hero_records add column if not exists hidden boolean not null default false;
drop policy if exists "hero_records: signed-in can read" on public.hero_records;
create policy "hero_records: signed-in can read" on public.hero_records for select to authenticated using (not hidden or (select auth.uid()) = user_id);
drop policy if exists "hero_records: insert own" on public.hero_records;
drop policy if exists "hero_records: update own" on public.hero_records;
create or replace function public.cb_progress(c jsonb) returns integer language plpgsql immutable as $$
declare s integer := 0; mk text; cl integer; nr integer; b jsonb;
begin
  for mk in select distinct k from (select jsonb_object_keys(coalesce(c->'mapBest', '{}')) k union select jsonb_object_keys(coalesce(c->'sKills', '{}'))) q loop
    cl := coalesce((c->'sKills'->>mk)::int, -1); b := c->'mapBest'->mk;
    nr := coalesce((c->'mapRows'->mk->>(cl + 1)::text)::int, case when b is not null and (b->>'lvl')::int = cl + 1 then (b->>'row')::int else 0 end);
    s := s + (cl + 1) * 15 + least(14, coalesce(nr, 0));
  end loop;
  return s;
end $$;
create or replace function public.submit_hero_record(p_hero_key text, p_snapshot jsonb, p_guild text, p_power integer) returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); pr record; c jsonb; v_season text; maps jsonb := '{}'; mk text; snap jsonb; prev timestamptz;
begin
  if uid is null then return 'signed out'; end if;
  select * into pr from public.profiles where user_id = uid; if not found then return 'no save'; end if;
  c := pr.data->'chars'->p_hero_key; if c is null then return 'no such hero'; end if;
  v_season := (select value #>> '{}' from public.game_config where key = 'season');
  select updated_at into prev from public.hero_records where user_id = uid and hero_key = p_hero_key and hero_records.season = v_season;
  if prev is not null and prev > now() - interval '10 seconds' then return 'later'; end if;
  for mk in select distinct k from (select jsonb_object_keys(coalesce(c->'mapBest', '{}')) k union select jsonb_object_keys(coalesce(c->'sKills', '{}')) union select jsonb_object_keys(coalesce(c->'bossKillsBy', '{}'))) q loop
    maps := maps || jsonb_build_object(mk, coalesce(c->'mapBest'->mk, '{"lvl":0,"row":0}') || jsonb_build_object('done', coalesce((c->'sKills'->>mk)::int, -1), 'doneAt', c->'mapKillAt'->mk, 'kills', coalesce((c->'bossKillsBy'->>mk)::int, 0)));
  end loop;
  -- the snapshot keeps what the page knows how to show (codex, talents, title), but gear, deck and counts come from the save
  snap := coalesce(p_snapshot, '{}') || jsonb_build_object(
    'gear', coalesce((select jsonb_agg(g - 'id' - 'lines') from jsonb_array_elements(coalesce(c->'gear', '[]')) g), '[]'),
    'deck', coalesce((select jsonb_agg(jsonb_build_array(k->>'key', coalesce((k->>'rank')::int, 0))) from jsonb_array_elements(coalesce(c->'deck', '[]')) k), '[]'),
    'runs', coalesce((c->>'runs')::int, 0), 'bossKills', coalesce((c->>'bossKills')::int, 0), 'raidKills', coalesce((c->>'raidKills')::int, 0), 'hardcore', coalesce((c->>'hardcore')::boolean, false));
  insert into public.hero_records (user_id, hero_key, season, hero_name, hero_class, guild_name, progress, power, maps, snapshot, updated_at, hidden)
  values (uid, p_hero_key, v_season, left(coalesce(c->>'name', '?'), 16), coalesce(c->>'cls', '?'), left(p_guild, 24), public.cb_progress(c), least(100, greatest(0, coalesce(p_power, 0))), maps, snap, now(), pr.flagged or public.is_admin(uid))
  on conflict (user_id, hero_key, season) do update set hero_name = excluded.hero_name, hero_class = excluded.hero_class, guild_name = excluded.guild_name, progress = excluded.progress,
    power = excluded.power, maps = excluded.maps, snapshot = excluded.snapshot, updated_at = excluded.updated_at, hidden = excluded.hidden;
  return case when pr.flagged then 'hidden' else 'ok' end;
end $$;
grant execute on function public.submit_hero_record(text, jsonb, text, integer) to authenticated;

-- raid kills: flagged accounts can't write them
drop policy if exists "raid_kills: leader records" on public.raid_kills;
create policy "raid_kills: leader records" on public.raid_kills for insert to authenticated with check ((select auth.uid()) = created_by and not coalesce((select flagged from public.profiles where user_id = (select auth.uid())), false));

-- ---------- trades, sales and wagers
-- does the saved account hold every one of these items (same id, same stats)?
create or replace function public.cb_owns(d jsonb, items jsonb) returns boolean language sql stable as $$
  select not exists (select 1 from jsonb_array_elements(coalesce(items, '[]')) want where not exists (
    select 1 from public.cb_tradeable(d) have where have->>'id' = want->>'id' and coalesce(have->'stats', '{}') = coalesce(want->'stats', '{}')))
$$;
-- a direct trade: both players call it with the same trade id; the second call that matches the first writes the ledger
create or replace function public.trade_submit(p_tid text, p_partner uuid, p_give jsonb, p_gold integer, p_get jsonb, p_get_gold integer) returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); me record; pend record; ids_give text; ids_get text;
begin
  if uid is null or p_partner is null or uid = p_partner then return 'bad request'; end if;
  select * into me from public.profiles where user_id = uid; if not found then return 'no save'; end if;
  if me.flagged or coalesce((select flagged from public.profiles where user_id = p_partner), false) then return 'blocked'; end if;
  if exists (select 1 from public.trade_ledger where kind = 'trade' and ref = p_tid and uid in (giver, receiver)) then return 'done'; end if;
  if not public.cb_owns(me.data, p_give) then return 'not saved'; end if; -- your save on the server doesn't have these yet (or at all)
  if coalesce(p_gold, 0) < 0 or coalesce(p_get_gold, 0) < 0 or coalesce(p_gold, 0) > public.cb_gold(me.data) then return 'not enough gold'; end if;
  select string_agg(x->>'id', ',' order by x->>'id') into ids_give from jsonb_array_elements(coalesce(p_give, '[]')) x;
  select string_agg(x->>'id', ',' order by x->>'id') into ids_get from jsonb_array_elements(coalesce(p_get, '[]')) x;
  delete from public.trade_pending where at < now() - interval '1 hour';
  select * into pend from public.trade_pending where tid = p_tid for update;
  if found and pend.a = p_partner and pend.b = uid then
    if coalesce(ids_give, '') = coalesce((select string_agg(x->>'id', ',' order by x->>'id') from jsonb_array_elements(pend.b_give) x), '')
       and coalesce(ids_get, '') = coalesce((select string_agg(x->>'id', ',' order by x->>'id') from jsonb_array_elements(pend.a_give) x), '')
       and coalesce(p_gold, 0) = pend.b_gold and coalesce(p_get_gold, 0) = pend.a_gold then
      insert into public.trade_ledger (kind, giver, receiver, items, gold, ref) values ('trade', pend.a, pend.b, pend.a_give, pend.a_gold, p_tid), ('trade', uid, p_partner, coalesce(p_give, '[]'), coalesce(p_gold, 0), p_tid);
      delete from public.trade_pending where tid = p_tid; return 'done';
    end if;
    return 'mismatch';
  end if;
  insert into public.trade_pending (tid, kind, a, b, a_give, a_gold, b_give, b_gold) values (p_tid, 'trade', uid, p_partner, coalesce(p_give, '[]'), coalesce(p_gold, 0), coalesce(p_get, '[]'), coalesce(p_get_gold, 0))
    on conflict (tid) do update set a_give = excluded.a_give, a_gold = excluded.a_gold, b_give = excluded.b_give, b_gold = excluded.b_gold, at = now() where public.trade_pending.a = uid;
  return 'waiting';
end $$;
-- giving up on a trade: take your side off the server, unless the other player confirmed it already ('done')
create or replace function public.trade_cancel(p_tid text) returns text language plpgsql security definer set search_path = public as $$
begin
  delete from public.trade_pending where tid = p_tid and auth.uid() in (a, b);
  if exists (select 1 from public.trade_ledger where kind = 'trade' and ref = p_tid and auth.uid() in (giver, receiver)) then return 'done'; end if;
  return 'cancelled';
end $$;
create or replace function public.trade_status(p_tid text) returns text language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from public.trade_ledger where kind = 'trade' and ref = p_tid and auth.uid() in (giver, receiver)) then 'done'
              when exists (select 1 from public.trade_pending where tid = p_tid and auth.uid() in (a, b)) then 'waiting' else 'none' end
$$;
-- a Bazaar sale: the seller calls it before handing the item over
create or replace function public.market_sale(p_ref text, p_buyer uuid, p_item jsonb, p_price integer) returns text language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); me record; buyer record;
begin
  if uid is null or p_buyer is null or uid = p_buyer or coalesce(p_price, -1) < 0 then return 'bad request'; end if;
  select * into me from public.profiles where user_id = uid; select * into buyer from public.profiles where user_id = p_buyer;
  if me is null or buyer is null then return 'no save'; end if;
  if me.flagged or buyer.flagged then return 'blocked'; end if;
  if exists (select 1 from public.trade_ledger where kind = 'sale' and ref = p_ref and giver = uid) then return 'done'; end if;
  if not public.cb_owns(me.data, jsonb_build_array(p_item)) then return 'not saved'; end if;
  insert into public.trade_ledger (kind, giver, receiver, items, gold, ref) values ('sale', uid, p_buyer, jsonb_build_array(p_item), 0, p_ref), ('sale', p_buyer, uid, '[]', p_price, p_ref);
  return 'done';
end $$;
-- Arena wagers: the loser concedes the stake (or the winner claims it from the loser's saved wager); either writes the ledger once
create or replace function public.cb_wager_log(p_loser uuid, p_winner uuid, p_pid text) returns text language plpgsql security definer set search_path = public as $$
declare st jsonb;
begin
  if exists (select 1 from public.trade_ledger where kind = 'wager' and ref = p_pid and giver = p_loser) then return 'done'; end if;
  select data->'arena'->'stake' into st from public.profiles where user_id = p_loser and data->'arena'->>'pid' = p_pid;
  if st is null then return 'no stake'; end if;
  insert into public.trade_ledger (kind, giver, receiver, items, gold, ref) values ('wager', p_loser, p_winner, coalesce(st->'items', '[]'), coalesce((st->>'gold')::int, 0), p_pid);
  return 'done';
end $$;
create or replace function public.wager_concede(p_winner uuid, p_pid text) returns text language sql security definer set search_path = public as $$ select public.cb_wager_log(auth.uid(), p_winner, p_pid) $$;
create or replace function public.wager_claim(p_loser uuid, p_pid text) returns text language sql security definer set search_path = public as $$ select public.cb_wager_log(p_loser, auth.uid(), p_pid) $$;
revoke execute on function public.cb_wager_log(uuid, uuid, text) from public, authenticated, anon;
grant execute on function public.trade_submit(text, uuid, jsonb, integer, jsonb, integer), public.trade_status(text), public.trade_cancel(text), public.market_sale(text, uuid, jsonb, integer), public.wager_concede(uuid, text), public.wager_claim(uuid, text) to authenticated;
