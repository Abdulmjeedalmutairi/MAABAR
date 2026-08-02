// Signed-URL minting for factory-facing request attachments.
//
// The /f/<slug> page is public (anonymous factory), and request attachments live
// in the PRIVATE request-attachments bucket. This function hands the factory a
// short-lived signed URL for an attachment — but ONLY after verifying the path
// actually belongs to the invite's request. The slug is the bearer token (same
// trust model as get_factory_invite); the path is checked against
// request_customization.attachment_paths so no arbitrary object can be signed.
//
// verify_jwt=false (config.toml): the factory has no account when it first opens
// the link, so no JWT is required — access is gated by the secret slug + path check.
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
const BUCKET = 'request-attachments';
const TTL_SECONDS = 600; // 10 minutes

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
    const { slug, paths } = await req.json();
    const wanted: string[] = Array.isArray(paths) ? paths.filter((p) => typeof p === 'string') : [];
    if (!slug || wanted.length === 0) return json({ error: 'slug and paths are required.' }, 400, req);

    // Resolve the invite (secret slug is the bearer).
    const { data: invite } = await admin
      .from('request_factory_invites').select('request_id, expires_at').eq('slug', slug).maybeSingle();
    if (!invite) return json({ error: 'Invite not found.' }, 404, req);
    if (invite.expires_at && new Date(invite.expires_at) <= new Date()) return json({ error: 'This link has expired.' }, 403, req);

    // The requested paths MUST belong to this request's attachments.
    const { data: cust } = await admin
      .from('request_customization').select('attachment_paths').eq('request_id', invite.request_id).maybeSingle();
    const allowed = new Set<string>(Array.isArray(cust?.attachment_paths) ? cust!.attachment_paths : []);
    const safe = wanted.filter((p) => allowed.has(p));
    if (safe.length === 0) return json({ error: 'No matching attachments.' }, 403, req);

    // Sign each allowed path. Skip any that fail rather than failing the batch.
    const urls: Record<string, string> = {};
    for (const p of safe) {
      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(p, TTL_SECONDS);
      if (signed?.signedUrl) {
        urls[p] = signed.signedUrl.startsWith('http') ? signed.signedUrl : `${SUPABASE_URL}${signed.signedUrl}`;
      }
    }
    return json({ urls }, 200, req);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Unexpected error.' }, 500, req);
  }
});
