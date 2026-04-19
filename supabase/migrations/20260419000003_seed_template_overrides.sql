-- Seed default template override rows so the editor has entries to work with.
-- is_active=false means these are placeholders (not yet overriding defaults).
INSERT INTO public.template_overrides (template_name, is_active) VALUES
  ('supplier_welcome',          false),
  ('supplier_approved',         false),
  ('supplier_rejected',         false),
  ('buyer_welcome',             false),
  ('email_confirmation',        false),
  ('order_confirmed',           false),
  ('order_shipped',             false),
  ('order_delivered',           false),
  ('support_ticket_received',   false),
  ('support_ticket_reply',      false),
  ('dispute_opened',            false),
  ('dispute_resolved',          false),
  ('password_reset',            false)
ON CONFLICT (template_name) DO NOTHING;
