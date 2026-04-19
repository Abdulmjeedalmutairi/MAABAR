import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { sb } from '../../supabase';

const TABS = [
  { key: 'all',         labelEn: 'All',         labelAr: 'الكل' },
  { key: 'pending',     labelEn: 'Pending',     labelAr: 'معلّق' },
  { key: 'in_progress', labelEn: 'In Progress', labelAr: 'جارٍ' },
  { key: 'matched',     labelEn: 'Matched',     labelAr: 'تمت المطابقة' },
  { key: 'closed',      labelEn: 'Closed',      labelAr: 'مغلق' },
];

function fmt(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function AdminConcierge({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [tab, setTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isRTL = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('concierge_requests')
      .select('id, request_type, status, budget, currency, created_at, description, requester:requester_id(full_name, email, company_name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (tab !== 'all') q = q.eq('status', tab);
    const { data } = await q;
    setRequests(data || []);
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
        <style>{`
          .admin-concierge { padding: 32px 28px; max-width: 1100px; }
          .admin-tabs { display: flex; gap: 4px; margin-bottom: 20px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
          .admin-tabs::-webkit-scrollbar { display: none; }
          .admin-tab { flex-shrink: 0; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--border-default); background: transparent; cursor: pointer; font-size: 13px; color: var(--text-secondary); min-height: 36px; transition: all 0.12s; white-space: nowrap; font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; }
          .admin-tab.active { background: var(--text-primary); color: var(--bg-base); border-color: var(--text-primary); font-weight: 600; }
          .admin-tab:not(.active):hover { background: var(--bg-raised); }
          .admin-search { width: 100%; max-width: 380px; padding: 10px 14px; margin-bottom: 20px; background: var(--bg-raised); border: 1px solid var(--border-default); border-radius: 10px; font-size: 14px; color: var(--text-primary); font-family: var(--font-sans); outline: none; box-sizing: border-box; }
          .admin-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid var(--border-subtle); }
          .admin-table { width: 100%; border-collapse: collapse; }
          .admin-table th { padding: 12px 16px; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-tertiary); text-align: ${isRTL ? 'right' : 'left'}; background: var(--bg-raised); border-bottom: 1px solid var(--border-subtle); white-space: nowrap; font-family: var(--font-sans); }
          .admin-table td { padding: 14px 16px; font-size: 14px; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); vertical-align: middle; font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; }
          .admin-table tr:last-child td { border-bottom: none; }
          .admin-table tbody tr { cursor: pointer; transition: background 0.1s; }
          .admin-table tbody tr:hover td { background: var(--bg-raised); }
          .admin-cr-cards { display: none; flex-direction: column; gap: 10px; }
          .admin-cr-card { background: var(--bg-raised); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 16px; cursor: pointer; }
          .admin-cr-card:active { border-color: var(--border-default); }

          @media (max-width: 900px) { .admin-concierge { padding: 20px 16px; } .admin-search { max-width: 100%; } }
          @media (max-width: 768px) { .admin-table-wrap { display: none; } .admin-cr-cards { display: flex; } }
          @media (min-width: 769px) { .admin-cr-cards { display: none; } }
        `}</style>

        <div className="admin-concierge" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isRTL ? 'الكونسيرج' : 'Concierge'}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-tertiary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {loading ? '…' : `${filtered.length} ${isRTL ? 'طلب' : 'request' + (filtered.length !== 1 ? 's' : '')}`}
          </p>

          <div className="admin-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`admin-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                {isRTL ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>

          <input
            className="admin-search"
            placeholder={isRTL ? 'بحث بالوصف أو المستخدم...' : 'Search by description or requester…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
          />

          {/* Desktop table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isRTL ? 'مقدم الطلب' : 'Requester'}</th>
                  <th>{isRTL ? 'النوع' : 'Type'}</th>
                  <th>{isRTL ? 'الوصف' : 'Description'}</th>
                  <th>{isRTL ? 'الميزانية' : 'Budget'}</th>
                  <th>{isRTL ? 'الحالة' : 'Status'}</th>
                  <th>{isRTL ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 32 }}>
                    {isRTL ? 'جارٍ التحميل...' : 'Loading…'}
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 32 }}>
                    {isRTL ? 'لا توجد طلبات' : 'No concierge requests found'}
                  </td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} onClick={() => nav(`/admin/concierge/${r.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.requester?.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{r.requester?.email}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{r.request_type?.replace('_', ' ') || '—'}</td>
                    <td style={{ maxWidth: 240 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {r.description || '—'}
                      </div>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.budget ? `${r.budget} ${r.currency}` : '—'}</td>
                    <td><AdminStatusBadge status={r.status} lang={lang} /></td>
                    <td style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{fmt(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="admin-cr-cards">
            {loading && <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', fontSize: 14 }}>{isRTL ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && filtered.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', fontSize: 14 }}>{isRTL ? 'لا توجد طلبات' : 'No requests found'}</p>}
            {filtered.map(r => (
              <div key={r.id} className="admin-cr-card" onClick={() => nav(`/admin/concierge/${r.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{r.requester?.full_name || r.requester?.email || '—'}</div>
                    {r.requester?.company_name && <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{r.requester.company_name}</div>}
                  </div>
                  <AdminStatusBadge status={r.status} lang={lang} />
                </div>
                {r.description && (
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {r.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {r.request_type && <div><div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{isRTL ? 'النوع' : 'TYPE'}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{r.request_type.replace('_', ' ')}</div></div>}
                  {r.budget && <div><div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{isRTL ? 'الميزانية' : 'BUDGET'}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{r.budget} {r.currency}</div></div>}
                  <div><div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{isRTL ? 'التاريخ' : 'DATE'}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>{fmt(r.created_at)}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
