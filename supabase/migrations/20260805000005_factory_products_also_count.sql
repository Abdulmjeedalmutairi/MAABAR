-- Curated catalog import: on the representative product kept for a category, how
-- many OTHER products in that same category were curated away. Surfaced to buyers
-- as a "+N more options" badge so they know the factory's range in that category
-- is deeper than the curated highlight reel shows. 0 (default) = no badge.
alter table public.factory_products
  add column if not exists also_count integer not null default 0;
