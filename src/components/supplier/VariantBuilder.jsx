/**
 * VariantBuilder — Phase 2 of the Product Variants System
 *
 * Manages: options → values → variant matrix → tiered pricing → shipping
 *
 * Language rule: labels render in `lang` (zh/en/ar).
 * Trilingual option/value names are entered once; ZH is required.
 * Auto-translate button fills EN + AR from ZH via the existing AI translation.
 */

import React, { useState, useRef } from 'react';
import { VF_C } from './VerificationFormUI';
import { translateTextToAllLanguages } from '../../lib/requestTranslation';

// ── tiny id for React keys (not persisted to DB) ─────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);

// ── Cartesian product ─────────────────────────────────────────────────────────
function cartesian(arrays) {
  if (!arrays.length) return [];
  return arrays.reduce(
    (acc, arr) => acc.flatMap(x => arr.map(y => [...x, y])),
    [[]]
  );
}

// ── variant identity key from its option-value combo ─────────────────────────
function variantKey(combo) {
  return combo.map(c => `${c.optionKey}:${c.valueKey}`).join('|');
}

// ── auto-generate SKU from product name + value EN initials ──────────────────
function autoSku(productNameEn, combo, options) {
  const prefix = (productNameEn || 'PROD')
    .split(/\s+/)
    .map(w => (w[0] || '').toUpperCase())
    .join('')
    .slice(0, 5) || 'PROD';

  const parts = combo.map(({ optionKey, valueKey }) => {
    const opt = options.find(o => o._key === optionKey);
    const val = opt?.values.find(v => v._key === valueKey);
    const label = (val?.value_en || val?.value_zh || '').trim();
    return label
      .split(/[\s\-_]+/)
      .map(w => (w[0] || '').toUpperCase())
      .join('')
      .slice(0, 3) || 'X';
  });

  return [prefix, ...parts].join('-');
}

// ── re-generate variant rows when options change ──────────────────────────────
// Preserves existing variant data (price, moq, etc.) by matching key.
export function regenerateVariants(options, existingVariants) {
  const activeOptions = options.filter(o => o.values.length > 0);
  if (!activeOptions.length) return [];

  const axes = activeOptions.map(o =>
    o.values.map(v => ({ optionKey: o._key, valueKey: v._key }))
  );
  const combos = cartesian(axes);

  const existingMap = {};
  for (const v of (existingVariants || [])) existingMap[v._key] = v;

  return combos.map(combo => {
    const key = variantKey(combo);
    const prev = existingMap[key];
    return prev
      ? { ...prev, _key: key, combo }
      : { _key: key, combo, sku: '', price: '', moq: '', stock: '', lead_time_days: '', image_url: null, is_active: true };
  });
}

// ── empty data factories ──────────────────────────────────────────────────────
const emptyOption = (overrides = {}) => ({
  _key: uid(),
  name_zh: overrides.zh || '',
  name_en: overrides.en || '',
  name_ar: overrides.ar || '',
  input_type: overrides.type || 'select',
  values: [],
});

const emptyValue = () => ({
  _key: uid(),
  value_zh: '',
  value_en: '',
  value_ar: '',
  color_hex: '#4A90D9',
  image_url: null,
});

export const emptyVariantData = () => ({
  options: [],
  variants: [],
  tiers: [],
  shipping: [
    { _key: 'sea',     method: 'sea',     is_available: false, lead_time_min_days: '', lead_time_max_days: '', cost_per_unit_usd: '' },
    { _key: 'air',     method: 'air',     is_available: false, lead_time_min_days: '', lead_time_max_days: '', cost_per_unit_usd: '' },
    { _key: 'express', method: 'express', is_available: false, lead_time_min_days: '', lead_time_max_days: '', cost_per_unit_usd: '' },
    { _key: 'land',    method: 'land',    is_available: false, lead_time_min_days: '', lead_time_max_days: '', cost_per_unit_usd: '' },
  ],
});

// ── label tables ──────────────────────────────────────────────────────────────
const L = {
  zh: {
    addOption: '+ 添加选项',
    quickAdd: '快速添加：',
    presets: [
      { label: '颜色', type: 'color_swatch', zh: '颜色', en: 'Color', ar: 'اللون' },
      { label: '尺寸', type: 'size_chart',   zh: '尺寸', en: 'Size',  ar: 'الحجم' },
      { label: '材质', type: 'select',        zh: '材质', en: 'Material', ar: 'الخامة' },
      { label: '容量', type: 'select',        zh: '容量', en: 'Capacity', ar: 'السعة' },
      { label: '电压', type: 'select',        zh: '电压', en: 'Voltage',  ar: 'الجهد' },
      { label: '接口', type: 'select',        zh: '接口类型', en: 'Connector', ar: 'نوع التوصيل' },
    ],
    nameZh: '中文名称（必填）', nameEn: '英文名称', nameAr: '阿拉伯语名称',
    translate: '自动翻译 →', translating: '翻译中…',
    inputType: '选择器类型',
    types: { select: '按钮选择', color_swatch: '颜色色板', size_chart: '尺码表', text: '自定义文本' },
    addValue: '+ 添加值', valuePh: '输入，按 Enter 确认',
    colorCode: '颜色代码 (#hex)', deleteOpt: '删除选项',
    up: '↑', down: '↓', removeVal: '×',
    matrixTitle: '规格矩阵',
    noVariants: '请先添加至少一个选项并填写值，系统将自动生成规格组合。',
    sku: 'SKU', price: '价格 (USD)', moq: '最小起订量', stock: '库存（空=不限）',
    leadTime: '交期（天）', active: '启用',
    bulkLabel: '批量操作：',
    bulkPricePh: '统一价格', bulkMoqPh: '统一起订量', copyFirst: '复制第一行', apply: '应用',
    summary: (n, lo, hi, stk, mto) =>
      `${n} 个规格 · $${lo}–$${hi} · 库存 ${stk}${mto ? ` + ${mto} 按需生产` : ''}`,
    tieredTitle: '阶梯定价', tieredHint: '按数量给折扣，吸引批量采购。',
    enableTiers: '启用阶梯定价', addTier: '+ 添加价格阶梯',
    qtyFrom: '起始数量', qtyTo: '截止数量（空=无上限）', unitPrice: '单价 (USD)',
    discount: '折扣', removeTier: '删除',
    shipTitle: '运输方式', shipHint: '请选择此产品提供的运输方式。',
    methods: { sea: '海运', air: '空运', express: '快递 (DHL/FedEx)', land: '陆运' },
    minDays: '最短时效（天）', maxDays: '最长时效（天）', costUsd: '运费/件 (USD)',
    weightTitle: '包装信息',
    unitWeight: '单件重量（kg）', packageDims: '外箱尺寸（如 15×10×5 cm）',
    sampleFreeFrom: '免费样品起订量门槛（可选）',
    sampleFreeHint: '买家承诺达到此数量后可获免费样品',
    optionLabel: (i) => `选项 ${i + 1}`,
    variantLabel: (combo, options) =>
      combo.map(({ optionKey, valueKey }) => {
        const opt = options.find(o => o._key === optionKey);
        const val = opt?.values.find(v => v._key === valueKey);
        return val?.value_zh || val?.value_en || '?';
      }).join(' / '),
  },
  en: {
    addOption: '+ Add Option',
    quickAdd: 'Quick add: ',
    presets: [
      { label: 'Color',     type: 'color_swatch', zh: '颜色', en: 'Color',     ar: 'اللون' },
      { label: 'Size',      type: 'size_chart',   zh: '尺寸', en: 'Size',      ar: 'الحجم' },
      { label: 'Material',  type: 'select',        zh: '材质', en: 'Material',  ar: 'الخامة' },
      { label: 'Capacity',  type: 'select',        zh: '容量', en: 'Capacity',  ar: 'السعة' },
      { label: 'Voltage',   type: 'select',        zh: '电压', en: 'Voltage',   ar: 'الجهد' },
      { label: 'Connector', type: 'select',        zh: '接口类型', en: 'Connector', ar: 'نوع التوصيل' },
    ],
    nameZh: 'Chinese name (required)', nameEn: 'English name', nameAr: 'Arabic name',
    translate: 'Auto-translate →', translating: 'Translating…',
    inputType: 'Selector type',
    types: { select: 'Pill select', color_swatch: 'Color swatch', size_chart: 'Size chart', text: 'Text input' },
    addValue: '+ Add value', valuePh: 'Type a value, press Enter',
    colorCode: 'Color (#hex)', deleteOpt: 'Delete option',
    up: '↑', down: '↓', removeVal: '×',
    matrixTitle: 'Variant Matrix',
    noVariants: 'Add at least one option with values to auto-generate the variant grid.',
    sku: 'SKU', price: 'Price (USD)', moq: 'MOQ', stock: 'Stock (blank = ∞)',
    leadTime: 'Lead time (days)', active: 'Active',
    bulkLabel: 'Bulk: ',
    bulkPricePh: 'Set price for all', bulkMoqPh: 'Set MOQ for all', copyFirst: 'Copy row 1', apply: 'Apply',
    summary: (n, lo, hi, stk, mto) =>
      `${n} variants · $${lo}–$${hi} · stock ${stk}${mto ? ` + ${mto} made-to-order` : ''}`,
    tieredTitle: 'Tiered Pricing', tieredHint: 'Lower prices at higher quantities attract bulk orders.',
    enableTiers: 'Enable tiered pricing', addTier: '+ Add tier',
    qtyFrom: 'Qty from', qtyTo: 'Qty to (blank = unlimited)', unitPrice: 'Unit price (USD)',
    discount: 'Discount', removeTier: 'Remove',
    shipTitle: 'Shipping Options', shipHint: 'Select shipping methods available for this product.',
    methods: { sea: 'Sea Freight', air: 'Air Freight', express: 'Express (DHL/FedEx)', land: 'Land' },
    minDays: 'Min days', maxDays: 'Max days', costUsd: 'Cost/unit (USD)',
    weightTitle: 'Packaging Info',
    unitWeight: 'Unit weight (kg)', packageDims: 'Carton dimensions (e.g. 15×10×5 cm)',
    sampleFreeFrom: 'Free sample commitment qty (optional)',
    sampleFreeHint: 'Buyers committing to this quantity get free samples',
    optionLabel: (i) => `Option ${i + 1}`,
    variantLabel: (combo, options) =>
      combo.map(({ optionKey, valueKey }) => {
        const opt = options.find(o => o._key === optionKey);
        const val = opt?.values.find(v => v._key === valueKey);
        return val?.value_en || val?.value_zh || '?';
      }).join(' / '),
  },
  ar: {
    addOption: '+ إضافة خيار',
    quickAdd: 'إضافة سريعة: ',
    presets: [
      { label: 'اللون',    type: 'color_swatch', zh: '颜色', en: 'Color',     ar: 'اللون' },
      { label: 'الحجم',    type: 'size_chart',   zh: '尺寸', en: 'Size',      ar: 'الحجم' },
      { label: 'الخامة',   type: 'select',        zh: '材质', en: 'Material',  ar: 'الخامة' },
      { label: 'السعة',    type: 'select',        zh: '容量', en: 'Capacity',  ar: 'السعة' },
      { label: 'الجهد',    type: 'select',        zh: '电压', en: 'Voltage',   ar: 'الجهد' },
      { label: 'التوصيل', type: 'select',        zh: '接口类型', en: 'Connector', ar: 'نوع التوصيل' },
    ],
    nameZh: 'الاسم الصيني (مطلوب)', nameEn: 'الاسم الإنجليزي', nameAr: 'الاسم العربي',
    translate: 'ترجمة تلقائية →', translating: 'جارٍ الترجمة…',
    inputType: 'نوع الاختيار',
    types: { select: 'أزرار', color_swatch: 'لوحة ألوان', size_chart: 'جدول مقاسات', text: 'نص حر' },
    addValue: '+ إضافة قيمة', valuePh: 'اكتب قيمة ثم Enter',
    colorCode: 'رمز اللون (#hex)', deleteOpt: 'حذف الخيار',
    up: '↑', down: '↓', removeVal: '×',
    matrixTitle: 'مصفوفة الخيارات',
    noVariants: 'أضف خياراً واحداً على الأقل مع قيم لتوليد المصفوفة تلقائياً.',
    sku: 'SKU', price: 'السعر (USD)', moq: 'الحد الأدنى', stock: 'المخزون (فارغ=∞)',
    leadTime: 'مدة التجهيز (يوم)', active: 'نشط',
    bulkLabel: 'تطبيق جماعي: ',
    bulkPricePh: 'تطبيق السعر على الكل', bulkMoqPh: 'تطبيق الحد الأدنى على الكل',
    copyFirst: 'نسخ الأول', apply: 'تطبيق',
    summary: (n, lo, hi, stk, mto) =>
      `${n} خيار · $${lo}–$${hi} · مخزون ${stk}${mto ? ` + ${mto} حسب الطلب` : ''}`,
    tieredTitle: 'التسعير المتدرج', tieredHint: 'قدّم أسعاراً أقل مع الكميات الأكبر.',
    enableTiers: 'تفعيل التسعير المتدرج', addTier: '+ إضافة شريحة سعرية',
    qtyFrom: 'الكمية من', qtyTo: 'الكمية حتى (فارغ = غير محدود)', unitPrice: 'السعر/الوحدة (USD)',
    discount: 'الخصم', removeTier: 'حذف',
    shipTitle: 'خيارات الشحن', shipHint: 'حدد طرق الشحن المتاحة لهذا المنتج.',
    methods: { sea: 'شحن بحري', air: 'شحن جوي', express: 'شحن سريع (DHL/FedEx)', land: 'شحن بري' },
    minDays: 'الحد الأدنى (يوم)', maxDays: 'الحد الأقصى (يوم)', costUsd: 'تكلفة/وحدة (USD)',
    weightTitle: 'معلومات التغليف',
    unitWeight: 'وزن الوحدة (كجم)', packageDims: 'أبعاد الكرتون (مثال: 15×10×5 سم)',
    sampleFreeFrom: 'الكمية الالتزامية للعينة المجانية (اختياري)',
    sampleFreeHint: 'المشتري الملتزم بهذه الكمية يحصل على عينة مجانية',
    optionLabel: (i) => `الخيار ${i + 1}`,
    variantLabel: (combo, options) =>
      combo.map(({ optionKey, valueKey }) => {
        const opt = options.find(o => o._key === optionKey);
        const val = opt?.values.find(v => v._key === valueKey);
        return val?.value_ar || val?.value_zh || '?';
      }).join(' / '),
  },
};

const F = { fontFamily: "'Tajawal', sans-serif" };
const card = { background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, padding: '18px 20px' };
const pill = (active) => ({
  fontSize: 12, padding: '5px 14px', borderRadius: 999, cursor: 'pointer', border: '1px solid',
  borderColor: active ? VF_C.ink : VF_C.ink10,
  background: active ? VF_C.ink : 'transparent',
  color: active ? '#fff' : VF_C.ink60, ...F,
});
const smallBtn = { fontSize: 11, padding: '5px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${VF_C.ink10}`, background: VF_C.cream, color: VF_C.ink60, ...F };

// ── OptionCard ────────────────────────────────────────────────────────────────
function OptionCard({ opt, index, total, lang, onUpdate, onDelete, onMove }) {
  const ln = L[lang] || L.zh;
  const [newValZh, setNewValZh] = useState('');
  const [newValEn, setNewValEn] = useState('');
  const [translating, setTranslating] = useState(false);
  const inputRef = useRef();

  const isColor = opt.input_type === 'color_swatch';

  const update = (patch) => onUpdate({ ...opt, ...patch });

  const autoTranslate = async () => {
    if (!opt.name_zh.trim()) return;
    setTranslating(true);
    try {
      const res = await translateTextToAllLanguages(opt.name_zh.trim(), 'zh');
      update({ name_en: res.en || opt.name_en, name_ar: res.ar || opt.name_ar });
    } catch { /* silent fail */ }
    setTranslating(false);
  };

  const addValue = () => {
    const zh = newValZh.trim();
    if (!zh) return;
    const newVal = { ...emptyValue(), value_zh: zh, value_en: newValEn.trim() };
    update({ values: [...opt.values, newVal] });
    setNewValZh('');
    setNewValEn('');
    inputRef.current?.focus();
  };

  const updateValue = (i, patch) => {
    const vals = [...opt.values];
    vals[i] = { ...vals[i], ...patch };
    update({ values: vals });
  };

  const removeValue = (i) => {
    const vals = [...opt.values];
    vals.splice(i, 1);
    update({ values: vals });
  };

  const moveValue = (i, dir) => {
    const vals = [...opt.values];
    const target = i + dir;
    if (target < 0 || target >= vals.length) return;
    [vals[i], vals[target]] = [vals[target], vals[i]];
    update({ values: vals });
  };

  return (
    <div style={{ ...card, marginBottom: 12, position: 'relative' }}>
      {/* header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, letterSpacing: 1.5, color: VF_C.ink30, textTransform: 'uppercase', ...F }}>
          {ln.optionLabel(index)}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={smallBtn} onClick={() => onMove(-1)} disabled={index === 0}>{ln.up}</button>
          <button type="button" style={smallBtn} onClick={() => onMove(1)} disabled={index === total - 1}>{ln.down}</button>
          <button type="button" onClick={onDelete} style={{ ...smallBtn, color: '#c0392b', borderColor: 'rgba(192,57,43,0.2)' }}>{ln.deleteOpt}</button>
        </div>
      </div>

      {/* type selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {Object.entries(ln.types).map(([key, label]) => (
          <button key={key} type="button" style={pill(opt.input_type === key)} onClick={() => update({ input_type: key })}>
            {label}
          </button>
        ))}
      </div>

      {/* trilingual name inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0 20px', marginBottom: 10 }}>
        {[['name_zh', ln.nameZh], ['name_en', ln.nameEn], ['name_ar', ln.nameAr]].map(([field, label]) => (
          <div key={field} style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 11, color: VF_C.ink30, marginBottom: 4, ...F }}>{label}</label>
            <input
              style={{ width: '100%', border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 14, color: VF_C.ink, padding: '6px 0', ...F }}
              value={opt[field] || ''}
              onChange={e => update({ [field]: e.target.value })}
              required={field === 'name_zh'}
              placeholder={field === 'name_zh' ? '必填' : ''}
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={autoTranslate} disabled={translating || !opt.name_zh.trim()} style={{ ...smallBtn, marginBottom: 14, opacity: !opt.name_zh.trim() ? 0.4 : 1 }}>
        {translating ? ln.translating : ln.translate}
      </button>

      {/* values list */}
      {opt.values.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {opt.values.map((val, vi) => (
            <div key={val._key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${VF_C.ink05}`, flexWrap: 'wrap' }}>
              {/* color swatch */}
              {isColor && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: val.color_hex || '#ccc', border: `2px solid ${VF_C.ink10}`, flexShrink: 0 }} />
                  <input
                    type="color"
                    value={val.color_hex || '#4A90D9'}
                    onChange={e => updateValue(vi, { color_hex: e.target.value })}
                    style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }}
                    title={ln.colorCode}
                  />
                </div>
              )}
              {/* zh name */}
              <input
                style={{ flex: 2, minWidth: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink, padding: '4px 0', ...F }}
                value={val.value_zh}
                onChange={e => updateValue(vi, { value_zh: e.target.value })}
                placeholder="中文值"
              />
              {/* en name */}
              <input
                style={{ flex: 2, minWidth: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink60, padding: '4px 0', ...F }}
                value={val.value_en}
                onChange={e => updateValue(vi, { value_en: e.target.value })}
                placeholder="English"
              />
              {/* ar name */}
              <input
                style={{ flex: 2, minWidth: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink60, padding: '4px 0', ...F }}
                value={val.value_ar}
                onChange={e => updateValue(vi, { value_ar: e.target.value })}
                placeholder="العربية"
                dir="rtl"
              />
              {/* reorder */}
              <button type="button" style={{ ...smallBtn, padding: '3px 8px', fontSize: 11 }} onClick={() => moveValue(vi, -1)} disabled={vi === 0}>{ln.up}</button>
              <button type="button" style={{ ...smallBtn, padding: '3px 8px', fontSize: 11 }} onClick={() => moveValue(vi, 1)} disabled={vi === opt.values.length - 1}>{ln.down}</button>
              <button type="button" onClick={() => removeValue(vi)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: VF_C.ink30, lineHeight: 1, padding: '0 2px' }}>{ln.removeVal}</button>
            </div>
          ))}
        </div>
      )}

      {/* add value row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {isColor && (
          <input type="color" defaultValue="#4A90D9" id={`color-new-${opt._key}`} style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 4 }} />
        )}
        <input
          ref={inputRef}
          style={{ flex: 1, minWidth: 100, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink, padding: '6px 0', ...F }}
          placeholder={`${ln.valuePh} (中文)`}
          value={newValZh}
          onChange={e => setNewValZh(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
        />
        <input
          style={{ flex: 1, minWidth: 100, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink60, padding: '6px 0', ...F }}
          placeholder="EN"
          value={newValEn}
          onChange={e => setNewValEn(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addValue(); } }}
        />
        <button
          type="button"
          onClick={() => {
            if (isColor) {
              const colorInput = document.getElementById(`color-new-${opt._key}`);
              const hex = colorInput?.value || '#4A90D9';
              const zh = newValZh.trim();
              if (!zh) return;
              update({ values: [...opt.values, { ...emptyValue(), value_zh: zh, value_en: newValEn.trim(), color_hex: hex }] });
              setNewValZh(''); setNewValEn('');
            } else {
              addValue();
            }
          }}
          style={{ ...smallBtn, padding: '6px 16px', whiteSpace: 'nowrap' }}>
          {ln.addValue}
        </button>
      </div>
    </div>
  );
}

// ── VariantMatrix ─────────────────────────────────────────────────────────────
function VariantMatrix({ variants, options, lang, onChange, productNameEn, basePrice, baseMoq }) {
  const ln = L[lang] || L.zh;
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkMoq, setBulkMoq] = useState('');

  if (!variants.length) {
    return (
      <div style={{ ...card, textAlign: 'center', padding: '32px 20px' }}>
        <p style={{ fontSize: 13, color: VF_C.ink30, ...F }}>{ln.noVariants}</p>
      </div>
    );
  }

  const updateVariant = (key, patch) => {
    onChange(variants.map(v => v._key === key ? { ...v, ...patch } : v));
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    onChange(variants.map(v => ({ ...v, price: bulkPrice })));
    setBulkPrice('');
  };

  const applyBulkMoq = () => {
    if (!bulkMoq) return;
    onChange(variants.map(v => ({ ...v, moq: bulkMoq })));
    setBulkMoq('');
  };

  const copyFromFirst = () => {
    const first = variants[0];
    onChange(variants.map((v, i) => i === 0 ? v : { ...v, price: first.price, moq: first.moq, stock: first.stock, lead_time_days: first.lead_time_days }));
  };

  // compute summary
  const prices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p) && p > 0);
  const stocks = variants.reduce((s, v) => s + (v.stock !== '' && v.stock !== undefined ? parseInt(v.stock, 10) || 0 : 0), 0);
  const mtoCount = variants.filter(v => v.is_active && (v.stock === '' || v.stock === undefined || v.stock === null)).length;
  const priceRange = prices.length
    ? `$${Math.min(...prices).toFixed(2)}–$${Math.max(...prices).toFixed(2)}`
    : (basePrice ? `$${basePrice} (base)` : '—');

  return (
    <div>
      {/* summary */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: VF_C.sage, fontWeight: 500, ...F }}>
          {ln.summary(variants.length, prices.length ? Math.min(...prices).toFixed(2) : '—', prices.length ? Math.max(...prices).toFixed(2) : '—', stocks, mtoCount)}
        </span>
        <span style={{ fontSize: 11, color: VF_C.ink30, ...F }}>{variants.length} rows</span>
      </div>

      {/* bulk actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14, padding: '10px 14px', background: VF_C.cream, borderRadius: 8, border: `1px solid ${VF_C.ink10}` }}>
        <span style={{ fontSize: 11, color: VF_C.ink30, ...F }}>{ln.bulkLabel}</span>
        <input
          style={{ width: 120, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, padding: '4px 0', ...F }}
          placeholder={ln.bulkPricePh}
          value={bulkPrice}
          type="number"
          min="0"
          onChange={e => setBulkPrice(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyBulkPrice(); } }}
        />
        <button type="button" style={smallBtn} onClick={applyBulkPrice}>{ln.apply}</button>
        <input
          style={{ width: 100, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, padding: '4px 0', ...F }}
          placeholder={ln.bulkMoqPh}
          value={bulkMoq}
          type="number"
          min="1"
          onChange={e => setBulkMoq(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyBulkMoq(); } }}
        />
        <button type="button" style={smallBtn} onClick={applyBulkMoq}>{ln.apply}</button>
        <button type="button" style={smallBtn} onClick={copyFromFirst}>{ln.copyFirst}</button>
      </div>

      {/* matrix table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...F }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${VF_C.ink10}` }}>
              <th style={{ textAlign: 'left', padding: '8px 10px', color: VF_C.ink30, fontWeight: 400, fontSize: 11, minWidth: 140 }}>
                {options.map(o => o.name_zh || o.name_en || '?').join(' / ')}
              </th>
              {[ln.sku, ln.price, ln.moq, ln.stock, ln.leadTime, ln.active].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: VF_C.ink30, fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const autoSkuVal = autoSku(productNameEn, v.combo, options);
              const displaySku = v.sku || autoSkuVal;
              const label = ln.variantLabel(v.combo, options);
              return (
                <tr key={v._key} style={{ borderBottom: `1px solid ${VF_C.ink05}`, opacity: v.is_active ? 1 : 0.45 }}>
                  {/* variant label + color swatch if applicable */}
                  <td style={{ padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {v.combo.map(({ optionKey, valueKey }) => {
                        const opt = options.find(o => o._key === optionKey);
                        const val = opt?.values.find(vv => vv._key === valueKey);
                        if (opt?.input_type === 'color_swatch' && val?.color_hex) {
                          return <span key={valueKey} style={{ width: 16, height: 16, borderRadius: '50%', background: val.color_hex, border: `1px solid ${VF_C.ink10}`, display: 'inline-block', flexShrink: 0 }} />;
                        }
                        return null;
                      })}
                      <span style={{ fontSize: 13, color: VF_C.ink }}>{label}</span>
                    </div>
                  </td>
                  {/* SKU */}
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      style={{ width: 130, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 12, color: VF_C.ink60, padding: '4px 0', fontFamily: 'monospace' }}
                      value={v.sku || displaySku}
                      onChange={e => updateVariant(v._key, { sku: e.target.value })}
                      placeholder={autoSkuVal}
                    />
                  </td>
                  {/* price */}
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number" min="0" step="0.01"
                      style={{ width: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink, padding: '4px 0', ...F }}
                      value={v.price}
                      onChange={e => updateVariant(v._key, { price: e.target.value })}
                      placeholder={basePrice || '—'}
                    />
                  </td>
                  {/* moq */}
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number" min="1"
                      style={{ width: 70, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink, padding: '4px 0', ...F }}
                      value={v.moq}
                      onChange={e => updateVariant(v._key, { moq: e.target.value })}
                      placeholder={baseMoq || '—'}
                    />
                  </td>
                  {/* stock */}
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number" min="0"
                      style={{ width: 70, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink, padding: '4px 0', ...F }}
                      value={v.stock}
                      onChange={e => updateVariant(v._key, { stock: e.target.value })}
                      placeholder="∞"
                    />
                  </td>
                  {/* lead time */}
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="number" min="0"
                      style={{ width: 60, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, color: VF_C.ink, padding: '4px 0', ...F }}
                      value={v.lead_time_days}
                      onChange={e => updateVariant(v._key, { lead_time_days: e.target.value })}
                      placeholder="—"
                    />
                  </td>
                  {/* active toggle */}
                  <td style={{ padding: '6px 10px' }}>
                    <input
                      type="checkbox"
                      checked={v.is_active !== false}
                      onChange={e => updateVariant(v._key, { is_active: e.target.checked })}
                      style={{ width: 16, height: 16, accentColor: VF_C.sage, cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── TieredPricingSection ──────────────────────────────────────────────────────
function TieredPricingSection({ tiers, lang, onChange, basePrice }) {
  const ln = L[lang] || L.zh;
  const [enabled, setEnabled] = useState(tiers.length > 0);

  const addTier = () => onChange([...tiers, { _key: uid(), qty_from: '', qty_to: '', unit_price: '' }]);
  const removeTier = (key) => onChange(tiers.filter(t => t._key !== key));
  const updateTier = (key, patch) => onChange(tiers.map(t => t._key === key ? { ...t, ...patch } : t));

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: enabled ? 18 : 0, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 4, ...F }}>{ln.tieredTitle}</p>
          <p style={{ fontSize: 12, color: VF_C.ink60, ...F }}>{ln.tieredHint}</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={enabled}
            onChange={e => { setEnabled(e.target.checked); if (!e.target.checked) onChange([]); }}
            style={{ width: 15, height: 15, accentColor: VF_C.ink, cursor: 'pointer' }} />
          <span style={{ fontSize: 13, ...F }}>{ln.enableTiers}</span>
        </label>
      </div>

      {enabled && (
        <>
          {tiers.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, ...F }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${VF_C.ink10}` }}>
                    {[ln.qtyFrom, ln.qtyTo, ln.unitPrice, ln.discount, ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: VF_C.ink30, fontWeight: 400, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiers.map(tier => {
                    const discountPct = basePrice && tier.unit_price
                      ? Math.round((1 - parseFloat(tier.unit_price) / parseFloat(basePrice)) * 100)
                      : null;
                    return (
                      <tr key={tier._key} style={{ borderBottom: `1px solid ${VF_C.ink05}` }}>
                        <td style={{ padding: '7px 10px' }}>
                          <input type="number" min="1"
                            style={{ width: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, padding: '4px 0', ...F }}
                            value={tier.qty_from} placeholder="100"
                            onChange={e => updateTier(tier._key, { qty_from: e.target.value })} />
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <input type="number" min="1"
                            style={{ width: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, padding: '4px 0', ...F }}
                            value={tier.qty_to} placeholder="∞"
                            onChange={e => updateTier(tier._key, { qty_to: e.target.value })} />
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <input type="number" min="0" step="0.01"
                            style={{ width: 80, border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, padding: '4px 0', ...F }}
                            value={tier.unit_price} placeholder="—"
                            onChange={e => updateTier(tier._key, { unit_price: e.target.value })} />
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          {discountPct !== null && discountPct > 0
                            ? <span style={{ fontSize: 12, color: VF_C.sage, padding: '3px 8px', borderRadius: 999, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}`, ...F }}>−{discountPct}%</span>
                            : <span style={{ color: VF_C.ink30, fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <button type="button" style={{ ...smallBtn, color: '#c0392b' }} onClick={() => removeTier(tier._key)}>{ln.removeTier}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <button type="button" style={smallBtn} onClick={addTier}>{ln.addTier}</button>
        </>
      )}
    </div>
  );
}

// ── ShippingSection ───────────────────────────────────────────────────────────
function ShippingSection({ shipping, lang, onChange }) {
  const ln = L[lang] || L.zh;

  const update = (key, patch) => onChange(shipping.map(s => s._key === key ? { ...s, ...patch } : s));

  return (
    <div style={card}>
      <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 6, ...F }}>{ln.shipTitle}</p>
      <p style={{ fontSize: 12, color: VF_C.ink60, marginBottom: 16, ...F }}>{ln.shipHint}</p>

      <div style={{ display: 'grid', gap: 10 }}>
        {shipping.map(s => (
          <div key={s._key} style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${s.is_available ? VF_C.sageBr : VF_C.ink10}`, background: s.is_available ? VF_C.sageBg : 'transparent', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: s.is_available ? 12 : 0, flexWrap: 'wrap' }}>
              <input type="checkbox" checked={s.is_available}
                onChange={e => update(s._key, { is_available: e.target.checked })}
                style={{ width: 15, height: 15, accentColor: VF_C.sage, cursor: 'pointer' }} />
              <span style={{ fontSize: 14, fontWeight: 500, color: VF_C.ink, ...F }}>{ln.methods[s.method]}</span>
            </div>
            {s.is_available && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0 20px' }}>
                {[
                  ['lead_time_min_days', ln.minDays, 'number'],
                  ['lead_time_max_days', ln.maxDays, 'number'],
                  ['cost_per_unit_usd', ln.costUsd, 'number'],
                ].map(([field, label, type]) => (
                  <div key={field} style={{ marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 11, color: VF_C.ink30, marginBottom: 4, ...F }}>{label}</label>
                    <input type={type} min="0"
                      style={{ width: '100%', border: 'none', borderBottom: `1px solid ${VF_C.ink10}`, background: 'transparent', outline: 'none', fontSize: 13, padding: '4px 0', ...F }}
                      value={s[field]}
                      onChange={e => update(s._key, { [field]: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── VariantBuilder (main export) ──────────────────────────────────────────────
export function VariantBuilder({ lang, data, onChange, productNameEn, basePrice, baseMoq }) {
  const ln = L[lang] || L.zh;
  const { options = [], variants = [], tiers = [], shipping = emptyVariantData().shipping } = data;

  const updateOptions = (newOptions) => {
    const newVariants = regenerateVariants(newOptions, variants);
    onChange({ ...data, options: newOptions, variants: newVariants });
  };

  const addOption = (preset = null) => {
    const newOption = emptyOption(preset || {});
    updateOptions([...options, newOption]);
  };

  const updateOption = (key, updated) => {
    const newOptions = options.map(o => o._key === key ? updated : o);
    updateOptions(newOptions);
  };

  const deleteOption = (key) => updateOptions(options.filter(o => o._key !== key));

  const moveOption = (index, dir) => {
    const newOptions = [...options];
    const target = index + dir;
    if (target < 0 || target >= newOptions.length) return;
    [newOptions[index], newOptions[target]] = [newOptions[target], newOptions[index]];
    updateOptions(newOptions);
  };

  return (
    <div>
      {/* ── Options ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        {/* quick-add presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: VF_C.ink30, ...F }}>{ln.quickAdd}</span>
          {ln.presets.map(p => (
            <button key={p.label} type="button"
              style={{ ...smallBtn, fontSize: 12 }}
              onClick={() => addOption(p)}>
              {p.label}
            </button>
          ))}
          <button type="button"
            style={{ ...smallBtn, marginLeft: 8, fontWeight: 500, borderColor: VF_C.ink30, color: VF_C.ink }}
            onClick={() => addOption()}>
            {ln.addOption}
          </button>
        </div>

        {/* option cards */}
        {options.map((opt, i) => (
          <OptionCard
            key={opt._key}
            opt={opt}
            index={i}
            total={options.length}
            lang={lang}
            onUpdate={(updated) => updateOption(opt._key, updated)}
            onDelete={() => deleteOption(opt._key)}
            onMove={(dir) => moveOption(i, dir)}
          />
        ))}
      </div>

      {/* ── Variant Matrix ───────────────────────────────────────── */}
      <div style={{ ...card, marginBottom: 20 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 16, ...F }}>
          {ln.matrixTitle}
        </p>
        <VariantMatrix
          variants={variants}
          options={options}
          lang={lang}
          onChange={(newVariants) => onChange({ ...data, variants: newVariants })}
          productNameEn={productNameEn}
          basePrice={basePrice}
          baseMoq={baseMoq}
        />
      </div>

      {/* ── Tiered Pricing ───────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <TieredPricingSection
          tiers={tiers}
          lang={lang}
          onChange={(newTiers) => onChange({ ...data, tiers: newTiers })}
          basePrice={basePrice}
        />
      </div>

      {/* ── Shipping ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <ShippingSection
          shipping={shipping}
          lang={lang}
          onChange={(newShipping) => onChange({ ...data, shipping: newShipping })}
        />
      </div>
    </div>
  );
}
