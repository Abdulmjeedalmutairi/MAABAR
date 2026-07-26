-- Broaden buyer-facing supplier visibility to any non-rejected/non-inactive supplier.
--
-- Product decision: registered suppliers are already vetted offline, so visibility
-- should NOT be gated on digital-document completion. Digital verification now
-- drives ranking/badging (elsewhere), not presence. This relaxes the one view that
-- gates the buyer-facing directory + profile pages. Only the WHERE changes; the
-- column list is byte-for-byte the current definition (20260613000001), so no
-- consumer's .select() breaks.
--
-- Old filter: status in ('verified','approved','active') AND maabar_supplier_id not null.
-- New filter: status not in ('rejected','inactive'). The maabar_supplier_id clause is
-- dropped because every non-rejected/non-inactive supplier now gets an ID at
-- registration (20260726000001), so it is redundant — and keeping it would still
-- exclude the newly-visible registered suppliers.
--
-- Write-gates are unaffected: offers/products/direct-requests gate on
-- is_verified_supplier()/their own RLS, NOT this view, so broadening the directory
-- does not let an unverified supplier transact.
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
  ) as product_count
from public.profiles p
where lower(coalesce(p.role, '')) = 'supplier'
  and lower(coalesce(p.status, '')) not in ('rejected', 'inactive');

alter view public.supplier_public_profiles set (security_invoker = false);

-- Re-assert least-privilege grants (create-or-replace preserves them, but be explicit).
revoke all on table public.supplier_public_profiles from public;
grant select on table public.supplier_public_profiles to anon, authenticated;

commit;
