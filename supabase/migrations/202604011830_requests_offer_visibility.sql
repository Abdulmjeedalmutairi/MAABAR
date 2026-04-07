drop policy if exists requests_select_visible_to_verified_suppliers on public.requests;

create policy requests_select_visible_to_verified_suppliers
on public.requests
for select
to authenticated
using (
  public.is_admin_user()
  or buyer_id = auth.uid()
  or (
    public.is_verified_supplier(auth.uid())
    and (
      lower(coalesce(status, '')) in ('open', 'offers_received')
      or exists (
        select 1
        from public.offers o
        where o.request_id = requests.id
          and o.supplier_id = auth.uid()
      )
    )
  )
);
