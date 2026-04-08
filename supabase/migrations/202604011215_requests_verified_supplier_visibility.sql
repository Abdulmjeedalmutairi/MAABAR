do $$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'requests'
      and lower(coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%active%'
  loop
    execute format('drop policy if exists %I on public.requests', policy_row.policyname);
  end loop;
end
$$;

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
      lower(coalesce(status, '')) = 'open'
      or exists (
        select 1
        from public.offers o
        where o.request_id = requests.id
          and o.supplier_id = auth.uid()
      )
    )
  )
);
