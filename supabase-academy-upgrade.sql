alter table public.academy_applications
  add column if not exists birth_date date,
  add column if not exists height_cm integer,
  add column if not exists dominant_hand text,
  add column if not exists gender text;

alter table public.academy_applications
  drop constraint if exists academy_applications_height_cm_check;
alter table public.academy_applications
  add constraint academy_applications_height_cm_check
  check (height_cm is null or (height_cm >= 80 and height_cm <= 230));

alter table public.academy_applications
  drop constraint if exists academy_applications_dominant_hand_check;
alter table public.academy_applications
  add constraint academy_applications_dominant_hand_check
  check (dominant_hand is null or dominant_hand in ('right','left','both'));

alter table public.academy_applications
  drop constraint if exists academy_applications_gender_check;
alter table public.academy_applications
  add constraint academy_applications_gender_check
  check (gender is null or gender in ('male','female'));

-- Keep public applications enabled without exposing application records.
alter table public.academy_applications enable row level security;

drop policy if exists "Public submit academy application" on public.academy_applications;
create policy "Public submit academy application"
on public.academy_applications
for insert
to anon, authenticated
with check (status = 'new');

-- Existing administrator SELECT / UPDATE / DELETE policies are intentionally preserved.