import { sb as supabase } from '../supabase';
import { readSwrCache, writeSwrCache } from './useStaleWhileRevalidate';

// Single source of truth for the /factory/:id detail payload — used BOTH by the
// FactoryDetail page's SWR fetcher and by prefetchFactoryDetail() below, so the
// warmed cache always matches the shape the page reads (drift-proof).

export const factoryDetailKey = (id) => `factory-detail:${id}`;

// factory_products is capped at 1000 rows/query by PostgREST. Read the total off
// the first page, then fetch any remaining pages in PARALLEL (a big factory — e.g.
// 1156 products — no longer walks pages one serial round-trip at a time).
async function fetchAllFactoryProducts(sb, factoryId) {
  const pageSize = 1000;
  const first = await sb.from('factory_products').select('*', { count: 'exact' }).eq('factory_id', factoryId)
    .order('sort_order', { ascending: true }).range(0, pageSize - 1);
  if (first.error || !first.data) return [];
  const all = [...first.data];
  const total = first.count ?? first.data.length;
  const rest = [];
  for (let from = pageSize; from < total; from += pageSize) {
    rest.push(sb.from('factory_products').select('*').eq('factory_id', factoryId)
      .order('sort_order', { ascending: true }).range(from, from + pageSize - 1));
  }
  if (rest.length) {
    const pages = await Promise.all(rest);
    for (const p of pages) { if (p.data) all.push(...p.data); }
  }
  return all;
}

export async function fetchFactoryDetailData(sb, id) {
  const [{ data: f }, prods, { data: cats }] = await Promise.all([
    sb.from('factory_directory_public').select('*').eq('id', id).maybeSingle(),
    fetchAllFactoryProducts(sb, id),
    sb.from('factory_catalogs_public').select('*').eq('factory_id', id).order('product_count', { ascending: false }),
  ]);
  return { factory: f || null, products: prods, catalogs: cats || [] };
}

const inFlight = new Set();

// Warm the SWR cache for a factory's detail page so tapping the card opens
// instantly. Best-effort and idempotent: no-op if already cached or a prefetch
// for this id is already running; swallows errors (the page fetches normally on
// navigation if the warm-up failed).
export async function prefetchFactoryDetail(id, sb = supabase) {
  if (!sb || !id) return;
  const key = factoryDetailKey(id);
  if (readSwrCache(key) !== undefined || inFlight.has(id)) return;
  inFlight.add(id);
  try {
    const data = await fetchFactoryDetailData(sb, id);
    if (data.factory) writeSwrCache(key, data);
  } catch (_e) {
    /* best-effort */
  } finally {
    inFlight.delete(id);
  }
}
