import { supabase } from './supabase';
import { readSwrCache, writeSwrCache } from './useStaleWhileRevalidate';

// Single source of truth for the /factory/:id detail payload — used BOTH by the
// FactoryDetail page's SWR fetcher and by prefetchFactoryDetail() below, so the
// warmed cache always matches the shape the page reads (drift-proof).

export const factoryDetailKey = (id) => `factory-detail:${id}`;

// factory_products is capped at 1000 rows/query by PostgREST — page through it.
async function fetchAllFactoryProducts(sb, factoryId) {
  const pageSize = 1000;
  const all = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb.from('factory_products').select('*').eq('factory_id', factoryId)
      .order('sort_order', { ascending: true }).range(from, from + pageSize - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
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
