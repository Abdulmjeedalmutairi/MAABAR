import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import {
  getSupplierReviewQueueStatuses,
  getSupplierPublicVisibilityStatuses,
} from '../../lib/supplierOnboarding';
import { UI_CATEGORIES, getSpecialtyLabel } from '../../lib/supplierDashboardConstants';
import { sb } from '../../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const ROW_LIMIT = 200;

const TABS = [
  { key: 'all',                   en: 'All',            ar: 'الكل' },
  { key: 'registered',            en: 'Registered',     ar: 'مسجّلون' },
  { key: 'verification_required', en: 'Needs Info',     ar: 'مطلوب استكمال' },
  { key: 'pending_review',        en: 'Pending Review', ar: 'قيد المراجعة' },
  { key: 'verified',              en: 'Verified',       ar: 'موثّقون' },
  { key: 'rejected',              en: 'Rejected',       ar: 'مرفوضون' },
  { key: 'inactive',              en: 'Inactive',       ar: 'غير نشطين' },
];

// Status vocabulary comes from supplierOnboarding.js — the single source of truth.
// Previously this file hardcoded its own arrays, and the "Active" tab filtered on
// 'active' while approvals write 'verified', so it was permanently empty. The legacy
// aliases below mirror SUPPLIER_STATUS_EQUIVALENTS so old rows stay reachable.
const TAB_FILTER = {
  all:                   null,
  registered:            ['registered', 'draft', 'incomplete'],
  verification_required: ['verification_required'],
  pending_review:        getSupplierReviewQueueStatuses(),
  verified:              getSupplierPublicVisibilityStatuses(),
  rejected:              ['rejected'],
  inactive:              ['inactive', 'disabled', 'suspended'],
};

const SEARCH_COLUMNS = ['company_name', 'full_name', 'email', 'maabar_supplier_id', 'city', 'country'];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SHARED_CSS = (isAr) => `
  .a-page { padding: 36px 32px; max-width: 1080px; }
  .a-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .a-page-sub { margin: 0 0 24px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .a-tabs { display: flex; gap: 4px; margin-bottom: 10px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
  .a-tabs::-webkit-scrollbar { display: none; }
  .a-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.09); background: transparent; cursor: pointer; font-size: 12px; color: rgba(0,0,0,0.45); min-height: 34px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .a-tab:not(.on):hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
  .a-chips { display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
  .a-chips::-webkit-scrollbar { display: none; }
  .a-chip { flex-shrink: 0; padding: 4px 11px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.07); background: transparent; cursor: pointer; font-size: 11px; color: rgba(0,0,0,0.42); min-height: 28px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-chip.on { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.80); border-color: rgba(0,0,0,0.18); font-weight: 600; }
  .a-chip:not(.on):hover { background: rgba(0,0,0,0.03); color: rgba(0,0,0,0.66); }
  .a-search { width: 100%; max-width: 360px; padding: 9px 13px; margin-bottom: 18px; background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 14px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
  .a-search:focus { border-color: rgba(0,0,0,0.22); }
  .a-note { margin: 0 0 14px; font-size: 11px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .a-error { margin: 0 0 16px; padding: 11px 14px; border-radius: 8px; background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18); color: #c0392b; font-size: 12px; font-family: ${FONT_BODY}; }
  .a-table-wrap { border-radius: 10px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; }
  .a-table { width: 100%; border-collapse: collapse; }
  .a-table th { padding: 11px 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(0,0,0,0.38); text-align: ${isAr ? 'right' : 'left'}; background: var(--bg-subtle, #F5F2EE); border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-table td { padding: 13px 16px; font-size: 13px; color: rgba(0,0,0,0.80); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; font-family: ${FONT_BODY}; }
  .a-table tr:last-child td { border-bottom: none; }
  .a-table tbody tr { cursor: pointer; transition: background 0.1s; }
  .a-table tbody tr:hover td { background: rgba(0,0,0,0.025); }
  .a-cards { display: none; flex-direction: column; gap: 8px; }
  .a-card { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 15px; cursor: pointer; transition: border-color 0.12s; }
  .a-card:active { border-color: rgba(0,0,0,0.15); }
  .a-card-meta { font-size: 10px; color: rgba(0,0,0,0.35); font-family: ${FONT_BODY}; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 2px; }
  .a-card-val { font-size: 13px; color: rgba(0,0,0,0.75); font-family: ${FONT_BODY}; }
  .a-empty { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.30); font-family: ${FONT_BODY}; font-size: 13px; }
  @media (max-width: 900px) { .a-page { padding: 22px 16px; } .a-search { max-width: 100%; } }
  @media (max-width: 768px) { .a-table-wrap { display: none; } .a-cards { display: flex; } }
  @media (min-width: 769px) { .a-cards { display: none; } }
`;

export default function AdminSuppliers({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(TABS.find(t => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'all');
  const [cat, setCat] = useState('all');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isAr = lang === 'ar';
  const cats = UI_CATEGORIES[lang] || UI_CATEGORIES.ar;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('profiles')
      .select('id, full_name, email, company_name, country, city, speciality, status, created_at, maabar_supplier_id')
      .eq('role', 'supplier').order('created_at', { ascending: false }).limit(ROW_LIMIT);
    if (TAB_FILTER[tab]) q = q.in('status', TAB_FILTER[tab]);
    if (cat !== 'all') q = q.eq('speciality', cat);
    // Search server-side: a client-side filter over the truncated window returned
    // confident false negatives for anyone outside the first ROW_LIMIT rows.
    const safe = debouncedSearch.replace(/[,()%*]/g, ' ').trim();
    if (safe) q = q.or(SEARCH_COLUMNS.map(c => `${c}.ilike.%${safe}%`).join(','));

    const { data, error: err } = await q;
    if (err) { setError(err.message || 'Query failed'); setSuppliers([]); }
    else { setError(''); setSuppliers(data || []); }
    setLoading(false);
  }, [tab, cat, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const truncated = !loading && !error && suppliers.length === ROW_LIMIT;

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{SHARED_CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="a-page-title">{isAr ? 'الموردون' : 'Suppliers'}</h1>
          <p className="a-page-sub">
            {loading ? '…' : `${suppliers.length}${truncated ? '+' : ''} ${isAr ? 'مورد' : 'supplier' + (suppliers.length !== 1 ? 's' : '')}`}
          </p>

          <div className="a-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          <div className="a-chips">
            {cats.map(c => (
              <button key={c.val} className={`a-chip${cat === c.val ? ' on' : ''}`} onClick={() => setCat(c.val)}>
                {c.label}
              </button>
            ))}
          </div>

          <input
            className="a-search"
            placeholder={isAr ? 'بحث بالاسم، الشركة، البريد، المعرّف، المدينة…' : 'Search name, company, email, ID, city…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            dir={isAr ? 'rtl' : 'ltr'}
          />

          {error && (
            <div className="a-error">
              {isAr ? 'تعذّر تحميل الموردين: ' : 'Failed to load suppliers: '}{error}
            </div>
          )}
          {truncated && (
            <p className="a-note">
              {isAr
                ? `تُعرض أحدث ${ROW_LIMIT} نتيجة فقط — استخدم البحث أو الفلاتر للوصول لبقية الموردين.`
                : `Showing the newest ${ROW_LIMIT} results only — use search or filters to reach the rest.`}
            </p>
          )}

          {/* Desktop table */}
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المورد' : 'Supplier'}</th>
                  <th>{isAr ? 'الشركة' : 'Company'}</th>
                  <th>{isAr ? 'التخصص' : 'Speciality'}</th>
                  <th>{isAr ? 'الدولة' : 'Country'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'تاريخ التسجيل' : 'Joined'}</th>
                  <th>{isAr ? 'معرّف' : 'ID'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={7}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && error && <tr><td colSpan={7}><div className="a-empty">{isAr ? 'تعذّر التحميل' : 'Could not load'}</div></td></tr>}
                {!loading && !error && suppliers.length === 0 && <tr><td colSpan={7}><div className="a-empty">{isAr ? 'لا توجد نتائج' : 'No suppliers found'}</div></td></tr>}
                {suppliers.map(s => (
                  <tr key={s.id} onClick={() => nav(`/admin/suppliers/${s.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{s.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1, fontFamily: FONT_BODY }}>{s.email}</div>
                    </td>
                    <td>{s.company_name || '—'}</td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>{s.speciality ? getSpecialtyLabel(s.speciality, lang) : '—'}</td>
                    <td>{s.country || '—'}</td>
                    <td><AdminStatusBadge status={s.status} lang={lang} /></td>
                    <td style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(s.created_at)}</td>
                    <td style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(0,0,0,0.30)', fontVariantNumeric: 'lining-nums' }}>{s.maabar_supplier_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && error && <p style={{ color: '#c0392b', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'تعذّر التحميل' : 'Could not load'}</p>}
            {!loading && !error && suppliers.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد نتائج' : 'No suppliers found'}</p>}
            {suppliers.map(s => (
              <div key={s.id} className="a-card" onClick={() => nav(`/admin/suppliers/${s.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>{s.full_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 1 }}>{s.email}</div>
                  </div>
                  <AdminStatusBadge status={s.status} lang={lang} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {[
                    [isAr ? 'الشركة' : 'COMPANY', s.company_name],
                    [isAr ? 'التخصص' : 'SPECIALITY', s.speciality ? getSpecialtyLabel(s.speciality, lang) : null],
                    [isAr ? 'الدولة' : 'COUNTRY', s.country],
                    [isAr ? 'المعرّف' : 'ID', s.maabar_supplier_id],
                    [isAr ? 'الانضمام' : 'JOINED', fmtDate(s.created_at)],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label}>
                      <div className="a-card-meta">{label}</div>
                      <div className="a-card-val">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
