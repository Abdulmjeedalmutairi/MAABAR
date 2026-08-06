import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ConsoleShell, { Icon as ShellIcon } from '../../components/admin2/ConsoleShell';
import CertsEditor from '../../components/admin/CertsEditor';
import SupplierProductsTab from './SupplierProductsTab';
import { CatalogsTab, RequestsTab, MessagesTab } from './SupplierMoreTabs';
import InviteModal from './InviteModal';
import { fetchFactory, fetchFactoryProducts, updateFactory, deleteFactory, assistField } from '../../lib/catalogImport';
import { UI_CATEGORIES } from '../../lib/supplierDashboardConstants';
import { sb } from '../../supabase';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const digits = (v) => (v || '').replace(/[^\d]/g, '');

const TABS = [
  { key: 'overview', ar: 'نظرة عامة', en: 'Overview' },
  { key: 'products', ar: 'المنتجات', en: 'Products' },
  { key: 'catalogs', ar: 'الكتالوجات', en: 'Catalogs' },
  { key: 'requests', ar: 'الطلبات', en: 'Requests' },
  { key: 'messages', ar: 'الرسائل', en: 'Messages' },
  { key: 'profile', ar: 'الملف', en: 'Profile' },
  { key: 'settings', ar: 'الإعدادات', en: 'Settings' },
];

// Fields that count toward the profile-completion meter (equal weight).
const COMPLETION_FIELDS = (f) => [
  !!f.profile_image, !!nf(f.company_name), !!nf(f.company_name_latin), !!nf(f.category),
  !!nf(f.city), !!nf(f.country), !!nf(f.address), !!nf(f.email), !!nf(f.phone),
  !!(nf(f.description_ar) || nf(f.description_en)), !!f.founded_year, !!nf(f.export_markets),
  Array.isArray(f.factory_images) && f.factory_images.length > 0,
  Array.isArray(f.certifications) && f.certifications.length > 0,
];

export default function ConsoleSupplierDetail({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const { id } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const TAB_KEYS = ['overview', 'products', 'catalogs', 'requests', 'messages', 'profile', 'settings'];
  const [fac, setFac] = useState(null);
  const [account, setAccount] = useState(null);
  const [pCount, setPCount] = useState(0);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState(TAB_KEYS.includes(params.get('tab')) ? params.get('tab') : 'overview');
  const [toast, setToast] = useState('');
  const [invite, setInvite] = useState(false);

  const load = async () => {
    setErr('');
    try {
      const f = await fetchFactory(id);
      if (!f) { setErr(isAr ? 'المورّد غير موجود.' : 'Supplier not found.'); return; }
      setFac(f);
      fetchFactoryProducts(id).then((ps) => setPCount(ps.length)).catch(() => {});
      if (f.linked_supplier_id) {
        sb.from('profiles').select('id, email, full_name, created_at').eq('id', f.linked_supplier_id).maybeSingle()
          .then(({ data }) => setAccount(data || null));
      }
    } catch (e) { setErr(e.message || 'load failed'); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 1900); };
  const copy = (t, m) => { try { navigator.clipboard.writeText(t); flash(m); } catch { /* noop */ } };
  const publicUrl = `${window.location.origin}/factory/${id}`;

  if (err) {
    return (
      <ConsoleShell user={user} profile={profile} lang={lang} active="suppliers">
        <div className="ac-page"><p style={{ color: 'var(--ac-danger)' }}>{err}</p></div>
      </ConsoleShell>
    );
  }
  if (!fac) {
    return (
      <ConsoleShell user={user} profile={profile} lang={lang} active="suppliers">
        <div className="ac-page"><div className="ac-skel" style={{ height: 120 }} /></div>
      </ConsoleShell>
    );
  }

  const name = nf(fac.company_name) || nf(fac.company_name_latin) || '—';
  const latin = nf(fac.company_name_latin) && fac.company_name_latin !== fac.company_name ? fac.company_name_latin : '';
  const cover = (Array.isArray(fac.factory_images) && fac.factory_images[0]) || null;

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="suppliers">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <button className="ac-back" onClick={() => nav('/admin2/suppliers')}>
          <span>{isAr ? '→' : '←'}</span>{isAr ? 'كل الموردين' : 'All suppliers'}
        </button>

        {/* Header */}
        <div className="ac-dhead">
          {fac.profile_image ? <img className="ac-dlogo" src={fac.profile_image} alt="" /> : <div className="ac-dlogo-fb">{name.charAt(0)}</div>}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 className="ac-dname">{name}</h1>
            {latin && <p className="ac-dlatin" dir="ltr" style={{ textAlign: isAr ? 'right' : 'left' }}>{latin}</p>}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
              {fac.linked_supplier_id
                ? <span className="ac-badge ok"><span className="dot" />{isAr ? 'مسجّل' : 'Registered'}</span>
                : <span className="ac-badge neutral"><span className="dot" />{isAr ? 'غير مسجّل' : 'Not registered'}</span>}
              {fac.is_verified && <span className="ac-badge info"><span className="dot" />{isAr ? 'موثّق' : 'Verified'}</span>}
              {!fac.is_active && <span className="ac-badge warn"><span className="dot" />{isAr ? 'مسودّة' : 'Draft'}</span>}
              {fac.is_featured && <span className="ac-badge ok">{isAr ? 'مميّز' : 'Featured'}</span>}
            </div>
            <div className="ac-quick">
              <button className="ac-btn ac-btn-sm" onClick={() => copy(publicUrl, isAr ? 'نُسخ الرابط' : 'URL copied')}>{isAr ? 'نسخ الرابط' : 'Copy URL'}</button>
              {fac.claim_slug && <button className="ac-btn ac-btn-sm" onClick={() => copy(`${window.location.origin}/claim/${fac.claim_slug}`, isAr ? 'نُسخ رابط المطالبة' : 'Claim link copied')}>{isAr ? 'رابط المطالبة' : 'Claim link'}</button>}
              <button className="ac-btn ac-btn-sm" onClick={() => window.open(publicUrl, '_blank')}>{isAr ? 'الصفحة العامة' : 'Public page'}</button>
              <button className="ac-btn ac-btn-sm" disabled={!digits(fac.phone)} style={{ opacity: digits(fac.phone) ? 1 : 0.5 }}
                onClick={() => digits(fac.phone) && window.open(`https://wa.me/${digits(fac.phone)}`, '_blank')}>WhatsApp</button>
              <button className="ac-btn ac-btn-sm" disabled={!nf(fac.email)} style={{ opacity: nf(fac.email) ? 1 : 0.5 }}
                onClick={() => nf(fac.email) && window.open(`mailto:${fac.email}`)}>{isAr ? 'إيميل' : 'Email'}</button>
              <button className="ac-btn ac-btn-sm ac-btn-primary" onClick={() => setInvite(true)}>
                {isAr ? 'إرسال دعوة' : 'Send invitation'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="ac-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={`ac-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
              {isAr ? t.ar : t.en}
              {t.key === 'products' && pCount > 0 && <span className="ac-tab-badge">{pCount}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab fac={fac} account={account} pCount={pCount} isAr={isAr} lang={lang} publicUrl={publicUrl} />}
        {tab === 'profile' && <ProfileTab fac={fac} isAr={isAr} lang={lang} onSaved={(f) => { setFac(f); flash(isAr ? 'حُفظ' : 'Saved'); }} />}
        {tab === 'settings' && <SettingsTab fac={fac} isAr={isAr} onChanged={(f) => { setFac(f); flash(isAr ? 'تم' : 'Updated'); }} onDeleted={() => nav('/admin2/suppliers')} flash={flash} />}
        {tab === 'products' && <SupplierProductsTab factoryId={id} lang={lang} isAr={isAr} flash={flash} />}
        {tab === 'catalogs' && <CatalogsTab factoryId={id} isAr={isAr} flash={flash} />}
        {tab === 'requests' && <RequestsTab factoryId={id} isAr={isAr} lang={lang} />}
        {tab === 'messages' && <MessagesTab factoryId={id} isAr={isAr} flash={flash} onEmail={() => setInvite(true)} />}
      </div>
      {invite && <InviteModal factoryId={id} isAr={isAr} onClose={() => setInvite(false)} flash={flash} />}
      {toast && <div className="ac-toast" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{toast}</div>}
    </ConsoleShell>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ fac, account, pCount, isAr, lang, publicUrl }) {
  const flags = COMPLETION_FIELDS(fac);
  const pct = Math.round((flags.filter(Boolean).length / flags.length) * 100);
  const KV = ({ k, children }) => (children ? <div className="ac-kv"><div className="ac-kv-k">{k}</div><div className="ac-kv-v">{children}</div></div> : null);
  const since = account?.created_at ? new Date(account.created_at).toLocaleDateString(isAr ? 'ar' : 'en') : null;
  const tags = [];
  if (fac.private_label) tags.push('OEM / ODM');
  if (nf(fac.export_markets)) tags.push(nf(fac.export_markets));
  if (fac.founded_year) tags.push((isAr ? 'تأسّس ' : 'Est. ') + fac.founded_year);

  return (
    <div className="ac-grid2">
      <div>
        <div className="ac-card">
          {(Array.isArray(fac.factory_images) && fac.factory_images[0]) && <img className="ac-cover" src={fac.factory_images[0]} alt="" style={{ marginBottom: 16 }} />}
          <p className="ac-card-title">{isAr ? 'التواصل' : 'Contact'}</p>
          <KV k="WhatsApp">{nf(fac.phone) ? <a href={`https://wa.me/${digits(fac.phone)}`} target="_blank" rel="noreferrer" dir="ltr">{fac.phone}</a> : null}</KV>
          <KV k="WeChat">{nf(fac.wechat) ? <span dir="ltr">{fac.wechat}</span> : null}</KV>
          <KV k={isAr ? 'الإيميل' : 'Email'}>{nf(fac.email) ? <a href={`mailto:${fac.email}`} dir="ltr">{fac.email}</a> : null}</KV>
          <KV k={isAr ? 'الموقع الإلكتروني' : 'Website'}>{nf(fac.website) ? <a href={/^https?:/.test(fac.website) ? fac.website : `https://${fac.website}`} target="_blank" rel="noreferrer" dir="ltr">{fac.website}</a> : null}</KV>
          <KV k={isAr ? 'العنوان' : 'Address'}>{nf(fac.address) || [nf(fac.city), nf(fac.country)].filter(Boolean).join('، ')}</KV>
        </div>

        {tags.length > 0 && (
          <div className="ac-card">
            <p className="ac-card-title">{isAr ? 'سمات تجارية' : 'Business tags'}</p>
            <div className="ac-chiprow">{tags.map((t, i) => <span key={i} className="ac-chip on" style={{ cursor: 'default' }}>{t}</span>)}</div>
          </div>
        )}
      </div>

      <div>
        <div className="ac-card">
          <p className="ac-card-title">{isAr ? 'اكتمال الملف' : 'Profile completion'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div className="ac-meter" style={{ flex: 1 }}><span style={{ width: `${pct}%` }} /></div>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ac-ink)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
          </div>
        </div>
        <div className="ac-card">
          <p className="ac-card-title">{isAr ? 'الحساب' : 'Account'}</p>
          <KV k={isAr ? 'التسجيل' : 'Status'}>{fac.linked_supplier_id ? (isAr ? 'مسجّل' : 'Registered') : (isAr ? 'غير مسجّل' : 'Not registered')}</KV>
          <KV k={isAr ? 'حساب المورّد' : 'Account'}>{account?.email ? <span dir="ltr">{account.email}</span> : null}</KV>
          <KV k={isAr ? 'منذ' : 'Since'}>{since}</KV>
          <KV k={isAr ? 'المنتجات' : 'Products'}>{pCount}</KV>
        </div>
        <div className="ac-card">
          <p className="ac-card-title">{isAr ? 'الرابط العام' : 'Public URL'}</p>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ac-muted)', wordBreak: 'break-all' }} dir="ltr">{publicUrl}</p>
        </div>
      </div>
    </div>
  );
}

// ── Profile (edit) ───────────────────────────────────────────────────────────
// Stable, module-level field + AI-suggest button (never redefined per render).
function TField({ label, value, onChange, ltr, ph, right }) {
  return (
    <div className="ac-field">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 18 }}>
        <label className="ac-flabel">{label}</label>
        {right || null}
      </div>
      <input className="ac-input" value={value} onChange={(e) => onChange(e.target.value)} dir={ltr ? 'ltr' : undefined} placeholder={ph} />
    </div>
  );
}
function AiBtn({ busy, onClick, isAr }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} title={isAr ? 'اقتراح بالذكاء الاصطناعي' : 'Suggest with AI'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--ac-line-2)', borderRadius: 7, padding: '2px 8px', fontSize: 10.5, fontWeight: 700, color: busy ? 'var(--ac-faint)' : 'var(--ac-info)', cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit' }}>
      {busy ? '…' : (isAr ? '✨ اقتراح' : '✨ AI')}
    </button>
  );
}

function ProfileTab({ fac, isAr, lang, onSaved }) {
  const cats = UI_CATEGORIES[lang] || UI_CATEGORIES.ar;
  const [f, setF] = useState({
    company_name: fac.company_name || '', company_name_latin: fac.company_name_latin || '',
    category: fac.category || 'other', city: fac.city || '', country: fac.country || '',
    address: fac.address || '', email: fac.email || '', phone: fac.phone || '',
    wechat: fac.wechat || '', website: fac.website || '',
    founded_year: fac.founded_year || '', export_markets: fac.export_markets || '', moq_note: fac.moq_note || '',
    private_label: !!fac.private_label,
    description_ar: fac.description_ar || '', description_en: fac.description_en || '',
    certifications: Array.isArray(fac.certifications) ? fac.certifications : [],
  });
  const [saving, setSaving] = useState(false);
  const [aiField, setAiField] = useState('');
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  // Stable module-level TField below (not an inline component) — avoids the input
  // losing focus on every keystroke.
  const F = (props) => <TField {...props} value={f[props.k]} onChange={(v) => set(props.k, v)} />;

  // Per-field AI suggestion: fills the field from a professional, context-aware
  // Gemini suggestion (description fills both languages; single fields fill one).
  const assist = async (field, stateKey) => {
    setAiField(field);
    try {
      const ctx = { company_name: f.company_name, company_name_latin: f.company_name_latin, category: f.category, city: f.city, country: f.country, address: f.address, export_markets: f.export_markets, private_label: f.private_label };
      const sug = await assistField({ field, context: ctx, imageUrl: fac.profile_image || null });
      if (field === 'description_en') {
        if (sug.ar) set('description_ar', sug.ar);
        if (sug.en) set('description_en', sug.en);
      } else {
        const val = (isAr ? sug.ar : sug.en) || sug.en || sug.ar || '';
        if (val) set(stateKey, val);
      }
    } catch (e) { alert(e.message === 'worker_not_configured' ? (isAr ? 'خدمة الاقتراح غير مُعدّة' : 'Assist service not configured') : (e.message || 'AI failed')); }
    setAiField('');
  };
  const ai = (field, stateKey) => <AiBtn busy={aiField === field} onClick={() => assist(field, stateKey)} isAr={isAr} />;

  const save = async () => {
    setSaving(true);
    try {
      const patch = {
        company_name: f.company_name.trim() || fac.company_name, company_name_latin: f.company_name_latin.trim() || null,
        category: f.category, city: f.city.trim() || null, country: f.country.trim() || null,
        address: f.address.trim() || null, email: f.email.trim() || fac.email, phone: f.phone.trim() || null,
        wechat: f.wechat.trim() || null, website: f.website.trim() || null,
        founded_year: parseInt(f.founded_year, 10) || null, export_markets: f.export_markets.trim() || null,
        moq_note: f.moq_note.trim() || null, private_label: !!f.private_label,
        description_ar: f.description_ar.trim() || null, description_en: f.description_en.trim() || null,
        certifications: f.certifications,
      };
      await updateFactory(fac.id, patch);
      onSaved({ ...fac, ...patch });
    } catch (e) { alert(e.message || 'save failed'); }
    setSaving(false);
  };

  return (
    <div className="ac-card">
      <div className="ac-form-grid">
        {F({ k: 'company_name', label: isAr ? 'اسم الشركة (الأصلي)' : 'Company name (original)' })}
        {F({ k: 'company_name_latin', label: isAr ? 'الاسم اللاتيني' : 'Latin name', ltr: true })}
        <div className="ac-field">
          <label className="ac-flabel">{isAr ? 'الفئة' : 'Category'}</label>
          <select className="ac-input" value={f.category} onChange={(e) => set('category', e.target.value)}>
            {cats.map((c) => <option key={c.val} value={c.val}>{c.label}</option>)}
          </select>
        </div>
        {F({ k: 'city', label: isAr ? 'المدينة' : 'City' })}
        {F({ k: 'country', label: isAr ? 'الدولة' : 'Country' })}
        {F({ k: 'founded_year', label: isAr ? 'سنة التأسيس' : 'Founded year', ltr: true, ph: '2012' })}
        <div className="ac-field wide">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 18 }}>
            <label className="ac-flabel">{isAr ? 'العنوان' : 'Address'}</label>{ai('address', 'address')}
          </div>
          <input className="ac-input" value={f.address} onChange={(e) => set('address', e.target.value)} /></div>
        {F({ k: 'email', label: isAr ? 'الإيميل' : 'Email', ltr: true })}
        {F({ k: 'phone', label: isAr ? 'الهاتف / واتساب' : 'Phone / WhatsApp', ltr: true, ph: '+8613800138000' })}
        {F({ k: 'wechat', label: 'WeChat', ltr: true })}
        {F({ k: 'website', label: isAr ? 'الموقع الإلكتروني' : 'Website', ltr: true })}
        {F({ k: 'export_markets', label: isAr ? 'أسواق التصدير' : 'Export markets', ph: isAr ? '+30 دولة' : '30+ countries', right: ai('export_markets', 'export_markets') })}
        {F({ k: 'moq_note', label: isAr ? 'الحد الأدنى للطلب' : 'MOQ note', right: ai('moq', 'moq_note') })}
        <div className="ac-field wide">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 18 }}>
            <label className="ac-flabel">{isAr ? 'الوصف (عربي/إنجليزي)' : 'Description (Arabic / English)'}</label>{ai('description_en')}
          </div>
          <textarea className="ac-textarea" value={f.description_ar} onChange={(e) => set('description_ar', e.target.value)} dir="rtl" placeholder={isAr ? 'عربي' : 'Arabic'} /></div>
        <div className="ac-field wide">
          <textarea className="ac-textarea" value={f.description_en} onChange={(e) => set('description_en', e.target.value)} dir="ltr" placeholder="English" /></div>
        <div className="ac-toggle-row wide" style={{ gridColumn: '1 / -1' }}>
          <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{isAr ? 'تصنيع بعلامة خاصة (OEM/ODM)' : 'Private label (OEM/ODM)'}</div></div>
          <input type="checkbox" checked={f.private_label} onChange={(e) => set('private_label', e.target.checked)} style={{ width: 18, height: 18, accentColor: '#1a1814' }} />
        </div>
        <div className="ac-field wide">
          <label className="ac-flabel">{isAr ? 'الشهادات' : 'Certifications'}</label>
          <CertsEditor value={f.certifications} onChange={(v) => set('certifications', v)} lang={lang} inputClass="ac-input" />
        </div>
      </div>
      <div className="ac-savebar">
        <button className="ac-btn ac-btn-primary" onClick={save} disabled={saving}>{saving ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ التغييرات' : 'Save changes')}</button>
      </div>
    </div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function SettingsTab({ fac, isAr, onChanged, onDeleted, flash }) {
  const [busy, setBusy] = useState(false);
  const toggle = async (key, val) => {
    setBusy(true);
    try { await updateFactory(fac.id, { [key]: val }); onChanged({ ...fac, [key]: val }); }
    catch (e) { alert(e.message || 'update failed'); }
    setBusy(false);
  };
  const Row = ({ k, label, hint }) => (
    <div className="ac-toggle-row">
      <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>{hint && <div style={{ fontSize: 12, color: 'var(--ac-faint)' }}>{hint}</div>}</div>
      <input type="checkbox" checked={!!fac[k]} disabled={busy} onChange={(e) => toggle(k, e.target.checked)} style={{ width: 18, height: 18, accentColor: '#1a1814' }} />
    </div>
  );
  const del = async () => {
    if (!window.confirm(isAr ? `حذف "${fac.company_name}" نهائياً؟` : `Permanently delete "${fac.company_name}"?`)) return;
    try { await deleteFactory(fac.id); onDeleted(); }
    catch (e) {
      const has = e.code === 'HAS_REQUESTS' || /has_requests/i.test(e.message || '');
      flash(has ? (isAr ? 'مرتبط بطلبات — عطّل النشر بدل الحذف' : 'Linked to requests — deactivate instead') : (isAr ? 'تعذّر الحذف' : 'Delete failed'));
    }
  };
  return (
    <>
      <div className="ac-card">
        <p className="ac-card-title">{isAr ? 'الحالة والظهور' : 'Status & visibility'}</p>
        <Row k="is_active" label={isAr ? 'منشور (ظاهر للمشترين)' : 'Published (visible to buyers)'} hint={isAr ? 'أطفئه ليصير مسودّة مخفية.' : 'Off = hidden draft.'} />
        <Row k="is_verified" label={isAr ? 'موثّق' : 'Verified'} hint={isAr ? 'شارة ثقة على الصفحة العامة.' : 'Trust badge on the public page.'} />
        <Row k="is_featured" label={isAr ? 'مميّز' : 'Featured'} hint={isAr ? 'يظهر ضمن المصانع المُوصى بها.' : 'Shown among recommended factories.'} />
      </div>
      <div className="ac-card" style={{ borderColor: 'var(--ac-danger-bd)' }}>
        <p className="ac-card-title" style={{ color: 'var(--ac-danger)' }}>{isAr ? 'منطقة الخطر' : 'Danger zone'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--ac-muted)' }}>{isAr ? 'حذف المورّد ومنتجاته نهائياً.' : 'Permanently delete this supplier and its products.'}</span>
          <button className="ac-btn" style={{ color: 'var(--ac-danger)', borderColor: 'var(--ac-danger-bd)' }} onClick={del}>{isAr ? 'حذف المورّد' : 'Delete supplier'}</button>
        </div>
      </div>
    </>
  );
}

