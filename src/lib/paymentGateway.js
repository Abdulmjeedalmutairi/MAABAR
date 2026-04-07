const PLACEHOLDER_KEYS = ['pk_test_YOUR_KEY_HERE', 'pk_live_YOUR_KEY_HERE'];

export function getMoyasarPublishableKey() {
  return String(process.env.REACT_APP_MOYASAR_PUBLISHABLE_KEY || '').trim();
}

export function isMoyasarConfigured(key = getMoyasarPublishableKey()) {
  if (!key) return false;
  if (PLACEHOLDER_KEYS.includes(key)) return false;
  return /^pk_(test|live)_/i.test(key);
}
