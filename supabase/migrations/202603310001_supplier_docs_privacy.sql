insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-docs',
  'supplier-docs',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "supplier-docs upload own files" on storage.objects;
create policy "supplier-docs upload own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'supplier-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "supplier-docs read own files" on storage.objects;
create policy "supplier-docs read own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'supplier-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "supplier-docs update own files" on storage.objects;
create policy "supplier-docs update own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'supplier-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'supplier-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "supplier-docs delete own files" on storage.objects;
create policy "supplier-docs delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'supplier-docs'
  and auth.uid()::text = (storage.foldername(name))[1]
);
