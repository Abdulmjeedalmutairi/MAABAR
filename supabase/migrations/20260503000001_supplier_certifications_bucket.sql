-- Public bucket for supplier quality certification documents.
-- Buyers can read directly (public). Suppliers can upload/delete their own
-- files only — RLS pins the first folder segment to auth.uid().
--
-- Path convention (set by client): <user.id>/cert_<timestamp>_<random>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'supplier-certifications',
  'supplier-certifications',
  true,
  10485760, -- 10 MB
  array['image/jpeg','image/png','image/webp','application/pdf']
)
on conflict (id) do nothing;

-- Suppliers upload to their own folder only
drop policy if exists "supplier_cert_upload" on storage.objects;
create policy "supplier_cert_upload"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'supplier-certifications'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Suppliers delete their own files only
drop policy if exists "supplier_cert_delete" on storage.objects;
create policy "supplier_cert_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'supplier-certifications'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Public read (buyers can see cert files directly)
drop policy if exists "supplier_cert_public_read" on storage.objects;
create policy "supplier_cert_public_read"
on storage.objects for select to public
using (bucket_id = 'supplier-certifications');
