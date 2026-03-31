export const SUPPLIER_APPLICATION_REQUIRED_KEYS = [
  'company_name',
  'country',
  'city',
  'trade_link',
];

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

export function getSupplierApplicationState(profile = {}) {
  const missingCoreKeys = SUPPLIER_APPLICATION_REQUIRED_KEYS.filter((key) => {
    const value = profile?.[key];
    if (typeof value === 'number') return Number.isNaN(value);
    return !value;
  });

  const hasContactMethod = Boolean(profile?.wechat || profile?.whatsapp);
  const requiredCount = SUPPLIER_APPLICATION_REQUIRED_KEYS.length;
  const completedRequiredCount = requiredCount - missingCoreKeys.length;

  return {
    applicationMissingKeys: missingCoreKeys,
    applicationMissingCount: missingCoreKeys.length,
    applicationRequiredCount: requiredCount,
    applicationCompletedRequiredCount: completedRequiredCount,
    applicationProgressPercent: Math.round((completedRequiredCount / requiredCount) * 100),
    hasContactMethod,
    isApplicationComplete: missingCoreKeys.length === 0,
  };
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
    requiredCount: SUPPLIER_VERIFICATION_REQUIRED_KEYS.length,
    completedRequiredCount: SUPPLIER_VERIFICATION_REQUIRED_KEYS.length - missingKeys.length,
    progressPercent: Math.round(((SUPPLIER_VERIFICATION_REQUIRED_KEYS.length - missingKeys.length) / SUPPLIER_VERIFICATION_REQUIRED_KEYS.length) * 100),
    hasContactMethod,
    isVerificationComplete: missingKeys.length === 0,
    payoutMethod,
    isPayoutComplete,
  };
}

export function getSupplierOnboardingState(profile = {}) {
  const application = getSupplierApplicationState(profile);
  const verification = getSupplierVerificationState(profile);
  const status = profile?.status || 'pending';
  const hasSubmittedApplication = application.isApplicationComplete || verification.isVerificationComplete;

  // Current supplier model: one shared signup only, then pending-review until approval.
  let stage = 'under_review';
  if (status === 'active') stage = 'approved';
  else if (status === 'rejected') stage = 'rejected';
  else if (status === 'draft' || status === 'incomplete') stage = 'application';

  const canAccessOperationalFeatures = stage === 'approved';
  const routeGuardRedirect = stage === 'application' ? '/dashboard?tab=verification' : '/dashboard';

  return {
    ...verification,
    ...application,
    missingKeys: application.applicationMissingKeys,
    missingCount: application.applicationMissingCount,
    requiredCount: application.applicationRequiredCount,
    completedRequiredCount: application.applicationCompletedRequiredCount,
    progressPercent: application.applicationProgressPercent,
    isVerificationComplete: hasSubmittedApplication,
    status,
    stage,
    isApplicationStage: stage === 'application',
    isUnderReviewStage: stage === 'under_review',
    isApprovedStage: stage === 'approved',
    isRejectedStage: stage === 'rejected',
    canAccessOperationalFeatures,
    canAccessMessaging: canAccessOperationalFeatures,
    canAccessRequests: canAccessOperationalFeatures,
    canAccessProducts: canAccessOperationalFeatures,
    canAccessOffers: canAccessOperationalFeatures,
    canAccessPayoutSetup: canAccessOperationalFeatures,
    routeGuardRedirect,
    limitedTabs: ['overview', 'verification', 'settings'],
    fullTabs: ['overview', 'verification', 'payout', 'requests', 'my-products', 'offers', 'add-product', 'samples', 'reviews', 'messages', 'settings'],
  };
}

export function getSupplierPrimaryRoute(profile = {}) {
  return getSupplierOnboardingState(profile).routeGuardRedirect;
}
