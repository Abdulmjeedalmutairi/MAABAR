-- Referral binding at sign-up — Phase 2 (DB side).
-- Mirrors set_profile_lang_default (20260428000001): a BEFORE INSERT trigger on
-- public.profiles reads the referral_code from auth.users.raw_user_meta_data
-- (set on supabase.auth.signUp) and stashes it in pending_referral_code. The
-- Phase-1 AFTER trigger (trg_profiles_record_referral) then records the referral.
-- Works whether the profile row is created by the client insert OR by the
-- existing handle_new_user trigger — and does NOT modify handle_new_user.
begin;

-- Role-independent on purpose: this is a BEFORE INSERT trigger, and role may not
-- be reliably populated at insert time by the handle_new_user path. So we do NOT
-- gate on new.role here — we just stash referral_code from the auth metadata if
-- present. This is safe because only the supplier sign-up form puts referral_code
-- into the metadata (buyers never carry it), and record_referral (which runs
-- AFTER insert, where role IS reliable) is the authoritative gate: it only binds
-- a referral when the *code* belongs to a verified supplier.
create or replace function public.set_profile_pending_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_code text;
begin
  -- Explicit value passed by the inserter wins.
  if new.pending_referral_code is not null and btrim(new.pending_referral_code) <> '' then
    return new;
  end if;
  select raw_user_meta_data->>'referral_code' into v_code
    from auth.users where id = new.id;
  if v_code is not null and btrim(v_code) <> '' then
    new.pending_referral_code := btrim(v_code);
  end if;
  return new;
end;
$$;
alter function public.set_profile_pending_referral() owner to postgres;

drop trigger if exists set_profile_pending_referral on public.profiles;
create trigger set_profile_pending_referral
  before insert on public.profiles
  for each row execute function public.set_profile_pending_referral();

commit;
