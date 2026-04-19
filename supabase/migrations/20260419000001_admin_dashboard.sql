-- ============================================================
-- Admin Dashboard — full schema migration
-- Tables: managed_requests, managed_request_suppliers,
--         concierge_requests, concierge_connections,
--         admin_notes, support_tickets, disputes,
--         email_logs, template_overrides, audit_log
-- Plus: role constraint update, super_admin promotion, RLS
-- ============================================================


-- ── 0. Profiles role — add super_admin ───────────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('buyer', 'supplier', 'admin', 'super_admin'));


-- ── 1. Promote Abdulmjeed to super_admin ─────────────────────
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'mjeedalmutairis@gmail.com'
  LIMIT 1
);


-- ── 2. managed_requests ──────────────────────────────────────
CREATE TABLE public.managed_requests (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL    DEFAULT now(),
  updated_at            timestamptz NOT NULL    DEFAULT now(),
  buyer_id              uuid        REFERENCES public.profiles(id),
  title                 text        NOT NULL,
  description           text,
  category              text,
  quantity              numeric,
  unit                  text,
  target_price          numeric,
  currency              text                    DEFAULT 'SAR',
  deadline              date,
  status                text        NOT NULL    DEFAULT 'open'
    CHECK (status IN ('open','assigned','sourcing','completed','cancelled')),
  admin_assignee_id     uuid        REFERENCES public.profiles(id),
  internal_notes        text,
  attachments           jsonb       NOT NULL    DEFAULT '[]'::jsonb,
  final_report          jsonb,
  sent_to_trader_at     timestamptz,
  trader_decision       text
    CHECK (trader_decision IS NULL OR trader_decision IN ('accepted','rejected','re_research_requested')),
  trader_decision_note  text,
  trader_decision_at    timestamptz
);


-- ── 3. managed_request_suppliers ─────────────────────────────
CREATE TABLE public.managed_request_suppliers (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id            uuid        NOT NULL REFERENCES public.managed_requests(id) ON DELETE CASCADE,
  supplier_id           uuid        REFERENCES public.profiles(id),
  added_at              timestamptz NOT NULL DEFAULT now(),
  added_by              uuid        REFERENCES public.profiles(id),
  status                text        NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','responded','shortlisted','rejected')),
  response_notes        text,
  unit_price            numeric,
  moq                   integer,
  delivery_days         integer,
  admin_recommendation  text
    CHECK (admin_recommendation IS NULL OR admin_recommendation IN ('best_quality','best_price','fastest'))
);


-- ── 4. concierge_requests ────────────────────────────────────
CREATE TABLE public.concierge_requests (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  requester_id              uuid        REFERENCES public.profiles(id),
  request_type              text
    CHECK (request_type IS NULL OR request_type IN ('sourcing','factory_visit','sample','custom')),
  description               text,
  budget                    numeric,
  currency                  text        DEFAULT 'SAR',
  status                    text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','matched','closed')),
  admin_assignee_id         uuid        REFERENCES public.profiles(id),
  summary                   jsonb,
  assistant_suggestion      text,
  converted_to_request_id   uuid        REFERENCES public.requests(id)
);


-- ── 5. concierge_connections ─────────────────────────────────
CREATE TABLE public.concierge_connections (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  concierge_id          uuid        NOT NULL REFERENCES public.concierge_requests(id) ON DELETE CASCADE,
  supplier_id           uuid        REFERENCES public.profiles(id),
  connected_by          uuid        REFERENCES public.profiles(id),
  status                text        NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','closed')),
  notes                 text,
  chat_id               uuid,
  admin_interventions   integer     NOT NULL DEFAULT 0
);


-- ── 6. admin_notes ───────────────────────────────────────────
CREATE TABLE public.admin_notes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  author_id   uuid        REFERENCES public.profiles(id),
  entity_type text        NOT NULL
    CHECK (entity_type IN ('supplier','trader','order','managed_request','concierge','dispute','ticket')),
  entity_id   uuid        NOT NULL,
  body        text        NOT NULL,
  is_pinned   boolean     NOT NULL DEFAULT false
);


-- ── 7. support_tickets ───────────────────────────────────────
CREATE TABLE public.support_tickets (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  user_id     uuid        REFERENCES public.profiles(id),
  subject     text        NOT NULL,
  body        text,
  status      text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  priority    text        NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid        REFERENCES public.profiles(id),
  resolved_at timestamptz
);


-- ── 8. disputes ──────────────────────────────────────────────
CREATE TABLE public.disputes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  raised_by   uuid        REFERENCES public.profiles(id),
  against_id  uuid        REFERENCES public.profiles(id),
  request_id  uuid        REFERENCES public.requests(id),
  reason      text        NOT NULL,
  description text,
  status      text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','mediating','resolved_buyer','resolved_supplier','settled','dismissed')),
  severity    text        NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('high','medium','low')),
  resolution  text,
  resolved_by uuid        REFERENCES public.profiles(id),
  resolved_at timestamptz
);


-- ── 9. email_logs ────────────────────────────────────────────
CREATE TABLE public.email_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  recipient_email text        NOT NULL,
  recipient_id    uuid        REFERENCES public.profiles(id),
  template_name   text        NOT NULL,
  subject         text,
  status          text        NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent','failed','bounced')),
  error_message   text,
  metadata        jsonb
);


-- ── 10. template_overrides ───────────────────────────────────
CREATE TABLE public.template_overrides (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by       uuid        REFERENCES public.profiles(id),
  template_name    text        NOT NULL UNIQUE,
  subject_override text,
  body_override    text,
  is_active        boolean     NOT NULL DEFAULT true
);


-- ── 11. audit_log ────────────────────────────────────────────
CREATE TABLE public.audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  actor_id     uuid        REFERENCES public.profiles(id),
  action       text        NOT NULL,
  entity_type  text,
  entity_id    uuid,
  before_state jsonb,
  after_state  jsonb,
  ip_address   text,
  user_agent   text,
  notes        text
);


-- ── 12. INDEXES ──────────────────────────────────────────────

-- managed_requests
CREATE INDEX idx_mr_status           ON public.managed_requests(status);
CREATE INDEX idx_mr_buyer_id         ON public.managed_requests(buyer_id);
CREATE INDEX idx_mr_assignee_id      ON public.managed_requests(admin_assignee_id);
CREATE INDEX idx_mr_created_at       ON public.managed_requests(created_at);
CREATE INDEX idx_mr_trader_decision  ON public.managed_requests(trader_decision);

-- managed_request_suppliers
CREATE INDEX idx_mrs_request_id    ON public.managed_request_suppliers(request_id);
CREATE INDEX idx_mrs_supplier_id   ON public.managed_request_suppliers(supplier_id);
CREATE INDEX idx_mrs_added_by      ON public.managed_request_suppliers(added_by);
CREATE INDEX idx_mrs_status        ON public.managed_request_suppliers(status);
CREATE INDEX idx_mrs_added_at      ON public.managed_request_suppliers(added_at);

-- concierge_requests
CREATE INDEX idx_cr_status          ON public.concierge_requests(status);
CREATE INDEX idx_cr_requester_id    ON public.concierge_requests(requester_id);
CREATE INDEX idx_cr_assignee_id     ON public.concierge_requests(admin_assignee_id);
CREATE INDEX idx_cr_created_at      ON public.concierge_requests(created_at);

-- concierge_connections
CREATE INDEX idx_cc_concierge_id  ON public.concierge_connections(concierge_id);
CREATE INDEX idx_cc_supplier_id   ON public.concierge_connections(supplier_id);
CREATE INDEX idx_cc_connected_by  ON public.concierge_connections(connected_by);
CREATE INDEX idx_cc_status        ON public.concierge_connections(status);
CREATE INDEX idx_cc_created_at    ON public.concierge_connections(created_at);

-- admin_notes
CREATE INDEX idx_an_entity      ON public.admin_notes(entity_type, entity_id);
CREATE INDEX idx_an_author_id   ON public.admin_notes(author_id);
CREATE INDEX idx_an_created_at  ON public.admin_notes(created_at);

-- support_tickets
CREATE INDEX idx_st_status       ON public.support_tickets(status);
CREATE INDEX idx_st_priority     ON public.support_tickets(priority);
CREATE INDEX idx_st_user_id      ON public.support_tickets(user_id);
CREATE INDEX idx_st_assigned_to  ON public.support_tickets(assigned_to);
CREATE INDEX idx_st_created_at   ON public.support_tickets(created_at);

-- disputes
CREATE INDEX idx_di_status      ON public.disputes(status);
CREATE INDEX idx_di_severity    ON public.disputes(severity);
CREATE INDEX idx_di_raised_by   ON public.disputes(raised_by);
CREATE INDEX idx_di_against_id  ON public.disputes(against_id);
CREATE INDEX idx_di_request_id  ON public.disputes(request_id);
CREATE INDEX idx_di_created_at  ON public.disputes(created_at);

-- email_logs
CREATE INDEX idx_el_status          ON public.email_logs(status);
CREATE INDEX idx_el_recipient_id    ON public.email_logs(recipient_id);
CREATE INDEX idx_el_template_name   ON public.email_logs(template_name);
CREATE INDEX idx_el_created_at      ON public.email_logs(created_at);

-- template_overrides
CREATE INDEX idx_to_updated_at  ON public.template_overrides(updated_at);

-- audit_log
CREATE INDEX idx_al_actor_id    ON public.audit_log(actor_id);
CREATE INDEX idx_al_entity      ON public.audit_log(entity_type, entity_id);
CREATE INDEX idx_al_action      ON public.audit_log(action);
CREATE INDEX idx_al_created_at  ON public.audit_log(created_at);


-- ── 13. is_admin() helper ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;


-- ── 14. RLS ──────────────────────────────────────────────────

-- managed_requests
ALTER TABLE public.managed_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_managed_requests" ON public.managed_requests
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "buyer_read_own_managed_requests" ON public.managed_requests
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());


-- managed_request_suppliers
ALTER TABLE public.managed_request_suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_mrs" ON public.managed_request_suppliers
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_read_own_mrs" ON public.managed_request_suppliers
  FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());


-- concierge_requests
ALTER TABLE public.concierge_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_concierge_requests" ON public.concierge_requests
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "requester_read_own_concierge" ON public.concierge_requests
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid());


-- concierge_connections
ALTER TABLE public.concierge_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_concierge_connections" ON public.concierge_connections
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "supplier_read_own_connections" ON public.concierge_connections
  FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());


-- admin_notes (admin only, no user access)
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_notes" ON public.admin_notes
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_tickets" ON public.support_tickets
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "user_read_own_tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());


-- disputes
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_disputes" ON public.disputes
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "party_read_own_disputes" ON public.disputes
  FOR SELECT TO authenticated
  USING (raised_by = auth.uid() OR against_id = auth.uid());


-- email_logs (admin read-only; service role inserts via edge function)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_email_logs" ON public.email_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "insert_email_logs" ON public.email_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);


-- template_overrides (admin only)
ALTER TABLE public.template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_template_overrides" ON public.template_overrides
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- audit_log (append-only: select for admin, insert for authenticated, no update/delete)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit_log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "insert_audit_log" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid() OR public.is_admin());
