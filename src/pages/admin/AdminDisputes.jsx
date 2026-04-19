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
  { key: 'all',               en: 'All',           ar: 'الكل' },
  { key: 'open',              en: 'Open',          ar: 'مفتوح' },
  { key: 'under_review',      en: 'Under Review',  ar: 'قيد المراجعة' },
  { key: 'mediating',         en: 'Mediating',     ar: 'وساطة' },
  { key: 'resolved_buyer',    en: 'Resolved (B)',  ar: 'حُلّ للتاجر' },
  { key: 'resolved_supplier', en: 'Resolved (S)',  ar: 'حُلّ للمورد' },
  { key: 'dismissed',         en: 'Dismissed',     ar: 'مرفوض' },
];

const SEV_COLOR = { high: '#c0392b', medium: '#8B6914', low: 'rgba(0,0,0,0.38)' };
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

export default function AdminDisputes({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [tab, setTab] = useState('all');
  const [disputes, setDisputes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('disputes')
      .select('id, created_at, reason, status, severity, raised_by, against_id, resolved_at, raiser:raised_by(full_name, email), against:against_id(full_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (tab !== 'all') q = q.eq('status', tab);
    if (search.trim()) {
      q = q.or(`reason.ilike.%${search}%`);
    }
    const { data, count } = await q;
    setDisputes(data || []);
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
          <h1 className="a-page-title">{isAr ? 'النزاعات' : 'Disputes'}</h1>
          <p className="a-page-sub">{loading ? '…' : `${total} ${isAr ? 'نزاع' : 'dispute' + (total !== 1 ? 's' : '')}`}</p>

          <div className="a-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          <input className="a-search" placeholder={isAr ? 'بحث بالسبب...' : 'Search by reason…'} value={search} onChange={e => setSearch(e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />

          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'مقدم الشكوى' : 'Raised By'}</th>
                  <th>{isAr ? 'ضد' : 'Against'}</th>
                  <th>{isAr ? 'السبب' : 'Reason'}</th>
                  <th>{isAr ? 'الخطورة' : 'Severity'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && disputes.length === 0 && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'لا توجد نزاعات' : 'No disputes found'}</div></td></tr>}
                {disputes.map(d => (
                  <tr key={d.id} onClick={() => nav(`/admin/disputes/${d.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{d.raiser?.full_name || d.raiser?.email || '—'}</div>
                    </td>
                    <td>{d.against?.full_name || d.against?.email || '—'}</td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(0,0,0,0.60)' }}>{d.reason}</div>
                    </td>
                    <td><span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: SEV_COLOR[d.severity], fontFamily: FONT_BODY, textTransform: 'uppercase' }}>{d.severity}</span></td>
                    <td><AdminStatusBadge status={d.status} lang={lang} /></td>
                    <td style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(d.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPaginator page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} isAr={isAr} />
          </div>

          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && disputes.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد نزاعات' : 'No disputes found'}</p>}
            {disputes.map(d => (
              <div key={d.id} className="a-card" onClick={() => nav(`/admin/disputes/${d.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>{d.raiser?.full_name || d.raiser?.email || '—'}</div>
                  <AdminStatusBadge status={d.status} lang={lang} />
                </div>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{d.reason}</p>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div><div className="a-card-meta">{isAr ? 'ضد' : 'AGAINST'}</div><div className="a-card-val">{d.against?.full_name || '—'}</div></div>
                  <div><div className="a-card-meta">{isAr ? 'الخطورة' : 'SEVERITY'}</div><div className="a-card-val" style={{ color: SEV_COLOR[d.severity], fontWeight: 600 }}>{d.severity}</div></div>
                  <div><div className="a-card-meta">{isAr ? 'التاريخ' : 'DATE'}</div><div className="a-card-val">{fmtDate(d.created_at)}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
