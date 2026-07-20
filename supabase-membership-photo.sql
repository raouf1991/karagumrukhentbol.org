alter table public.membership_requests
  add column if not exists photo_url text;

comment on column public.membership_requests.photo_url
  is 'Public URL of the profile photo uploaded with the membership application.';
