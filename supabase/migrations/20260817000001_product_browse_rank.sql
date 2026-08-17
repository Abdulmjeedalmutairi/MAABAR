-- Tier 2 — server-side paginated product browse ("Amazon/Alibaba" style).
--
-- Instead of the client pulling all ~2600 products and interleaving them in JS,
-- a precomputed browse_rank gives a stable, factory-interleaved, priced-first
-- ordering, so the client paginates with a simple cursor (ORDER BY browse_rank,
-- WHERE browse_rank > last) and loads pages of 40 on scroll.
--
-- browse_rank layout:  priced_bucket*1e9  +  within*1e5  +  fac_ord
--   priced_bucket : 0 = priced, 1 = unpriced  (priced products first)
--   within        : the product's Nth position inside its own factory/bucket
--                   → ordering by `within` takes the 1st product of every factory,
--                     then the 2nd of every factory, … = round-robin, no clumping
--   fac_ord       : dense factory index — tiebreaker among factories at the same
--                   `within` position
-- (max ~63 factories and ~1156 products/factory keep every field inside its slot.)

alter table public.factory_products add column if not exists browse_rank bigint;
create index if not exists factory_products_browse_rank_idx on public.factory_products (browse_rank);

-- A product is "priced" only when its verbatim price text is present and not the
-- extractor's not_found sentinel (mirrors isPriced on the client).
create or replace function public.refresh_product_browse_rank()
returns void
language sql
security definer
set search_path = public
as $$
  with ranked as (
    select
      p.id,
      (case when nullif(btrim(coalesce(p.price, '')), '') is not null
             and lower(coalesce(p.price, '')) <> 'not_found' then 0 else 1 end) as priced_bucket,
      p.factory_id
    from public.factory_products p
  ),
  numbered as (
    select
      r.id, r.priced_bucket, r.factory_id,
      row_number() over (partition by r.factory_id, r.priced_bucket
                         order by fp.sort_order nulls last, fp.created_at desc) as within,
      dense_rank() over (order by r.factory_id) as fac_ord
    from ranked r
    join public.factory_products fp on fp.id = r.id
  )
  update public.factory_products fp
  set browse_rank = n.priced_bucket::bigint * 1000000000
                  + n.within::bigint * 100000
                  + n.fac_ord::bigint
  from numbered n
  where fp.id = n.id;
$$;

-- New products (e.g. from a catalog import) get a provisional rank at the very end
-- so they show up immediately; the next refresh re-interleaves them properly.
create sequence if not exists public.factory_products_provisional_seq;

create or replace function public.set_provisional_browse_rank()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.browse_rank is null then
    new.browse_rank := 8000000000 + coalesce(nextval('public.factory_products_provisional_seq'), 0);
  end if;
  return new;
end
$$;

drop trigger if exists trg_factory_products_provisional_rank on public.factory_products;
create trigger trg_factory_products_provisional_rank
before insert on public.factory_products
for each row execute function public.set_provisional_browse_rank();

-- Populate the existing catalog now.
select public.refresh_product_browse_rank();

-- Paginated browse feed: filter (category codes / search) + order server-side, one
-- page + a cursor. Returns each row as jsonb so the shape can evolve without a
-- fragile column-type contract; the client reads .browse_rank as the next cursor
-- and .factory for the joined factory. Only ACTIVE factories (public view) + rows
-- with a real image URL, matching the old client filter.
create or replace function public.browse_products(
  p_categories text[] default null,   -- factory category codes; null = all
  p_search text default null,
  p_after bigint default null,        -- cursor = last row's browse_rank
  p_limit int default 40
)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(p) || jsonb_build_object('factory', jsonb_build_object(
           'company_name', f.company_name,
           'company_name_latin', f.company_name_latin,
           'category', f.category,
           'certifications', f.certifications,
           'private_label', f.private_label))
  from public.factory_products p
  join public.factory_directory_public f on f.id = p.factory_id
  where p.browse_rank is not null
    and p.image ~ '^https?://'
    and (p_after is null or p.browse_rank > p_after)
    and (p_categories is null or f.category = any (p_categories))
    and (
      p_search is null or btrim(p_search) = ''
      or p.name_ar ilike '%' || p_search || '%'
      or p.name_en ilike '%' || p_search || '%'
      or f.company_name ilike '%' || p_search || '%'
      or f.company_name_latin ilike '%' || p_search || '%'
    )
  order by p.browse_rank
  limit greatest(1, least(coalesce(p_limit, 40), 60));
$$;

alter function public.refresh_product_browse_rank() owner to postgres;
alter function public.browse_products(text[], text, bigint, int) owner to postgres;
grant execute on function public.browse_products(text[], text, bigint, int) to anon, authenticated;
