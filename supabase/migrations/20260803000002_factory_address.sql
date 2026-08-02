-- Factory address — public (shown to buyers), alongside city/country.
--
-- email + phone stay SERVER-SIDE ONLY (still excluded from factory_directory_public),
-- so contact details remain admin-only; only the address becomes buyer-visible.
begin;

alter table public.factory_directory
  add column if not exists address text;

comment on column public.factory_directory.address is
  'Factory address as printed on the catalog, shown to buyers on the profile. Nullable. (email/phone remain server-side only.)';

-- Recreate the public view to expose address (email + phone stay excluded).
-- address is appended LAST — create-or-replace only allows ADDING columns at the
-- end (never reordering/renaming existing ones).
create or replace view public.factory_directory_public as
select
  f.id, f.company_name, f.company_name_latin, f.category,
  f.description_ar, f.description_en, f.description_zh,
  f.city, f.country, f.factory_images, f.sort_order, f.profile_image,
  f.founded_year, f.export_markets, f.is_verified, f.is_featured,
  f.moq_note, f.private_label, f.address
from public.factory_directory f
where f.is_active;

alter view public.factory_directory_public set (security_invoker = false);
revoke all on table public.factory_directory_public from public;
grant select on table public.factory_directory_public to anon, authenticated;

commit;
