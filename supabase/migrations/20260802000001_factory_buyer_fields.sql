-- Buyer-facing factory trust fields — general MOQ note + private-label capability.
--
-- Two more optional signals shown on the factory profile page (/factory/:id),
-- alongside founded_year / export_markets:
--   moq_note      — a general minimum-order statement, e.g. "from 100 pcs"
--   private_label — the factory offers OEM/ODM (private-label) manufacturing
-- Both are additive + public (exposed via factory_directory_public). Populated by
-- the Catalog Import extraction when the catalog states them, or typed by an admin.
begin;

alter table public.factory_directory
  add column if not exists moq_note      text,
  add column if not exists private_label boolean not null default false;

comment on column public.factory_directory.moq_note is
  'General minimum-order statement shown on the profile, e.g. "from 100 pcs". Nullable free text.';
comment on column public.factory_directory.private_label is
  'Factory offers private-label / OEM-ODM manufacturing. Shows a "private label" badge on the profile.';

-- Recreate the public view to expose the two new fields — appended LAST so
-- create-or-replace accepts it (existing columns / order unchanged).
create or replace view public.factory_directory_public as
select
  f.id, f.company_name, f.company_name_latin, f.category,
  f.description_ar, f.description_en, f.description_zh,
  f.city, f.country, f.factory_images, f.sort_order, f.profile_image,
  f.founded_year, f.export_markets, f.is_verified, f.is_featured,
  f.moq_note, f.private_label
from public.factory_directory f
where f.is_active;

alter view public.factory_directory_public set (security_invoker = false);
revoke all on table public.factory_directory_public from public;
grant select on table public.factory_directory_public to anon, authenticated;

commit;
