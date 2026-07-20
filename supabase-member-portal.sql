-- Karagümrük Hentbol member portal and renewal system
-- Safe to run again in Supabase SQL Editor.

create table if not exists public.membership_renewals (
  id uuid primary key default gen_random_uuid(),
  membership_request_id uuid not null references public.membership_requests(id) on delete cascade,
  member_email text not null,
  membership_number text not null,
  current_valid_until date,
  requested_years integer not null default 1 check (requested_years between 1 and 3),
  note text,
  receipt_url text,
  status text not null default 'new' check (status in ('new','reviewing','accepted','rejected')),
  reviewed_by text,
  reviewed_at timestamptz,
  new_valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists membership_renewals_member_email_idx on public.membership_renewals(lower(member_email));
create index if not exists membership_renewals_status_idx on public.membership_renewals(status, created_at desc);

alter table public.membership_requests add column if not exists member_portal_enabled boolean not null default false;
alter table public.membership_requests add column if not exists member_last_login_at timestamptz;
alter table public.membership_requests add column if not exists member_auth_user_id uuid;
alter table public.membership_requests add column if not exists card_url text;

update public.membership_requests
set member_portal_enabled = true
where status = 'accepted' and membership_number is not null;

alter table public.membership_renewals enable row level security;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt()->>'email','')) in ('raouf.tarek@gmail.com');
$$;

grant execute on function public.is_club_admin() to authenticated;

-- Secure portal lookup. It uses the authenticated JWT email, never an email supplied by the browser.
create or replace function public.get_my_membership()
returns setof public.membership_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_email text := lower(trim(coalesce(auth.jwt()->>'email','')));
  jwt_uid uuid := auth.uid();
begin
  if jwt_uid is null or jwt_email = '' then
    return;
  end if;

  update public.membership_requests
  set member_auth_user_id = coalesce(member_auth_user_id, jwt_uid),
      member_last_login_at = now()
  where lower(trim(email)) = jwt_email
    and status = 'accepted'
    and member_portal_enabled = true
    and (member_auth_user_id is null or member_auth_user_id = jwt_uid);

  return query
  select m.*
  from public.membership_requests m
  where m.status = 'accepted'
    and m.member_portal_enabled = true
    and (
      m.member_auth_user_id = jwt_uid
      or (m.member_auth_user_id is null and lower(trim(m.email)) = jwt_email)
    )
  order by m.approved_at desc nulls last, m.created_at desc
  limit 1;
end;
$$;

revoke all on function public.get_my_membership() from public;
grant execute on function public.get_my_membership() to authenticated;

-- Members can see their accepted membership record only.
drop policy if exists member_reads_own_membership on public.membership_requests;
create policy member_reads_own_membership
on public.membership_requests for select
to authenticated
using (
  (member_auth_user_id = auth.uid() or lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email',''))))
  and status = 'accepted'
  and member_portal_enabled = true
);

-- Members can read and create only their own renewal requests.
drop policy if exists member_reads_own_renewals on public.membership_renewals;
create policy member_reads_own_renewals
on public.membership_renewals for select
to authenticated
using (lower(trim(member_email)) = lower(trim(coalesce(auth.jwt()->>'email',''))) or public.is_club_admin());

drop policy if exists member_creates_own_renewal on public.membership_renewals;
create policy member_creates_own_renewal
on public.membership_renewals for insert
to authenticated
with check (
  lower(trim(member_email)) = lower(trim(coalesce(auth.jwt()->>'email','')))
  and exists (
    select 1 from public.membership_requests m
    where m.id = membership_request_id
      and (m.member_auth_user_id = auth.uid() or lower(trim(m.email)) = lower(trim(coalesce(auth.jwt()->>'email',''))))
      and m.status = 'accepted'
      and m.member_portal_enabled = true
  )
);

-- Admin can manage renewal requests.
drop policy if exists admin_manages_renewals on public.membership_renewals;
create policy admin_manages_renewals
on public.membership_renewals for all
to authenticated
using (public.is_club_admin())
with check (public.is_club_admin());

-- Admin can update accepted member records during renewal.
drop policy if exists admin_updates_memberships on public.membership_requests;
create policy admin_updates_memberships
on public.membership_requests for update
to authenticated
using (public.is_club_admin())
with check (public.is_club_admin());

grant select, insert on public.membership_renewals to authenticated;
grant update, delete on public.membership_renewals to authenticated;
