drop policy if exists requests_select_visible_to_verified_suppliers on public.requests;

create policy requests_select_visible_to_verified_suppliers
on public.requests
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles admin_profile
    where admin_profile.id = auth.uid()
      and lower(coalesce(admin_profile.role, '')) = 'admin'
  )
  or buyer_id = auth.uid()
  or (
    exists (
      select 1
      from public.profiles supplier_profile
      where supplier_profile.id = auth.uid()
        and lower(coalesce(supplier_profile.role, '')) = 'supplier'
        and lower(coalesce(supplier_profile.status, '')) = 'verified'
        and nullif(trim(coalesce(supplier_profile.maabar_supplier_id, '')), '') is not null
    )
    and lower(coalesce(status, '')) in ('open', 'offers_received')
  )
);
