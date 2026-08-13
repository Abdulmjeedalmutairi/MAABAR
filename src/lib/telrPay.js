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

export function createTelrOrder(requestId, stage, returnUrl) {
  return callEdge('telr-create', { requestId, stage, platform: 'web', returnUrl });
}

export function verifyTelrOrder(requestId, ref) {
  return callEdge('telr-verify', { requestId, ref, platform: 'web' });
}

const stashKey = (requestId) => `telr:${requestId}`;

// Start a hosted-page payment: create the order, stash its ref, redirect to Telr.
// stage: 'deposit' | 'balance' | 'full'.
export async function startTelrPayment(requestId, stage) {
  const returnUrl = `${window.location.origin}/telr-return?requestId=${encodeURIComponent(requestId)}&stage=${encodeURIComponent(stage)}`;
  const order = await createTelrOrder(requestId, stage, returnUrl);
  try { sessionStorage.setItem(stashKey(requestId), JSON.stringify({ ref: order.ref, stage })); } catch { /* ignore */ }
  window.location.href = order.url;
}

// On the return page: recover the stashed ref and verify server-side.
export async function completeTelrReturn(requestId) {
  let ref = null;
  try {
    const raw = sessionStorage.getItem(stashKey(requestId));
    if (raw) ref = JSON.parse(raw).ref;
  } catch { /* ignore */ }
  if (!ref) throw new Error('Missing payment reference — please retry the payment.');
  const result = await verifyTelrOrder(requestId, ref);
  try { sessionStorage.removeItem(stashKey(requestId)); } catch { /* ignore */ }
  return result;
}
