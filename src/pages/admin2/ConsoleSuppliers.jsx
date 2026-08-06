import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell, { Icon as ShellIcon } from '../../components/admin2/ConsoleShell';
import { fetchConsoleSuppliers, deriveFacets } from '../../lib/consoleSuppliers';
import { deleteFactory } from '../../lib/catalogImport';
import { displayCategoryForCode } from '../../lib/factoryCategories';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';

// Origin tag (organic signup vs factory-claim vs unclaimed directory) → chip.
const ORIGIN = {
  organic:       { ar: 'تسجيل مباشر', en: 'Organic',      cls: 'info' },
  factory_claim: { ar: 'مطالبة مصنع', en: 'Factory claim', cls: 'ok' },
  directory:     { ar: 'دليل',        en: 'Directory',     cls: 'neutral' },
};

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const PAGE = 24;

// action icons (24-grid, currentColor)
const AP = {
  open: 'M15 3h6v6M10 14L21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  wa: 'M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5z',
  mail: 'M3 6h18v13H3zM3 6l9 7 9-7',
  trash: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14',
};
function Ico({ d, size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  );
}

const digits = (v) => (v || '').replace(/[^\d]/g, '');
const relTime = (iso, isAr) => {
  if (!iso) return isAr ? '—' : '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return isAr ? 'اليوم' : 'today';
  if (d === 1) return isAr ? 'أمس' : '1d';
  if (d < 30) return isAr ? `${d} يوم` : `${d}d`;
  const m = Math.floor(d / 30);
  return isAr ? `${m} شهر` : `${m}mo`;
};

function TFlag({ on, onClick, children }) {
  return <button className={`ac-chip${on ? ' on' : ''}`} onClick={onClick} type="button">{children}</button>;
}

export default function ConsoleSuppliers({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [visible, setVisible] = useState(PAGE);

  // filters
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [category, setCategory] = useState('');
  const [originF, setOriginF] = useState('');     // '' | organic | factory_claim | directory
  const [reg, setReg] = useState('all');          // all | yes | no
  const [fVerified, setFVerified] = useState(false);
  const [fCatalog, setFCatalog] = useState(false);
  const [fProducts, setFProducts] = useState(false);
  const [fProfile, setFProfile] = useState(false);

  const load = async () => {
    setErr('');
    try { setRows(await fetchConsoleSuppliers()); }
    catch (e) { setErr(e.message || 'load failed'); setRows([]); }
  };
  useEffect(() => { load(); }, []);

  const facets = useMemo(() => deriveFacets(rows || []), [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (originF && r.origin !== originF) return false;
      if (country && r.country !== country) return false;
      if (category && r.category !== category) return false;
      if (reg === 'yes' && !r.is_registered) return false;
      if (reg === 'no' && r.is_registered) return false;
      if (fVerified && !r.is_verified) return false;
      if (fCatalog && !r.has_catalog) return false;
      if (fProducts && !r.has_products) return false;
      if (fProfile && !r.has_profile) return false;
      if (s) {
        const hay = [r.company_name, r.company_name_latin, r.email, r.phone, r.city, r.maabar_supplier_id].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    }).sort((a, b) => (b.last_activity || '').localeCompare(a.last_activity || ''));
  }, [rows, q, country, category, originF, reg, fVerified, fCatalog, fProducts, fProfile]);

  useEffect(() => { setVisible(PAGE); }, [q, country, category, originF, reg, fVerified, fCatalog, fProducts, fProfile]);

  // infinite scroll sentinel
  const sentinel = useRef(null);
  useEffect(() => {
    if (!sentinel.current) return undefined;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) setVisible((v) => v + PAGE); }, { rootMargin: '400px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [filtered.length]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 1900); };
  const copy = (text, msg) => { try { navigator.clipboard.writeText(text); flash(msg); } catch { /* noop */ } };
  // Registered suppliers link to their public profile; directory factories to /factory.
  const shareUrl = (r) => `${window.location.origin}${r.kind === 'profile' ? `/supplier/${r.id}` : `/factory/${r.id}`}`;

  // Delete is only for unclaimed directory factories — deleting a real supplier
  // account is a different, dangerous op handled elsewhere.
  const onDelete = async (r) => {
    if (r.kind !== 'factory') return;
    if (!window.confirm(isAr ? `حذف "${r.company_name}"؟ لا يمكن التراجع.` : `Delete "${r.company_name}"? This cannot be undone.`)) return;
    try {
      await deleteFactory(r.id);
      setRows((rs) => rs.filter((x) => x.id !== r.id));
      flash(isAr ? 'تم الحذف' : 'Deleted');
    } catch (e) {
      const has = e.code === 'HAS_REQUESTS' || /has_requests/i.test(e.message || '');
      flash(has ? (isAr ? 'مرتبط بطلبات — أرشِفه بدل الحذف' : 'Linked to requests — archive instead') : (isAr ? 'تعذّر الحذف' : 'Delete failed'));
    }
  };

  const catLabel = (code) => {
    const c = displayCategoryForCode(code);
    return c ? (c.label[lang] || c.label.en) : nf(code);
  };
  const open = (r) => nav(r.openPath || `/admin2/suppliers/${r.id}`);

  const shown = filtered.slice(0, visible);
  const total = rows ? rows.length : 0;

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="suppliers">
      <div className="ac-page">
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'الموردون' : 'Suppliers'}</h1>
            <p className="ac-sub" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {rows == null ? '…' : isAr ? `${filtered.length} من ${total} مورّد` : `${filtered.length} of ${total} suppliers`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ac-btn ac-btn-primary" onClick={() => nav('/admin2/import')} style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              <ShellIcon name="import" size={16} />{isAr ? '+ استيراد / إنشاء مورّد' : '+ Import / create supplier'}
            </button>
          </div>
        </div>

        {/* search + facets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input className="ac-input" style={{ flex: '1 1 260px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
              value={q} onChange={(e) => setQ(e.target.value)} placeholder={isAr ? 'ابحث بالاسم أو الإيميل أو الهاتف أو المدينة…' : 'Search name, email, phone, city…'} />
            <select className="ac-input" style={{ width: 'auto', minWidth: 140 }} value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">{isAr ? 'كل الدول' : 'All countries'}</option>
              {facets.countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="ac-input" style={{ width: 'auto', minWidth: 150 }} value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{isAr ? 'كل الفئات' : 'All categories'}</option>
              {facets.categories.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
            </select>
            <select className="ac-input" style={{ width: 'auto', minWidth: 140 }} value={originF} onChange={(e) => setOriginF(e.target.value)}>
              <option value="">{isAr ? 'كل المصادر' : 'All origins'}</option>
              <option value="organic">{isAr ? ORIGIN.organic.ar : ORIGIN.organic.en}</option>
              <option value="factory_claim">{isAr ? ORIGIN.factory_claim.ar : ORIGIN.factory_claim.en}</option>
              <option value="directory">{isAr ? ORIGIN.directory.ar : ORIGIN.directory.en}</option>
            </select>
          </div>
          <div className="ac-chiprow" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            <TFlag on={reg === 'yes'} onClick={() => setReg(reg === 'yes' ? 'all' : 'yes')}>{isAr ? 'مسجّل' : 'Registered'}</TFlag>
            <TFlag on={reg === 'no'} onClick={() => setReg(reg === 'no' ? 'all' : 'no')}>{isAr ? 'غير مسجّل' : 'Not registered'}</TFlag>
            <TFlag on={fVerified} onClick={() => setFVerified((v) => !v)}>{isAr ? 'موثّق' : 'Verified'}</TFlag>
            <TFlag on={fCatalog} onClick={() => setFCatalog((v) => !v)}>{isAr ? 'عنده كتالوج' : 'Has catalog'}</TFlag>
            <TFlag on={fProducts} onClick={() => setFProducts((v) => !v)}>{isAr ? 'عنده منتجات' : 'Has products'}</TFlag>
            <TFlag on={fProfile} onClick={() => setFProfile((v) => !v)}>{isAr ? 'عنده ملف' : 'Has profile'}</TFlag>
          </div>
        </div>

        {err && <p style={{ color: 'var(--ac-danger)', fontSize: 13 }}>{err}</p>}

        {rows == null ? (
          <div className="ac-sgrid">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="ac-skel" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="ac-empty" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'لا يوجد موردون مطابقون.' : 'No matching suppliers.'}</div>
        ) : (
          <>
            <div className="ac-sgrid">
              {shown.map((r) => {
                const name = nf(r.company_name) || nf(r.company_name_latin) || '—';
                const latin = nf(r.company_name_latin) && r.company_name_latin !== r.company_name ? r.company_name_latin : '';
                const loc = [nf(r.city), nf(r.country)].filter(Boolean).join('، ');
                return (
                  <div className="ac-scard" key={r.id}>
                    <div className="ac-scard-top" onClick={() => open(r)}>
                      {r.profile_image
                        ? <img className="ac-logo" src={r.profile_image} alt="" loading="lazy" />
                        : <div className="ac-logo-fallback">{name.charAt(0)}</div>}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p className="ac-sname" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{name}</p>
                        {latin && <p className="ac-sname-latin" dir="ltr" style={{ textAlign: isAr ? 'right' : 'left' }}>{latin}</p>}
                        <p className="ac-sloc" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {loc || '—'}{nf(r.category) ? ` · ${catLabel(r.category)}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="ac-sbadges">
                      <span className={`ac-badge ${ORIGIN[r.origin]?.cls || 'neutral'}`}><span className="dot" />{isAr ? ORIGIN[r.origin]?.ar : ORIGIN[r.origin]?.en}</span>
                      {r.kind === 'profile' ? (
                        <>
                          <AdminStatusBadge status={r.status} lang={lang} />
                          {r.is_featured && <span className="ac-badge ok">{isAr ? 'مميّز' : 'Featured'}</span>}
                        </>
                      ) : (
                        <>
                          {r.is_verified && <span className="ac-badge info"><span className="dot" />{isAr ? 'موثّق' : 'Verified'}</span>}
                          {!r.is_active && <span className="ac-badge warn"><span className="dot" />{isAr ? 'مسودّة' : 'Draft'}</span>}
                          {r.is_featured && <span className="ac-badge ok">{isAr ? 'مميّز' : 'Featured'}</span>}
                        </>
                      )}
                    </div>

                    <div className="ac-smeta">
                      <div className="ac-smeta-item"><span className="ac-smeta-num">{r.product_count}</span><span className="ac-smeta-lbl">{isAr ? 'منتجات' : 'Products'}</span></div>
                      <div className="ac-smeta-item"><span className="ac-smeta-num">{r.catalog_count}</span><span className="ac-smeta-lbl">{isAr ? 'كتالوجات' : 'Catalogs'}</span></div>
                      <div className="ac-smeta-item"><span className="ac-smeta-num" style={{ fontSize: 13 }}>{relTime(r.last_activity, isAr)}</span><span className="ac-smeta-lbl">{isAr ? 'آخر نشاط' : 'Activity'}</span></div>
                    </div>

                    <div className="ac-sactions">
                      <button className="ac-btn ac-btn-sm" style={{ flex: 1 }} onClick={() => open(r)}><Ico d={AP.open} />{isAr ? 'فتح' : 'Open'}</button>
                      <button className="ac-iconbtn" title={isAr ? 'مشاركة الرابط' : 'Copy link'} onClick={() => copy(shareUrl(r), isAr ? 'نُسخ رابط الصفحة' : 'Link copied')}><Ico d={AP.share} /></button>
                      <button className="ac-iconbtn" title="WhatsApp" disabled={!digits(r.phone)}
                        onClick={() => digits(r.phone) && window.open(`https://wa.me/${digits(r.phone)}`, '_blank')}
                        style={{ opacity: digits(r.phone) ? 1 : 0.4 }}><Ico d={AP.wa} /></button>
                      <button className="ac-iconbtn" title={isAr ? 'إيميل' : 'Email'} disabled={!nf(r.email)}
                        onClick={() => nf(r.email) && window.open(`mailto:${r.email}`)}
                        style={{ opacity: nf(r.email) ? 1 : 0.4 }}><Ico d={AP.mail} /></button>
                      {r.kind === 'factory' && (
                        <button className="ac-iconbtn danger" title={isAr ? 'حذف' : 'Delete'} onClick={() => onDelete(r)}><Ico d={AP.trash} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {visible < filtered.length && <div ref={sentinel} style={{ height: 1 }} />}
          </>
        )}
      </div>
      {toast && <div className="ac-toast" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{toast}</div>}
    </ConsoleShell>
  );
}
