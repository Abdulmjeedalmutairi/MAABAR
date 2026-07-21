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

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Buyer delivery confirmation releases escrow (payments.status -> 'completed').
// This is NOT a Moyasar event; it is a buyer action, so it lives in its own
// server endpoint instead of a client-side write to the payments table.
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);

  try {
    // Caller must be the authenticated buyer who owns the request.
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);

    const { requestId } = await req.json();
    if (!requestId) return json({ error: 'requestId is required.' }, 400, req);

    const { data: request } = await admin.from('requests')
      .select('id,buyer_id,status').eq('id', requestId).single();
    if (!request) return json({ error: 'Request not found.' }, 404, req);
    if (request.buyer_id !== user.id) return json({ error: 'Not your request.' }, 403, req);
    if (!['shipping', 'arrived'].includes(String(request.status))) {
      return json({ error: 'Order is not in a deliverable state.', status: request.status }, 409, req);
    }

    // Release escrow + advance the order — server-side.
    const { error: payErr } = await admin.from('payments')
      .update({ status: 'completed' })
      .eq('request_id', requestId).in('status', ['first_paid', 'second_paid']);
    if (payErr) return json({ error: 'Failed to update payment.', detail: payErr.message }, 500, req);

    await admin.from('requests')
      .update({ status: 'delivered', shipping_status: 'delivered' }).eq('id', requestId);

    // Notify the supplier (moved server-side from the client).
    const { data: offer } = await admin.from('offers')
      .select('supplier_id').eq('request_id', requestId).eq('status', 'accepted').maybeSingle();
    if (offer?.supplier_id) {
      await admin.from('notifications').insert({
        user_id: offer.supplier_id, type: 'delivery_confirmed',
        title_ar: 'التاجر أكد الاستلام — سيتم تحويل المبلغ خلال 24 ساعة',
        title_en: 'Buyer confirmed delivery — payout will be processed within 24h',
        title_zh: '买家已确认收货 — 将在24小时内处理付款',
        ref_id: requestId, is_read: false,
      });
    }

    return json({ ok: true }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    return json({ error: message }, 500, req);
  }
});
