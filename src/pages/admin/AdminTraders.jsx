import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminPaginator from '../../components/admin/AdminPaginator';
import { sb } from '../../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";
const PAGE_SIZE    = 50;

const TABS = [
  { key: 'all',      en: 'All',      ar: 'الكل' },
  { key: 'active',   en: 'Active',   ar: 'نشطون' },
  { key: 'inactive', en: 'Inactive', ar: 'غير نشطين' },
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const SHARED_CSS = (isAr) => `
  .a-page { padding: 36px 32px; max-width: 1080px; }
  .a-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .a-page-sub { margin: 0 0 24px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .a-tabs { display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
  .a-tabs::-webkit-scrollbar { display: none; }
  .a-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.09); background: transparent; cursor: pointer; font-size: 12px; color: rgba(0,0,0,0.45); min-height: 34px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .a-tab:not(.on):hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
  .a-search { width: 100%; max-width: 360px; padding: 9px 13px; margin-bottom: 18px; background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 14px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; box-sizing: border-box; transition: border-color 0.15s; }
  .a-search:focus { border-color: rgba(0,0,0,0.22); }
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

export default function AdminTraders({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [tab, setTab] = useState('all');
  const [traders, setTraders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('profiles')
      .select('id, full_name, email, company_name, country, status, created_at, role', { count: 'exact' })
      .in('role', ['buyer', 'trader'])
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (tab !== 'all') q = q.eq('status', tab);
    if (search.trim()) {
      q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,company_name.ilike.%${search}%`);
    }
    const { data, count } = await q;
    setTraders(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [tab, page, search]);

  useEffect(() => { setPage(0); }, [tab, search]);
  useEffect(() => { load(); }, [load]);

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{SHARED_CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="a-page-title">{isAr ? 'التجار' : 'Traders'}</h1>
          <p className="a-page-sub">{loading ? '…' : `${total} ${isAr ? 'تاجر' : 'trader' + (total !== 1 ? 's' : '')}`}</p>

          <div className="a-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          <input className="a-search" placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search name, email, company…'} value={search} onChange={e => setSearch(e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'التاجر' : 'Trader'}</th>
                  <th>{isAr ? 'الشركة' : 'Company'}</th>
                  <th>{isAr ? 'الدولة' : 'Country'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'تاريخ التسجيل' : 'Joined'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={5}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && traders.length === 0 && <tr><td colSpan={5}><div className="a-empty">{isAr ? 'لا يوجد تجار' : 'No traders found'}</div></td></tr>}
                {traders.map(t => (
                  <tr key={t.id} onClick={() => nav(`/admin/traders/${t.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{t.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1, fontFamily: FONT_BODY }}>{t.email}</div>
                    </td>
                    <td>{t.company_name || '—'}</td>
                    <td>{t.country || '—'}</td>
                    <td><AdminStatusBadge status={t.status} lang={lang} /></td>
                    <td style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPaginator page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} isAr={isAr} />
          </div>

          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && traders.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا يوجد تجار' : 'No traders found'}</p>}
            {traders.map(t => (
              <div key={t.id} className="a-card" onClick={() => nav(`/admin/traders/${t.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>{t.full_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 1 }}>{t.email}</div>
                  </div>
                  <AdminStatusBadge status={t.status} lang={lang} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {[[isAr ? 'الشركة' : 'COMPANY', t.company_name], [isAr ? 'الدولة' : 'COUNTRY', t.country], [isAr ? 'الانضمام' : 'JOINED', fmtDate(t.created_at)]].filter(([,v]) => v).map(([label, val]) => (
                    <div key={label}><div className="a-card-meta">{label}</div><div className="a-card-val">{val}</div></div>
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
