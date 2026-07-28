-- Fix: persist company_name_latin from the maabar-ai company_romanization task.
--
-- Root cause: the edge task wrote profiles.company_name_latin with the service-role
-- client, but trg_profiles_guard_sensitive_fields blocks it — the edge's PostgREST
-- request does not satisfy is_service_role() (request.jwt.claim.role is empty for it)
-- and auth.uid() is null (no owner match), so the guard's owner-only check raises
-- 'You can only update your own profile.', which the edge swallows → column stays null.
--
-- Follows the sanctioned bypass pattern already used by submit_supplier_verification
-- (maabar.allow_profile_status_update) and recalc_supplier_rating (app.allow_rating_recalc):
-- a dedicated SECURITY DEFINER RPC sets a transaction-local GUC that the guard honors for
-- this ONE field only. The guard's general logic is unchanged — every protected-field check
-- (role, maabar_supplier_id, trust_score, status, rating, reviews_count) still runs; only the
-- owner-only check gains a third narrowly-scoped exception, exactly like rating_recalc.
begin;

-- 1) Extend the guard: honor maabar.allow_company_name_latin_update in the owner-only
--    check ONLY. Byte-for-byte identical to 20260619000001 otherwise.
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rating_recalc boolean := coalesce(current_setting('app.allow_rating_recalc', true), '') = 'on';
  allow_verification_submission_status_update boolean :=
    current_setting('maabar.allow_profile_status_update', true) = 'submit_supplier_verification';
  allow_company_name_latin_update boolean :=
    current_setting('maabar.allow_company_name_latin_update', true) = 'set_company_name_latin';
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  -- Owner-only, EXCEPT the trusted recalc path (which updates another user's row)
  -- and the scoped company_name_latin romanization write (set_company_name_latin).
  if auth.uid() is distinct from old.id and not rating_recalc and not allow_company_name_latin_update then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role
     or new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or (to_jsonb(new) -> 'trust_score') is distinct from (to_jsonb(old) -> 'trust_score') then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  -- status is protected, EXCEPT the guarded transition performed by
  -- submit_supplier_verification() (restored from v2; v3 dropped this allow-path).
  if new.status is distinct from old.status then
    if not allow_verification_submission_status_update
       or lower(coalesce(new.status, '')) <> 'verification_under_review'
       or lower(coalesce(old.status, '')) in ('verification_under_review', 'verified') then
      raise exception 'Protected profile fields cannot be updated directly.';
    end if;
  end if;

  if not rating_recalc
     and (new.rating is distinct from old.rating
          or new.reviews_count is distinct from old.reviews_count) then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  return new;
end;
$$;

-- 2) Dedicated RPC: set company_name_latin under the sanctioned GUC bypass.
--    Idempotent (never overwrites), supplier-scoped, service_role-only.
create or replace function public.set_company_name_latin(supplier_id uuid, latin_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if supplier_id is null or nullif(trim(coalesce(latin_name, '')), '') is null then
    return;
  end if;

  perform set_config('maabar.allow_company_name_latin_update', 'set_company_name_latin', true);

  update public.profiles
     set company_name_latin = latin_name
   where id = supplier_id
     and lower(coalesce(role, '')) = 'supplier'
     and company_name_latin is null;   -- idempotent: never overwrite an existing value

  perform set_config('maabar.allow_company_name_latin_update', '', true);
end;
$$;

alter function public.set_company_name_latin(uuid, text) owner to postgres;
revoke all on function public.set_company_name_latin(uuid, text) from public;
grant execute on function public.set_company_name_latin(uuid, text) to service_role;

commit;
