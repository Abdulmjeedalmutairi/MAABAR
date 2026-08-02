-- Catalog Import from the admin dashboard — a 'queued' status.
--
-- The admin now uploads a catalog PDF in the panel, which creates the import row
-- BEFORE extraction runs (on the Cloud Run worker). That row starts as 'queued'
-- (PDF stored, awaiting extraction). The worker flips it to 'extracting' → then
-- 'extracted' / 'failed'. The local CLI still inserts rows directly as 'extracted'.
begin;

alter table public.factory_catalog_imports
  drop constraint if exists factory_catalog_imports_status_check;

alter table public.factory_catalog_imports
  add constraint factory_catalog_imports_status_check
  check (status in ('queued', 'extracting', 'extracted', 'reviewing', 'approved', 'failed'));

-- New admin-uploaded rows default to 'queued'.
alter table public.factory_catalog_imports
  alter column status set default 'queued';

commit;
