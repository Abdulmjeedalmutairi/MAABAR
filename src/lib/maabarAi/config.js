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
