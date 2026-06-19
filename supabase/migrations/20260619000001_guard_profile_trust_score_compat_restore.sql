-- 20260619000001_guard_profile_trust_score_compat_restore.sql
--
-- Restore TWO compatibility behaviors in guard_profile_sensitive_fields() that the
-- v3 definition (20260613000001_rls_security_hardening.sql) regressed. Both were
-- present in 202604011130_supplier_lockdown_trust_score_compat.sql and silently
-- dropped by v3.
--
-- FIX 1 — trust_score to_jsonb shim.
--   public.profiles has NO `trust_score` column (confirmed on production:
--   information_schema.columns returns zero rows for it, and no migration ever ADDs
--   it). v3 regressed to a DIRECT record-field reference `new.trust_score`, which
--   makes PL/pgSQL raise 42703: record "new" has no field "trust_score" on every
--   NON-admin profile UPDATE (a supplier saving their own profile). (Admins are
--   unaffected: the is_service_role()/is_admin_user() bypass returns NEW before that
--   line is evaluated; PL/pgSQL parses the IF expression lazily.) This reads
--   trust_score via `to_jsonb(...) -> 'trust_score'`, which yields SQL NULL when the
--   column is absent (NULL is distinct from NULL => false: no error, no false
--   positive) and still compares the real value if the column is ever added.
--
-- FIX 2 — status allow-path for submit_supplier_verification().
--   The RPC submit_supplier_verification() (202604011130) is SECURITY DEFINER, but its
--   definer context does NOT satisfy the guard's admin/service bypass: is_service_role()
--   reads the caller's JWT role ('authenticated') and is_admin_user() reads the caller's
--   profile role ('supplier') — neither is changed by SECURITY DEFINER. So the RPC sets a
--   transaction-local GUC `maabar.allow_profile_status_update = 'submit_supplier_verification'`
--   immediately before updating profiles.status = 'verification_under_review', and the guard
--   is expected to honor it. v3 folded `status` back into the unconditional protected block
--   and stopped reading that GUC, so the RPC's status update was blocked for everyone (web
--   and mobile) with 'Protected profile fields cannot be updated directly.' This restores the
--   v2 allow-path: status stays protected EXCEPT the exact transition the RPC performs (GUC
--   set AND new = 'verification_under_review' AND old not already in review/verified).
--
-- Everything else from v3 is preserved byte-for-byte: the admin/service-role bypass, the
-- owner-only check (incl. its `and not rating_recalc` exception), the role/maabar_supplier_id
-- protection, the rating/reviews_count block with its app.allow_rating_recalc GUC, security
-- definer, set search_path = public, and every raise message. The trigger binding
-- (trg_profiles_guard_sensitive_fields) is NOT touched — this is a CREATE OR REPLACE of the
-- function body only, and the RPC is NOT modified. Timestamped after 20260613000001 so it is
-- the latest definition and won't be silently reverted again.

begin;

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

  if public.is_service_role() or public.is_admin_user() then
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

commit;
