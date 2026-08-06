import { sb } from '../supabase';

// Anonymous, slug-gated preview of a prepared factory profile + waiting-activity
// counts (no email/phone, no trader identity, no raw message text).
export async function getFactoryClaimPreview(slug) {
  const { data, error } = await sb.rpc('get_factory_claim_preview', { p_slug: slug });
  if (error) throw error;
  return (data && data[0]) || null;
}

// Bind the signed-in account to the factory (first-claimant-wins). Returns
// { factory_id, thread_id } — thread_id is the latest conversation to enter.
export async function claimFactoryBySlug(slug) {
  const { data, error } = await sb.rpc('claim_factory_by_slug', { p_slug: slug });
  if (error) throw error;
  return (data && data[0]) || null;
}
