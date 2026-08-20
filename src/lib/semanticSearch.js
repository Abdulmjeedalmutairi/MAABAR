// Semantic product search — bridges synonyms / dialect / language (e.g. "كنب"
// finds "أريكة / Sofa"). Two steps:
//   1) embedQuery: the worker embeds the search string → a 768-dim vector. Gated
//      to logged-in users (cost control) — anonymous visitors get null and the
//      caller falls back to the existing keyword browse.
//   2) semanticSearch: the DB's hybrid RPC (exact keyword first, then nearest by
//      meaning), offset-paginated.
import { sb } from '../supabase';

const WORKER_URL = (process.env.REACT_APP_CATALOG_WORKER_URL || '').replace(/\/$/, '');
export const semanticConfigured = () => !!WORKER_URL;

// Embed the query on the worker. Returns a float[] vector, or null when semantic
// search isn't available (no worker, not logged in, or any error) → keyword mode.
export async function embedQuery(text) {
  const term = (text || '').trim();
  if (!WORKER_URL || !term) return null;
  try {
    const { data: { session } } = await sb.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;                         // anon → keyword fallback
    const res = await fetch(`${WORKER_URL}/embed-query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: term }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return Array.isArray(j.embedding) && j.embedding.length ? j.embedding : null;
  } catch { return null; }
}

// Hybrid search via the DB. `embedding` is the vector from embedQuery; `search` is
// the raw term (keeps exact keyword hits on top). Returns rows (product + factory
// + similarity) or null on error (caller falls back to browse).
export async function semanticSearch({ embedding, search, categories, limit = 40, offset = 0 }) {
  if (!embedding) return null;
  const p_embedding = `[${embedding.join(',')}]`;
  const { data, error } = await sb.rpc('search_products_semantic', {
    p_embedding,
    p_search: search || null,
    p_categories: categories || null,
    p_limit: limit,
    p_offset: offset,
  });
  return error ? null : (data || []);
}
