-- ============================================================
-- Hall of Records seasons (Nov 2): run this once in the Supabase SQL editor (after records.sql; it is also at the end of schema.sql).
-- Every hero gets one row per season; raid kills are tagged with their season. Everything recorded before seasons is Season 0.01.
-- ============================================================
alter table public.hero_records add column if not exists season text not null default '0.01';
alter table public.hero_records drop constraint if exists hero_records_pkey;
alter table public.hero_records add primary key (user_id, hero_key, season);
create index if not exists hero_records_season_progress on public.hero_records (season, progress desc);
alter table public.raid_kills add column if not exists season text not null default '0.01';
create index if not exists raid_kills_season on public.raid_kills (season, killed_at);
