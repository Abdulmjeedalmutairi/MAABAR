/**
 * Templated one-line supplier blurb, shown in place of an empty About section.
 *
 * Assembled ONLY from fields we reliably have (sector, location, verified
 * status). Never fabricates years/certs/etc. — anything absent stays absent.
 * Written directly in each language (no translation call needed).
 *
 * Guards against embedding Chinese script in an Arabic/English sentence:
 *   - sector is included only if it resolves to a real, non-CJK label
 *   - a Chinese-script city/country is dropped from the location clause
 *     (per decision: omit rather than show 中文 mid-sentence)
 *
 * Field-verified is always true for a listed supplier (they're vetted in
 * person), so the closing clause is unconditional.
 */

import { getSpecialtyLabel } from './supplierDashboardConstants';

const CJK = /[一-鿿]/;
const isCJK = (v) => typeof v === 'string' && CJK.test(v);

export function buildSupplierBlurb(supplier, lang = 'ar') {
  if (!supplier) return '';

  // Sector — only when it maps to a real, non-Chinese label.
  let sector = '';
  const rawSpec = supplier.speciality;
  if (rawSpec && rawSpec !== 'other' && !isCJK(rawSpec)) {
    const label = getSpecialtyLabel(rawSpec, lang);
    if (label && !isCJK(label)) sector = label;
  }

  // Location — keep only non-Chinese-script parts.
  const locParts = [supplier.city, supplier.country].filter((v) => v && !isCJK(v));
  const loc = locParts.join(lang === 'ar' ? '، ' : ', ');

  if (lang === 'zh') {
    let s = '中国供应商';
    if (sector) s += `，专注于${sector}`;
    if (loc) s += `，位于${loc}`;
    s += '，已由 Maabar 团队实地核验。';
    return s;
  }
  if (lang === 'en') {
    let s = 'A Chinese supplier';
    if (sector) s += ` specializing in ${sector}`;
    if (loc) s += ` from ${loc}`;
    s += ', field-verified in person by the Maabar team.';
    return s;
  }
  // Arabic (default)
  let s = 'مورد صيني';
  if (sector) s += ` متخصص في ${sector}`;
  if (loc) s += ` من ${loc}`;
  s += '، تم التحقق منه ميدانيًا من قبل فريق مَعبر.';
  return s;
}
