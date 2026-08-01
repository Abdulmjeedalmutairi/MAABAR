import React from 'react';
import { UI_CATEGORIES } from '../../../lib/supplierDashboardConstants';

const nf = (v) => (v && v !== 'not_found' ? v : '');

// Step 1 of the catalog-import review: confirm the factory's identity/contact.
// Either create a NEW factory_directory row, or attach the products to an
// existing one. Prefilled from the batch's factory_fields (Gemini + CSV).
export default function FactoryFieldsPanel({ value, onChange, mode, onModeChange, existingId, onExistingChange, factories = [], lang }) {
  const isAr = lang === 'ar';
  const cats = (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).filter((c) => c.val !== 'all');
  const set = (k, v) => onChange({ ...value, [k]: v });

  const field = (label, key, opts = {}) => (
    <div style={{ marginBottom: 12 }}>
      <label className="ci-label">{label}{opts.req ? ' *' : ''}</label>
      <input className="ci-input" value={nf(value[key])} onChange={(e) => set(key, e.target.value)}
        dir={opts.ltr ? 'ltr' : (isAr ? 'rtl' : 'ltr')} placeholder={opts.ph || ''} />
      {opts.hint && <p className="ci-hint">{opts.hint}</p>}
    </div>
  );

  const toggle = (label, key, hint) => (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, cursor: 'pointer' }}>
      <input type="checkbox" checked={!!value[key]} onChange={(e) => set(key, e.target.checked)} style={{ marginTop: 3 }} />
      <span>
        <span className="ci-label" style={{ display: 'inline', margin: 0 }}>{label}</span>
        {hint && <p className="ci-hint" style={{ margin: '1px 0 0' }}>{hint}</p>}
      </span>
    </label>
  );

  // Optional trust-signal fields — shown as badges on the factory profile page.
  // Editable in BOTH modes (prefilled from extraction, or the existing factory).
  const profileFields = (
    <>
      {field(isAr ? 'سنة التأسيس' : 'Founded year', 'founded_year',
        { ltr: true, ph: '2012', hint: isAr ? 'اختياري — يظهر كـ "تأسّست 2012"' : 'Optional — shows as "Est. 2012"' })}
      {field(isAr ? 'أسواق التصدير' : 'Export markets', 'export_markets',
        { ltr: true, ph: '30+ countries', hint: isAr ? 'اختياري — يظهر كـ "يصدّر إلى ‎30+ دولة"' : 'Optional — shows as "Exports to 30+ countries"' })}
      <div style={{ marginTop: 8 }}>
        {toggle(isAr ? 'مصنع موثّق' : 'Verified factory', 'is_verified',
          isAr ? 'يعرض شارة "موثّق" في صفحة المصنع' : 'Shows a "Verified" badge on the profile')}
        {toggle(isAr ? 'موصى به (مميّز)' : 'Recommended (featured)', 'is_featured',
          isAr ? 'يعرض شارة "موصى به"' : 'Shows a "Recommended" badge')}
      </div>
    </>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        <button type="button" className={`ci-seg${mode === 'new' ? ' on' : ''}`} onClick={() => onModeChange('new')}>
          {isAr ? 'مصنع جديد' : 'New factory'}
        </button>
        <button type="button" className={`ci-seg${mode === 'existing' ? ' on' : ''}`} onClick={() => onModeChange('existing')}>
          {isAr ? 'ربط بمصنع موجود' : 'Attach to existing'}
        </button>
      </div>

      {mode === 'existing' ? (
        <div style={{ marginBottom: 12 }}>
          <label className="ci-label">{isAr ? 'اختر المصنع' : 'Select factory'} *</label>
          <select className="ci-input" value={existingId || ''} onChange={(e) => onExistingChange(e.target.value)}>
            <option value="">{isAr ? '— اختر —' : '— choose —'}</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.company_name}{f.company_name_latin ? ` (${f.company_name_latin})` : ''}
              </option>
            ))}
          </select>
          <p className="ci-hint">{isAr ? 'ستُضاف المنتجات إلى هذا المصنع.' : 'Products will be added to this factory.'}</p>
          {existingId && profileFields}
        </div>
      ) : (
        <>
          {field(isAr ? 'الاسم الأصلي (للتواصل)' : 'Original name (for contact)', 'name_original')}
          {field(isAr ? 'الاسم بالإنجليزية' : 'English name', 'name_en', { ltr: true })}
          {field(isAr ? 'البريد الإلكتروني' : 'Email', 'email', { req: true, ltr: true, ph: 'factory@example.com' })}
          {field(isAr ? 'واتساب / هاتف' : 'WhatsApp / phone', 'phone', { ltr: true })}
          {field(isAr ? 'المدينة' : 'City', 'city')}
          <div style={{ marginBottom: 4 }}>
            <label className="ci-label">{isAr ? 'التصنيف' : 'Category'} *</label>
            <select className="ci-input" value={value.category || ''} onChange={(e) => set('category', e.target.value)}>
              <option value="">{isAr ? '— اختر —' : '— choose —'}</option>
              {cats.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}
            </select>
            {value.category_hint && (
              <p className="ci-hint">{isAr ? 'من الكتالوج: ' : 'From catalog: '}{value.category_hint}</p>
            )}
          </div>
          <div style={{ marginTop: 12 }}>{profileFields}</div>
        </>
      )}
    </div>
  );
}
