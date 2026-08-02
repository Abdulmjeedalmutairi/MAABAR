-- Factory profile fields — founded_year + export_markets.
--
-- Optional trust signals shown on the factory profile page (/factory/:id) as
-- stat badges ("Est. 2012", "Exports to 30+ countries"). Both nullable, additive,
-- and public (exposed via factory_directory_public). Populated by the Catalog
-- Import extraction when the catalog states them, or typed in by an admin.
begin;

alter table public.factory_directory
  add column if not exists founded_year   integer,
  add column if not exists export_markets text;

comment on column public.factory_directory.founded_year is
  'Year the factory was founded (e.g. 2012), shown as "Est. 2012". Nullable.';
comment on column public.factory_directory.export_markets is
  'Export reach as printed (e.g. "30+ countries"), shown as "Exports to …". Nullable.';

-- Recreate the public view to expose the two new fields — appended LAST so
-- create-or-replace accepts it (existing columns / order unchanged).
create or replace view public.factory_directory_public as
select
  f.id, f.company_name, f.company_name_latin, f.category,
  f.description_ar, f.description_en, f.description_zh,
  f.city, f.country, f.factory_images, f.sort_order, f.profile_image,
  f.founded_year, f.export_markets
from public.factory_directory f
where f.is_active;

alter view public.factory_directory_public set (security_invoker = false);
revoke all on table public.factory_directory_public from public;
grant select on table public.factory_directory_public to anon, authenticated;

commit;
