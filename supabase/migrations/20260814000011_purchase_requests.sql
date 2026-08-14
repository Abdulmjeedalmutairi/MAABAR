-- Purchase-request flow: the buyer fills a structured form on a product, it lands
-- in the chat as a [request:ID] card, the supplier reviews and issues an invoice
-- (pre-filled from the request) — replacing the instant tiered-price direct order.
begin;

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid not null references public.profiles(id) on delete cascade,
  product_ref uuid not null references public.products(id) on delete cascade,
  quantity numeric,
  variants jsonb not null default '[]'::jsonb,   -- [{label, qty, attrs:[{k,v,hex}]}]
  details  jsonb not null default '{}'::jsonb,   -- {target_price,target_currency,incoterms,destination,deadline,customization,packaging,notes,attachments[]}
  status text not null default 'pending' check (status in ('pending','quoted','declined','cancelled')),
  invoice_id uuid references public.order_invoices(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists purchase_requests_supplier_idx on public.purchase_requests(supplier_id, status);
create index if not exists purchase_requests_buyer_idx on public.purchase_requests(buyer_id);

alter table public.purchase_requests enable row level security;
drop policy if exists purchase_requests_select on public.purchase_requests;
create policy purchase_requests_select on public.purchase_requests
  for select using (buyer_id = auth.uid() or supplier_id = auth.uid() or public.is_admin_user());
-- All writes go through the SECURITY DEFINER RPCs below (no direct write policy).

-- Buyer creates a request for a product; the supplier is the product's owner.
create or replace function public.create_purchase_request(
  p_product_ref uuid, p_quantity numeric default null,
  p_variants jsonb default '[]'::jsonb, p_details jsonb default '{}'::jsonb)
returns public.purchase_requests
language plpgsql security definer set search_path to 'public'
as $$
declare v_buyer uuid := auth.uid(); v_prod public.products; v_row public.purchase_requests;
begin
  if v_buyer is null then raise exception 'Authentication required.'; end if;
  select * into v_prod from public.products where id = p_product_ref;
  if v_prod.id is null then raise exception 'Product not found.'; end if;
  if v_prod.supplier_id is null then raise exception 'This product has no supplier.'; end if;
  if v_prod.supplier_id = v_buyer then raise exception 'You cannot request your own product.'; end if;
  insert into public.purchase_requests (buyer_id, supplier_id, product_ref, quantity, variants, details)
  values (v_buyer, v_prod.supplier_id, p_product_ref, p_quantity,
          coalesce(p_variants, '[]'::jsonb), coalesce(p_details, '{}'::jsonb))
  returning * into v_row;
  return v_row;
end; $$;

-- Supplier declines a pending request.
create or replace function public.decline_purchase_request(p_id uuid)
returns void language plpgsql security definer set search_path to 'public'
as $$
declare v_sup uuid := auth.uid();
begin
  update public.purchase_requests set status = 'declined', updated_at = now()
  where id = p_id and supplier_id = v_sup and status = 'pending';
  if not found then raise exception 'Request not found or not yours.'; end if;
end; $$;

grant execute on function public.create_purchase_request(uuid,numeric,jsonb,jsonb) to authenticated;
grant execute on function public.decline_purchase_request(uuid) to authenticated;

-- Extend the chat invoice: accept variant line_items + a specs panel + a linked
-- purchase request (which it flips to 'quoted'). Backward-compatible — the old
-- 9-arg call still works via the new defaults.
drop function if exists public.issue_chat_invoice(uuid,uuid,numeric,numeric,text,text,text,text,text);
create or replace function public.issue_chat_invoice(
  p_buyer_id uuid, p_product_ref uuid, p_quantity numeric, p_unit_price numeric,
  p_incoterms text default null, p_port text default null, p_hs_code text default null,
  p_notes text default null, p_currency text default 'SAR',
  p_line_items jsonb default null, p_specs jsonb default null, p_request_id uuid default null)
returns public.order_invoices
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_supplier uuid := auth.uid();
  v_product  public.products;
  v_qty      numeric := greatest(coalesce(p_quantity, 1), 1);
  v_unit     numeric := greatest(coalesce(p_unit_price, 0), 0);
  v_items    jsonb;
  v_subtotal numeric;
  v_fee      numeric;
  v_row      public.order_invoices;
  v_name     text;
begin
  if v_supplier is null then raise exception 'Authentication required.'; end if;
  select * into v_product from public.products where id = p_product_ref;
  if v_product.id is null then raise exception 'Product not found.'; end if;
  if v_product.supplier_id <> v_supplier then raise exception 'You can only invoice your own products.'; end if;
  if p_buyer_id is null then raise exception 'A buyer is required.'; end if;

  v_name := coalesce(nullif(v_product.name_ar, ''), v_product.name_en, v_product.name_zh, 'Product');

  if p_line_items is not null and jsonb_typeof(p_line_items) = 'array' and jsonb_array_length(p_line_items) > 0 then
    v_items := p_line_items;
    select round(coalesce(sum(coalesce((it->>'qty')::numeric, 0) * coalesce((it->>'unit_price')::numeric, 0)), 0), 2)
      into v_subtotal from jsonb_array_elements(v_items) it;
    select coalesce(sum(coalesce((it->>'qty')::numeric, 0)), v_qty)
      into v_qty from jsonb_array_elements(v_items) it;
  else
    v_subtotal := round(v_qty * v_unit, 2);
    v_items := jsonb_build_array(jsonb_build_object('desc', v_name, 'qty', v_qty, 'unit_price', v_unit, 'amount', v_subtotal));
  end if;
  v_fee := round(v_subtotal * 5 / 100.0, 2);

  insert into public.order_invoices
    (request_id, supplier_id, buyer_id, invoice_number, product_ref, quantity, line_items, specs,
     incoterms, port_of_loading, hs_code, notes, currency,
     goods_subtotal, maabar_fee_pct, maabar_fee_amount, total, status, issued_at, updated_at)
  values
    (null, v_supplier, p_buyer_id, 'M-INV-' || nextval('public.chat_invoice_seq'),
     p_product_ref, v_qty, v_items, p_specs,
     p_incoterms, p_port, p_hs_code, p_notes, coalesce(p_currency, 'SAR'),
     v_subtotal, 5, v_fee, v_subtotal + v_fee, 'issued', now(), now())
  returning * into v_row;

  if p_request_id is not null then
    update public.purchase_requests set invoice_id = v_row.id, status = 'quoted', updated_at = now()
    where id = p_request_id and supplier_id = v_supplier;
  end if;

  return v_row;
end; $$;

grant execute on function public.issue_chat_invoice(uuid,uuid,numeric,numeric,text,text,text,text,text,jsonb,jsonb,uuid) to authenticated;

commit;
