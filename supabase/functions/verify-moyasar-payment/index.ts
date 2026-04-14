import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

const MOYASAR_SECRET_KEY = Deno.env.get('APP_MOYASAR_SECRET_KEY') || Deno.env.get('MOYASAR_SECRET_KEY') || '';

function json(body: unknown, status = 200, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      'Content-Type': 'application/json',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);

  if (!MOYASAR_SECRET_KEY) {
    return json({ error: 'Moyasar secret key is not configured on the server.' }, 500, req);
  }

  try {
    const { paymentId } = await req.json();
    const normalizedPaymentId = String(paymentId || '').trim();

    if (!normalizedPaymentId) {
      return json({ error: 'paymentId is required.' }, 400, req);
    }

    const response = await fetch(`https://api.moyasar.com/v1/payments/${encodeURIComponent(normalizedPaymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(`${MOYASAR_SECRET_KEY}:`)}`,
        'Content-Type': 'application/json',
      },
    });

    const rawBody = await response.text();
    let payload: Record<string, unknown> = {};

    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = { message: rawBody };
    }

    if (!response.ok) {
      return json({
        error: String(payload?.message || payload?.errors || 'Failed to verify payment with Moyasar.'),
        details: payload,
      }, response.status, req);
    }

    return json({
      ok: true,
      payment: {
        id: payload.id,
        status: payload.status,
        amount: payload.amount,
        currency: payload.currency,
        description: payload.description,
        callback_url: payload.callback_url,
        message: payload.message,
        response_code: payload.response_code,
        source: payload.source,
      },
    }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    return json({ error: message }, 500, req);
  }
});
