export const SUPPLIER_VERIFICATION_REQUIRED_KEYS = [
  'reg_number',
  'years_experience',
  'license_photo',
  'factory_photo',
];

export function normalizeSupplierDocStoragePath(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return '';

  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  if (!trimmed.startsWith('http')) {
    return trimmed.replace(/^supplier-docs\//, '');
  }

  try {
    const parsed = new URL(trimmed);
    const bucketMarker = '/supplier-docs/';
    const markerIndex = parsed.pathname.indexOf(bucketMarker);
    if (markerIndex === -1) return '';
    return decodeURIComponent(parsed.pathname.slice(markerIndex + bucketMarker.length));
  } catch {
    return '';
  }
}

export function getSupplierVerificationState(profile = {}) {
  const missingKeys = SUPPLIER_VERIFICATION_REQUIRED_KEYS.filter((key) => {
    const value = profile?.[key];
    if (typeof value === 'number') return Number.isNaN(value);
    return !value;
  });

  const hasContactMethod = Boolean(profile?.wechat || profile?.whatsapp);
  const payoutMethod = profile?.pay_method || '';
  const isPayoutComplete = payoutMethod === 'alipay'
    ? Boolean(profile?.alipay_account)
    : payoutMethod === 'swift'
      ? Boolean(profile?.swift_code && profile?.bank_name)
      : false;

  return {
    missingKeys,
    missingCount: missingKeys.length,
    hasContactMethod,
    isVerificationComplete: missingKeys.length === 0,
    payoutMethod,
    isPayoutComplete,
  };
}
