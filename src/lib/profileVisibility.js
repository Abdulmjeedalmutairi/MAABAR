export async function fetchProfileDirectoryByIds(sb, ids = []) {
  if (!ids.length) return [];
  const { data } = await sb
    .from('profiles')
    .select('id, full_name, company_name, role, status, avatar_url, city, country, speciality, maabar_supplier_id, trade_link, lang, rating, reviews_count, years_experience, year_established, factory_images')
    .in('id', ids);
  return data || [];
}

export async function fetchSupplierPublicProfileById(sb, id) {
  if (!id) return null;
  const { data } = await sb
    .from('profiles')
    .select('id, full_name, company_name, role, status, avatar_url, city, country, speciality, maabar_supplier_id, trade_link, bio_ar, bio_en, bio_zh, factory_images, min_order_value, languages, rating, reviews_count, year_established, business_type, customization_support, company_address, company_description, export_markets, certifications, years_experience, completion_rate, company_website, export_years')
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

export async function attachSupplierProfiles(sb, items = [], idKey = 'supplier_id', profileKey = 'profiles') {
  if (!items.length) return items;
  const ids = [...new Set(items.map(i => i[idKey]).filter(Boolean))];
  if (!ids.length) return items;
  const profiles = await fetchProfileDirectoryByIds(sb, ids);
  const map = Object.fromEntries(profiles.map(p => [p.id, p]));
  return items.map(item => ({ ...item, [profileKey]: map[item[idKey]] || null }));
}