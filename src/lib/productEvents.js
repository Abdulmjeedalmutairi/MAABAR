import { sb } from '../supabase';

// Fire-and-forget engagement logging → product_events (RLS: anyone may insert).
// Never blocks, never throws, no round-trip. Feeds the popularity signal in
// browse_products' live ranking. Anonymous by design (popularity ≠ identity);
// user_id can be attached later for personalization.
export function logProductEvent(product, eventType) {
  const pid = product?.id;
  if (!pid) return;
  try {
    sb.from('product_events')
      .insert({ product_id: pid, factory_id: product.factory_id || null, event_type: eventType })
      .then(undefined, () => {});
  } catch { /* best-effort */ }
}
