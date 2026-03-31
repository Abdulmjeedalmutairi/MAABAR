create or replace function public.ensure_supplier_maabar_id()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'supplier'
     and coalesce(new.maabar_supplier_id, '') = ''
     and lower(coalesce(new.status, '')) in ('verified', 'active', 'approved') then
    new.maabar_supplier_id := public.generate_maabar_supplier_id();
  end if;

  return new;
end;
$$;

alter function public.ensure_supplier_maabar_id() owner to postgres;

update public.profiles p
set status = case
  when lower(coalesce(p.status, '')) in ('verified', 'active', 'approved') then 'verified'
  when lower(coalesce(p.status, '')) in ('verification_under_review', 'pending', 'under_review', 'submitted', 'review') then
    case
      when nullif(trim(coalesce(p.reg_number, '')), '') is not null
       and p.years_experience is not null
       and nullif(trim(coalesce(p.license_photo, '')), '') is not null
       and nullif(trim(coalesce(p.factory_photo, '')), '') is not null
      then 'verification_under_review'
      when exists (
        select 1
        from auth.users u
        where u.id = p.id
          and coalesce(u.email_confirmed_at, u.confirmed_at) is not null
      ) then 'verification_required'
      else 'registered'
    end
  when lower(coalesce(p.status, '')) in ('verification_required') then
    case
      when exists (
        select 1
        from auth.users u
        where u.id = p.id
          and coalesce(u.email_confirmed_at, u.confirmed_at) is not null
      ) then 'verification_required'
      else 'registered'
    end
  when lower(coalesce(p.status, '')) in ('registered', 'draft', 'incomplete', '') then
    case
      when exists (
        select 1
        from auth.users u
        where u.id = p.id
          and coalesce(u.email_confirmed_at, u.confirmed_at) is not null
      ) then 'verification_required'
      else 'registered'
    end
  else p.status
end
where p.role = 'supplier';

update public.profiles
set maabar_supplier_id = public.generate_maabar_supplier_id()
where role = 'supplier'
  and status = 'verified'
  and coalesce(maabar_supplier_id, '') = '';
