import { sb } from '../supabase';

// Factory conversations, unified onto the `messages` table (replacing the old
// factory_threads stack). Addressing convention:
//   • buyer → factory :  sender_id = buyer, receiver_id = NULL, factory_id = F
//   • factory owner → buyer : sender_id = owner, receiver_id = buyer, factory_id = F
// The owner resolves the thread via factory_directory.linked_supplier_id (RLS),
// so buyer→factory messages simply wait until the factory registers. No masking.

// Compact product card stored on a message so both sides render it without a join.
export function buildProductRef(p) {
  if (!p || !p.id) return null;
  return {
    id: p.id, factory_id: p.factory_id || null,
    name_ar: p.name_ar || null, name_en: p.name_en || null,
    image: p.image || null, ref_code: p.ref_code || null,
    price: p.price || null, currency: p.currency || null,
  };
}

// A factory's public identity (buyers can't read base factory_directory).
export async function fetchFactoryIdentity(factoryId) {
  const { data } = await sb.from('factory_directory_public')
    .select('id, company_name, company_name_latin, city, country, profile_image, category')
    .eq('id', factoryId).maybeSingle();
  return data || null;
}

// ── Buyer side ──────────────────────────────────────────────────────────────
// All messages of my conversation with factory F, chronological.
export async function fetchBuyerFactoryMessages(factoryId, myId) {
  const { data, error } = await sb.from('messages')
    .select('*')
    .eq('factory_id', factoryId)
    .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Buyer sends to the factory (receiver_id NULL — resolves to the owner on claim).
export async function sendBuyerFactoryMessage(factoryId, myId, content, productRef = null) {
  const body = (content || '').trim();
  if (!body) throw new Error('empty');
  const { data, error } = await sb.from('messages')
    .insert({ sender_id: myId, receiver_id: null, factory_id: factoryId, content: body, product_ref: productRef || null })
    .select('*').single();
  if (error) throw error;
  return data;
}

// ── Factory-owner side ──────────────────────────────────────────────────────
// One thread: all messages between factory F and trader T, chronological.
export async function fetchOwnerFactoryMessages(factoryId, traderId) {
  const { data, error } = await sb.from('messages')
    .select('*')
    .eq('factory_id', factoryId)
    .or(`sender_id.eq.${traderId},receiver_id.eq.${traderId}`)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// The owner's factory conversations, grouped by (factory, trader), newest first,
// with buyer + factory identities, last preview and unread (trader messages the
// owner hasn't read). RLS returns only the owner's factories' rows.
export async function fetchMyOwnerThreads(myId) {
  const { data, error } = await sb.from('messages')
    .select('id, sender_id, receiver_id, factory_id, content, created_at, is_read')
    .not('factory_id', 'is', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const threads = {};
  for (const m of (data || [])) {
    // The trader is the non-owner party. A buyer→factory inbound has receiver
    // NULL (trader = sender); an owner reply has sender = me (trader = receiver).
    const trader = m.sender_id === myId ? m.receiver_id : m.sender_id;
    if (!trader) continue;
    const key = `${m.factory_id}:${trader}`;
    if (!threads[key]) threads[key] = { factory_id: m.factory_id, trader_id: trader, last_preview: '', last_at: null, unread: 0 };
    threads[key].last_preview = m.content;   // ascending → last wins
    threads[key].last_at = m.created_at;
    if (m.sender_id !== myId && !m.is_read) threads[key].unread += 1;
  }
  const list = Object.values(threads).sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
  if (!list.length) return [];
  const traderIds = [...new Set(list.map((t) => t.trader_id))];
  const facIds = [...new Set(list.map((t) => t.factory_id))];
  const [{ data: profs }, { data: facs }] = await Promise.all([
    sb.from('profile_directory').select('id, full_name, company_name, avatar_url').in('id', traderIds),
    sb.from('factory_directory_public').select('id, company_name, company_name_latin').in('id', facIds),
  ]);
  const pm = Object.fromEntries((profs || []).map((p) => [p.id, p]));
  const fm = Object.fromEntries((facs || []).map((f) => [f.id, f]));
  return list.map((t) => ({ ...t, trader: pm[t.trader_id] || null, factory: fm[t.factory_id] || null }));
}

// Owner replies to trader T on factory F.
export async function sendOwnerFactoryMessage(factoryId, ownerId, traderId, content) {
  const body = (content || '').trim();
  if (!body) throw new Error('empty');
  const { data, error } = await sb.from('messages')
    .insert({ sender_id: ownerId, receiver_id: traderId, factory_id: factoryId, content: body })
    .select('*').single();
  if (error) throw error;
  return data;
}
