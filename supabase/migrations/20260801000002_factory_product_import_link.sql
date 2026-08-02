-- Phase 1A — catalog traceability + trust flags + per-catalog metadata.
--
-- (1) factory_products gains import_id so an approved product can be traced back
--     to the catalog it came from (needed for the "Available Catalogs" display on
--     the factory profile). Today the only bridge is
--     factory_catalog_import_products.approved_product_id, which is set only for
--     deck (single-row) approvals — bulk approvals leave products untraceable.
-- (2) factory_directory gains is_verified / is_featured (admin-set trust badges).
-- (3) factory_catalog_imports gains catalog_title (admin override; falls back to a
--     cleaned original_filename in the UI) and cover_image_path (Phase 3.5 covers).
begin;

-- ── (1) Product → import link ────────────────────────────────────────────────
alter table public.factory_products
  add column if not exists import_id uuid references public.factory_catalog_imports(id) on delete set null;

create index if not exists factory_products_import_idx on public.factory_products (import_id);

-- Backfill, precise first: any product deck-approved carries approved_product_id.
update public.factory_products fp
  set import_id = s.import_id
  from public.factory_catalog_import_products s
  where s.approved_product_id = fp.id
    and fp.import_id is null;

-- Fallback: for any factory that has exactly ONE import, all its remaining
-- unlinked products must belong to that import (covers bulk-approved products;
-- currently applies to Rainbow, the only live factory).
update public.factory_products fp
  set import_id = fci.id
  from public.factory_catalog_imports fci
  where fci.factory_id = fp.factory_id
    and fp.import_id is null
    and (select count(*) from public.factory_catalog_imports x where x.factory_id = fp.factory_id) = 1;

-- ── (2) Trust flags ──────────────────────────────────────────────────────────
alter table public.factory_directory
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_featured boolean not null default false;

comment on column public.factory_directory.is_verified is
  'Admin-set — shows a "Verified" badge on the factory profile. Default false.';
comment on column public.factory_directory.is_featured is
  'Admin-set — shows a "Recommended" badge / feature placement. Default false.';

-- ── (3) Per-catalog metadata ─────────────────────────────────────────────────
alter table public.factory_catalog_imports
  add column if not exists catalog_title    text,
  add column if not exists cover_image_path text;

comment on column public.factory_catalog_imports.catalog_title is
  'Admin-editable display label for this catalog (falls back to a cleaned original_filename).';
comment on column public.factory_catalog_imports.cover_image_path is
  'Optional catalog cover (rendered page-1 image; factory-images bucket). Populated in Phase 3.5.';

-- ── Expose the trust flags publicly (appended last so create-or-replace works) ─
create or replace view public.factory_directory_public as
select
  f.id, f.company_name, f.company_name_latin, f.category,
  f.description_ar, f.description_en, f.description_zh,
  f.city, f.country, f.factory_images, f.sort_order, f.profile_image,
  f.founded_year, f.export_markets, f.is_verified, f.is_featured
from public.factory_directory f
where f.is_active;

alter view public.factory_directory_public set (security_invoker = false);
revoke all on table public.factory_directory_public from public;
grant select on table public.factory_directory_public to anon, authenticated;

commit;
