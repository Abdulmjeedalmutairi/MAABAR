-- ============================================================================
-- Currency standardization (1/3) — `requests.budget_currency`
-- ----------------------------------------------------------------------------
-- Tags each row's `budget_per_unit` with the currency it was entered in.
-- Part of the platform-wide standardization to USD as the DB base currency,
-- with role-based display (trader → SAR, supplier → USD).
--
-- Strategy: A1-strict (per product decision).
--   • DO NOT touch existing rows. They keep `budget_currency = NULL` and
--     application code MUST treat NULL as legacy SAR.
--   • New INSERTs default to 'USD'. The web/mobile RFQ flows convert the
--     buyer's SAR input to USD before persisting.
--
-- Backwards compatibility:
--   • Existing rows in production were entered as SAR via the web Requests.jsx
--     form (which assumes SAR). Their numeric values are unchanged; only the
--     interpretation is now explicit (NULL ⇒ SAR).
--   • Display layer reads `budget_currency ?? 'SAR'` and converts to the
--     viewer's role currency using live FX (with hardcoded fallback).
--
-- Rollback: `ALTER TABLE public.requests DROP COLUMN budget_currency;`
-- Safe to drop; no FK dependencies, application gracefully degrades to NULL.
-- ============================================================================

alter table public.requests
  add column if not exists budget_currency text;

-- Default applies only to rows inserted AFTER this migration.
-- Existing rows remain NULL (legacy SAR semantics).
alter table public.requests
  alter column budget_currency set default 'USD';

alter table public.requests
  drop constraint if exists requests_budget_currency_chk;

alter table public.requests
  add constraint requests_budget_currency_chk
  check (budget_currency is null or budget_currency in ('USD','SAR','CNY'));

comment on column public.requests.budget_currency is
  'Currency of budget_per_unit. NULL = legacy row (interpret as SAR). New rows default to USD per platform standard.';
