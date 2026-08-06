import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import {
  createImport, triggerExtraction, fetchImport, fetchImports, fetchFactories,
  resolveFactory, approveProducts, bulkApproveHighConfidence, finalizeImport,
  workerConfigured, HIGH_CONF,
} from '../../lib/catalogImport';
import { displayCategoryForCode } from '../../lib/factoryCategories';
import { UI_CATEGORIES } from '../../lib/supplierDashboardConstants';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const STEPS = [
  { ar: 'رفع', en: 'Upload' }, { ar: 'استخراج', en: 'Extract' }, { ar: 'معاينة', en: 'Preview' },
  { ar: 'إسناد', en: 'Assign' }, { ar: 'نشر', en: 'Publish' },
];

export default function ConsoleImport({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [importId, setImportId] = useState(params.get('id') || null);
  const [batch, setBatch] = useState(null);
  const [products, setProducts] = useState([]);
  const [factoryId, setFactoryId] = useState(null);
  const [err, setErr] = useState('');

  const flash = (m) => setErr(m);

  // Resume an existing import passed by ?id.
  useEffect(() => {
    const id = params.get('id');
    if (!id) return;
    (async () => {
      try {
        const { batch: b, products: ps } = await fetchImport(id);
        if (!b) return;
        setImportId(id); setBatch(b); setProducts(ps);
        if (['queued', 'extracting'].includes(b.status)) setStep(2);
        else if (b.status === 'extracted') setStep(3);
        else if (b.status === 'reviewing') { setFactoryId(b.factory_id); setStep(b.factory_id ? 5 : 4); }
        else if (b.status === 'approved') setStep(5);
        else setStep(3);
      } catch { /* noop */ }
    })();
    // eslint-disable-next-line
  }, []);

  const goStep = (id) => { setImportId(id); setParams({ id }); };

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="import">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', maxWidth: 980 }}>
        <div className="ac-page-head"><div><h1 className="ac-h1">{isAr ? 'استيراد كتالوج' : 'Import Catalog'}</h1></div></div>

        <div className="ac-stepper">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const cls = step > n ? 'done' : step === n ? 'on' : '';
            return (
              <React.Fragment key={i}>
                <div className={`ac-step ${cls}`}>
                  <span className="ac-step-dot">{step > n ? '✓' : n}</span>
                  <span className="ac-step-lbl">{isAr ? s.ar : s.en}</span>
                </div>
                {n < STEPS.length && <span className={`ac-step-line${step > n ? ' done' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>

        {err && <p style={{ color: 'var(--ac-danger)', fontSize: 13, marginBottom: 12 }}>{err}</p>}

        {step === 1 && <UploadStep isAr={isAr} nav={nav} onStarted={(id) => { goStep(id); setStep(2); }} setErr={setErr} />}
        {step === 2 && <ExtractStep isAr={isAr} importId={importId} onExtracted={(b, ps) => { setBatch(b); setProducts(ps); setStep(3); }} onFailed={setErr} onRetry={() => setStep(1)} />}
        {step === 3 && <PreviewStep isAr={isAr} lang={lang} batch={batch} products={products} importId={importId} onNext={() => setStep(4)} />}
        {step === 4 && <AssignStep isAr={isAr} lang={lang} batch={batch} importId={importId} onAssigned={(fid) => { setFactoryId(fid); setStep(5); }} setErr={setErr} />}
        {step === 5 && <PublishStep isAr={isAr} lang={lang} batch={batch} products={products} importId={importId} factoryId={factoryId} nav={nav} setErr={setErr} />}
      </div>
    </ConsoleShell>
  );
}

// ── Step 1: Upload ───────────────────────────────────────────────────────────
function UploadStep({ isAr, nav, onStarted, setErr }) {
  const [mode, setMode] = useState('curated');
  const [notes, setNotes] = useState('');
  const [pct, setPct] = useState(null);
  const [recent, setRecent] = useState(null);
  const fileRef = useRef(null);
  useEffect(() => { fetchImports().then((r) => setRecent(r.slice(0, 6))).catch(() => setRecent([])); }, []);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { setErr(isAr ? 'الملف يجب أن يكون PDF' : 'Must be a PDF'); return; }
    setErr(''); setPct(0);
    try {
      const id = await createImport(file, notes, mode, null, (f) => setPct(Math.round(f * 100)));
      if (workerConfigured()) triggerExtraction(id).catch(() => {});
      onStarted(id);
    } catch (e2) { setPct(null); setErr((isAr ? 'تعذّر الرفع: ' : 'Upload failed: ') + (e2.message || '')); }
  };

  return (
    <>
      <div className="ac-card">
        <p className="ac-card-title">{isAr ? 'نطاق الاستخراج' : 'Extraction scope'}</p>
        <div className="ac-chiprow" style={{ marginBottom: 16 }}>
          <button className={`ac-chip${mode === 'curated' ? ' on' : ''}`} onClick={() => setMode('curated')}>{isAr ? 'منتقى (أفضل ~40)' : 'Curated (best ~40)'}</button>
          <button className={`ac-chip${mode === 'full' ? ' on' : ''}`} onClick={() => setMode('full')}>{isAr ? 'كامل (كل المنتجات)' : 'Full (every product)'}</button>
        </div>
        <div className="ac-field" style={{ marginBottom: 16 }}>
          <label className="ac-flabel">{isAr ? 'توجيه اختياري للاستخراج' : 'Optional extraction guidance'}</label>
          <input className="ac-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={isAr ? 'مثال: ركّز على الأثاث المكتبي فقط' : 'e.g. focus on office furniture only'} />
        </div>
        <button className="ac-btn ac-btn-primary" onClick={() => fileRef.current?.click()} disabled={pct !== null}>
          {pct !== null ? (isAr ? `جارٍ الرفع… ${pct}%` : `Uploading… ${pct}%`) : (isAr ? '+ اختر ملف PDF' : '+ Choose a PDF')}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPick} />
      </div>

      {recent && recent.length > 0 && (
        <div className="ac-card">
          <p className="ac-card-title">{isAr ? 'استيرادات حديثة (استئناف)' : 'Recent imports (resume)'}</p>
          {recent.map((r) => (
            <div key={r.id} className="ac-kv" style={{ alignItems: 'center' }}>
              <div className="ac-kv-v" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nf(r.original_filename) || nf(r.catalog_title) || r.id.slice(0, 8)}</div>
              <span className="ac-badge neutral" style={{ height: 20 }}>{r.status}</span>
              <button className="ac-btn ac-btn-sm" style={{ marginInlineStart: 8 }} onClick={() => nav(`/admin2/import?id=${r.id}`)}>{isAr ? 'متابعة' : 'Continue'}</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Step 2: Extraction (poll) ────────────────────────────────────────────────
function ExtractStep({ isAr, importId, onExtracted, onFailed, onRetry }) {
  const [row, setRow] = useState(null);
  useEffect(() => {
    if (!importId) return undefined;
    let alive = true;
    const tick = async () => {
      try {
        const { batch, products } = await fetchImport(importId);
        if (!alive || !batch) return;
        setRow(batch);
        if (batch.status === 'extracted') { onExtracted(batch, products); }
        else if (batch.status === 'failed') { onFailed((isAr ? 'فشل الاستخراج: ' : 'Extraction failed: ') + (batch.error || '')); }
      } catch { /* keep polling */ }
    };
    tick();
    const iv = setInterval(tick, 2500);
    return () => { alive = false; clearInterval(iv); };
    // eslint-disable-next-line
  }, [importId]);

  const prog = row?.progress || {};
  const failed = row?.status === 'failed';
  return (
    <div className="ac-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
      {!failed ? (
        <>
          <div style={{ fontSize: 34, marginBottom: 10 }}>⚙️</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ac-ink)', margin: '0 0 6px' }}>{isAr ? 'جارٍ الاستخراج بالذكاء الاصطناعي…' : 'AI extraction in progress…'}</p>
          <p style={{ fontSize: 13, color: 'var(--ac-muted)', margin: '0 0 18px' }}>{nf(prog.note) || prog.stage || (isAr ? 'قد يستغرق دقائق' : 'This can take a few minutes')}</p>
          <div className="ac-meter" style={{ maxWidth: 360, margin: '0 auto' }}><span style={{ width: `${prog.pct || 5}%` }} /></div>
          {row?.page_count ? <p style={{ fontSize: 12, color: 'var(--ac-faint)', marginTop: 12 }}>{row.page_count} {isAr ? 'صفحة' : 'pages'}</p> : null}
        </>
      ) : (
        <>
          <div style={{ fontSize: 34, marginBottom: 10 }}>⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--ac-danger)', margin: '0 0 6px' }}>{isAr ? 'فشل الاستخراج' : 'Extraction failed'}</p>
          <p style={{ fontSize: 12.5, color: 'var(--ac-muted)', margin: '0 0 18px', wordBreak: 'break-word' }}>{row?.error}</p>
          <button className="ac-btn" onClick={onRetry}>{isAr ? 'ابدأ من جديد' : 'Start over'}</button>
        </>
      )}
    </div>
  );
}

// ── Step 3: Preview ──────────────────────────────────────────────────────────
function PreviewStep({ isAr, lang, batch, products, importId, onNext }) {
  const ff = batch?.factory_fields || {};
  const nav = useNavigate();
  const name = nf(ff.name_original) || nf(ff.name_en) || (isAr ? 'مصنع غير مسمّى' : 'Unnamed factory');
  const cat = displayCategoryForCode(ff.category);
  const catLabel = cat ? (cat.label[lang] || cat.label.en) : nf(ff.category);
  const pName = (p) => { const ej = p.extracted_json || {}; const n = ej.product_name || {}; return (isAr ? (nf(n.ar) || nf(n.en)) : (nf(n.en) || nf(n.ar))) || (isAr ? 'منتج' : 'Product'); };
  const shown = products.slice(0, 30);
  return (
    <>
      <div className="ac-card">
        <p className="ac-card-title">{isAr ? 'ما اكتشفه الذكاء الاصطناعي' : 'What the AI detected'}</p>
        <div className="ac-kv"><div className="ac-kv-k">{isAr ? 'المصنع' : 'Factory'}</div><div className="ac-kv-v" style={{ fontWeight: 600 }}>{name}</div></div>
        {catLabel && <div className="ac-kv"><div className="ac-kv-k">{isAr ? 'الفئة' : 'Category'}</div><div className="ac-kv-v">{catLabel}</div></div>}
        {(nf(ff.city) || nf(ff.country)) && <div className="ac-kv"><div className="ac-kv-k">{isAr ? 'الموقع' : 'Location'}</div><div className="ac-kv-v">{[nf(ff.city), nf(ff.country)].filter(Boolean).join('، ')}</div></div>}
        <div className="ac-kv"><div className="ac-kv-k">{isAr ? 'المنتجات' : 'Products'}</div><div className="ac-kv-v" style={{ fontWeight: 700 }}>{products.length}</div></div>
      </div>

      <div className="ac-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="ac-card-title" style={{ margin: 0 }}>{isAr ? `معاينة المنتجات (${shown.length} من ${products.length})` : `Product preview (${shown.length} of ${products.length})`}</p>
          <button className="ac-btn ac-btn-sm" onClick={() => nav(`/admin/catalog-import/${importId}`)}>{isAr ? 'مراجعة تفصيلية ↗' : 'Detailed review ↗'}</button>
        </div>
        <div className="ac-pgrid">
          {shown.map((p) => (
            <div className="ac-pcard" key={p.id}>
              {p.image_path ? <img className="ac-pcard-img" src={p.image_path} alt="" loading="lazy" /> : <div className="ac-pcard-noimg">{isAr ? 'بلا صورة' : 'No image'}</div>}
              <div className="ac-pbody"><p className="ac-pname">{pName(p)}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="ac-savebar"><button className="ac-btn ac-btn-primary" onClick={onNext} disabled={!products.length}>{isAr ? 'التالي: إسناد لمورّد' : 'Next: assign supplier'}</button></div>
    </>
  );
}

// ── Step 4: Assign supplier ──────────────────────────────────────────────────
function AssignStep({ isAr, lang, batch, importId, onAssigned, setErr }) {
  const ff = batch?.factory_fields || {};
  const cats = UI_CATEGORIES[lang] || UI_CATEGORIES.ar;
  const [mode, setMode] = useState('new');
  const [facs, setFacs] = useState(null);
  const [existingId, setExistingId] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  // Editable factory identity, pre-filled from what the AI detected — the admin
  // confirms/corrects it before the row is created (category is NOT NULL, etc.).
  const [form, setForm] = useState({
    name_original: nf(ff.name_original) || nf(ff.name_en) || '',
    name_en: nf(ff.name_en) || '',
    category: nf(ff.category) || 'other',
    city: nf(ff.city) || '',
    country: nf(ff.country) || 'China',
    email: nf(ff.email) || '',
    phone: nf(ff.phone) || '',
  });
  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  useEffect(() => { fetchFactories().then(setFacs).catch(() => setFacs([])); }, []);
  const shown = (facs || []).filter((f) => !q.trim() || [f.company_name, f.company_name_latin].filter(Boolean).join(' ').toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40);

  const confirm = async () => {
    if (mode === 'existing' && !existingId) { setErr(isAr ? 'اختر مورّداً' : 'Pick a supplier'); return; }
    if (mode === 'new' && !form.name_original.trim() && !form.name_en.trim()) { setErr(isAr ? 'أدخل اسم المصنع' : 'Enter the factory name'); return; }
    setBusy(true); setErr('');
    try {
      const fields = mode === 'new'
        ? { ...ff, name_original: form.name_original.trim(), name_en: form.name_en.trim(), category: form.category || 'other', city: form.city.trim(), country: form.country.trim() || 'China', email: form.email.trim(), phone: form.phone.trim() }
        : ff;
      const fid = await resolveFactory({ importId, mode, fields, existingId: mode === 'existing' ? existingId : undefined, profileImage: null });
      onAssigned(fid);
    } catch (e) { setErr(e.message || 'assign failed'); setBusy(false); }
  };

  return (
    <>
      <div className="ac-card">
        <p className="ac-card-title">{isAr ? 'إلى أي مورّد؟' : 'To which supplier?'}</p>
        <div className="ac-chiprow" style={{ marginBottom: 16 }}>
          <button className={`ac-chip${mode === 'new' ? ' on' : ''}`} onClick={() => setMode('new')}>{isAr ? 'إنشاء مورّد جديد' : 'Create new supplier'}</button>
          <button className={`ac-chip${mode === 'existing' ? ' on' : ''}`} onClick={() => setMode('existing')}>{isAr ? 'إرفاق بموجود' : 'Attach to existing'}</button>
        </div>

        {mode === 'new' ? (
          <div className="ac-form-grid">
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'اسم المصنع (الأصلي)' : 'Company name (original)'}</label>
              <input className="ac-input" value={form.name_original} onChange={(e) => set('name_original', e.target.value)} /></div>
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'الاسم اللاتيني' : 'Latin name'}</label>
              <input className="ac-input" value={form.name_en} onChange={(e) => set('name_en', e.target.value)} dir="ltr" /></div>
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'الفئة *' : 'Category *'}</label>
              <select className="ac-input" value={form.category} onChange={(e) => set('category', e.target.value)}>{cats.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}</select></div>
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'المدينة' : 'City'}</label>
              <input className="ac-input" value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'الدولة' : 'Country'}</label>
              <input className="ac-input" value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'الإيميل' : 'Email'}</label>
              <input className="ac-input" value={form.email} onChange={(e) => set('email', e.target.value)} dir="ltr" placeholder="factory@example.com" /></div>
            <div className="ac-field"><label className="ac-flabel">{isAr ? 'الهاتف / واتساب' : 'Phone / WhatsApp'}</label>
              <input className="ac-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} dir="ltr" placeholder="+8613800138000" /></div>
          </div>
        ) : (
          <>
            <input className="ac-input" style={{ marginBottom: 10 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAr ? 'ابحث عن المورّد…' : 'Search supplier…'} />
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--ac-line)', borderRadius: 10 }}>
              {facs == null ? <div className="ac-placeholder">…</div> : shown.map((f) => (
                <button key={f.id} onClick={() => setExistingId(f.id)} style={{ display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left', padding: '10px 12px', border: 'none', borderBottom: '1px solid var(--ac-line)', background: existingId === f.id ? 'var(--ac-hover)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                  {existingId === f.id ? '✓ ' : ''}{nf(f.company_name) || nf(f.company_name_latin) || '—'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="ac-savebar"><button className="ac-btn ac-btn-primary" onClick={confirm} disabled={busy}>{busy ? (isAr ? 'جارٍ…' : 'Working…') : (isAr ? 'التالي: النشر' : 'Next: publish')}</button></div>
    </>
  );
}

// ── Step 5: Publish ──────────────────────────────────────────────────────────
function PublishStep({ isAr, lang, batch, products, importId, factoryId, nav, setErr }) {
  const ff = batch?.factory_fields || {};
  const cat = displayCategoryForCode(ff.category);
  const meta = { factoryName: nf(ff.name_original) || nf(ff.name_en) || 'Factory', categoryAr: cat?.label?.ar, categoryEn: cat?.label?.en };
  const pending = products.filter((p) => p.status !== 'skipped' && p.status !== 'approved');
  const highN = products.filter((p) => (p.status === 'pending') && (p.confidence_score ?? 0) >= HIGH_CONF).length;
  const [scope, setScope] = useState('all');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const publish = async () => {
    setBusy(true); setErr('');
    try {
      if (scope === 'high') await bulkApproveHighConfidence(factoryId, products, meta);
      else await approveProducts(factoryId, pending, meta);
      await finalizeImport(importId);
      setDone(true);
    } catch (e) { setErr(e.message || 'publish failed'); setBusy(false); }
  };

  if (done) {
    return (
      <div className="ac-card" style={{ textAlign: 'center', padding: '44px 24px' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
        <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--ac-ink)', margin: '0 0 6px' }}>{isAr ? 'تم النشر' : 'Published'}</p>
        <p style={{ fontSize: 13, color: 'var(--ac-muted)', margin: '0 0 20px' }}>{isAr ? 'أضيفت المنتجات إلى المورّد.' : 'Products added to the supplier.'}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="ac-btn ac-btn-primary" onClick={() => nav(`/admin2/suppliers/${factoryId}`)}>{isAr ? 'فتح المورّد' : 'Open supplier'}</button>
          <button className="ac-btn" onClick={() => nav('/admin2/import')}>{isAr ? 'استيراد آخر' : 'Import another'}</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ac-card">
        <p className="ac-card-title">{isAr ? 'ما الذي يُنشر؟' : 'What to publish?'}</p>
        <label className="ac-toggle-row" style={{ cursor: 'pointer' }}>
          <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{isAr ? `كل المنتجات (${pending.length})` : `All products (${pending.length})`}</div></div>
          <input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} style={{ width: 18, height: 18, accentColor: '#1a1814' }} />
        </label>
        <label className="ac-toggle-row" style={{ cursor: 'pointer' }}>
          <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{isAr ? `عالية الثقة فقط (${highN})` : `High-confidence only (${highN})`}</div><div style={{ fontSize: 12, color: 'var(--ac-faint)' }}>{isAr ? 'راجع الباقي لاحقاً' : 'Review the rest later'}</div></div>
          <input type="radio" checked={scope === 'high'} onChange={() => setScope('high')} style={{ width: 18, height: 18, accentColor: '#1a1814' }} />
        </label>
      </div>
      <div className="ac-savebar"><button className="ac-btn ac-btn-primary" onClick={publish} disabled={busy}>{busy ? (isAr ? 'جارٍ النشر…' : 'Publishing…') : (isAr ? 'نشر' : 'Publish')}</button></div>
    </>
  );
}
