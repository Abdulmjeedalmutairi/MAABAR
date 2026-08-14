-- C9 — Let REGISTERED (not just verified) suppliers see requests.
--
-- Verification now gates only PAYOUT, yet the requests SELECT policy still hid
-- open requests from anyone who isn't is_verified_supplier — so an unverified
-- supplier could submit offers + chat but had an EMPTY requests feed and nothing
-- to bid on. This relaxes the three supplier clauses to an "operational" supplier
-- (role=supplier, status not rejected/inactive), matching the offers/messaging
-- relaxations. Buyers + admins + managed-match clauses are unchanged.
begin;

-- Registered, non-suspended supplier. Mirrors is_verified_supplier but does NOT
-- require status='verified' (verification is a payout gate, not an access gate).
create or replace function public.is_operational_supplier(target_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = coalesce(target_user_id, auth.uid())
      and lower(coalesce(p.role, '')) = 'supplier'
      and lower(coalesce(p.status, '')) not in ('rejected', 'inactive')
  );
$$;

drop policy if exists requests_select_visible_to_verified_suppliers on public.requests;

create policy requests_select_visible_to_verified_suppliers
on public.requests
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()

  -- operational (registered) suppliers see open/offers_received direct requests
  or (
    public.is_operational_supplier(auth.uid())
    and lower(coalesce(sourcing_mode, 'direct')) = 'direct'
    and lower(coalesce(status, '')) in ('open', 'offers_received')
  )

  -- any request where they hold an offer (definer fn avoids RLS recursion)
  or (
    public.is_operational_supplier(auth.uid())
    and public.supplier_has_offer_on_request(requests.id, auth.uid())
  )

  -- managed flow: supplier matched to the request
  or exists (
    select 1
    from public.managed_supplier_matches msm
    where msm.request_id = requests.id
      and msm.supplier_id = auth.uid()
  )

  -- direct purchase: supplier sees the lifecycle of orders on a product they own
  or (
    public.is_operational_supplier(auth.uid())
    and lower(coalesce(status, '')) in (
      'pending_supplier_confirmation', 'supplier_confirmed', 'supplier_rejected',
      'paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'
    )
    and exists (
      select 1 from public.products p
      where p.id = requests.product_ref          -- product_ref is uuid (matches live policy)
        and p.supplier_id = auth.uid()
    )
  )
);

commit;
