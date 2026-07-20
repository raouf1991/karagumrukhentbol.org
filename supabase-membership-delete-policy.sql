-- Run once in Supabase SQL Editor.
-- Allows authenticated admin users to permanently delete membership requests.

alter table public.membership_requests enable row level security;

drop policy if exists "Authenticated users can delete membership requests" on public.membership_requests;

create policy "Authenticated users can delete membership requests"
on public.membership_requests
for delete
to authenticated
using (true);

-- Optional: allow authenticated admins to delete uploaded membership photos too.
-- If a matching storage policy already exists, these statements safely replace it.
drop policy if exists "Authenticated users can delete membership photos" on storage.objects;

create policy "Authenticated users can delete membership photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-media'
  and name like 'membership-photos/%'
);
