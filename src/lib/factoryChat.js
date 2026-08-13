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
