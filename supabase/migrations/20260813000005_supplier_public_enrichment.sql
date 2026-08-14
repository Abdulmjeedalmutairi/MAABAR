-- #7 — Surface buyer-visible profile enrichment on the public supplier view.
--
-- The mobile SupplierProfileScreen tried to read cover_photo_url / num_employees
-- (plus some non-existent columns) straight from base `profiles`. RLS blocks a
-- buyer from reading another user's profiles row, so that fetch always returned
-- null and the profile header lost its cover image + company size for every
-- buyer. The web SupplierProfile fixed this in 20260613000001 by reading the
-- view only; this brings the two profile-level columns the view was missing so
-- the mobile screen can do the same.
--
-- Only cover_photo_url and num_employees are added (both real columns on
-- profiles). The screen's other "supplier-level" fields — company_video_url,
-- lead_time_*, port_of_loading, sample_available — are NOT profile columns
-- (they live on products, or do not exist) and were always null; they stay out.
--
-- Column list is otherwise byte-for-byte 20260806000001 (the current live def),
-- with the two new columns appended at the END so CREATE OR REPLACE is legal and
-- no existing consumer's positional/`select('col')` read breaks.
begin;

create or replace view public.supplier_public_profiles as
select
  p.id,
  p.full_name,
  p.role,
  p.company_name,
  p.avatar_url,
  p.status,
  p.rating,
  p.reviews_count,
  p.city,
  p.country,
  p.trade_link,
  p.wechat,
  p.whatsapp,
  p.factory_images,
  p.years_experience,
  p.maabar_supplier_id,
  p.min_order_value,
  p.speciality,
  p.company_website,
  p.company_description,
  p.bio_ar,
  p.bio_en,
  p.bio_zh,
  p.business_type,
  p.year_established,
  p.customization_support,
  p.company_address,
  p.languages,
  p.export_markets,
  p.export_years,
  p.certifications,
  null::int as deals_completed,
  p.completion_rate,
  (
    select count(*)::int
    from public.products pr
    where pr.supplier_id = p.id
      and coalesce(pr.is_active, false) = true
  ) as product_count,
  p.company_name_latin,
  -- New buyer-visible enrichment (appended last):
  p.cover_photo_url,
  p.num_employees
from public.profiles p
where lower(coalesce(p.role, '')) = 'supplier'
  and lower(coalesce(p.status, '')) not in ('rejected', 'inactive')
  and exists (
    select 1 from public.products pr
    where pr.supplier_id = p.id
      and coalesce(pr.is_active, false) = true
  );

alter view public.supplier_public_profiles set (security_invoker = false);

revoke all on table public.supplier_public_profiles from public;
grant select on table public.supplier_public_profiles to anon, authenticated;

commit;
