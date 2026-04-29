-- Belt-and-suspenders DB guard for the C-1 product visibility model.
--
-- Background: the supplier dashboard's addProduct() / updateProduct() paths
-- already force is_active=false at the application layer when the supplier
-- is not yet verified, and the auto_publish_products_on_supplier_verified
-- trigger flips is_active=true when the supplier transitions to verified.
-- This migration adds a BEFORE INSERT/UPDATE trigger on products that
-- enforces the same invariant from the database side: no row inserted or
-- updated by a non-verified supplier may carry is_active=true. Fires on
-- every INSERT or UPDATE so any out-of-band write (direct API call,
-- admin-curated edits, future codepaths) honors the same rule without
-- needing to remember to set is_active=false manually.
--
-- The auto-publish trigger remains the only path that flips is_active to
-- true for a non-verified->verified transition: by the time it fires, the
-- profiles.status row has already been updated to 'verified' inside the
-- same transaction, so this guard reads the new status and lets the
-- flip succeed. No conflict between the two triggers.

begin;

create or replace function public.guard_products_is_active_for_unverified_supplier()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  supplier_status text;
begin
  select lower(coalesce(p.status, ''))
    into supplier_status
    from public.profiles p
   where p.id = new.supplier_id;

  if coalesce(supplier_status, '') not in ('verified', 'active', 'approved') then
    new.is_active := false;
  end if;

  return new;
end;
$$;

comment on function public.guard_products_is_active_for_unverified_supplier()
  is 'BEFORE INSERT/UPDATE guard on products: forces is_active=false unless the joined supplier profile is in a verified state (verified | active | approved). DB-level enforcement of the C-1 visibility model so no out-of-band write can publish a product before the supplier is approved.';

alter function public.guard_products_is_active_for_unverified_supplier() owner to postgres;

drop trigger if exists trg_guard_products_is_active on public.products;
create trigger trg_guard_products_is_active
  before insert or update on public.products
  for each row
  execute function public.guard_products_is_active_for_unverified_supplier();

commit;
