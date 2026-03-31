alter table public.profiles
  add column if not exists maabar_supplier_id text;

create sequence if not exists public.maabar_supplier_id_seq start 1001;

create or replace function public.generate_maabar_supplier_id()
returns text
language plpgsql
as $$
begin
  return 'MS-' || lpad(nextval('public.maabar_supplier_id_seq')::text, 6, '0');
end;
$$;

create or replace function public.ensure_supplier_maabar_id()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'supplier'
     and coalesce(new.maabar_supplier_id, '') = ''
     and lower(coalesce(new.status, '')) in ('active', 'approved') then
    new.maabar_supplier_id := public.generate_maabar_supplier_id();
  end if;

  return new;
end;
$$;

alter function public.generate_maabar_supplier_id() owner to postgres;
alter function public.ensure_supplier_maabar_id() owner to postgres;

drop trigger if exists trg_profiles_supplier_maabar_id on public.profiles;

create trigger trg_profiles_supplier_maabar_id
before insert or update of status, maabar_supplier_id on public.profiles
for each row
execute function public.ensure_supplier_maabar_id();

create unique index if not exists profiles_maabar_supplier_id_unique
  on public.profiles (maabar_supplier_id)
  where maabar_supplier_id is not null;

update public.profiles
set maabar_supplier_id = public.generate_maabar_supplier_id()
where role = 'supplier'
  and status in ('active', 'approved')
  and coalesce(maabar_supplier_id, '') = '';
