/**
 * Product price lookup — single source of truth for the "price from" display
 * value across the app, post-Phase-4 migration that drops products.price_from.
 *
 * Pages that show a per-product price now embed the product's pricing tiers in
 * their query (PRODUCT_TIER_EMBED) and call deriveProductPriceFrom() to render
 * the lowest unit price.
 *
 * Tier rows with variant_id IS NULL are product-level tiers; rows with a
 * non-null variant_id are per-SKU and ignored here.
 */

// Append this to a `from('products').select(...)` to get tier rows alongside
// the product. The result shape is:
//   { ...product, product_pricing_tiers: [{ unit_price, variant_id }, ...] }
export const PRODUCT_TIER_EMBED = 'product_pricing_tiers(unit_price, variant_id)';

// Returns the lowest product-level unit_price for a product, or null when no
// tiers are present. Accepts either a product row with embedded tiers, or a
// raw tiers array.
export function deriveProductPriceFrom(productOrTiers) {
  const tiers = Array.isArray(productOrTiers)
    ? productOrTiers
    : (productOrTiers?.product_pricing_tiers || []);
  if (!Array.isArray(tiers) || !tiers.length) return null;
  const prices = tiers
    .filter(t => t && (t.variant_id === null || t.variant_id === undefined))
    .map(t => Number(t.unit_price))
    .filter(p => Number.isFinite(p) && p > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

// Convenience: return both the from-price and the highest tier price (a "to"
// reference for displaying "$7.90 – $9.00 / unit" where useful).
export function deriveProductPriceRange(productOrTiers) {
  const tiers = Array.isArray(productOrTiers)
    ? productOrTiers
    : (productOrTiers?.product_pricing_tiers || []);
  const prices = (Array.isArray(tiers) ? tiers : [])
    .filter(t => t && (t.variant_id === null || t.variant_id === undefined))
    .map(t => Number(t.unit_price))
    .filter(p => Number.isFinite(p) && p > 0);
  if (!prices.length) return { from: null, to: null };
  return { from: Math.min(...prices), to: Math.max(...prices) };
}
