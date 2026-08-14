-- Order/chat invoice — richer order detail. line_items (jsonb) already holds one
-- row per VARIANT (color/size/qty/unit); specs holds the shared order details the
-- premium invoice renders (material, colors, sizes, customization, packaging, lead
-- time, sample, warranty, destination, notes, …) as a free key/label object.
begin;

alter table public.order_invoices
  add column if not exists specs jsonb;

commit;
