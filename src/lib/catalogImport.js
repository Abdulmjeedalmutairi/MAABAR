import * as tus from 'tus-js-client';
import { sb, SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase';
import { normalizeCerts } from './certifications';

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
// SHA-256 hex of a File — a stable CONTENT fingerprint for duplicate detection
// (catches the same catalog even if it was renamed). Runs in the browser.
export async function hashFile(file) {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Find a PRIOR import of the same file (by content hash) — the most recent match,
// or null. Used to warn before re-importing the same catalog.
export async function findImportByHash(hash) {
  if (!hash) return null;
  const { data, error } = await sb.from('factory_catalog_imports')
    .select('id, original_filename, status, created_at, factory_id, factory_fields')
    .eq('file_hash', hash).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return null;
  return data || null;
}

// Resumable (TUS) upload — REQUIRED for large catalog PDFs. The standard
// sb.storage.upload() sends the whole file in a single POST, which the storage
// API gateway rejects/times-out for big bodies (~50MB+) regardless of the
// bucket/global size limit. TUS streams the file in 6MB chunks and resumes if
// the connection drops, so any size up to the project's global limit goes
// through. onProgress(fraction 0..1) is optional. Resolves on success, rejects
// with the tus error otherwise.
async function uploadResumable(bucket, path, file, onProgress) {
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('not_authenticated');
  await new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: { authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'x-upsert': 'true' },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || 'application/pdf',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,   // Supabase requires exactly 6MB chunks (except the last)
      onError: reject,
      onProgress: (sent, total) => { if (onProgress && total) onProgress(sent / total); },
      onSuccess: resolve,
    });
    // Resume a prior interrupted upload of the same file if one exists.
    upload.findPreviousUploads()
      .then((prev) => { if (prev.length) upload.resumeFromPreviousUpload(prev[0]); upload.start(); })
      .catch(() => upload.start());
  });
}

// factoryId (optional) pre-binds the import to an existing supplier — used when
// uploading a catalog from that supplier's page, so it's grouped under them and
// approval lands on their factory.
export async function createImport(file, notes = '', mode = 'curated', fileHash = null, onProgress = null, factoryId = null) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${id}/source.pdf`;
  const hash = fileHash || await hashFile(file).catch(() => null);
  await uploadResumable('factory-catalogs', path, file, onProgress);
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb.from('factory_catalog_imports').insert({
    id, source_pdf_path: path, original_filename: file.name, status: 'queued',
    uploaded_by: user?.id ?? null,
    import_notes: (notes || '').trim() || null,
    extraction_mode: mode === 'full' ? 'full' : 'curated',
    file_hash: hash,
    ...(factoryId ? { factory_id: factoryId } : {}),
  });
  if (error) throw error;
  return id;
}

// Catalog imports belonging to one supplier (for the supplier-page Catalogs tab).
export async function fetchFactoryImports(factoryId) {
  const { data, error } = await sb.from('factory_catalog_imports')
    .select('id, original_filename, catalog_title, status, page_count, extraction_mode, cover_image_path, source_pdf_path, created_at, factory_catalog_import_products(count)')
    .eq('factory_id', factoryId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({ ...r, product_count: r.factory_catalog_import_products?.[0]?.count ?? 0 }));
}

// Short-lived signed URL to download/open a catalog's source PDF.
export async function catalogSourceUrl(sourcePath) {
  if (!sourcePath) return null;
  const { data } = await sb.storage.from('factory-catalogs').createSignedUrl(sourcePath, 300);
  return data?.signedUrl || null;
}

// Switch an existing import between 'curated' and 'full' (before re-running).
export async function updateImportMode(importId, mode) {
  const { error } = await sb.from('factory_catalog_imports')
    .update({ extraction_mode: mode === 'full' ? 'full' : 'curated' }).eq('id', importId);
  if (error) throw error;
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

// Upload a logo/profile image the admin picked from their own device into this
// import's folder in the PUBLIC factory-images bucket. Returns its public URL —
// the caller sets it as the factory profile image (persisted on Save). Used when
// Gemini missed or misidentified the logo.
export async function uploadProfileImage(importId, file) {
  const ext = ((file?.name || '').split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const uid = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const path = `${importId}/logo_${uid}.${ext}`;
  const up = await sb.storage.from('factory-images').upload(path, file, {
    contentType: file.type || 'image/jpeg', upsert: true,
  });
  if (up.error) throw up.error;
  return sb.storage.from('factory-images').getPublicUrl(path).data.publicUrl;
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

// Shared POST to the worker with the caller's admin token.
async function callWorker(path, payload) {
  if (!CATALOG_WORKER_URL) throw new Error('worker_not_configured');
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('not_authenticated');
  const res = await fetch(`${CATALOG_WORKER_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${res.status}: ${t.slice(0, 160)}`); }
  return res.json();
}

// Gemini assist — suggest a field's value (uses the whole context + product image),
// or answer a question about this factory/catalog. Both run on the worker (key stays server-side).
export function assistField({ field, context, imageUrl }) {
  return callWorker('/assist', { mode: 'field', field, context, image_url: imageUrl || null });
}
export function assistAsk({ question, context }) {
  return callWorker('/assist', { mode: 'ask', question, context });
}

// ── Reads ───────────────────────────────────────────────────────────────────
export async function fetchImports() {
  const { data, error } = await sb
    .from('factory_catalog_imports')
    .select('id, original_filename, status, factory_id, factory_fields, page_count, extraction_mode, created_at, factory_catalog_import_products(count)')
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
    .select('id, company_name, company_name_latin, category, city, address, email, phone, founded_year, export_markets, moq_note, private_label, description_ar, description_en, is_verified, is_featured, certifications, is_active')
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
      category: nf(fields.category) || 'other',  // NOT NULL — default when AI missed it
      city: nf(fields.city),
      address: nf(fields.address),           // buyer-visible
      country: fields.country || 'China',
      founded_year: yr(fields.founded_year),
      export_markets: nf(fields.export_markets),
      moq_note: nf(fields.moq),
      private_label: bool(fields.private_label),
      description_ar: nf(fields.description_ar),
      description_en: nf(fields.description_en),
      is_verified: !!fields.is_verified,
      is_featured: !!fields.is_featured,
      certifications: normalizeCerts(fields.certifications),
      profile_image: profileImage || null,
      is_active: false,   // DRAFT — hidden from buyers until the admin publishes
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
      certifications: normalizeCerts(fields.certifications),
    };
    if (profileImage) patch.profile_image = profileImage;
    if (nf(fields.name_original)) patch.company_name = nf(fields.name_original);   // guarded — never blank the name
    if (nf(fields.name_en)) patch.company_name_latin = nf(fields.name_en);
    if (nf(fields.city)) patch.city = nf(fields.city);
    if (nf(fields.address)) patch.address = nf(fields.address);      // buyer-visible
    if (nf(fields.email)) patch.email = nf(fields.email);            // admin-only, guarded (NOT NULL)
    if (nf(fields.phone)) patch.phone = nf(fields.phone);            // admin-only
    await sb.from('factory_directory').update(patch).eq('id', factoryId);
  }
  await sb.from('factory_catalog_imports').update({ factory_id: factoryId, status: 'reviewing' }).eq('id', importId);
  return factoryId;
}

// ── Factory ownership ───────────────────────────────────────────────────────
// The factory this user owns (via linked_supplier_id) — owner RLS. null if none.
export async function fetchMyFactory() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb.from('factory_directory').select('*')
    .eq('linked_supplier_id', user.id).maybeSingle();
  if (error) throw error;
  return data || null;
}

// ── Single-factory management (admin) — edit fields/logo/products anytime ────
export async function fetchFactory(factoryId) {
  const { data, error } = await sb.from('factory_directory').select('*').eq('id', factoryId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFactoryProducts(factoryId) {
  const { data, error } = await sb.from('factory_products').select('*')
    .eq('factory_id', factoryId).order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Distinct image URLs for this factory (its products' images) — candidates for
// the logo picker and for "add product". (Widened to the full catalog by #2.)
export async function fetchFactoryImagePool(factoryId) {
  const prods = await fetchFactoryProducts(factoryId);
  const fac = await fetchFactory(factoryId);
  const urls = [
    ...(Array.isArray(fac?.factory_images) ? fac.factory_images : []),
    fac?.profile_image,
    ...prods.map((p) => p.image),
  ].filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
  return Array.from(new Set(urls));
}

export async function updateFactory(factoryId, patch) {
  const { error } = await sb.from('factory_directory').update(patch).eq('id', factoryId);
  if (error) throw error;
}

export async function updateFactoryProduct(productId, patch) {
  const { error } = await sb.from('factory_products').update(patch).eq('id', productId);
  if (error) throw error;
}

// Set ONE catalog-wide price (or clear to "on request") on EVERY product of a
// factory — for suppliers that quote a single price for the whole range. One
// UPDATE keyed by factory_id, not N per-row round-trips.
export async function setAllFactoryProductsPrice(factoryId, price, currency) {
  const { error } = await sb.from('factory_products')
    .update({ price: price || null, currency: currency || null })
    .eq('factory_id', factoryId);
  if (error) throw error;
}

export async function deleteFactoryProduct(productId) {
  const { error } = await sb.from('factory_products').delete().eq('id', productId);
  if (error) throw error;
}

export async function createFactoryProduct(factoryId, row) {
  const { data, error } = await sb.from('factory_products')
    .insert({ factory_id: factoryId, gallery_images: [], customization_options: [], sort_order: 0, ...row })
    .select('*').single();
  if (error) throw error;
  return data;
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
    price: nf(ej.price),
    currency: nf(ej.currency),
    section_ar: tri(ej.section, 'ar'),
    section_en: tri(ej.section, 'en'),
    ref_code: nf(ej.ref_code),
    also_count: Number.isFinite(+ej.also_count) ? Math.max(0, parseInt(ej.also_count, 10) || 0) : 0,
    image: staged.image_path || null,
    gallery_images: Array.isArray(staged.gallery_paths) ? staged.gallery_paths.filter(Boolean) : [],
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

// Approve EVERY remaining product at once (any confidence) — for catalogs where
// the whole extraction is already good and card-by-card review is unnecessary.
// Touches only not-yet-decided rows (pending / edited); leaves approved + skipped.
export function approveAllPending(factoryId, products, meta = {}) {
  const rows = products.filter((p) => p.status === 'pending' || p.status === 'edited');
  return approveProducts(factoryId, rows, meta);
}

export async function updateStagedProduct(id, extracted_json, image_path) {
  const patch = { extracted_json, status: 'edited' };
  if (image_path !== undefined) patch.image_path = image_path;
  const { error } = await sb.from('factory_catalog_import_products').update(patch).eq('id', id);
  if (error) throw error;
}

// Save a draft: persist the admin's factory-field edits back onto the import row
// (NOT the live factory), without publishing or re-extracting.
export async function updateImportFields(importId, fields) {
  const { error } = await sb.from('factory_catalog_imports')
    .update({ factory_fields: fields, status: 'reviewing' }).eq('id', importId);
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
