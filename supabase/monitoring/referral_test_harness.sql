-- ═══════════════════════════════════════════════════════════════════════════
-- Referral flow — quick test harness (Supabase SQL Editor). NOT a migration.
-- ═══════════════════════════════════════════════════════════════════════════
-- Skips the whole UI / email-confirmation / admin-approval dance: it drives the
-- reward triggers directly with SQL. Edit the two IDs, run STEP 1, read the
-- results grid, then run STEP 2 to clean up. Use THROWAWAY test accounts.
--
--   REFERRER = an existing VERIFIED supplier that has a maabar_supplier_id
--              (and, to also test reward 2, at least one published product
--               with is_draft = false).
--   REFERRED = an existing supplier account you can throw away.
--
-- Find candidates:
--   select id, company_name, status, maabar_supplier_id, reg_number
--   from public.profiles where role = 'supplier';
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────── STEP 1 — simulate + inspect ───────────────────
-- 1) Set up the referred: DIFFERENT commercial registration + reset to
--    unverified. (Its role must be 'supplier' — the guard checks that.)
update public.profiles
   set reg_number = 'CR-TEST-REFERRED', status = 'registered'
 where id = '<REFERRED_ID>';

-- 2) Bind via the REAL function — exercises record_referral's guards:
--    referrer-must-be-verified, referred-must-be-supplier, no self-referral,
--    the 50 / 10 caps, and dedup. (NOT a raw insert.)
select public.record_referral(
  '<REFERRED_ID>'::uuid,
  (select maabar_supplier_id from public.profiles where id = '<REFERRER_ID>')
);

-- 3) Did it bind? Row present = passed every guard; absent = a guard blocked it.
select referrer_id, referred_id, referral_code, referred_verified_at, reward_eligible
  from public.referrals where referred_id = '<REFERRED_ID>';

-- 4) Fire the reward(s) via a REAL status UPDATE — this is the actual
--    on_supplier_verified_referral trigger, not a manual insert.
update public.profiles set status = 'verified' where id = '<REFERRED_ID>';

-- 5) What the trigger produced (expect 'referred_verified' $30 pending; and
--    'first_product_and_verified' $30 too IF the referrer has a published
--    product):
select reward_type, amount, currency, state, condition_met, earned_at
  from public.referral_rewards
 where referral_id = (select id from public.referrals where referred_id = '<REFERRED_ID>')
 order by earned_at;

-- ─────────────────────────── STEP 2 — cleanup ──────────────────────────────
-- Run this after inspecting, to remove all test data.
-- delete from public.referral_rewards
--  where referral_id in (select id from public.referrals where referred_id = '<REFERRED_ID>');
-- delete from public.referrals where referred_id = '<REFERRED_ID>';
-- delete from public.notifications where user_id = '<REFERRER_ID>' and type = 'referral_reward';

-- ── Variants ───────────────────────────────────────────────────────────────
-- Binding guards live in record_referral (STEP 1.2); the CR-dedup lives in the
-- reward trigger (STEP 1.4). So they show up in different grids:
--
-- • Same CR (anti-fraud): set the referred's reg_number = the referrer's. The
--   referral STILL binds (STEP 3 shows a row) but the REWARDS grid (STEP 5) is
--   EMPTY, and referrals.reward_eligible = false.
-- • Referrer not verified: temporarily set the referrer's status to
--   'registered' before STEP 1.2 → record_referral binds nothing (STEP 3 empty).
-- • Self-referral: pass the SAME id for referrer and referred → STEP 3 empty.
-- • Referred not a supplier: point REFERRED_ID at a buyer profile → STEP 3
--   empty (the referred-is-supplier guard).
-- • 10-cap: pre-insert 10 dummy referrals for the referrer, then call
--   record_referral for an 11th referred → STEP 3 empty.
-- • Reward 2 in isolation: pick a referrer with NO published product; run STEP 1
--   → only reward 1 appears. Then publish a product for the referrer → reward 2
--   fires on its own.
