-- Karagümrük Hentbol CMS schema
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin','editor','media','academy')),
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  club_logo_size integer not null default 110,
  vitorra_logo_width integer not null default 140,
  hero_title_size integer not null default 88,
  hero_min_height integer not null default 650,
  show_partner_badge boolean not null default true,
  show_quick_links boolean not null default true,
  hero_title_tr text not null default 'KARAGÜMRÜK HENTBOL',
  hero_title_en text not null default 'KARAGÜMRÜK HANDBALL',
  hero_text_tr text,
  hero_text_en text,
  donation_iban text,
  donation_link text,
  contact_email text default 'info@karagumrukhentbol.org',
  updated_at timestamptz not null default now()
);
insert into public.site_settings(id) values (1) on conflict (id) do nothing;

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title_tr text not null,
  title_en text not null,
  body_tr text,
  body_en text,
  image_url text,
  published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  match_date timestamptz not null,
  venue text,
  home_score integer,
  away_score integer,
  status text not null default 'upcoming' check (status in ('upcoming','finished','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number integer,
  position_tr text,
  position_en text,
  nationality text,
  height_cm integer,
  weight_kg integer,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.academy_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  age_group text,
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  reason text,
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text,
  email text,
  amount numeric(12,2),
  currency text not null default 'TRY',
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title_tr text,
  title_en text,
  image_url text not null,
  category text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.news enable row level security;
alter table public.matches enable row level security;
alter table public.players enable row level security;
alter table public.academy_applications enable row level security;
alter table public.membership_requests enable row level security;
alter table public.donations enable row level security;
alter table public.sponsors enable row level security;
alter table public.gallery enable row level security;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

create policy "Public read settings" on public.site_settings for select using (true);
create policy "Admin update settings" on public.site_settings for update using (public.is_admin()) with check (public.is_admin());

create policy "Public read published news" on public.news for select using (published = true or public.is_admin());
create policy "Admin manage news" on public.news for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read matches" on public.matches for select using (true);
create policy "Admin manage matches" on public.matches for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read active players" on public.players for select using (active = true or public.is_admin());
create policy "Admin manage players" on public.players for all using (public.is_admin()) with check (public.is_admin());
create policy "Public submit academy" on public.academy_applications for insert with check (true);
create policy "Admin read academy" on public.academy_applications for select using (public.is_admin());
create policy "Admin update academy" on public.academy_applications for update using (public.is_admin()) with check (public.is_admin());
create policy "Public submit membership" on public.membership_requests for insert with check (true);
create policy "Admin read membership" on public.membership_requests for select using (public.is_admin());
create policy "Admin update membership" on public.membership_requests for update using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage donations" on public.donations for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read sponsors" on public.sponsors for select using (active = true or public.is_admin());
create policy "Admin manage sponsors" on public.sponsors for all using (public.is_admin()) with check (public.is_admin());
create policy "Public read gallery" on public.gallery for select using (true);
create policy "Admin manage gallery" on public.gallery for all using (public.is_admin()) with check (public.is_admin());
