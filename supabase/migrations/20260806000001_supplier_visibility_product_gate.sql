-- Fix the supplier visibility leak: pending/empty/test suppliers were exposed to
-- buyers because 20260726000002 relaxed supplier_public_profiles to merely
-- status NOT IN (rejected, inactive) — which shows accounts with no live catalog.
--
-- We KEEP the intent of that broadening (visibility is NOT gated on digital
-- verification/documents — that only drives badge/ranking, and soon only gates
-- payout). We only add a "is this profile actually presentable?" gate: the
-- supplier must have at least one LIVE product. That is the minimum bar for a
-- non-empty, non-placeholder profile, and it hides empty/test accounts without
-- re-introducing the verification requirement.
--
-- Column list is byte-for-byte the current definition (20260726000002) so no
-- consumer's .select() breaks; only the WHERE gains the EXISTS clause.
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
  p.company_name_latin
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
