// Public resolver for a supplier share link.
//
// Takes only a token. Validates it against supplier_share_links (exists, not
// revoked, not expired), then returns the supplier profile plus FRESHLY signed
// URLs for the verification documents. Nothing is served without a live token,
// and no signed URL is ever persisted — each view mints its own short-lived set,
// so forwarding an old response body gains nothing once the link is revoked.
//
// verify_jwt is off for this function (the partner has no account); the token IS
// the credential. See supabase/config.toml.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const DOC_BUCKET = 'supplier-docs';
const SIGN_TTL_SECONDS = 60 * 30; // 30 minutes, same as the admin screen

// Only these columns leave the building. The partner needs enough to verify a
// factory on the ground; everything else on profiles stays out.
const PROFILE_FIELDS = [
  'id', 'company_name', 'full_name', 'maabar_supplier_id', 'status',
  'country', 'city', 'address', 'reg_number', 'years_experience',
  'speciality', 'trade_link', 'whatsapp', 'wechat', 'created_at',
  'license_photo', 'legal_rep_id_photo', 'address_proof_photo',
  'factory_photo', 'factory_images', 'factory_videos',
].join(',');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}

// Port of normalizeSupplierDocStoragePath() from src/lib/supplierOnboarding.js.
// Kept behaviourally identical: two upload codepaths historically wrote to
// factory_images in different formats, and diverging here would show the partner
// broken thumbnails for exactly the older suppliers.
function normalizeDocPath(rawValue: string): string {
  if (!rawValue || typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';
  if (!trimmed.startsWith('http')) return trimmed.replace(new RegExp(`^${DOC_BUCKET}/`), '');
  try {
    const parsed = new URL(trimmed);
    const marker = `/${DOC_BUCKET}/`;
    const i = parsed.pathname.indexOf(marker);
    if (i === -1) return '';
    return decodeURIComponent(parsed.pathname.slice(i + marker.length));
  } catch {
    return '';
  }
}

async function signAll(paths: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(paths.filter(Boolean).map(async (raw) => {
    // Legacy rows may hold a fully-qualified public URL to a DIFFERENT bucket
    // (product-images). Those are already viewable and must be passed through
    // untouched rather than signed — same rule the admin screen applies.
    if (/^https?:\/\//i.test(raw) && !raw.includes(`/${DOC_BUCKET}/`)) { out[raw] = raw; return; }
    const p = normalizeDocPath(raw);
    if (!p) return;
    const { data } = await admin.storage.from(DOC_BUCKET).createSignedUrl(p, SIGN_TTL_SECONDS);
    if (data?.signedUrl) out[raw] = data.signedUrl;
  }));
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const { token } = await req.json().catch(() => ({ token: '' }));
    const clean = String(token || '').trim();
    // Tokens are always 64 hex chars — reject anything else before touching the DB.
    if (!/^[0-9a-f]{64}$/.test(clean)) return json({ error: 'invalid' }, 404);

    // Cheap per-IP ceiling. The token space makes brute force impractical anyway,
    // but this keeps someone from hammering the endpoint. Fail-open on limiter
    // errors so a limiter outage never blocks a legitimate partner.
    const ip = clientIp(req);
    const hour = new Date(); hour.setUTCMinutes(0, 0, 0);
    const { data: hits, error: rateErr } = await admin.rpc('ai_rate_bump', {
      p_key: `ip:${ip}:supplier_share:hour`, p_window: hour.toISOString(),
    });
    if (!rateErr && Number(hits) > 120) return json({ error: 'rate_limited' }, 429);

    const { data: link, error: linkErr } = await admin
      .from('supplier_share_links')
      .select('token, supplier_id, expires_at, revoked_at')
      .eq('token', clean)
      .maybeSingle();

    if (linkErr) return json({ error: 'server' }, 500);
    // One undifferentiated 404 for missing / revoked / expired: never confirm that
    // a token once existed.
    if (!link) return json({ error: 'invalid' }, 404);
    if (link.revoked_at) return json({ error: 'revoked' }, 410);
    if (new Date(link.expires_at).getTime() < Date.now()) return json({ error: 'expired' }, 410);

    const { data: supplier, error: supErr } = await admin
      .from('profiles').select(PROFILE_FIELDS).eq('id', link.supplier_id).maybeSingle();
    if (supErr || !supplier) return json({ error: 'invalid' }, 404);

    const rawPaths = [
      supplier.license_photo, supplier.legal_rep_id_photo, supplier.address_proof_photo,
      supplier.factory_photo,
      ...(Array.isArray(supplier.factory_images) ? supplier.factory_images : []),
      ...(Array.isArray(supplier.factory_videos) ? supplier.factory_videos : []),
    ].filter(Boolean) as string[];

    const files = await signAll(rawPaths);

    // Audit the view (atomic increment). Best-effort: never fail the response
    // over the counter.
    const { error: viewErr } = await admin.rpc('touch_supplier_share_link', { p_token: clean });
    if (viewErr) console.error('[supplier-share] view counter:', viewErr.message);

    return json({ supplier, files, expiresAt: link.expires_at });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unexpected error.' }, 500);
  }
});
