-- Factory edit audit — record WHO created / last-edited each factory, and treat
-- editing a factory's PRODUCTS as editing the factory, so the admin console can
-- show "last edited <date> by <employee>". Enables delegating catalog work to
-- staff accounts with clear attribution of every change.

-- 1) attribution column ------------------------------------------------------
alter table public.factory_directory
  add column if not exists updated_by uuid references public.profiles(id) on delete set null;

-- 2) best-effort backfill from each factory's catalog uploader — runs BEFORE the
--    stamp trigger exists so existing updated_at values are left untouched.
update public.factory_directory d
set updated_by = i.uploaded_by
from (
  select distinct on (factory_id) factory_id, uploaded_by
  from public.factory_catalog_imports
  where factory_id is not null and uploaded_by is not null
  order by factory_id, created_at desc
) i
where d.id = i.factory_id and d.updated_by is null;

-- 3) stamp updated_at + updated_by on every direct insert/update of a factory.
--    auth.uid() (the signed-in admin) always wins → the editor can't be spoofed;
--    on a service-role/backfill write it keeps whatever was explicitly set.
create or replace function public.factory_stamp_updated_by()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  else
    new.updated_by := coalesce(auth.uid(), new.updated_by, old.updated_by);
  end if;
  return new;
end $$;

drop trigger if exists trg_factory_stamp_updated_by on public.factory_directory;
create trigger trg_factory_stamp_updated_by
  before insert or update on public.factory_directory
  for each row execute function public.factory_stamp_updated_by();

-- 4) product edits bubble up to the parent factory. Statement-level with
--    transition tables → ONE parent touch even on a bulk approve of hundreds;
--    the touch re-fires (3), recording who (auth.uid()) did it.
create or replace function public.factory_touch_from_products_new()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.factory_directory d set updated_at = now()
  where d.id in (select distinct factory_id from newrows where factory_id is not null);
  return null;
end $$;

create or replace function public.factory_touch_from_products_old()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.factory_directory d set updated_at = now()
  where d.id in (select distinct factory_id from oldrows where factory_id is not null);
  return null;
end $$;

drop trigger if exists trg_factory_touch_products_ins on public.factory_products;
create trigger trg_factory_touch_products_ins
  after insert on public.factory_products
  referencing new table as newrows
  for each statement execute function public.factory_touch_from_products_new();

drop trigger if exists trg_factory_touch_products_upd on public.factory_products;
create trigger trg_factory_touch_products_upd
  after update on public.factory_products
  referencing new table as newrows
  for each statement execute function public.factory_touch_from_products_new();

drop trigger if exists trg_factory_touch_products_del on public.factory_products;
create trigger trg_factory_touch_products_del
  after delete on public.factory_products
  referencing old table as oldrows
  for each statement execute function public.factory_touch_from_products_old();
