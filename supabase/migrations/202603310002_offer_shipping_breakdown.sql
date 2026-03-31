begin;

alter table if exists public.offers
  add column if not exists shipping_cost numeric,
  add column if not exists shipping_method text;

alter table if exists public.offers
  drop constraint if exists offers_shipping_cost_non_negative;

alter table if exists public.offers
  add constraint offers_shipping_cost_non_negative
  check (shipping_cost is null or shipping_cost >= 0);

comment on column public.offers.shipping_cost is 'Estimated shipping cost for the full quoted request/order, separate from unit product price.';
comment on column public.offers.shipping_method is 'Optional supplier-entered shipping method/terms for the quote (for example Sea Freight, Air Freight, EXW, FOB).';

commit;
