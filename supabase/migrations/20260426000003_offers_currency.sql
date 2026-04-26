-- ============================================================================
-- Currency standardization (3/3) — `offers.currency`
-- ----------------------------------------------------------------------------
-- Tags supplier-created (legacy non-managed) offer rows with their currency.
--
-- Strategy: per-row tag, default 'USD'.
--   • Display sites (Checkout.jsx:237 etc.) already use `offer.currency
--     || 'USD'` defensively. Adding a column with default 'USD' is
--     behaviour-preserving for SELECT — existing rows read as 'USD' via the
--     PG 11+ "default-stored-in-catalog" optimization, no row rewrite.
--
-- IMPORTANT — historical data semantics caveat (escalated to product owner):
--   The audit noted that suppliers using the Arabic UI MAY have entered
--   prices as SAR even though the display side has always assumed USD.
--   Defaulting historical rows to 'USD' preserves the EXISTING display
--   behaviour (which is what users currently see). It does NOT correct any
--   pre-existing mis-entry — that would require a per-supplier audit and
--   selective backfill (out of scope for this migration; see follow-up).
--
-- Rollback: `ALTER TABLE public.offers DROP COLUMN currency;`
-- ============================================================================

alter table public.offers
  add column if not exists currency text default 'USD';

alter table public.offers
  drop constraint if exists offers_currency_chk;

alter table public.offers
  add constraint offers_currency_chk
  check (currency in ('USD','SAR','CNY'));

comment on column public.offers.currency is
  'Currency of price. Defaults to USD per platform standard. New supplier offer-creation flows MUST persist USD explicitly.';
