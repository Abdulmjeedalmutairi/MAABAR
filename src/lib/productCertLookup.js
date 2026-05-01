/**
 * Product certification embed + buyer-card helpers.
 *
 * Phase 5C lets the public listing pages (Products, SupplierProfile) show
 * cert badges on each product card without an N+1 query per cert. Pages
 * append PRODUCT_CERT_EMBED to their products select; the helper here
 * normalises the embedded shape into a clean list of cert types ready
 * for chip rendering.
 *
 * Mirrors the pattern of productPriceLookup.js (PRODUCT_TIER_EMBED).
 */

// Append this to a `from('products').select(...)` to include the product's
// certification rows alongside it. Result shape:
//   { ...product, product_certifications: [{ id, cert_type, cert_label }, ...] }
export const PRODUCT_CERT_EMBED = 'product_certifications(id, cert_type, cert_label)';

// Canonical cert types Maabar surfaces as buyer-card chips. Anything outside
// this list (e.g. raw "OTHER" rows) is filtered out at the badge layer because
// the type code alone is not informative on a tiny chip.
export const KNOWN_CERT_TYPES = ['SASO', 'CE', 'FCC', 'RoHS', 'ISO', 'FDA', 'HALAL'];

// Returns a deduped, uppercase list of known cert types for a product.
// Accepts either an embedded product row or a raw certifications array.
// Order is preserved from the DB result; SASO does NOT auto-sort to first
// because the visual emphasis (green tint) is applied at render time.
export function getProductCertTypes(productOrCerts) {
  const certs = Array.isArray(productOrCerts)
    ? productOrCerts
    : (productOrCerts?.product_certifications || []);
  const seen = new Set();
  const types = [];
  for (const c of certs) {
    if (!c || !c.cert_type) continue;
    const t = String(c.cert_type).trim().toUpperCase();
    if (!KNOWN_CERT_TYPES.includes(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    types.push(t);
  }
  return types;
}
