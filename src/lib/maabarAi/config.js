import { SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '../../supabase';

export const MAABAR_AI_PERSONA_NAME = 'وكيل معبر';
export const MAABAR_AI_FUNCTION_NAME = process.env.REACT_APP_MAABAR_AI_FUNCTION_NAME || 'maabar-ai';
export const MAABAR_AI_MODEL = 'gemini-2.0-flash';
export const MAABAR_AI_HEADERS = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  apikey: SUPABASE_ANON_KEY,
};
export const MAABAR_AI_ENDPOINT = `${SUPABASE_FUNCTIONS_URL}/${MAABAR_AI_FUNCTION_NAME}`;
export const MAABAR_AI_LEGACY_PROXY_ENDPOINT = `${SUPABASE_FUNCTIONS_URL}/Ai-proxy`;

export const MAABAR_AI_TASKS = {
  IDEA_TO_PRODUCT: 'idea_to_product',
  PRODUCT_CONVERSATION: 'product_conversation',
  CHAT_TRANSLATION: 'chat_translation',
  CUSTOMER_SUPPORT: 'customer_support',
};

export const MAABAR_AI_SUPPORT_CHANNELS = {
  email: 'support@maabar.io',
  whatsapp: 'https://wa.me/966504248942',
};

export const MAABAR_AI_SUPPORT_PROMISE = {
  ar: 'دعم معبر 24/7 للتوجيه السريع، مشاكل الحسابات، الطلبات، الدفع، الموردين، والترجمة التجارية.',
  en: 'Maabar support is available 24/7 for quick guidance across accounts, orders, payments, suppliers, and trade translation.',
  zh: 'Maabar 提供 24/7 支持，可处理账户、订单、付款、供应商与商务翻译相关问题。',
};

export const MAABAR_AI_SAUDI_REP_NAMES = [
  { name: 'سلمان', gender: 'male' },
  { name: 'تركي', gender: 'male' },
  { name: 'فيصل', gender: 'male' },
  { name: 'سعود', gender: 'male' },
  { name: 'عبدالعزيز', gender: 'male' },
  { name: 'نورة', gender: 'female' },
  { name: 'الجوهرة', gender: 'female' },
  { name: 'سارة', gender: 'female' },
  { name: 'ريم', gender: 'female' },
  { name: 'هيا', gender: 'female' },
];

const SESSION_REP_KEY = 'maabar_ai_saudi_rep';
const REP_GENDER_TOGGLE_KEY = 'maabar_ai_saudi_rep_gender_toggle';

export const TRANSLATION_DIRECTIONS = [
  { id: 'off', source: null, target: null },
  { id: 'ar_to_zh', source: 'ar', target: 'zh' },
  { id: 'zh_to_ar', source: 'zh', target: 'ar' },
  { id: 'ar_to_en', source: 'ar', target: 'en' },
  { id: 'en_to_ar', source: 'en', target: 'ar' },
  { id: 'zh_to_en', source: 'zh', target: 'en' },
  { id: 'en_to_zh', source: 'en', target: 'zh' },
];

export function getDefaultTranslationDirection(appLang = 'ar') {
  if (appLang === 'zh') return 'ar_to_zh';
  if (appLang === 'en') return 'ar_to_en';
  return 'zh_to_ar';
}

export function getTranslationDirection(directionId) {
  return TRANSLATION_DIRECTIONS.find((direction) => direction.id === directionId) || TRANSLATION_DIRECTIONS[0];
}

export function getDirectionLabel(directionId, lang = 'ar') {
  const labels = {
    ar: {
      off: 'بدون ترجمة',
      ar_to_zh: 'عربي ← صيني',
      zh_to_ar: 'صيني ← عربي',
      ar_to_en: 'عربي ← إنجليزي',
      en_to_ar: 'إنجليزي ← عربي',
      zh_to_en: 'صيني ← إنجليزي',
      en_to_zh: 'إنجليزي ← صيني',
    },
    en: {
      off: 'No translation',
      ar_to_zh: 'Arabic ← Chinese',
      zh_to_ar: 'Chinese ← Arabic',
      ar_to_en: 'Arabic ← English',
      en_to_ar: 'English ← Arabic',
      zh_to_en: 'Chinese ← English',
      en_to_zh: 'English ← Chinese',
    },
    zh: {
      off: '关闭翻译',
      ar_to_zh: '阿拉伯语 ← 中文',
      zh_to_ar: '中文 ← 阿拉伯语',
      ar_to_en: '阿拉伯语 ← 英语',
      en_to_ar: '英语 ← 阿拉伯语',
      zh_to_en: '中文 ← 英语',
      en_to_zh: '英语 ← 中文',
    },
  };

  return labels[lang]?.[directionId] || labels.ar[directionId] || directionId;
}

function pickSaudiRepresentative() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return MAABAR_AI_SAUDI_REP_NAMES[0];
  }

  const lastGender = window.localStorage.getItem(REP_GENDER_TOGGLE_KEY);
  const nextGender = lastGender === 'female' ? 'male' : 'female';
  const candidates = MAABAR_AI_SAUDI_REP_NAMES.filter((representative) => representative.gender === nextGender);
  const selected = candidates[Math.floor(Math.random() * candidates.length)] || MAABAR_AI_SAUDI_REP_NAMES[0];
  window.localStorage.setItem(REP_GENDER_TOGGLE_KEY, nextGender);
  return selected;
}

export function getSessionSaudiRepresentative() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return MAABAR_AI_SAUDI_REP_NAMES[0];
  }

  const stored = window.sessionStorage.getItem(SESSION_REP_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_error) {
      window.sessionStorage.removeItem(SESSION_REP_KEY);
    }
  }

  const selected = pickSaudiRepresentative();
  window.sessionStorage.setItem(SESSION_REP_KEY, JSON.stringify(selected));
  return selected;
}

export function getSaudiRepresentativeIntro(lang = 'ar') {
  const representative = getSessionSaudiRepresentative();

  if (lang === 'zh') {
    return `您好，我是 ${representative.name}，来自 Maabar。`;
  }

  if (lang === 'en') {
    return `Hello, this is ${representative.name} from Maabar.`;
  }

  return `مرحبا، معك ${representative.name} من معبر.`;
}
