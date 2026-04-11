-- The managed_sourcing_mvp migration (202604012345) overwrote
-- requests_select_visible_to_verified_suppliers and removed the clause
-- that lets a supplier read a request where they hold an offer.
-- Without it, once a buyer accepts (status → 'closed') the supplier's
-- joined request row comes back null, breaking the post-acceptance flow.
-- This migration restores that access.

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

  -- verified suppliers can see any request where they hold an offer
  -- (covers closed, supplier_confirmed, paid, shipping, etc.)
  or (
    public.is_verified_supplier(auth.uid())
    and exists (
      select 1
      from public.offers o
      where o.request_id = requests.id
        and o.supplier_id = auth.uid()
    )
  )

  -- managed flow: supplier matched to the request
  or exists (
    select 1
    from public.managed_supplier_matches msm
    where msm.request_id = requests.id
      and msm.supplier_id = auth.uid()
  )
);
