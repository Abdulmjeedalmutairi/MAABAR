import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MOYASAR_SECRET_KEY = Deno.env.get('APP_MOYASAR_SECRET_KEY') || Deno.env.get('MOYASAR_SECRET_KEY') || '';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  if (!MOYASAR_SECRET_KEY) {
    return json({ error: 'Moyasar secret key is not configured on the server.' }, 500);
  }

  try {
    const { paymentId } = await req.json();
    const normalizedPaymentId = String(paymentId || '').trim();

    if (!normalizedPaymentId) {
      return json({ error: 'paymentId is required.' }, 400);
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
      }, response.status);
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    return json({ error: message }, 500);
  }
});
