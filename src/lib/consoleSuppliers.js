import { sb } from '../supabase';

// Data layer for the new Admin Console "Suppliers" section. A supplier IS a
// factory_directory row (decision: factory = supplier). This aggregates the
// per-factory derived signals the list card + filters need — product count,
// catalog count, registration + profile flags, last activity — client-side in a
// few lightweight queries (fine for a single ops user; move to a DB view later
// if the directory grows large).

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');

export async function fetchConsoleSuppliers() {
  const [{ data: facs, error }, { data: prods }, { data: imps }] = await Promise.all([
    sb.from('factory_directory').select(
      'id, company_name, company_name_latin, category, city, country, address, profile_image, ' +
      'factory_images, certifications, is_verified, is_featured, is_active, private_label, ' +
      'linked_supplier_id, email, phone, founded_year, export_markets, description_ar, description_en, ' +
      'created_at, updated_at',
    ),
    sb.from('factory_products').select('factory_id, updated_at'),
    sb.from('factory_catalog_imports').select('factory_id, created_at'),
  ]);
  if (error) throw error;

  const pCount = {}, pLast = {};
  for (const p of prods || []) {
    const f = p.factory_id; if (!f) continue;
    pCount[f] = (pCount[f] || 0) + 1;
    if (p.updated_at && (!pLast[f] || p.updated_at > pLast[f])) pLast[f] = p.updated_at;
  }
  const cCount = {}, cLast = {};
  for (const im of imps || []) {
    const f = im.factory_id; if (!f) continue;
    cCount[f] = (cCount[f] || 0) + 1;
    if (im.created_at && (!cLast[f] || im.created_at > cLast[f])) cLast[f] = im.created_at;
  }

  return (facs || []).map((f) => {
    const hasProfile = !!(f.profile_image || nf(f.description_ar) || nf(f.description_en)
      || (Array.isArray(f.factory_images) && f.factory_images.length > 0));
    const lastActivity = [f.updated_at, pLast[f.id], cLast[f.id], f.created_at]
      .filter(Boolean).sort().pop() || null;
    return {
      ...f,
      product_count: pCount[f.id] || 0,
      catalog_count: cCount[f.id] || 0,
      is_registered: !!f.linked_supplier_id,
      has_products: (pCount[f.id] || 0) > 0,
      has_catalog: (cCount[f.id] || 0) > 0,
      has_profile: hasProfile,
      last_activity: lastActivity,
    };
  });
}

// Distinct non-empty countries / categories present in the directory (for filters).
export function deriveFacets(rows) {
  const countries = new Set(), categories = new Set();
  for (const r of rows) {
    if (nf(r.country)) countries.add(r.country);
    if (nf(r.category)) categories.add(r.category);
  }
  return {
    countries: Array.from(countries).sort(),
    categories: Array.from(categories).sort(),
  };
}
