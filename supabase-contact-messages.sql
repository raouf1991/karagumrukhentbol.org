create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  source text not null default 'website',
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "Public can submit contact messages" on public.contact_messages;
create policy "Public can submit contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (
  char_length(full_name) between 2 and 120
  and char_length(email) between 5 and 254
  and char_length(message) between 2 and 5000
);

drop policy if exists "Authenticated admins can view contact messages" on public.contact_messages;
create policy "Authenticated admins can view contact messages"
on public.contact_messages
for select
to authenticated
using (true);

drop policy if exists "Authenticated admins can update contact messages" on public.contact_messages;
create policy "Authenticated admins can update contact messages"
on public.contact_messages
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete contact messages" on public.contact_messages;
create policy "Authenticated admins can delete contact messages"
on public.contact_messages
for delete
to authenticated
using (true);

create index if not exists contact_messages_created_at_idx
on public.contact_messages (created_at desc);
