alter table public.players add column if not exists profile_type text not null default 'player';
alter table public.players add column if not exists birth_date date;
alter table public.players add column if not exists nationality text;
alter table public.players add column if not exists height_cm integer;
alter table public.players add column if not exists dominant_hand text;
alter table public.players add column if not exists joined_at date;
alter table public.players add column if not exists previous_clubs text;
alter table public.players add column if not exists season_goals integer not null default 0;
alter table public.players add column if not exists bio_tr text;
alter table public.players add column if not exists bio_en text;
alter table public.players add column if not exists coaching_experience text;
alter table public.players add column if not exists coaching_licenses text;
alter table public.players add column if not exists achievements text;

alter table public.players drop constraint if exists players_profile_type_check;
alter table public.players add constraint players_profile_type_check check (profile_type in ('player','coach'));
