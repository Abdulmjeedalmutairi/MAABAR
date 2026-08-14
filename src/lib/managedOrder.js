import { sb } from '../supabase';

// Managed-order data layer — the trader's tracker feed + the admin's lifecycle
// controls. The offer/deposit reuse order_invoices (the premium invoice + Telr).

export async function fetchManagedTracker(requestId) {
  const [reqRes, evRes, invRes] = await Promise.all([
    sb.from('requests')
      .select('id, request_ref, title_ar, title_en, title_zh, quantity, unit, managed_status, status, created_at, assigned_to, budget_per_unit, budget_currency, reference_image, payment_plan')
      .eq('id', requestId).maybeSingle(),
    sb.from('managed_events').select('*').eq('request_id', requestId).order('created_at', { ascending: true }),
    sb.from('order_invoices').select('*').eq('request_id', requestId).order('created_at', { ascending: false }).limit(1),
  ]);
  return { request: reqRes.data || null, events: evRes.data || [], offer: (invRes.data && invRes.data[0]) || null };
}

export async function fetchAccountManager(userId) {
  if (!userId) return null;
  const { data } = await sb.from('profiles').select('full_name, avatar_url').eq('id', userId).maybeSingle();
  return data || null;
}

// ── Admin lifecycle controls ────────────────────────────────────────────────
export async function addManagedEvent({ requestId, stage, kind = 'note', title, body, mediaUrl, visibleToBuyer = true }) {
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from('managed_events').insert({
    request_id: requestId, stage: stage || null, kind, title: title || null, body: body || null,
    media_url: mediaUrl || null, visible_to_buyer: visibleToBuyer, created_by: user?.id || null,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function setManagedStage(requestId, managedStatus) {
  const { error } = await sb.from('requests').update({ managed_status: managedStatus }).eq('id', requestId);
  if (error) throw error;
}

// Upload the pre-shipping video / a managed document to the managed-media bucket.
export async function uploadManagedMedia(requestId, file) {
  const ext = ((file?.name || '').split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
  const path = `${requestId}/${Date.now()}.${ext}`;
  const up = await sb.storage.from('managed-media').upload(path, file, { contentType: file.type || 'video/mp4', upsert: true });
  if (up.error) throw up.error;
  return sb.storage.from('managed-media').getPublicUrl(path).data.publicUrl;
}
