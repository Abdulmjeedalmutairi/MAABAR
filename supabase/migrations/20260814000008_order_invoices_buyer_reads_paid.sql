-- FIX — the buyer's SELECT on order_invoices was gated to status='issued' only, so
-- the moment telr-verify marks a chat invoice 'paid' the buyer LOSES read access:
-- their own paid invoice (and the in-chat invoice card) vanishes and the invoice
-- modal shows "not issued yet". Let the buyer read their invoice in any non-draft
-- state (issued / paid / cancelled) — a draft is still the supplier's to edit.
begin;

alter policy order_invoices_select on public.order_invoices
  using (
    is_admin_user()
    or (supplier_id = auth.uid())
    or (buyer_id = auth.uid() and status <> 'draft')
  );

commit;
