-- Admin presents the single curated managed offer. A managed offer has no external
-- supplier (the factory is anonymized/internal), so supplier_id becomes nullable and
-- the offer is created by an admin RPC (not the supplier-gated issue_chat_invoice).
-- It reuses order_invoices (+ factory_profile) so the trader pays the deposit via the
-- same premium-invoice + Telr path; issuing it flips managed_status to 'offer_ready'.
begin;

alter table public.order_invoices alter column supplier_id drop not null;

create or replace function public.create_managed_offer(
  p_request_id uuid, p_line_items jsonb, p_currency text default 'USD',
  p_factory_profile jsonb default null, p_notes text default null)
returns public.order_invoices
language plpgsql security definer set search_path to 'public'
as $$
declare v_req public.requests; v_subtotal numeric; v_fee numeric; v_qty numeric; v_row public.order_invoices;
begin
  if not public.is_admin_user() then raise exception 'Admins only.'; end if;
  select * into v_req from public.requests where id = p_request_id;
  if v_req.id is null then raise exception 'Request not found.'; end if;

  select round(coalesce(sum(coalesce((it->>'qty')::numeric,0) * coalesce((it->>'unit_price')::numeric,0)),0),2),
         coalesce(sum(coalesce((it->>'qty')::numeric,0)),0)
    into v_subtotal, v_qty
    from jsonb_array_elements(coalesce(p_line_items,'[]'::jsonb)) it;
  v_fee := round(v_subtotal * 5 / 100.0, 2);

  delete from public.order_invoices where request_id = p_request_id and status <> 'paid';

  insert into public.order_invoices
    (request_id, supplier_id, buyer_id, invoice_number, product_ref, quantity, line_items,
     currency, goods_subtotal, maabar_fee_pct, maabar_fee_amount, total, status, factory_profile, notes, issued_at, updated_at)
  values
    (p_request_id, null, v_req.buyer_id, 'M-INV-'||nextval('public.chat_invoice_seq'), null, v_qty,
     coalesce(p_line_items,'[]'::jsonb), coalesce(p_currency,'USD'),
     v_subtotal, 5, v_fee, v_subtotal + v_fee, 'issued', p_factory_profile, p_notes, now(), now())
  returning * into v_row;

  update public.requests set managed_status = 'offer_ready' where id = p_request_id;
  return v_row;
end $$;

grant execute on function public.create_managed_offer(uuid,jsonb,text,jsonb,text) to authenticated;

commit;
