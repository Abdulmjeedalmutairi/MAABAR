const STORAGE_PREFIX = 'maabar_moyasar_checkout_';

function getStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function createPendingMoyasarCheckoutKey() {
  return `mysr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function savePendingMoyasarCheckout(payload, key = createPendingMoyasarCheckoutKey()) {
  const storage = getStorage();
  if (!storage) return key;

  try {
    storage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify({
      ...payload,
      savedAt: new Date().toISOString(),
    }));
  } catch {}

  return key;
}

export function loadPendingMoyasarCheckout(key) {
  const storage = getStorage();
  if (!storage || !key) return null;

  try {
    const raw = storage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearPendingMoyasarCheckout(key) {
  const storage = getStorage();
  if (!storage || !key) return;

  try {
    storage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {}
}

export function buildMoyasarCallbackUrl(key) {
  if (typeof window === 'undefined') return `/payment-success?stateKey=${encodeURIComponent(key)}`;
  const url = new URL('/payment-success', window.location.origin);
  url.searchParams.set('stateKey', key);
  return url.toString();
}

export function buildMoyasarAmountMinorUnits(amount) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 0;
  return Math.round(numericAmount * 100);
}
