import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// telr-verify — the trusted "is it paid?" step. Calls Telr method:check for the
// order ref, and ONLY if paid (status.code 3 + transaction A) records the payment
// (service_role, the sole authorized writer) and advances the order. Money model:
// the buyer paid goods + a visible 5% Maabar fee, so per row supplier_amount is
// the goods portion (paid / 1.05) and maabar_fee is the 5% portion. Stage (deposit
// vs balance) is derived server-side from any existing first_paid row.

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

function telrCreds(platform: string) {
  const app = platform === 'app';
  const store = (app ? Deno.env.get('TELR_STORE_ID_APP') : '') || Deno.env.get('TELR_STORE_ID') || '';
  const key = (app ? Deno.env.get('TELR_AUTH_KEY_APP') : '') || Deno.env.get('TELR_AUTH_KEY') || '';
  return { store, key };
}
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const FEE_PCT = 0.05;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);

  try {
    const { requestId, invoiceId, ref, platform } = await req.json();
    if ((!requestId && !invoiceId) || !ref) return json({ error: 'ref and requestId or invoiceId are required.' }, 400, req);
    const { store, key } = telrCreds(String(platform || 'web'));
    if (!store || !key) return json({ error: 'Telr credentials are not configured on the server.' }, 500, req);

    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);

    // (1) Ask Telr for the authoritative status.
    const telrRes = await fetch('https://secure.telr.com/gateway/order.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'check', store: Number(store), authkey: key, order: { ref } }),
    });
    const telr = await telrRes.json().catch(() => ({}));
    const order = telr?.order || {};
    const statusCode = Number(order?.status?.code);
    const tranStatus = String(order?.transaction?.status || '');
    if (statusCode !== 3 || tranStatus !== 'A') {
      return json({ error: 'Payment is not in a paid state.', status: order?.status, transaction: order?.transaction }, 402, req);
    }
    if (String(order.currency || 'SAR').toUpperCase() !== 'SAR') {
      return json({ error: 'Unexpected payment currency.' }, 400, req);
    }
    const paid = round2(Number(order.amount));   // Telr amount is in major units (SAR)
    if (!(paid > 0)) return json({ error: 'Invalid paid amount.' }, 409, req);

    // (2) Idempotency — a Telr ref is recorded once.
    const { data: dup } = await admin.from('payments').select('id,status').eq('telr_ref', ref).maybeSingle();
    if (dup) return json({ ok: true, payment: dup, alreadyRecorded: true }, 200, req);

    // (3) Resolve the order + amounts. A chat invoice (invoiceId) has no order yet —
    // create the direct order on this (first) payment; a requestId already has one.
    let buyerId: string; let supplierId: string | null = null;
    let totalCharged = 0; let targetRequestId: string;

    if (invoiceId) {
      const { data: inv } = await admin.from('order_invoices')
        .select('id, buyer_id, supplier_id, product_ref, quantity, total, status, request_id').eq('id', invoiceId).maybeSingle();
      if (!inv) return json({ error: 'Invoice not found.' }, 404, req);
      if (inv.buyer_id !== user.id) return json({ error: 'Not your invoice.' }, 403, req);
      buyerId = inv.buyer_id; supplierId = inv.supplier_id;
      totalCharged = round2(Number(inv.total));
      if (paid > totalCharged + 0.01) return json({ error: 'Paid amount exceeds the invoice total.', paid, totalCharged }, 409, req);

      if (inv.request_id) {
        targetRequestId = inv.request_id;   // order already created (e.g. by the deposit)
      } else {
        const { data: product } = await admin.from('products').select('name_ar, name_en, name_zh').eq('id', inv.product_ref).maybeSingle();
        const { data: newReq, error: reqErr } = await admin.from('requests').insert({
          buyer_id: inv.buyer_id, product_ref: inv.product_ref, quantity: String(inv.quantity || 1),
          title_ar: product?.name_ar || null, title_en: product?.name_en || null, title_zh: product?.name_zh || null,
          sourcing_mode: 'direct', request_kind: 'direct', status: 'paid',
        }).select('id').single();
        if (reqErr || !newReq) return json({ error: 'Failed to create the order.', detail: reqErr?.message }, 500, req);
        targetRequestId = newReq.id;
        await admin.from('order_invoices').update({ request_id: newReq.id, status: 'paid' }).eq('id', invoiceId);
      }
    } else {
      const { data: request } = await admin.from('requests')
        .select('id, buyer_id, quantity, product_ref, status').eq('id', requestId).single();
      if (!request) return json({ error: 'Order not found.' }, 404, req);
      if (request.buyer_id !== user.id) return json({ error: 'Not your order.' }, 403, req);
      targetRequestId = request.id; buyerId = request.buyer_id;
      const qty = Number(request.quantity) || 1;
      let goods = 0;
      const { data: offer } = await admin.from('offers')
        .select('supplier_id, price, shipping_cost').eq('request_id', requestId).eq('status', 'accepted').maybeSingle();
      if (offer) { goods = Number(offer.price) * qty + (Number(offer.shipping_cost) || 0); supplierId = offer.supplier_id; }
      else {
        const { data: product } = await admin.from('products').select('supplier_id, price_from').eq('id', request.product_ref).maybeSingle();
        if (!product) return json({ error: 'No price source for this order.' }, 409, req);
        goods = Number(product.price_from) * qty; supplierId = product.supplier_id;
      }
      totalCharged = round2(goods * (1 + FEE_PCT));
      if (paid > totalCharged + 0.01) return json({ error: 'Paid amount exceeds the order total.', paid, totalCharged }, 409, req);
    }

    // (4) Stage from an existing first_paid row on the target order.
    const { data: firstPay } = await admin.from('payments')
      .select('id, amount').eq('request_id', targetRequestId).eq('status', 'first_paid').maybeSingle();
    const isSecond = Boolean(firstPay);
    if (isSecond) {
      const remaining = round2(totalCharged - Number(firstPay!.amount || 0));
      if (paid < remaining - 0.01) return json({ error: 'Balance is less than the remaining amount owed.', remaining, paid }, 409, req);
    }

    // supplier gets the goods portion; Maabar keeps the 5% fee portion.
    const supplierPortion = round2(paid / (1 + FEE_PCT));
    const feePortion = round2(paid - supplierPortion);
    const row = {
      request_id: targetRequestId, buyer_id: buyerId, supplier_id: supplierId,
      amount: paid,
      amount_first: isSecond ? 0 : paid,
      amount_second: isSecond ? paid : 0,
      payment_pct: Math.round((paid / totalCharged) * 100),
      maabar_fee: feePortion, supplier_amount: supplierPortion,
      status: isSecond ? 'second_paid' : 'first_paid', telr_ref: ref,
    };

    const { data: inserted, error: insErr } = await admin.from('payments').insert(row).select('id,status').single();
    if (insErr) {
      if (insErr.code === '23505') {
        const { data: existing } = await admin.from('payments').select('id,status').eq('telr_ref', ref).maybeSingle();
        if (existing) return json({ ok: true, payment: existing, alreadyRecorded: true }, 200, req);
      }
      return json({ error: 'Failed to record payment.', detail: insErr.message }, 500, req);
    }

    await admin.from('requests')
      .update({ status: isSecond ? 'shipping' : 'paid', ...(isSecond ? { shipping_status: 'shipping' } : {}), payment_id: inserted.id })
      .eq('id', targetRequestId);

    if (!isSecond && supplierId) {
      const isFull = paid >= totalCharged - 0.01;
      const amt = `${paid} SAR`;
      await admin.from('notifications').insert({
        user_id: supplierId, type: 'payment_received',
        title_ar: isFull ? `تم استلام الدفع كاملاً — ${amt}. ابدأ التجهيز الآن` : `وصلت دفعتك الأولى — ${amt}. ابدأ التجهيز الآن`,
        title_en: isFull ? `Full payment received — ${amt}. Start preparation now` : `First payment received — ${amt}. Start preparation now`,
        title_zh: isFull ? `已收到全额付款 — ${amt}。立即开始备货` : `首付已收到 — ${amt}。立即开始备货`,
        ref_id: targetRequestId, is_read: false,
      });
    }

    return json({ ok: true, payment: inserted }, 200, req);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500, req);
  }
});
