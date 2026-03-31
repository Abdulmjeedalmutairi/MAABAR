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

export const SUPPLIER_STATUS_EQUIVALENTS = Object.freeze({
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
});

export const SUPPLIER_REVIEW_QUEUE_RAW_STATUSES = Object.freeze(['pending', 'under_review', 'submitted', 'review']);
export const SUPPLIER_PUBLIC_VISIBLE_RAW_STATUSES = Object.freeze(['active', 'approved']);

const SUPPLIER_STAGE_LABELS = {
  application: { ar: 'قيد استكمال الطلب', en: 'Application in progress', zh: '申请资料待完成' },
  under_review: { ar: 'تحت المراجعة', en: 'Under review', zh: '审核中' },
  approved: { ar: 'مقبول', en: 'Approved', zh: '已批准' },
  rejected: { ar: 'مرفوض', en: 'Rejected', zh: '已拒绝' },
  inactive: { ar: 'موقوف مؤقتاً', en: 'Temporarily paused', zh: '暂时停用' },
};

export function getSupplierReviewQueueStatuses() {
  return [...SUPPLIER_REVIEW_QUEUE_RAW_STATUSES];
}

export function getSupplierPublicVisibilityStatuses() {
  return [...SUPPLIER_PUBLIC_VISIBLE_RAW_STATUSES];
}

export function normalizeSupplierStatus(rawStatus) {
  const normalized = String(rawStatus || 'pending').trim().toLowerCase();
  return SUPPLIER_STATUS_EQUIVALENTS[normalized] || 'pending_review';
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

export function getSupplierStageFromStatus(rawStatus, options = {}) {
  const status = normalizeSupplierStatus(rawStatus);
  const applicationComplete = options?.applicationComplete;
  const emailConfirmed = options?.emailConfirmed;

  if (status === 'active') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'inactive') return 'inactive';

  if (status === 'draft') return 'application';
  if (applicationComplete === false) return 'application';
  if (emailConfirmed === false) return 'application';

  return 'under_review';
}

export function getSupplierStageLabel(stage, lang = 'en') {
  return SUPPLIER_STAGE_LABELS[stage]?.[lang] || SUPPLIER_STAGE_LABELS[stage]?.en || stage;
}

export function isSupplierApproved(rawStatus) {
  return normalizeSupplierStatus(rawStatus) === 'active';
}

export function isSupplierPubliclyVisible(rawStatus) {
  return isSupplierApproved(rawStatus);
}

export function getSupplierMaabarId(profile = {}) {
  const rawValue = typeof profile === 'string' ? profile : profile?.maabar_supplier_id;
  const normalized = String(rawValue || '').trim().toUpperCase();
  return normalized || '';
}

export function hasConfirmedEmail(sessionUser) {
  return Boolean(sessionUser?.email_confirmed_at || sessionUser?.confirmed_at);
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
  const supplierState = getSupplierOnboardingState(profile, sessionUser);
  return supplierState.isUnderReviewStage;
}

export function buildSupplierTrustSignals(profile = {}) {
  const normalizedStatus = normalizeSupplierStatus(profile?.status);
  const trustSignals = [];

  if (normalizedStatus === 'active') trustSignals.push('maabar_reviewed');
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
  const normalizedStatus = normalizeSupplierStatus(profile?.status);
  const emailConfirmed = sessionUser ? hasConfirmedEmail(sessionUser) : null;
  const stage = getSupplierStageFromStatus(normalizedStatus, {
    applicationComplete: application.isApplicationComplete,
    emailConfirmed,
  });

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
    rawStatus: profile?.status || 'pending',
    status: normalizedStatus,
    stage,
    stageLabel: getSupplierStageLabel(stage),
    trustSignals: buildSupplierTrustSignals(profile),
    tradeLinks: getSupplierTradeLinks(profile),
    emailConfirmed,
    maabarSupplierId: getSupplierMaabarId(profile),
    isApplicationStage: stage === 'application',
    isUnderReviewStage: stage === 'under_review',
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
    fullTabs: ['overview', 'verification', 'payout', 'requests', 'my-products', 'offers', 'add-product', 'samples', 'reviews', 'messages', 'settings'],
  };
}

export function shouldPromoteSupplierToReview(profile = {}, sessionUser = null) {
  if (profile?.role !== 'supplier' || !hasConfirmedEmail(sessionUser)) return false;

  const normalizedStatus = normalizeSupplierStatus(profile?.status);
  const { isApplicationComplete } = getSupplierApplicationState(profile);

  return isApplicationComplete && normalizedStatus === 'draft';
}

export function getSupplierPrimaryRoute(profile = {}, sessionUser = null) {
  return getSupplierOnboardingState(profile, sessionUser).routeGuardRedirect;
}
