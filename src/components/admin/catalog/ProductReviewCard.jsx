import React from 'react';

const nf = (v) => (v && v !== 'not_found' ? v : '');
const FB = "'Tajawal', sans-serif";

// One staged product in the review deck: image + inline-editable ar/en fields.
// Controlled — `value` is the extracted_json, `onChange` returns the edited json.
export default function ProductReviewCard({ value, onChange, product, lang }) {
  const isAr = lang === 'ar';
  const ej = value || {};
  const setBi = (field, k, v) => onChange({ ...ej, [field]: { ...(ej[field] || {}), [k]: v } });
  const setStr = (field, v) => onChange({ ...ej, [field]: v });

  const conf = product.confidence_score;
  const band = conf == null ? 'na' : conf >= 0.7 ? 'hi' : conf >= 0.4 ? 'mid' : 'lo';
  const custom = Array.isArray(ej.customization_options) ? ej.customization_options : [];

  const biField = (labelAr, labelEn, field, textarea) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
      <div>
        <label className="ci-label">{labelAr} (ع)</label>
        {textarea
          ? <textarea className="ci-input" rows={2} dir="rtl" style={{ resize: 'vertical' }} value={nf(ej[field]?.ar)} onChange={(e) => setBi(field, 'ar', e.target.value)} />
          : <input className="ci-input" dir="rtl" value={nf(ej[field]?.ar)} onChange={(e) => setBi(field, 'ar', e.target.value)} />}
      </div>
      <div>
        <label className="ci-label">{labelEn} (EN)</label>
        {textarea
          ? <textarea className="ci-input" rows={2} dir="ltr" style={{ resize: 'vertical' }} value={nf(ej[field]?.en)} onChange={(e) => setBi(field, 'en', e.target.value)} />
          : <input className="ci-input" dir="ltr" value={nf(ej[field]?.en)} onChange={(e) => setBi(field, 'en', e.target.value)} />}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ flexShrink: 0, width: 220 }}>
        <div style={{ width: 220, height: 220, borderRadius: 10, overflow: 'hidden', background: '#EFE8DC',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {product.image_path
            ? <img src={product.image_path} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
            : <span style={{ color: '#8B7355', fontSize: 40, fontFamily: "'Cormorant Garamond', serif" }}>
                {(nf(ej.product_name?.en) || nf(ej.product_name?.ar) || '?')[0]}
              </span>}
          <span className={`ci-conf ${band}`}>{conf == null ? '—' : conf.toFixed(2)}</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: FB }}>
          {isAr ? 'صفحة' : 'page'} {product.page_no ?? '—'}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 300 }}>
        {biField('الاسم', 'Name', 'product_name')}
        <div style={{ marginBottom: 8 }}>
          <label className="ci-label">{isAr ? 'رمز المنتج' : 'Ref code'}</label>
          <input className="ci-input" dir="ltr" style={{ maxWidth: 220, fontFamily: 'ui-monospace, Consolas, monospace' }}
            value={nf(ej.ref_code)} onChange={(e) => setStr('ref_code', e.target.value)} />
        </div>
        {biField('المواصفات', 'Specifications', 'specifications', true)}
        {biField('الوصف', 'Description', 'description', true)}
        <div style={{ marginBottom: 4 }}>
          <label className="ci-label">{isAr ? 'الحد الأدنى للطلب' : 'MOQ'}</label>
          <input className="ci-input" style={{ maxWidth: 180 }} value={nf(ej.moq)} onChange={(e) => setStr('moq', e.target.value)} />
        </div>
        {custom.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <label className="ci-label">{isAr ? 'خيارات التخصيص (للعرض فقط)' : 'Customization (display-only)'}</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {custom.map((c, i) => (
                <span key={i} className="ci-chip-ro">{[nf(c.ar), nf(c.en)].filter(Boolean).join(' / ') || '—'}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
