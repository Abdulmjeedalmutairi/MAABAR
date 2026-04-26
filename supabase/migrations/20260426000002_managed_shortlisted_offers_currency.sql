-- ============================================================================
-- Currency standardization (2/3) — `managed_shortlisted_offers.currency`
-- ----------------------------------------------------------------------------
-- Tags admin-curated managed-sourcing shortlist offers with their currency.
--
-- Strategy: A2 (per product decision).
--   • Default = 'USD' for both existing and future rows. Postgres 11+ stores
--     the default in pg_attribute and returns it for un-rewritten rows
--     without touching storage. Existing rows therefore READ as 'USD' on
--     SELECT, matching the existing display code which already does
--     `offer.currency || 'USD'` (defensive). No data is mutated.
--
-- Why this is safe:
--   • Display sites (ManagedRequestScreen.js:539, ManagedBuyerRequestPanel
--     .jsx:180) already fall back to 'USD' when the field is missing, so
--     making 'USD' the explicit default is behaviour-preserving.
--   • Admins create these rows via internal tooling; if any historical row
--     was actually a non-USD quote, it would have been displayed as USD
--     pre-migration anyway — the bug (if any) predates this migration and
--     is not introduced by it.
--
-- Rollback: `ALTER TABLE public.managed_shortlisted_offers DROP COLUMN currency;`
-- ============================================================================

alter table public.managed_shortlisted_offers
  add column if not exists currency text default 'USD';

alter table public.managed_shortlisted_offers
  drop constraint if exists managed_shortlisted_offers_currency_chk;

alter table public.managed_shortlisted_offers
  add constraint managed_shortlisted_offers_currency_chk
  check (currency in ('USD','SAR','CNY'));

comment on column public.managed_shortlisted_offers.currency is
  'Currency of unit_price. Defaults to USD per platform standard. Display layer converts to viewer role (trader→SAR, supplier→USD).';
