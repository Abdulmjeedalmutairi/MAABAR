import { sb } from '../supabase';

// Trader side of the factory-thread chat. The TRADER uses the base tables directly
// (RLS: trader_id = auth.uid()). The FACTORY side is masked and goes through
// SECURITY DEFINER RPCs (built in B2). Factory identity is read from the public
// view (base factory_directory isn't buyer-readable).

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
    .select('id, sender_role, content, created_at')
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

// Trader sends a message.
export async function sendTraderMessage(threadId, content) {
  const body = (content || '').trim();
  if (!body) throw new Error('empty');
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from('factory_thread_messages')
    .insert({ thread_id: threadId, sender_role: 'trader', sender_id: user?.id ?? null, content: body, read_by_trader: true })
    .select('id, sender_role, content, created_at').single();
  if (error) throw error;
  return data;
}

// The trader's own factory conversations (for the inbox — wired in B3).
export async function fetchMyTraderThreads() {
  const { data: threads, error } = await sb.from('factory_threads')
    .select('id, factory_id, last_message_at, created_at')
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  const rows = threads || [];
  if (!rows.length) return [];
  const ids = Array.from(new Set(rows.map((r) => r.factory_id)));
  const { data: facs } = await sb.from('factory_directory_public')
    .select('id, company_name, company_name_latin, profile_image').in('id', ids);
  const byId = Object.fromEntries((facs || []).map((f) => [f.id, f]));
  return rows.map((r) => ({ ...r, factory: byId[r.factory_id] || null }));
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

// The factory's own conversations (masked list — for the dashboard inbox in B3).
export async function fetchMyFactoryThreads() {
  const { data, error } = await sb.rpc('get_my_factory_threads');
  if (error) throw error;
  return data || [];
}
