/**
 * Product certifications — load/save/upload helpers for the supplier form.
 *
 * Storage path convention (Phase 1 migration set up the bucket + RLS):
 *   product-certifications/<user.id>/<product.id>/<cert_type>_<timestamp>.pdf
 *
 * The form holds an array of cert rows, each with either an existing DB id
 * (loaded from product_certifications) or a `_new` flag for unsaved rows.
 * Save is delete-and-rewrite: any DB row whose id no longer appears in the
 * supplied list is deleted (and its PDF removed from storage).
 */

import { BUCKET_PRODUCT_CERTS, removeStorageObjectByUrl } from './productMediaCleanup';

export const CERT_TYPES = ['SASO', 'CE', 'FCC', 'RoHS', 'ISO', 'FDA', 'HALAL', 'OTHER'];
export const CERT_MAX_COUNT = 10;
export const CERT_MAX_BYTES = 10 * 1024 * 1024; // matches Phase 1 bucket limit

const uid = () => Math.random().toString(36).slice(2, 9);

export const emptyCertRow = () => ({
  _key: uid(),
  _new: true,
  cert_type: '',
  cert_label: '',
  cert_file_url: '',
  issued_date: '',
  expiry_date: '',
  // The local File object pending upload (cleared after a successful save).
  _pendingFile: null,
});

// Load existing certs for a product. Returns an array shaped like the form
// expects (ids preserved so the save phase can diff against them).
export async function loadProductCertifications(sb, productId) {
  if (!productId) return [];
  const { data, error } = await sb
    .from('product_certifications')
    .select('id, cert_type, cert_label, cert_file_url, issued_date, expiry_date, created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[loadProductCertifications] error:', error);
    return [];
  }

  return (data || []).map(r => ({
    _key: r.id,
    id: r.id,
    cert_type: r.cert_type || '',
    cert_label: r.cert_label || '',
    cert_file_url: r.cert_file_url || '',
    issued_date: r.issued_date || '',
    expiry_date: r.expiry_date || '',
  }));
}

// Build the storage object path for a new cert. Public URL is composed by the
// caller after a successful upload.
function buildCertPath(userId, productId, certType) {
  const safeType = String(certType || 'OTHER').replace(/[^A-Za-z0-9_-]/g, '');
  return `${userId}/${productId}/${safeType}_${Date.now()}_${uid()}.pdf`;
}

// Upload a PDF File and return its public URL (or null on failure).
export async function uploadCertificationFile(sb, file, { userId, productId, certType }) {
  if (!file) return null;
  if (file.size > CERT_MAX_BYTES) {
    return { error: 'too_large' };
  }
  if (file.type && file.type !== 'application/pdf') {
    return { error: 'wrong_type' };
  }

  const path = buildCertPath(userId, productId, certType);
  const { error } = await sb.storage.from(BUCKET_PRODUCT_CERTS).upload(path, file, {
    upsert: true,
    contentType: 'application/pdf',
  });
  if (error) {
    console.error('[uploadCertificationFile] upload error:', error);
    return { error: 'upload_failed', detail: error.message };
  }
  const { data } = sb.storage.from(BUCKET_PRODUCT_CERTS).getPublicUrl(path);
  return { url: data?.publicUrl || null };
}

// Save the cert set for a product. Diffs against existing DB rows, removing
// any that the supplier dropped (and their storage objects). Inserts new ones,
// uploading any pending PDFs first.
//
// `nextCerts` — the form's current array.
// `prevCerts` — the array returned by loadProductCertifications when editing
//   started (used to compute deletions). Pass [] for a new product.
export async function saveProductCertifications(sb, { productId, userId, nextCerts, prevCerts = [] }) {
  if (!productId || !userId) return { error: new Error('productId and userId are required') };

  const safeNext = Array.isArray(nextCerts) ? nextCerts : [];
  const safePrev = Array.isArray(prevCerts) ? prevCerts : [];

  // ── Diff: which prev certs are no longer in next? Delete them.
  const nextIds = new Set(safeNext.filter(c => c?.id).map(c => c.id));
  const removed = safePrev.filter(p => p?.id && !nextIds.has(p.id));
  for (const r of removed) {
    if (r.cert_file_url) {
      await removeStorageObjectByUrl(sb, BUCKET_PRODUCT_CERTS, r.cert_file_url);
    }
    const { error: delErr } = await sb.from('product_certifications').delete().eq('id', r.id);
    if (delErr) console.error('[saveProductCertifications] delete error:', delErr);
  }

  // ── Insert new rows (those without an id). Upload any pending file first.
  for (const cert of safeNext) {
    if (cert.id) continue; // already persisted; supplier did not change

    const certType = String(cert.cert_type || '').toUpperCase();
    if (!CERT_TYPES.includes(certType)) {
      console.warn('[saveProductCertifications] skipping cert with invalid type:', cert);
      continue;
    }
    if (certType === 'OTHER' && !String(cert.cert_label || '').trim()) {
      console.warn('[saveProductCertifications] skipping OTHER cert without label');
      continue;
    }

    let fileUrl = cert.cert_file_url || null;
    if (cert._pendingFile) {
      const uploaded = await uploadCertificationFile(sb, cert._pendingFile, {
        userId,
        productId,
        certType,
      });
      if (uploaded?.error) {
        console.error('[saveProductCertifications] upload failed:', uploaded);
        continue;
      }
      fileUrl = uploaded.url;
    }

    const row = {
      product_id: productId,
      cert_type: certType,
      cert_label: cert.cert_label ? String(cert.cert_label).trim() || null : null,
      cert_file_url: fileUrl,
      issued_date: cert.issued_date || null,
      expiry_date: cert.expiry_date || null,
    };
    console.log('[saveProductCertifications] insert', row);
    const { error: insErr } = await sb.from('product_certifications').insert(row);
    if (insErr) {
      console.error('[saveProductCertifications] insert error:', insErr);
      // If the DB insert failed but we already uploaded the file, remove it
      // so we do not leak orphaned objects.
      if (fileUrl && !cert.cert_file_url) {
        await removeStorageObjectByUrl(sb, BUCKET_PRODUCT_CERTS, fileUrl);
      }
    }
  }

  return { error: null };
}
