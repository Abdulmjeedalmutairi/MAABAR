/**
 * Supabase admin client and seed/cleanup helpers.
 *
 * IMPORTANT: these helpers run in Node.js (globalSetup / test fixtures), never
 * in the browser, so it is safe to use the service-role key here.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  'https://utzalmszfqfcofywfetv.supabase.co';

export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.' +
  'SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

export const SEND_EMAIL_URL = `${SUPABASE_URL}/functions/v1/send-email`;

// ─── Admin client ──────────────────────────────────────────────────────────

let _adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set.\n' +
      'Copy .env.test.example → .env.test and fill in the service-role key.\n' +
      'Find it at: Supabase Dashboard → Project Settings → API.'
    );
  }

  _adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _adminClient;
}

// ─── User management ────────────────────────────────────────────────────────

export interface CreateTestUserOptions {
  email: string;
  password: string;
  role: 'supplier' | 'buyer';
  status?: string;
  /** Extra profile columns to set */
  profile?: Record<string, unknown>;
}

/**
 * Create a new Supabase Auth user whose email is pre-confirmed so tests can
 * sign in immediately without clicking an inbox link.
 * Returns the created user's id.
 */
export async function createTestUser(opts: CreateTestUserOptions): Promise<string> {
  const sb = getAdminClient();

  const { data, error } = await sb.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: {
      role: opts.role,
      status: opts.status ?? (opts.role === 'buyer' ? 'active' : 'registered'),
    },
  });

  if (error) throw new Error(`createTestUser failed: ${error.message}`);

  const userId = data.user.id;

  // Upsert the profile row (the DB trigger may or may not have fired)
  const profileRow: Record<string, unknown> = {
    id: userId,
    email: opts.email,
    role: opts.role,
    status: opts.status ?? (opts.role === 'buyer' ? 'active' : 'registered'),
    lang: 'en',
    ...(opts.role === 'supplier'
      ? { company_name: `Test Supplier Co ${userId.slice(0, 6)}` }
      : { full_name: `Test Buyer ${userId.slice(0, 6)}` }),
    ...(opts.profile ?? {}),
  };

  const { error: profileErr } = await sb
    .from('profiles')
    .upsert(profileRow, { onConflict: 'id' });

  if (profileErr) throw new Error(`profile upsert failed: ${profileErr.message}`);

  return userId;
}

/**
 * Update a supplier's profile status directly — simulates admin approval.
 */
export async function setProfileStatus(userId: string, status: string): Promise<void> {
  const sb = getAdminClient();
  const { error } = await sb
    .from('profiles')
    .update({ status })
    .eq('id', userId);
  if (error) throw new Error(`setProfileStatus failed: ${error.message}`);
}

/**
 * Update arbitrary profile columns.
 */
export async function updateProfile(userId: string, patch: Record<string, unknown>): Promise<void> {
  const sb = getAdminClient();
  const { error } = await sb.from('profiles').update(patch).eq('id', userId);
  if (error) throw new Error(`updateProfile failed: ${error.message}`);
}

// ─── Data seeding ────────────────────────────────────────────────────────────

export interface SeedRequestOptions {
  buyerId: string;
  title_en: string;
  title_ar?: string;
  title_zh?: string;
  description_en: string;
  category?: string;
  budget?: number;
  quantity?: number;
}

export async function seedBuyerRequest(opts: SeedRequestOptions): Promise<string> {
  const sb = getAdminClient();

  const { data, error } = await sb
    .from('requests')
    .insert({
      buyer_id: opts.buyerId,
      title_en: opts.title_en,
      title_ar: opts.title_ar ?? opts.title_en,
      title_zh: opts.title_zh ?? opts.title_en,
      description_en: opts.description_en,
      description_ar: opts.description_en,
      description_zh: opts.description_en,
      category: opts.category ?? 'electronics',
      budget: opts.budget ?? 5000,
      quantity: opts.quantity ?? 100,
      status: 'open',
    })
    .select('id')
    .single();

  if (error) throw new Error(`seedBuyerRequest failed: ${error.message}`);
  return data.id as string;
}

export interface SeedOfferOptions {
  requestId: string;
  supplierId: string;
  shippingCost?: number;
  shippingMethod?: string;
  offerNotes?: string;
  status?: string;
}

export async function seedOffer(opts: SeedOfferOptions): Promise<string> {
  const sb = getAdminClient();

  const { data, error } = await sb
    .from('offers')
    .insert({
      request_id: opts.requestId,
      supplier_id: opts.supplierId,
      shipping_cost: opts.shippingCost ?? 200,
      shipping_method: opts.shippingMethod ?? 'DHL',
      offer_notes: opts.offerNotes ?? 'Test offer from e2e suite',
      status: opts.status ?? 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`seedOffer failed: ${error.message}`);
  return data.id as string;
}

// ─── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Delete a test user and all their associated data.
 * Safe to call even if the user does not exist.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const sb = getAdminClient();

  // Delete child data first (FK constraints)
  await sb.from('offers').delete().eq('supplier_id', userId);
  await sb.from('offers').delete().in(
    'request_id',
    sb.from('requests').select('id').eq('buyer_id', userId) as unknown as string[]
  );
  await sb.from('requests').delete().eq('buyer_id', userId);
  await sb.from('products').delete().eq('supplier_id', userId);
  await sb.from('notifications').delete().eq('user_id', userId);
  await sb.from('profiles').delete().eq('id', userId);
  await sb.auth.admin.deleteUser(userId);
}

/**
 * Delete all users whose email matches the e2e test prefix pattern.
 */
export async function cleanupAllTestUsers(emailPrefix = 'e2e-'): Promise<void> {
  const sb = getAdminClient();
  const { data } = await sb.from('profiles').select('id, email').ilike('email', `${emailPrefix}%`);
  if (!data) return;
  for (const row of data) {
    await deleteTestUser(row.id as string).catch(() => {/* best-effort */});
  }
}
