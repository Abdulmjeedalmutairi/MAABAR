-- Catalog import — track a separate price file that Gemini matches to the
-- extracted products. The matched price/currency land in the existing
-- factory_catalog_import_products.extracted_json (price/currency) — no new value
-- columns needed; these just track the uploaded price file on the import.
begin;

alter table public.factory_catalog_imports
  add column if not exists price_file_path text,
  add column if not exists price_matched_at timestamptz;

commit;
