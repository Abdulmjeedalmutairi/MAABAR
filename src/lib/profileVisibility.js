/**
 * profileVisibility — helpers for fetching supplier/profile data
 * while respecting visibility settings.
 */

export async function fetchProfileDirectoryByIds(sb, ids = []) {
  if (!ids.length) return [];
  const { data } = await sb
    .from('profiles')
    .select('id, full_name, company_name, role, avatar_url, city, country, speciality, is_reviewed, maabar_supplier_id, trade_link, wechat, whatsapp')
    .in('id', ids);
  return data || [];
}

export async function fetchSupplierPublicProfileById(sb, id) {
  if (!id) return null;
  const { data } = await sb
    .from('profiles')
    .select('id, full_name, company_name, role, avatar_url, city, country, speciality, is_reviewed, maabar_supplier_id, trade_link, wechat, whatsapp, bio, product_categories, factory_images, factory_video_url, min_order_value, lead_time_days, payment_terms, shipping_methods, certifications, languages')
    .eq('id', id)
    .single();
  return data || null;
}

export async function attachDirectoryProfiles(sb, items = [], idKey = 'supplier_id') {
  if (!items.length) return items;
  const ids = [...new Set(items.map(i => i[idKey]).filter(Boolean))];
  if (!ids.length) return items;
  const profiles = await fetchProfileDirectoryByIds(sb, ids);
  const map = Object.fromEntries(profiles.map(p => [p.id, p]));
  return items.map(item => ({ ...item, _profile: map[item[idKey]] || null }));
}

export async function attachSupplierProfiles(sb, items = [], idKey = 'supplier_id') {
  return attachDirectoryProfiles(sb, items, idKey);
}
