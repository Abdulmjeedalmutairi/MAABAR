-- Fix: restore supplier visibility of requests they hold an offer on,
-- without causing infinite recursion.
--
-- Root cause of recursion:
--   requests RLS → subquery on offers
--   → Postgres evaluates offers RLS (UPDATE policy references requests)
--   → requests RLS again → loop
--
-- Solution: wrap the offers lookup in a SECURITY DEFINER function.
-- It runs as the function owner (superuser), bypasses RLS on offers,
-- and breaks the cycle. The function itself only reads offers by
-- request_id + supplier_id — it never touches requests.

create or replace function public.supplier_has_offer_on_request(p_request_id uuid, p_supplier_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.offers o
    where o.request_id = p_request_id
      and o.supplier_id = p_supplier_id
  );
$$;

drop policy if exists requests_select_visible_to_verified_suppliers on public.requests;

create policy requests_select_visible_to_verified_suppliers
on public.requests
for select
to authenticated
using (
  -- admins see everything
  public.is_admin_user()

  -- buyers see their own requests
  or buyer_id = auth.uid()

  -- verified suppliers see open/offers_received direct requests
  or (
    public.is_verified_supplier(auth.uid())
    and lower(coalesce(sourcing_mode, 'direct')) = 'direct'
    and lower(coalesce(status, '')) in ('open', 'offers_received')
  )

  -- verified suppliers see any request where they hold an offer
  -- (closed, supplier_confirmed, paid, shipping, etc.)
  -- Uses a security definer function to avoid RLS recursion on offers.
  or (
    public.is_verified_supplier(auth.uid())
    and public.supplier_has_offer_on_request(requests.id, auth.uid())
  )

  -- managed flow: supplier matched to the request
  or exists (
    select 1
    from public.managed_supplier_matches msm
    where msm.request_id = requests.id
      and msm.supplier_id = auth.uid()
  )
);
