alter table public.membership_requests
  add column if not exists membership_number text unique,
  add column if not exists membership_type text not null default 'Yetişkin Üye',
  add column if not exists approved_at timestamptz,
  add column if not exists valid_until date,
  add column if not exists approval_email_sent_at timestamptz;

create sequence if not exists public.membership_number_seq start 1;

create or replace function public.generate_membership_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_value bigint;
begin
  seq_value := nextval('public.membership_number_seq');
  return 'KH-' || extract(year from now())::int || '-' || lpad(seq_value::text, 6, '0');
end;
$$;

grant execute on function public.generate_membership_number() to authenticated;

create index if not exists membership_requests_membership_number_idx
on public.membership_requests (membership_number);
