import { sb } from '../supabase';

// Data layer for the admin Catalog Import tool. Reads the staging tables
// (factory_catalog_imports + factory_catalog_import_products, admin-RLS) and, on
// approval, commits into the live factory_directory / factory_products tables.
// All writes are client-side under is_admin_user() RLS (MVP; batched inserts).

export const HIGH_CONF = 0.7;

const nf = (v) => (v && v !== 'not_found' ? v : null);
const tri = (o, k) => (o && o[k] && o[k] !== 'not_found' ? o[k] : null);
// Founded year → a plausible 4-digit int, else null (drops "not_found"/garbage).
const yr = (v) => {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) && n >= 1800 && n <= 2100 ? n : null;
};

// ── Reads ───────────────────────────────────────────────────────────────────
export async function fetchImports() {
  const { data, error } = await sb
    .from('factory_catalog_imports')
    .select('id, original_filename, status, factory_id, factory_fields, page_count, created_at, factory_catalog_import_products(count)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({
    ...r,
    product_count: r.factory_catalog_import_products?.[0]?.count ?? 0,
  }));
}

export async function fetchImport(id) {
  const [{ data: imp, error: e1 }, { data: products, error: e2 }] = await Promise.all([
    sb.from('factory_catalog_imports').select('*').eq('id', id).maybeSingle(),
    sb.from('factory_catalog_import_products').select('*').eq('import_id', id)
      .order('confidence_score', { ascending: true }).order('sort_order', { ascending: true }),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  return { batch: imp, products: products || [] };
}

// Existing factories (for the "attach to existing" option).
export async function fetchFactories() {
  const { data, error } = await sb
    .from('factory_directory')
    .select('id, company_name, company_name_latin, category, city, founded_year, export_markets, is_verified, is_featured')
    .order('company_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Factory resolve: create new, or attach to an existing factory_directory ──
export async function resolveFactory({ importId, mode, fields, existingId, profileImage }) {
  let factoryId = existingId;
  if (mode === 'new') {
    const row = {
      company_name: nf(fields.name_original) || nf(fields.name_en) || 'Unnamed factory',
      company_name_latin: nf(fields.name_en),
      email: nf(fields.email) || '',        // NOT NULL column — UI should require it
      phone: nf(fields.phone),
      category: fields.category,             // required UI_CATEGORIES code
      city: nf(fields.city),
      country: fields.country || 'China',
      founded_year: yr(fields.founded_year),
      export_markets: nf(fields.export_markets),
      is_verified: !!fields.is_verified,
      is_featured: !!fields.is_featured,
      profile_image: profileImage || null,
      is_active: true,
    };
    const { data, error } = await sb.from('factory_directory').insert(row).select('id').single();
    if (error) throw error;
    factoryId = data.id;
  } else {
    // Attach to existing: refresh the profile image (only if a new one was picked)
    // plus the admin-editable profile fields (founded_year / export_markets).
    const patch = {
      founded_year: yr(fields.founded_year),
      export_markets: nf(fields.export_markets),
      is_verified: !!fields.is_verified,
      is_featured: !!fields.is_featured,
    };
    if (profileImage) patch.profile_image = profileImage;
    await sb.from('factory_directory').update(patch).eq('id', factoryId);
  }
  await sb.from('factory_catalog_imports').update({ factory_id: factoryId, status: 'reviewing' }).eq('id', importId);
  return factoryId;
}

// ── Product approval (staged → factory_products) ────────────────────────────
// meta = { factoryName, categoryAr, categoryEn } — used ONLY to synthesize a
// fallback name when the catalog genuinely had none.
function mapProduct(factoryId, staged, meta = {}) {
  const ej = staged.extracted_json || {};
  let nameAr = tri(ej.product_name, 'ar');
  let nameEn = tri(ej.product_name, 'en');
  if (!nameAr && !nameEn) {
    // Name genuinely absent → store a professional fallback (not a blank), kept
    // consistent everywhere: "{Category} — {Factory}" / "Product — {Factory}".
    const fac = meta.factoryName || 'Factory';
    nameAr = `${meta.categoryAr || 'منتج'} — ${fac}`;
    nameEn = `${meta.categoryEn || 'Product'} — ${fac}`;
  }
  return {
    factory_id: factoryId,
    import_id: staged.import_id || null,   // traceability → "Available Catalogs" grouping
    name_ar: nameAr,
    name_en: nameEn,
    description_ar: tri(ej.description, 'ar'),
    description_en: tri(ej.description, 'en'),
    specifications_ar: tri(ej.specifications, 'ar'),
    specifications_en: tri(ej.specifications, 'en'),
    customization_options: Array.isArray(ej.customization_options) ? ej.customization_options : [],
    moq: nf(ej.moq),
    ref_code: nf(ej.ref_code),
    image: staged.image_path || null,
    gallery_images: [],
    sort_order: staged.sort_order ?? 0,
  };
}

// Batched insert into factory_products, then mark the staged rows approved.
// approved_product_id is linked only for a single-row approve (deck), to avoid
// N round-trips on a bulk approve of hundreds.
export async function approveProducts(factoryId, stagedRows, meta = {}) {
  if (!stagedRows.length) return { count: 0 };
  const rows = stagedRows.map((s) => mapProduct(factoryId, s, meta));
  const { data: inserted, error } = await sb.from('factory_products').insert(rows).select('id');
  if (error) throw error;
  const ids = stagedRows.map((s) => s.id);
  await sb.from('factory_catalog_import_products').update({ status: 'approved' }).in('id', ids);
  if (stagedRows.length === 1 && inserted?.[0]?.id) {
    await sb.from('factory_catalog_import_products')
      .update({ approved_product_id: inserted[0].id }).eq('id', stagedRows[0].id);
  }
  return { count: rows.length };
}

export function approveProduct(factoryId, staged, meta = {}) {
  return approveProducts(factoryId, [staged], meta);
}

export function bulkApproveHighConfidence(factoryId, products, meta = {}, threshold = HIGH_CONF) {
  const rows = products.filter((p) => p.status === 'pending' && (p.confidence_score ?? 0) >= threshold);
  return approveProducts(factoryId, rows, meta);
}

export async function updateStagedProduct(id, extracted_json) {
  const { error } = await sb.from('factory_catalog_import_products')
    .update({ extracted_json, status: 'edited' }).eq('id', id);
  if (error) throw error;
}

export async function skipProduct(id) {
  const { error } = await sb.from('factory_catalog_import_products').update({ status: 'skipped' }).eq('id', id);
  if (error) throw error;
}

export async function finalizeImport(id) {
  const { error } = await sb.from('factory_catalog_imports').update({ status: 'approved' }).eq('id', id);
  if (error) throw error;
}
