-- ============================================================================
-- Semantic product search — pgvector embeddings.
-- Bridges synonyms / dialect / language: "كنب" finds "أريكة / Sofa" because their
-- embeddings sit close in meaning-space. Gemini text-embedding-004 → 768 dims.
-- The embedding is a cheap ONE-TIME cost per product (not per-search LLM chat);
-- the query is embedded per search (a few tokens — negligible).
-- ============================================================================

create extension if not exists vector;

alter table public.factory_products
  add column if not exists embedding vector(768),
  add column if not exists embedded_at timestamptz;

-- No ANN index yet — brute-force cosine over ~2.6k rows is <50ms. Add an hnsw
-- index (using hnsw (embedding vector_cosine_ops)) once the catalog is much larger.

-- HYBRID search: exact keyword matches float to the top, then nearest-by-meaning.
-- The client embeds the query on the worker and passes the vector as a text
-- literal (e.g. '[0.1,-0.2,...]') → cast to vector here. Same jsonb shape as
-- browse_products, plus a `similarity` field. Offset-paginated (relevance order).
create or replace function public.search_products_semantic(
  p_embedding  text,
  p_search     text     default null,
  p_categories text[]   default null,
  p_limit      int      default 40,
  p_offset     int      default 0
)
returns setof jsonb
language sql
stable
security definer
set search_path = public
as $$
  with q as (select (p_embedding)::vector(768) as emb)
  select to_jsonb(p)
         || jsonb_build_object('factory', jsonb_build_object(
              'company_name',        f.company_name,
              'company_name_latin',  f.company_name_latin,
              'category',            f.category,
              'certifications',      f.certifications,
              'private_label',       f.private_label))
         || jsonb_build_object('similarity', round((1 - (p.embedding <=> q.emb))::numeric, 4))
  from public.factory_products p
  join public.factory_directory_public f on f.id = p.factory_id
  cross join q
  where p.embedding is not null
    and p.image ~ '^https?://'
    and (p_categories is null or f.category = any (p_categories))
  order by
    -- exact keyword hits (model codes, brand names) lead, then semantic nearness
    (case when p_search is null or btrim(p_search) = '' then 1
          when p.name_en ilike '%' || p_search || '%'
            or p.name_ar ilike '%' || p_search || '%'
            or f.company_name ilike '%' || p_search || '%'
            or f.company_name_latin ilike '%' || p_search || '%'
          then 0 else 1 end),
    p.embedding <=> q.emb
  limit greatest(1, least(coalesce(p_limit, 40), 60))
  offset greatest(0, coalesce(p_offset, 0));
$$;

grant execute on function public.search_products_semantic(text, text, text[], int, int) to anon, authenticated;
