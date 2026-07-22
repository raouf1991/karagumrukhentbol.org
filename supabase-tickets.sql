alter table public.matches add column if not exists tickets_enabled boolean not null default false;
alter table public.matches add column if not exists ticket_capacity integer;
alter table public.matches add column if not exists competition text;

-- matches.id is UUID in this project, so ticket_requests.match_id must also be UUID.
-- Safe during initial installation; removes any incomplete table left by a failed setup.
drop table if exists public.ticket_requests cascade;

create table public.ticket_requests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  status text not null default 'new' check (status in ('new','accepted','cancelled')),
  ticket_number text unique,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.ticket_requests enable row level security;

create policy "Public can create ticket requests"
on public.ticket_requests for insert
to anon, authenticated
with check (status='new');

create policy "Authenticated can read ticket requests"
on public.ticket_requests for select
to authenticated
using (true);

create policy "Authenticated can update ticket requests"
on public.ticket_requests for update
to authenticated
using (true)
with check (true);

create policy "Authenticated can delete ticket requests"
on public.ticket_requests for delete
to authenticated
using (true);

create index ticket_requests_match_id_idx on public.ticket_requests(match_id);
create index ticket_requests_status_idx on public.ticket_requests(status);
