-- Per-catalog admin guidance for the extraction.
--
-- When uploading a catalog the admin can (optionally) add short guidance for that
-- specific file ("ignore the last 2 pages", "printed codes are OE numbers, not
-- names", "each photo shows several products — don't split"). The Cloud Run worker
-- appends it to the Gemini prompt for that import only. Nullable, additive.
begin;

alter table public.factory_catalog_imports
  add column if not exists import_notes text;

comment on column public.factory_catalog_imports.import_notes is
  'Optional per-catalog admin guidance, appended to the extraction prompt for this import only. Nullable.';

commit;
