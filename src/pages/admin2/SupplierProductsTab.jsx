import React, { useEffect, useMemo, useState } from 'react';
import { fetchFactoryProducts, updateFactoryProduct, deleteFactoryProduct, fetchFactories, setAllFactoryProductsPrice } from '../../lib/catalogImport';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const CURRENCIES = ['', 'USD', 'CNY', 'SAR', 'AED', 'EUR'];

const rel = (iso, isAr) => {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return isAr ? 'اليوم' : 'today';
  if (d < 30) return isAr ? `${d} يوم` : `${d}d`;
  return isAr ? `${Math.floor(d / 30)} شهر` : `${Math.floor(d / 30)}mo`;
};

function Modal({ title, onClose, children }) {
  return (
    <div className="ac-modal-ov" onClick={onClose}>
      <div className="ac-modal" onClick={(e) => e.stopPropagation()}>
        <p className="ac-modal-title">{title}</p>
        {children}
      </div>
    </div>
  );
}

export default function SupplierProductsTab({ factoryId, lang, isAr, flash }) {
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(() => new Set());
  const [edit, setEdit] = useState(null);      // product being edited
  const [bulk, setBulk] = useState(null);      // 'price' | 'section' | 'move'
  const [busy, setBusy] = useState(false);

  const load = async () => { try { setRows(await fetchFactoryProducts(factoryId)); } catch { setRows([]); } };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [factoryId]);

  const pName = (p) => (isAr ? (nf(p.name_ar) || nf(p.name_en)) : lang === 'zh' ? (nf(p.name_zh) || nf(p.name_en)) : (nf(p.name_en) || nf(p.name_ar))) || '—';
  const priceText = (p) => { const v = nf(p.price); if (!v) return null; const c = nf(p.currency); return c && !v.toLowerCase().includes(c.toLowerCase()) ? `${v} ${c}` : v; };

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((p) => [p.name_ar, p.name_en, p.ref_code, p.section_ar, p.section_en].filter(Boolean).join(' ').toLowerCase().includes(s));
  }, [rows, q]);

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = filtered.length > 0 && filtered.every((p) => sel.has(p.id));
  const selectAll = () => setSel(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  const clearSel = () => setSel(new Set());
  const selectedRows = () => (rows || []).filter((p) => sel.has(p.id));

  const applyPatch = async (ids, patch) => {
    setBusy(true);
    try {
      await Promise.all(ids.map((id) => updateFactoryProduct(id, patch)));
      setRows((rs) => rs.map((p) => (ids.includes(p.id) ? { ...p, ...patch } : p)));
      flash(isAr ? 'تم التحديث' : 'Updated');
    } catch (e) { flash(isAr ? 'تعذّر التحديث' : 'Update failed'); }
    setBusy(false);
  };

  const bulkDelete = async () => {
    const ids = [...sel];
    if (!ids.length || !window.confirm(isAr ? `حذف ${ids.length} منتج؟` : `Delete ${ids.length} products?`)) return;
    setBusy(true);
    try {
      await Promise.all(ids.map((id) => deleteFactoryProduct(id)));
      setRows((rs) => rs.filter((p) => !sel.has(p.id)));
      clearSel(); flash(isAr ? 'حُذف' : 'Deleted');
    } catch { flash(isAr ? 'تعذّر الحذف' : 'Delete failed'); }
    setBusy(false);
  };

  const delOne = async (p) => {
    if (!window.confirm(isAr ? `حذف "${pName(p)}"؟` : `Delete "${pName(p)}"?`)) return;
    try { await deleteFactoryProduct(p.id); setRows((rs) => rs.filter((x) => x.id !== p.id)); flash(isAr ? 'حُذف' : 'Deleted'); }
    catch { flash(isAr ? 'تعذّر الحذف' : 'Delete failed'); }
  };

  const preview = (p) => window.open(`${window.location.origin}/factory/${factoryId}/product/${p.id}`, '_blank');

  if (rows == null) return <div className="ac-pgrid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="ac-skel" style={{ height: 240 }} />)}</div>;

  return (
    <div style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      <div className="ac-toolbar">
        <input className="ac-input" style={{ flex: '1 1 220px' }} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={isAr ? 'ابحث بالاسم أو الكود…' : 'Search name or SKU…'} />
        <button className="ac-btn ac-btn-sm" onClick={selectAll}>{allSelected ? (isAr ? 'إلغاء الكل' : 'Deselect all') : (isAr ? 'تحديد الكل' : 'Select all')}</button>
        {rows.length > 0 && (
          <button className="ac-btn ac-btn-sm" onClick={() => setBulk('priceAll')} title={isAr ? 'طبّق سعرًا واحدًا على كل منتجات المصنع' : 'Apply one price to every product'}>
            {isAr ? 'سعر موحّد للكل' : 'Uniform price'}
          </button>
        )}
        <span style={{ fontSize: 12.5, color: 'var(--ac-faint)' }}>{isAr ? `${filtered.length} منتج` : `${filtered.length} products`}</span>
      </div>

      {sel.size > 0 && (
        <div className="ac-bulkbar">
          <span className="ac-bulk-count">{isAr ? `${sel.size} محدّد` : `${sel.size} selected`}</span>
          <button className="ac-btn ac-btn-sm" onClick={() => setBulk('price')}>{isAr ? 'تسعير' : 'Pricing'}</button>
          <button className="ac-btn ac-btn-sm" onClick={() => setBulk('section')}>{isAr ? 'القسم/الفئة' : 'Category'}</button>
          <button className="ac-btn ac-btn-sm" onClick={() => setBulk('move')}>{isAr ? 'نقل' : 'Move'}</button>
          <button className="ac-btn ac-btn-sm" style={{ color: 'var(--ac-danger)' }} onClick={bulkDelete} disabled={busy}>{isAr ? 'حذف' : 'Delete'}</button>
          <button className="ac-bulk-x" onClick={clearSel}>{isAr ? 'مسح ✕' : 'Clear ✕'}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="ac-placeholder">{isAr ? 'لا توجد منتجات.' : 'No products.'}</div>
      ) : (
        <div className="ac-pgrid">
          {filtered.map((p) => {
            const pt = priceText(p);
            return (
              <div className={`ac-pcard${sel.has(p.id) ? ' sel' : ''}`} key={p.id}>
                <div style={{ position: 'relative' }}>
                  {p.image ? <img className="ac-pcard-img" src={p.image} alt="" loading="lazy" onClick={() => preview(p)} /> : <div className="ac-pcard-noimg">{isAr ? 'بلا صورة' : 'No image'}</div>}
                  <button className={`ac-pcheck${sel.has(p.id) ? ' on' : ''}`} onClick={() => toggle(p.id)} aria-label="select">{sel.has(p.id) ? '✓' : ''}</button>
                </div>
                <div className="ac-pbody">
                  <p className="ac-pname">{pName(p)}</p>
                  <div className="ac-pmeta">
                    {nf(p.ref_code) && <span dir="ltr">{p.ref_code}</span>}
                    {pt ? <span className="ac-badge ok" style={{ height: 18 }}>{pt}</span> : <span className="ac-badge neutral" style={{ height: 18 }}>{isAr ? 'عند الطلب' : 'On request'}</span>}
                  </div>
                  <div className="ac-pmeta">
                    {nf(p.moq) && <span>{isAr ? 'الحد الأدنى' : 'MOQ'}: {p.moq}</span>}
                    <span>{rel(p.updated_at || p.created_at, isAr)}</span>
                  </div>
                  <div className="ac-pactions">
                    <button className="ac-btn ac-btn-sm" style={{ flex: 1 }} onClick={() => preview(p)}>{isAr ? 'معاينة' : 'Preview'}</button>
                    <button className="ac-btn ac-btn-sm" style={{ flex: 1 }} onClick={() => setEdit(p)}>{isAr ? 'تعديل' : 'Edit'}</button>
                    <button className="ac-iconbtn danger" onClick={() => delOne(p)} title={isAr ? 'حذف' : 'Delete'}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {edit && <EditModal p={edit} isAr={isAr} onClose={() => setEdit(null)} onSave={async (patch) => { await applyPatch([edit.id], patch); setEdit(null); }} />}
      {bulk === 'price' && <BulkPriceModal count={sel.size} isAr={isAr} onClose={() => setBulk(null)} onApply={async (patch) => { await applyPatch([...sel], patch); setBulk(null); }} />}
      {bulk === 'priceAll' && <BulkPriceModal count={rows.length} allProducts isAr={isAr} onClose={() => setBulk(null)}
        onApply={async (patch) => {
          setBusy(true);
          try {
            await setAllFactoryProductsPrice(factoryId, patch.price, patch.currency);
            setRows((rs) => rs.map((p) => ({ ...p, price: patch.price, currency: patch.currency })));
            flash(isAr ? 'طُبّق السعر على كل المنتجات' : 'Price applied to all products');
          } catch { flash(isAr ? 'تعذّر التحديث' : 'Update failed'); }
          setBusy(false); setBulk(null);
        }} />}
      {bulk === 'section' && <BulkSectionModal count={sel.size} isAr={isAr} onClose={() => setBulk(null)} onApply={async (patch) => { await applyPatch([...sel], patch); setBulk(null); }} />}
      {bulk === 'move' && <BulkMoveModal count={sel.size} isAr={isAr} currentId={factoryId} onClose={() => setBulk(null)}
        onApply={async (targetId) => { const ids = [...sel]; await Promise.all(ids.map((id) => updateFactoryProduct(id, { factory_id: targetId }))); setRows((rs) => rs.filter((p) => !sel.has(p.id))); clearSel(); setBulk(null); flash(isAr ? 'تم النقل' : 'Moved'); }} />}
    </div>
  );
}

// ── Single edit ──────────────────────────────────────────────────────────────
function EditModal({ p, isAr, onClose, onSave }) {
  const [f, setF] = useState({ name_ar: p.name_ar || '', name_en: p.name_en || '', ref_code: p.ref_code || '', price: p.price || '', currency: p.currency || '', moq: p.moq || '', section_ar: p.section_ar || '', section_en: p.section_en || '' });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const [saving, setSaving] = useState(false);
  const F = ({ k, label, ltr }) => (
    <div className="ac-field"><label className="ac-flabel">{label}</label>
      <input className="ac-input" value={f[k]} onChange={(e) => set(k, e.target.value)} dir={ltr ? 'ltr' : undefined} /></div>
  );
  return (
    <Modal title={isAr ? 'تعديل المنتج' : 'Edit product'} onClose={onClose}>
      <div className="ac-form-grid" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <F k="name_ar" label={isAr ? 'الاسم (عربي)' : 'Name (Arabic)'} />
        <F k="name_en" label={isAr ? 'الاسم (إنجليزي)' : 'Name (English)'} ltr />
        <F k="ref_code" label={isAr ? 'الكود (SKU)' : 'SKU'} ltr />
        <F k="moq" label={isAr ? 'الحد الأدنى' : 'MOQ'} />
        <F k="price" label={isAr ? 'السعر' : 'Price'} ltr />
        <div className="ac-field"><label className="ac-flabel">{isAr ? 'العملة' : 'Currency'}</label>
          <select className="ac-input" value={f.currency} onChange={(e) => set('currency', e.target.value)}>{CURRENCIES.map((c) => <option key={c} value={c}>{c || '—'}</option>)}</select></div>
        <F k="section_ar" label={isAr ? 'القسم (عربي)' : 'Section (Arabic)'} />
        <F k="section_en" label={isAr ? 'القسم (إنجليزي)' : 'Section (English)'} ltr />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <button className="ac-btn" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
        <button className="ac-btn ac-btn-primary" disabled={saving} onClick={async () => { setSaving(true); await onSave({ name_ar: f.name_ar.trim() || null, name_en: f.name_en.trim() || null, ref_code: f.ref_code.trim() || null, price: f.price.trim() || null, currency: f.currency || null, moq: f.moq.trim() || null, section_ar: f.section_ar.trim() || null, section_en: f.section_en.trim() || null }); }}>
          {saving ? (isAr ? 'جارٍ…' : 'Saving…') : (isAr ? 'حفظ' : 'Save')}
        </button>
      </div>
    </Modal>
  );
}

// ── Bulk pricing ─────────────────────────────────────────────────────────────
function BulkPriceModal({ count, isAr, onClose, onApply, allProducts = false }) {
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const title = allProducts
    ? (isAr ? `سعر موحّد لكل المنتجات (${count})` : `Uniform price — all ${count} products`)
    : (isAr ? `تسعير ${count} منتج` : `Price ${count} products`);
  return (
    <Modal title={title} onClose={onClose}>
      <div style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {allProducts && (
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--ac-faint)', lineHeight: 1.6 }}>
            {isAr ? 'يستبدل سعر كل منتجات هذا المصنع بالسعر أدناه (يشمل المسعّرة سابقًا).'
              : 'Overwrites the price on every product of this factory (including already-priced ones).'}
          </p>
        )}
        <div className="ac-form-grid">
          <div className="ac-field"><label className="ac-flabel">{isAr ? 'السعر' : 'Price'}</label>
            <input className="ac-input" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" placeholder={isAr ? 'مثال: 12.50' : 'e.g. 12.50'} /></div>
          <div className="ac-field"><label className="ac-flabel">{isAr ? 'العملة' : 'Currency'}</label>
            <select className="ac-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <button className="ac-btn" onClick={() => onApply({ price: null, currency: null })}>{isAr ? 'اجعلها "عند الطلب"' : 'Mark on request'}</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="ac-btn" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
            <button className="ac-btn ac-btn-primary" disabled={!price.trim()} onClick={() => onApply({ price: price.trim(), currency })}>{isAr ? 'تطبيق' : 'Apply'}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Bulk section/category ────────────────────────────────────────────────────
function BulkSectionModal({ count, isAr, onClose, onApply }) {
  const [ar, setAr] = useState('');
  const [en, setEn] = useState('');
  return (
    <Modal title={isAr ? `قسم ${count} منتج` : `Section for ${count} products`} onClose={onClose}>
      <div className="ac-form-grid" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <div className="ac-field"><label className="ac-flabel">{isAr ? 'القسم (عربي)' : 'Section (Arabic)'}</label>
          <input className="ac-input" value={ar} onChange={(e) => setAr(e.target.value)} /></div>
        <div className="ac-field"><label className="ac-flabel">{isAr ? 'القسم (إنجليزي)' : 'Section (English)'}</label>
          <input className="ac-input" value={en} onChange={(e) => setEn(e.target.value)} dir="ltr" /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
        <button className="ac-btn" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
        <button className="ac-btn ac-btn-primary" disabled={!ar.trim() && !en.trim()} onClick={() => onApply({ section_ar: ar.trim() || null, section_en: en.trim() || null })}>{isAr ? 'تطبيق' : 'Apply'}</button>
      </div>
    </Modal>
  );
}

// ── Bulk move ────────────────────────────────────────────────────────────────
function BulkMoveModal({ count, isAr, currentId, onClose, onApply }) {
  const [facs, setFacs] = useState(null);
  const [target, setTarget] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { fetchFactories().then((fs) => setFacs(fs.filter((f) => f.id !== currentId))).catch(() => setFacs([])); }, [currentId]);
  const shown = (facs || []).filter((f) => !q.trim() || [f.company_name, f.company_name_latin].filter(Boolean).join(' ').toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40);
  return (
    <Modal title={isAr ? `نقل ${count} منتج إلى مورّد آخر` : `Move ${count} products`} onClose={onClose}>
      <div style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <input className="ac-input" style={{ marginBottom: 10 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAr ? 'ابحث عن المورّد…' : 'Search supplier…'} />
        <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--ac-line)', borderRadius: 10 }}>
          {facs == null ? <div className="ac-placeholder">…</div> : shown.map((f) => (
            <button key={f.id} onClick={() => setTarget(f.id)} style={{ display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left', padding: '10px 12px', border: 'none', borderBottom: '1px solid var(--ac-line)', background: target === f.id ? 'var(--ac-hover)' : 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
              {target === f.id ? '✓ ' : ''}{nf(f.company_name) || nf(f.company_name_latin) || '—'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
          <button className="ac-btn" onClick={onClose}>{isAr ? 'إلغاء' : 'Cancel'}</button>
          <button className="ac-btn ac-btn-primary" disabled={!target || busy} onClick={async () => { setBusy(true); await onApply(target); }}>{busy ? (isAr ? 'جارٍ…' : 'Moving…') : (isAr ? 'نقل' : 'Move')}</button>
        </div>
      </div>
    </Modal>
  );
}
