import { sb } from '../supabase';

// Data layer for the admin Catalog Import tool. Reads the staging tables
// (factory_catalog_imports + factory_catalog_import_products, admin-RLS) and, on
// approval, commits into the live factory_directory / factory_products tables.
// All writes are client-side under is_admin_user() RLS (MVP; batched inserts).

export const HIGH_CONF = 0.7;

// Cloud Run worker that runs the Python extraction (PyMuPDF + Gemini). Set
// REACT_APP_CATALOG_WORKER_URL to the deployed service URL. Empty until deployed.
export const CATALOG_WORKER_URL = (process.env.REACT_APP_CATALOG_WORKER_URL || '').replace(/\/$/, '');
export const workerConfigured = () => !!CATALOG_WORKER_URL;

const nf = (v) => (v && v !== 'not_found' ? v : null);
const tri = (o, k) => (o && o[k] && o[k] !== 'not_found' ? o[k] : null);
// private_label may arrive as a checkbox boolean (admin) or Gemini's "yes"/"no".
const bool = (v) => v === true || v === 'yes' || v === 'true' || v === 1;
// Founded year → a plausible 4-digit int, else null (drops "not_found"/garbage).
const yr = (v) => {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) && n >= 1800 && n <= 2100 ? n : null;
};

// ── Upload + trigger (admin dashboard import) ───────────────────────────────
// Upload a catalog PDF to the private factory-catalogs bucket and create the
// 'queued' import row. Returns the new import id.
export async function createImport(file, notes = '') {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${id}/source.pdf`;
  const up = await sb.storage.from('factory-catalogs').upload(path, file, {
    contentType: file.type || 'application/pdf', upsert: true,
  });
  if (up.error) throw up.error;
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb.from('factory_catalog_imports').insert({
    id, source_pdf_path: path, original_filename: file.name, status: 'queued',
    uploaded_by: user?.id ?? null,
    import_notes: (notes || '').trim() || null,
  });
  if (error) throw error;
  return id;
}

// Cancel a running extraction — the worker checks this at its next milestone
// and aborts cooperatively (best-effort; a single long Gemini call finishes first).
export async function cancelImport(importId) {
  const { error } = await sb.from('factory_catalog_imports')
    .update({ status: 'cancelled', progress: null }).eq('id', importId);
  if (error) throw error;
}

// Delete an import entirely: the row (staged products cascade) + its storage
// objects (source PDF + extracted images). Storage cleanup is best-effort.
export async function deleteImport(importId) {
  try {
    const [{ data: imgs }] = await Promise.all([
      sb.storage.from('factory-images').list(importId, { limit: 1000 }),
    ]);
    if (imgs?.length) {
      await sb.storage.from('factory-images').remove(imgs.map((f) => `${importId}/${f.name}`));
    }
    await sb.storage.from('factory-catalogs').remove([`${importId}/source.pdf`]);
  } catch { /* best-effort storage cleanup */ }
  const { error } = await sb.from('factory_catalog_imports').delete().eq('id', importId);
  if (error) throw error;
}

// Update the per-catalog guidance (used to re-curate with new instructions).
export async function updateImportNotes(importId, notes) {
  const { error } = await sb.from('factory_catalog_imports')
    .update({ import_notes: (notes || '').trim() || null }).eq('id', importId);
  if (error) throw error;
}

// Kick off extraction on the Cloud Run worker. The worker verifies the caller is
// an admin via this access token, runs the (multi-minute) job, and updates the
// import row itself — the UI should poll the row's status rather than block here.
export async function triggerExtraction(importId) {
  if (!CATALOG_WORKER_URL) throw new Error('worker_not_configured');
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('not_authenticated');
  const res = await fetch(`${CATALOG_WORKER_URL}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ import_id: importId }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`extract ${res.status}: ${t.slice(0, 200)}`);
  }
  return res.json().catch(() => ({}));
}

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
    .select('id, company_name, company_name_latin, category, city, founded_year, export_markets, moq_note, private_label, description_ar, description_en, is_verified, is_featured, is_active')
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
      moq_note: nf(fields.moq),
      private_label: bool(fields.private_label),
      description_ar: nf(fields.description_ar),
      description_en: nf(fields.description_en),
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
      moq_note: nf(fields.moq),
      private_label: bool(fields.private_label),
      description_ar: nf(fields.description_ar),
      description_en: nf(fields.description_en),
      is_verified: !!fields.is_verified,
      is_featured: !!fields.is_featured,
    };
    if (profileImage) patch.profile_image = profileImage;
    if (nf(fields.name_original)) patch.company_name = nf(fields.name_original);   // guarded — never blank the name
    if (nf(fields.name_en)) patch.company_name_latin = nf(fields.name_en);
    await sb.from('factory_directory').update(patch).eq('id', factoryId);
  }
  await sb.from('factory_catalog_imports').update({ factory_id: factoryId, status: 'reviewing' }).eq('id', importId);
  return factoryId;
}

// ── Factory removal ─────────────────────────────────────────────────────────
// 'archive' → hide from the site (is_active=false); reversible, keeps products.
// 'delete'  → permanent: factory_products cascade-delete with the row. Blocked by
//   an ON DELETE RESTRICT FK if any buyer request/invite still references it —
//   surfaced as a friendly error so the admin archives instead.
export async function archiveFactory(factoryId, active = false) {
  const { error } = await sb.from('factory_directory').update({ is_active: active }).eq('id', factoryId);
  if (error) throw error;
}

export async function deleteFactory(factoryId) {
  const { error } = await sb.from('factory_directory').delete().eq('id', factoryId);
  if (error) {
    // 23503 = FK violation (a request_factory_invite still points here).
    if (error.code === '23503' || /foreign key/i.test(error.message || '')) {
      const e = new Error('has_requests');
      e.code = 'HAS_REQUESTS';
      throw e;
    }
    throw error;
  }
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
