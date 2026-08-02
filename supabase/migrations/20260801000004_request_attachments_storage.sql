-- Phase 1C — private bucket for buyer request attachments (reference images,
-- spec sheets, drawings, ZIPs). PRIVATE: objects are foldered by buyer uid and
-- readable only by the owner. The anonymous factory portal (/f/<slug>) never
-- reads these directly — a signed URL is minted by the factory-attachment-url
-- edge function (service role), which verifies the invite owns the request first.
-- Path convention: {buyer_uid}/{request_id}/{filename}.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-attachments',
  'request-attachments',
  false,
  10485760,  -- 10 MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "request-attachments upload own files" on storage.objects;
create policy "request-attachments upload own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'request-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "request-attachments read own files" on storage.objects;
create policy "request-attachments read own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'request-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "request-attachments update own files" on storage.objects;
create policy "request-attachments update own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'request-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'request-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "request-attachments delete own files" on storage.objects;
create policy "request-attachments delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'request-attachments'
  and auth.uid()::text = (storage.foldername(name))[1]
);

commit;
