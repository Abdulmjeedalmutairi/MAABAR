import { sb } from '../supabase';

// Data layer for the Admin Console "Suppliers" section — a UNIFIED, deduped list
// of every registered supplier plus the unclaimed directory factories:
//   • profiles (role='supplier')            → registered suppliers (real status).
//        origin 'factory_claim' if a factory_directory row links to them,
//        otherwise origin 'organic'.
//   • factory_directory (linked_supplier_id IS NULL) → unclaimed directory
//        factories, origin 'directory' (a prepared page, not yet a real account).
// A CLAIMED factory (is_active=false, linked_supplier_id set) is represented by
// its supplier profile row, NOT its factory row, so a claimed company appears once.
// Admins read both base tables directly under is_admin_user() RLS.

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const newest = (arr) => arr.filter(Boolean).sort().pop() || null;

export async function fetchConsoleSuppliers() {
  const [
    { data: facs, error: facErr },
    { data: prods },
    { data: imps },
    { data: sups, error: supErr },
    { data: sprods },
  ] = await Promise.all([
    sb.from('factory_directory').select(
      'id, company_name, company_name_latin, category, city, country, address, profile_image, ' +
      'factory_images, certifications, is_verified, is_featured, is_active, private_label, ' +
      'linked_supplier_id, email, phone, founded_year, export_markets, description_ar, description_en, ' +
      'created_at, updated_at, updated_by',
    ),
    sb.from('factory_products').select('factory_id, updated_at'),
    sb.from('factory_catalog_imports').select('factory_id, created_at'),
    sb.from('profiles').select(
      'id, full_name, company_name, company_name_latin, country, city, speciality, status, ' +
      'maabar_supplier_id, avatar_url, phone, whatsapp, email, created_at',
    ).eq('role', 'supplier'),
    sb.from('products').select('supplier_id, updated_at'),
  ]);
  if (facErr) throw facErr;
  if (supErr) throw supErr;

  // Resolve the last editor's display name for each factory (updated_by → profile).
  // Editors are staff/admins, not in the supplier `sups` set, so fetch separately.
  const editorIds = [...new Set((facs || []).map((f) => f.updated_by).filter(Boolean))];
  const editorMap = {};
  if (editorIds.length) {
    const { data: eds } = await sb.from('profiles').select('id, full_name, email').in('id', editorIds);
    for (const e of eds || []) editorMap[e.id] = nf(e.full_name) || nf(e.email) || null;
  }
  const editorName = (id) => (id ? editorMap[id] || null : null);

  // factory_products / catalog imports → per-factory counts + last activity
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

  // legacy products (supplier_id) → per-supplier counts + last activity
  const spCount = {}, spLast = {};
  for (const p of sprods || []) {
    const s = p.supplier_id; if (!s) continue;
    spCount[s] = (spCount[s] || 0) + 1;
    if (p.updated_at && (!spLast[s] || p.updated_at > spLast[s])) spLast[s] = p.updated_at;
  }

  // profileId → its (claimed, deactivated) factory row, so a claim keeps a link
  // to the archival factory detail and we can skip that factory row below.
  const factoryByOwner = {};
  for (const f of facs || []) { if (f.linked_supplier_id) factoryByOwner[f.linked_supplier_id] = f; }

  // (a) every supplier profile → one unified row
  const profileRows = (sups || []).map((p) => {
    const fac = factoryByOwner[p.id] || null;
    const statusL = String(p.status || '').trim().toLowerCase();
    return {
      id: p.id,
      kind: 'profile',
      origin: fac ? 'factory_claim' : 'organic',
      // claimed → the archival factory detail (shows the linked account);
      // organic → the legacy admin supplier detail (no factory_directory row).
      openPath: fac ? `/admin2/suppliers/${fac.id}` : `/admin/suppliers/${p.id}`,
      company_name: nf(p.company_name) || nf(p.full_name),
      company_name_latin: nf(p.company_name_latin),
      category: fac ? fac.category : nf(p.speciality),
      city: nf(p.city),
      country: nf(p.country),
      profile_image: p.avatar_url || fac?.profile_image || null,
      status: p.status || null,
      maabar_supplier_id: nf(p.maabar_supplier_id),
      is_verified: statusL === 'verified',
      is_registered: true,
      is_active: statusL !== 'rejected' && statusL !== 'inactive',
      is_featured: !!fac?.is_featured,
      email: nf(p.email) || nf(fac?.email),
      phone: nf(p.phone) || nf(p.whatsapp) || nf(fac?.phone),
      product_count: spCount[p.id] || 0,
      catalog_count: fac ? (cCount[fac.id] || 0) : 0,
      has_products: (spCount[p.id] || 0) > 0,
      has_catalog: fac ? (cCount[fac.id] || 0) > 0 : false,
      has_profile: true,
      last_activity: newest([p.created_at, spLast[p.id], fac?.updated_at, fac ? pLast[fac.id] : null]),
      last_editor: fac ? editorName(fac.updated_by) : null,
    };
  });

  // (b) unclaimed factories → directory rows (claimed ones are covered above)
  const factoryRows = (facs || []).filter((f) => !f.linked_supplier_id).map((f) => {
    const hasProfile = !!(f.profile_image || nf(f.description_ar) || nf(f.description_en)
      || (Array.isArray(f.factory_images) && f.factory_images.length > 0));
    return {
      ...f,
      kind: 'factory',
      origin: 'directory',
      openPath: `/admin2/suppliers/${f.id}`,
      status: f.is_active ? 'listed' : 'draft',
      product_count: pCount[f.id] || 0,
      catalog_count: cCount[f.id] || 0,
      is_registered: false,
      has_products: (pCount[f.id] || 0) > 0,
      has_catalog: (cCount[f.id] || 0) > 0,
      has_profile: hasProfile,
      last_activity: newest([f.updated_at, pLast[f.id], cLast[f.id], f.created_at]),
      last_editor: editorName(f.updated_by),
    };
  });

  return [...profileRows, ...factoryRows];
}

// Distinct non-empty countries / categories present (for the filter dropdowns).
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
