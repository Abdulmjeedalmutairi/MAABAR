import { sb, SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '../supabase';

// Web Telr payment (hosted page). Pay → telr-create → redirect to Telr → the buyer
// returns to /telr-return which calls telr-verify. The Telr order ref is stashed in
// sessionStorage across the redirect (survives the round-trip in the same tab), so
// no server-side pending table is needed.

async function callEdge(fn, body) {
  const { data: { session } } = await sb.auth.getSession();
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/${fn}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.error) throw new Error(json?.error || `${fn} failed.`);
  return json;
}

const stashKey = (id) => `telr:${id}`;

// Start a hosted-page payment for an order (kind 'order') or a chat invoice
// (kind 'invoice'): create the Telr order, stash its ref, redirect to Telr.
// stage: 'deposit' | 'balance' | 'full'.
export async function startTelrPayment(id, stage, kind = 'order') {
  const idParam = kind === 'invoice' ? `invoiceId=${encodeURIComponent(id)}` : `requestId=${encodeURIComponent(id)}`;
  const returnUrl = `${window.location.origin}/telr-return?${idParam}&stage=${encodeURIComponent(stage)}&kind=${kind}`;
  const createBody = kind === 'invoice' ? { invoiceId: id } : { requestId: id };
  const order = await callEdge('telr-create', { ...createBody, stage, platform: 'web', returnUrl });
  try { sessionStorage.setItem(stashKey(id), JSON.stringify({ ref: order.ref, stage, kind })); } catch { /* ignore */ }
  window.location.href = order.url;
}

// On the return page: recover the stashed ref and verify server-side.
export async function completeTelrReturn(id) {
  let ref = null; let kind = 'order';
  try {
    const raw = sessionStorage.getItem(stashKey(id));
    if (raw) { const s = JSON.parse(raw); ref = s.ref; kind = s.kind || 'order'; }
  } catch { /* ignore */ }
  if (!ref) throw new Error('Missing payment reference — please retry the payment.');
  const body = kind === 'invoice' ? { invoiceId: id, ref } : { requestId: id, ref };
  const result = await callEdge('telr-verify', { ...body, platform: 'web' });
  try { sessionStorage.removeItem(stashKey(id)); } catch { /* ignore */ }
  return result;
}
