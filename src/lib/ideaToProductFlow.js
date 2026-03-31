const AI_REPORT_STORAGE_KEY = 'maabar_ai_draft';
const AI_REPORT_LEGACY_REQUEST_KEY = 'maabar_request_draft';
const AI_REPORT_RESUME_QUERY = 'openAiReview';

function readStorage(storage) {
  if (typeof window === 'undefined' || !storage) return null;
  try {
    return storage.getItem(AI_REPORT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStorage(storage, value) {
  if (typeof window === 'undefined' || !storage) return;
  try {
    if (value == null) storage.removeItem(AI_REPORT_STORAGE_KEY);
    else storage.setItem(AI_REPORT_STORAGE_KEY, value);
  } catch {}
}

export function buildIdeaRequestDraft(report = {}, overrides = {}) {
  const baseTitleAr = overrides.title_ar || report.product_name_ar || report.product_name_en || '';
  const baseTitleEn = overrides.title_en || report.product_name_en || report.product_name_ar || '';
  const baseTitleZh = overrides.title_zh || report.product_name_zh || report.product_name_en || report.product_name_ar || '';

  return {
    title_ar: baseTitleAr,
    title_en: baseTitleEn,
    title_zh: baseTitleZh,
    quantity: overrides.quantity ?? report.moq ?? '',
    description: overrides.description ?? report.request_description ?? report.specs ?? '',
    category: overrides.category || report.category || 'other',
    budget_per_unit: overrides.budget_per_unit ?? '',
    payment_plan: overrides.payment_plan || '30',
    sample_requirement: overrides.sample_requirement || 'preferred',
    image_url: overrides.image_url || '',
    reference_image: overrides.reference_image || '',
  };
}

export function normalizeIdeaFlowDraft(rawValue) {
  if (!rawValue) return null;

  try {
    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
    if (!parsed || typeof parsed !== 'object') return null;

    if (!parsed.requestDraft && (parsed.title_ar || parsed.title_en || parsed.description)) {
      const requestDraft = buildIdeaRequestDraft(parsed, parsed);
      return {
        version: 1,
        phase: parsed.phase || 'report',
        requestDraft,
        report: parsed.report || null,
        messages: parsed.messages || [],
        initialIdea: parsed.initialIdea || parsed.description || '',
        pendingAuth: Boolean(parsed.pendingAuth ?? true),
        lang: parsed.lang || 'ar',
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }

    const requestDraft = buildIdeaRequestDraft(parsed.report || {}, parsed.requestDraft || {});
    const hasMeaningfulDraft = requestDraft.title_ar || requestDraft.title_en || requestDraft.description;
    if (!hasMeaningfulDraft && !parsed.report) return null;

    return {
      version: parsed.version || 2,
      phase: parsed.phase || 'report',
      requestDraft,
      report: parsed.report || null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      initialIdea: parsed.initialIdea || '',
      pendingAuth: Boolean(parsed.pendingAuth),
      lang: parsed.lang || 'ar',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function getBrowserStorages() {
  if (typeof window === 'undefined') {
    return { sessionStorage: null, localStorage: null };
  }
  return {
    sessionStorage: window.sessionStorage,
    localStorage: window.localStorage,
  };
}

export function loadIdeaFlowDraft() {
  const { sessionStorage, localStorage } = getBrowserStorages();
  const sessionValue = readStorage(sessionStorage);
  const localValue = readStorage(localStorage);
  return normalizeIdeaFlowDraft(sessionValue || localValue);
}

export function saveIdeaFlowDraft(payload) {
  const normalized = normalizeIdeaFlowDraft({
    version: 2,
    phase: payload?.phase || 'report',
    requestDraft: payload?.requestDraft || null,
    report: payload?.report || null,
    messages: payload?.messages || [],
    initialIdea: payload?.initialIdea || '',
    pendingAuth: Boolean(payload?.pendingAuth),
    lang: payload?.lang || 'ar',
    updatedAt: new Date().toISOString(),
  });

  if (!normalized) return null;

  const serialized = JSON.stringify(normalized);
  const { sessionStorage, localStorage } = getBrowserStorages();
  writeStorage(sessionStorage, serialized);
  writeStorage(localStorage, serialized);

  if (normalized.requestDraft && sessionStorage) {
    try {
      sessionStorage.setItem(AI_REPORT_LEGACY_REQUEST_KEY, JSON.stringify(normalized.requestDraft));
    } catch {}
  }

  return normalized;
}

export function clearIdeaFlowDraft() {
  const { sessionStorage, localStorage } = getBrowserStorages();
  writeStorage(sessionStorage, null);
  writeStorage(localStorage, null);
  if (sessionStorage) {
    try {
      sessionStorage.removeItem(AI_REPORT_LEGACY_REQUEST_KEY);
    } catch {}
  }
}

export function hasIdeaFlowDraft() {
  return Boolean(loadIdeaFlowDraft());
}

export function getIdeaFlowResumePath() {
  return `/dashboard?${AI_REPORT_RESUME_QUERY}=1`;
}

export function shouldResumeIdeaFlow(search = '') {
  const params = new URLSearchParams(search || '');
  return params.get(AI_REPORT_RESUME_QUERY) === '1';
}
