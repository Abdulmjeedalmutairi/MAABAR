// Admin → factory branded email.
//
// Sends a MAABAR-branded invitation/notification email to a factory from the Admin
// Console. The factory address is resolved SERVER-SIDE from factory_directory
// (admin-only data); the caller must be an authenticated admin; the mail goes out
// through send-email's `custom_marketing` template over the internal secret (branded
// logo + CTA, per-language). An admin may also pass `toOverride` to send to any
// address manually (test copy / ad-hoc factory not in the directory).
//
// verify_jwt=true (config.toml): the admin's JWT is required to reach this.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

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
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function json(body: unknown, status = 200, req: Request) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, req);

  try {
    if (!INTERNAL_SECRET) return json({ error: 'Server is missing MAABAR_INTERNAL_SECRET.' }, 500, req);

    const authHeader = req.headers.get('Authorization') || '';
    const caller = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: 'Authentication required.' }, 401, req);
    const { data: actor } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = String(actor?.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') return json({ error: 'Admins only.' }, 403, req);

    const { factoryId, toOverride, lang, headline, paragraphs, ctaUrl, ctaText } = await req.json();
    const paras = Array.isArray(paragraphs) ? paragraphs.filter((p: unknown) => typeof p === 'string' && p.trim()).slice(0, 12) : [];
    if (!paras.length) return json({ error: 'paragraphs required.' }, 400, req);
    const useLang = lang === 'zh' ? 'zh' : lang === 'ar' ? 'ar' : 'en';

    // Recipient: an admin-supplied manual/test address, else the factory's stored email.
    let to = '';
    const override = String(toOverride || '').trim();
    if (override) {
      if (!EMAIL_RE.test(override)) return json({ error: 'Invalid email.' }, 400, req);
      to = override;
    } else {
      if (!factoryId || typeof factoryId !== 'string') return json({ error: 'factoryId required.' }, 400, req);
      const { data: fac, error: facErr } = await admin.from('factory_directory').select('email').eq('id', factoryId).maybeSingle();
      if (facErr) return json({ error: 'Failed to load factory.', detail: facErr.message }, 500, req);
      if (!fac) return json({ error: 'Factory not found.' }, 404, req);
      to = String(fac.email || '').trim();
      if (!to) return json({ error: 'This factory has no email on file.' }, 400, req);
    }

    const res = await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'X-Maabar-Internal': INTERNAL_SECRET },
      body: JSON.stringify({
        type: 'custom_marketing',
        to,
        data: {
          lang: useLang,
          kicker: 'MAABAR',
          headline: String(headline || '').slice(0, 160),
          paragraphs: paras.map((p: string) => p.slice(0, 800)),
          ...(ctaUrl ? { ctaUrl: String(ctaUrl).slice(0, 500), ctaText: String(ctaText || 'Open').slice(0, 60) } : { hideCta: true }),
        },
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return json({ error: String(body?.error || `send-email HTTP ${res.status}`) }, 502, req);

    admin.from('audit_log').insert({
      actor_id: user.id, action: 'admin_factory_email', entity_type: 'factory_directory', entity_id: factoryId || null,
      before_state: null, after_state: { to, test: !!override, headline: String(headline || '').slice(0, 160), lang: useLang },
    }).then(() => {}, (e) => console.error('[admin-factory-email] audit failed:', e?.message));

    return json({ ok: true, to }, 200, req);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500, req);
  }
});
