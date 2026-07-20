-- Fix member portal lookup for authenticated members.
-- Run once in Supabase SQL Editor.

create or replace function public.get_my_membership()
returns setof public.membership_requests
language sql
stable
security definer
set search_path = public
as $$
  select m.*
  from public.membership_requests m
  where lower(trim(m.email)) = lower(trim(coalesce(auth.jwt()->>'email','')))
    and m.status = 'accepted'
    and m.member_portal_enabled = true
    and m.membership_number is not null
  order by m.approved_at desc nulls last, m.created_at desc
  limit 1;
$$;

grant execute on function public.get_my_membership() to authenticated;

-- Keep the normal RLS policy too.
drop policy if exists member_reads_own_membership on public.membership_requests;
create policy member_reads_own_membership
on public.membership_requests for select
to authenticated
using (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt()->>'email','')))
  and status = 'accepted'
  and member_portal_enabled = true
);
