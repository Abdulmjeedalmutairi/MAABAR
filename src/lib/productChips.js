import { normalizeCerts } from './certifications';

// At-a-glance selling-point chips for a product card / detail. Bronze-on-cream
// family (see ProductChips), non-competing with the price. Data lives at two
// levels: customization_options + moq on the PRODUCT, certifications +
// private_label on its FACTORY.

// Per-category "low MOQ" ceilings (in units). A product whose parsed MOQ is at or
// below its category ceiling earns the "Low MOQ" chip. Rough by trade, not exact —
// bulky goods (furniture, machinery) are low at small counts; consumables
// (packaging, apparel) only at large ones.
const MOQ_LOW = {
  industrial_machinery: 5, hospitality_supplies: 10,
  furniture: 50, office_furniture: 50, bedroom_furniture: 50,
  kitchen_furniture: 50, outdoor_furniture: 50,
  home_decor: 100, electronics: 100, home_appliances: 100,
  building: 100, food: 100, agriculture: 100, tires: 100,
  auto_parts: 200, car_accessories: 200, lubricants: 200, health: 200, sports: 200,
  clothing: 300, beauty: 500, toys: 500, gifts: 500,
  packaging: 1000,
};
const MOQ_LOW_DEFAULT = 100;

// First integer in a free-text MOQ ("from 100 pcs" → 100). null if none.
export function parseMoqQty(moq) {
  if (!moq || moq === 'not_found') return null;
  const m = String(moq).replace(/[,٬]/g, '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

export function isLowMoq(moq, category) {
  const q = parseMoqQty(moq);
  if (q == null) return false;
  return q <= (MOQ_LOW[category] ?? MOQ_LOW_DEFAULT);
}

// Build the chips for a product given its factory. Order = strongest signal first.
export function buildProductChips({ product, factory }) {
  const chips = [];
  const custom = Array.isArray(product?.customization_options) ? product.customization_options : [];
  const certs = normalizeCerts(factory?.certifications);
  if (custom.length) chips.push({ key: 'custom', ar: 'تخصيص حسب الطلب', en: 'Custom-made', zh: '可定制', icon: '✎' });
  if (factory?.private_label) chips.push({ key: 'oem', ar: 'يصنّع علامتك الخاصة', en: 'Private label', zh: '贴牌代工', icon: '⚙' });
  if (certs.length) chips.push({ key: 'certs', ar: 'شهادات جودة', en: 'Quality certified', zh: '质量认证', icon: '✓' });
  if (isLowMoq(product?.moq, factory?.category)) chips.push({ key: 'moq', ar: 'MOQ منخفض', en: 'Low MOQ', zh: '低起订量', icon: '↓' });
  return chips;
}
