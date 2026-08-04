-- Catalog import: per-product image GALLERY (multiple angles, Amazon-style).
--
-- The worker matched ONE image per product; extra photos of the same item on
-- the same page were dropped. Now, for a single-product page, those extra
-- images are collected as the product's gallery and carried through approval
-- into factory_products.gallery_images (the public product page already renders
-- image + gallery_images together).
--
--   gallery_paths — extra image URLs for this staged product (primary stays in
--                   image_path). Empty for multi-product pages (ambiguous).

alter table public.factory_catalog_import_products
  add column if not exists gallery_paths text[] not null default '{}';
