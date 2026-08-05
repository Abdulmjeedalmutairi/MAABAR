-- Catalog import: duplicate detection by file content hash.
-- A SHA-256 of the uploaded PDF is stored on the import row; when the admin picks
-- a file, the panel hashes it in the browser and checks for a prior import with
-- the same hash — so re-uploading the same catalog (even renamed) is caught
-- instantly, before another extraction is started.

alter table public.factory_catalog_imports
  add column if not exists file_hash text;

create index if not exists idx_fci_file_hash
  on public.factory_catalog_imports (file_hash);
