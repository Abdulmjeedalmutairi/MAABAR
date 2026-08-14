-- FIX — order_invoices.status only allowed ('draft','issued'), but telr-verify
-- marks a chat invoice 'paid' once payment is recorded (and telr-create relies on
-- status='paid' to block a double charge). Add 'paid' (and 'cancelled' for a
-- future void path) to the allowed set.
begin;

alter table public.order_invoices drop constraint if exists order_invoices_status_check;
alter table public.order_invoices add constraint order_invoices_status_check
  check (status = any (array['draft'::text, 'issued'::text, 'paid'::text, 'cancelled'::text]));

commit;
