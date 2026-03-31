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

const SUPPLIER_STATUS_EQUIVALENTS = {
  draft: 'draft',
  incomplete: 'draft',
  pending: 'pending_review',
  under_review: 'pending_review',
  submitted: 'pending_review',
  review: 'pending_review',
  approved: 'active',
  active: 'active',
  rejected: 'rejected',
  disabled: 'inactive',
  inactive: 'inactive',
  suspended: 'inactive',
};

export function normalizeSupplierStatus(rawStatus) {
  const normalized = String(rawStatus || 'pending').trim().toLowerCase();
  return SUPPLIER_STATUS_EQUIVALENTS[normalized] || 'pending_review';
}

export function getSupplierStageFromStatus(rawStatus) {
  const status = normalizeSupplierStatus(rawStatus);

  if (status === 'active') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'draft') return 'application';
  return 'under_review';
}

export function isSupplierApproved(rawStatus) {
  return normalizeSupplierStatus(rawStatus) === 'active';
}

export function isSupplierPubliclyVisible(rawStatus) {
  return isSupplierApproved(rawStatus);
}

export function buildSupplierTrustSignals(profile = {}) {
  const normalizedStatus = normalizeSupplierStatus(profile?.status);
  const trustSignals = [];

  if (normalizedStatus === 'active') trustSignals.push('maabar_reviewed');
  if (profile?.trade_link) trustSignals.push('trade_profile_available');
  if (profile?.wechat) trustSignals.push('wechat_available');
  if (profile?.whatsapp) trustSignals.push('whatsapp_available');
  if (Array.isArray(profile?.factory_images) && profile.factory_images.length > 0) trustSignals.push('factory_media_available');
  if (Number(profile?.years_experience) > 0) trustSignals.push('experience_declared');
  if (Number(profile?.reviews_count) > 0) trustSignals.push('review_history');
  if (Number(profile?.trust_score) > 0) trustSignals.push('trust_score');

  return trustSignals;
}

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
  const normalizedStatus = normalizeSupplierStatus(profile?.status);
  const stage = getSupplierStageFromStatus(normalizedStatus);
  const hasSubmittedApplication = application.isApplicationComplete || verification.isVerificationComplete;

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
    rawStatus: profile?.status || 'pending',
    status: normalizedStatus,
    stage,
    trustSignals: buildSupplierTrustSignals(profile),
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
