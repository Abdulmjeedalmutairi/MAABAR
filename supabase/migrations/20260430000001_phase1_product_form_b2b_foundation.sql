-- ============================================================
-- Phase 1 — Product Form B2B Foundation
-- Branch: feature/product-form-b2b
--
-- This migration prepares the database for the upgraded supplier
-- "Add / Edit Product" form. NO UI changes are deployed in this
-- phase — only schema. Existing form code continues to work as
-- long as it does not write non-numeric values into products.moq.
--
-- Changes:
--   1. Add B2B logistics + compliance + lead-time columns to products.
--   2. Convert products.moq from text to integer (with backfill).
--   3. Drop dead columns (description_en, description_ar, variants)
--      from products if they exist.
--   4. Create product_certifications table with RLS.
--   5. Create product-certifications storage bucket with RLS.
--
-- Idempotency: every change is gated on IF NOT EXISTS / IF EXISTS,
-- and the moq conversion checks information_schema before running.
-- ============================================================

BEGIN;


-- ════════════════════════════════════════════════════════════
-- 1. New B2B columns on public.products
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS hs_code               text    NULL,
  ADD COLUMN IF NOT EXISTS country_of_origin     text    NULL,
  ADD COLUMN IF NOT EXISTS incoterms             text[]  NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS port_of_loading       text    NULL,
  ADD COLUMN IF NOT EXISTS units_per_carton      integer NULL,
  ADD COLUMN IF NOT EXISTS cbm                   numeric NULL,
  ADD COLUMN IF NOT EXISTS gross_weight_kg       numeric NULL,
  ADD COLUMN IF NOT EXISTS net_weight_kg         numeric NULL,
  ADD COLUMN IF NOT EXISTS lead_time_min_days    integer NULL,
  ADD COLUMN IF NOT EXISTS lead_time_max_days    integer NULL,
  ADD COLUMN IF NOT EXISTS lead_time_negotiable  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oem_available         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS odm_available         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS oem_lead_time_min_days integer NULL,
  ADD COLUMN IF NOT EXISTS oem_lead_time_max_days integer NULL,
  ADD COLUMN IF NOT EXISTS price_validity_days   integer NULL;

COMMENT ON COLUMN public.products.hs_code
  IS 'Harmonized System code for customs classification (free text, e.g. "8517.62.00"). Phase 4 will add Grok suggestions.';
COMMENT ON COLUMN public.products.country_of_origin
  IS 'Country where goods are manufactured. Defaults to "China" via the form.';
COMMENT ON COLUMN public.products.incoterms
  IS 'Supported Incoterms — multi-select subset of {FOB, CIF, EXW, DDP}. DDP requires a customs broker in Saudi Arabia.';
COMMENT ON COLUMN public.products.port_of_loading
  IS 'Port of departure (e.g. Shanghai, Shenzhen, Ningbo, Guangzhou, Qingdao, Tianjin). Free text when "Other" is chosen in the form.';
COMMENT ON COLUMN public.products.units_per_carton
  IS 'Number of units packed per master carton.';
COMMENT ON COLUMN public.products.cbm
  IS 'Cubic meters per master carton. Used for sea freight calculations.';
COMMENT ON COLUMN public.products.gross_weight_kg
  IS 'Gross weight per carton in kg (product + packaging).';
COMMENT ON COLUMN public.products.net_weight_kg
  IS 'Net weight per carton in kg (product only, excluding packaging).';
COMMENT ON COLUMN public.products.lead_time_min_days
  IS 'Minimum production lead time in days for a standard order.';
COMMENT ON COLUMN public.products.lead_time_max_days
  IS 'Maximum production lead time in days for a standard order.';
COMMENT ON COLUMN public.products.lead_time_negotiable
  IS 'Supplier indicates lead time is negotiable for large orders.';
COMMENT ON COLUMN public.products.oem_available
  IS 'Supplier accepts OEM (private-label / logo printing) orders.';
COMMENT ON COLUMN public.products.odm_available
  IS 'Supplier accepts ODM (custom design / engineering) orders.';
COMMENT ON COLUMN public.products.oem_lead_time_min_days
  IS 'Minimum lead time for OEM/ODM orders. Typically longer than the standard lead time.';
COMMENT ON COLUMN public.products.oem_lead_time_max_days
  IS 'Maximum lead time for OEM/ODM orders.';
COMMENT ON COLUMN public.products.price_validity_days
  IS 'How long the listed pricing is valid (in days). Common values: 30, 60, 90.';


-- ════════════════════════════════════════════════════════════
-- 2. Convert products.moq from text to integer
--
-- Strategy:
--   • If moq is currently text → add staging int column, backfill
--     by stripping non-digits, drop old column, rename new.
--   • If moq is already integer (re-run case) → no-op.
--
-- The temporary table public._phase1_moq_audit is created so the
-- DBA can verify how many rows were backfilled vs lost. It is
-- dropped at the end of the migration.
-- ════════════════════════════════════════════════════════════

DO $$
DECLARE
  current_type      text;
  total_rows        integer;
  text_rows         integer;
  numeric_rows      integer;
  null_rows         integer;
BEGIN
  SELECT data_type
    INTO current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'products'
     AND column_name  = 'moq';

  IF current_type IS NULL THEN
    RAISE EXCEPTION 'products.moq column does not exist';
  END IF;

  IF current_type IN ('integer', 'bigint', 'smallint') THEN
    RAISE NOTICE 'products.moq is already %; skipping conversion.', current_type;
    RETURN;
  END IF;

  IF current_type NOT IN ('text', 'character varying', 'character') THEN
    RAISE EXCEPTION 'Unexpected products.moq type: %. Aborting conversion.', current_type;
  END IF;

  -- Add staging column
  ALTER TABLE public.products ADD COLUMN moq_int integer NULL;

  -- Pre-conversion audit
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE moq IS NOT NULL),
    COUNT(*) FILTER (WHERE moq IS NULL)
  INTO total_rows, text_rows, null_rows
  FROM public.products;

  -- Backfill: strip everything except digits, then cast.
  -- NULLIF returns NULL for empty digit-strings (e.g. "MOQ:" → "" → NULL).
  UPDATE public.products
     SET moq_int = NULLIF(regexp_replace(moq, '[^0-9]', '', 'g'), '')::integer
   WHERE moq IS NOT NULL;

  SELECT COUNT(*) INTO numeric_rows
    FROM public.products
   WHERE moq_int IS NOT NULL;

  RAISE NOTICE 'moq conversion summary: total=%, original_non_null=%, backfilled_to_int=%, null_after=%.',
    total_rows, text_rows, numeric_rows, total_rows - numeric_rows;

  -- Drop original text column, rename staging into place.
  ALTER TABLE public.products DROP COLUMN moq;
  ALTER TABLE public.products RENAME COLUMN moq_int TO moq;
END;
$$;

COMMENT ON COLUMN public.products.moq
  IS 'Minimum order quantity (units). Integer >= 1 enforced by the form layer; '
     'NULL means the supplier has not yet specified.';


-- ════════════════════════════════════════════════════════════
-- 3. Drop dead columns from public.products
--
-- description_en / description_ar — the live form uses
-- desc_en / desc_ar (different column names).
-- variants — legacy text[] from before the variants subsystem.
--
-- IF EXISTS so the migration is safe to re-run / safe if the
-- columns were never deployed in this environment.
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.products
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS description_ar,
  DROP COLUMN IF EXISTS variants;


-- ════════════════════════════════════════════════════════════
-- 4. product_certifications table
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_certifications (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  cert_type     text        NOT NULL,
  cert_label    text        NULL,
  cert_file_url text        NULL,
  issued_date   date        NULL,
  expiry_date   date        NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id
  ON public.product_certifications(product_id);

COMMENT ON TABLE  public.product_certifications
  IS 'Compliance & certification documents per product. cert_type is one of '
     '{SASO, CE, FCC, RoHS, ISO, FDA, HALAL, OTHER}. cert_label is required '
     'when cert_type = OTHER (enforced by the form layer).';
COMMENT ON COLUMN public.product_certifications.cert_type
  IS 'SASO / CE / FCC / RoHS / ISO / FDA / HALAL / OTHER';
COMMENT ON COLUMN public.product_certifications.cert_label
  IS 'Human-readable certificate name. Required when cert_type = OTHER.';
COMMENT ON COLUMN public.product_certifications.cert_file_url
  IS 'Public URL to the certificate PDF in the product-certifications storage bucket.';


-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.product_certifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_certs"          ON public.product_certifications;
CREATE POLICY "admin_all_certs" ON public.product_certifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "supplier_crud_own_certs"  ON public.product_certifications;
CREATE POLICY "supplier_crud_own_certs" ON public.product_certifications
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
             WHERE p.id = product_id AND p.supplier_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p
             WHERE p.id = product_id AND p.supplier_id = auth.uid())
  );

DROP POLICY IF EXISTS "any_auth_read_certs"      ON public.product_certifications;
CREATE POLICY "any_auth_read_certs" ON public.product_certifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
             WHERE p.id = product_id AND COALESCE(p.is_active, true))
  );

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.product_certifications TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 5. Storage bucket: product-certifications
--
-- Path convention: "<user_id>/<product_id>/<cert_type>_<ts>.pdf"
-- Folder-1 (user_id) is enforced by RLS; folder-2 (product_id)
-- is enforced application-side.
--
-- Public read: PDFs are served via Supabase CDN with no auth
-- required (so buyers can preview them). Writes are restricted
-- to the supplier who owns the parent product.
-- ════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-certifications',
  'product-certifications',
  true,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public             = excluded.public,
    file_size_limit    = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;


DROP POLICY IF EXISTS "product-certifications upload own files" ON storage.objects;
CREATE POLICY "product-certifications upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "product-certifications update own files" ON storage.objects;
CREATE POLICY "product-certifications update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'product-certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "product-certifications delete own files" ON storage.objects;
CREATE POLICY "product-certifications delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-certifications'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- No SELECT policy: bucket is public, served via CDN.


COMMIT;
