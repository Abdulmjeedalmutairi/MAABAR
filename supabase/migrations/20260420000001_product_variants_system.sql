-- ============================================================
-- Product Variants System — Phase 1 DB Migration
-- Branch: feature/product-variants
--
-- New tables:
--   product_options, product_option_values, product_variants,
--   product_pricing_tiers, product_shipping_options,
--   order_line_items
--
-- Modified tables:
--   products (has_variants, unit_weight_kg, package_dimensions,
--              sample_free_from_qty)
--   samples (variant_id)
--   product_inquiries (variant_id)
--
-- Safety: all changes are additive / IF NOT EXISTS.
--         Existing flat products are untouched (has_variants = false).
-- ============================================================

BEGIN;


-- ════════════════════════════════════════════════════════════
-- 0. Extend products table
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_variants         boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unit_weight_kg       numeric NULL,
  ADD COLUMN IF NOT EXISTS package_dimensions   text    NULL,
  ADD COLUMN IF NOT EXISTS sample_free_from_qty integer NULL;

COMMENT ON COLUMN public.products.has_variants
  IS 'True when supplier has configured the variant builder. Flat products remain false; their existing price/moq fields are unaffected.';
COMMENT ON COLUMN public.products.unit_weight_kg
  IS 'Per-unit gross weight in kg. Used for shipping cost estimates.';
COMMENT ON COLUMN public.products.package_dimensions
  IS 'Outer carton dimensions as free text, e.g. "15 × 10 × 5 cm".';
COMMENT ON COLUMN public.products.sample_free_from_qty
  IS 'Minimum committed quantity at which samples become free. NULL = samples always paid.';


-- ════════════════════════════════════════════════════════════
-- 1. product_options
--    One row per option axis (e.g. "Color", "Size", "Material").
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_options (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name_zh       text        NOT NULL,
  name_en       text,
  name_ar       text,
  display_order integer     NOT NULL DEFAULT 0,
  input_type    text        NOT NULL DEFAULT 'select'
    CHECK (input_type IN ('select', 'color_swatch', 'size_chart', 'text')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_product_id    ON public.product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_po_display_order ON public.product_options(product_id, display_order);

COMMENT ON TABLE  public.product_options
  IS 'One option axis per row (e.g. Color, Size). Trilingual names. input_type drives the buyer selector widget.';
COMMENT ON COLUMN public.product_options.name_zh
  IS 'Option name in Chinese — required, supplier-primary language.';
COMMENT ON COLUMN public.product_options.input_type
  IS 'Buyer selector widget: select=pill buttons, color_swatch=color circles, size_chart=pills+chart link, text=open input.';


-- ════════════════════════════════════════════════════════════
-- 2. product_option_values
--    One row per leaf value within an option axis.
--    e.g. "Black", "White", "Custom" under "Color".
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_option_values (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id     uuid        NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  value_zh      text        NOT NULL,
  value_en      text,
  value_ar      text,
  color_hex     text        NULL,
  image_url     text        NULL,
  display_order integer     NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_pov_option_id     ON public.product_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_pov_display_order ON public.product_option_values(option_id, display_order);

COMMENT ON TABLE  public.product_option_values
  IS 'Leaf values of an option axis. Trilingual names. color_hex populated for color_swatch type.';
COMMENT ON COLUMN public.product_option_values.color_hex
  IS 'CSS hex color for color_swatch rendering, e.g. "#1A2B3C". Only meaningful when parent option.input_type = color_swatch.';
COMMENT ON COLUMN public.product_option_values.image_url
  IS 'Optional image shown in buyer gallery when this value is selected (e.g. product photo in that color).';


-- ════════════════════════════════════════════════════════════
-- 3. product_variants
--    One row per SKU — a unique combination of option values.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_variants (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku            text        UNIQUE,
  option_values  jsonb       NOT NULL DEFAULT '[]'::jsonb,
  -- option_values format: [{option_id: uuid, value_id: uuid}, ...]
  -- order matches product_options.display_order
  price          numeric     NULL CHECK (price IS NULL OR price >= 0),
  moq            integer     NULL CHECK (moq IS NULL OR moq >= 1),
  stock          integer     NULL CHECK (stock IS NULL OR stock >= 0),
  lead_time_days integer     NULL CHECK (lead_time_days IS NULL OR lead_time_days >= 0),
  image_url      text        NULL,
  is_active      boolean     NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pv_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_pv_sku        ON public.product_variants(sku)        WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pv_is_active  ON public.product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_pv_created_at ON public.product_variants(created_at);

COMMENT ON TABLE  public.product_variants
  IS 'Each row is one SKU — a unique combination of option values. NULL price/moq/lead_time_days inherits from the parent product row.';
COMMENT ON COLUMN public.product_variants.option_values
  IS 'Array of {option_id, value_id} pairs identifying this combination. Order matches product_options.display_order.';
COMMENT ON COLUMN public.product_variants.stock
  IS 'Available stock units. NULL = made-to-order (no inventory limit).';
COMMENT ON COLUMN public.product_variants.sku
  IS 'Human-readable code, e.g. "SH-TWS-BLK-WLC". Auto-generated by the supplier UI from product code + value initials.';

CREATE OR REPLACE FUNCTION public.touch_product_variant_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pv_updated_at ON public.product_variants;
CREATE TRIGGER trg_pv_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.touch_product_variant_updated_at();

-- Guard: block deactivating a variant that has active order line items.
-- Price/MOQ edits are allowed freely — committed line items hold a price snapshot.
CREATE OR REPLACE FUNCTION public.guard_variant_deactivation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  active_count integer;
BEGIN
  IF OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.is_active = false THEN
    SELECT COUNT(*)
    INTO active_count
    FROM public.order_line_items oli
    JOIN public.requests r ON r.id = oli.order_id
    WHERE oli.variant_id = NEW.id
      AND r.status NOT IN ('delivered', 'cancelled');

    IF active_count > 0 THEN
      RAISE EXCEPTION
        'Variant % cannot be deactivated — it has % active order line item(s). '
        'Wait for those requests to complete or be cancelled first.',
        COALESCE(NEW.sku, NEW.id::text), active_count
        USING ERRCODE = 'integrity_constraint_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_variant_deactivation ON public.product_variants;
CREATE TRIGGER trg_guard_variant_deactivation
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.guard_variant_deactivation();


-- ════════════════════════════════════════════════════════════
-- 4. product_pricing_tiers
--    Alibaba-style wholesale tiered pricing.
--    variant_id NULL = tier applies to all variants of the product.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_pricing_tiers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id  uuid        NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  qty_from    integer     NOT NULL CHECK (qty_from >= 1),
  qty_to      integer     NULL     CHECK (qty_to IS NULL OR qty_to >= qty_from),
  unit_price  numeric     NOT NULL CHECK (unit_price > 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ppt_product_id ON public.product_pricing_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_ppt_variant_id ON public.product_pricing_tiers(variant_id) WHERE variant_id IS NOT NULL;

COMMENT ON TABLE  public.product_pricing_tiers
  IS 'Wholesale tiered pricing. variant_id NULL = tier applies to all variants. Non-overlapping ranges enforced by application layer.';
COMMENT ON COLUMN public.product_pricing_tiers.qty_to
  IS 'Upper boundary (inclusive). NULL = this tier extends to infinity (open-ended top tier).';


-- ════════════════════════════════════════════════════════════
-- 5. product_shipping_options
--    Available shipping methods per product.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.product_shipping_options (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  method              text        NOT NULL
    CHECK (method IN ('sea', 'air', 'express', 'land')),
  is_available        boolean     NOT NULL DEFAULT true,
  lead_time_min_days  integer     NULL CHECK (lead_time_min_days IS NULL OR lead_time_min_days >= 0),
  lead_time_max_days  integer     NULL CHECK (
    lead_time_max_days IS NULL OR
    lead_time_min_days IS NULL OR
    lead_time_max_days >= lead_time_min_days
  ),
  cost_per_unit_usd   numeric     NULL CHECK (cost_per_unit_usd IS NULL OR cost_per_unit_usd >= 0),
  UNIQUE (product_id, method)
);

CREATE INDEX IF NOT EXISTS idx_pso_product_id ON public.product_shipping_options(product_id);

COMMENT ON TABLE  public.product_shipping_options
  IS 'Available shipping methods per product with lead-time ranges and per-unit cost estimates to Riyadh.';
COMMENT ON COLUMN public.product_shipping_options.method
  IS 'sea | air | express | land';
COMMENT ON COLUMN public.product_shipping_options.cost_per_unit_usd
  IS 'Estimated per-unit shipping cost in USD to Riyadh. NULL = supplier will confirm on quote.';


-- ════════════════════════════════════════════════════════════
-- 6. order_line_items
--    Per-variant line items for a buyer request.
--    Supports mixed-variant orders in a single transaction.
--    order_id references requests.id for Phase 1-3;
--    Phase 4 will wire it to orders.id when payment is integrated.
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.order_line_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid        NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  product_id      uuid        NOT NULL REFERENCES public.products(id),
  variant_id      uuid        NULL REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity        integer     NOT NULL CHECK (quantity > 0),
  unit_price_usd  numeric     NOT NULL CHECK (unit_price_usd >= 0),
  line_total_usd  numeric     GENERATED ALWAYS AS (quantity * unit_price_usd) STORED,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oli_order_id   ON public.order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_oli_product_id ON public.order_line_items(product_id);
CREATE INDEX IF NOT EXISTS idx_oli_variant_id ON public.order_line_items(variant_id) WHERE variant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oli_created_at ON public.order_line_items(created_at);

COMMENT ON TABLE  public.order_line_items
  IS 'Per-variant line items for a buyer request. Supports mixed-variant orders. Price is a snapshot at submission time.';
COMMENT ON COLUMN public.order_line_items.order_id
  IS 'References requests.id in Phase 1. Will be amended to reference orders.id in Phase 4.';
COMMENT ON COLUMN public.order_line_items.line_total_usd
  IS 'Computed: quantity × unit_price_usd. Stored snapshot — not recalculated on later price changes.';


-- ════════════════════════════════════════════════════════════
-- 7. Extend existing tables with variant_id
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS variant_id uuid NULL
    REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_samples_variant_id
  ON public.samples(variant_id) WHERE variant_id IS NOT NULL;

COMMENT ON COLUMN public.samples.variant_id
  IS 'Optional: links sample request to a specific variant (e.g. black color, L size).';


ALTER TABLE public.product_inquiries
  ADD COLUMN IF NOT EXISTS variant_id uuid NULL
    REFERENCES public.product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pi_variant_id
  ON public.product_inquiries(variant_id) WHERE variant_id IS NOT NULL;

COMMENT ON COLUMN public.product_inquiries.variant_id
  IS 'Optional: links inquiry to a specific variant.';


-- ── requests.variant_ref ─────────────────────────────────────
-- Used for single-variant direct buy ("Buy Now" path).
-- Loose text reference — mirrors product_ref design (no FK, survives variant deletion).
-- For mixed-variant orders, order_line_items is the authoritative source.

ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS variant_ref text NULL;

COMMENT ON COLUMN public.requests.variant_ref
  IS 'Variant UUID stored as text for single-variant direct buy. No FK — mirrors product_ref. '
     'For multi-variant orders use order_line_items instead.';


-- ════════════════════════════════════════════════════════════
-- 8. RLS Policies
-- ════════════════════════════════════════════════════════════

-- ── product_options ──────────────────────────────────────────

ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_product_options" ON public.product_options
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_crud_own_product_options" ON public.product_options
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  );

CREATE POLICY "any_auth_read_product_options" ON public.product_options
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND COALESCE(p.is_active, true))
  );


-- ── product_option_values ────────────────────────────────────

ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_product_option_values" ON public.product_option_values
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_crud_own_option_values" ON public.product_option_values
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_options po
      JOIN public.products p ON p.id = po.product_id
      WHERE po.id = option_id AND p.supplier_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_options po
      JOIN public.products p ON p.id = po.product_id
      WHERE po.id = option_id AND p.supplier_id = auth.uid()
    )
  );

CREATE POLICY "any_auth_read_option_values" ON public.product_option_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_options po
      JOIN public.products p ON p.id = po.product_id
      WHERE po.id = option_id AND COALESCE(p.is_active, true)
    )
  );


-- ── product_variants ─────────────────────────────────────────

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_product_variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_crud_own_variants" ON public.product_variants
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  );

-- Buyers can read all active variants of active products.
-- Admin override for inactive variants is handled by admin_all policy above.
CREATE POLICY "any_auth_read_active_variants" ON public.product_variants
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.products p
                WHERE p.id = product_id AND COALESCE(p.is_active, true))
  );


-- ── product_pricing_tiers ────────────────────────────────────

ALTER TABLE public.product_pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_pricing_tiers" ON public.product_pricing_tiers
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_crud_own_pricing_tiers" ON public.product_pricing_tiers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  );

CREATE POLICY "any_auth_read_pricing_tiers" ON public.product_pricing_tiers
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND COALESCE(p.is_active, true))
  );


-- ── product_shipping_options ─────────────────────────────────

ALTER TABLE public.product_shipping_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_shipping_options" ON public.product_shipping_options
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_crud_own_shipping_options" ON public.product_shipping_options
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND p.supplier_id = auth.uid())
  );

CREATE POLICY "any_auth_read_shipping_options" ON public.product_shipping_options
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products p
            WHERE p.id = product_id AND COALESCE(p.is_active, true))
  );


-- ── order_line_items ─────────────────────────────────────────

ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_line_items" ON public.order_line_items
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Buyer owns the request → owns its line items
CREATE POLICY "buyer_crud_own_line_items" ON public.order_line_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.requests r
            WHERE r.id = order_id AND r.buyer_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.requests r
            WHERE r.id = order_id AND r.buyer_id = auth.uid())
  );

-- Supplier can read line items for requests where they have submitted an offer
-- or where line items reference their own products
CREATE POLICY "supplier_read_relevant_line_items" ON public.order_line_items
  FOR SELECT TO authenticated
  USING (
    product_id IN (
      SELECT id FROM public.products WHERE supplier_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.request_id = order_id AND o.supplier_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════
-- 9. GRANTS
-- ════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_options         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_option_values   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_pricing_tiers   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_shipping_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_line_items        TO authenticated;


COMMIT;
