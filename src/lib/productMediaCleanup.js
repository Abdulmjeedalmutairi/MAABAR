/**
 * Storage object cleanup — removes the actual file from a Supabase storage
 * bucket when a supplier removes a media reference from a product.
 *
 * Call sites:
 *   • removeImageAt → cleanupGalleryImage
 *   • removeVideo   → cleanupVideo
 *   • cert removal  → cleanupCertificationFile
 *
 * The web app stores public-bucket URLs of the form:
 *   https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path...>
 *
 * If the URL points at a different host or shape, the helper logs and skips.
 * The DB-level reference is the source of truth — orphan files are non-fatal.
 */

// Extract the path-inside-bucket from a Supabase public URL. Returns null when
// the URL does not match the expected shape or the bucket name does not match.
export function pathInBucketFromUrl(url, bucket) {
  if (!url || !bucket) return null;
  try {
    const u = new URL(String(url));
    // Pathname like: /storage/v1/object/public/<bucket>/<rest...>
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx < 0) return null;
    const rest = u.pathname.slice(idx + marker.length);
    return rest ? decodeURIComponent(rest) : null;
  } catch (_err) {
    return null;
  }
}

// Remove a single object from a bucket, given a public URL. Wrapped in
// try/catch — if the file is already gone or the URL is foreign, we log and
// move on rather than blocking the user's save.
export async function removeStorageObjectByUrl(sb, bucket, url) {
  const path = pathInBucketFromUrl(url, bucket);
  if (!path) {
    console.warn('[storageCleanup] skipped (not a', bucket, 'URL):', url);
    return;
  }
  try {
    const { error } = await sb.storage.from(bucket).remove([path]);
    if (error) console.warn('[storageCleanup] remove error:', bucket, path, error.message);
  } catch (err) {
    console.warn('[storageCleanup] remove exception:', bucket, path, err?.message || err);
  }
}

// Bucket aliases used by the rest of the codebase. Keeping them in one spot
// helps avoid typos and makes future bucket renames a one-line change.
// NOTE: product gallery images AND product videos both live in `product-images`
// (single bucket, distinguished by filename prefix). The Phase-1 migration
// added a separate `product-certifications` bucket for PDF certs.
export const BUCKET_PRODUCT_MEDIA = 'product-images';
export const BUCKET_PRODUCT_CERTS = 'product-certifications';
