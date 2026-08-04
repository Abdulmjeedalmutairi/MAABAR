-- Catalog import: per-product SECTION/collection + the catalog OUTLINE.
--
-- A single big catalog often bundles several departments (women / men / sports,
-- or sofas / beds / dining, etc.). A first "outline" pass (Gemini) maps those
-- sections to page ranges; each product is then tagged with the section its page
-- falls in, so the factory page can show Amazon/Alibaba-style section filters —
-- for ANY category, with no per-file guidance.
--
--   factory_products.section_ar / section_en — the product's section label.
--   factory_catalog_imports.outline           — the raw outline (sections +
--     page ranges + detected logo + catalog flags) for reference / re-use.

alter table public.factory_products
  add column if not exists section_ar text;

alter table public.factory_products
  add column if not exists section_en text;

alter table public.factory_catalog_imports
  add column if not exists outline jsonb;
