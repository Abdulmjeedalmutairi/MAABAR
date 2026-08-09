-- Corrective migration.
--
-- 20260810000001 mistakenly re-created guard_profile_sensitive_fields() from an
-- OLD (202604011050) body, reverting every later change and reintroducing a bare
-- `new.trust_score` reference (which throws "record new has no field trust_score"
-- on the current schema — the reason the live guard uses to_jsonb()).
--
-- This restores the guard to its correct latest form (from 20260806000002) and
-- rewrites claim_supplier_role() to reuse the guard's EXISTING supplier-seed
-- escape hatch (maabar.seeding_supplier) instead of a custom GUC — so the guard
-- itself needs no new bypass at all.

-- 1) Restore the guard to its latest definition.
create or replace function public.guard_profile_sensitive_fields()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  rating_recalc boolean := coalesce(current_setting('app.allow_rating_recalc', true), '') = 'on';
  allow_verification_submission_status_update boolean :=
    current_setting('maabar.allow_profile_status_update', true) = 'submit_supplier_verification';
  allow_company_name_latin_update boolean :=
    current_setting('maabar.allow_company_name_latin_update', true) = 'set_company_name_latin';
  allow_supplier_seed boolean :=
    current_setting('maabar.seeding_supplier', true) = new.id::text;
begin
  if tg_op <> 'UPDATE' then return new; end if;
  if public.is_service_role() or public.is_admin_user() then return new; end if;

  if auth.uid() is distinct from old.id and not rating_recalc
     and not allow_company_name_latin_update and not allow_supplier_seed then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role then
    if not (allow_supplier_seed and lower(coalesce(new.role, '')) = 'supplier') then
      raise exception 'Protected profile fields cannot be updated directly.';
    end if;
  end if;

  if new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or (to_jsonb(new) -> 'trust_score') is distinct from (to_jsonb(old) -> 'trust_score') then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  if new.status is distinct from old.status then
    if allow_supplier_seed then
      null;
    elsif not allow_verification_submission_status_update
       or lower(coalesce(new.status, '')) <> 'verification_under_review'
       or lower(coalesce(old.status, '')) in ('verification_under_review', 'verified') then
      raise exception 'Protected profile fields cannot be updated directly.';
    end if;
  end if;

  if not rating_recalc
     and (new.rating is distinct from old.rating or new.reviews_count is distinct from old.reviews_count) then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  return new;
end; $function$;

-- 2) claim_supplier_role reuses the existing supplier-seed escape hatch.
create or replace function public.claim_supplier_role()
returns public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select * into me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profile not found.';
  end if;

  if lower(coalesce(me.role, '')) not in ('', 'buyer', 'supplier') then
    raise exception 'This account cannot be converted to a supplier.';
  end if;

  -- Guard allows role->supplier + the status change while this is set (txn-local).
  perform set_config('maabar.seeding_supplier', auth.uid()::text, true);

  update public.profiles
     set role = 'supplier',
         status = case
                    when status is null or btrim(status) = '' or lower(status) = 'active'
                    then 'registered'
                    else status
                  end
   where id = auth.uid()
   returning * into me;

  return me;
end;
$$;

revoke all on function public.claim_supplier_role() from public, anon;
grant execute on function public.claim_supplier_role() to authenticated;
