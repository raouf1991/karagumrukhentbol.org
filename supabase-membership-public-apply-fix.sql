-- Fix public membership application submissions
-- Run in Supabase SQL Editor. Safe to run again.

alter table public.membership_requests enable row level security;

grant insert on table public.membership_requests to anon, authenticated;

-- Public visitors may create a new application only in the initial state.
drop policy if exists public_creates_membership_application on public.membership_requests;
create policy public_creates_membership_application
on public.membership_requests
for insert
to anon, authenticated
with check (
  status = 'new'
  and membership_number is null
  and approved_at is null
  and valid_until is null
  and member_portal_enabled = false
  and member_auth_user_id is null
  and full_name is not null
  and trim(full_name) <> ''
  and email is not null
  and trim(email) <> ''
);
