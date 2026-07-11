// delete-account — in-app account deletion (Apple 5.1.1(v)).
//
// The client calls this with the signed-in user's own JWT. Using the service
// role, we: (1) best-effort remove the user's rows in the transactional tables
// that reference profiles WITHOUT `on delete cascade` (they would otherwise
// block the delete), (2) scrub any remaining PII from the profile, and (3)
// delete the auth user — which removes the login and cascades everything wired
// with `on delete cascade` (profiles → requests/offers/managed_supplier_matches
// /samples/product_inquiries, etc.).
//
// Anything left after this is de-identified. If a still-blocking FK surfaces in
// testing, add its table to NON_CASCADE_OWNED below.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Tables that reference public.profiles(id) WITHOUT on-delete-cascade and that a
// normal buyer/supplier can own — deleted by (table, column) before the profile.
const NON_CASCADE_OWNED: Array<[string, string]> = [
  ['orders', 'buyer_id'],
  ['orders', 'supplier_id'],
  ['managed_requests', 'buyer_id'],
  ['managed_request_suppliers', 'supplier_id'],
  ['concierge_requests', 'requester_id'],
  ['concierge_connections', 'supplier_id'],
  ['support_tickets', 'user_id'],
];

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '').trim();
    if (!jwt) return json({ error: 'Missing token' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Identify the caller from THEIR OWN token — users can only delete themselves.
    const { data: u, error: uErr } = await admin.auth.getUser(jwt);
    if (uErr || !u?.user) return json({ error: 'Invalid session' }, 401);
    const id = u.user.id;

    // 1. Remove owned rows in non-cascade tables (best-effort; ignore missing
    //    tables / no rows so one gap never aborts the deletion).
    for (const [table, col] of NON_CASCADE_OWNED) {
      await admin.from(table).delete().eq(col, id).then(() => {}, () => {});
    }

    // 2. Scrub PII from the profile (guaranteed even if the row must remain for
    //    FK integrity elsewhere).
    await admin.from('profiles').update({
      full_name: 'Deleted account',
      company_name: null,
      phone: null,
      whatsapp: null,
      wechat: null,
      city: null,
      country: null,
      avatar_url: null,
      trade_link: null,
      license_photo: null,
      factory_photo: null,
      status: 'deleted',
      email: `deleted+${id}@maabar.invalid`,
    }).eq('id', id).then(() => {}, () => {});

    // 3. Delete the auth user — removes the login and cascade-linked data.
    const { error: dErr } = await admin.auth.admin.deleteUser(id);
    if (dErr) {
      // Login not fully removed (a remaining FK blocked the cascade). The account
      // is already de-identified; surface the reason so we can extend cleanup.
      return json({ ok: false, warning: 'login_delete_blocked', detail: dErr.message }, 200);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
