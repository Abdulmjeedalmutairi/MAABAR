-- ============================================================
-- Phase 4 — drop legacy products.price_from
-- Branch: feature/product-form-b2b
--
-- Phase 2 introduced product_pricing_tiers as the canonical price source.
-- The form has stopped maintaining `price_from` directly; readers in Phase 4
-- now embed tier rows in their queries and derive the lowest unit price
-- client-side via lib/productPriceLookup.js.
--
-- Idempotent: DROP COLUMN IF EXISTS leaves a re-run as a no-op.
-- Reversible: a backfill from product_pricing_tiers can be reapplied if a
-- future migration needs to recreate the column.
-- ============================================================

BEGIN;

ALTER TABLE public.products
  DROP COLUMN IF EXISTS price_from;

COMMIT;
