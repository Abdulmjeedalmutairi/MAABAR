-- ============================================================================
-- Direct Purchase: supplier INSERT permission on notifications targeting
-- the buyer of a direct purchase order.
-- ----------------------------------------------------------------------------
-- The dashboard-defined notifications INSERT policy permits suppliers to
-- notify buyers via the offer-holder relationship (RFQ flow). Direct purchase
-- has no `offers` row, so notifications inserted by the supplier (e.g.
-- 'shipped' from submitDirectTracking, 'supplier_confirmed' / 'supplier_rejected'
-- from Step 3) hit RLS denial and silently 403.
--
-- ADDITIVE policy: PostgreSQL OR's together every INSERT policy on the same
-- table, so adding this one cannot weaken any existing branch.
--
-- Allowed action — verified supplier inserts a notification when:
--   • The recipient (notifications.user_id) is the buyer of a request, AND
--   • notifications.ref_id IS that request's id, AND
--   • The supplier owns the product referenced by requests.product_ref.
--
-- The subquery joins requests + products. The supplier has SELECT access to
-- both via the policies in 202604110002 (requests, branch 6) and the existing
-- products RLS — so the EXISTS resolves cleanly without recursion.
-- ============================================================================

drop policy if exists notifications_insert_direct_purchase_supplier on public.notifications;

create policy notifications_insert_direct_purchase_supplier
on public.notifications
for insert
to authenticated
with check (
  public.is_verified_supplier(auth.uid())
  and exists (
    select 1
    from public.requests r
    join public.products p on p.id::text = r.product_ref
    where r.id = notifications.ref_id
      and r.buyer_id = notifications.user_id
      and p.supplier_id = auth.uid()
  )
);
