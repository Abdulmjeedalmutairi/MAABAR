-- Decision #4: decouple product visibility from verification.
-- A supplier's COMPLETE (non-draft) product is visible to buyers from day one;
-- verification now gates ONLY payout. RLS products_select already keys on is_active
-- alone, and supplier_public_profiles already gates on "has >=1 active product"
-- (not on verified status) — so only the is_active gate itself changes.

-- 1) Release existing held-back products: publish complete (non-draft) products of
--    working-but-not-yet-verified suppliers that were staged is_active=false.
update public.products p
   set is_active = true
  from public.profiles pr
 where p.supplier_id = pr.id
   and lower(coalesce(pr.role,'')) = 'supplier'
   and lower(coalesce(pr.status,'')) not in ('verified','active','approved','rejected','inactive')
   and coalesce(p.is_draft, false) = false
   and coalesce(p.is_active, false) = false;

-- 2) Retire the verification->publish trigger. Visibility is now purely completeness
--    (is_draft) + the supplier's manual show/hide toggle.
drop trigger if exists trg_auto_publish_products_on_supplier_verified on public.profiles;
drop function if exists public.auto_publish_products_on_supplier_verified();
