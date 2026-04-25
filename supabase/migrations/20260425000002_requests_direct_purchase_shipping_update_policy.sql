-- ============================================================================
-- Direct Purchase: supplier UPDATE permission for the paid → shipping
-- transition (Step 5 — supplier uploads tracking number).
-- ----------------------------------------------------------------------------
-- ADDITIVE policy: PostgreSQL OR's together every UPDATE policy on the same
-- table, so adding this one cannot weaken any existing branch.
--
-- Allowed action:
--   • Verified supplier flips a row from 'paid' to 'shipping'
--   • The supplier must own the product referenced by requests.product_ref
--     both before and after the update (paranoia — prevents reassigning
--     product_ref to someone else's product as a side effect).
--
-- Out of scope (future):
--   • shipping → arrived (Step 6 — buyer marks shipment received)
--   • arrived → delivered (Step 6 — buyer confirms delivery)
-- ============================================================================

drop policy if exists requests_update_direct_purchase_shipping on public.requests;

create policy requests_update_direct_purchase_shipping
on public.requests
for update
to authenticated
using (
  public.is_verified_supplier(auth.uid())
  and lower(coalesce(status, '')) = 'paid'
  and exists (
    select 1
    from public.products p
    where p.id::text = requests.product_ref
      and p.supplier_id = auth.uid()
  )
)
with check (
  public.is_verified_supplier(auth.uid())
  and lower(coalesce(status, '')) = 'shipping'
  and exists (
    select 1
    from public.products p
    where p.id::text = requests.product_ref
      and p.supplier_id = auth.uid()
  )
);
