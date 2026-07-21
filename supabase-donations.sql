create table if not exists public.donation_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  donation_type text not null check (donation_type in ('cash','in_kind')),
  amount numeric,
  currency text default 'TRY',
  item_name text,
  quantity integer,
  notes text,
  status text not null default 'new' check (status in ('new','accepted')),
  certificate_number text,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.donation_requests enable row level security;

drop policy if exists "Public submit donation request" on public.donation_requests;
create policy "Public submit donation request"
on public.donation_requests for insert
to anon, authenticated
with check (status = 'new');

drop policy if exists "Authenticated admins read donation requests" on public.donation_requests;
create policy "Authenticated admins read donation requests"
on public.donation_requests for select
to authenticated
using (true);

grant insert on public.donation_requests to anon, authenticated;
grant select on public.donation_requests to authenticated;