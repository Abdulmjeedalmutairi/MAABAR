// Stale-while-revalidate — in-memory session cache (web port of the mobile hook).
//
// Problem: web pages re-fetch their whole dataset on every mount, so navigating
// away and back (or between sections) re-runs a full load and shows a spinner
// each time — it feels like a "full reload" every visit.
//
// This hook keeps the last successful result of each page's fetch in a
// module-level cache that lives for the SPA session (survives client-side route
// changes; cleared on a hard reload and on sign-out). On mount it renders the
// cached data INSTANTLY (no loading), then revalidates in the background; state
// updates only if the data actually changed, so there's no flicker or jump.
//
// A loading state shows ONLY on a true cold miss — the first time a page is
// opened in a session with nothing cached yet.
//
// User isolation: the cache is keyed by the `key` you pass, NOT by user. Include
// the user id in the key for per-account data, and call clearSwrCache() on
// sign-out so the next user never sees the previous user's data.

import { useCallback, useEffect, useRef, useState } from 'react';

// key -> last successful data
const _cache = new Map();

// Invalidate the cache. clearSwrCache() wipes everything (call on sign-out);
// clearSwrCache(key) drops one entry (call after a mutation that changes it);
// clearSwrCache((k) => boolean) drops every entry whose key matches.
export function clearSwrCache(key) {
  if (key === undefined) { _cache.clear(); return; }
  if (typeof key === 'function') {
    for (const k of [..._cache.keys()]) { if (key(k)) _cache.delete(k); }
    return;
  }
  _cache.delete(key);
}

/**
 * @param {string} key      stable cache key for this page's dataset (e.g. `factory:${id}`)
 * @param {() => Promise<any>} fetcher  fetches + composes the data and RETURNS it
 *                                      (return `undefined` to opt out of updating, e.g. no user)
 * @param {{ enabled?: boolean }} [opts]
 * @returns {{ data:any, isLoading:boolean, isRefreshing:boolean, refresh:() => Promise<void> }}
 */
export function useStaleWhileRevalidate(key, fetcher, { enabled = true } = {}) {
  const [data, setData]                 = useState(() => (_cache.has(key) ? _cache.get(key) : null));
  // isLoading is true ONLY on a cold miss — the sole case where a loading state shows.
  const [isLoading, setIsLoading]       = useState(() => !_cache.has(key));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Latest fetcher without making it an effect dependency (its identity changes
  // every render since it closes over page state).
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    if (_cache.has(key)) setIsRefreshing(true); else setIsLoading(true);
    try {
      const fresh = await fetcherRef.current();
      if (fresh === undefined) return;                 // opted out — keep whatever we have
      _cache.set(key, fresh);
      if (!mountedRef.current) return;
      setData((prev) => {
        // Only re-render if the data actually changed → no flicker/needless work.
        try { if (JSON.stringify(prev) === JSON.stringify(fresh)) return prev; } catch { /* update */ }
        return fresh;
      });
    } catch {
      // best-effort: keep showing cached data on error
    } finally {
      if (mountedRef.current) { setIsLoading(false); setIsRefreshing(false); }
    }
  }, [key, enabled]);

  // On mount (route entry): hydrate from cache instantly (no loading), then
  // revalidate quietly. Re-runs when the key changes (e.g. navigating between
  // two factory detail pages).
  useEffect(() => {
    if (!enabled) return;
    if (_cache.has(key)) { setData(_cache.get(key)); setIsLoading(false); }
    else { setData(null); setIsLoading(true); }
    refresh();
  }, [key, enabled, refresh]);

  return { data, isLoading, isRefreshing, refresh };
}
