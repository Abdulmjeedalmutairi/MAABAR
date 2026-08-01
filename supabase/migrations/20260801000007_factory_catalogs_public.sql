-- Phase 3A — public read model for the "Available Catalogs" section on the
-- factory profile. factory_catalog_imports is admin-only (RLS), so anon/buyer
-- pages cannot read it directly. This definer view exposes ONLY non-sensitive
-- catalog metadata (title, page count, cover, product count) for catalogs that
-- have live products under an active factory. Nothing sensitive is exposed
-- (no source_pdf_path, factory_fields, email, uploader, etc.).
begin;

create or replace view public.factory_catalogs_public as
select
  i.id,
  i.factory_id,
  -- Admin-set label, else a cleaned filename (extension dropped, underscores → spaces).
  coalesce(
    nullif(trim(i.catalog_title), ''),
    initcap(replace(regexp_replace(coalesce(i.original_filename, ''), '\.[^.]+$', ''), '_', ' '))
  ) as title,
  i.page_count,
  i.cover_image_path,
  pc.product_count
from public.factory_catalog_imports i
join public.factory_directory f on f.id = i.factory_id
join lateral (
  select count(*)::int as product_count
  from public.factory_products p
  where p.import_id = i.id
) pc on true
where f.is_active
  and pc.product_count > 0;

alter view public.factory_catalogs_public set (security_invoker = false);
revoke all on table public.factory_catalogs_public from public;
grant select on table public.factory_catalogs_public to anon, authenticated;

commit;
