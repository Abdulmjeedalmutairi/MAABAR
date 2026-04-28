export function getOfferUnitPrice(offer) {
  const value = Number.parseFloat(offer?.price);
  return Number.isFinite(value) ? value : 0;
}

export function getOfferShippingCost(offer) {
  const value = Number.parseFloat(offer?.shipping_cost);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function hasOfferShippingCost(offer) {
  return offer?.shipping_cost !== null && offer?.shipping_cost !== undefined && offer?.shipping_cost !== '';
}

export function getOfferShippingMethod(offer, lang) {
  const raw = String(offer?.shipping_method || '').trim();
  if (!raw) return '';
  if (!lang) return raw;
  // Numeric-only values (the canonical shape after the supplier write fix)
  // get formatted with the viewer's lang. Free-form / legacy lang-baked
  // values pass through unchanged.
  const numeric = parseInt(raw, 10);
  if (Number.isFinite(numeric) && String(numeric) === raw) {
    const unit = lang === 'ar' ? 'يوم' : lang === 'zh' ? '天' : 'days';
    return `${numeric} ${unit}`;
  }
  return raw;
}

// Strips CJK characters (and CJK punctuation/halfwidth/fullwidth blocks) from
// MOQ values so the numeric portion is visible to non-Chinese viewers.
// Example: '500件' -> '500'. If the entire value is CJK, returns the original.
export function formatMoq(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (!raw) return '';
  const stripped = raw
    .replace(/[一-鿿　-〿＀-￯]+/g, '')
    .trim();
  return stripped || raw;
}

export function getRequestQuantity(request) {
  const value = Number.parseFloat(request?.quantity);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

export function getOfferProductSubtotal(offer, request) {
  return getOfferUnitPrice(offer) * getRequestQuantity(request);
}

export function getOfferEstimatedTotal(offer, request) {
  return getOfferProductSubtotal(offer, request) + getOfferShippingCost(offer);
}
