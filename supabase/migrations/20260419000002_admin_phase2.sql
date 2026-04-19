-- ============================================================
-- Admin Phase 2 — orders, admin_settings, ticket_messages
-- ============================================================

-- ── 1. orders ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  buyer_id             uuid        REFERENCES public.profiles(id),
  supplier_id          uuid        REFERENCES public.profiles(id),
  request_id           uuid        REFERENCES public.requests(id),
  status               text        NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded','disputed')),
  amount               numeric     NOT NULL DEFAULT 0,
  currency             text        NOT NULL DEFAULT 'SAR',
  platform_fee_pct     numeric     NOT NULL DEFAULT 5,
  platform_fee_amount  numeric,
  payment_reference    text,
  payment_method       text,
  notes                text,
  shipped_at           timestamptz,
  delivered_at         timestamptz,
  refunded_at          timestamptz,
  refund_reason        text
);

CREATE INDEX IF NOT EXISTS idx_ord_status       ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_ord_buyer_id     ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ord_supplier_id  ON public.orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ord_created_at   ON public.orders(created_at);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_orders" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "buyer_read_own_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "supplier_read_own_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());


-- ── 2. admin_settings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid        REFERENCES public.profiles(id)
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_settings" ON public.admin_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.admin_settings (key, value) VALUES
  ('platform_fee_pct',     '{"value": 5}'::jsonb),
  ('maintenance_mode',     '{"enabled": false, "message": ""}'::jsonb),
  ('founding_club_active', '{"enabled": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ── 3. ticket_messages ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  ticket_id      uuid        NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id      uuid        REFERENCES public.profiles(id),
  body           text        NOT NULL,
  is_admin_reply boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_tm_ticket_id  ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tm_created_at ON public.ticket_messages(created_at);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_ticket_messages" ON public.ticket_messages
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "user_read_own_ticket_messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT id FROM public.support_tickets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "user_insert_own_ticket_messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    ticket_id IN (
      SELECT id FROM public.support_tickets WHERE user_id = auth.uid()
    )
  );
