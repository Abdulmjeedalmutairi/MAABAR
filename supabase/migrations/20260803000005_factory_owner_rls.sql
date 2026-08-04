-- Once a factory claims its row (linked_supplier_id = auth.uid()), let it read + edit
-- its OWN factory_directory row and factory_products — so profile + products "appear"
-- and are editable the first time it logs in. Additive to the existing admin policies;
-- decoupled from the supplier verified-gate (factories don't go through it).
begin;

-- ── factory_directory: owner read + update (identity/trust columns frozen) ──
drop policy if exists factory_directory_owner_select on public.factory_directory;
create policy factory_directory_owner_select on public.factory_directory
  for select to authenticated using (linked_supplier_id = auth.uid());

drop policy if exists factory_directory_owner_update on public.factory_directory;
create policy factory_directory_owner_update on public.factory_directory
  for update to authenticated
  using (linked_supplier_id = auth.uid())
  with check (linked_supplier_id = auth.uid());

-- Owner may edit descriptive fields + publish (is_active), but NOT ownership/contact/
-- trust columns — those stay admin-only. Admin/service bypass the freeze.
create or replace function public.guard_factory_owner_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin_user() or public.is_service_role() then
    return new;
  end if;
  new.id                 := old.id;
  new.linked_supplier_id := old.linked_supplier_id;   -- can't reassign/steal ownership
  new.email              := old.email;                -- contact used for /f invites — admin-only
  new.is_verified        := old.is_verified;          -- trust signal — admin-only
  new.is_featured        := old.is_featured;          -- editorial — admin-only
  new.sort_order         := old.sort_order;
  new.created_at         := old.created_at;
  new.updated_at         := now();
  return new;
end; $$;
drop trigger if exists trg_guard_factory_owner_update on public.factory_directory;
create trigger trg_guard_factory_owner_update before update on public.factory_directory
  for each row execute function public.guard_factory_owner_update();

-- ── factory_products: owner CRUD on products of a factory they own ──
drop policy if exists factory_products_owner_all on public.factory_products;
create policy factory_products_owner_all on public.factory_products
  for all to authenticated
  using (exists (select 1 from public.factory_directory d
                 where d.id = factory_products.factory_id and d.linked_supplier_id = auth.uid()))
  with check (exists (select 1 from public.factory_directory d
                 where d.id = factory_products.factory_id and d.linked_supplier_id = auth.uid()));

commit;
