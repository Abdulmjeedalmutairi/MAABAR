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

const LEGACY_REVIEW_STATUSES = ['pending', 'under_review', 'submitted', 'review'];
const LEGACY_VERIFIED_STATUSES = ['active', 'approved'];
const LEGACY_REGISTERED_STATUSES = ['draft', 'incomplete'];

export const SUPPLIER_STATUS_EQUIVALENTS = Object.freeze({
  registered: 'registered',
  verification_required: 'verification_required',
  verification_under_review: 'verification_under_review',
  verified: 'verified',
  draft: 'registered',
  incomplete: 'registered',
  pending: 'verification_under_review',
  under_review: 'verification_under_review',
  submitted: 'verification_under_review',
  review: 'verification_under_review',
  approved: 'verified',
  active: 'verified',
  rejected: 'rejected',
  disabled: 'inactive',
  inactive: 'inactive',
  suspended: 'inactive',
});

export const SUPPLIER_REVIEW_QUEUE_RAW_STATUSES = Object.freeze(['verification_under_review', ...LEGACY_REVIEW_STATUSES]);
export const SUPPLIER_PUBLIC_VISIBLE_RAW_STATUSES = Object.freeze(['verified', ...LEGACY_VERIFIED_STATUSES]);

const SUPPLIER_STAGE_LABELS = {
  application: { ar: 'مطلوب استكمال التحقق', en: 'Verification required', zh: '需要完成认证' },
  under_review: { ar: 'التحقق تحت المراجعة', en: 'Verification under review', zh: '认证审核中' },
  approved: { ar: 'موثّق', en: 'Verified', zh: '已验证' },
  rejected: { ar: 'مرفوض', en: 'Rejected', zh: '已拒绝' },
  inactive: { ar: 'موقوف مؤقتاً', en: 'Temporarily paused', zh: '暂时停用' },
};

function normalizeRawSupplierStatus(rawStatus) {
  return String(rawStatus || 'registered').trim().toLowerCase();
}

export function getSupplierReviewQueueStatuses() {
  return [...SUPPLIER_REVIEW_QUEUE_RAW_STATUSES];
}

export function getSupplierPublicVisibilityStatuses() {
  return [...SUPPLIER_PUBLIC_VISIBLE_RAW_STATUSES];
}

export function normalizeSupplierStatus(rawStatus) {
  const normalized = normalizeRawSupplierStatus(rawStatus);
  return SUPPLIER_STATUS_EQUIVALENTS[normalized] || 'registered';
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
  const hasAnyPayoutData = Boolean(
    profile?.payout_beneficiary_name
    || profile?.bank_name
    || profile?.payout_account_number
    || profile?.swift_code
    || profile?.payout_branch_name
    || profile?.payout_iban
  );
  const isPayoutComplete = Boolean(
    profile?.payout_beneficiary_name
    && profile?.bank_name
    && profile?.payout_account_number
    && profile?.swift_code
  );
  const payoutMethod = hasAnyPayoutData ? 'swift' : '';

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

export function hasConfirmedEmail(sessionUser) {
  return Boolean(sessionUser?.email_confirmed_at || sessionUser?.confirmed_at);
}

export function getSupplierResolvedStatus(profile = {}, sessionUser = null) {
  const rawStatus = normalizeRawSupplierStatus(profile?.status);
  const emailConfirmed = sessionUser ? hasConfirmedEmail(sessionUser) : null;
  const application = getSupplierApplicationState(profile);
  const verification = getSupplierVerificationState(profile);

  if (rawStatus === 'verified' || LEGACY_VERIFIED_STATUSES.includes(rawStatus)) return 'verified';
  if (rawStatus === 'rejected') return 'rejected';
  if (['disabled', 'inactive', 'suspended'].includes(rawStatus)) return 'inactive';

  if (rawStatus === 'verification_under_review') {
    return verification.isVerificationComplete ? 'verification_under_review' : (emailConfirmed === false ? 'registered' : 'verification_required');
  }

  if (LEGACY_REVIEW_STATUSES.includes(rawStatus)) {
    // Never auto-promote legacy statuses to under_review based on field completeness.
    // The only path to 'verification_under_review' is the explicit submit RPC, which
    // sets the canonical status in the DB. Legacy 'pending'/'under_review' etc. are
    // treated as verification_required so the supplier can complete the form and submit.
    if (emailConfirmed === false) return 'registered';
    return application.isApplicationComplete ? 'verification_required' : 'registered';
  }

  if (rawStatus === 'verification_required') {
    if (emailConfirmed === false) return 'registered';
    return application.isApplicationComplete ? 'verification_required' : 'registered';
  }

  if (rawStatus === 'registered' || LEGACY_REGISTERED_STATUSES.includes(rawStatus)) {
    if (emailConfirmed === false) return 'registered';
    return application.isApplicationComplete ? 'verification_required' : 'registered';
  }

  return emailConfirmed === false ? 'registered' : (application.isApplicationComplete ? 'verification_required' : 'registered');
}

export function getSupplierStageFromStatus(rawStatus) {
  const status = normalizeSupplierStatus(rawStatus);

  if (status === 'verified') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'inactive') return 'inactive';
  if (status === 'verification_under_review') return 'under_review';

  return 'application';
}

export function getSupplierStageLabel(stage, lang = 'en') {
  return SUPPLIER_STAGE_LABELS[stage]?.[lang] || SUPPLIER_STAGE_LABELS[stage]?.en || stage;
}

export function isSupplierApproved(rawStatus) {
  return normalizeSupplierStatus(rawStatus) === 'verified';
}

export function isSupplierPubliclyVisible(rawStatus) {
  return isSupplierApproved(rawStatus);
}

export function getSupplierMaabarId(profile = {}) {
  const rawValue = typeof profile === 'string' ? profile : profile?.maabar_supplier_id;
  const normalized = String(rawValue || '').trim().toUpperCase();
  return normalized || '';
}

export function getSupplierTradeLinks(profile = {}) {
  const tradeLinks = [];
  const addTradeLink = (value) => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    if (!normalized || tradeLinks.includes(normalized)) return;
    tradeLinks.push(normalized);
  };

  if (Array.isArray(profile?.trade_links)) {
    profile.trade_links.forEach(addTradeLink);
  }

  addTradeLink(profile?.trade_link);
  return tradeLinks;
}

export function shouldNotifyAdminOfConfirmedSupplier(profile = {}, sessionUser = null) {
  if (profile?.role !== 'supplier' || !hasConfirmedEmail(sessionUser)) return false;
  return getSupplierResolvedStatus(profile, sessionUser) === 'verification_under_review';
}

export function buildSupplierTrustSignals(profile = {}) {
  const normalizedStatus = normalizeSupplierStatus(profile?.status);
  const trustSignals = [];

  if (normalizedStatus === 'verified') trustSignals.push('maabar_reviewed');
  if (getSupplierTradeLinks(profile).length > 0) trustSignals.push('trade_profile_available');
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

export function getSupplierOnboardingState(profile = {}, sessionUser = null) {
  const application = getSupplierApplicationState(profile);
  const verification = getSupplierVerificationState(profile);
  const status = getSupplierResolvedStatus(profile, sessionUser);
  const emailConfirmed = sessionUser ? hasConfirmedEmail(sessionUser) : null;
  const stage = getSupplierStageFromStatus(status);
  const canAccessOperationalFeatures = status === 'verified';
  const routeGuardRedirect = '/dashboard';

  return {
    ...verification,
    ...application,
    missingKeys: application.applicationMissingKeys,
    missingCount: application.applicationMissingCount,
    requiredCount: application.applicationRequiredCount,
    completedRequiredCount: application.applicationCompletedRequiredCount,
    progressPercent: application.applicationProgressPercent,
    rawStatus: profile?.status || 'registered',
    status,
    stage,
    stageLabel: getSupplierStageLabel(stage),
    trustSignals: buildSupplierTrustSignals({ ...profile, status }),
    tradeLinks: getSupplierTradeLinks(profile),
    emailConfirmed,
    maabarSupplierId: getSupplierMaabarId(profile),
    isRegisteredStatus: status === 'registered',
    isVerificationRequiredStatus: status === 'verification_required',
    isVerificationUnderReviewStatus: status === 'verification_under_review',
    isVerifiedStatus: status === 'verified',
    isApplicationStage: stage === 'application',
    isUnderReviewStage: stage === 'under_review' || status === 'verification_under_review',
    isApprovedStage: stage === 'approved',
    isRejectedStage: stage === 'rejected',
    isInactiveStage: stage === 'inactive',
    canAccessOperationalFeatures,
    canAccessMessaging: canAccessOperationalFeatures,
    canAccessRequests: canAccessOperationalFeatures,
    canAccessProducts: canAccessOperationalFeatures,
    canAccessOffers: canAccessOperationalFeatures,
    canAccessPayoutSetup: canAccessOperationalFeatures,
    routeGuardRedirect,
    limitedTabs: ['overview', 'verification', 'settings'],
    fullTabs: ['overview', 'verification', 'payout', 'requests', 'my-products', 'offers', 'add-product', 'samples', 'product-inquiries', 'reviews', 'messages', 'settings'],
  };
}

export function shouldPromoteSupplierAfterEmailConfirmation(profile = {}, sessionUser = null) {
  if (profile?.role !== 'supplier' || !hasConfirmedEmail(sessionUser)) return false;

  const rawStatus = normalizeRawSupplierStatus(profile?.status);
  const { isApplicationComplete } = getSupplierApplicationState(profile);

  return isApplicationComplete && (rawStatus === 'registered' || LEGACY_REGISTERED_STATUSES.includes(rawStatus));
}

export function getSupplierPrimaryRoute(profile = {}, sessionUser = null) {
  return getSupplierOnboardingState(profile, sessionUser).routeGuardRedirect;
}
