import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { sb } from '../../supabase';

const TABS = [
  { key: 'all',            labelEn: 'All',             labelAr: 'الكل' },
  { key: 'pending_review', labelEn: 'Pending Review',  labelAr: 'قيد المراجعة' },
  { key: 'active',         labelEn: 'Active',          labelAr: 'نشطون' },
  { key: 'rejected',       labelEn: 'Rejected',        labelAr: 'مرفوضون' },
  { key: 'inactive',       labelEn: 'Inactive',        labelAr: 'غير نشطين' },
];

const TAB_FILTER = {
  all:            null,
  pending_review: ['verification_under_review'],
  active:         ['active'],
  rejected:       ['rejected'],
  inactive:       ['inactive'],
};

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminSuppliers({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const [tab, setTab] = useState(TABS.find(t => t.key === initialTab) ? initialTab : 'all');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isRTL = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('profiles')
      .select('id, full_name, email, company_name, country, city, status, created_at, maabar_supplier_id, trade_link')
      .eq('role', 'supplier')
      .order('created_at', { ascending: false })
      .limit(200);

    const statuses = TAB_FILTER[tab];
    if (statuses) q = q.in('status', statuses);

    const { data } = await q;
    setSuppliers(data || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? suppliers.filter(s => {
        const q = search.toLowerCase();
        return (s.full_name || '').toLowerCase().includes(q)
          || (s.email || '').toLowerCase().includes(q)
          || (s.company_name || '').toLowerCase().includes(q)
          || (s.country || '').toLowerCase().includes(q);
      })
    : suppliers;

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{`
          .admin-suppliers { padding: 32px 28px; max-width: 1100px; }
          .admin-tabs {
            display: flex; gap: 4px; margin-bottom: 20px;
            overflow-x: auto; -webkit-overflow-scrolling: touch;
            scrollbar-width: none; padding-bottom: 2px;
          }
          .admin-tabs::-webkit-scrollbar { display: none; }
          .admin-tab {
            flex-shrink: 0; padding: 8px 16px; border-radius: 99px; border: 1px solid var(--border-default);
            background: transparent; cursor: pointer; font-size: 13px; color: var(--text-secondary);
            min-height: 36px; transition: all 0.12s; white-space: nowrap;
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
          }
          .admin-tab.active { background: var(--text-primary); color: var(--bg-base); border-color: var(--text-primary); font-weight: 600; }
          .admin-tab:not(.active):hover { background: var(--bg-raised); }
          .admin-search {
            width: 100%; max-width: 380px; padding: 10px 14px; margin-bottom: 20px;
            background: var(--bg-raised); border: 1px solid var(--border-default);
            border-radius: 10px; font-size: 14px; color: var(--text-primary);
            font-family: var(--font-sans); outline: none; box-sizing: border-box;
          }

          /* Desktop table */
          .admin-table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid var(--border-subtle); }
          .admin-table { width: 100%; border-collapse: collapse; }
          .admin-table th {
            padding: 12px 16px; font-size: 11px; font-weight: 600; letter-spacing: 1px;
            text-transform: uppercase; color: var(--text-tertiary); text-align: ${isRTL ? 'right' : 'left'};
            background: var(--bg-raised); border-bottom: 1px solid var(--border-subtle); white-space: nowrap;
            font-family: var(--font-sans);
          }
          .admin-table td {
            padding: 14px 16px; font-size: 14px; color: var(--text-primary);
            border-bottom: 1px solid var(--border-subtle); vertical-align: middle;
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
          }
          .admin-table tr:last-child td { border-bottom: none; }
          .admin-table tbody tr { cursor: pointer; transition: background 0.1s; }
          .admin-table tbody tr:hover td { background: var(--bg-raised); }

          /* Mobile cards */
          .admin-supplier-cards { display: none; gap: 10px; flex-direction: column; }
          .admin-supplier-card {
            background: var(--bg-raised); border: 1px solid var(--border-subtle);
            border-radius: 14px; padding: 16px; cursor: pointer;
            transition: border-color 0.12s;
          }
          .admin-supplier-card:active { border-color: var(--border-default); }
          .admin-card-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 8px; }
          .admin-card-label { font-size: 11px; color: var(--text-tertiary); font-family: var(--font-sans); letter-spacing: 0.5px; }
          .admin-card-value { font-size: 14px; color: var(--text-primary); font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; }

          @media (max-width: 900px) {
            .admin-suppliers { padding: 20px 16px; }
            .admin-search { max-width: 100%; }
          }
          @media (max-width: 768px) {
            .admin-table-wrap { display: none; }
            .admin-supplier-cards { display: flex; }
          }
          @media (min-width: 769px) {
            .admin-supplier-cards { display: none; }
          }
        `}</style>

        <div className="admin-suppliers" dir={isRTL ? 'rtl' : 'ltr'}>
          <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isRTL ? 'الموردون' : 'Suppliers'}
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-tertiary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {loading ? '…' : `${filtered.length} ${isRTL ? 'مورد' : 'supplier' + (filtered.length !== 1 ? 's' : '')}`}
          </p>

          {/* Tabs */}
          <div className="admin-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`admin-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {isRTL ? t.labelAr : t.labelEn}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            className="admin-search"
            placeholder={isRTL ? 'بحث بالاسم أو الشركة أو البريد...' : 'Search by name, company, email…'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
          />

          {/* Desktop table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isRTL ? 'المورد' : 'Supplier'}</th>
                  <th>{isRTL ? 'الشركة' : 'Company'}</th>
                  <th>{isRTL ? 'الدولة' : 'Country'}</th>
                  <th>{isRTL ? 'الحالة' : 'Status'}</th>
                  <th>{isRTL ? 'تاريخ التسجيل' : 'Joined'}</th>
                  <th>{isRTL ? 'معرّف معبر' : 'Maabar ID'}</th>
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
                    {isRTL ? 'لا توجد نتائج' : 'No suppliers found'}
                  </td></tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => nav(`/admin/suppliers/${s.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{s.full_name || '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{s.email}</div>
                    </td>
                    <td>{s.company_name || '—'}</td>
                    <td>{s.country || '—'}</td>
                    <td><AdminStatusBadge status={s.status} lang={lang} /></td>
                    <td style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-secondary)' }}>{fmt(s.created_at)}</td>
                    <td style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--text-tertiary)' }}>{s.maabar_supplier_id || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="admin-supplier-cards">
            {loading && <p style={{ color: 'var(--text-tertiary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', fontSize: 14 }}>{isRTL ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && filtered.length === 0 && <p style={{ color: 'var(--text-tertiary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', fontSize: 14 }}>{isRTL ? 'لا توجد نتائج' : 'No suppliers found'}</p>}
            {filtered.map(s => (
              <div key={s.id} className="admin-supplier-card" onClick={() => nav(`/admin/suppliers/${s.id}`)}>
                <div className="admin-card-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>{s.full_name || '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{s.email}</div>
                  </div>
                  <AdminStatusBadge status={s.status} lang={lang} />
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
                  <div>
                    <div className="admin-card-label">{isRTL ? 'الشركة' : 'COMPANY'}</div>
                    <div className="admin-card-value">{s.company_name || '—'}</div>
                  </div>
                  <div>
                    <div className="admin-card-label">{isRTL ? 'الدولة' : 'COUNTRY'}</div>
                    <div className="admin-card-value">{s.country || '—'}</div>
                  </div>
                  <div>
                    <div className="admin-card-label">{isRTL ? 'تاريخ التسجيل' : 'JOINED'}</div>
                    <div className="admin-card-value" style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}>{fmt(s.created_at)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
