/**
 * Product-level tiered pricing helpers.
 *
 * Phase 2 of the B2B product-form upgrade replaces the single
 * `products.price_from` value with a mandatory 3-row tier set
 * stored in `product_pricing_tiers` with variant_id = NULL.
 *
 * This module is the single source of truth for:
 *   • shape of an in-form tier row
 *   • load (DB → form), save (form → DB) — delete-and-rewrite
 *   • validation (returns localized error or '')
 *   • derived `price_from` (lowest unit price across tiers)
 *
 * All strings come from the T table to satisfy the i18n rule.
 */

import { T } from './supplierDashboardConstants';

const TIER_COUNT = 3;

// ── Shape ──────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

export const emptyTier = () => ({
  _key: uid(),
  qty_from: '',
  qty_to: '',
  unit_price: '',
});

export const emptyTierSet = () => Array.from({ length: TIER_COUNT }, emptyTier);

// Pad an array to exactly 3 rows. If a legacy product has 0/1/2 tiers,
// extra empties are appended so the form always renders the full table.
export function padToThree(tiers) {
  const list = Array.isArray(tiers) ? tiers.slice(0, TIER_COUNT) : [];
  while (list.length < TIER_COUNT) list.push(emptyTier());
  return list;
}


// ── Parsing ────────────────────────────────────────────────────────────

function toIntOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) && Number.isInteger(n) ? n : NaN;
}

function toNumberOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// Parse a single tier into typed values.
// Returns { qty_from: int|null, qty_to: int|null, unit_price: number|null, ok: bool }
// `ok` is false if any field is non-numeric (NaN). `null` is allowed
// for qty_to on the last tier (= unlimited) and for any field that
// is simply blank.
function parseTier(tier) {
  const qty_from   = toIntOrNull(tier?.qty_from);
  const qty_to     = toIntOrNull(tier?.qty_to);
  const unit_price = toNumberOrNull(tier?.unit_price);
  const ok = !Number.isNaN(qty_from) && !Number.isNaN(qty_to) && !Number.isNaN(unit_price);
  return { qty_from, qty_to, unit_price, ok };
}


// ── Derived: price_from for backward compat ────────────────────────────

// The cheapest per-unit price across all valid tiers. Used to populate
// the legacy `products.price_from` so old listing pages keep working.
export function computePriceFromTiers(tiers) {
  const prices = (Array.isArray(tiers) ? tiers : [])
    .map(t => toNumberOrNull(t?.unit_price))
    .filter(p => p !== null && !Number.isNaN(p) && p > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}


// ── Validation ─────────────────────────────────────────────────────────

// Returns '' when valid, otherwise a localized error message.
//
// Rules per the Phase 2 spec:
//   • exactly 3 tiers
//   • each tier has qty_from, qty_to, unit_price
//     (tier 3's qty_to may be blank → null = unlimited)
//   • tier_i.qty_from < tier_i.qty_to (within a tier; qty_to nullable on last)
//   • no overlap between tiers (tier_i.qty_to < tier_{i+1}.qty_from)
//   • unit_price > 0
//   • unit_price strictly descending (tier 2 < tier 1, tier 3 < tier 2)
//
// `effectiveMoq` is used to coerce a blank tier-1 qty_from to MOQ at
// validation time — matches the form's "pre-filled with MOQ" behavior.
export function validateProductTiers(tiers, effectiveMoq, lang = 'en') {
  const t = T[lang] || T.en;

  if (!Array.isArray(tiers) || tiers.length !== TIER_COUNT) {
    return t.tierValidationCount;
  }

  const moqInt = toIntOrNull(effectiveMoq);
  const moqIsValid = moqInt !== null && !Number.isNaN(moqInt) && moqInt >= 1;

  const parsed = tiers.map((row, idx) => {
    const p = parseTier(row);
    // Coerce blank tier-1 qty_from to MOQ.
    if (idx === 0 && p.qty_from === null && moqIsValid) {
      return { ...p, qty_from: moqInt };
    }
    return p;
  });

  for (let i = 0; i < TIER_COUNT; i++) {
    const p = parsed[i];
    if (!p.ok) return t.tierValidationNumeric(i + 1);

    // Required fields per tier
    if (p.qty_from === null) return t.tierValidationQtyFromMissing(i + 1);
    if (p.unit_price === null) return t.tierValidationPriceMissing(i + 1);
    // qty_to required for tiers 1 & 2; nullable for tier 3
    if (i < TIER_COUNT - 1 && p.qty_to === null) {
      return t.tierValidationQtyToMissing(i + 1);
    }

    // Positive constraints
    if (p.qty_from < 1) return t.tierValidationQtyFromMin(i + 1);
    if (p.unit_price <= 0) return t.tierValidationPricePositive(i + 1);

    // Within-tier ordering
    if (p.qty_to !== null && p.qty_from >= p.qty_to) {
      return t.tierValidationQtyOrder(i + 1);
    }
  }

  // Cross-tier ordering: each tier's qty_from must be > previous tier's qty_to.
  for (let i = 1; i < TIER_COUNT; i++) {
    const prev = parsed[i - 1];
    const curr = parsed[i];
    if (prev.qty_to !== null && curr.qty_from <= prev.qty_to) {
      return t.tierValidationOverlap(i + 1);
    }
  }

  // Unit price strictly descending across the full set.
  for (let i = 1; i < TIER_COUNT; i++) {
    if (parsed[i].unit_price >= parsed[i - 1].unit_price) {
      return t.tierValidationDescending(i + 1);
    }
  }

  return '';
}


// ── DB I/O ─────────────────────────────────────────────────────────────

// Load product-level tiers (variant_id IS NULL). Always returns 3 rows
// (padding with empties if the DB has fewer). Each row carries a fresh
// `_key` for React rendering.
export async function loadProductPricingTiers(sb, productId) {
  const { data, error } = await sb
    .from('product_pricing_tiers')
    .select('id, qty_from, qty_to, unit_price')
    .eq('product_id', productId)
    .is('variant_id', null)
    .order('qty_from', { ascending: true });

  if (error) {
    console.error('[loadProductPricingTiers] error:', error);
    return emptyTierSet();
  }

  const rows = (data || []).map(r => ({
    _key: r.id,
    qty_from:   r.qty_from   != null ? String(r.qty_from)   : '',
    qty_to:     r.qty_to     != null ? String(r.qty_to)     : '',
    unit_price: r.unit_price != null ? String(r.unit_price) : '',
  }));

  return padToThree(rows);
}

// Delete-and-rewrite. Saves the supplied tier set as the canonical
// product-level tiers (variant_id = NULL). Returns null on success or
// the first error encountered.
//
// The form is expected to have already passed validateProductTiers
// before calling this. `effectiveMoq` is used to coerce a blank tier-1
// qty_from to MOQ (mirrors validation).
export async function saveProductPricingTiers(sb, productId, tiers, effectiveMoq) {
  if (!productId) return new Error('productId is required');

  // Wipe existing product-level tiers only — leave variant-level tiers alone.
  const { error: delErr } = await sb
    .from('product_pricing_tiers')
    .delete()
    .eq('product_id', productId)
    .is('variant_id', null);
  if (delErr) {
    console.error('[saveProductPricingTiers] delete error:', delErr);
    return delErr;
  }

  const moqInt = toIntOrNull(effectiveMoq);
  const moqIsValid = moqInt !== null && !Number.isNaN(moqInt) && moqInt >= 1;

  const rows = (Array.isArray(tiers) ? tiers : []).slice(0, TIER_COUNT).map((row, idx) => {
    const p = parseTier(row);
    let qty_from = p.qty_from;
    if (idx === 0 && qty_from === null && moqIsValid) qty_from = moqInt;
    return {
      product_id: productId,
      variant_id: null,
      qty_from:   qty_from,
      qty_to:     p.qty_to,
      unit_price: p.unit_price,
    };
  }).filter(r =>
    r.qty_from !== null && !Number.isNaN(r.qty_from) &&
    r.unit_price !== null && !Number.isNaN(r.unit_price) && r.unit_price > 0
  );

  if (!rows.length) return null;

  console.log('[saveProductPricingTiers] inserting tiers:', rows);
  const { error: insErr } = await sb.from('product_pricing_tiers').insert(rows);
  if (insErr) {
    console.error('[saveProductPricingTiers] insert error:', insErr);
    return insErr;
  }
  return null;
}
