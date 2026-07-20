-- Make the admin / super_admin boundary real.
--
-- It existed only in the UI: AdminSettings.jsx gates the "assign role" panel behind
-- `isSuperAdmin`, but guard_profile_sensitive_fields() exempted EVERY admin —
-- `if public.is_service_role() or public.is_admin_user() then return new; end if;`
-- and is_admin_user() covers admin AND super_admin. So any plain admin could send a
-- single PATCH to profiles and set their own role to 'super_admin', bypassing the
-- hidden UI entirely. A boundary the interface claims but the database does not
-- enforce is worse than no boundary: it produces false confidence.
--
-- (20260720000002 clamps role at INSERT only — it does not touch UPDATE, which is
-- this path.)
--
-- After this migration:
--   service_role  -> unrestricted (server/RPC paths).
--   super_admin   -> may change roles, but NOT their own (self-demotion is the
--                    fastest way to lock every operator out of role management).
--   admin         -> unchanged for everything except `role`, which is now refused.
--   everyone else -> unchanged.
--
-- OPERATOR NOTE: with a single super_admin, losing that account means nobody can
-- grant roles. Create a second super_admin as a break-glass account. The recovery
-- path stays: begin; set local request.jwt.claim.role='service_role';
-- update public.profiles set role='super_admin' where id='<uuid>'; commit;
begin;

create or replace function public.is_super_admin(target_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = coalesce(target_user_id, auth.uid())
      and lower(coalesce(p.role, '')) = 'super_admin'
  );
$$;
alter function public.is_super_admin(uuid) owner to postgres;

-- Body is byte-for-byte the v4 definition (20260619000001) except the admin
-- exemption block, which is now tiered instead of blanket.
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
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  -- The server is unrestricted.
  if public.is_service_role() then
    return new;
  end if;

  -- Admins keep their full pass EXCEPT over `role`, which is reserved to
  -- super_admin — and no super_admin may change their own role.
  if public.is_admin_user() then
    if new.role is distinct from old.role then
      if not public.is_super_admin() then
        raise exception 'Only a super admin can change a profile role.';
      end if;
      if old.id = auth.uid() then
        raise exception 'A super admin cannot change their own role.';
      end if;
    end if;
    return new;
  end if;

  -- Owner-only, EXCEPT the trusted recalc path (which updates another user's row).
  if auth.uid() is distinct from old.id and not rating_recalc then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role
     or new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or (to_jsonb(new) -> 'trust_score') is distinct from (to_jsonb(old) -> 'trust_score') then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  -- status is protected, EXCEPT the guarded transition performed by
  -- submit_supplier_verification(), which sets the maabar.allow_profile_status_update
  -- GUC immediately before moving the supplier into 'verification_under_review'.
  -- Restored from v2 (202604011130); v3 dropped this allow-path.
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
alter function public.guard_profile_sensitive_fields() owner to postgres;

commit;
