import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://maabar.io', 'http://localhost:3000'];

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body: unknown, status = 200, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

const MOYASAR_SECRET_KEY = Deno.env.get('APP_MOYASAR_SECRET_KEY') || Deno.env.get('MOYASAR_SECRET_KEY') || Deno.env.get('Moyasar') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// service_role client — sole authorized writer of payment financial state
// (guard_payments_write() rejects any non-service/non-admin write).
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);
  if (!MOYASAR_SECRET_KEY) return json({ error: 'Moyasar secret key is not configured on the server.' }, 500, req);

  try {
    const { paymentId, requestId } = await req.json();
    const normalizedPaymentId = String(paymentId || '').trim();
    if (!normalizedPaymentId || !requestId) {
      return json({ error: 'paymentId and requestId are required.' }, 400, req);
    }

    // (0) AuthZ — the caller must be the buyer who owns this request. Prevents
    //     recording a (real) Moyasar payment against someone else's order.
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);

    // (1) Verify the payment with Moyasar, server-side, using the secret key.
    const response = await fetch(`https://api.moyasar.com/v1/payments/${encodeURIComponent(normalizedPaymentId)}`, {
      method: 'GET',
      headers: { Authorization: `Basic ${btoa(`${MOYASAR_SECRET_KEY}:`)}`, 'Content-Type': 'application/json' },
    });
    const rawBody = await response.text();
    let payload: Record<string, unknown> = {};
    try { payload = rawBody ? JSON.parse(rawBody) : {}; } catch { payload = { message: rawBody }; }

    if (!response.ok) {
      return json({ error: String(payload?.message || payload?.errors || 'Failed to verify payment with Moyasar.'), details: payload }, response.status, req);
    }
    if (String(payload.status || '').toLowerCase() !== 'paid') {
      return json({ error: 'Payment is not in a paid state.', status: payload.status }, 402, req);
    }
    if (String(payload.currency || 'SAR').toUpperCase() !== 'SAR') {
      return json({ error: 'Unexpected payment currency.' }, 400, req);
    }

    // (2) Idempotency / replay guard — a moyasar_id may be recorded only once.
    const { data: dup } = await admin.from('payments').select('id,status').eq('moyasar_id', payload.id).maybeSingle();
    if (dup) return json({ ok: true, payment: dup, alreadyRecorded: true }, 200, req);

    // (3) Load the request + accepted offer server-side; confirm ownership.
    const { data: request } = await admin.from('requests')
      .select('id,buyer_id,quantity,payment_pct,payment_second,status').eq('id', requestId).single();
    if (!request) return json({ error: 'Request not found.' }, 404, req);
    if (request.buyer_id !== user.id) return json({ error: 'Not your request.' }, 403, req);
    const { data: offer } = await admin.from('offers')
      .select('supplier_id,price,shipping_cost').eq('request_id', requestId).eq('status', 'accepted').maybeSingle();
    if (!offer) return json({ error: 'No accepted offer for this request.' }, 409, req);

    // (4) Re-derive the authoritative totals from the DB (never from the client).
    const qty = Number(request.quantity) || 1;
    const subtotal = Number(offer.price) * qty;
    const total = subtotal + (Number(offer.shipping_cost) || 0);
    const paid = Number(payload.amount) / 100; // halalas -> SAR (Moyasar minor units)
    if (!(paid > 0) || paid > total + 0.01) {
      return json({ error: 'Paid amount is out of bounds for this order.', paid, total }, 409, req);
    }

    // (5) Stage (first vs second) is derived server-side from an existing first_paid row.
    const { data: firstPay } = await admin.from('payments')
      .select('id, amount_first').eq('request_id', requestId).eq('status', 'first_paid').maybeSingle();
    const isSecond = Boolean(firstPay);

    let row: Record<string, unknown>;
    if (isSecond) {
      // Second payment must cover the remaining owed = total - what was paid first.
      const remainingExpected = Number((total - Number(firstPay!.amount_first || 0)).toFixed(2));
      if (paid < remainingExpected - 0.01) {
        return json({ error: 'Second payment is less than the remaining amount owed.', remainingExpected, paid }, 409, req);
      }
      row = {
        request_id: requestId, buyer_id: request.buyer_id, supplier_id: offer.supplier_id,
        amount: paid, amount_first: 0, amount_second: paid, payment_pct: request.payment_pct,
        maabar_fee: 0, supplier_amount: Number((paid * 0.96).toFixed(2)),
        status: 'second_paid', moyasar_id: payload.id,
      };
    } else {
      row = {
        request_id: requestId, buyer_id: request.buyer_id, supplier_id: offer.supplier_id,
        amount: total, amount_first: paid, amount_second: Number((total - paid).toFixed(2)),
        payment_pct: Math.round((paid / total) * 100), maabar_fee: 0,
        supplier_amount: Number((subtotal * 0.96).toFixed(2)),
        status: 'first_paid', moyasar_id: payload.id,
      };
    }

    // (6) Server writes (service_role passes guard_payments_write()).
    const { data: inserted, error: insertError } = await admin.from('payments').insert(row).select('id,status').single();
    if (insertError) {
      // Unique violation => a concurrent request already recorded it; treat as success.
      if (insertError.code === '23505') {
        const { data: existing } = await admin.from('payments').select('id,status').eq('moyasar_id', payload.id).maybeSingle();
        if (existing) return json({ ok: true, payment: existing, alreadyRecorded: true }, 200, req);
      }
      return json({ error: 'Failed to record payment.', detail: insertError.message }, 500, req);
    }

    await admin.from('requests')
      .update({ status: isSecond ? 'shipping' : 'paid', ...(isSecond ? { shipping_status: 'shipping' } : {}), payment_id: inserted.id })
      .eq('id', requestId);

    // Notify the supplier server-side (moved from PaymentSuccess.jsx) so it fires
    // even if the buyer's client crashes/disconnects right after verification.
    // Matches prior behavior: sent on the first payment; wording is "full" when the
    // amount covers the whole order (e.g. direct 100% buy), else "first payment".
    if (!isSecond) {
      const isFull = paid >= total - 0.01;
      const amt = `${paid} SAR`;
      await admin.from('notifications').insert({
        user_id: offer.supplier_id,
        type: 'payment_received',
        title_ar: isFull ? `تم استلام الدفع كاملاً — ${amt}. ابدأ التجهيز الآن` : `وصلت دفعتك الأولى — ${amt}. ابدأ التجهيز الآن`,
        title_en: isFull ? `Full payment received — ${amt}. Start preparation now` : `First payment received — ${amt}. Start preparation now`,
        title_zh: isFull ? `已收到全额付款 — ${amt}。立即开始备货` : `首付已收到 — ${amt}。立即开始备货`,
        ref_id: requestId,
        is_read: false,
      });
    }

    return json({ ok: true, payment: inserted }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    return json({ error: message }, 500, req);
  }
});
