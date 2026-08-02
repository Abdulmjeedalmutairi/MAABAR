-- Cancellable extraction — a 'cancelled' status.
--
-- The admin can stop a running extraction. The panel writes status='cancelled';
-- the Cloud Run worker checks the row's status at each milestone (and between
-- Gemini chunks) and aborts cooperatively — best-effort, since a single long
-- Gemini call can't be interrupted until it returns.
begin;

alter table public.factory_catalog_imports
  drop constraint if exists factory_catalog_imports_status_check;

alter table public.factory_catalog_imports
  add constraint factory_catalog_imports_status_check
  check (status in ('queued', 'extracting', 'extracted', 'reviewing', 'approved', 'failed', 'cancelled'));

commit;
