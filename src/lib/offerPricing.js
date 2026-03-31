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

export function getOfferShippingMethod(offer) {
  return String(offer?.shipping_method || '').trim();
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
