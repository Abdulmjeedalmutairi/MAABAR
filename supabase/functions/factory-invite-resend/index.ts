// Admin re-send of an existing factory invite.
//
// The concierge admin follows up when a factory hasn't responded. This RE-SENDS
// the invite email for an EXISTING invite (reusing the same slug — never creating
// a duplicate) over the internal secret (the factory address is not a Maabar
// user, so send-email's recipient gate must be bypassed the same way
// factory-request-email does).
//
// verify_jwt=true (default): only an authenticated ADMIN may call this; the caller
// is checked against profiles.role via the service-role client.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGINS = ['https://maabar.io', 'http://localhost:3000'];
function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const INTERNAL_SECRET = Deno.env.get('MAABAR_INTERNAL_SECRET') || '';
const SEND_EMAIL_URL = `${SUPABASE_URL}/functions/v1/send-email`;
const SITE_URL = Deno.env.get('MAABAR_SITE_URL') || 'https://maabar.io';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function json(body: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);

  try {
    if (!INTERNAL_SECRET) return json({ error: 'Server is missing MAABAR_INTERNAL_SECRET.' }, 500, req);

    // Caller must be an authenticated admin.
    const authHeader = req.headers.get('Authorization') || '';
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);
    const { data: prof } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = String(prof?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') return json({ error: 'Admins only.' }, 403, req);

    const { inviteId } = await req.json();
    if (!inviteId) return json({ error: 'inviteId is required.' }, 400, req);

    const { data: inv } = await admin
      .from('request_factory_invites')
      .select('id, slug, factory_email, factory_id, factory_product_id, expires_at')
      .eq('id', inviteId).maybeSingle();
    if (!inv) return json({ error: 'Invite not found.' }, 404, req);
    if (inv.expires_at && new Date(inv.expires_at) <= new Date()) return json({ error: 'This invite has expired.' }, 400, req);
    if (!inv.factory_email) return json({ error: 'Invite has no factory email.' }, 400, req);

    const { data: factory } = await admin
      .from('factory_directory').select('company_name').eq('id', inv.factory_id).maybeSingle();
    let productName = '';
    if (inv.factory_product_id) {
      const { data: p } = await admin
        .from('factory_products').select('name_en, name_zh, name_ar').eq('id', inv.factory_product_id).maybeSingle();
      productName = p?.name_en || p?.name_zh || p?.name_ar || '';
    }

    const link = `${SITE_URL}/f/${inv.slug}`;
    const res = await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'X-Maabar-Internal': INTERNAL_SECRET,
      },
      body: JSON.stringify({
        type: 'custom_marketing',
        to: inv.factory_email,
        data: {
          lang: 'en',
          subject: 'Reminder: quote request on Maabar',
          kicker: 'Maabar',
          headline: factory?.company_name || 'Quote request reminder',
          paragraphs: [
            'This is a reminder that a buyer on Maabar has requested a quote from your factory.',
            'Register with your phone number on the page below to submit your offer. Buyer contact details are shared only after the deal proceeds through Maabar.',
          ],
          detailsTitle: 'Request',
          infoRows: productName ? [{ label: 'Product', value: productName }] : [],
          ctaUrl: link,
          ctaText: 'View request & respond →',
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return json({ ok: false, error: 'Email send failed.', detail: body?.error || `HTTP ${res.status}` }, 502, req);

    return json({ ok: true, slug: inv.slug }, 200, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error.' }, 500, req);
  }
});
