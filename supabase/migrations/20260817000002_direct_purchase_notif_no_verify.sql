-- ============================================================================
-- FIX (Aug 17 2026) — Direct-purchase supplier notification blocked in prod.
-- ----------------------------------------------------------------------------
-- Symptom (reproduced live): a REGISTERED (not-yet-verified) supplier confirms
-- a direct purchase order.
--   • requests UPDATE → 'supplier_confirmed'  SUCCEEDS — its policy already
--     dropped the is_verified_supplier() gate (see 20260814000009).
--   • notifications INSERT ('supplier confirmed — you can pay now') to the
--     buyer FAILS with 42501 (RLS violation), because the notifications INSERT
--     policy in the LIVE DB still carries the is_verified_supplier() gate: the
--     matching `alter policy` from 20260814000009 never took effect on prod.
--
-- Net effect: the buyer is never told to pay, and — paired with the supplier
-- screen having no "awaiting buyer payment" section for status
-- 'supplier_confirmed' — the order appears to vanish after confirmation.
--
-- Decision (see "unified supplier onboarding"): supplier verification gates
-- PAYOUT only, never day-to-day operation. The real authorization here is
-- product ownership + the buyer/ref binding, not verification.
--
-- Recreate the policy from scratch WITHOUT the verification gate so that running
-- this migration ONCE guarantees the correct final state on prod, regardless of
-- how much of 20260814000009 actually landed. Idempotent (drop-if-exists first)
-- and additive: this is the single INSERT policy that lets a supplier notify a
-- buyer for a direct order, and PostgreSQL OR's INSERT policies together, so it
-- cannot weaken any other branch.
--
-- product_ref is uuid (matches the live requests_update_direct_purchase_supplier
-- policy), so the join is `p.id = r.product_ref` with no ::text cast.
-- ============================================================================

drop policy if exists notifications_insert_direct_purchase_supplier on public.notifications;

create policy notifications_insert_direct_purchase_supplier
on public.notifications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.requests r
    join public.products p on p.id = r.product_ref
    where r.id = notifications.ref_id
      and r.buyer_id = notifications.user_id
      and p.supplier_id = auth.uid()
  )
);
