-- Factories-list read model.
--
-- The public /factories page needs, per factory: product_count, catalog_count
-- (distinct import_id) and up to 5 cover images. It computed these on the CLIENT
-- by transferring EVERY factory_products row (~2600+ and growing) and aggregating
-- in JS — the bulk of the 3-4s cold load. This RPC does the aggregation in the
-- database and returns ONE small row per factory (~63), so the page stops
-- shipping the entire product table to the browser.
--
-- Returns the factory as jsonb (to_jsonb of the public view row) so the shape
-- tracks factory_directory_public automatically — no column list to maintain
-- here when the view changes. security definer + granted to anon/authenticated
-- because the factories page is public browse.
--
-- Idempotent (create or replace); no data migration. Apply via the SQL editor.

create or replace function public.factory_directory_with_stats()
returns table (
  factory       jsonb,
  product_count int,
  catalog_count int,
  cover_images  text[]
)
language sql
stable
security definer
set search_path = public
as $$
  select
    to_jsonb(f.*)                     as factory,
    coalesce(s.product_count, 0)::int as product_count,
    coalesce(s.catalog_count, 0)::int as catalog_count,
    coalesce(s.cover_images, '{}')    as cover_images
  from public.factory_directory_public f
  left join lateral (
    select
      count(*)::int                                            as product_count,
      count(distinct fp.import_id)::int                        as catalog_count,
      (array_agg(fp.image) filter (where fp.image ~ '^https?://'))[1:5] as cover_images
    from public.factory_products fp
    where fp.factory_id = f.id
  ) s on true
  order by (f.*).sort_order asc nulls last;
$$;

alter function public.factory_directory_with_stats() owner to postgres;
revoke all on function public.factory_directory_with_stats() from public;
grant execute on function public.factory_directory_with_stats() to anon, authenticated;
