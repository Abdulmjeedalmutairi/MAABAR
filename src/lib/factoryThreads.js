import { sb } from '../supabase';

// Trader side of the factory-thread chat. The TRADER uses the base tables directly
// (RLS: trader_id = auth.uid()). The FACTORY side is masked and goes through
// SECURITY DEFINER RPCs (built in B2). Factory identity is read from the public
// view (base factory_directory isn't buyer-readable).

// Compact, self-contained product reference stored on a message so both sides can
// render a product card without a join. null for a non-product chat.
export function buildProductRef(p) {
  if (!p || !p.id) return null;
  return {
    id: p.id, factory_id: p.factory_id || null,
    name_ar: p.name_ar || null, name_en: p.name_en || null,
    image: p.image || null, ref_code: p.ref_code || null,
    price: p.price || null, currency: p.currency || null,
  };
}

// Open — or reuse — a conversation with a factory. Returns the thread id.
export async function startFactoryThread(factoryId) {
  const { data, error } = await sb.rpc('start_factory_thread', { p_factory_id: factoryId });
  if (error) throw error;
  return data;
}

// One thread + its factory's public identity.
export async function fetchTraderThread(threadId) {
  const { data: t, error } = await sb.from('factory_threads')
    .select('id, factory_id, share_slug, last_message_at, created_at')
    .eq('id', threadId).maybeSingle();
  if (error) throw error;
  if (!t) return null;
  const { data: f } = await sb.from('factory_directory_public')
    .select('id, company_name, company_name_latin, city, country, profile_image, category')
    .eq('id', t.factory_id).maybeSingle();
  return { ...t, factory: f || null };
}

// Messages in a thread, chronological.
export async function fetchTraderMessages(threadId) {
  const { data, error } = await sb.from('factory_thread_messages')
    .select('id, sender_role, content, product_ref, created_at')
    .eq('thread_id', threadId).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Mark the factory's messages as read by the trader.
export async function markTraderRead(threadId) {
  await sb.from('factory_thread_messages')
    .update({ read_by_trader: true })
    .eq('thread_id', threadId).eq('sender_role', 'factory').eq('read_by_trader', false);
}

// Trader sends a message, optionally carrying a product reference (first message
// of a product-initiated chat).
export async function sendTraderMessage(threadId, content, productRef = null) {
  const body = (content || '').trim();
  if (!body) throw new Error('empty');
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from('factory_thread_messages')
    .insert({ thread_id: threadId, sender_role: 'trader', sender_id: user?.id ?? null, content: body,
      product_ref: productRef || null, read_by_trader: true })
    .select('id, sender_role, content, product_ref, created_at').single();
  if (error) throw error;
  return data;
}

// The trader's own factory conversations, newest first, with unread counts
// (factory messages the trader hasn't read) and last-message preview.
export async function fetchMyTraderThreads() {
  const { data: threads, error } = await sb.from('factory_threads')
    .select('id, factory_id, last_message_at, created_at')
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  const rows = threads || [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const facIds = Array.from(new Set(rows.map((r) => r.factory_id)));
  const [{ data: facs }, { data: msgs }] = await Promise.all([
    sb.from('factory_directory_public').select('id, company_name, company_name_latin, profile_image').in('id', facIds),
    sb.from('factory_thread_messages').select('thread_id, content, sender_role, created_at, read_by_trader')
      .in('thread_id', ids).order('created_at', { ascending: true }),
  ]);
  const byId = Object.fromEntries((facs || []).map((f) => [f.id, f]));
  const preview = {}; const unread = {};
  (msgs || []).forEach((m) => {
    preview[m.thread_id] = m.content;   // last wins (ordered asc)
    if (m.sender_role === 'factory' && !m.read_by_trader) unread[m.thread_id] = (unread[m.thread_id] || 0) + 1;
  });
  return rows.map((r) => ({ ...r, factory: byId[r.factory_id] || null, last_preview: preview[r.id] || '', unread: unread[r.id] || 0 }));
}

// ── Factory side (masked) — everything goes through SECURITY DEFINER RPCs so the
// factory never touches the base tables and never sees the trader's identity. ──

// Anonymous preview of a share link: factory identity + claim state. No trader data.
export async function getFactoryThreadInvite(slug) {
  const { data, error } = await sb.rpc('get_factory_thread_invite', { p_slug: slug });
  if (error) throw error;
  return (data && data[0]) || null;
}

// Bind the (now authenticated) user to the factory on first claim, else enter.
// Returns the thread id; raises if the factory is claimed by another account.
export async function claimAndEnterThread(slug) {
  const { data, error } = await sb.rpc('claim_and_enter_thread', { p_slug: slug });
  if (error) throw error;
  return data;
}

// Factory reads a thread (marks trader messages read); trader identity omitted.
export async function fetchFactoryThreadMessages(threadId) {
  const { data, error } = await sb.rpc('get_factory_thread_messages', { p_thread_id: threadId });
  if (error) throw error;
  return data || [];
}

// Factory sends a reply.
export async function sendFactoryThreadMessage(threadId, content) {
  const body = (content || '').trim();
  if (!body) throw new Error('empty');
  const { data, error } = await sb.rpc('send_factory_thread_message', { p_thread_id: threadId, p_content: body });
  if (error) throw error;
  return data;
}

// The factory's own conversations (masked list — for the dashboard inbox).
export async function fetchMyFactoryThreads() {
  const { data, error } = await sb.rpc('get_my_factory_threads');
  if (error) throw error;
  return data || [];
}

// ── Admin oversight (not masked — sees trader identity + share link) ─────────
export async function adminListFactoryThreads() {
  const { data, error } = await sb.rpc('admin_list_factory_threads');
  if (error) throw error;
  return data || [];
}

// One thread's header (factory + trader identity + share_slug) for the admin view.
export async function adminFetchThread(threadId) {
  const { data: t, error } = await sb.from('factory_threads')
    .select('id, factory_id, trader_id, share_slug, created_at, last_message_at')
    .eq('id', threadId).maybeSingle();
  if (error) throw error;
  if (!t) return null;
  const [{ data: f }, { data: p }] = await Promise.all([
    sb.from('factory_directory').select('id, company_name, company_name_latin, city, country, profile_image, linked_supplier_id').eq('id', t.factory_id).maybeSingle(),
    t.trader_id
      ? sb.from('profiles').select('id, full_name, company_name, email, phone').eq('id', t.trader_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { ...t, factory: f || null, trader: p || null };
}

// A thread's messages for the admin (read-only; admin RLS allows all threads).
export async function adminFetchThreadMessages(threadId) {
  const { data, error } = await sb.from('factory_thread_messages')
    .select('id, sender_role, content, product_ref, created_at')
    .eq('thread_id', threadId).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
