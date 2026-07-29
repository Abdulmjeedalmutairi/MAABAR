// Factory quote-request email + invite creation.
//
// Called by an authenticated BUYER right after they create a managed request
// bound to a factory (product modal or the factory-level "custom request"
// button). Everything that must stay server-side happens here:
//   - the factory email is resolved from factory_directory by factory_id (the
//     buyer NEVER supplies an address → no arbitrary-recipient spam)
//   - a request_factory_invites row is created (slug + email snapshot)
//   - the email is sent via send-email's existing `custom_marketing` template over
//     the internal secret (which bypasses send-email's recipient gate, since the
//     factory address is not a Maabar user). No new send-email template needed.
//
// The email carries NO buyer identity — only the product name + a link to the
// /f/<slug> page, where the buyer-stripped brief is shown (Phase 4).
//
// verify_jwt=true (config.toml): the buyer's JWT is required to reach this.
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

function json(body: unknown, status = 200, req: Request) {
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

    // ── Caller must be the authenticated buyer who owns the request ──────────
    const authHeader = req.headers.get('Authorization') || '';
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);

    const { requestId, factoryId, factoryProductId } = await req.json();
    if (!requestId || !factoryId) return json({ error: 'requestId and factoryId are required.' }, 400, req);

    // Request must exist and belong to the caller.
    const { data: reqRow } = await admin
      .from('requests').select('id, buyer_id, title_en, title_ar').eq('id', requestId).maybeSingle();
    if (!reqRow) return json({ error: 'Request not found.' }, 404, req);
    if (reqRow.buyer_id !== user.id) return json({ error: 'Not your request.' }, 403, req);

    // Factory must exist and be active. Email resolved SERVER-SIDE here.
    const { data: factory } = await admin
      .from('factory_directory').select('id, company_name, email, is_active').eq('id', factoryId).maybeSingle();
    if (!factory || !factory.is_active) return json({ error: 'Factory not found.' }, 404, req);

    // Optional product name (product-bound request).
    let productName = '';
    if (factoryProductId) {
      const { data: p } = await admin
        .from('factory_products').select('name_en, name_zh, name_ar').eq('id', factoryProductId).maybeSingle();
      productName = p?.name_en || p?.name_zh || p?.name_ar || '';
    }
    if (!productName) productName = reqRow.title_en || reqRow.title_ar || '';

    // Create the invite (slug defaults via gen_short_slug); retry on the rare
    // slug collision by re-inserting (a fresh default slug is generated each try).
    let slug = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: inserted, error } = await admin
        .from('request_factory_invites')
        .insert({
          request_id: requestId,
          factory_id: factoryId,
          factory_product_id: factoryProductId || null,
          factory_email: factory.email,
          created_by: user.id,
        })
        .select('id, slug')
        .single();
      if (!error && inserted) { slug = inserted.slug; break; }
      if (error && error.code !== '23505') {
        return json({ error: 'Failed to create invite.', detail: error.message }, 500, req);
      }
    }
    if (!slug) return json({ error: 'Could not allocate an invite slug.' }, 500, req);

    // Send the factory email over the internal secret (factory_request is
    // server-only, and the factory address is not a Maabar user).
    const link = `${SITE_URL}/f/${slug}`;
    const res = await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'X-Maabar-Internal': INTERNAL_SECRET,
      },
      body: JSON.stringify({
        type: 'custom_marketing',
        to: factory.email,
        data: {
          lang: 'en',
          subject: 'New quote request on Maabar',
          kicker: 'Maabar',
          headline: factory.company_name || 'New quote request',
          paragraphs: [
            'A buyer on Maabar has requested a quote from your factory.',
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
    if (!res.ok) {
      // The invite exists; the email failed. Report so the client can surface it
      // (the invite stays 'sent'; admin can re-trigger).
      return json({ ok: false, slug, error: 'Email send failed.', detail: body?.error || `HTTP ${res.status}` }, 502, req);
    }

    return json({ ok: true, slug }, 200, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error.' }, 500, req);
  }
});
