create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  allow_verification_submission_status_update boolean :=
    current_setting('maabar.allow_profile_status_update', true) = 'submit_supplier_verification';
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  if auth.uid() is distinct from old.id then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role
     or new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or (to_jsonb(new) -> 'trust_score') is distinct from (to_jsonb(old) -> 'trust_score') then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  if new.status is distinct from old.status then
    if not allow_verification_submission_status_update
       or lower(coalesce(new.status, '')) <> 'verification_under_review'
       or lower(coalesce(old.status, '')) in ('verification_under_review', 'verified') then
      raise exception 'Protected profile fields cannot be updated directly.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.submit_supplier_verification()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_profile public.profiles%rowtype;
  email_is_confirmed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = auth.uid();

  if not found or lower(coalesce(actor_profile.role, '')) <> 'supplier' then
    raise exception 'Only suppliers can submit verification.';
  end if;

  select coalesce(u.email_confirmed_at, u.confirmed_at) is not null
  into email_is_confirmed
  from auth.users u
  where u.id = auth.uid();

  if not coalesce(email_is_confirmed, false) then
    raise exception 'Email confirmation is required before verification submission.';
  end if;

  if nullif(trim(coalesce(actor_profile.company_name, '')), '') is null
     or nullif(trim(coalesce(actor_profile.country, '')), '') is null
     or nullif(trim(coalesce(actor_profile.city, '')), '') is null
     or nullif(trim(coalesce(actor_profile.trade_link, '')), '') is null
     or nullif(trim(coalesce(actor_profile.reg_number, '')), '') is null
     or actor_profile.years_experience is null
     or nullif(trim(coalesce(actor_profile.license_photo, '')), '') is null
     or nullif(trim(coalesce(actor_profile.factory_photo, '')), '') is null then
    raise exception 'Complete the required company and verification fields before submitting.';
  end if;

  if lower(coalesce(actor_profile.status, '')) in ('verified', 'verification_under_review') then
    return actor_profile;
  end if;

  perform set_config('maabar.allow_profile_status_update', 'submit_supplier_verification', true);

  update public.profiles
  set status = 'verification_under_review'
  where id = auth.uid()
  returning * into actor_profile;

  return actor_profile;
end;
$$;
