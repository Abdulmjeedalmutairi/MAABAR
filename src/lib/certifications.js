// Factory certifications — a known-cert dictionary + normalization helpers.
// Stored on factory_directory.certifications as [{ code, name_ar, name_en }].
// Known codes render a friendly bilingual name; UNKNOWN codes keep the name
// Gemini (or the admin) supplied, so obscure certs are never cryptic.

export const CERT_GREEN = '#2f8f4e';
export const CERT_GREEN_BG = 'rgba(47,143,78,0.10)';
export const CERT_GREEN_BORDER = 'rgba(47,143,78,0.30)';

// Canonical code (UPPER, single-spaced) → { ar, en } short meaning.
export const CERT_DICT = {
  'ISO 9001': { ar: 'إدارة الجودة', en: 'Quality management' },
  'ISO 14001': { ar: 'الإدارة البيئية', en: 'Environmental management' },
  'ISO 45001': { ar: 'السلامة والصحة المهنية', en: 'Occupational health & safety' },
  'ISO 22000': { ar: 'سلامة الغذاء', en: 'Food safety management' },
  'ISO 13485': { ar: 'الأجهزة الطبية', en: 'Medical devices quality' },
  'ISO 50001': { ar: 'إدارة الطاقة', en: 'Energy management' },
  'CE': { ar: 'مطابقة أوروبية', en: 'EU conformity' },
  'ROHS': { ar: 'تقييد المواد الخطرة', en: 'Restriction of hazardous substances' },
  'REACH': { ar: 'تسجيل المواد الكيميائية', en: 'Chemicals registration (EU)' },
  'FDA': { ar: 'الغذاء والدواء (أمريكا)', en: 'US Food & Drug Administration' },
  'FSC': { ar: 'إدارة الغابات المستدامة', en: 'Forest Stewardship Council' },
  'CARB': { ar: 'انبعاث الفورمالديهايد', en: 'Formaldehyde emissions (wood)' },
  'SGS': { ar: 'فحص واعتماد SGS', en: 'SGS inspection' },
  'BSCI': { ar: 'الامتثال الاجتماعي', en: 'Social compliance (amfori BSCI)' },
  'OEKO-TEX': { ar: 'سلامة المنسوجات', en: 'Textile safety (OEKO-TEX)' },
  'GOTS': { ar: 'المنسوجات العضوية', en: 'Global Organic Textile Standard' },
  'WRAP': { ar: 'إنتاج الملابس المسؤول', en: 'Responsible apparel production' },
  'CCC': { ar: 'الشهادة الإلزامية الصينية', en: 'China Compulsory Certification' },
  'UL': { ar: 'سلامة المنتجات (UL)', en: 'UL safety certification' },
  'FCC': { ar: 'التوافق الكهرومغناطيسي (أمريكا)', en: 'US electronics (FCC)' },
  'CB': { ar: 'اختبار السلامة IEC (CB)', en: 'IEC CB test scheme' },
  'HACCP': { ar: 'تحليل مخاطر الغذاء', en: 'Food hazard analysis' },
  'BRC': { ar: 'سلامة الغذاء (BRC)', en: 'BRC food safety' },
  'LFGB': { ar: 'ملامسة الغذاء (ألمانيا)', en: 'German food-contact safety' },
  'EN 71': { ar: 'سلامة الألعاب (أوروبا)', en: 'European toy safety' },
};

// Suggestions shown in the admin editor (quick-add chips).
export const CERT_SUGGESTIONS = Object.keys(CERT_DICT);

// Normalise a raw code to its canonical dictionary key when recognised, else a
// cleaned UPPER form. "iso9001" / "ISO 9001" / "ISO-9001" → "ISO 9001".
export function normCertCode(raw) {
  const clean = String(raw || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!clean) return '';
  if (CERT_DICT[clean]) return clean;
  const squished = clean.replace(/[\s-]/g, '');
  for (const k of Object.keys(CERT_DICT)) {
    if (k.replace(/[\s-]/g, '') === squished) return k;
  }
  return clean;
}

// The bilingual meaning for a cert: the dictionary first (consistent), then the
// stored name (covers unknown certs), else empty.
export function certName(cert, lang = 'ar') {
  const code = normCertCode(cert?.code);
  const dict = CERT_DICT[code];
  if (dict) return lang === 'ar' ? dict.ar : dict.en;
  const nm = lang === 'ar' ? cert?.name_ar : cert?.name_en;
  const alt = lang === 'ar' ? cert?.name_en : cert?.name_ar;
  return (nm && nm !== 'not_found' ? nm : '') || (alt && alt !== 'not_found' ? alt : '') || '';
}

// Clean + de-duplicate a certifications array (accepts objects, or legacy plain
// strings). Returns [{ code, name_ar, name_en }] with normalised codes.
export function normalizeCerts(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const raw of arr) {
    const obj = typeof raw === 'string' ? { code: raw } : (raw || {});
    const code = normCertCode(obj.code || obj.name_en || obj.name_ar);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const dict = CERT_DICT[code];
    out.push({
      code,
      name_ar: dict ? dict.ar : (obj.name_ar && obj.name_ar !== 'not_found' ? obj.name_ar : ''),
      name_en: dict ? dict.en : (obj.name_en && obj.name_en !== 'not_found' ? obj.name_en : ''),
    });
  }
  return out;
}
