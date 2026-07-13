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
-- Give the referred a DIFFERENT commercial registration + reset to unverified.
update public.profiles
   set reg_number = 'CR-TEST-REFERRED', status = 'registered'
 where id = '<REFERRED_ID>';

-- Bind the referral using the referrer's REAL code (maabar_supplier_id).
insert into public.referrals (referrer_id, referred_id, referral_code)
select p.id, '<REFERRED_ID>'::uuid, p.maabar_supplier_id
  from public.profiles p
 where p.id = '<REFERRER_ID>'
on conflict (referred_id) do nothing;

-- Fire the reward(s): the referred completes verification.
update public.profiles set status = 'verified' where id = '<REFERRED_ID>';

-- What the triggers produced (expect: 'referred_verified' $30 pending; and
-- 'first_product_and_verified' $30 too IF the referrer has a published product):
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
-- • Anti-fraud (same CR): in STEP 1 set the referred's reg_number to the SAME
--   value as the referrer's → the results grid should be EMPTY (no reward).
-- • Reward 2 in isolation: pick a referrer with NO published product; run STEP 1
--   → only reward 1 appears. Then publish a product for the referrer (via the UI
--   or an insert) → reward 2 fires on its own.
