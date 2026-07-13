-- Fix: referral eligibility must use the SAME verified definition as the
-- authoritative gate is_verified_supplier() — status = 'verified' LITERALLY
-- (not the legacy 'active'/'approved'). Otherwise a legacy row with
-- status='active' (which is_verified_supplier treats as NOT verified) could earn
-- a referral reward without being truly verified. Re-creates the two functions
-- from 20260713000001 with the corrected check; triggers already point at them.
begin;

create or replace function public.record_referral(p_referred uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referrer_id    uuid;
  v_verified_count int;
  v_referrer_count int;
begin
  if p_code is null or btrim(p_code) = '' then return; end if;

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

create or replace function public.on_supplier_verified_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_ver        boolean := lower(coalesce(new.status,'')) = 'verified';
  v_old_ver        boolean := lower(coalesce(old.status,'')) = 'verified';
  v_ref            public.referrals%rowtype;
  v_referrer_reg   text;
  v_referred_reg   text;
  v_verified_count int;
  v_eligible       boolean;
  v_has_product    boolean;
begin
  if new.role <> 'supplier' or not v_new_ver or v_old_ver then return new; end if;
  if not exists (select 1 from public.referrals where referred_id = new.id) then return new; end if;

  perform pg_advisory_xact_lock(hashtext('maabar_referral_program')::bigint);

  select * into v_ref from public.referrals where referred_id = new.id;
  if v_ref.id is null or v_ref.referred_verified_at is not null then return new; end if;

  select count(*) into v_verified_count from public.referrals where referred_verified_at is not null;
  select reg_number into v_referred_reg  from public.profiles where id = v_ref.referred_id;
  select reg_number into v_referrer_reg  from public.profiles where id = v_ref.referrer_id;

  v_eligible := (v_verified_count < 50)
    and nullif(btrim(coalesce(v_referred_reg,'')),'') is not null
    and nullif(btrim(coalesce(v_referrer_reg,'')),'') is not null
    and lower(btrim(v_referred_reg)) <> lower(btrim(v_referrer_reg));

  update public.referrals
     set referred_verified_at = now(),
         reward_eligible       = v_eligible
   where id = v_ref.id;

  if not v_eligible then return new; end if;

  with ins as (
    insert into public.referral_rewards (referrer_id, referral_id, reward_type, amount, currency, condition_met, state)
    values (v_ref.referrer_id, v_ref.id, 'referred_verified', 30, 'USD',
            'Referred supplier completed full verification (distinct commercial registration).', 'pending')
    on conflict (referral_id, reward_type) do nothing
    returning referral_id
  )
  insert into public.notifications (user_id, type, title_ar, title_en, title_zh, ref_id, is_read)
  select v_ref.referrer_id, 'referral_reward',
         'بدأت تكسب 30$ — مورد أحلته أكمل توثيقه!',
         'You''ve started earning $30 — a supplier you referred just got verified!',
         '您已开始赚取 $30 — 您推荐的供应商已通过认证！',
         v_ref.id, false
  from ins;

  select exists (
    select 1 from public.products
     where supplier_id = v_ref.referrer_id and coalesce(is_draft,false) = false
  ) into v_has_product;

  if v_has_product then
    with ins2 as (
      insert into public.referral_rewards (referrer_id, referral_id, reward_type, amount, currency, condition_met, state)
      values (v_ref.referrer_id, v_ref.id, 'first_product_and_verified', 30, 'USD',
              'Referrer has a published product and the referral is verified.', 'pending')
      on conflict (referral_id, reward_type) do nothing
      returning referral_id
    )
    insert into public.notifications (user_id, type, title_ar, title_en, title_zh, ref_id, is_read)
    select v_ref.referrer_id, 'referral_reward',
           'بدأت تكسب 30$ إضافية — اكتمل شرط مكافأتك الثانية!',
           'You''ve started earning another $30 — your second reward condition is met!',
           '您又开始赚取 $30 — 第二重奖励条件已达成！',
           v_ref.id, false
    from ins2;
  end if;

  return new;
end;
$$;
alter function public.on_supplier_verified_referral() owner to postgres;

commit;
