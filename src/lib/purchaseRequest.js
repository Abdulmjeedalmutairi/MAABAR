import { sb } from '../supabase';

// Purchase requests — the buyer's structured form on a product. create_* returns
// the row; the caller then drops a [request:ID] message into the chat with the
// supplier (who reviews it and issues an invoice). See migration 20260814000011.

export async function createPurchaseRequest({ productRef, quantity, variants, details }) {
  const { data, error } = await sb.rpc('create_purchase_request', {
    p_product_ref: productRef,
    p_quantity: quantity != null && quantity !== '' ? Number(quantity) : null,
    p_variants: variants || [],
    p_details: details || {},
  });
  if (error) throw error;
  return data;
}

export async function declinePurchaseRequest(id) {
  const { error } = await sb.rpc('decline_purchase_request', { p_id: id });
  if (error) throw error;
}

export async function fetchPurchaseRequest(id) {
  const { data } = await sb.from('purchase_requests')
    .select('*, product:products(name_ar,name_en,name_zh,image_url)').eq('id', id).maybeSingle();
  return data || null;
}

// Post the request into the buyer↔supplier chat as a [request:ID] card.
export async function sendRequestToSupplierChat(request) {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('not_authenticated');
  const { error } = await sb.from('messages').insert({
    sender_id: user.id, receiver_id: request.supplier_id, content: `[request:${request.id}]`,
  });
  if (error) throw error;
}
