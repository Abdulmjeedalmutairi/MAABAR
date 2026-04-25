-- ============================================================================
-- Direct Purchase: supplier UPDATE permission for confirm/reject transition.
-- ----------------------------------------------------------------------------
-- The Direct Purchase flow inserts a `requests` row with
-- status='pending_supplier_confirmation' and no `offers` row. The existing
-- UPDATE permission set on `requests` (managed via the dashboard for the RFQ
-- flow) grants suppliers UPDATE rights via offer ownership — which doesn't
-- apply here.
--
-- This policy is ADDITIVE: PostgreSQL OR's together every UPDATE policy on
-- the same table, so adding this one cannot weaken any existing branch. It
-- ONLY grants UPDATE in the narrow case below; everything else is unaffected.
--
-- Allowed action:
--   • Verified supplier flips a row from 'pending_supplier_confirmation'
--     to 'supplier_confirmed' OR 'supplier_rejected'
--   • The supplier must own the product referenced by requests.product_ref
--     both before and after the update (paranoia — prevents reassigning the
--     product_ref to someone else's product as a side effect).
--
-- Out of scope (future steps will need their own UPDATE policies):
--   • paid → ready_to_ship / shipping (Step 5 — supplier adds tracking)
--   • shipping → arrived (Step 6 — buyer marks shipment received)
--   • arrived → delivered (Step 6 — buyer confirms delivery)
-- ============================================================================

drop policy if exists requests_update_direct_purchase_supplier on public.requests;

create policy requests_update_direct_purchase_supplier
on public.requests
for update
to authenticated
using (
  public.is_verified_supplier(auth.uid())
  and lower(coalesce(status, '')) = 'pending_supplier_confirmation'
  and exists (
    select 1
    from public.products p
    where p.id::text = requests.product_ref
      and p.supplier_id = auth.uid()
  )
)
with check (
  public.is_verified_supplier(auth.uid())
  and lower(coalesce(status, '')) in ('supplier_confirmed', 'supplier_rejected')
  and exists (
    select 1
    from public.products p
    where p.id::text = requests.product_ref
      and p.supplier_id = auth.uid()
  )
);
