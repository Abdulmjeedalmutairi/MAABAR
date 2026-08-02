// Option sets for the factory request-quote form (RequestQuoteModal). Wording
// matches the approved mockup. `key` values are what persist to the DB
// (request_customization / requests); labels are trilingual for display.

const pick = (o, lang) => o[lang] || o.en;
export const labelFor = pick;

// "Does it need customization?" chips — multi-select. key → customization_types[].
export const CUSTOMIZATION_CHIPS = [
  { key: 'material_change', icon: 'diamond', ar: 'تعديل الخامة', en: 'Material change', zh: '材质更换' },
  { key: 'size_adjustment', icon: 'sliders', ar: 'تعديل المقاسات', en: 'Size adjustment', zh: '尺寸调整' },
  { key: 'custom_packaging', icon: 'box', ar: 'تغليف خاص', en: 'Custom packaging', zh: '定制包装' },
  { key: 'logo_printing', icon: 'stamp', ar: 'طباعة شعار', en: 'Logo printing', zh: 'Logo 印刷' },
  { key: 'other', icon: 'dots', ar: 'أخرى', en: 'Other', zh: '其他' },
];

// "Expected delivery" chips — single-select. key → request_customization.delivery_timeframe.
export const DELIVERY_TIMEFRAMES = [
  { key: '2_weeks', ar: 'خلال أسبوعين', en: 'Within 2 weeks', zh: '两周内' },
  { key: '1_month', ar: 'خلال شهر', en: 'Within a month', zh: '一个月内' },
  { key: '2_months', ar: 'خلال شهرين', en: 'Within 2 months', zh: '两个月内' },
  { key: 'flexible', ar: 'مرن', en: 'Flexible', zh: '灵活' },
];

// Quantity units → requests.unit.
export const REQUEST_UNITS = [
  { key: 'piece', ar: 'قطعة', en: 'Piece', zh: '件' },
  { key: 'set', ar: 'طقم', en: 'Set', zh: '套' },
  { key: 'carton', ar: 'كرتون', en: 'Carton', zh: '箱' },
  { key: 'pallet', ar: 'منصة', en: 'Pallet', zh: '托盘' },
  { key: 'container', ar: 'حاوية', en: 'Container', zh: '集装箱' },
  { key: 'meter', ar: 'متر', en: 'Meter', zh: '米' },
  { key: 'sqm', ar: 'متر مربع', en: 'm²', zh: '平方米' },
  { key: 'kg', ar: 'كجم', en: 'kg', zh: '公斤' },
  { key: 'ton', ar: 'طن', en: 'Ton', zh: '吨' },
];

// Shipping destination country → request_customization.ship_country (Saudi default).
export const SHIP_COUNTRIES = [
  { key: 'SA', flag: '🇸🇦', ar: 'السعودية', en: 'Saudi Arabia', zh: '沙特阿拉伯' },
  { key: 'AE', flag: '🇦🇪', ar: 'الإمارات', en: 'United Arab Emirates', zh: '阿联酋' },
  { key: 'KW', flag: '🇰🇼', ar: 'الكويت', en: 'Kuwait', zh: '科威特' },
  { key: 'QA', flag: '🇶🇦', ar: 'قطر', en: 'Qatar', zh: '卡塔尔' },
  { key: 'BH', flag: '🇧🇭', ar: 'البحرين', en: 'Bahrain', zh: '巴林' },
  { key: 'OM', flag: '🇴🇲', ar: 'عُمان', en: 'Oman', zh: '阿曼' },
  { key: 'other', flag: '🌍', ar: 'دولة أخرى', en: 'Other country', zh: '其他国家' },
];

// KSA cities (dropdown when country = SA; free text otherwise).
export const KSA_CITIES = [
  { ar: 'الرياض', en: 'Riyadh' },
  { ar: 'جدة', en: 'Jeddah' },
  { ar: 'مكة المكرمة', en: 'Mecca' },
  { ar: 'المدينة المنورة', en: 'Medina' },
  { ar: 'الدمام', en: 'Dammam' },
  { ar: 'الخبر', en: 'Khobar' },
  { ar: 'الظهران', en: 'Dhahran' },
  { ar: 'الأحساء', en: 'Al-Ahsa' },
  { ar: 'الجبيل', en: 'Jubail' },
  { ar: 'الطائف', en: 'Taif' },
  { ar: 'بريدة', en: 'Buraidah' },
  { ar: 'تبوك', en: 'Tabuk' },
  { ar: 'خميس مشيط', en: 'Khamis Mushait' },
  { ar: 'أبها', en: 'Abha' },
  { ar: 'حائل', en: 'Hail' },
  { ar: 'نجران', en: 'Najran' },
  { ar: 'جازان', en: 'Jazan' },
  { ar: 'ينبع', en: 'Yanbu' },
  { ar: 'عرعر', en: 'Arar' },
  { ar: 'سكاكا', en: 'Sakaka' },
];

// Attachment limits (mirror the private request-attachments bucket).
export const ATTACH_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const ATTACH_MAX_COUNT = 6;
export const ATTACH_ACCEPT = 'image/*,application/pdf,.zip,.ai,.eps';
