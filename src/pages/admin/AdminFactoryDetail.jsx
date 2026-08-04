import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import ProfileImagePicker from '../../components/admin/catalog/ProfileImagePicker';
import { UI_CATEGORIES } from '../../lib/supplierDashboardConstants';
import {
  fetchFactory, fetchFactoryProducts, fetchFactoryImagePool, updateFactory,
  updateFactoryProduct, deleteFactoryProduct, createFactoryProduct,
  archiveFactory, deleteFactory, uploadProfileImage,
} from '../../lib/catalogImport';

const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";
const nf = (v) => (v && v !== 'not_found' ? v : '');

const CSS = (isAr) => `
  .fd-page { padding: 32px 28px; max-width: 940px; }
  .fd-back { background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.45); font-size: 12px; font-family: ${FB}; padding: 0; margin-bottom: 12px; }
  .fd-title { margin: 0 0 4px; font-size: 24px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FH}; }
  .fd-sub { margin: 0 0 18px; font-size: 12px; color: rgba(0,0,0,0.42); font-family: ${FB}; }
  .fd-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; }
  .fd-h2 { margin: 0 0 14px; font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.8); font-family: ${FB}; }
  .fd-label { display: block; font-size: 11px; color: rgba(0,0,0,0.5); font-family: ${FB}; margin-bottom: 4px; }
  .fd-input { width: 100%; max-width: 440px; padding: 9px 12px; border: 1px solid rgba(0,0,0,0.14); border-radius: 8px; font-size: 14px; font-family: ${FB}; background: #fff; outline: none; box-sizing: border-box; }
  .fd-input:focus { border-color: rgba(0,0,0,0.35); }
  .fd-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .fd-btn { background: #1a1814; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13.5px; cursor: pointer; font-family: ${FB}; }
  .fd-btn:disabled { opacity: 0.55; cursor: default; }
  .fd-ghost { background: transparent; border: 1px solid rgba(0,0,0,0.16); border-radius: 8px; padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: ${FB}; }
  .fd-skip { background: transparent; border: 1px solid #c0503f; color: #c0503f; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; font-family: ${FB}; }
  .fd-msg { font-size: 13px; font-family: ${FB}; }
  .fd-pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .fd-pcard { border: 1px solid rgba(0,0,0,0.09); border-radius: 10px; overflow: hidden; background: #fff; }
  .fd-pimg { aspect-ratio: 1/1; background: #f0ebe1; }
  .fd-pimg img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .fd-pbody { padding: 9px 10px; }
  .fd-pname { font-size: 12px; font-weight: 500; color: rgba(0,0,0,0.82); margin: 0 0 7px; font-family: ${FB}; line-height: 1.4; min-height: 2.6em; overflow: hidden; }
  .fd-pact { display: flex; gap: 6px; }
  .fd-pbtn { flex: 1; font-size: 11.5px; padding: 5px; border-radius: 6px; cursor: pointer; font-family: ${FB}; border: 1px solid rgba(0,0,0,0.14); background: #fff; }
  .fd-pbtn.del { border-color: #c0503f; color: #c0503f; }
  .fd-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .fd-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 22px 24px; font-family: ${FB}; }
  @media (max-width: 760px) { .fd-page { padding: 20px 14px; } .fd-grid2 { grid-template-columns: 1fr; } }
`;

export default function AdminFactoryDetail({ user, profile, lang }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const cats = (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).filter((c) => c.val !== 'all');

  const [factory, setFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [f, setF] = useState({});            // editable factory fields
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);   // product being edited (or {} for new)
  const [busyP, setBusyP] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fac, prods, imgs] = await Promise.all([
        fetchFactory(id), fetchFactoryProducts(id), fetchFactoryImagePool(id),
      ]);
      setFactory(fac); setProducts(prods); setPool(imgs);
      setF({
        company_name: nf(fac?.company_name), company_name_latin: nf(fac?.company_name_latin),
        description_ar: nf(fac?.description_ar), description_en: nf(fac?.description_en),
        category: fac?.category || 'other', city: nf(fac?.city), address: nf(fac?.address),
        founded_year: fac?.founded_year || '', export_markets: nf(fac?.export_markets),
        moq_note: nf(fac?.moq_note), email: nf(fac?.email), phone: nf(fac?.phone),
        profile_image: fac?.profile_image || null,
        private_label: !!fac?.private_label, is_verified: !!fac?.is_verified, is_featured: !!fac?.is_featured,
      });
      setError('');
    } catch (e) { setError(e.message || 'Failed to load'); }
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const field = (label, key, opts = {}) => (
    <div style={{ marginBottom: 12 }}>
      <label className="fd-label">{label}</label>
      <input className="fd-input" value={f[key] ?? ''} onChange={(e) => set(key, e.target.value)}
        dir={opts.ltr ? 'ltr' : (isAr ? 'rtl' : 'ltr')} placeholder={opts.ph || ''} />
    </div>
  );
  const area = (label, key, opts = {}) => (
    <div style={{ marginBottom: 12 }}>
      <label className="fd-label">{label}</label>
      <textarea className="fd-input" rows={3} value={f[key] ?? ''} onChange={(e) => set(key, e.target.value)}
        dir={opts.ltr ? 'ltr' : (isAr ? 'rtl' : 'ltr')} style={{ resize: 'vertical', minHeight: 60, maxWidth: '100%' }} />
    </div>
  );
  const toggle = (label, key) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13, fontFamily: FB }}>
      <input type="checkbox" checked={!!f[key]} onChange={(e) => set(key, e.target.checked)} />{label}
    </label>
  );

  async function saveFactory() {
    setSaving(true); setMsg('');
    try {
      const yr = parseInt(String(f.founded_year).trim(), 10);
      await updateFactory(id, {
        company_name: nf(f.company_name) || factory.company_name,
        company_name_latin: nf(f.company_name_latin) || null,
        description_ar: nf(f.description_ar) || null, description_en: nf(f.description_en) || null,
        category: f.category, city: nf(f.city) || null, address: nf(f.address) || null,
        founded_year: Number.isFinite(yr) && yr >= 1800 && yr <= 2100 ? yr : null,
        export_markets: nf(f.export_markets) || null, moq_note: nf(f.moq_note) || null,
        ...(nf(f.email) ? { email: nf(f.email) } : {}), phone: nf(f.phone) || null,
        profile_image: f.profile_image || null,
        private_label: !!f.private_label, is_verified: !!f.is_verified, is_featured: !!f.is_featured,
      });
      setMsg(isAr ? '✓ تم الحفظ.' : '✓ Saved.');
      load();
    } catch (e) { setMsg((isAr ? 'خطأ: ' : 'Error: ') + (e.message || '')); }
    setSaving(false);
  }

  async function togglePublish() {
    setSaving(true); setMsg('');
    try { await archiveFactory(id, !factory.is_active); setFactory((x) => ({ ...x, is_active: !x.is_active })); }
    catch (e) { setMsg((isAr ? 'خطأ: ' : 'Error: ') + (e.message || '')); }
    setSaving(false);
  }
  async function removeFactory() {
    if (!window.confirm(isAr ? 'حذف المصنع وكل منتجاته نهائياً؟' : 'Delete the factory and all its products?')) return;
    try { await deleteFactory(id); nav('/admin/factories'); }
    catch (e) { setMsg(e.code === 'HAS_REQUESTS' ? (isAr ? 'لا يمكن الحذف — يوجد طلب مرتبط. استخدم «إخفاء».' : 'Cannot delete — a request is linked. Use Hide.') : (e.message || '')); }
  }

  const pName = (p) => (isAr ? (nf(p.name_ar) || nf(p.name_en)) : (nf(p.name_en) || nf(p.name_ar))) || '—';

  async function saveProduct() {
    setBusyP(true);
    try {
      const patch = {
        name_ar: nf(editing.name_ar) || null, name_en: nf(editing.name_en) || null,
        description_ar: nf(editing.description_ar) || null, description_en: nf(editing.description_en) || null,
        specifications_ar: nf(editing.specifications_ar) || null, specifications_en: nf(editing.specifications_en) || null,
        moq: nf(editing.moq) || null, ref_code: nf(editing.ref_code) || null, image: editing.image || null,
        price: nf(editing.price) || null, currency: nf(editing.currency) || null,
        section_ar: nf(editing.section_ar) || null, section_en: nf(editing.section_en) || null,
        gallery_images: Array.isArray(editing.gallery_images) ? editing.gallery_images.filter(Boolean) : [],
      };
      if (editing.id) {
        await updateFactoryProduct(editing.id, patch);
      } else {
        if (!patch.name_ar && !patch.name_en) { alert(isAr ? 'أدخل اسم المنتج.' : 'Enter a product name.'); setBusyP(false); return; }
        await createFactoryProduct(id, patch);
      }
      setEditing(null); load();
    } catch (e) { alert((isAr ? 'خطأ: ' : 'Error: ') + (e.message || '')); }
    setBusyP(false);
  }
  async function removeProduct(p) {
    if (!window.confirm(isAr ? `حذف «${pName(p)}»؟` : `Delete "${pName(p)}"?`)) return;
    try { await deleteFactoryProduct(p.id); setProducts((ps) => ps.filter((x) => x.id !== p.id)); }
    catch (e) { alert(e.message || 'Delete failed'); }
  }

  const eSet = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  // Upload an image from the admin's device (logo or a product image) into this
  // factory's folder, add it to the pool, and select it. Persisted on Save.
  const uploadFor = (apply) => async (file) => {
    const url = await uploadProfileImage(id, file);
    setPool((prev) => (prev.includes(url) ? prev : [url, ...prev]));
    apply(url);
  };

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS(isAr)}</style>
        <div className="fd-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="fd-back" onClick={() => nav('/admin/factories')}>{isAr ? '→ رجوع للمصانع' : '← Back to factories'}</button>
          {loading ? <p className="fd-sub">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
            : error ? <div className="fd-card" style={{ color: '#c0392b' }}>{error}</div>
              : !factory ? <div className="fd-card">{isAr ? 'المصنع غير موجود' : 'Factory not found'}</div>
                : (
                  <>
                    <h1 className="fd-title">{factory.company_name}</h1>
                    <p className="fd-sub">
                      {products.length} {isAr ? 'منتج' : 'products'} · {factory.is_active ? (isAr ? 'منشور' : 'Live') : (isAr ? 'مخفي' : 'Hidden')}
                    </p>

                    {/* Fields */}
                    <div className="fd-card">
                      <h2 className="fd-h2">{isAr ? 'بيانات المصنع' : 'Factory details'}</h2>
                      <div className="fd-grid2">
                        {field(isAr ? 'اسم المصنع' : 'Name', 'company_name')}
                        {field(isAr ? 'الاسم بالإنجليزية' : 'English name', 'company_name_latin', { ltr: true })}
                      </div>
                      {area(isAr ? 'الوصف (عربي)' : 'Description (Arabic)', 'description_ar')}
                      {area(isAr ? 'الوصف (إنجليزي)' : 'Description (English)', 'description_en', { ltr: true })}
                      <div className="fd-grid2">
                        <div style={{ marginBottom: 12 }}>
                          <label className="fd-label">{isAr ? 'التصنيف' : 'Category'}</label>
                          <select className="fd-input" value={f.category || ''} onChange={(e) => set('category', e.target.value)}>
                            {cats.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}
                          </select>
                        </div>
                        {field(isAr ? 'المدينة' : 'City', 'city')}
                        {field(isAr ? 'العنوان (يظهر للمشترين)' : 'Address (public)', 'address')}
                        {field(isAr ? 'سنة التأسيس' : 'Founded year', 'founded_year', { ltr: true })}
                        {field(isAr ? 'أسواق التصدير' : 'Export markets', 'export_markets', { ltr: true })}
                        {field(isAr ? 'الحد الأدنى (MOQ)' : 'MOQ', 'moq_note')}
                        {field(isAr ? 'البريد (يظهر لك فقط)' : 'Email (admin-only)', 'email', { ltr: true })}
                        {field(isAr ? 'الجوال (يظهر لك فقط)' : 'Phone (admin-only)', 'phone', { ltr: true })}
                      </div>
                      <div style={{ marginTop: 6, marginBottom: 14 }}>
                        {toggle(isAr ? 'يصنّع العلامة الخاصة (OEM/ODM)' : 'Private label (OEM/ODM)', 'private_label')}
                        {toggle(isAr ? 'مصنع موثّق' : 'Verified', 'is_verified')}
                        {toggle(isAr ? 'موصى به' : 'Recommended', 'is_featured')}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="fd-btn" onClick={saveFactory} disabled={saving}>{saving ? (isAr ? 'جارٍ…' : '…') : (isAr ? 'حفظ' : 'Save')}</button>
                        {msg && <span className="fd-msg" style={{ color: msg.startsWith('✓') ? '#3f9d5a' : '#c0392b' }}>{msg}</span>}
                      </div>
                    </div>

                    {/* Logo */}
                    <div className="fd-card">
                      <h2 className="fd-h2">{isAr ? 'شعار / صورة المصنع' : 'Logo / profile image'}</h2>
                      <ProfileImagePicker candidates={pool} selected={f.profile_image} onSelect={(u) => set('profile_image', u)} lang={lang} onUploadFile={uploadFor((u) => set('profile_image', u))} />
                      <p className="fd-label" style={{ marginTop: 10 }}>{isAr ? 'اختر من الصور أو ارفع لوقو من جهازك، ثم اضغط «حفظ» بالأعلى.' : 'Pick one or upload a logo from your device, then Save above.'}</p>
                    </div>

                    {/* Products */}
                    <div className="fd-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h2 className="fd-h2" style={{ margin: 0 }}>{isAr ? `المنتجات (${products.length})` : `Products (${products.length})`}</h2>
                        <button className="fd-btn" onClick={() => setEditing({ image: pool[0] || null })}>{isAr ? '+ إضافة منتج' : '+ Add product'}</button>
                      </div>
                      {products.length === 0 ? <p className="fd-label">{isAr ? 'لا توجد منتجات.' : 'No products.'}</p> : (
                        <div className="fd-pgrid">
                          {products.map((p) => (
                            <div className="fd-pcard" key={p.id}>
                              <div className="fd-pimg">{p.image && <img src={p.image} alt="" loading="lazy" />}</div>
                              <div className="fd-pbody">
                                <p className="fd-pname">{pName(p)}</p>
                                <div className="fd-pact">
                                  <button className="fd-pbtn" onClick={() => setEditing({ ...p })}>{isAr ? 'تعديل' : 'Edit'}</button>
                                  <button className="fd-pbtn del" onClick={() => removeProduct(p)}>{isAr ? 'حذف' : 'Delete'}</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Danger */}
                    <div className="fd-card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button className="fd-ghost" onClick={togglePublish} disabled={saving}>
                        {factory.is_active ? (isAr ? 'إخفاء من الموقع' : 'Hide from site') : (isAr ? 'نشر المصنع' : 'Publish')}
                      </button>
                      <button className="fd-skip" onClick={removeFactory}>{isAr ? 'حذف المصنع نهائياً' : 'Delete factory'}</button>
                    </div>
                  </>
                )}
        </div>

        {/* Product edit / add modal */}
        {editing && (
          <div className="fd-modal-bg" onClick={() => !busyP && setEditing(null)}>
            <div className="fd-modal" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
              <h2 className="fd-h2">{editing.id ? (isAr ? 'تعديل المنتج' : 'Edit product') : (isAr ? 'منتج جديد' : 'New product')}</h2>
              <label className="fd-label">{isAr ? 'الصورة الرئيسية (اختر من الكتالوج أو ارفع من جهازك)' : 'Main image (pick from catalog or upload from device)'}</label>
              <ProfileImagePicker candidates={pool} selected={editing.image} onSelect={(u) => eSet('image', u)} lang={lang} onUploadFile={uploadFor((u) => eSet('image', u))} />

              {/* Gallery — extra angle images (Amazon-style). Primary + these show on the product page. */}
              {(() => {
                const gal = Array.isArray(editing.gallery_images) ? editing.gallery_images : [];
                const addGal = (u) => { if (u && !gal.includes(u)) eSet('gallery_images', [...gal, u]); };
                const rmGal = (u) => eSet('gallery_images', gal.filter((x) => x !== u));
                const addable = pool.filter((u) => u !== editing.image && !gal.includes(u));
                return (
                  <div style={{ marginTop: 14 }}>
                    <label className="fd-label">{isAr ? `صور إضافية / معرض (${gal.length})` : `Gallery — extra images (${gal.length})`}</label>
                    {gal.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {gal.map((u) => (
                          <div key={u} style={{ position: 'relative', width: 56, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.14)', background: '#fff' }}>
                            <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <button type="button" onClick={() => rmGal(u)} title={isAr ? 'إزالة' : 'Remove'}
                              style={{ position: 'absolute', top: 0, insetInlineEnd: 0, background: 'rgba(192,80,63,0.92)', color: '#fff', border: 'none', width: 18, height: 18, lineHeight: '16px', cursor: 'pointer', fontSize: 12, padding: 0 }}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <ProfileImagePicker candidates={addable} selected={null} onSelect={addGal} lang={lang} onUploadFile={uploadFor(addGal)} />
                    <p className="fd-label" style={{ marginTop: 4 }}>{isAr ? 'اضغط صورة لإضافتها للمعرض، أو ارفع من جهازك.' : 'Click an image to add it to the gallery, or upload from your device.'}</p>
                  </div>
                );
              })()}
              <div className="fd-grid2" style={{ marginTop: 14 }}>
                <div><label className="fd-label">{isAr ? 'الاسم (ع)' : 'Name (AR)'}</label><input className="fd-input" dir="rtl" value={nf(editing.name_ar)} onChange={(e) => eSet('name_ar', e.target.value)} /></div>
                <div><label className="fd-label">{isAr ? 'الاسم (EN)' : 'Name (EN)'}</label><input className="fd-input" dir="ltr" value={nf(editing.name_en)} onChange={(e) => eSet('name_en', e.target.value)} /></div>
              </div>
              <div className="fd-grid2">
                <div><label className="fd-label">{isAr ? 'القسم (ع)' : 'Section (AR)'}</label><input className="fd-input" dir="rtl" placeholder={isAr ? 'نسائي / رجالي…' : ''} value={nf(editing.section_ar)} onChange={(e) => eSet('section_ar', e.target.value)} /></div>
                <div><label className="fd-label">{isAr ? 'القسم (EN)' : 'Section (EN)'}</label><input className="fd-input" dir="ltr" placeholder="Women / Men…" value={nf(editing.section_en)} onChange={(e) => eSet('section_en', e.target.value)} /></div>
              </div>
              <div className="fd-grid2">
                <div><label className="fd-label">{isAr ? 'الوصف (ع)' : 'Description (AR)'}</label><textarea className="fd-input" rows={2} dir="rtl" style={{ resize: 'vertical', maxWidth: '100%' }} value={nf(editing.description_ar)} onChange={(e) => eSet('description_ar', e.target.value)} /></div>
                <div><label className="fd-label">{isAr ? 'الوصف (EN)' : 'Description (EN)'}</label><textarea className="fd-input" rows={2} dir="ltr" style={{ resize: 'vertical', maxWidth: '100%' }} value={nf(editing.description_en)} onChange={(e) => eSet('description_en', e.target.value)} /></div>
              </div>
              <div className="fd-grid2">
                <div><label className="fd-label">{isAr ? 'المواصفات (ع)' : 'Specs (AR)'}</label><textarea className="fd-input" rows={2} dir="rtl" style={{ resize: 'vertical', maxWidth: '100%' }} value={nf(editing.specifications_ar)} onChange={(e) => eSet('specifications_ar', e.target.value)} /></div>
                <div><label className="fd-label">{isAr ? 'المواصفات (EN)' : 'Specs (EN)'}</label><textarea className="fd-input" rows={2} dir="ltr" style={{ resize: 'vertical', maxWidth: '100%' }} value={nf(editing.specifications_en)} onChange={(e) => eSet('specifications_en', e.target.value)} /></div>
              </div>
              <div className="fd-grid2">
                {['moq', 'ref_code'].map((k) => (
                  <div key={k}><label className="fd-label">{k === 'moq' ? (isAr ? 'الحد الأدنى' : 'MOQ') : (isAr ? 'رمز المنتج' : 'Ref code')}</label><input className="fd-input" dir="ltr" value={nf(editing[k])} onChange={(e) => eSet(k, e.target.value)} /></div>
                ))}
              </div>
              <div className="fd-grid2">
                <div><label className="fd-label">{isAr ? 'السعر (فارغ = عند الطلب)' : 'Price (empty = on request)'}</label><input className="fd-input" dir={isAr ? 'rtl' : 'ltr'} placeholder={isAr ? 'مثال: $12 أو ١٠-١٥' : 'e.g. $12 or 10–15'} value={nf(editing.price)} onChange={(e) => eSet('price', e.target.value)} /></div>
                <div><label className="fd-label">{isAr ? 'العملة' : 'Currency'}</label><input className="fd-input" dir="ltr" placeholder="USD" value={nf(editing.currency)} onChange={(e) => eSet('currency', e.target.value)} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button className="fd-btn" onClick={saveProduct} disabled={busyP}>{busyP ? (isAr ? 'جارٍ…' : '…') : (isAr ? 'حفظ' : 'Save')}</button>
                <button className="fd-ghost" onClick={() => setEditing(null)} disabled={busyP}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        )}
      </AdminShell>
    </AdminRouteGuard>
  );
}
