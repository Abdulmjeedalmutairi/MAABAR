import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { fetchImports } from '../../lib/catalogImport';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY = "'Tajawal', sans-serif";

const STATUS_META = {
  extracting: { en: 'Extracting', ar: 'جارٍ الاستخراج', color: '#6B6560', bg: 'rgba(0,0,0,0.05)' },
  extracted:  { en: 'Ready to review', ar: 'جاهز للمراجعة', color: '#b8860b', bg: 'rgba(201,134,63,0.12)' },
  reviewing:  { en: 'In review', ar: 'قيد المراجعة', color: '#2c6fb0', bg: 'rgba(44,111,176,0.12)' },
  approved:   { en: 'Approved', ar: 'معتمد', color: '#3f9d5a', bg: 'rgba(63,157,90,0.14)' },
  failed:     { en: 'Failed', ar: 'فشل', color: '#c0392b', bg: 'rgba(192,57,43,0.10)' },
};

const TABS = [
  { key: 'all',       en: 'All',      ar: 'الكل' },
  { key: 'extracted', en: 'To review', ar: 'للمراجعة' },
  { key: 'reviewing', en: 'In review', ar: 'قيد المراجعة' },
  { key: 'approved',  en: 'Approved',  ar: 'معتمد' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function StatusPill({ status, lang }) {
  const m = STATUS_META[status] || STATUS_META.extracting;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg, fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>
      {lang === 'ar' ? m.ar : m.en}
    </span>
  );
}

const SHARED_CSS = (isAr) => `
  .a-page { padding: 36px 32px; max-width: 1080px; }
  .a-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .a-page-sub { margin: 0 0 24px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .a-tabs { display: flex; gap: 4px; margin-bottom: 18px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .a-tabs::-webkit-scrollbar { display: none; }
  .a-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.09); background: transparent; cursor: pointer; font-size: 12px; color: rgba(0,0,0,0.45); min-height: 34px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .a-tab:not(.on):hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
  .a-error { margin: 0 0 16px; padding: 11px 14px; border-radius: 8px; background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18); color: #c0392b; font-size: 12px; font-family: ${FONT_BODY}; }
  .a-table-wrap { border-radius: 10px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; }
  .a-table { width: 100%; border-collapse: collapse; }
  .a-table th { padding: 11px 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(0,0,0,0.38); text-align: ${isAr ? 'right' : 'left'}; background: var(--bg-subtle, #F5F2EE); border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-table td { padding: 13px 16px; font-size: 13px; color: rgba(0,0,0,0.80); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; font-family: ${FONT_BODY}; }
  .a-table tr:last-child td { border-bottom: none; }
  .a-table tbody tr { cursor: pointer; transition: background 0.1s; }
  .a-table tbody tr:hover td { background: rgba(0,0,0,0.025); }
  .a-empty { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.30); font-family: ${FONT_BODY}; font-size: 13px; }
  .a-cards { display: none; flex-direction: column; gap: 8px; }
  .a-card { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 15px; cursor: pointer; transition: border-color 0.12s; }
  .a-card:active { border-color: rgba(0,0,0,0.15); }
  .a-card-meta { font-size: 10px; color: rgba(0,0,0,0.35); font-family: ${FONT_BODY}; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 2px; }
  .a-card-val { font-size: 13px; color: rgba(0,0,0,0.75); font-family: ${FONT_BODY}; }
  @media (max-width: 900px) { .a-page { padding: 22px 16px; } }
  @media (max-width: 768px) { .a-table-wrap { display: none; } .a-cards { display: flex; } }
  @media (min-width: 769px) { .a-cards { display: none; } }
`;

export default function AdminCatalogImport({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [imports, setImports] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setImports(await fetchImports()); setError(''); }
    catch (e) { setError(e.message || 'Query failed'); setImports([]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = tab === 'all' ? imports : imports.filter((r) => r.status === tab);
  const factoryName = (r) => r.factory_fields?.name_original || r.factory_fields?.name_en || '—';
  const factorySub = (r) => {
    const en = r.factory_fields?.name_en;
    return en && en !== r.factory_fields?.name_original && en !== 'not_found' ? en : null;
  };

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{SHARED_CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="a-page-title">{isAr ? 'استيراد الكتالوج' : 'Catalog Import'}</h1>
          <p className="a-page-sub">
            {loading ? '…' : `${shown.length} ${isAr ? 'دفعة' : 'import' + (shown.length !== 1 ? 's' : '')}`}
          </p>

          <div className="a-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          {error && <div className="a-error">{isAr ? 'تعذّر التحميل: ' : 'Failed to load: '}{error}</div>}

          {/* Desktop table */}
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المصنع' : 'Factory'}</th>
                  <th>{isAr ? 'الملف' : 'File'}</th>
                  <th>{isAr ? 'المنتجات' : 'Products'}</th>
                  <th>{isAr ? 'الصفحات' : 'Pages'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && !error && shown.length === 0 && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'لا توجد عمليات استيراد بعد' : 'No imports yet'}</div></td></tr>}
                {!loading && shown.map((r) => (
                  <tr key={r.id} onClick={() => nav(`/admin/catalog-import/${r.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{factoryName(r)}</div>
                      {factorySub(r) && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1 }}>{factorySub(r)}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>{r.original_filename || '—'}</td>
                    <td style={{ fontVariantNumeric: 'lining-nums' }}>{r.product_count}</td>
                    <td style={{ fontVariantNumeric: 'lining-nums', color: 'rgba(0,0,0,0.45)' }}>{r.page_count ?? '—'}</td>
                    <td><StatusPill status={r.status} lang={lang} /></td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && !error && shown.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد عمليات استيراد بعد' : 'No imports yet'}</p>}
            {!loading && shown.map((r) => (
              <div key={r.id} className="a-card" onClick={() => nav(`/admin/catalog-import/${r.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>{factoryName(r)}</div>
                  <StatusPill status={r.status} lang={lang} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {[
                    [isAr ? 'الملف' : 'FILE', r.original_filename],
                    [isAr ? 'المنتجات' : 'PRODUCTS', String(r.product_count)],
                    [isAr ? 'الصفحات' : 'PAGES', r.page_count != null ? String(r.page_count) : null],
                    [isAr ? 'التاريخ' : 'DATE', fmtDate(r.created_at)],
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
