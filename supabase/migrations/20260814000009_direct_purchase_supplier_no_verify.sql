-- FIX — align with the launch decision (see unified supplier onboarding): supplier
-- verification gates ONLY payout, not day-to-day operation. The direct-purchase
-- supplier UPDATE policies still required is_verified_supplier(), so an unverified
-- supplier could receive a direct order but could NOT confirm it (0 rows → PGRST116)
-- or move it to shipping. Drop the verification requirement; product ownership
-- (p.supplier_id = auth.uid()) remains the authorization — only the product's owner
-- can confirm/ship their own order.
begin;

alter policy requests_update_direct_purchase_supplier on public.requests
  using (
    lower(coalesce(status, '')) = 'pending_supplier_confirmation'
    and exists (select 1 from products p where p.id = requests.product_ref and p.supplier_id = auth.uid())
  )
  with check (
    lower(coalesce(status, '')) = any (array['supplier_confirmed'::text, 'supplier_rejected'::text])
    and exists (select 1 from products p where p.id = requests.product_ref and p.supplier_id = auth.uid())
  );

alter policy requests_update_direct_purchase_shipping on public.requests
  using (
    lower(coalesce(status, '')) = 'paid'
    and exists (select 1 from products p where p.id = requests.product_ref and p.supplier_id = auth.uid())
  )
  with check (
    lower(coalesce(status, '')) = 'shipping'
    and exists (select 1 from products p where p.id = requests.product_ref and p.supplier_id = auth.uid())
  );

-- Same fix on the confirm-notification the supplier writes to the buyer: it was
-- gated on is_verified_supplier() too, so an unverified supplier's confirm couldn't
-- notify the buyer. Product ownership + the buyer/ref binding stay the authorization.
alter policy notifications_insert_direct_purchase_supplier on public.notifications
  with check (
    exists (
      select 1 from requests r join products p on p.id = r.product_ref
      where r.id = notifications.ref_id
        and r.buyer_id = notifications.user_id
        and p.supplier_id = auth.uid()
    )
  );

commit;
