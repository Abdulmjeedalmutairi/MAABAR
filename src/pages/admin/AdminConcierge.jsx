import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { sb } from '../../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const TABS = [
  { key: 'all',         en: 'All',         ar: 'الكل' },
  { key: 'pending',     en: 'Pending',     ar: 'معلّق' },
  { key: 'in_progress', en: 'In Progress', ar: 'جارٍ' },
  { key: 'matched',     en: 'Matched',     ar: 'تمت المطابقة' },
  { key: 'closed',      en: 'Closed',      ar: 'مغلق' },
];

// Managed-request lifecycle (managed_status values in public.requests) collapsed
// onto the four concierge tabs the UI exposes.
const TAB_TO_MANAGED_STATUSES = {
  pending:     ['submitted', 'admin_review'],
  in_progress: ['sourcing', 'matching'],
  matched:     ['shortlist_ready', 'buyer_review'],
  closed:      ['buyer_selected', 'completed'],
};

const MANAGED_STATUS_TO_TAB = Object.entries(TAB_TO_MANAGED_STATUSES).reduce((acc, [tab, list]) => {
  list.forEach(ms => { acc[ms] = tab; });
  return acc;
}, {});

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

export default function AdminConcierge({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [tab, setTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    // Source of truth for managed buyer requests is public.requests
    // (sourcing_mode='managed'). The concierge_requests table is not populated
    // by the buyer flow. Join the buyer profile and the AI brief for context.
    let q = sb.from('requests')
      .select(`
        id, category, description, budget_per_unit, quantity, created_at,
        sourcing_mode, managed_status,
        requester:profiles!requests_buyer_id_fkey(full_name, email, company_name),
        brief:managed_request_briefs(ai_confidence, cleaned_description)
      `)
      .eq('sourcing_mode', 'managed')
      .order('created_at', { ascending: false })
      .limit(200);

    if (tab !== 'all') {
      const statuses = TAB_TO_MANAGED_STATUSES[tab] || [];
      if (statuses.length) q = q.in('managed_status', statuses);
    }

    const { data, error } = await q;
    if (error) console.error('[AdminConcierge] load error:', error);

    // Normalize so the existing UI (which expects concierge_requests shape)
    // keeps working without template changes.
    const rows = (data || []).map(r => {
      const brief = Array.isArray(r.brief) ? r.brief[0] : r.brief;
      return {
        id: r.id,
        requester: r.requester || null,
        request_type: r.category || 'managed',
        description: brief?.cleaned_description || r.description || '',
        budget: r.budget_per_unit,
        currency: 'USD',
        status: MANAGED_STATUS_TO_TAB[r.managed_status] || r.managed_status || 'pending',
        created_at: r.created_at,
      };
    });

    setRequests(rows);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? requests.filter(r => {
        const q = search.toLowerCase();
        return (r.description || '').toLowerCase().includes(q)
          || (r.requester?.full_name || '').toLowerCase().includes(q)
          || (r.requester?.email || '').toLowerCase().includes(q)
          || (r.request_type || '').toLowerCase().includes(q);
      })
    : requests;

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{SHARED_CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="a-page-title">{isAr ? 'الكونسيرج' : 'Concierge'}</h1>
          <p className="a-page-sub">
            {loading ? '…' : `${filtered.length} ${isAr ? 'طلب' : 'request' + (filtered.length !== 1 ? 's' : '')}`}
          </p>

          <div className="a-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          <input className="a-search" placeholder={isAr ? 'بحث بالوصف أو المستخدم...' : 'Search by description or requester…'} value={search} onChange={e => setSearch(e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />

          {/* Desktop table */}
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'مقدم الطلب' : 'Requester'}</th>
                  <th>{isAr ? 'النوع' : 'Type'}</th>
                  <th>{isAr ? 'الوصف' : 'Description'}</th>
                  <th>{isAr ? 'الميزانية' : 'Budget'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'لا توجد طلبات' : 'No concierge requests found'}</div></td></tr>}
                {filtered.map(r => (
                  <tr key={r.id} onClick={() => nav(`/admin/concierge/${r.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{r.requester?.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1, fontFamily: FONT_BODY }}>{r.requester?.email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{r.request_type?.replace('_', ' ') || '—'}</td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: 'rgba(0,0,0,0.50)' }}>
                        {r.description || '—'}
                      </div>
                    </td>
                    <td style={{ fontVariantNumeric: 'lining-nums', whiteSpace: 'nowrap' }}>{r.budget ? `${r.budget} ${r.currency}` : '—'}</td>
                    <td><AdminStatusBadge status={r.status} lang={lang} /></td>
                    <td style={{ fontFamily: FONT_BODY, fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && filtered.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد طلبات' : 'No requests found'}</p>}
            {filtered.map(r => (
              <div key={r.id} className="a-card" onClick={() => nav(`/admin/concierge/${r.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>{r.requester?.full_name || r.requester?.email || '—'}</div>
                    {r.requester?.company_name && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 1 }}>{r.requester.company_name}</div>}
                  </div>
                  <AdminStatusBadge status={r.status} lang={lang} />
                </div>
                {r.description && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {r.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {[
                    [isAr ? 'النوع' : 'TYPE', r.request_type?.replace('_', ' ')],
                    [isAr ? 'الميزانية' : 'BUDGET', r.budget ? `${r.budget} ${r.currency}` : null],
                    [isAr ? 'التاريخ' : 'DATE', fmtDate(r.created_at)],
                  ].filter(([,v]) => v).map(([label, val]) => (
                    <div key={label}>
                      <div className="a-card-meta">{label}</div>
                      <div className="a-card-val" style={{ textTransform: label === (isAr ? 'النوع' : 'TYPE') ? 'capitalize' : 'none' }}>{val}</div>
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
