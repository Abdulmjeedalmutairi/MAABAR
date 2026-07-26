-- Mint maabar_supplier_id at REGISTRATION, not only at verification.
--
-- Product decision: currently-registered suppliers are already vetted offline, so
-- buyer visibility is being broadened to any non-rejected/non-inactive supplier
-- (see the supplier_public_profiles change). For that, every buyer-visible supplier
-- needs a stable public ID from day one — the directory/profile pages route on
-- maabar_supplier_id, which was previously null until admin approval.
--
-- Change: ensure_supplier_maabar_id() now mints whenever the ID is empty and the
-- supplier is not rejected/inactive (i.e. at signup, status='registered', and at
-- any later status short of rejected/inactive). The `= ''` guard keeps it
-- idempotent — a supplier that already has an ID never gets a second one, so
-- re-running verification or any later status change can never re-mint.
--
-- The trigger binding (before insert or update of status, maabar_supplier_id) is
-- unchanged and already fires on INSERT, so replacing the function is sufficient.
-- Sequence access is safe: signup inserts run inside handle_new_user (SECURITY
-- DEFINER, owner postgres) so nextval runs as postgres; admin approval already
-- mints in the authenticated context today.
begin;

create or replace function public.ensure_supplier_maabar_id()
returns trigger
language plpgsql
as $$
begin
  if new.role = 'supplier'
     and coalesce(new.maabar_supplier_id, '') = ''
     and lower(coalesce(new.status, '')) not in ('rejected', 'inactive') then
    new.maabar_supplier_id := public.generate_maabar_supplier_id();
  end if;
  return new;
end;
$$;
alter function public.ensure_supplier_maabar_id() owner to postgres;

-- One-time backfill: give existing registered / under-review suppliers an ID now,
-- so they are routable the moment the buyer-facing view broadens. This writes
-- maabar_supplier_id directly, which guard_profile_sensitive_fields() blocks for
-- non-admin/non-service callers — so assume the service_role claim in-transaction
-- (the sanctioned bypass used by the other operator migrations). The `= ''` guard
-- means the ensure trigger will not overwrite the explicit value we set here.
set local request.jwt.claim.role = 'service_role';

update public.profiles
set maabar_supplier_id = public.generate_maabar_supplier_id()
where role = 'supplier'
  and coalesce(maabar_supplier_id, '') = ''
  and lower(coalesce(status, '')) not in ('rejected', 'inactive');

commit;
