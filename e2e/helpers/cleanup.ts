/**
 * Post-test cleanup — removes the E2E test supplier from Supabase.
 * Must run from Node.js context (not browser), uses service-role key.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co';

function getAdminClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set — add it to .env.test.\n' +
      'The test supplier created during the run will NOT be deleted.',
    );
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Delete a test supplier by email:
 *  1. Find their profile row to get the user ID
 *  2. Delete support_tickets and ticket_messages
 *  3. Delete verification documents from storage
 *  4. Delete profile row
 *  5. Delete the Supabase auth user
 *
 * All steps are attempted best-effort — a failure in one doesn't stop the rest.
 */
export async function cleanupTestSupplier(email: string): Promise<void> {
  let sb: SupabaseClient;
  try {
    sb = getAdminClient();
  } catch (e: unknown) {
    console.warn('[cleanup]', (e as Error).message);
    return;
  }

  console.log(`[cleanup] Removing test supplier: ${email}`);

  // ── 1. Find the user ──────────────────────────────────────────────────────
  const { data: profile, error: profileErr } = await sb
    .from('profiles')
    .select('id')
    .ilike('email', email)
    .maybeSingle();

  if (profileErr) {
    console.warn('[cleanup] Could not find profile:', profileErr.message);
    return;
  }
  if (!profile) {
    // Profile missing — auth user may still exist (e.g. signup failed before trigger ran).
    // Look up via auth.users directly so we can clean up lingering users.
    console.log('[cleanup] No profile found for', email, '— checking auth.users directly');
    const { data: { users }, error: listErr } = await sb.auth.admin.listUsers();
    if (!listErr) {
      const authUser = users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase());
      if (authUser) {
        const { error: authErr } = await sb.auth.admin.deleteUser(authUser.id);
        if (authErr) console.warn('[cleanup] auth delete (no-profile):', authErr.message);
        else console.log('[cleanup] Deleted dangling auth user:', authUser.id);
      }
    }
    return;
  }

  const userId = profile.id as string;

  // ── 2. Delete child rows ──────────────────────────────────────────────────
  const deleteTable = async (table: string, column: string, value: string) => {
    const { error } = await sb.from(table).delete().eq(column, value);
    if (error) console.warn(`[cleanup] ${table} delete:`, error.message);
  };

  // Ticket messages are cascade-deleted with tickets; delete tickets first
  await deleteTable('support_tickets', 'user_id', userId);
  await deleteTable('notifications', 'user_id', userId);
  await deleteTable('email_logs', 'recipient_id', userId);

  // ── 3. Delete verification files from storage ─────────────────────────────
  const BUCKETS = ['verification-docs', 'supplier-media'];
  for (const bucket of BUCKETS) {
    const { data: files } = await sb.storage.from(bucket).list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f: { name: string }) => `${userId}/${f.name}`);
      const { error } = await sb.storage.from(bucket).remove(paths);
      if (error) console.warn(`[cleanup] storage ${bucket}:`, error.message);
      else console.log(`[cleanup] Deleted ${paths.length} file(s) from ${bucket}/${userId}/`);
    }
  }

  // ── 4. Delete profile ──────────────────────────────────────────────────────
  await deleteTable('profiles', 'id', userId);

  // ── 5. Delete auth user ────────────────────────────────────────────────────
  const { error: authErr } = await sb.auth.admin.deleteUser(userId);
  if (authErr) console.warn('[cleanup] auth delete:', authErr.message);
  else console.log('[cleanup] Deleted auth user:', userId);

  console.log(`[cleanup] Done for ${email}`);
}

/**
 * Query the audit_log to verify an admin action was recorded.
 * Returns the matching row or null.
 */
export async function verifyAuditLogEntry(opts: {
  action: string;
  entityType?: string;
  entityId?: string;
}): Promise<Record<string, unknown> | null> {
  let sb: SupabaseClient;
  try { sb = getAdminClient(); } catch { return null; }

  let q = sb
    .from('audit_log')
    .select('*')
    .eq('action', opts.action)
    .order('created_at', { ascending: false })
    .limit(1);

  if (opts.entityType) q = q.eq('entity_type', opts.entityType);
  if (opts.entityId)   q = q.eq('entity_id', opts.entityId);

  const { data } = await q;
  return data?.[0] as Record<string, unknown> | null ?? null;
}

/**
 * Query email_logs for a specific email type.
 * Returns matching rows.
 */
export async function queryEmailLogs(opts: {
  recipientId?: string;
  templateName?: string;
  status?: string;
  limitToLast?: number;
}): Promise<Array<Record<string, unknown>>> {
  let sb: SupabaseClient;
  try { sb = getAdminClient(); } catch { return []; }

  let q = sb
    .from('email_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limitToLast ?? 10);

  if (opts.recipientId)   q = q.eq('recipient_id', opts.recipientId);
  if (opts.templateName)  q = q.eq('template_name', opts.templateName);
  if (opts.status)        q = q.eq('status', opts.status);

  const { data } = await q;
  return (data ?? []) as Array<Record<string, unknown>>;
}
