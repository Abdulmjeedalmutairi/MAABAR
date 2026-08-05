import React from 'react';
import { normCertCode, CERT_DICT, CERT_SUGGESTIONS, certName, CERT_GREEN } from '../../lib/certifications';

// Edit a factory's certifications: [{ code, name_ar, name_en }]. Known codes show
// their meaning automatically; unknown codes get an editable description so they
// aren't cryptic. Quick-add chips seed the common ones. `inputClass` lets it match
// the host form (ci-input in review, fd-input in management).
export default function CertsEditor({ value = [], onChange, lang = 'ar', inputClass = 'ci-input' }) {
  const isAr = lang === 'ar';
  const list = Array.isArray(value) ? value : [];
  const set = (i, patch) => onChange(list.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  const add = (code = '') => {
    const norm = normCertCode(code);
    if (norm && list.some((c) => normCertCode(c.code) === norm)) return;   // de-dupe
    onChange([...list, { code, name_ar: '', name_en: '' }]);
  };
  const nameKey = isAr ? 'name_ar' : 'name_en';
  const FB = isAr ? 'var(--font-ar)' : 'var(--font-sans)';

  return (
    <div>
      {list.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {list.map((c, i) => {
            const known = !!CERT_DICT[normCertCode(c.code)];
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input className={inputClass} style={{ maxWidth: 150, width: 150 }} dir="ltr"
                  placeholder="ISO 9001" value={c.code || ''} onChange={(e) => set(i, { code: e.target.value })} />
                {known ? (
                  <span style={{ fontSize: 12, color: CERT_GREEN, fontFamily: FB }}>✓ {certName(c, lang)}</span>
                ) : (
                  <input className={inputClass} style={{ flex: 1, minWidth: 150 }} dir={isAr ? 'rtl' : 'ltr'}
                    placeholder={isAr ? 'وصف الشهادة (اختياري)' : 'What it certifies (optional)'}
                    value={c[nameKey] || ''} onChange={(e) => set(i, { [nameKey]: e.target.value })} />
                )}
                <button type="button" onClick={() => remove(i)} title={isAr ? 'حذف' : 'Remove'}
                  style={{ border: 'none', background: 'rgba(192,80,63,0.9)', color: '#fff', width: 20, height: 20,
                    borderRadius: 5, cursor: 'pointer', fontSize: 13, lineHeight: '18px', padding: 0, flexShrink: 0 }}>×</button>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: FB }}>{isAr ? 'أضف:' : 'Add:'}</span>
        {CERT_SUGGESTIONS.slice(0, 12).map((code) => (
          <button key={code} type="button" onClick={() => add(code)}
            style={{ border: '1px solid rgba(0,0,0,0.15)', background: 'transparent', borderRadius: 99,
              padding: '2px 9px', fontSize: 11, cursor: 'pointer', fontFamily: FB }}>+ {code}</button>
        ))}
        <button type="button" onClick={() => add('')}
          style={{ border: '1px dashed rgba(0,0,0,0.3)', background: 'transparent', borderRadius: 99,
            padding: '2px 9px', fontSize: 11, cursor: 'pointer', fontFamily: FB }}>{isAr ? '+ أخرى' : '+ Other'}</button>
      </div>
    </div>
  );
}
