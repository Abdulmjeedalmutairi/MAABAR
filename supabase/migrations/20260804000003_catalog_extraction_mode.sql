-- Catalog import: per-import extraction mode (curated vs full product list).
--
--   'curated' (default) — the existing behaviour: Gemini selects the strongest
--     representative products and GROUPS variants (sizes/colours) into one.
--   'full' — extract EVERY distinct product as printed (no dropping, no
--     variant-grouping), still merging the same physical item repeated across
--     pages/angles so we don't get literal duplicate rows.
--
-- The admin picks the mode at upload time; it can be changed on an existing
-- import and re-run. The Cloud Run worker reads this column and swaps the
-- Gemini prompt accordingly.

alter table public.factory_catalog_imports
  add column if not exists extraction_mode text not null default 'curated';

alter table public.factory_catalog_imports
  drop constraint if exists factory_catalog_imports_extraction_mode_chk;

alter table public.factory_catalog_imports
  add constraint factory_catalog_imports_extraction_mode_chk
  check (extraction_mode in ('curated', 'full'));
