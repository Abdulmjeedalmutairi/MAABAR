-- Chat-agreement invoices — a supplier issues an invoice to a trader after they
-- agree in chat; the trader pays it; on payment a direct order (requests row) is
-- created and shows in "My Direct Purchases". The invoice is the START of the deal
-- (not documentation of an existing paid order).
--
-- Reuses order_invoices: request_id becomes NULLable (set on payment when the order
-- is created), and the invoice carries the product + quantity so the order can be
-- created. issue_chat_invoice lets the supplier issue directly (already 'issued'),
-- authorized because they own the product. The order + payment are created by the
-- telr-verify Edge Function on successful payment (see its invoiceId path).
begin;

-- request_id is now optional (a chat invoice has no order until it is paid).
alter table public.order_invoices alter column request_id drop not null;
alter table public.order_invoices add column if not exists product_ref uuid references public.products(id);
alter table public.order_invoices add column if not exists quantity numeric;

-- Standalone invoice numbers (M-INV-#####) for chat invoices that have no request_ref.
create sequence if not exists public.chat_invoice_seq start 10000;

-- Supplier issues a chat invoice to a trader for one of their products.
create or replace function public.issue_chat_invoice(
  p_buyer_id    uuid,
  p_product_ref uuid,
  p_quantity    numeric,
  p_unit_price  numeric,
  p_incoterms   text default null,
  p_port        text default null,
  p_hs_code     text default null,
  p_notes       text default null,
  p_currency    text default 'SAR'
) returns public.order_invoices
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_supplier uuid := auth.uid();
  v_product  public.products;
  v_qty      numeric := greatest(coalesce(p_quantity, 1), 1);
  v_unit     numeric := greatest(coalesce(p_unit_price, 0), 0);
  v_subtotal numeric;
  v_fee      numeric;
  v_row      public.order_invoices;
  v_name     text;
begin
  if v_supplier is null then raise exception 'Authentication required.'; end if;

  select * into v_product from public.products where id = p_product_ref;
  if v_product.id is null then raise exception 'Product not found.'; end if;
  if v_product.supplier_id <> v_supplier then
    raise exception 'You can only invoice your own products.';
  end if;
  if p_buyer_id is null then raise exception 'A buyer is required.'; end if;

  v_subtotal := round(v_qty * v_unit, 2);
  v_fee      := round(v_subtotal * 5 / 100.0, 2);
  v_name     := coalesce(nullif(v_product.name_ar, ''), v_product.name_en, v_product.name_zh, 'Product');

  insert into public.order_invoices
    (request_id, supplier_id, buyer_id, invoice_number, product_ref, quantity, line_items,
     incoterms, port_of_loading, hs_code, notes, currency,
     goods_subtotal, maabar_fee_pct, maabar_fee_amount, total, status, issued_at, updated_at)
  values
    (null, v_supplier, p_buyer_id, 'M-INV-' || nextval('public.chat_invoice_seq'),
     p_product_ref, v_qty,
     jsonb_build_array(jsonb_build_object('desc', v_name, 'qty', v_qty, 'unit_price', v_unit, 'amount', v_subtotal)),
     p_incoterms, p_port, p_hs_code, p_notes, coalesce(p_currency, 'SAR'),
     v_subtotal, 5, v_fee, v_subtotal + v_fee, 'issued', now(), now())
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.issue_chat_invoice(uuid, uuid, numeric, numeric, text, text, text, text, text) to authenticated;

-- Buyers must also be able to read a chat invoice ISSUED to them before any order
-- exists (the existing select policy already allows buyer_id = auth.uid() + issued).

commit;
