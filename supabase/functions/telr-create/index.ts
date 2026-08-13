import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// telr-create — server-side creation of a Telr hosted-payment order for a direct
// order stage (deposit 30% / balance / full 100%). Computes the charge from the
// DB (never the client): goods total + the visible 5% Maabar fee. Returns the
// Telr payment URL to redirect/open. The trusted "is it paid?" step is telr-verify.
//
// Secrets (Supabase → Edge Function secrets): TELR_STORE_ID, TELR_AUTH_KEY.
// Test mode is on (test:"1") until go-live (live also needs the egress IP allowlisted in Telr).

const ALLOWED_ORIGINS = ['https://maabar.io', 'http://localhost:3000'];
function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
function json(body: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } });
}
const round2 = (n: number) => Math.round(n * 100) / 100;

const TELR_TEST = Deno.env.get('TELR_TEST') ?? '1';   // "1" test, "0" live
// Separate Telr stores for web vs app (platform picks the credentials).
function telrCreds(platform: string) {
  const app = platform === 'app';
  return {
    store: Deno.env.get(app ? 'TELR_STORE_ID_APP' : 'TELR_STORE_ID') || '',
    key: Deno.env.get(app ? 'TELR_AUTH_KEY_APP' : 'TELR_AUTH_KEY') || '',
  };
}
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const FEE_PCT = 0.05;   // visible 5% Maabar platform fee on the buyer side
const DEPOSIT_PCT = 0.30;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);

  try {
    const { requestId, invoiceId, stage, returnUrl, platform } = await req.json();
    const { store, key } = telrCreds(String(platform || 'web'));
    if (!store || !key) return json({ error: 'Telr credentials are not configured on the server.' }, 500, req);
    const stg = String(stage || 'full');
    if (!['deposit', 'balance', 'full'].includes(stg)) return json({ error: 'Invalid stage.' }, 400, req);
    if (!requestId && !invoiceId) return json({ error: 'requestId or invoiceId is required.' }, 400, req);
    if (!returnUrl) return json({ error: 'returnUrl is required.' }, 400, req);

    // AuthZ — the caller must be the buyer.
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);

    // Total to charge (already includes the 5% fee) + a label for the cartid.
    let totalCharged = 0;
    let refLabel = '';
    if (invoiceId) {
      const { data: inv } = await admin.from('order_invoices')
        .select('id, buyer_id, total, status, invoice_number').eq('id', invoiceId).maybeSingle();
      if (!inv) return json({ error: 'Invoice not found.' }, 404, req);
      if (inv.buyer_id !== user.id) return json({ error: 'Not your invoice.' }, 403, req);
      if (inv.status === 'paid') return json({ error: 'This invoice is already paid.' }, 409, req);
      totalCharged = round2(Number(inv.total));
      refLabel = inv.invoice_number || `INV-${String(invoiceId).slice(0, 8)}`;
    } else {
      const { data: request } = await admin.from('requests')
        .select('id, buyer_id, quantity, product_ref, request_ref, status').eq('id', requestId).single();
      if (!request) return json({ error: 'Order not found.' }, 404, req);
      if (request.buyer_id !== user.id) return json({ error: 'Not your order.' }, 403, req);
      const qty = Number(request.quantity) || 1;
      let goods = 0;
      const { data: offer } = await admin.from('offers')
        .select('price, shipping_cost').eq('request_id', requestId).eq('status', 'accepted').maybeSingle();
      if (offer) {
        goods = Number(offer.price) * qty + (Number(offer.shipping_cost) || 0);
      } else {
        const { data: product } = await admin.from('products').select('price_from').eq('id', request.product_ref).maybeSingle();
        if (!product) return json({ error: 'No price source for this order.' }, 409, req);
        goods = Number(product.price_from) * qty;
      }
      if (!(goods > 0)) return json({ error: 'Order amount is invalid.' }, 409, req);
      totalCharged = round2(goods * (1 + FEE_PCT));
      refLabel = request.request_ref || requestId;
    }

    // Charge for this stage.
    let amount = totalCharged;
    if (stg === 'deposit') {
      amount = round2(totalCharged * DEPOSIT_PCT);
    } else if (stg === 'balance') {
      if (!requestId) return json({ error: 'Balance applies to an existing order.' }, 409, req);
      const { data: firstPay } = await admin.from('payments')
        .select('amount').eq('request_id', requestId).eq('status', 'first_paid').maybeSingle();
      if (!firstPay) return json({ error: 'No deposit on record — pay the deposit first.' }, 409, req);
      amount = round2(totalCharged - Number(firstPay.amount || 0));
    }
    if (!(amount > 0)) return json({ error: 'Computed charge is invalid.' }, 409, req);

    // Telr create order — cartid must be unique per attempt.
    const cartid = `${refLabel}-${stg[0].toUpperCase()}-${Date.now()}`;
    const telrRes = await fetch('https://secure.telr.com/gateway/order.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'create',
        store: Number(store),
        authkey: key,
        order: {
          cartid,
          test: TELR_TEST,
          amount: amount.toFixed(2),
          currency: 'SAR',
          description: `Maabar ${refLabel} — ${stg}`,
          trantype: 'sale',
        },
        return: { authorised: returnUrl, declined: returnUrl, cancelled: returnUrl },
      }),
    });
    const telr = await telrRes.json().catch(() => ({}));
    if (telr?.error || !telr?.order?.url) {
      return json({ error: telr?.error?.message || 'Telr order creation failed.', details: telr }, 502, req);
    }

    return json({ ok: true, url: telr.order.url, ref: telr.order.ref, cartid, amount }, 200, req);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500, req);
  }
});
