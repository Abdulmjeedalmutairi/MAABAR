export const VERIFICATION_IMAGE_LIMIT = 5;
export const VERIFICATION_VIDEO_LIMIT = 2;
export const VERIFICATION_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function getCompanyDescription(value = {}) {
  const rawValue = typeof value === 'string'
    ? value
    : value?.company_description || value?.bio_en || value?.bio_ar || value?.bio_zh || '';

  return String(rawValue || '').trim();
}

export function normalizeProfileList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeProfileList(value) {
  return normalizeProfileList(value).join(', ');
}

export function getProfileReadiness(settings = {}) {
  const requiredFields = ['company_name', 'city', 'country', 'trade_link'];
  const completedRequiredCount = requiredFields.filter((key) => Boolean(String(settings?.[key] || '').trim())).length;
  const totalRequiredCount = requiredFields.length;

  return {
    completedRequiredCount,
    totalRequiredCount,
    progressPercent: Math.round((completedRequiredCount / totalRequiredCount) * 100),
    isReadyForVerification: completedRequiredCount === totalRequiredCount,
    languages: normalizeProfileList(settings?.languages),
    exportMarkets: normalizeProfileList(settings?.export_markets),
  };
}

export function buildSupplierJourneySteps({ supplierState, profileReadiness, lang }) {
  const stepCopy = {
    account: lang === 'ar' ? 'تم إنشاء الحساب' : lang === 'zh' ? '账户已创建' : 'Account created',
    profile: lang === 'ar' ? 'ملف الشركة' : lang === 'zh' ? '公司资料' : 'Company profile',
    verification: lang === 'ar' ? 'إرسال التحقق' : lang === 'zh' ? '提交认证' : 'Submit verification',
    review: lang === 'ar' ? 'المراجعة والاعتماد' : lang === 'zh' ? '审核与通过' : 'Review & approval',
  };

  if (supplierState.isApprovedStage) {
    return [
      { key: 'account', label: stepCopy.account, state: 'completed' },
      { key: 'profile', label: stepCopy.profile, state: 'completed' },
      { key: 'verification', label: stepCopy.verification, state: 'completed' },
      { key: 'review', label: stepCopy.review, state: 'verified' },
    ];
  }

  if (supplierState.isUnderReviewStage) {
    return [
      { key: 'account', label: stepCopy.account, state: 'completed' },
      { key: 'profile', label: stepCopy.profile, state: 'completed' },
      { key: 'verification', label: stepCopy.verification, state: 'completed' },
      { key: 'review', label: stepCopy.review, state: 'under_review' },
    ];
  }

  return [
    { key: 'account', label: stepCopy.account, state: 'completed' },
    { key: 'profile', label: stepCopy.profile, state: profileReadiness.isReadyForVerification ? 'completed' : 'current' },
    { key: 'verification', label: stepCopy.verification, state: profileReadiness.isReadyForVerification ? 'current' : 'upcoming' },
    { key: 'review', label: stepCopy.review, state: 'upcoming' },
  ];
}

export function normalizeVerificationMedia(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || '').trim()).filter(Boolean);
      }
    } catch {
      return [trimmed];
    }
    return [trimmed];
  }

  return [];
}

export function buildSettingsState(profile = {}, displayCurrency = 'USD') {
  return {
    company_name: profile.company_name || '',
    whatsapp: profile.whatsapp || '',
    wechat: profile.wechat || '',
    city: profile.city || '',
    country: profile.country || '',
    trade_link: profile.trade_link || '',
    speciality: profile.speciality || '',
    min_order_value: profile.min_order_value || '',
    business_type: profile.business_type || '',
    year_established: profile.year_established || '',
    languages: serializeProfileList(profile.languages),
    customization_support: profile.customization_support || '',
    export_markets: serializeProfileList(profile.export_markets),
    company_address: profile.company_address || '',
    company_website: profile.company_website || '',
    company_description: getCompanyDescription(profile),
    preferred_display_currency: profile.preferred_display_currency || displayCurrency || 'USD',
    avatar_url: profile.avatar_url || '',
    cover_photo_url: profile.cover_photo_url || '',
    factory_images: Array.isArray(profile.factory_images) ? profile.factory_images : [],
    certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
  };
}

export function buildVerificationState(profile = {}) {
  const factoryImages = normalizeVerificationMedia(profile.factory_images);
  const verificationImages = factoryImages.length > 0
    ? factoryImages.slice(0, VERIFICATION_IMAGE_LIMIT)
    : normalizeVerificationMedia(profile.factory_photo).slice(0, VERIFICATION_IMAGE_LIMIT);
  const verificationVideos = normalizeVerificationMedia(profile.factory_videos || profile.verification_videos).slice(0, VERIFICATION_VIDEO_LIMIT);

  return {
    reg_number: profile.reg_number || '',
    years_experience: profile.years_experience != null ? String(profile.years_experience) : '',
    num_employees: profile.num_employees != null ? String(profile.num_employees) : '',
    license_photo: profile.license_photo || '',
    legal_rep_id_photo: profile.legal_rep_id_photo || '',
    address_proof_photo: profile.address_proof_photo || '',
    factory_photo: profile.factory_photo || verificationImages[0] || '',
    factory_images: verificationImages,
    factory_videos: verificationVideos,
  };
}

export function buildPayoutState(profile = {}) {
  return {
    payout_beneficiary_name: profile.payout_beneficiary_name || '',
    bank_name: profile.bank_name || '',
    payout_account_number: profile.payout_account_number || '',
    swift_code: profile.swift_code || '',
    payout_bank_address: profile.payout_bank_address || '',
    preferred_display_currency: profile.preferred_display_currency || 'USD',
    payout_branch_name: profile.payout_branch_name || '',
  };
}

export function normalizeTextInput(value) {
  return String(value || '').trim();
}

export function normalizeOptionalNumber(value) {
  const normalized = normalizeTextInput(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeOptionalInteger(value) {
  const normalized = normalizeTextInput(value);
  if (!normalized) return null;
  const parsed = parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function stripEmptyFields(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );
}

export function buildSettingsPayload(settings = {}, companyDescription = '') {
  const normalizedDescription = normalizeTextInput(companyDescription);

  return {
    company_name: normalizeTextInput(settings.company_name),
    whatsapp: normalizeTextInput(settings.whatsapp),
    wechat: normalizeTextInput(settings.wechat),
    city: normalizeTextInput(settings.city),
    country: normalizeTextInput(settings.country),
    trade_link: normalizeTextInput(settings.trade_link),
    speciality: normalizeTextInput(settings.speciality),
    min_order_value: normalizeOptionalNumber(settings.min_order_value),
    business_type: normalizeTextInput(settings.business_type),
    year_established: normalizeOptionalInteger(settings.year_established),
    languages: normalizeProfileList(settings.languages),
    customization_support: normalizeTextInput(settings.customization_support),
    export_markets: normalizeProfileList(settings.export_markets),
    company_address: normalizeTextInput(settings.company_address),
    company_website: normalizeTextInput(settings.company_website),
    company_description: normalizedDescription,
    bio_en: normalizedDescription,
    preferred_display_currency: normalizeTextInput(settings.preferred_display_currency || 'USD') || 'USD',
    certifications: Array.isArray(settings.certifications) ? settings.certifications : [],
  };
}

export function buildPayoutPayload(payout = {}) {
  return {
    pay_method: 'swift',
    alipay_account: null,
    payout_beneficiary_name: normalizeTextInput(payout.payout_beneficiary_name),
    bank_name: normalizeTextInput(payout.bank_name),
    payout_account_number: normalizeTextInput(payout.payout_account_number),
    swift_code: normalizeTextInput(payout.swift_code),
    payout_bank_address: normalizeTextInput(payout.payout_bank_address) || null,
    preferred_display_currency: normalizeTextInput(payout.preferred_display_currency || 'USD') || 'USD',
    payout_branch_name: normalizeTextInput(payout.payout_branch_name) || null,
  };
}

export function hasPersistedSupplierSettings(profile = {}) {
  return ['company_name', 'city', 'country', 'trade_link', 'company_description', 'bio_en', 'bio_ar', 'bio_zh', 'whatsapp', 'wechat', 'speciality']
    .some((key) => Boolean(String(profile?.[key] || '').trim()));
}

export function hasPersistedSupplierPayout(profile = {}) {
  return ['payout_beneficiary_name', 'bank_name', 'payout_account_number', 'swift_code', 'payout_bank_address', 'payout_branch_name']
    .some((key) => Boolean(String(profile?.[key] || '').trim()));
}

export function buildSettingsSaveFeedback({ lang = 'en', status = 'idle', savedAt = '', errorMessage = '' }) {
  const isAr = lang === 'ar';
  const isZh = lang === 'zh';
  const formattedSavedAt = savedAt ? formatDraftSavedAt(savedAt, lang) : '';
  const meta = formattedSavedAt ? (isAr ? `آخر حفظ: ${formattedSavedAt}` : isZh ? `最后保存时间：${formattedSavedAt}` : `Last saved: ${formattedSavedAt}`) : '';

  if (status === 'saving') {
    return {
      tone: 'neutral',
      title: isAr ? 'جاري حفظ ملف الشركة' : isZh ? '正在保存公司资料' : 'Saving company profile',
      body: isAr ? 'نحدّث بياناتك الآن حتى تبقى النسخة الظاهرة هنا هي النسخة المحفوظة.' : isZh ? '我们正在更新您的公司资料，保存后这里显示的内容就是当前已保存版本。' : 'We are updating your company details now so the values shown here stay aligned with what is saved.',
      meta,
    };
  }

  if (status === 'error') {
    return {
      tone: 'error',
      title: isAr ? 'تعذر حفظ ملف الشركة' : isZh ? '公司资料未能保存' : 'Company profile was not saved',
      body: errorMessage || (isAr ? 'تحقق من الحقول المطلوبة ثم حاول مرة أخرى.' : isZh ? '请检查必填字段后重试。' : 'Please review the required fields and try again.'),
      meta,
    };
  }

  if (status === 'dirty') {
    return {
      tone: 'warning',
      title: isAr ? 'لديك تعديلات غير محفوظة' : isZh ? '您有未保存的修改' : 'You have unsaved changes',
      body: isAr ? 'القيم الظاهرة تغيّرت، لكن آخر نسخة محفوظة ما زالت هي المعتمدة حتى تضغط حفظ.' : isZh ? '当前显示的值已修改，但系统仍以最近一次保存的资料为准，直到您再次保存。' : 'The visible values have changed, but Maabar is still using the last saved company profile until you save again.',
      meta,
    };
  }

  if (status === 'saved') {
    return {
      tone: 'success',
      title: isAr ? 'تم حفظ ملف الشركة' : isZh ? '公司资料已保存' : 'Company profile saved',
      body: isAr ? 'تم تثبيت آخر بياناتك بنجاح، والحقول الظاهرة الآن هي نفس النسخة المحفوظة في الحساب.' : isZh ? '最新公司资料已成功保存，当前显示的字段就是账户中的已保存版本。' : 'Your latest company details are saved successfully. The fields shown now are the saved version on the account.',
      meta,
    };
  }

  // idle — return empty title so SaveFeedbackCard renders nothing on initial load
  return { tone: 'neutral', title: '', body: '', meta: '' };
}

export function buildPayoutSaveFeedback({ lang = 'en', status = 'idle', savedAt = '', errorMessage = '' }) {
  const isAr = lang === 'ar';
  const isZh = lang === 'zh';
  const formattedSavedAt = savedAt ? formatDraftSavedAt(savedAt, lang) : '';
  const meta = formattedSavedAt ? (isAr ? `آخر حفظ: ${formattedSavedAt}` : isZh ? `最后保存时间：${formattedSavedAt}` : `Last saved: ${formattedSavedAt}`) : '';

  if (status === 'saving') {
    return {
      tone: 'neutral',
      title: isAr ? 'جاري حفظ بيانات الدفعات' : isZh ? '正在保存收款资料' : 'Saving payout details',
      body: isAr ? 'نحفظ بيانات البنك الآن بشكل آمن حتى تبقى المعروضات هنا هي النسخة المعتمدة.' : isZh ? '系统正在安全保存您的银行资料，保存后这里显示的内容就是当前已保存版本。' : 'Your bank details are being saved securely now so the values shown here remain the current saved version.',
      meta,
    };
  }

  if (status === 'error') {
    return {
      tone: 'error',
      title: isAr ? 'تعذر حفظ بيانات الدفعات' : isZh ? '收款资料未能保存' : 'Payout details were not saved',
      body: errorMessage || (isAr ? 'أكمل الحقول المطلوبة ثم حاول مرة أخرى.' : isZh ? '请填写必填收款字段后重试。' : 'Please complete the required payout fields and try again.'),
      meta,
    };
  }

  if (status === 'dirty') {
    return {
      tone: 'warning',
      title: isAr ? 'لديك تعديلات غير محفوظة على بيانات الدفعات' : isZh ? '您有未保存的收款修改' : 'You have unsaved payout changes',
      body: isAr ? 'بيانات البنك تغيّرت في النموذج، لكن النسخة المعتمدة ما زالت آخر نسخة محفوظة حتى تضغط حفظ.' : isZh ? '收款表单里的内容已变更，但系统仍以最近一次保存的资料为准，直到您再次保存。' : 'The bank form has changed, but the approved version is still the last saved payout record until you save again.',
      meta,
    };
  }

  if (status === 'saved') {
    return {
      tone: 'success',
      title: isAr ? 'تم حفظ بيانات الدفعات' : isZh ? '收款资料已保存' : 'Payout details saved',
      body: isAr ? 'تم حفظ بيانات الاستلام بنجاح، والقيم الظاهرة الآن هي النسخة المحفوظة في الحساب.' : isZh ? '最新收款资料已成功保存，当前显示的字段就是账户中的已保存版本。' : 'Your payout details are saved successfully. The fields shown now are the saved version on the account.',
      meta,
    };
  }

  // idle — return empty title so SaveFeedbackCard renders nothing on initial load
  return { tone: 'neutral', title: '', body: '', meta: '' };
}

export function getSupplierVerificationDraftKey(userId) {
  return `maabar_supplier_verification_draft:${userId}`;
}

export function getSupplierDashboardUiStateKey(userId) {
  return `maabar_supplier_dashboard_ui:${userId}`;
}

export function getVerificationProgressState({ settings = {}, verification = {}, verificationImages = [] }) {
  const missingProfileFields = ['company_name', 'city', 'country', 'trade_link']
    .filter((key) => !String(settings?.[key] || '').trim());
  const hasVerificationBasics = Boolean(String(verification?.reg_number || '').trim())
    && Boolean(String(verification?.years_experience || '').trim())
    && Boolean(String(verification?.license_photo || '').trim())
    && verificationImages.length > 0;

  return {
    missingProfileFields,
    hasVerificationBasics,
    maxReachableStep: missingProfileFields.length > 0 ? 1 : (hasVerificationBasics ? 3 : 2),
    firstIncompleteStep: missingProfileFields.length > 0 ? 1 : (hasVerificationBasics ? 3 : 2),
  };
}

export function formatDraftSavedAt(value, lang = 'en') {
  if (!value) return '';

  try {
    const date = new Date(value);
    if (lang === 'zh') {
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (lang === 'ar') {
      return date.toLocaleString('ar-SA-u-nu-latn', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
