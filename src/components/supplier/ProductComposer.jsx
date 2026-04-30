import React from 'react';
import { DISPLAY_CURRENCIES } from '../../lib/displayCurrency';
import {
  PRODUCT_GALLERY_LIMIT,
  buildProductSpecs,
  getProductGalleryImages,
  normalizeProductDraftMedia,
  normalizeProductAttributes,
} from '../../lib/productMedia';
import {
  emptyTierSet,
  padToThree,
  validateProductTiers,
} from '../../lib/productPricingTiers';
import { T } from '../../lib/supplierDashboardConstants';
import { VF_C, VF_CSS, VfField } from './VerificationFormUI';
import { VariantBuilder } from './VariantBuilder';
import { CERT_TYPES, CERT_MAX_COUNT, CERT_MAX_BYTES, emptyCertRow } from '../../lib/productCertifications';
import { suggestHsCodes } from '../../lib/maabarAi/client';

export const emptyProduct = {
  name_ar: '', name_en: '', name_zh: '',
  currency: 'USD', category: 'other', moq: '',
  tiers: emptyTierSet(),
  desc_en: '', desc_ar: '', desc_zh: '',
  image_url: null, gallery_images: [], video_url: null,
  spec_material: '', spec_dimensions: '', spec_unit_weight: '', spec_color_options: '', spec_packaging_details: '', spec_customization: '', spec_lead_time_days: '',
  attributes: [],
  // variant-system fields
  has_variants: false,
  unit_weight_kg: '',
  package_dimensions: '',
  sample_available: false, sample_price: '', sample_shipping: '', sample_max_qty: '3', sample_note: '',
  sample_free_from_qty: '',
  // Phase 3 — B2B logistics & compliance
  hs_code: '',
  country_of_origin: 'China',
  incoterms: [],
  port_of_loading: '',
  port_of_loading_other: '',
  country_of_origin_other: '',
  units_per_carton: '',
  cbm: '',
  gross_weight_kg: '',
  net_weight_kg: '',
  lead_time_min_days: '',
  lead_time_max_days: '',
  lead_time_negotiable: false,
  oem_available: false,
  odm_available: false,
  oem_lead_time_min_days: '',
  oem_lead_time_max_days: '',
  price_validity_days: 30,
  // Phase 4 — form-only fields (not persisted on the products row)
  certifications: [],
};

export const PRODUCT_OPTIONAL_DB_FIELDS = [
  'gallery_images',
  'spec_material',
  'spec_dimensions',
  'spec_unit_weight',
  'spec_color_options',
  'spec_packaging_details',
  'spec_customization',
  'spec_lead_time_days',
  'attributes',
  'desc_zh',
  // variants subsystem columns
  'has_variants',
  'unit_weight_kg',
  'package_dimensions',
  'sample_free_from_qty',
  // Phase 1 B2B foundation columns (logistics + compliance)
  'hs_code',
  'country_of_origin',
  'incoterms',
  'port_of_loading',
  'units_per_carton',
  'cbm',
  'gross_weight_kg',
  'net_weight_kg',
  'lead_time_min_days',
  'lead_time_max_days',
  'lead_time_negotiable',
  'oem_available',
  'odm_available',
  'oem_lead_time_min_days',
  'oem_lead_time_max_days',
  'price_validity_days',
];

// Canonical option lists for dropdowns. The form stores `__other__` as the
// dropdown sentinel when free-text mode is active; buildProductWritePayload
// translates that back to the user's typed value for the DB.
export const COUNTRY_OF_ORIGIN_OPTIONS = ['China', 'Vietnam', 'Turkey', 'India', 'Pakistan', 'Bangladesh', 'Indonesia'];
export const PORT_OF_LOADING_OPTIONS = ['Shanghai', 'Shenzhen', 'Ningbo', 'Guangzhou', 'Qingdao', 'Tianjin'];
export const INCOTERM_OPTIONS = ['FOB', 'CIF', 'EXW', 'DDP'];
export const PRICE_VALIDITY_OPTIONS = [30, 60, 90];

// Resolve the "dropdown OR other-text" pair into a single column value.
// Used by buildProductWritePayload AND by the Edit click handler in reverse.
export function resolveSelectOrOther(selectValue, otherValue, knownOptions) {
  const sel = String(selectValue || '').trim();
  if (sel === '__other__') {
    const other = String(otherValue || '').trim();
    return other || null;
  }
  if (!sel) return null;
  return knownOptions.includes(sel) ? sel : sel; // tolerate legacy free-text values
}

// Given a DB-stored value, expand it into form fields:
//   { selectValue: <known option | '__other__' | ''>, otherValue: <free text> }
export function expandStoredSelect(stored, knownOptions) {
  const v = String(stored || '').trim();
  if (!v) return { selectValue: '', otherValue: '' };
  if (knownOptions.includes(v)) return { selectValue: v, otherValue: '' };
  return { selectValue: '__other__', otherValue: v };
}

export const buildProductWritePayload = (rawProduct, supplierId) => {
  const product = normalizeProductDraftMedia(rawProduct);
  const fallbackName = product.name_en || product.name_zh || product.name_ar || '';

  // Phase 4: price_from has been dropped from products. Pricing lives in
  // product_pricing_tiers; readers compute the "from" price via
  // deriveProductPriceFrom(). The form no longer sends price_from at all.

  // moq is now an integer column. Coerce a numeric string to int; anything
  // non-numeric becomes null so Postgres does not reject the insert.
  const moqInt = (() => {
    const n = parseInt(product.moq, 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  })();

  const intOrNull = (v, min = 0) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= min ? n : null;
  };
  const numOrNull = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Resolve dropdown-or-other for country / port
  const resolvedCountry = resolveSelectOrOther(product.country_of_origin, product.country_of_origin_other, COUNTRY_OF_ORIGIN_OPTIONS);
  const resolvedPort    = resolveSelectOrOther(product.port_of_loading,   product.port_of_loading_other,   PORT_OF_LOADING_OPTIONS);

  // Incoterms: keep only known values, dedupe
  const cleanIncoterms = Array.isArray(product.incoterms)
    ? Array.from(new Set(product.incoterms.filter(x => INCOTERM_OPTIONS.includes(x))))
    : [];

  return {
    ...(supplierId ? { supplier_id: supplierId } : {}),
    name_ar: product.name_ar || fallbackName,
    name_en: product.name_en || fallbackName,
    name_zh: product.name_zh || fallbackName,
    currency: product.currency || 'USD',
    category: product.category || 'other',
    moq: moqInt,
    // Phase 1 B2B columns
    hs_code: product.hs_code ? String(product.hs_code).trim() || null : null,
    country_of_origin: resolvedCountry,
    incoterms: cleanIncoterms,
    port_of_loading: resolvedPort,
    units_per_carton:       intOrNull(product.units_per_carton, 1),
    cbm:                    numOrNull(product.cbm),
    gross_weight_kg:        numOrNull(product.gross_weight_kg),
    net_weight_kg:          numOrNull(product.net_weight_kg),
    lead_time_min_days:     intOrNull(product.lead_time_min_days, 0),
    lead_time_max_days:     intOrNull(product.lead_time_max_days, 0),
    lead_time_negotiable:   Boolean(product.lead_time_negotiable),
    oem_available:          Boolean(product.oem_available),
    odm_available:          Boolean(product.odm_available),
    oem_lead_time_min_days: intOrNull(product.oem_lead_time_min_days, 0),
    oem_lead_time_max_days: intOrNull(product.oem_lead_time_max_days, 0),
    price_validity_days:    intOrNull(product.price_validity_days, 1),
    desc_en: product.desc_en,
    desc_ar: product.desc_ar || product.desc_en,
    desc_zh: product.desc_zh || null,
    image_url: product.image_url || null,
    gallery_images: product.gallery_images || [],
    video_url: product.video_url || null,
    spec_material: product.spec_material || null,
    spec_dimensions: product.spec_dimensions || null,
    spec_unit_weight: product.spec_unit_weight || null,
    spec_color_options: product.spec_color_options || null,
    spec_packaging_details: product.spec_packaging_details || null,
    spec_customization: product.spec_customization || null,
    spec_lead_time_days: product.spec_lead_time_days ? parseInt(product.spec_lead_time_days, 10) : null,
    attributes: normalizeProductAttributes(product.attributes),
    sample_available: product.sample_available,
    sample_price: product.sample_available ? parseFloat(product.sample_price) : null,
    sample_shipping: product.sample_available ? parseFloat(product.sample_shipping || 0) : null,
    sample_max_qty: product.sample_available ? parseInt(product.sample_max_qty || 3, 10) : null,
    sample_note: product.sample_note || null,
    // variant-system
    has_variants: Boolean(product.has_variants),
    unit_weight_kg: product.unit_weight_kg ? parseFloat(product.unit_weight_kg) : null,
    package_dimensions: product.package_dimensions || null,
    sample_free_from_qty: product.sample_free_from_qty ? parseInt(product.sample_free_from_qty, 10) : null,
    is_active: true,
  };
};

export function getProductComposerValidationMessage(product, lang = 'en') {
  const t = T[lang] || T.en;

  if (!product?.name_zh || !product?.name_en || !product?.desc_en) {
    return t.composerRequiredFields;
  }

  // moq must be a whole number ≥ 1
  const moqInt = parseInt(product?.moq, 10);
  if (!Number.isFinite(moqInt) || moqInt < 1 || String(moqInt) !== String(product.moq).trim()) {
    return t.moqValidationMin;
  }

  // 3 mandatory pricing tiers
  const tierMsg = validateProductTiers(product?.tiers, moqInt, lang);
  if (tierMsg) return tierMsg;

  // ≥ 1 Incoterm selected
  const cleanIncoterms = Array.isArray(product?.incoterms)
    ? product.incoterms.filter(x => INCOTERM_OPTIONS.includes(x))
    : [];
  if (cleanIncoterms.length < 1) return t.incotermsValidation;

  // Port of loading required (resolved value must be non-empty)
  const resolvedPort = resolveSelectOrOther(product?.port_of_loading, product?.port_of_loading_other, PORT_OF_LOADING_OPTIONS);
  if (!resolvedPort) return t.portValidation;

  // Lead-time order check (when both filled)
  const lmin = parseInt(product?.lead_time_min_days, 10);
  const lmax = parseInt(product?.lead_time_max_days, 10);
  if (Number.isFinite(lmin) && Number.isFinite(lmax) && lmax < lmin) {
    return t.leadTimeOrderError;
  }

  // OEM/ODM lead-time order check (when both filled)
  const omin = parseInt(product?.oem_lead_time_min_days, 10);
  const omax = parseInt(product?.oem_lead_time_max_days, 10);
  if (Number.isFinite(omin) && Number.isFinite(omax) && omax < omin) {
    return t.leadTimeOrderError;
  }

  // Phase 4 — positive-only constraints for optional numeric packaging fields.
  // Only enforced when the supplier filled the field (empty = OK).
  const positiveCheck = (value, key) => {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return key;
    return null;
  };
  if (positiveCheck(product?.cbm, 'cbm')) return t.cbmPositiveError;
  if (positiveCheck(product?.gross_weight_kg, 'gross') || positiveCheck(product?.net_weight_kg, 'net')) {
    return t.weightPositiveError;
  }

  return '';
}

export function getProductFormPlaceholders(lang = 'en') {
  if (lang === 'ar') {
    return {
      name_zh: 'مثال: سماعة بلوتوث TWS',
      name_en: 'Example: TWS Bluetooth Earbuds',
      name_ar: 'مثال: سماعات بلوتوث لاسلكية',
      moq: 'مثال: 500',
      price_from: 'مثال: 8.50',
      desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
      desc_ar: 'مثال: علبة ABS مع بلوتوث 5.3 ودعم شعار OEM.',
      spec_material: 'ABS / فولاذ / قطن...',
      spec_dimensions: '20×12×8 cm',
      spec_unit_weight: '0.35 kg',
      spec_color_options: 'أسود، أبيض، مخصص',
      spec_packaging_details: 'كرتون داخلي + كرتون تصدير',
      spec_customization: 'شعار OEM، تغليف خاص، لون خاص',
      spec_lead_time_days: '15',
      sample_price: 'مثال: 50',
      sample_shipping: 'مثال: 25',
      sample_max_qty: '3',
      sample_note: 'مثال: العينة تُخصم من الطلب الكبير',
    };
  }

  if (lang === 'zh') {
    return {
      name_zh: '例：TWS 蓝牙耳机',
      name_en: 'Example: TWS Bluetooth Earbuds',
      name_ar: 'مثال: سماعات بلوتوث لاسلكية',
      moq: '例：500',
      price_from: '例：8.50',
      desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
      desc_ar: '可选：给阿语买家补充说明',
      spec_material: '例：ABS / 铝合金 / 纯棉',
      spec_dimensions: '例：20×12×8 cm',
      spec_unit_weight: '例：0.35 kg',
      spec_color_options: '例：黑 / 白 / 定制色',
      spec_packaging_details: '例：彩盒 + 外箱',
      spec_customization: '例：支持 OEM / Logo / 包装定制',
      spec_lead_time_days: '例：15',
      sample_price: '例：50',
      sample_shipping: '例：25',
      sample_max_qty: '3',
      sample_note: '例：大货下单可返还样品费',
    };
  }

  return {
    name_zh: 'Example: TWS 蓝牙耳机',
    name_en: 'Example: TWS Bluetooth Earbuds',
    name_ar: 'Example: سماعات بلوتوث لاسلكية',
    moq: 'Example: 500',
    price_from: 'Example: 8.50',
    desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
    desc_ar: 'Optional Arabic buyer-facing note',
    spec_material: 'Example: ABS / Aluminum / Cotton',
    spec_dimensions: 'Example: 20×12×8 cm',
    spec_unit_weight: 'Example: 0.35 kg',
    spec_color_options: 'Example: Black / White / Custom',
    spec_packaging_details: 'Example: Retail box + export carton',
    spec_customization: 'Example: OEM logo / custom packaging',
    spec_lead_time_days: 'Example: 15',
    sample_price: 'Example: 50',
    sample_shipping: 'Example: 25',
    sample_max_qty: '3',
    sample_note: 'Example: sample cost can be deducted from bulk order',
  };
}

// Weighted completeness items.
// Each item has `category` ∈ {'required','recommended','media','certs'}.
// `getProductCompletenessScore` aggregates them as: required 50%,
// recommended 30%, media 10%, certs 10%.
//
// `certifications` count comes from the parent (DashboardSupplier loads
// product_certifications when entering edit mode); pass 0 for the create
// flow until the cert uploader ships in Phase 4.
export function getProductCompletenessItems(product, lang = 'en', { certificationsCount = 0 } = {}) {
  const moqInt = parseInt(product?.moq, 10);
  const moqOk = Number.isFinite(moqInt) && moqInt >= 1;
  const tiersOk = moqOk && !validateProductTiers(product?.tiers, moqInt, lang);
  const cleanIncoterms = Array.isArray(product?.incoterms)
    ? product.incoterms.filter(x => INCOTERM_OPTIONS.includes(x))
    : [];
  const resolvedPort = resolveSelectOrOther(product?.port_of_loading, product?.port_of_loading_other, PORT_OF_LOADING_OPTIONS);
  const galleryCount = getProductGalleryImages(product).length;
  const hasVideo = Boolean(product?.video_url);
  const leadTimeOk = Number.isFinite(parseInt(product?.lead_time_min_days, 10))
                  && Number.isFinite(parseInt(product?.lead_time_max_days, 10));
  const weightsOk = Number.isFinite(parseFloat(product?.gross_weight_kg))
                 || Number.isFinite(parseFloat(product?.net_weight_kg));

  return [
    // ── Required (50%) ────────────────────────────────────────────────
    { key: 'name_zh',     category: 'required',
      label: lang === 'ar' ? 'الاسم الصيني (لفريق المبيعات والمتجر)' : lang === 'zh' ? '中文产品名（销售/店铺侧）' : 'Chinese product name (sales / storefront)',
      done: Boolean(product?.name_zh) },
    { key: 'name_en',     category: 'required',
      label: lang === 'ar' ? 'الاسم الإنجليزي للمشتري' : lang === 'zh' ? '英文产品名（买家侧）' : 'English product name (buyer-facing)',
      done: Boolean(product?.name_en) },
    { key: 'desc_en',     category: 'required',
      label: lang === 'ar' ? 'الوصف الإنجليزي (مادة، استخدام، جودة)' : lang === 'zh' ? '英文描述（材质 / 用途 / 质量点）' : 'English description (material, use, quality)',
      done: Boolean(product?.desc_en) },
    { key: 'pricing',     category: 'required',
      label: lang === 'ar' ? 'MOQ + الشرائح السعرية + العملة' : lang === 'zh' ? 'MOQ + 阶梯定价 + 币种' : 'MOQ + pricing tiers + currency',
      done: Boolean(product?.currency) && moqOk && tiersOk },
    { key: 'incoterms',   category: 'required',
      label: lang === 'ar' ? 'شرط شحن واحد على الأقل (FOB / CIF / EXW / DDP)' : lang === 'zh' ? '至少一个贸易术语 (FOB/CIF/EXW/DDP)' : 'At least one Incoterm (FOB / CIF / EXW / DDP)',
      done: cleanIncoterms.length >= 1 },
    { key: 'port',        category: 'required',
      label: lang === 'ar' ? 'ميناء الشحن' : lang === 'zh' ? '装运港' : 'Port of loading',
      done: Boolean(resolvedPort) },

    // ── Recommended (30%) ─────────────────────────────────────────────
    { key: 'hs_code',     category: 'recommended',
      label: lang === 'ar' ? 'رمز التعريفة الجمركية (HS)' : lang === 'zh' ? '海关编码 (HS Code)' : 'HS Code',
      done: Boolean(product?.hs_code && String(product.hs_code).trim()) },
    { key: 'country',     category: 'recommended',
      label: lang === 'ar' ? 'بلد المنشأ' : lang === 'zh' ? '原产国' : 'Country of origin',
      done: Boolean(product?.country_of_origin && String(product.country_of_origin).trim()) },
    { key: 'lead_time',   category: 'recommended',
      label: lang === 'ar' ? 'مدة التصنيع (حد أدنى وأقصى)' : lang === 'zh' ? '生产交期（最短 / 最长）' : 'Production lead time (min + max)',
      done: leadTimeOk },
    { key: 'units_carton', category: 'recommended',
      label: lang === 'ar' ? 'عدد الوحدات في الكرتون' : lang === 'zh' ? '每箱数量' : 'Units per carton',
      done: Number.isFinite(parseInt(product?.units_per_carton, 10)) },
    { key: 'cbm',         category: 'recommended',
      label: lang === 'ar' ? 'CBM (متر³)' : lang === 'zh' ? 'CBM（立方米）' : 'CBM (m³)',
      done: Number.isFinite(parseFloat(product?.cbm)) },
    { key: 'weights',     category: 'recommended',
      label: lang === 'ar' ? 'الوزن الإجمالي أو الصافي (كجم)' : lang === 'zh' ? '毛重或净重 (kg)' : 'Gross or net weight (kg)',
      done: weightsOk },
    { key: 'specs',       category: 'recommended',
      label: lang === 'ar' ? 'مواصفات / تعبئة / OEM / مدة تجهيز' : lang === 'zh' ? '规格 / 包装 / OEM / 交期' : 'Specs, packaging, OEM, or lead-time detail',
      done: buildProductSpecs(product).length > 0 },

    // ── Media (10%) ───────────────────────────────────────────────────
    { key: 'media',       category: 'media',
      label: (T[lang] || T.en).completenessMedia,
      done: galleryCount >= 3 && hasVideo },

    // ── Certs (10%) ───────────────────────────────────────────────────
    { key: 'certs',       category: 'certs',
      label: (T[lang] || T.en).completenessCerts,
      done: certificationsCount >= 1 },
  ];
}

// Aggregate weighted score (0–100) from completeness items.
export function getProductCompletenessScore(items) {
  const weights = { required: 0.5, recommended: 0.3, media: 0.1, certs: 0.1 };
  const buckets = { required: [], recommended: [], media: [], certs: [] };
  for (const i of (items || [])) {
    if (buckets[i.category]) buckets[i.category].push(i);
  }
  let pct = 0;
  for (const cat of Object.keys(weights)) {
    const list = buckets[cat];
    if (!list.length) continue;
    const done = list.filter(i => i.done).length;
    pct += weights[cat] * (done / list.length);
  }
  return Math.round(pct * 100);
}

/* ─── Attribute row sub-component (needs local state for the value input) ─ */
function AttributeRow({ attr, onChange, onRemove, isAr, lang }) {
  const [inputVal, setInputVal] = React.useState('');
  const vfFont = { fontFamily: "'Tajawal', sans-serif" };
  const tT = T[lang] || T.en;

  const addValue = () => {
    const trimmed = inputVal.trim();
    if (!trimmed || (attr.values || []).includes(trimmed) || (attr.values || []).length >= 20) return;
    onChange({ ...attr, values: [...(attr.values || []), trimmed] });
    setInputVal('');
  };

  const removeValue = (idx) => {
    const newVals = [...(attr.values || [])];
    newVals.splice(idx, 1);
    onChange({ ...attr, values: newVals });
  };

  return (
    <div style={{ padding: '14px 16px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, position: 'relative' }}>
      <button type="button" onClick={onRemove} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: VF_C.ink30, lineHeight: 1 }}>×</button>
      <div style={{ marginBottom: 10, paddingRight: 28 }}>
        <div className="vf-field-wrap">
          <input
            className="vf-input"
            placeholder={tT.attrNamePlaceholder}
            value={attr.name || ''}
            onChange={e => onChange({ ...attr, name: e.target.value })}
            style={{ fontSize: 14, fontWeight: 500, ...vfFont }}
          />
          <div className="vf-underline" />
        </div>
      </div>
      {(attr.values || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(attr.values || []).map((val, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 999, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink, ...vfFont }}>
              {val}
              <button type="button" onClick={() => removeValue(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: VF_C.ink30, lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {(attr.values || []).length < 20 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="vf-field-wrap" style={{ flex: 1 }}>
            <input
              className="vf-input"
              placeholder={tT.attrValuePlaceholder}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addValue(); } }}
              style={{ fontSize: 13, ...vfFont }}
            />
            <div className="vf-underline" />
          </div>
          <button type="button" onClick={addValue} style={{ fontSize: 12, padding: '8px 16px', background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, borderRadius: 10, cursor: 'pointer', color: VF_C.ink60, whiteSpace: 'nowrap', ...vfFont, marginBottom: 2 }}>
            {tT.attrAddBtn}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Tiered pricing table (3 mandatory rows) ────────────────────────── */
function TieredPricingTable({ tiers, moq, currency, usdRate, onChange, lang, vfFont }) {
  const t = T[lang] || T.en;
  const isAr = lang === 'ar';
  const safeTiers = padToThree(tiers);
  const moqStr = String(moq || '').trim();
  const moqIsValid = /^\d+$/.test(moqStr);

  const updateTier = (idx, patch) => {
    onChange(safeTiers.map((row, i) => i === idx ? { ...row, ...patch } : row));
  };

  const sarEstimate = (priceStr) => {
    const n = parseFloat(priceStr);
    if (!Number.isFinite(n) || n <= 0 || currency !== 'USD') return null;
    return (n * (usdRate || 3.75)).toFixed(2);
  };

  const inputStyle = {
    width: '100%',
    minWidth: 60,
    border: 'none',
    borderBottom: `1px solid ${VF_C.ink10}`,
    background: 'transparent',
    outline: 'none',
    fontSize: 13,
    color: VF_C.ink,
    padding: '5px 0',
    ...vfFont,
  };

  return (
    <div style={{ marginTop: 4, marginBottom: 16, padding: '18px 20px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12 }}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 6, ...vfFont }}>
        {t.tieredPricingTitle}
      </p>
      <p style={{ fontSize: 12, color: VF_C.ink60, marginBottom: 14, lineHeight: 1.6, ...vfFont }}>
        {t.tieredPricingHint}
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, ...vfFont }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${VF_C.ink10}` }}>
              {[t.tierColTier, t.tierColMinQty, t.tierColMaxQty, t.tierColUnitPrice].map((h, i) => (
                <th key={i} style={{ textAlign: isAr ? 'right' : 'left', padding: '8px 10px', color: VF_C.ink30, fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeTiers.map((row, idx) => {
              const isLast = idx === safeTiers.length - 1;
              const tier1QtyDisplay = idx === 0 && row.qty_from === '' && moqIsValid ? moqStr : row.qty_from;
              const sar = sarEstimate(row.unit_price);
              return (
                <tr key={row._key || idx} style={{ borderBottom: `1px solid ${VF_C.ink05}` }}>
                  <td style={{ padding: '10px', color: VF_C.ink, fontSize: 13, whiteSpace: 'nowrap' }}>
                    {t.tierLabel(idx + 1)}
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number" min="1" step="1" inputMode="numeric"
                      style={inputStyle}
                      value={tier1QtyDisplay}
                      placeholder={idx === 0 ? (moqIsValid ? moqStr : '1') : ''}
                      onChange={e => updateTier(idx, { qty_from: e.target.value.replace(/[^0-9]/g, '') })}
                      dir="ltr"
                    />
                  </td>
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number" min="1" step="1" inputMode="numeric"
                      style={inputStyle}
                      value={row.qty_to}
                      placeholder={isLast ? `∞ ${t.tierAndAbove}` : ''}
                      onChange={e => updateTier(idx, { qty_to: e.target.value.replace(/[^0-9]/g, '') })}
                      dir="ltr"
                    />
                  </td>
                  <td style={{ padding: '6px 10px', minWidth: 150 }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number" min="0" step="0.01" inputMode="decimal"
                        style={{ ...inputStyle, paddingRight: 38 }}
                        value={row.unit_price}
                        placeholder="0.00"
                        onChange={e => updateTier(idx, { unit_price: e.target.value })}
                        dir="ltr"
                      />
                      <span style={{ position: 'absolute', right: 0, bottom: 6, fontSize: 11, color: VF_C.ink30, pointerEvents: 'none', ...vfFont }}>
                        {currency}
                      </span>
                    </div>
                    {sar && (
                      <p style={{ fontSize: 11, color: VF_C.ink30, marginTop: 4, ...vfFont }}>
                        ≈ {sar} SAR
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: VF_C.ink30, marginTop: 10, ...vfFont }}>
        {t.tierAutoFromMoq}
      </p>
    </div>
  );
}

/* ─── HS Code AI suggester (Phase 4) ──────────────────────────────────
   Calls the Maabar AI edge function with the product's English name +
   category + description, returns up to 3 chip-shaped suggestions.
   Click a chip to fill the HS code input. */
function HsCodeSuggester({ nameEn, category, description, lang, onPick, vfFont }) {
  const tT = T[lang] || T.en;
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');
  const [items, setItems]     = React.useState([]);

  const run = async () => {
    if (!String(nameEn || '').trim()) {
      setError(tT.hsCodeSuggestNoName);
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    setItems([]);
    try {
      const list = await suggestHsCodes({ productName: nameEn, category, description, language: lang });
      if (!list.length) setError(tT.hsCodeSuggestEmpty);
      setItems(list);
    } catch (_err) {
      setError(tT.hsCodeSuggestFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 6, marginBottom: 12 }}>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        style={{ fontSize: 12, padding: '6px 14px', background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, borderRadius: 8, cursor: loading ? 'default' : 'pointer', color: VF_C.ink60, ...vfFont, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? tT.hsCodeSuggesting : tT.hsCodeSuggestBtn}
      </button>
      {error && (
        <p style={{ fontSize: 11, color: VF_C.amber, marginTop: 6, ...vfFont }}>{error}</p>
      )}
      {items.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontSize: 10, letterSpacing: 1.5, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 6, ...vfFont }}>{tT.hsCodeSuggestionsTitle}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPick(it.code)}
                title={it.description}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px', borderRadius: 999, border: `1px solid ${VF_C.ink10}`, background: VF_C.paper, color: VF_C.ink, cursor: 'pointer', ...vfFont, maxWidth: 360 }}
              >
                <span style={{ fontFamily: 'monospace' }}>{it.code}</span>
                {it.description && (
                  <span style={{ color: VF_C.ink60, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>
                    — {it.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Certifications uploader (Phase 4) ──────────────────────────────
   Multi-row uploader; each row holds: cert type, optional label, PDF, dates.
   The actual file upload is deferred to saveProductCertifications — here we
   only track the local File object on `_pendingFile`. */
function CertificationsUploader({ certs, onChange, lang, vfFont, isAr }) {
  const tT = T[lang] || T.en;
  const list = Array.isArray(certs) ? certs : [];
  const [error, setError] = React.useState('');

  const updateRow = (key, patch) => onChange(list.map(c => c._key === key ? { ...c, ...patch } : c));
  const removeRow = (key) => onChange(list.filter(c => c._key !== key));
  const addRow = () => {
    if (list.length >= CERT_MAX_COUNT) {
      setError(tT.certMaxReachedFn(CERT_MAX_COUNT));
      return;
    }
    setError('');
    onChange([...list, emptyCertRow()]);
  };

  const handlePickFile = (key, ev) => {
    setError('');
    const file = ev.target.files?.[0];
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') {
      setError(tT.certPdfOnly);
      ev.target.value = '';
      return;
    }
    if (file.size > CERT_MAX_BYTES) {
      setError(tT.certTooLarge);
      ev.target.value = '';
      return;
    }
    updateRow(key, { _pendingFile: file });
    ev.target.value = '';
  };

  return (
    <div style={{ marginTop: 14 }}>
      {list.length === 0 && (
        <p style={{ fontSize: 12, color: VF_C.ink30, marginBottom: 12, ...vfFont }}>{tT.certNoneYet}</p>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {list.map((cert) => {
          const isOther = String(cert.cert_type || '').toUpperCase() === 'OTHER';
          const hasFile = Boolean(cert._pendingFile || cert.cert_file_url);
          const fileLabel = cert._pendingFile
            ? `${cert._pendingFile.name} (${Math.round(cert._pendingFile.size / 1024)} KB)`
            : cert.cert_file_url ? tT.certUploaded : '';
          return (
            <div key={cert._key} style={{ padding: '14px 16px', border: `1px solid ${VF_C.ink10}`, borderRadius: 10, background: VF_C.cream, position: 'relative' }}>
              <button
                type="button"
                onClick={() => removeRow(cert._key)}
                style={{ position: 'absolute', top: 10, [isAr ? 'left' : 'right']: 10, background: 'none', border: 'none', fontSize: 18, color: VF_C.ink30, cursor: 'pointer', lineHeight: 1 }}
                title={tT.certRemoveBtn}
              >×</button>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px 18px' }}>
                <VfField label={tT.certTypeLabel}>
                  <select
                    className="vf-select"
                    value={cert.cert_type || ''}
                    onChange={e => updateRow(cert._key, { cert_type: e.target.value })}
                  >
                    <option value="">—</option>
                    {CERT_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
                  </select>
                </VfField>

                <VfField label={tT.certNameLabel}>
                  <input
                    className="vf-input"
                    value={cert.cert_label || ''}
                    onChange={e => updateRow(cert._key, { cert_label: e.target.value })}
                  />
                </VfField>

                <VfField label={tT.certIssuedDateLabel}>
                  <input
                    className="vf-input"
                    type="date"
                    value={cert.issued_date || ''}
                    onChange={e => updateRow(cert._key, { issued_date: e.target.value })}
                  />
                </VfField>

                <VfField label={tT.certExpiryDateLabel}>
                  <input
                    className="vf-input"
                    type="date"
                    value={cert.expiry_date || ''}
                    onChange={e => updateRow(cert._key, { expiry_date: e.target.value })}
                  />
                </VfField>
              </div>

              {isOther && (
                <p style={{ fontSize: 11, color: VF_C.ink30, marginTop: -4, marginBottom: 8, ...vfFont }}>{tT.certNameHint}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 12, padding: '6px 14px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 8, cursor: 'pointer', color: VF_C.ink60, ...vfFont }}>
                  {hasFile ? tT.certReplaceFile : tT.certUploadFile}
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={e => handlePickFile(cert._key, e)}
                  />
                </label>
                {fileLabel && (
                  <span style={{ fontSize: 11, color: VF_C.ink60, ...vfFont }}>{fileLabel}</span>
                )}
                {cert.cert_file_url && !cert._pendingFile && (
                  <a href={cert.cert_file_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: VF_C.ink60, textDecoration: 'underline', ...vfFont }}>{tT.certViewFile}</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p style={{ fontSize: 11, color: VF_C.amber, marginTop: 8, ...vfFont }}>{error}</p>
      )}

      {list.length < CERT_MAX_COUNT && (
        <button
          type="button"
          onClick={addRow}
          style={{ marginTop: 12, fontSize: 12, padding: '8px 16px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 8, cursor: 'pointer', color: VF_C.ink60, ...vfFont }}
        >
          {tT.certAddBtn}
        </button>
      )}
    </div>
  );
}

/* ─── Collapsible section card ─────────────────────────────────────────
   Native <details>/<summary> with React-controlled state so the parent
   can seed initial state from `defaultOpen`. After mount, the supplier
   controls open/close. */
function Section({ title, badge, defaultOpen, children, lang }) {
  const [open, setOpen] = React.useState(Boolean(defaultOpen));
  const isAr = lang === 'ar';
  return (
    <details
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
      style={{
        marginBottom: 14,
        background: VF_C.paper,
        border: `1px solid ${VF_C.ink10}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <summary style={{
        cursor: 'pointer',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        listStyle: 'none',
        userSelect: 'none',
        fontFamily: "'Tajawal', sans-serif",
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: VF_C.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: VF_C.ink30, transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>{isAr ? '◂' : '▸'}</span>
          {title}
        </span>
        {badge}
      </summary>
      <div style={{ padding: '0 20px 20px', borderTop: open ? `1px solid ${VF_C.ink05}` : 'none' }}>
        {children}
      </div>
    </details>
  );
}

// Pill badge shown next to section titles. `tone` ∈ {sage, ink, optional}.
function SectionBadge({ tone = 'optional', children, vfFont }) {
  const palette = tone === 'sage'
    ? { bg: VF_C.sageBg, br: VF_C.sageBr, fg: VF_C.sage }
    : tone === 'ink'
    ? { bg: VF_C.cream, br: VF_C.ink10, fg: VF_C.ink60 }
    : { bg: 'transparent', br: VF_C.ink10, fg: VF_C.ink30 };
  return (
    <span style={{
      fontSize: 10,
      padding: '4px 10px',
      borderRadius: 999,
      border: `1px solid ${palette.br}`,
      background: palette.bg,
      color: palette.fg,
      whiteSpace: 'nowrap',
      fontFamily: "'Tajawal', sans-serif",
      ...vfFont,
    }}>
      {children}
    </span>
  );
}

/* ─── CBM parser — extracts L×W×H (cm) from package_dimensions text. ── */
export function parseCbmFromDimensions(dimsStr) {
  if (!dimsStr) return null;
  const raw = String(dimsStr);
  // Three positive numbers separated by × x * — accept any combo.
  const m = raw.match(/(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const l = parseFloat(m[1]);
  const w = parseFloat(m[2]);
  const h = parseFloat(m[3]);
  if (![l, w, h].every(n => Number.isFinite(n) && n > 0)) return null;
  // Detect unit. Default to cm. mm/m supported.
  const lower = raw.toLowerCase();
  let factor = 1e-6; // cm³ → m³
  if (/\bmm\b/.test(lower)) factor = 1e-9;
  else if (/(^|[^a-z])m($|[^a-z])/.test(lower) && !/\bcm\b/.test(lower)) factor = 1; // bare "m"
  return Number((l * w * h * factor).toFixed(4));
}

/* ─── Product Form (defined outside to prevent remount on parent render) ─ */
export function ProductForm({
  data,
  setData,
  onSave,
  onCancel,
  onPreview,
  showPreviewAction = false,
  imgRef,
  vidRef,
  onImgChange,
  onVidChange,
  onRemoveImage,
  onRemoveVideo,
  uploadingImage,
  uploadingVideo,
  t,
  isAr,
  saving,
  usdRate,
  categories,
  saveLabel,
  lang,
  isEdit = false,
  certificationsCount = 0,
  // variant system
  variantData,
  setVariantData,
}) {
  const vfFont = { fontFamily: "'Tajawal', sans-serif" };
  const productCategories = (categories || []).filter(c => c.val !== 'all');
  const galleryImages = getProductGalleryImages(data);
  const placeholders = getProductFormPlaceholders(lang);
  const completenessItems = getProductCompletenessItems(data, lang, { certificationsCount });
  const completenessPct = getProductCompletenessScore(completenessItems);
  const tT = T[lang] || T.en;

  // Per-section required-fields status for the header badges.
  const sectionStatus = (sectionKeys) => {
    const required = completenessItems.filter(i => i.category === 'required' && sectionKeys.includes(i.key));
    if (!required.length) return null;
    return { done: required.filter(i => i.done).length, total: required.length };
  };
  const renderBadge = (sectionKeys) => {
    const st = sectionStatus(sectionKeys);
    if (!st) return <SectionBadge tone="optional" vfFont={vfFont}>{tT.sectionBadgeOptional}</SectionBadge>;
    const allDone = st.done === st.total;
    return (
      <SectionBadge tone={allDone ? 'sage' : 'ink'} vfFont={vfFont}>
        {allDone ? `✓ ${tT.sectionBadgeAllDone}` : tT.sectionBadgeProgress(st.done, st.total)}
      </SectionBadge>
    );
  };

  // Sections collapse by default when editing; expand by default when creating.
  const sectionDefaultOpen = !isEdit;

  // Per-category summary lines under the readiness card.
  const completenessByCategory = (() => {
    const cats = ['required', 'recommended', 'media', 'certs'];
    const labels = {
      required: tT.completenessRequired,
      recommended: tT.completenessRecommended,
      media: tT.completenessMedia,
      certs: tT.completenessCerts,
    };
    return cats.map(cat => {
      const list = completenessItems.filter(i => i.category === cat);
      if (!list.length) return null;
      return { key: cat, label: labels[cat], done: list.filter(i => i.done).length, total: list.length };
    }).filter(Boolean);
  })();

  // Country / Port "dropdown OR Other" wiring
  const countrySelectVal = data.country_of_origin || '';
  const portSelectVal    = data.port_of_loading || '';
  const showCountryOther = countrySelectVal === '__other__';
  const showPortOther    = portSelectVal === '__other__';

  const toggleIncoterm = (code) => setData(prev => {
    const cur = Array.isArray(prev.incoterms) ? prev.incoterms : [];
    const has = cur.includes(code);
    return { ...prev, incoterms: has ? cur.filter(c => c !== code) : [...cur, code] };
  });

  const calcCbm = () => {
    const cbm = parseCbmFromDimensions(data.package_dimensions);
    if (cbm === null) {
      const dims = String(data.package_dimensions || '').trim();
      // Use a single window.alert to keep the helper non-blocking and testable.
      // If the supplier has no dims, prompt for them; otherwise the format is wrong.
      window.alert(dims ? tT.cbmCalcParseFail : tT.cbmCalcMissingDims);
      return;
    }
    setData(prev => ({ ...prev, cbm: String(cbm) }));
  };

  return (
    <div style={{ background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, padding: '28px 32px', maxWidth: 760, borderRadius: 12 }}>
      <style>{VF_CSS}</style>

      {/* ── Publishing readiness (compact, weighted) ── */}
      <div style={{ marginBottom: 18, padding: '16px 18px', borderRadius: 12, border: `1px solid ${VF_C.ink10}`, background: VF_C.paper }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink60, textTransform: 'uppercase', margin: 0, ...vfFont }}>
            {tT.readinessTitle}
          </p>
          <span style={{ fontSize: 13, fontWeight: 600, color: VF_C.ink, ...vfFont }}>{completenessPct}%</span>
        </div>
        <div style={{ height: 1.5, background: VF_C.ink10, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${completenessPct}%`, height: '100%', background: VF_C.ink, transition: 'width 0.25s' }} />
        </div>
        <div style={{ display: 'grid', gap: 6 }}>
          {completenessByCategory.map(cat => {
            const allDone = cat.done === cat.total;
            return (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, color: VF_C.ink60, ...vfFont }}>{cat.label}</span>
                <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 999, border: '1px solid', borderColor: allDone ? VF_C.sageBr : VF_C.ink10, background: allDone ? VF_C.sageBg : 'transparent', color: allDone ? VF_C.sage : VF_C.ink30, whiteSpace: 'nowrap', ...vfFont }}>
                  {cat.done}/{cat.total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ════ Section 1 — Media ════ */}
      <Section
        title={tT.secMedia}
        badge={renderBadge([])}
        defaultOpen={sectionDefaultOpen}
        lang={lang}
      >
        <div style={{ marginTop: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', ...vfFont }}>{t.galleryImages}</p>
            <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{t.galleryHint}</p>
          </div>
          <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onImgChange} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {galleryImages.map((url, index) => (
              <div key={`${url}-${index}`} style={{ position: 'relative', height: 110, borderRadius: 8, overflow: 'hidden', border: `1px solid ${VF_C.ink10}`, background: VF_C.paper }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {index === 0 && (
                  <span style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 9, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', color: '#fff', letterSpacing: 0.5 }}>
                    {t.primaryImage}
                  </span>
                )}
                <button type="button" onClick={() => onRemoveImage?.(index)} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                  ×
                </button>
              </div>
            ))}
            {galleryImages.length < PRODUCT_GALLERY_LIMIT && (
              <div onClick={() => imgRef.current?.click()} style={{ height: 110, border: `1px dashed ${VF_C.ink10}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: VF_C.paper, transition: 'border-color 0.2s', flexDirection: 'column', gap: 4 }}
                onMouseEnter={e => e.currentTarget.style.borderColor = VF_C.ink30}
                onMouseLeave={e => e.currentTarget.style.borderColor = VF_C.ink10}>
                {uploadingImage
                  ? <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{t.uploadingImage}</p>
                  : <>
                      <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>+ {galleryImages.length === 0 ? t.uploadImage : t.addMoreImages}</p>
                      <p style={{ fontSize: 9, color: VF_C.ink30, opacity: 0.75 }}>{galleryImages.length}/{PRODUCT_GALLERY_LIMIT}</p>
                    </>}
              </div>
            )}
          </div>
          {galleryImages.length >= PRODUCT_GALLERY_LIMIT && <p style={{ fontSize: 10, color: VF_C.amber, marginTop: 8, ...vfFont }}>{t.maxImagesReached}</p>}
        </div>

        <div style={{ marginBottom: 4 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, marginBottom: 8, textTransform: 'uppercase', ...vfFont }}>{t.uploadVideo}</p>
          <input ref={vidRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onVidChange} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            <div onClick={() => !data.video_url && vidRef.current?.click()} style={{ height: 140, border: `1px dashed ${VF_C.ink10}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: data.video_url ? 'default' : 'pointer', overflow: 'hidden', background: VF_C.paper, transition: 'border-color 0.2s', flexDirection: 'column', gap: 4, position: 'relative' }}
              onMouseEnter={e => { if (!data.video_url) e.currentTarget.style.borderColor = VF_C.ink30; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = VF_C.ink10; }}>
              {uploadingVideo
                ? <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{t.uploadingVideo}</p>
                : data.video_url
                ? <>
                    <video src={data.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                    <button type="button" onClick={onRemoveVideo} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                      ×
                    </button>
                  </>
                : <>
                    <p style={{ fontSize: 9, color: VF_C.ink30, opacity: 0.7, ...vfFont }}>
                      {lang === 'zh' ? `${t.videoLimitHint}，${t.maxVideo}` : `${t.videoLimitHint} · ${t.maxVideo}`}
                    </p>
                  </>}
            </div>
          </div>
        </div>
      </Section>

      {/* ════ Section 2 — Basic Information ════ */}
      <Section
        title={tT.secBasicInfo}
        badge={renderBadge(['name_zh', 'name_en', 'desc_en'])}
        defaultOpen={sectionDefaultOpen}
        lang={lang}
      >
        <div className="form-grid" style={{ marginTop: 16, marginBottom: 8 }}>
          {[
            [t.nameZh, 'name_zh'], [t.nameEn, 'name_en'], [t.nameAr, 'name_ar'],
          ].map(([label, key]) => (
            <VfField key={key} label={label}>
              <input className="vf-input" placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
            </VfField>
          ))}
          <VfField label={t.category}>
            <select className="vf-select" value={data.category || 'other'} onChange={e => setData(prev => ({ ...prev, category: e.target.value }))}>
              {productCategories.map(cat => <option key={cat.val} value={cat.val}>{cat.label}</option>)}
            </select>
          </VfField>
        </div>

        <VfField label={tT.hsCodeLabel}>
          <input
            className="vf-input"
            placeholder={tT.hsCodePlaceholder}
            value={data.hs_code || ''}
            onChange={e => setData(prev => ({ ...prev, hs_code: e.target.value }))}
            dir="ltr"
          />
        </VfField>
        <HsCodeSuggester
          nameEn={data.name_en}
          category={data.category}
          description={data.desc_en}
          lang={lang}
          vfFont={vfFont}
          onPick={(code) => setData(prev => ({ ...prev, hs_code: code }))}
        />

        <p style={{ fontSize: 12, color: VF_C.ink30, margin: '4px 0 12px', ...vfFont }}>{t.descHint}</p>
        <VfField label={t.descEnLabel}>
          <textarea className="vf-input" rows={3} placeholder={placeholders.desc_en || ''} style={{ resize: 'vertical' }} value={data.desc_en || ''} onChange={e => setData(prev => ({ ...prev, desc_en: e.target.value }))} />
        </VfField>
        <VfField label={t.descLabel}>
          <textarea className="vf-input" rows={2} placeholder={placeholders.desc_ar || ''} style={{ resize: 'vertical', ...vfFont }} value={data.desc_ar || ''} onChange={e => setData(prev => ({ ...prev, desc_ar: e.target.value }))} />
        </VfField>
      </Section>

      {/* ════ Section 3 — Pricing & Shipping ════ */}
      <Section
        title={tT.secPricing}
        badge={renderBadge(['pricing', 'incoterms', 'port'])}
        defaultOpen={sectionDefaultOpen}
        lang={lang}
      >
        <div className="form-grid" style={{ marginTop: 16, marginBottom: 12 }}>
          <VfField label={t.moq}>
            <input
              className="vf-input"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              placeholder={placeholders.moq || ''}
              value={data.moq || ''}
              onChange={e => setData(prev => ({ ...prev, moq: e.target.value.replace(/[^0-9]/g, '') }))}
              dir="ltr"
            />
          </VfField>
          <VfField label={t.currency}>
            <select className="vf-select" value={data.currency || 'USD'} onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))}>
              {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
            </select>
          </VfField>
          <VfField label={tT.priceValidityLabel}>
            <select
              className="vf-select"
              value={data.price_validity_days || 30}
              onChange={e => setData(prev => ({ ...prev, price_validity_days: parseInt(e.target.value, 10) }))}
            >
              <option value={30}>{tT.priceValidity30}</option>
              <option value={60}>{tT.priceValidity60}</option>
              <option value={90}>{tT.priceValidity90}</option>
            </select>
          </VfField>
        </div>

        <TieredPricingTable
          tiers={data.tiers}
          moq={data.moq}
          currency={data.currency || 'USD'}
          usdRate={usdRate}
          onChange={(nextTiers) => setData(prev => ({ ...prev, tiers: nextTiers }))}
          lang={lang}
          vfFont={vfFont}
        />

        {/* Incoterms */}
        <div style={{ marginTop: 4, marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 4, ...vfFont }}>{tT.incotermsLabel}</p>
          <p style={{ fontSize: 11, color: VF_C.ink30, marginBottom: 10, ...vfFont }}>{tT.incotermsHint}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {INCOTERM_OPTIONS.map(code => {
              const checked = Array.isArray(data.incoterms) && data.incoterms.includes(code);
              const isDdp = code === 'DDP';
              return (
                <label
                  key={code}
                  title={isDdp ? tT.ddpTooltip : ''}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: `1px solid ${checked ? VF_C.sageBr : VF_C.ink10}`,
                    background: checked ? VF_C.sageBg : 'transparent',
                    color: checked ? VF_C.sage : VF_C.ink60,
                    cursor: 'pointer',
                    fontSize: 13,
                    ...vfFont,
                  }}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleIncoterm(code)} style={{ accentColor: VF_C.sage, cursor: 'pointer' }} />
                  <span>{tT[`incoterm${code.charAt(0)}${code.slice(1).toLowerCase()}`] || code}</span>
                  {isDdp && (
                    <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 2 }}>ⓘ</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Port of Loading */}
        <div className="form-grid" style={{ marginBottom: showPortOther ? 6 : 16 }}>
          <VfField label={tT.portOfLoadingLabel}>
            <select
              className="vf-select"
              value={portSelectVal}
              onChange={e => setData(prev => ({ ...prev, port_of_loading: e.target.value }))}
            >
              <option value="">—</option>
              {PORT_OF_LOADING_OPTIONS.map(p => (
                <option key={p} value={p}>{tT[`port${p}`] || p}</option>
              ))}
              <option value="__other__">{tT.portOther}</option>
            </select>
          </VfField>
        </div>
        {showPortOther && (
          <VfField label={tT.portOtherPlaceholder}>
            <input
              className="vf-input"
              placeholder={tT.portOtherPlaceholder}
              value={data.port_of_loading_other || ''}
              onChange={e => setData(prev => ({ ...prev, port_of_loading_other: e.target.value }))}
            />
          </VfField>
        )}
      </Section>

      {/* ════ Section 4 — Specs & Packaging ════ */}
      <Section
        title={tT.secSpecs}
        badge={renderBadge([])}
        defaultOpen={sectionDefaultOpen}
        lang={lang}
      >
        {/* Existing spec_* + variant-system unit_weight_kg/package_dimensions */}
        <div style={{ marginTop: 16, padding: '14px 16px', background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, borderRadius: 10 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, marginBottom: 12, textTransform: 'uppercase', ...vfFont }}>{t.specsTitle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px' }}>
            {[
              [t.specMaterial, 'spec_material'],
              [t.specDimensions, 'spec_dimensions'],
              [t.specWeight, 'spec_unit_weight'],
              [t.specColors, 'spec_color_options'],
              [t.specPackaging, 'spec_packaging_details'],
              [t.specCustomization, 'spec_customization'],
              [t.specLeadTime, 'spec_lead_time_days', 'number'],
              [tT.specUnitWeightKg, 'unit_weight_kg', 'number'],
              [tT.specCartonDimensions, 'package_dimensions'],
            ].map(([label, key, type]) => (
              <VfField key={key} label={label}>
                <input className="vf-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
              </VfField>
            ))}
          </div>
        </div>

        {/* Carton math: units + cbm + weights */}
        <div style={{ marginTop: 14 }}>
          <div className="form-grid">
            <VfField label={tT.unitsPerCartonLabel}>
              <input
                className="vf-input"
                type="number" min="1" step="1" inputMode="numeric"
                value={data.units_per_carton || ''}
                onChange={e => setData(prev => ({ ...prev, units_per_carton: e.target.value.replace(/[^0-9]/g, '') }))}
                dir="ltr"
              />
            </VfField>
            <VfField label={tT.cbmLabel}>
              <input
                className="vf-input"
                type="number" min="0" step="0.01" inputMode="decimal"
                value={data.cbm || ''}
                onChange={e => setData(prev => ({ ...prev, cbm: e.target.value }))}
                dir="ltr"
              />
            </VfField>
            <VfField label={tT.grossWeightLabel}>
              <input
                className="vf-input"
                type="number" min="0" step="0.01" inputMode="decimal"
                value={data.gross_weight_kg || ''}
                onChange={e => setData(prev => ({ ...prev, gross_weight_kg: e.target.value }))}
                dir="ltr"
              />
            </VfField>
            <VfField label={tT.netWeightLabel}>
              <input
                className="vf-input"
                type="number" min="0" step="0.01" inputMode="decimal"
                value={data.net_weight_kg || ''}
                onChange={e => setData(prev => ({ ...prev, net_weight_kg: e.target.value }))}
                dir="ltr"
              />
            </VfField>
          </div>
          <button
            type="button"
            onClick={calcCbm}
            style={{ marginTop: 4, fontSize: 12, padding: '6px 14px', background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, borderRadius: 8, cursor: 'pointer', color: VF_C.ink60, ...vfFont }}
          >
            {tT.cbmCalcBtn}
          </button>
        </div>

        {/* Production lead time */}
        <div style={{ marginTop: 18 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 8, ...vfFont }}>{tT.leadTimeSection}</p>
          <div className="form-grid">
            <VfField label={tT.leadTimeMin}>
              <input
                className="vf-input"
                type="number" min="0" step="1" inputMode="numeric"
                value={data.lead_time_min_days || ''}
                onChange={e => setData(prev => ({ ...prev, lead_time_min_days: e.target.value.replace(/[^0-9]/g, '') }))}
                dir="ltr"
              />
            </VfField>
            <VfField label={tT.leadTimeMax}>
              <input
                className="vf-input"
                type="number" min="0" step="1" inputMode="numeric"
                value={data.lead_time_max_days || ''}
                onChange={e => setData(prev => ({ ...prev, lead_time_max_days: e.target.value.replace(/[^0-9]/g, '') }))}
                dir="ltr"
              />
            </VfField>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 4, cursor: 'pointer', ...vfFont }}>
            <input
              type="checkbox"
              checked={Boolean(data.lead_time_negotiable)}
              onChange={e => setData(prev => ({ ...prev, lead_time_negotiable: e.target.checked }))}
              style={{ accentColor: VF_C.sage, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: VF_C.ink60 }}>{tT.leadTimeNegotiable}</span>
          </label>
        </div>

        {/* Country of Origin */}
        <div className="form-grid" style={{ marginTop: 14, marginBottom: showCountryOther ? 6 : 0 }}>
          <VfField label={tT.countryOfOriginLabel}>
            <select
              className="vf-select"
              value={countrySelectVal || 'China'}
              onChange={e => setData(prev => ({ ...prev, country_of_origin: e.target.value }))}
            >
              {COUNTRY_OF_ORIGIN_OPTIONS.map(c => (
                <option key={c} value={c}>{tT[`country${c.replace(/[^A-Za-z]/g, '')}`] || c}</option>
              ))}
              <option value="__other__">{tT.countryOther}</option>
            </select>
          </VfField>
        </div>
        {showCountryOther && (
          <VfField label={tT.countryOtherPlaceholder}>
            <input
              className="vf-input"
              placeholder={tT.countryOtherPlaceholder}
              value={data.country_of_origin_other || ''}
              onChange={e => setData(prev => ({ ...prev, country_of_origin_other: e.target.value }))}
            />
          </VfField>
        )}
      </Section>

      {/* ════ Section 5 — Certifications & Compliance ════ */}
      <Section
        title={tT.secCertifications}
        badge={renderBadge([])}
        defaultOpen={sectionDefaultOpen}
        lang={lang}
      >
        <CertificationsUploader
          certs={data.certifications}
          onChange={(nextCerts) => setData(prev => ({ ...prev, certifications: nextCerts }))}
          lang={lang}
          vfFont={vfFont}
          isAr={isAr}
        />
      </Section>

      {/* ════ Section 6 — Samples & Customization ════ */}
      <Section
        title={tT.secSamples}
        badge={renderBadge([])}
        defaultOpen={sectionDefaultOpen}
        lang={lang}
      >
        {/* Sample availability */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: data.sample_available ? 14 : 0 }}>
            <input type="checkbox" id="sample_toggle" checked={data.sample_available || false} onChange={e => setData(prev => ({ ...prev, sample_available: e.target.checked }))} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: VF_C.ink }} />
            <label htmlFor="sample_toggle" style={{ fontSize: 14, fontWeight: 500, color: VF_C.ink, cursor: 'pointer', ...vfFont }}>{t.sampleAvailable}</label>
          </div>
          {data.sample_available && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px', animation: 'fadeIn 0.25s ease' }}>
              {[
                [t.samplePrice, 'sample_price', 'number'],
                [t.sampleShipping, 'sample_shipping', 'number'],
                [t.sampleMaxQty, 'sample_max_qty', 'number'],
                [t.sampleNote, 'sample_note'],
                [tT.sampleFreeFromQtyLabel, 'sample_free_from_qty', 'number'],
              ].map(([label, key, type]) => (
                <VfField key={key} label={label}>
                  <input className="vf-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
                </VfField>
              ))}
            </div>
          )}
        </div>

        {/* OEM / ODM toggles */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${VF_C.ink05}` }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
            {[
              ['oem_available', tT.oemAvailableLabel],
              ['odm_available', tT.odmAvailableLabel],
            ].map(([key, label]) => {
              const checked = Boolean(data[key]);
              return (
                <label key={key} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 999,
                  border: `1px solid ${checked ? VF_C.sageBr : VF_C.ink10}`,
                  background: checked ? VF_C.sageBg : 'transparent',
                  color: checked ? VF_C.sage : VF_C.ink60,
                  cursor: 'pointer', fontSize: 13, ...vfFont,
                }}>
                  <input type="checkbox" checked={checked} onChange={e => setData(prev => ({ ...prev, [key]: e.target.checked }))} style={{ accentColor: VF_C.sage, cursor: 'pointer' }} />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: VF_C.ink30, marginBottom: 12, ...vfFont }}>{tT.oemHint}</p>

          {(data.oem_available || data.odm_available) && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 8, ...vfFont }}>{tT.oemLeadTimeSection}</p>
              <div className="form-grid">
                <VfField label={tT.oemLeadTimeMin}>
                  <input
                    className="vf-input"
                    type="number" min="0" step="1" inputMode="numeric"
                    value={data.oem_lead_time_min_days || ''}
                    onChange={e => setData(prev => ({ ...prev, oem_lead_time_min_days: e.target.value.replace(/[^0-9]/g, '') }))}
                    dir="ltr"
                  />
                </VfField>
                <VfField label={tT.oemLeadTimeMax}>
                  <input
                    className="vf-input"
                    type="number" min="0" step="1" inputMode="numeric"
                    value={data.oem_lead_time_max_days || ''}
                    onChange={e => setData(prev => ({ ...prev, oem_lead_time_max_days: e.target.value.replace(/[^0-9]/g, '') }))}
                    dir="ltr"
                  />
                </VfField>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── Variants toggle (outside the 6 sections — special-case feature flag) ── */}
      <div style={{ marginTop: 8, padding: '18px 20px', background: VF_C.paper, border: `1px solid ${data.has_variants ? VF_C.sageBr : VF_C.ink10}`, borderRadius: 12 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={data.has_variants || false}
            onChange={e => setData(prev => ({ ...prev, has_variants: e.target.checked }))}
            style={{ width: 16, height: 16, marginTop: 2, accentColor: VF_C.sage, cursor: 'pointer', flexShrink: 0 }}
          />
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: VF_C.ink, ...vfFont }}>{tT.variantToggleTitle}</p>
            <p style={{ fontSize: 12, color: VF_C.ink60, marginTop: 3, ...vfFont }}>{tT.variantToggleHint}</p>
          </div>
        </label>
      </div>

      {data.has_variants && variantData && setVariantData && (
        <div style={{ marginTop: 14 }}>
          <VariantBuilder
            lang={lang}
            data={variantData}
            onChange={setVariantData}
            productNameEn={data.name_en}
            basePrice={data.tiers?.[0]?.unit_price || ''}
            baseMoq={data.moq}
          />
        </div>
      )}

      {!data.has_variants && (
        <div style={{ marginTop: 14, padding: '18px 20px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', ...vfFont }}>{tT.attributesTitle}</p>
            {(data.attributes || []).length < 20 && (
              <button type="button"
                onClick={() => setData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { name: '', values: [] }] }))}
                style={{ fontSize: 12, color: VF_C.ink60, background: 'none', border: `1px solid ${VF_C.ink10}`, borderRadius: 10, padding: '5px 14px', cursor: 'pointer', ...vfFont }}>
                {tT.attributesAddBtn}
              </button>
            )}
          </div>
          {(data.attributes || []).length === 0 && (
            <p style={{ fontSize: 12, color: VF_C.ink30, ...vfFont }}>{tT.attributesEmptyHint}</p>
          )}
          {(data.attributes || []).length > 0 && (
            <div style={{ display: 'grid', gap: 12 }}>
              {(data.attributes || []).map((attr, attrIdx) => (
                <AttributeRow
                  key={attrIdx}
                  attr={attr}
                  isAr={isAr}
                  lang={lang}
                  onChange={(updated) => setData(prev => {
                    const attrs = [...(prev.attributes || [])];
                    attrs[attrIdx] = updated;
                    return { ...prev, attributes: attrs };
                  })}
                  onRemove={() => setData(prev => {
                    const attrs = [...(prev.attributes || [])];
                    attrs.splice(attrIdx, 1);
                    return { ...prev, attributes: attrs };
                  })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        {showPreviewAction
          ? <button onClick={onPreview} className="vf-btn-ink" style={{ display: 'inline-block', width: 'auto', padding: '13px 28px', fontSize: 14 }}>{t.continueToPreview}</button>
          : <button onClick={onSave} disabled={saving} className="vf-btn-ink" style={{ display: 'inline-block', width: 'auto', padding: '13px 28px', fontSize: 14 }}>{saving ? t.saving : (saveLabel || t.save)}</button>}
        <button onClick={onCancel} className="vf-btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '11px 20px', fontSize: 14 }}>{t.cancel}</button>
      </div>
    </div>
  );
}

export function ProductPreviewPanel({ product, onPublish, onBack, t, isAr, saving, lang, certificationsCount = 0 }) {
  const galleryImages = getProductGalleryImages(product);
  const specs = buildProductSpecs(product);
  const tT = T[lang] || T.en;
  const previewTiers = padToThree(product.tiers);
  const tierUnitPrices = previewTiers
    .map(row => parseFloat(row.unit_price))
    .filter(p => Number.isFinite(p) && p > 0);
  const tierLow = tierUnitPrices.length ? Math.min(...tierUnitPrices) : null;
  const tierHigh = tierUnitPrices.length ? Math.max(...tierUnitPrices) : null;
  const previewCurrency = product.currency || 'USD';
  const previewMoqStr = String(product.moq || '').trim();
  const displayName = lang === 'zh'
    ? product.name_zh || product.name_en || product.name_ar
    : lang === 'ar'
    ? product.name_ar || product.name_en || product.name_zh
    : product.name_en || product.name_ar || product.name_zh;
  const vfFont = { fontFamily: "'Tajawal', sans-serif" };
  const completenessItems = getProductCompletenessItems(product, lang, { certificationsCount });
  const completenessPct = getProductCompletenessScore(completenessItems);
  const completenessDone = completenessItems.filter(item => item.done).length;

  // Resolve dropdown-or-Other values for display
  const previewCountry = (() => {
    const sel = String(product.country_of_origin || '').trim();
    if (sel === '__other__') return String(product.country_of_origin_other || '').trim() || null;
    return sel || null;
  })();
  const previewPort = (() => {
    const sel = String(product.port_of_loading || '').trim();
    if (sel === '__other__') return String(product.port_of_loading_other || '').trim() || null;
    return sel || null;
  })();
  const previewIncoterms = Array.isArray(product.incoterms) ? product.incoterms.filter(x => INCOTERM_OPTIONS.includes(x)) : [];

  const logisticsRows = [
    { label: tT.hsCodeLabel,            value: product.hs_code || null },
    { label: tT.countryOfOriginLabel,   value: previewCountry ? (tT[`country${previewCountry.replace(/[^A-Za-z]/g, '')}`] || previewCountry) : null },
    { label: tT.portOfLoadingLabel.replace(' *', ''),
      value: previewPort ? (tT[`port${previewPort}`] || previewPort) : null },
    { label: tT.priceValidityLabel,
      value: product.price_validity_days ? `${product.price_validity_days} ${lang === 'ar' ? 'يومًا' : lang === 'zh' ? '天' : 'days'}` : null },
    { label: tT.unitsPerCartonLabel,    value: product.units_per_carton || null },
    { label: tT.cbmLabel,               value: product.cbm || null },
    { label: tT.grossWeightLabel,       value: product.gross_weight_kg || null },
    { label: tT.netWeightLabel,         value: product.net_weight_kg || null },
    { label: tT.leadTimeSection,
      value: (product.lead_time_min_days || product.lead_time_max_days)
        ? `${product.lead_time_min_days || '—'} – ${product.lead_time_max_days || '—'} ${lang === 'ar' ? 'يوم' : lang === 'zh' ? '天' : 'days'}${product.lead_time_negotiable ? ` (${tT.leadTimeNegotiable})` : ''}`
        : null },
  ].filter(r => r.value !== null && r.value !== '' && r.value !== undefined);

  const oemBadges = [
    product.oem_available ? tT.oemAvailableLabel : null,
    product.odm_available ? tT.odmAvailableLabel : null,
  ].filter(Boolean);

  const providedNames = [
    { key: 'zh', label: tT.previewNameZhLabel, value: product.name_zh },
    { key: 'en', label: tT.previewNameEnLabel, value: product.name_en },
    { key: 'ar', label: tT.previewNameArLabel, value: product.name_ar },
  ].filter((item) => item.value);

  return (
    <div style={{ background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, padding: '28px 32px', maxWidth: 760, borderRadius: 12 }}>
      <style>{VF_CSS}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 8, ...vfFont }}>{t.previewStep}</p>
          <h3 style={{ fontSize: 24, fontWeight: 400, color: VF_C.ink, ...vfFont }}>{displayName || '—'}</h3>
        </div>
        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink30, letterSpacing: 1, ...vfFont }}>{t.previewBadge}</span>
      </div>

      <p style={{ fontSize: 12, color: VF_C.ink30, marginBottom: 20, lineHeight: 1.7, ...vfFont }}>{t.previewNote}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '16px 18px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: VF_C.ink60, marginBottom: 10, ...vfFont }}>
            {tT.previewListingReadiness}
          </p>
          <p style={{ fontSize: 13, color: VF_C.ink, marginBottom: 10, ...vfFont }}>
            {tT.previewReadinessSummaryFn(completenessPct, completenessDone, completenessItems.length)}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>
              {tT.previewImageCountFn(galleryImages.length)}
            </span>
            {product.video_url && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>Video</span>}
            {product.sample_available && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}`, color: VF_C.sage, ...vfFont }}>{tT.previewSamplesEnabled}</span>}
            {specs.length > 0 && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>{tT.previewSpecsCountFn(specs.length)}</span>}
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: VF_C.ink30, marginBottom: 10, ...vfFont }}>
            {tT.previewDisplayedNames}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {providedNames.map((item) => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{item.label}</span>
                <span style={{ fontSize: 12, color: VF_C.ink, textAlign: isAr ? 'left' : 'right', ...vfFont }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div>
          {galleryImages.length > 0 ? (
            <>
              <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: `1px solid ${VF_C.ink10}`, background: VF_C.paper, marginBottom: 12 }}>
                <img src={galleryImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {galleryImages.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}>
                  {galleryImages.slice(1).map((url, index) => (
                    <div key={`${url}-${index}`} style={{ height: 72, borderRadius: 8, overflow: 'hidden', border: `1px solid ${VF_C.ink10}` }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: 220, borderRadius: 12, border: `1px dashed ${VF_C.ink10}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: VF_C.ink30, background: VF_C.paper, ...vfFont }}>{t.previewEmptyMedia}</div>
          )}
        </div>

        <div>
          <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, marginBottom: 14 }}>
            <p style={{ fontSize: 26, fontWeight: 300, color: VF_C.ink, marginBottom: 8, ...vfFont }}>
              {tierLow !== null
                ? (tierLow === tierHigh
                    ? `${tierLow.toFixed(2)} `
                    : `${tierLow.toFixed(2)}–${tierHigh.toFixed(2)} `)
                : '— '}
              <span style={{ fontSize: 13, color: VF_C.ink30 }}>{previewCurrency}</span>
            </p>
            <p style={{ fontSize: 12, color: VF_C.ink60, ...vfFont }}>MOQ: {previewMoqStr || '—'}</p>
            {product.category && <p style={{ fontSize: 12, color: VF_C.ink60, marginTop: 6, ...vfFont }}>{t.category}: {product.category}</p>}

            {tierUnitPrices.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${VF_C.ink10}` }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 8, ...vfFont }}>
                  {tT.tieredPricingTitle.replace(' *', '')}
                </p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, ...vfFont }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${VF_C.ink10}` }}>
                      <th style={{ textAlign: isAr ? 'right' : 'left', padding: '6px 4px', color: VF_C.ink30, fontWeight: 400, fontSize: 11 }}>{tT.tierColMinQty}</th>
                      <th style={{ textAlign: isAr ? 'right' : 'left', padding: '6px 4px', color: VF_C.ink30, fontWeight: 400, fontSize: 11 }}>{tT.tierColMaxQty}</th>
                      <th style={{ textAlign: isAr ? 'left' : 'right', padding: '6px 4px', color: VF_C.ink30, fontWeight: 400, fontSize: 11 }}>{tT.tierColUnitPrice}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewTiers.map((row, idx) => {
                      const qtyFrom = row.qty_from || (idx === 0 ? previewMoqStr : '');
                      const qtyTo = row.qty_to;
                      const isLast = idx === previewTiers.length - 1;
                      const price = parseFloat(row.unit_price);
                      return (
                        <tr key={row._key || idx} style={{ borderBottom: `1px solid ${VF_C.ink05}` }}>
                          <td style={{ padding: '6px 4px', color: VF_C.ink, fontSize: 12 }}>{qtyFrom || '—'}</td>
                          <td style={{ padding: '6px 4px', color: VF_C.ink, fontSize: 12 }}>
                            {qtyTo || (isLast ? tT.tierAndAbove : '—')}
                          </td>
                          <td style={{ padding: '6px 4px', color: VF_C.ink, fontSize: 12, textAlign: isAr ? 'left' : 'right' }}>
                            {Number.isFinite(price) && price > 0 ? `${price.toFixed(2)} ${previewCurrency}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {product.video_url && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${VF_C.ink10}`, background: VF_C.ink, marginBottom: 14 }}>
              <video src={product.video_url} controls style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
            </div>
          )}

          {specs.length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 12, ...vfFont }}>{t.specsTitle}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {specs.map(spec => (
                  <div key={spec.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: VF_C.ink30, textTransform: 'capitalize', ...vfFont }}>{spec.label}</span>
                    <span style={{ fontSize: 13, color: VF_C.ink, textAlign: isAr ? 'left' : 'right', ...vfFont }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(product.attributes) && product.attributes.filter(a => a.name && a.values?.length).length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, marginTop: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 12, ...vfFont }}>
                {tT.previewCustomAttributes}
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {product.attributes.filter(a => a.name && a.values?.length).map((attr, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: VF_C.ink30, flexShrink: 0, ...vfFont }}>{attr.name}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                      {attr.values.map((val, j) => (
                        <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>{val}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Logistics block ── */}
      {(logisticsRows.length > 0 || previewIncoterms.length > 0) && (
        <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 12, ...vfFont }}>
            {tT.secPricing}
          </p>
          {previewIncoterms.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {previewIncoterms.map(code => (
                <span key={code} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>{code}</span>
              ))}
            </div>
          )}
          {logisticsRows.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px 24px' }}>
              {logisticsRows.map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: VF_C.ink, textAlign: isAr ? 'left' : 'right', ...vfFont }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Compliance block ── */}
      {(oemBadges.length > 0 || product.hs_code || certificationsCount > 0) && (
        <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, marginBottom: 16 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 12, ...vfFont }}>
            {tT.secCertifications}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: oemBadges.length > 0 ? 8 : 0 }}>
            {certificationsCount > 0 && (
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}`, color: VF_C.sage, ...vfFont }}>
                {certificationsCount} {tT.completenessCerts.split('(')[0].trim()}
              </span>
            )}
          </div>
          {oemBadges.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {oemBadges.map((label, i) => (
                <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>{label}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {product.desc_en && <p style={{ fontSize: 14, lineHeight: 1.8, color: VF_C.ink60, marginBottom: product.desc_ar ? 12 : 24, ...vfFont }}>{product.desc_en}</p>}
      {product.desc_ar && <p style={{ fontSize: 14, lineHeight: 1.8, color: VF_C.ink60, marginBottom: 24, ...vfFont }}>{product.desc_ar}</p>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onPublish} disabled={saving} className="vf-btn-ink" style={{ display: 'inline-block', width: 'auto', padding: '13px 28px', fontSize: 14 }}>{saving ? t.saving : t.publishNow}</button>
        <button onClick={onBack} className="vf-btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '11px 20px', fontSize: 14 }}>{t.backToEdit}</button>
      </div>
    </div>
  );
}
