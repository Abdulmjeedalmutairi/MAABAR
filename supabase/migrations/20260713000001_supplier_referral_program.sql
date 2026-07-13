-- ============================================================================
-- Supplier Referral Program — Phase 1 (schema + RLS + reward triggers)
-- ============================================================================
-- Each VERIFIED supplier's maabar_supplier_id IS their referral code. A new
-- supplier enters the code at sign-up; the referrer earns two separate $30
-- rewards:
--   Reward 1 (referred_verified): the referred supplier completes full
--     verification (status -> verified) AND their commercial-registration number
--     (reg_number) differs from the referrer's (anti duplicate-factory).
--   Reward 2 (first_product_and_verified): BOTH the referrer has added their own
--     first real product (is_draft = false) AND the referred is verified.
--
-- Program limits (hard-enforced atomically, see the advisory lock below):
--   • Only the FIRST 50 referred suppliers to complete verification (ordered by
--     verification-completion time). Once 50 are reached, codes stop accepting
--     new sign-ups.
--   • Max 10 sign-ups per referrer code.
--
-- Wallet: rewards are a documented ledger (type, condition, earned date, linked
-- referral). Balance splits into "pending" (كل شي الآن) and "withdrawable"
-- (= 0; unlocked later by real escrow commission — out of scope here).
--
-- SECURITY: all writes to referrals / referral_rewards happen ONLY through these
-- SECURITY DEFINER trigger functions (owned by postgres, so they bypass RLS).
-- Clients get SELECT-only via RLS — a supplier can never fabricate a reward.
--
-- ATOMICITY: the 50-cap and the 10-cap are both evaluated inside a single
-- transaction-scoped advisory lock (same key across sign-up and both reward
-- paths), so two near-simultaneous sign-ups / verifications can never overrun a
-- cap. Cheap pre-checks run before the lock so only referral-relevant writes
-- ever contend for it.
-- ============================================================================

begin;

-- Trilingual notification support (Chinese suppliers). Idempotent.
alter table public.notifications
  add column if not exists title_zh text;

-- ── Carrier column: the code entered at sign-up rides here until the AFTER
--    trigger records the referral, then it's cleared. ──────────────────────────
alter table public.profiles
  add column if not exists pending_referral_code text;

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id                   uuid primary key default gen_random_uuid(),
  referrer_id          uuid not null references public.profiles(id) on delete cascade,
  referred_id          uuid not null unique references public.profiles(id) on delete cascade,
  referral_code        text not null,
  created_at           timestamptz not null default now(),
  referred_verified_at timestamptz,
  reward_eligible      boolean not null default false,   -- within first-50 AND distinct CR
  constraint referrals_no_self check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
create index if not exists referrals_verified_idx on public.referrals (referred_verified_at);

create table if not exists public.referral_rewards (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references public.profiles(id) on delete cascade,
  referral_id   uuid not null references public.referrals(id) on delete cascade,
  reward_type   text not null check (reward_type in ('referred_verified','first_product_and_verified')),
  amount        numeric not null default 30,
  currency      text not null default 'USD',
  condition_met text,
  earned_at     timestamptz not null default now(),
  state         text not null default 'pending' check (state in ('pending','withdrawable')),
  unique (referral_id, reward_type)
);
create index if not exists referral_rewards_referrer_idx on public.referral_rewards (referrer_id);

-- ── RLS: SELECT-only for the owner (and admins). No client writes. ───────────
alter table public.referrals        enable row level security;
alter table public.referral_rewards enable row level security;

drop policy if exists referrals_select_own on public.referrals;
create policy referrals_select_own on public.referrals
  for select to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid() or public.is_admin_user());

drop policy if exists referral_rewards_select_own on public.referral_rewards;
create policy referral_rewards_select_own on public.referral_rewards
  for select to authenticated
  using (referrer_id = auth.uid() or public.is_admin_user());

-- ── record_referral: validate the code + caps, then bind the referral. ───────
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

  -- Serialize all cap-sensitive referral/reward mutations (see header).
  perform pg_advisory_xact_lock(hashtext('maabar_referral_program')::bigint);

  -- The code is the referrer's maabar_supplier_id; referrer must be verified.
  select id into v_referrer_id
    from public.profiles
   where maabar_supplier_id = btrim(p_code)
     and lower(coalesce(status,'')) in ('verified','active','approved')
   limit 1;
  if v_referrer_id is null      then return; end if;   -- invalid / non-verified code
  if v_referrer_id = p_referred then return; end if;   -- no self-referral
  if exists (select 1 from public.referrals where referred_id = p_referred) then return; end if;

  -- Program cap: stop new sign-ups once 50 referred suppliers are verified.
  select count(*) into v_verified_count
    from public.referrals where referred_verified_at is not null;
  if v_verified_count >= 50 then return; end if;

  -- Per-referrer cap: max 10 sign-ups via a referrer's code.
  select count(*) into v_referrer_count
    from public.referrals where referrer_id = v_referrer_id;
  if v_referrer_count >= 10 then return; end if;

  insert into public.referrals (referrer_id, referred_id, referral_code)
  values (v_referrer_id, p_referred, btrim(p_code))
  on conflict (referred_id) do nothing;
end;
$$;
alter function public.record_referral(uuid, text) owner to postgres;

-- Feed record_referral from pending_referral_code, then clear it (no recursion:
-- the WHEN clause is false once it's null).
create or replace function public.trg_profiles_record_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.record_referral(new.id, new.pending_referral_code);
  update public.profiles set pending_referral_code = null where id = new.id;
  return null;
end;
$$;
alter function public.trg_profiles_record_referral() owner to postgres;

drop trigger if exists trg_profiles_record_referral on public.profiles;
create trigger trg_profiles_record_referral
  after insert or update of pending_referral_code on public.profiles
  for each row
  when (new.pending_referral_code is not null and btrim(new.pending_referral_code) <> '')
  execute function public.trg_profiles_record_referral();

-- ── Reward evaluation on: referred supplier becomes verified. ────────────────
create or replace function public.on_supplier_verified_referral()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new_ver        boolean := lower(coalesce(new.status,'')) in ('verified','active','approved');
  v_old_ver        boolean := lower(coalesce(old.status,'')) in ('verified','active','approved');
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
  if v_ref.id is null or v_ref.referred_verified_at is not null then return new; end if;  -- already done

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

  -- Reward 1
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

  -- Reward 2 (if the referrer already has a real published product)
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

drop trigger if exists trg_supplier_verified_referral on public.profiles;
create trigger trg_supplier_verified_referral
  after update of status on public.profiles
  for each row
  when (new.status is distinct from old.status)
  execute function public.on_supplier_verified_referral();

-- ── Reward evaluation on: referrer adds their FIRST real product. ────────────
create or replace function public.on_product_first_referral_reward()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_first boolean;
begin
  if coalesce(new.is_draft, false) then return new; end if;  -- drafts never count
  if not exists (
    select 1 from public.referrals
     where referrer_id = new.supplier_id and reward_eligible and referred_verified_at is not null
  ) then return new; end if;

  perform pg_advisory_xact_lock(hashtext('maabar_referral_program')::bigint);

  -- Only the FIRST published product triggers the reward.
  select not exists (
    select 1 from public.products
     where supplier_id = new.supplier_id and id <> new.id and coalesce(is_draft,false) = false
  ) into v_first;
  if not v_first then return new; end if;

  with ins as (
    insert into public.referral_rewards (referrer_id, referral_id, reward_type, amount, currency, condition_met, state)
    select r.referrer_id, r.id, 'first_product_and_verified', 30, 'USD',
           'Referrer added their first product; referral already verified.', 'pending'
    from public.referrals r
    where r.referrer_id = new.supplier_id and r.reward_eligible and r.referred_verified_at is not null
    on conflict (referral_id, reward_type) do nothing
    returning referrer_id, referral_id
  )
  insert into public.notifications (user_id, type, title_ar, title_en, title_zh, ref_id, is_read)
  select ins.referrer_id, 'referral_reward',
         'بدأت تكسب 30$ إضافية — اكتمل شرط مكافأتك الثانية!',
         'You''ve started earning another $30 — your second reward condition is met!',
         '您又开始赚取 $30 — 第二重奖励条件已达成！',
         ins.referral_id, false
  from ins;

  return new;
end;
$$;
alter function public.on_product_first_referral_reward() owner to postgres;

drop trigger if exists trg_product_first_referral_reward on public.products;
create trigger trg_product_first_referral_reward
  after insert on public.products
  for each row
  execute function public.on_product_first_referral_reward();

commit;
