-- Nov 15: Solo and Co-op ladders. Run once in the Supabase SQL editor: the Hall of Records then takes each hero's
-- solo and co-op clears from the saved hero (the server), not from the page.
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
    'runs', coalesce((c->>'runs')::int, 0), 'bossKills', coalesce((c->>'bossKills')::int, 0), 'raidKills', coalesce((c->>'raidKills')::int, 0), 'hardcore', coalesce((c->>'hardcore')::boolean, false),
    'solo', coalesce(c->'sSolo', '{}'), 'coop', coalesce(c->'sCoop', '{}'));   -- Nov 15: Solo / Co-op ladders, from the save
  insert into public.hero_records (user_id, hero_key, season, hero_name, hero_class, guild_name, progress, power, maps, snapshot, updated_at, hidden)
  values (uid, p_hero_key, v_season, left(coalesce(c->>'name', '?'), 16), coalesce(c->>'cls', '?'), left(p_guild, 24), public.cb_progress(c), least(100, greatest(0, coalesce(p_power, 0))), maps, snap, now(), pr.flagged or public.is_admin(uid))
  on conflict (user_id, hero_key, season) do update set hero_name = excluded.hero_name, hero_class = excluded.hero_class, guild_name = excluded.guild_name, progress = excluded.progress,
    power = excluded.power, maps = excluded.maps, snapshot = excluded.snapshot, updated_at = excluded.updated_at, hidden = excluded.hidden;
  return case when pr.flagged then 'hidden' else 'ok' end;
end $$;
