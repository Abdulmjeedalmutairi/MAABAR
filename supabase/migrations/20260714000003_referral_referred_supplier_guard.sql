-- Fix: record_referral must verify the REFERRED account is itself a supplier.
--
-- raw_user_meta_data is client-controlled — a direct supabase.auth.signUp() call
-- (bypassing the Login.jsx form) could attach a valid referral_code on ANY role,
-- including buyers or throwaway accounts. Since set_profile_pending_referral is
-- role-independent (BEFORE INSERT, role not yet reliable), the authoritative
-- role gate must live in record_referral, which runs AFTER the profile row
-- exists (role IS reliable). Without it, an attacker could spam a target
-- referrer's code with dead accounts and silently exhaust their 10-referral cap.
--
-- Re-creates record_referral (from 20260714000002) plus the referred-is-supplier
-- guard. The trigger already points at this function.
begin;

create or replace function public.record_referral(p_referred uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer_id    uuid;
  v_referred_role  text;
  v_verified_count int;
  v_referrer_count int;
begin
  if p_code is null or btrim(p_code) = '' then return; end if;

  -- The referred account must itself be a supplier. role is reliable here
  -- (AFTER the profile row exists). Cheap check before taking the lock — blocks
  -- buyer / throwaway-account spam against a referrer's code.
  select lower(coalesce(role,'')) into v_referred_role
    from public.profiles where id = p_referred;
  if v_referred_role is distinct from 'supplier' then return; end if;

  perform pg_advisory_xact_lock(hashtext('maabar_referral_program')::bigint);

  -- Referrer must be a TRULY verified supplier (matches is_verified_supplier).
  select id into v_referrer_id
    from public.profiles
   where maabar_supplier_id = btrim(p_code)
     and lower(coalesce(status,'')) = 'verified'
   limit 1;
  if v_referrer_id is null      then return; end if;
  if v_referrer_id = p_referred then return; end if;
  if exists (select 1 from public.referrals where referred_id = p_referred) then return; end if;

  select count(*) into v_verified_count
    from public.referrals where referred_verified_at is not null;
  if v_verified_count >= 50 then return; end if;

  select count(*) into v_referrer_count
    from public.referrals where referrer_id = v_referrer_id;
  if v_referrer_count >= 10 then return; end if;

  insert into public.referrals (referrer_id, referred_id, referral_code)
  values (v_referrer_id, p_referred, btrim(p_code))
  on conflict (referred_id) do nothing;
end;
$$;
alter function public.record_referral(uuid, text) owner to postgres;

commit;
