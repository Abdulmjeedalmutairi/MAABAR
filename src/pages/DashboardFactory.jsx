import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import ProfileImagePicker from '../components/admin/catalog/ProfileImagePicker';
import { UI_CATEGORIES } from '../lib/supplierDashboardConstants';
import {
  fetchMyFactory, fetchFactoryProducts, fetchFactoryImagePool, updateFactory,
  updateFactoryProduct, deleteFactoryProduct, createFactoryProduct,
} from '../lib/catalogImport';
import { fetchMyFactoryThreads } from '../lib/factoryThreads';

// Self-service dashboard for a factory that has CLAIMED its directory row
// (role='supplier' + linked_supplier_id). It can edit its descriptive profile,
// pick its logo, manage its products, and publish/hide itself. Trust/identity
// columns (verified, featured, contact email) stay admin-frozen server-side.
const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";
const nf = (v) => (v && v !== 'not_found' ? v : '');

const T = {
  ar: {
    hi: 'لوحة المصنع', sub: 'حدّث ملفك ومنتجاتك — يظهر للتجّار في معبر.',
    tabProfile: 'الملف والمنتجات', tabMessages: 'المحادثات', buyer: 'مشتري محتمل',
    inboxEmpty: 'لا توجد محادثات بعد.', startChat: 'محادثة جديدة',
    signout: 'تسجيل الخروج', live: 'منشور', hidden: 'مخفي',
    publish: 'انشر مصنعك', hide: 'إخفاء من الموقع',
    details: 'بيانات المصنع', name: 'اسم المصنع', nameEn: 'الاسم بالإنجليزية',
    descAr: 'الوصف (عربي)', descEn: 'الوصف (إنجليزي)', category: 'التصنيف', city: 'المدينة',
    address: 'العنوان (يظهر للتجّار)', founded: 'سنة التأسيس', markets: 'أسواق التصدير',
    moq: 'الحد الأدنى (MOQ)', phone: 'جوال التواصل', privateLabel: 'يصنّع العلامة الخاصة (OEM/ODM)',
    save: 'حفظ', saving: 'جارٍ…', saved: '✓ تم الحفظ.', err: 'خطأ: ',
    logo: 'شعار / صورة المصنع', pick: 'اختر ثم اضغط «حفظ» بالأعلى.',
    products: 'المنتجات', add: '+ إضافة منتج', noProducts: 'لا توجد منتجات بعد.',
    edit: 'تعديل', del: 'حذف', editP: 'تعديل المنتج', newP: 'منتج جديد',
    img: 'الصورة', cancel: 'إلغاء', delConfirm: 'حذف هذا المنتج؟', needName: 'أدخل اسم المنتج.',
    frozen: 'التوثيق والاعتماد يديرهما فريق معبر.',
  },
  en: {
    hi: 'Factory dashboard', sub: 'Update your profile and products — shown to traders on Maabar.',
    tabProfile: 'Profile & products', tabMessages: 'Messages', buyer: 'Potential buyer',
    inboxEmpty: 'No conversations yet.', startChat: 'New conversation',
    signout: 'Sign out', live: 'Live', hidden: 'Hidden',
    publish: 'Publish factory', hide: 'Hide from site',
    details: 'Factory details', name: 'Factory name', nameEn: 'English name',
    descAr: 'Description (Arabic)', descEn: 'Description (English)', category: 'Category', city: 'City',
    address: 'Address (shown to traders)', founded: 'Founded year', markets: 'Export markets',
    moq: 'MOQ', phone: 'Contact phone', privateLabel: 'Private label (OEM/ODM)',
    save: 'Save', saving: 'Saving…', saved: '✓ Saved.', err: 'Error: ',
    logo: 'Logo / profile image', pick: 'Pick one, then Save above.',
    products: 'Products', add: '+ Add product', noProducts: 'No products yet.',
    edit: 'Edit', del: 'Delete', editP: 'Edit product', newP: 'New product',
    img: 'Image', cancel: 'Cancel', delConfirm: 'Delete this product?', needName: 'Enter a product name.',
    frozen: 'Verification and accreditation are managed by the Maabar team.',
  },
  zh: {
    hi: '工厂仪表板', sub: '更新您的资料和产品——将展示给 Maabar 上的采购商。',
    tabProfile: '资料与产品', tabMessages: '消息', buyer: '潜在买家',
    inboxEmpty: '暂无对话。', startChat: '新对话',
    signout: '退出登录', live: '已发布', hidden: '已隐藏',
    publish: '发布工厂', hide: '从网站隐藏',
    details: '工厂信息', name: '工厂名称', nameEn: '英文名称',
    descAr: '描述（阿拉伯语）', descEn: '描述（英语）', category: '类别', city: '城市',
    address: '地址（对采购商可见）', founded: '成立年份', markets: '出口市场',
    moq: '起订量 (MOQ)', phone: '联系电话', privateLabel: '贴牌代工 (OEM/ODM)',
    save: '保存', saving: '保存中…', saved: '✓ 已保存。', err: '错误：',
    logo: '标志／工厂图片', pick: '选择后点击上方“保存”。',
    products: '产品', add: '+ 添加产品', noProducts: '暂无产品。',
    edit: '编辑', del: '删除', editP: '编辑产品', newP: '新产品',
    img: '图片', cancel: '取消', delConfirm: '删除此产品？', needName: '请输入产品名称。',
    frozen: '认证与资质由 Maabar 团队管理。',
  },
};

const CSS = `
  .dfx-wrap { max-width: 940px; margin: 0 auto; padding: 28px 22px 60px; }
  .dfx-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .dfx-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FH}; }
  .dfx-sub { margin: 0; font-size: 13px; color: rgba(0,0,0,0.5); font-family: ${FB}; }
  .dfx-pill { font-size: 11px; padding: 3px 10px; border-radius: 999px; font-family: ${FB}; font-weight: 600; }
  .dfx-pill.on { background: #e7f4ec; color: #2f8a52; }
  .dfx-pill.off { background: #f3eee6; color: rgba(0,0,0,0.5); }
  .dfx-tabs { display: flex; gap: 6px; margin-bottom: 18px; }
  .dfx-tab { position: relative; padding: 8px 16px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.1); background: transparent; cursor: pointer; font-size: 13px; color: rgba(0,0,0,0.55); font-family: ${FB}; }
  .dfx-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .dfx-tabbadge { display: inline-flex; align-items: center; justify-content: center; min-width: 18px; height: 18px; padding: 0 5px; margin-inline-start: 6px; border-radius: 999px; background: #c0503f; color: #fff; font-size: 10.5px; font-weight: 700; }
  .dfx-inbox { display: flex; flex-direction: column; gap: 8px; }
  .dfx-inbox-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; cursor: pointer; text-align: start; transition: border-color 0.12s; }
  .dfx-inbox-item:hover { border-color: rgba(0,0,0,0.2); }
  .dfx-inbox-ava { width: 42px; height: 42px; border-radius: 11px; background: #efe9df; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #8B7355; font-weight: 600; }
  .dfx-inbox-main { flex: 1; min-width: 0; }
  .dfx-inbox-name { font-size: 14.5px; font-weight: 600; color: rgba(0,0,0,0.85); margin: 0 0 2px; }
  .dfx-inbox-prev { font-size: 13px; color: rgba(0,0,0,0.5); margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dfx-inbox-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .dfx-inbox-time { font-size: 11px; color: rgba(0,0,0,0.35); }
  .dfx-inbox-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #1a1814; color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
  .dfx-inbox-empty { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.35); font-size: 14px; }
  .dfx-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; }
  .dfx-h2 { margin: 0 0 14px; font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.8); font-family: ${FB}; }
  .dfx-label { display: block; font-size: 11px; color: rgba(0,0,0,0.5); font-family: ${FB}; margin-bottom: 4px; }
  .dfx-input { width: 100%; padding: 9px 12px; border: 1px solid rgba(0,0,0,0.14); border-radius: 8px; font-size: 14px; font-family: ${FB}; background: #fff; outline: none; box-sizing: border-box; }
  .dfx-input:focus { border-color: rgba(0,0,0,0.35); }
  .dfx-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dfx-btn { background: #1a1814; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13.5px; cursor: pointer; font-family: ${FB}; }
  .dfx-btn:disabled { opacity: 0.55; cursor: default; }
  .dfx-ghost { background: transparent; border: 1px solid rgba(0,0,0,0.16); border-radius: 8px; padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: ${FB}; }
  .dfx-del { background: transparent; border: 1px solid #c0503f; color: #c0503f; border-radius: 8px; padding: 8px 14px; font-size: 12.5px; cursor: pointer; font-family: ${FB}; }
  .dfx-msg { font-size: 13px; font-family: ${FB}; }
  .dfx-pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
  .dfx-pcard { border: 1px solid rgba(0,0,0,0.09); border-radius: 10px; overflow: hidden; background: #fff; }
  .dfx-pimg { aspect-ratio: 1/1; background: #f0ebe1; }
  .dfx-pimg img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .dfx-pbody { padding: 9px 10px; }
  .dfx-pname { font-size: 12px; font-weight: 500; color: rgba(0,0,0,0.82); margin: 0 0 7px; font-family: ${FB}; line-height: 1.4; min-height: 2.6em; overflow: hidden; }
  .dfx-pact { display: flex; gap: 6px; }
  .dfx-pbtn { flex: 1; font-size: 11.5px; padding: 5px; border-radius: 6px; cursor: pointer; font-family: ${FB}; border: 1px solid rgba(0,0,0,0.14); background: #fff; }
  .dfx-pbtn.del { border-color: #c0503f; color: #c0503f; }
  .dfx-modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 3000; display: flex; align-items: center; justify-content: center; padding: 16px; }
  .dfx-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 22px 24px; font-family: ${FB}; }
  @media (max-width: 760px) { .dfx-grid2 { grid-template-columns: 1fr; } }
`;

const fmtWhen = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export default function DashboardFactory({ factory: initial, lang = 'en' }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const t = T[lang] || T.en;
  const cats = (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).filter((c) => c.val !== 'all');

  const [tab, setTab] = useState('profile');
  const [factory, setFactory] = useState(initial || null);
  const [products, setProducts] = useState([]);
  const [pool, setPool] = useState([]);
  const [f, setF] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null);
  const [busyP, setBusyP] = useState(false);
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [invites, setInvites] = useState([]);   // pending quote-request invites (the "request that brought you")

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const list = await fetchMyFactoryThreads();
      setThreads(list);
      setInboxUnread(list.reduce((n, r) => n + (r.unread || 0), 0));
    } catch { /* keep empty */ }
    setThreadsLoading(false);
  }, []);
  // Load once on mount for the tab badge, and whenever the Messages tab opens.
  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { if (tab === 'messages') loadThreads(); }, [tab, loadThreads]);
  // Pending quote-request invites for the factories this account owns.
  useEffect(() => {
    (async () => {
      try { const { data } = await sb.rpc('get_my_factory_invites'); setInvites(data || []); }
      catch { /* ignore */ }
    })();
  }, []);

  const hydrate = useCallback((fac) => {
    setFactory(fac);
    setF({
      company_name: nf(fac?.company_name), company_name_latin: nf(fac?.company_name_latin),
      description_ar: nf(fac?.description_ar), description_en: nf(fac?.description_en),
      category: fac?.category || 'other', city: nf(fac?.city), address: nf(fac?.address),
      founded_year: fac?.founded_year || '', export_markets: nf(fac?.export_markets),
      moq_note: nf(fac?.moq_note), phone: nf(fac?.phone),
      profile_image: fac?.profile_image || null, private_label: !!fac?.private_label,
    });
  }, []);

  const load = useCallback(async () => {
    const fac = initial?.id ? initial : await fetchMyFactory();
    if (!fac) return;
    hydrate(fac);
    const [prods, imgs] = await Promise.all([
      fetchFactoryProducts(fac.id), fetchFactoryImagePool(fac.id),
    ]);
    setProducts(prods); setPool(imgs);
  }, [initial, hydrate]);
  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const field = (label, key, opts = {}) => (
    <div style={{ marginBottom: 12 }}>
      <label className="dfx-label">{label}</label>
      <input className="dfx-input" value={f[key] ?? ''} onChange={(e) => set(key, e.target.value)}
        dir={opts.ltr ? 'ltr' : (isAr ? 'rtl' : 'ltr')} />
    </div>
  );
  const area = (label, key, opts = {}) => (
    <div style={{ marginBottom: 12 }}>
      <label className="dfx-label">{label}</label>
      <textarea className="dfx-input" rows={3} value={f[key] ?? ''} onChange={(e) => set(key, e.target.value)}
        dir={opts.ltr ? 'ltr' : (isAr ? 'rtl' : 'ltr')} style={{ resize: 'vertical', minHeight: 60 }} />
    </div>
  );

  async function saveFactory() {
    if (!factory) return;
    setSaving(true); setMsg('');
    try {
      const yr = parseInt(String(f.founded_year).trim(), 10);
      // Only the owner-editable columns — trust/identity fields stay admin-frozen.
      await updateFactory(factory.id, {
        company_name: nf(f.company_name) || factory.company_name,
        company_name_latin: nf(f.company_name_latin) || null,
        description_ar: nf(f.description_ar) || null, description_en: nf(f.description_en) || null,
        category: f.category, city: nf(f.city) || null, address: nf(f.address) || null,
        founded_year: Number.isFinite(yr) && yr >= 1800 && yr <= 2100 ? yr : null,
        export_markets: nf(f.export_markets) || null, moq_note: nf(f.moq_note) || null,
        phone: nf(f.phone) || null, profile_image: f.profile_image || null,
        private_label: !!f.private_label,
      });
      setMsg(t.saved);
      load();
    } catch (e) { setMsg(t.err + (e.message || '')); }
    setSaving(false);
  }

  async function togglePublish() {
    if (!factory) return;
    setSaving(true); setMsg('');
    try {
      await updateFactory(factory.id, { is_active: !factory.is_active });
      setFactory((x) => ({ ...x, is_active: !x.is_active }));
    } catch (e) { setMsg(t.err + (e.message || '')); }
    setSaving(false);
  }

  const pName = (p) => (isAr ? (nf(p.name_ar) || nf(p.name_en)) : (nf(p.name_en) || nf(p.name_ar))) || '—';
  const eSet = (k, v) => setEditing((p) => ({ ...p, [k]: v }));

  async function saveProduct() {
    if (!factory) return;
    setBusyP(true);
    try {
      const patch = {
        name_ar: nf(editing.name_ar) || null, name_en: nf(editing.name_en) || null,
        description_ar: nf(editing.description_ar) || null, description_en: nf(editing.description_en) || null,
        specifications_ar: nf(editing.specifications_ar) || null, specifications_en: nf(editing.specifications_en) || null,
        moq: nf(editing.moq) || null, ref_code: nf(editing.ref_code) || null, image: editing.image || null,
      };
      if (editing.id) {
        await updateFactoryProduct(editing.id, patch);
      } else {
        if (!patch.name_ar && !patch.name_en) { alert(t.needName); setBusyP(false); return; }
        await createFactoryProduct(factory.id, patch);
      }
      setEditing(null); load();
    } catch (e) { alert(t.err + (e.message || '')); }
    setBusyP(false);
  }
  async function removeProduct(p) {
    if (!window.confirm(t.delConfirm)) return;
    try { await deleteFactoryProduct(p.id); setProducts((ps) => ps.filter((x) => x.id !== p.id)); }
    catch (e) { alert(e.message || 'Delete failed'); }
  }

  if (!factory) return null;

  return (
    <div style={{ background: 'var(--bg-base, #faf8f4)', minHeight: 'var(--app-dvh)' }}>
      <style>{CSS}</style>
      <div className="dfx-wrap" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="dfx-top">
          <div>
            <h1 className="dfx-title">{factory.company_name}</h1>
            <p className="dfx-sub">{t.sub}</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`dfx-pill ${factory.is_active ? 'on' : 'off'}`}>{factory.is_active ? t.live : t.hidden}</span>
            <button className="dfx-ghost" onClick={() => sb.auth.signOut()}>{t.signout}</button>
          </div>
        </div>

        {invites.length > 0 && (
          <div style={{ marginBottom: 18, padding: '16px 18px', background: 'linear-gradient(135deg,#FCF8F0,#F1F7F1)', border: '1px solid rgba(45,122,79,0.28)', borderRadius: 14 }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: '#2d7a4f', fontWeight: 700, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'بانتظارك' : 'Waiting for you'}
            </p>
            <h3 style={{ margin: '6px 0 10px', fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? `لديك ${invites.length} طلب عرض سعر` : `You have ${invites.length} quote request${invites.length > 1 ? 's' : ''}`}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {invites.slice(0, 4).map((iv) => (
                <button key={iv.slug} onClick={() => nav(`/f/${iv.slug}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--bg-raised,#fff)', border: '1px solid var(--border-subtle,#eee)', borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: isAr ? 'right' : 'left', flexDirection: isAr ? 'row-reverse' : 'row' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {(isAr ? (iv.title_ar || iv.title_en) : (iv.title_en || iv.title_ar)) || (isAr ? 'طلب عرض سعر' : 'Quote request')}
                    {iv.quantity ? <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> · {iv.quantity} {isAr ? 'وحدة' : 'units'}</span> : null}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#2d7a4f', whiteSpace: 'nowrap' }}>{isAr ? 'أرسل عرضك ←' : 'Send offer →'}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="dfx-tabs">
          <button className={`dfx-tab ${tab === 'profile' ? 'on' : ''}`} onClick={() => setTab('profile')}>{t.tabProfile}</button>
          <button className={`dfx-tab ${tab === 'messages' ? 'on' : ''}`} onClick={() => setTab('messages')}>
            {t.tabMessages}{inboxUnread > 0 && <span className="dfx-tabbadge">{inboxUnread}</span>}
          </button>
        </div>

        {tab === 'messages' ? (
          threadsLoading ? <p className="dfx-inbox-empty">…</p>
            : threads.length === 0 ? <p className="dfx-inbox-empty">{t.inboxEmpty}</p>
              : (
                <div className="dfx-inbox">
                  {threads.map((th) => (
                    <button className="dfx-inbox-item" key={th.thread_id} onClick={() => nav(`/factory/thread/${th.thread_id}`)}>
                      <div className="dfx-inbox-ava">{t.buyer[0]}</div>
                      <div className="dfx-inbox-main">
                        <p className="dfx-inbox-name">{t.buyer}</p>
                        <p className="dfx-inbox-prev">{th.last_preview || t.startChat}</p>
                      </div>
                      <div className="dfx-inbox-side">
                        <span className="dfx-inbox-time">{fmtWhen(th.last_message_at)}</span>
                        {th.unread > 0 && <span className="dfx-inbox-badge">{th.unread}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )
        ) : (
        <>
        {/* Profile */}
        <div className="dfx-card">
          <h2 className="dfx-h2">{t.details}</h2>
          <div className="dfx-grid2">
            {field(t.name, 'company_name')}
            {field(t.nameEn, 'company_name_latin', { ltr: true })}
          </div>
          {area(t.descAr, 'description_ar')}
          {area(t.descEn, 'description_en', { ltr: true })}
          <div className="dfx-grid2">
            <div style={{ marginBottom: 12 }}>
              <label className="dfx-label">{t.category}</label>
              <select className="dfx-input" value={f.category || ''} onChange={(e) => set('category', e.target.value)}>
                {cats.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}
              </select>
            </div>
            {field(t.city, 'city')}
            {field(t.address, 'address')}
            {field(t.founded, 'founded_year', { ltr: true })}
            {field(t.markets, 'export_markets', { ltr: true })}
            {field(t.moq, 'moq_note')}
            {field(t.phone, 'phone', { ltr: true })}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 14px', cursor: 'pointer', fontSize: 13, fontFamily: FB }}>
            <input type="checkbox" checked={!!f.private_label} onChange={(e) => set('private_label', e.target.checked)} />{t.privateLabel}
          </label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="dfx-btn" onClick={saveFactory} disabled={saving}>{saving ? t.saving : t.save}</button>
            {msg && <span className="dfx-msg" style={{ color: msg.startsWith('✓') ? '#2f8a52' : '#c0392b' }}>{msg}</span>}
          </div>
          <p className="dfx-label" style={{ marginTop: 12 }}>{t.frozen}</p>
        </div>

        {/* Logo */}
        <div className="dfx-card">
          <h2 className="dfx-h2">{t.logo}</h2>
          <ProfileImagePicker candidates={pool} selected={f.profile_image} onSelect={(u) => set('profile_image', u)} lang={lang} />
          <p className="dfx-label" style={{ marginTop: 10 }}>{t.pick}</p>
        </div>

        {/* Products */}
        <div className="dfx-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 className="dfx-h2" style={{ margin: 0 }}>{t.products} ({products.length})</h2>
            <button className="dfx-btn" onClick={() => setEditing({ image: pool[0] || null })}>{t.add}</button>
          </div>
          {products.length === 0 ? <p className="dfx-label">{t.noProducts}</p> : (
            <div className="dfx-pgrid">
              {products.map((p) => (
                <div className="dfx-pcard" key={p.id}>
                  <div className="dfx-pimg">{p.image && <img src={p.image} alt="" loading="lazy" />}</div>
                  <div className="dfx-pbody">
                    <p className="dfx-pname">{pName(p)}</p>
                    <div className="dfx-pact">
                      <button className="dfx-pbtn" onClick={() => setEditing({ ...p })}>{t.edit}</button>
                      <button className="dfx-pbtn del" onClick={() => removeProduct(p)}>{t.del}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish */}
        <div className="dfx-card" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="dfx-ghost" onClick={togglePublish} disabled={saving}>
            {factory.is_active ? t.hide : t.publish}
          </button>
        </div>
        </>
        )}
      </div>

      {/* Product edit / add modal */}
      {editing && (
        <div className="dfx-modal-bg" onClick={() => !busyP && setEditing(null)}>
          <div className="dfx-modal" onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}>
            <h2 className="dfx-h2">{editing.id ? t.editP : t.newP}</h2>
            <label className="dfx-label">{t.img}</label>
            <ProfileImagePicker candidates={pool} selected={editing.image} onSelect={(u) => eSet('image', u)} lang={lang} />
            <div className="dfx-grid2" style={{ marginTop: 14 }}>
              <div><label className="dfx-label">{isAr ? 'الاسم (ع)' : 'Name (AR)'}</label><input className="dfx-input" dir="rtl" value={nf(editing.name_ar)} onChange={(e) => eSet('name_ar', e.target.value)} /></div>
              <div><label className="dfx-label">{isAr ? 'الاسم (EN)' : 'Name (EN)'}</label><input className="dfx-input" dir="ltr" value={nf(editing.name_en)} onChange={(e) => eSet('name_en', e.target.value)} /></div>
            </div>
            <div className="dfx-grid2">
              <div><label className="dfx-label">{isAr ? 'الوصف (ع)' : 'Description (AR)'}</label><textarea className="dfx-input" rows={2} dir="rtl" style={{ resize: 'vertical' }} value={nf(editing.description_ar)} onChange={(e) => eSet('description_ar', e.target.value)} /></div>
              <div><label className="dfx-label">{isAr ? 'الوصف (EN)' : 'Description (EN)'}</label><textarea className="dfx-input" rows={2} dir="ltr" style={{ resize: 'vertical' }} value={nf(editing.description_en)} onChange={(e) => eSet('description_en', e.target.value)} /></div>
            </div>
            <div className="dfx-grid2">
              <div><label className="dfx-label">{isAr ? 'المواصفات (ع)' : 'Specs (AR)'}</label><textarea className="dfx-input" rows={2} dir="rtl" style={{ resize: 'vertical' }} value={nf(editing.specifications_ar)} onChange={(e) => eSet('specifications_ar', e.target.value)} /></div>
              <div><label className="dfx-label">{isAr ? 'المواصفات (EN)' : 'Specs (EN)'}</label><textarea className="dfx-input" rows={2} dir="ltr" style={{ resize: 'vertical' }} value={nf(editing.specifications_en)} onChange={(e) => eSet('specifications_en', e.target.value)} /></div>
            </div>
            <div className="dfx-grid2">
              {['moq', 'ref_code'].map((k) => (
                <div key={k}><label className="dfx-label">{k === 'moq' ? t.moq : (isAr ? 'رمز المنتج' : 'Ref code')}</label><input className="dfx-input" dir="ltr" value={nf(editing[k])} onChange={(e) => eSet(k, e.target.value)} /></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button className="dfx-btn" onClick={saveProduct} disabled={busyP}>{busyP ? t.saving : t.save}</button>
              <button className="dfx-ghost" onClick={() => setEditing(null)} disabled={busyP}>{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
