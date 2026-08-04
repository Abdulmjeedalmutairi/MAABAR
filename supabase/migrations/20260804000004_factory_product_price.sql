-- Factory product pricing (reverses the earlier "quote-based only, no fixed
-- prices" decision). Some catalogs DO print prices — fixed or tiered/ranged —
-- so we capture them verbatim and show them when present.
--
--   price    — free text as printed: "$12", "10–15", "from 100pcs: $8".
--              Flexible on purpose so fixed AND ranged/tiered prices both fit.
--   currency — optional currency label ("USD", "SAR"); leave empty when the
--              price text already shows a symbol.
--
-- Products with no price keep the existing "On request" behaviour on the public
-- pages. Buyer-visible; no view change needed (product pages read the base table).

alter table public.factory_products
  add column if not exists price text;

alter table public.factory_products
  add column if not exists currency text;
