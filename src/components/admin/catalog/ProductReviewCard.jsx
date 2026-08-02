import React, { useState } from 'react';

const nf = (v) => (v && v !== 'not_found' ? v : '');
const FB = "'Tajawal', sans-serif";

// One staged product in the review deck: image + inline-editable ar/en fields.
// Controlled — `value` is the extracted_json, `onChange` returns the edited json.
// The product image can be swapped for any of the import's `candidates`; the
// chosen url is reported via `onImageChange` (parent applies it at approval).
export default function ProductReviewCard({ value, onChange, product, lang, candidates = [], image, onImageChange, onSuggest }) {
  const isAr = lang === 'ar';
  const ej = value || {};
  const setBi = (field, k, v) => onChange({ ...ej, [field]: { ...(ej[field] || {}), [k]: v } });
  const setStr = (field, v) => onChange({ ...ej, [field]: v });

  const [picking, setPicking] = useState(false);
  const [busyField, setBusyField] = useState(null);
  const suggest = async (field) => {
    if (!onSuggest || busyField) return;
    setBusyField(field);
    try { await onSuggest(field); } catch { /* surfaced by the parent */ }
    setBusyField(null);
  };
  const SparkBtn = ({ field }) => (onSuggest ? (
    <button type="button" onClick={() => suggest(field)} disabled={!!busyField} title={isAr ? 'اقتراح من جيميني' : 'Suggest with Gemini'}
      style={{ background: 'none', border: 'none', cursor: busyField ? 'default' : 'pointer', fontFamily: FB, fontSize: 11.5, color: '#8B5e2b', padding: 0 }}>
      {busyField === field ? (isAr ? '… يقترح' : '… suggesting') : (isAr ? '✨ اقترح' : '✨ Suggest')}
    </button>
  ) : null);
  const shownImg = image || product.image_path;
  const canPick = typeof onImageChange === 'function' && candidates.length > 0;

  const conf = product.confidence_score;
  const band = conf == null ? 'na' : conf >= 0.7 ? 'hi' : conf >= 0.4 ? 'mid' : 'lo';
  const custom = Array.isArray(ej.customization_options) ? ej.customization_options : [];

  const biField = (labelAr, labelEn, field, textarea) => (
    <div style={{ marginBottom: 8 }}>
      {onSuggest && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
          <SparkBtn field={field} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
      <div style={{ flexShrink: 0, width: 220 }}>
        <div style={{ width: 220, height: 220, borderRadius: 10, overflow: 'hidden', background: '#EFE8DC',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {shownImg
            ? <img src={shownImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
            : <span style={{ color: '#8B7355', fontSize: 40, fontFamily: "'Cormorant Garamond', serif" }}>
                {(nf(ej.product_name?.en) || nf(ej.product_name?.ar) || '?')[0]}
              </span>}
          <span className={`ci-conf ${band}`}>{conf == null ? '—' : conf.toFixed(2)}</span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: FB }}>
          {isAr ? 'صفحة' : 'page'} {product.page_no ?? '—'}
        </div>
        {canPick && (
          <div style={{ marginTop: 6, textAlign: 'center' }}>
            <button type="button" onClick={() => setPicking((v) => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 11.5, color: '#8B7355', padding: 0 }}>
              {picking ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'تغيير الصورة' : 'Change image')}
            </button>
            {image && image !== product.image_path && (
              <button type="button" onClick={() => { onImageChange(null); setPicking(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 11.5, color: 'rgba(0,0,0,0.4)', padding: 0, marginInlineStart: 10 }}>
                {isAr ? 'استعادة الأصلية' : 'Reset'}
              </button>
            )}
          </div>
        )}
        {canPick && picking && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 180, overflowY: 'auto', padding: 2,
            border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
            {candidates.map((url) => {
              const on = shownImg === url;
              return (
                <button key={url} type="button" onClick={() => { onImageChange(url); setPicking(false); }}
                  style={{ padding: 0, width: 60, height: 60, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', background: '#fff',
                    border: `2px solid ${on ? '#c9863f' : 'rgba(0,0,0,0.12)'}` }}>
                  <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </button>
              );
            })}
          </div>
        )}
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
