-- Allow public membership applicants to upload only their profile photos
-- Run in Supabase SQL Editor. Safe to run again.

-- The website uploads to bucket: site-media
-- and only under folder: membership-photos/

drop policy if exists "public_uploads_membership_photos" on storage.objects;
create policy "public_uploads_membership_photos"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'site-media'
  and (storage.foldername(name))[1] = 'membership-photos'
);

-- Allow the browser/email/card generator to read uploaded profile photos.
drop policy if exists "public_reads_membership_photos" on storage.objects;
create policy "public_reads_membership_photos"
on storage.objects
for select
to public
using (
  bucket_id = 'site-media'
  and (storage.foldername(name))[1] = 'membership-photos'
);
