-- ============================================================================
-- browse_products → LIVE score-based ranking (self-maintaining, no stale column)
-- ----------------------------------------------------------------------------
-- The precomputed `browse_rank` column went stale: new factories/products got a
-- provisional end-rank (8e9+) and stayed INVISIBLE until someone manually ran
-- refresh_product_browse_rank(). Compute the rank LIVE instead (2.6k products —
-- trivial cost), so a freshly added factory interleaves immediately, forever.
--
-- Ranking (all algorithmic, zero AI):
--   • priced first (a real price is the strongest "attractive" signal),
--   • factory round-robin (each factory contributes its 1st, then 2nd, … so no
--     single factory clumps), with featured→verified factories leading a round,
--   • WITHIN a factory, order by POPULARITY (product_events, quote/chat > click >
--     view, last 90d), then sort_order, then recency.
--
-- Signature + cursor contract are UNCHANGED: it still returns setof jsonb with a
-- `browse_rank` field the client uses as the next `p_after` cursor — we just fill
-- it from a live row_number() instead of the stored column. The `where
-- browse_rank is not null` gate is dropped (all live-visible products qualify).
-- ============================================================================

create or replace function public.browse_products(
  p_categories text[] default null,
  p_search     text   default null,
  p_after      bigint default null,
  p_limit      int    default 40
)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      p,
      f.company_name, f.company_name_latin, f.category, f.certifications, f.private_label,
      f.is_featured, f.is_verified,
      case when nullif(btrim(coalesce(p.price, '')), '') is not null and p.price <> 'not_found'
           then 0 else 1 end            as priced_bucket,
      coalesce(ev.score, 0)             as pop,
      p.sort_order  as so,
      p.created_at  as ca,
      p.id          as pid,
      p.factory_id  as fid
    from public.factory_products p
    join public.factory_directory_public f on f.id = p.factory_id
    left join (
      select product_id,
             sum(case event_type
                   when 'quote' then 5 when 'chat' then 4 when 'click' then 2 else 1 end) as score
      from public.product_events
      where created_at > now() - interval '90 days'
      group by product_id
    ) ev on ev.product_id = p.id
    where p.image ~ '^https?://'
      and (p_categories is null or f.category = any (p_categories))
      and (
        p_search is null or btrim(p_search) = ''
        or p.name_ar ilike '%' || p_search || '%'
        or p.name_en ilike '%' || p_search || '%'
        or f.company_name ilike '%' || p_search || '%'
        or f.company_name_latin ilike '%' || p_search || '%'
      )
  ),
  scored as (
    select *,
      row_number() over (partition by fid order by pop desc, so nulls last, ca desc, pid) as within,
      dense_rank() over (order by is_featured desc, is_verified desc, fid)                as fac_ord
    from base
  ),
  ranked as (
    select *, row_number() over (order by priced_bucket, within, fac_ord) as rnk
    from scored
  )
  select to_jsonb(r.p)
         || jsonb_build_object('factory', jsonb_build_object(
              'company_name',        r.company_name,
              'company_name_latin',  r.company_name_latin,
              'category',            r.category,
              'certifications',      r.certifications,
              'private_label',       r.private_label))
         || jsonb_build_object('browse_rank', r.rnk)
  from ranked r
  where p_after is null or r.rnk > p_after
  order by r.rnk
  limit greatest(1, least(coalesce(p_limit, 40), 60));
$$;
