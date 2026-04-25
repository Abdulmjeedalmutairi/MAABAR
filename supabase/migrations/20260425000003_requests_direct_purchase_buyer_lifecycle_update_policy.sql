-- ============================================================================
-- Direct Purchase: buyer UPDATE permission for the post-shipment lifecycle.
-- Step 6 — buyer marks the shipment arrived, then confirms delivery to release
-- payout to the supplier.
-- ----------------------------------------------------------------------------
-- ADDITIVE policy: PostgreSQL OR's together every UPDATE policy on the same
-- table, so adding this one cannot weaken any existing branch. The dashboard-
-- defined buyer UPDATE policy that powers RFQ today (buyer_id = auth.uid())
-- already covers this case — this policy is explicit insurance and self-
-- documents the direct-purchase buyer transitions.
--
-- Allowed actions (both must be initiated by the row's buyer):
--   • shipping → arrived   (buyer clicks "Mark as Arrived")
--   • arrived  → delivered (buyer clicks "Confirm Delivery", which also
--                            updates the matching payments.status to
--                            'completed' to release payout)
--
-- Out of scope:
--   • status changes by anyone other than the row's buyer
--   • Pre-shipment transitions (covered by Step 3 / Step 4 / Step 5 policies)
-- ============================================================================

drop policy if exists requests_update_direct_purchase_buyer_lifecycle on public.requests;

create policy requests_update_direct_purchase_buyer_lifecycle
on public.requests
for update
to authenticated
using (
  buyer_id = auth.uid()
  and product_ref is not null
  and lower(coalesce(status, '')) in ('shipping', 'arrived')
)
with check (
  buyer_id = auth.uid()
  and product_ref is not null
  and lower(coalesce(status, '')) in ('arrived', 'delivered')
);
