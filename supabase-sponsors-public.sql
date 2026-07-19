alter table public.sponsors enable row level security;

drop policy if exists "Public can view sponsors" on public.sponsors;

create policy "Public can view sponsors"
on public.sponsors
for select
to anon, authenticated
using (active is not false);
