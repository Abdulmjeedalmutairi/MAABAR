-- OAuth (Google/Apple) supplier signup.
--
-- Problem: a social sign-up creates the account with the DEFAULT buyer role
-- (there is no role in OAuth metadata for handle_new_user to read), and the
-- profile role/status columns are guarded against direct client updates by
-- guard_profile_sensitive_fields(). So a user who explicitly chose "Join as
-- supplier" and signed up with Google/Apple lands in the trader dashboard and
-- cannot be promoted from the client.
--
-- Fix: a SECURITY DEFINER RPC that lets a signed-in user promote their OWN
-- buyer/unset account to supplier, guarded by a TRANSACTION-LOCAL GUC that only
-- this function sets. PostgREST clients cannot set that GUC, so the guard keeps
-- rejecting every other direct role/status write exactly as before.

-- 1) Teach the guard to honor the transaction-local escape hatch.
create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if public.is_service_role() or public.is_admin_user() then
    return new;
  end if;

  -- Escape hatch set only inside public.claim_supplier_role() (transaction-local).
  -- Clients cannot set this GUC through PostgREST, so it is not a bypass surface.
  if coalesce(current_setting('maabar.allow_role_promote', true), '') = 'on' then
    return new;
  end if;

  if auth.uid() is distinct from old.id then
    raise exception 'You can only update your own profile.';
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.maabar_supplier_id is distinct from old.maabar_supplier_id
     or new.rating is distinct from old.rating
     or new.reviews_count is distinct from old.reviews_count
     or new.trust_score is distinct from old.trust_score then
    raise exception 'Protected profile fields cannot be updated directly.';
  end if;

  return new;
end;
$$;

-- 2) RPC: promote the CALLER's own account to supplier.
--    Only a buyer / unset (or already-supplier) account can be promoted; admins
--    and any other role are refused. Idempotent for existing suppliers.
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

  -- Transaction-local so it cannot leak past this call.
  perform set_config('maabar.allow_role_promote', 'on', true);

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
