-- Phone-as-identity for suppliers (no instant OTP; verified later by manual review).
--
-- Context: most Chinese suppliers have no email, and SMS/WhatsApp OTP to Chinese
-- numbers is unreliable (state filtering) — so suppliers now register with a phone
-- number and no mandatory email, authenticated by Supabase's phone provider with
-- phone confirmations turned OFF (verified working: signUp returns a live, phone-
-- confirmed session with no OTP). Real identity is established afterwards by the
-- existing manual review (pending -> Arman docs / reg number -> verified).
--
-- Schema state confirmed before writing this (cloud introspection):
--   * profiles.email  is_nullable = YES  -> a phone-only signup leaves it empty/NULL,
--                     which handle_new_user already produces (it copies NEW.email
--                     directly, and phone signups carry no email). No change needed.
--   * profiles.phone  is_nullable = YES.
--   * No unique index exists on email or phone today — so this is additive and safe.
--
-- Uniqueness model:
--   * auth.users.phone is already globally unique for phone-auth accounts (enforced
--     by GoTrue) — that is the primary guard against duplicate phone accounts.
--   * This index adds the cross-case guard: an email-registered profile whose phone
--     column collides with a phone-registered account. It is deliberately PARTIAL on
--     the canonical E.164 shape the client now writes (+<cc><national>, no spaces),
--     so it enforces uniqueness on new normalised numbers WITHOUT choking on the
--     legacy, unnormalised buyer phone strings ("05x", "+966 5x …") already stored.
begin;

create unique index if not exists profiles_phone_e164_unique
  on public.profiles (phone)
  where phone ~ '^\+[1-9]\d{6,14}$';

comment on index public.profiles_phone_e164_unique is
  'Uniqueness on canonical E.164 phone (+<cc><national>). Partial: legacy non-canonical phones are excluded so this never conflicts with pre-existing buyer data.';

commit;
