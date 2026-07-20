-- CRITICAL — close the self-service privilege-escalation hole on profiles INSERT.
--
-- Before this, `role` arriving at INSERT was fully client-controlled:
--   * signUp() passes `role` in options.data -> auth.users.raw_user_meta_data, and
--     handle_new_user() copied it into profiles.role with NO allowlist; and
--   * the client can insert/upsert profiles directly (mobile LoginScreen upsert).
-- The only controls were:
--   * RLS policy `profiles_insert_self` = `with check (id = auth.uid())` — checks the
--     row owner, NOT the role; and
--   * trigger `trg_profiles_guard_sensitive_fields`, which is `BEFORE UPDATE` only and
--     whose function returns early on `tg_op <> 'UPDATE'`.
-- => INSERT was completely unguarded, so anyone signing up could pass
--    role:'admin' / 'super_admin' and be an admin immediately.
-- Verified at the time of this fix: no actual escalation had occurred (the only
-- admin/super_admin row was the known owner account).
--
-- Fix: clamp the role at INSERT to the self-serve allowlist.
--
-- Deliberately UNCONDITIONAL (no service_role/admin exemption): handle_new_user runs
-- SECURITY DEFINER inside the auth service, in a context whose JWT role claim we cannot
-- rely on — an exemption there could silently reopen the hole. Privileged roles remain
-- grantable, just never self-assigned at signup (see the operator note below).
--
-- OPERATOR NOTE — granting a privileged role after this migration:
--   Role changes on UPDATE are restricted by guard_profile_sensitive_fields() to
--   service_role/admin. From the SQL Editor (which runs as `postgres`, with no JWT
--   claim) set the claim first, in the SAME transaction:
--     begin;
--       set local request.jwt.claim.role = 'service_role';
--       update public.profiles set role = 'admin' where id = '<uuid>';
--     commit;
begin;

create or replace function public.guard_profile_role_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Client-supplied role is untrusted at INSERT time. Anything outside the
  -- self-serve allowlist (including admin/super_admin) falls back to 'buyer'.
  if lower(coalesce(new.role, '')) not in ('buyer', 'supplier') then
    new.role := 'buyer';
  end if;
  return new;
end;
$$;
alter function public.guard_profile_role_on_insert() owner to postgres;

drop trigger if exists trg_profiles_guard_role_insert on public.profiles;
create trigger trg_profiles_guard_role_insert
before insert on public.profiles
for each row execute function public.guard_profile_role_on_insert();

commit;
