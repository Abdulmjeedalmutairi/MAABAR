-- C1 — Auto-link a newly-registered supplier account to its existing
-- factory_directory row by EMAIL or PHONE, so a factory we already registered
-- (or invited) lands in a pre-filled account even when it signs up directly
-- through the app/website WITHOUT clicking our link.
--
-- Reuses the existing claim machinery: bind linked_supplier_id → seed
-- (seed_supplier_from_factory copies profile + products, products go is_active).
-- Same maabar.claiming/seeding GUCs as claim_factory_by_slug
-- (20260806000002_claim_seed_supplier.sql).
--
-- DELIBERATELY does NOT deactivate the factory_directory row (unlike the current
-- claim paths). The buyer "suppliers" browse is not live yet, so deactivating
-- here would make a linked factory vanish from the only working browse. The
-- factory stays visible + now owned; deactivation + de-duplication move to the
-- unified-browse phase (Phase 5).
--
-- SAFETY: auto-links ONLY when EXACTLY ONE unclaimed factory matches. Shared /
-- placeholder emails (e.g. one address on several factories) and phone collisions
-- are ambiguous → returns null, and the account falls back to the link/code path
-- (claim_factory_by_slug). Never links to an already-claimed row.
--
-- The client calls this once, right after supplier registration (web first, then
-- mobile). Idempotent: returns null (no-op) if the account is already linked.
begin;

create or replace function public.link_account_to_factory()
returns uuid                       -- matched factory id, or null when none/ambiguous
language plpgsql security definer set search_path to 'public' as $function$
declare
  v_acc   uuid := auth.uid();
  v_role  text;
  v_email text;
  v_phone text;
  v_factory uuid;
  v_count int;
begin
  if v_acc is null then raise exception 'Authentication required.'; end if;

  select lower(coalesce(role, '')),
         lower(nullif(trim(email), '')),
         nullif(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), '')
    into v_role, v_email, v_phone
  from public.profiles where id = v_acc;

  -- never auto-link an admin, and never re-link an account that already owns one
  if v_role in ('admin', 'super_admin') then return null; end if;
  if exists (select 1 from public.factory_directory where linked_supplier_id = v_acc) then
    return null;
  end if;

  -- unclaimed factories matching this account's email OR normalized phone (>=7 digits)
  with cand as (
    select d.id
    from public.factory_directory d
    where d.linked_supplier_id is null
      and (
        (v_email is not null and lower(nullif(trim(d.email), '')) = v_email)
        or (v_phone is not null and length(v_phone) >= 7
            and regexp_replace(coalesce(d.phone, ''), '[^0-9]', '', 'g') = v_phone)
      )
  )
  select count(*), min(id) into v_count, v_factory from cand;

  -- 0 = genuinely new supplier; >1 = ambiguous → leave for the link/code path
  if v_count <> 1 then return null; end if;

  -- bind → seed  (NO deactivation here — see header; factory stays browseable
  -- until Phase 5 unifies + de-duplicates the buyer browse)
  perform set_config('maabar.claiming', v_factory::text, true);
  update public.factory_directory
     set linked_supplier_id = v_acc, updated_at = now()
   where id = v_factory and linked_supplier_id is null;
  perform public.seed_supplier_from_factory(v_factory, v_acc);

  return v_factory;
end; $function$;

grant execute on function public.link_account_to_factory() to authenticated;

commit;
