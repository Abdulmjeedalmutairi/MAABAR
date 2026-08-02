-- factory_products: support multiple images per product (gallery).
--
-- Additive + safe. `image` stays the PRIMARY/thumbnail (catalog grid + the future
-- Catalog Import tool); `gallery_images` holds the ordered EXTRA images. The new
-- product detail page renders [image, ...gallery_images] deduped (cap 8). Empty
-- today, so the page shows the single `image` until Catalog Import / manual entry
-- populates the array.
--
-- No RLS change: factory_products_public_read (anon + authenticated SELECT) already
-- covers new columns; writes stay admin-only (factory_products_admin_write).
begin;

alter table public.factory_products
  add column if not exists gallery_images text[] not null default '{}';

comment on column public.factory_products.gallery_images is
  'Ordered EXTRA catalog images beyond the primary `image`. Product detail page renders [image, ...gallery_images] deduped (cap 8). Admin / Catalog-Import populated; no client writes.';

commit;
