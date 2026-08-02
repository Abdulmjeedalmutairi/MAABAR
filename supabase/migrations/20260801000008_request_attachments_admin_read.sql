-- Phase A — let admins read request attachments.
--
-- The request-attachments bucket is private and owner-foldered (buyer uid), so
-- today only the uploading buyer can read an object. The admin (concierge) needs
-- to view/download a buyer's attachments while handling the request — admins have
-- full visibility over everything. This adds an admin-only SELECT policy so the
-- admin client can createSignedUrl for these objects. (The factory still reads
-- via the slug-gated factory-attachment-url edge function; unchanged.)
begin;

drop policy if exists "request-attachments admin read" on storage.objects;
create policy "request-attachments admin read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'request-attachments'
  and public.is_admin_user()
);

commit;
