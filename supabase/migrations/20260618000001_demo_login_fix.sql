-- 20260618000001_demo_login_fix.sql
--
-- Repairs the already-applied demo-marketplace seed so the demo accounts
-- (demo-supplier@maabar.io / demo-trader@maabar.io, password Demo1234!) and the
-- rest of the seeded users can actually sign in. Runs during `supabase db push`
-- as the migration role, which bypasses RLS — so it succeeds where the manual
-- profiles UPDATE in the SQL editor was blocked.
--
-- Two independent blockers are fixed:
--
--   (A) Supplier onboarding overlay trap.
--       Verified suppliers with onboarding_completed <> true get stuck behind
--       the post-approval onboarding overlay (RootNavigator showSupplierOnboarding).
--       The seed never set the flag on rows that already existed.
--
--   (B) GoTrue password-login failure for hand-seeded auth.users rows.
--       The seed inserted auth.users without the token string columns
--       (confirmation_token, recovery_token, email_change, email_change_token_new,
--       phone_change, reauthentication_token), so they defaulted to NULL. GoTrue
--       scans these into Go strings during password sign-in; a NULL makes the
--       query error out, so BOTH demo accounts fail (the trader has no onboarding
--       gate, yet still couldn't log in — this is why). '' is the value GoTrue
--       itself writes, so normalizing NULL -> '' unblocks login.
--
-- Scope: only rows tagged with the demo seed_group are touched — no real users.

begin;

-- ── (A) Clear the supplier onboarding gate for seeded suppliers ──────────────
update public.profiles
   set onboarding_completed = true
 where maabar_supplier_id like 'MS-0090%'
   and coalesce(onboarding_completed, false) <> true;

-- ── (B) Normalize NULL auth token columns + reconfirm email for seeded users ─
update auth.users
   set confirmation_token     = coalesce(confirmation_token, ''),
       recovery_token         = coalesce(recovery_token, ''),
       email_change           = coalesce(email_change, ''),
       email_change_token_new = coalesce(email_change_token_new, ''),
       phone_change           = coalesce(phone_change, ''),
       reauthentication_token = coalesce(reauthentication_token, ''),
       email_confirmed_at     = coalesce(email_confirmed_at, now()),
       updated_at             = now()
 where raw_user_meta_data->>'seed_group' = 'demo-marketplace-v2'
   and (
        confirmation_token     is null
     or recovery_token         is null
     or email_change           is null
     or email_change_token_new is null
     or phone_change           is null
     or reauthentication_token is null
     or email_confirmed_at     is null
   );

commit;
