import React, { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { sb } from '../../supabase';

function KPICard({ label, value, sub, color, loading }) {
  return (
    <div className="admin-kpi-card">
      <p className="admin-kpi-label">{label}</p>
      <p className="admin-kpi-value" style={{ color: color || 'var(--text-primary)' }}>
        {loading ? '—' : (value ?? '—')}
      </p>
      {sub && <p className="admin-kpi-sub">{sub}</p>}
    </div>
  );
}

async function fetchKPIs() {
  const [
    { count: totalSuppliers },
    { count: pendingVerification },
    { count: activeSuppliers },
    { count: totalBuyers },
    { count: openManaged },
    { count: openConcierge },
    { count: openDisputes },
    { count: totalRequests },
  ] = await Promise.all([
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier').eq('status', 'verification_under_review'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier').eq('status', 'active'),
    sb.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['buyer', 'trader']),
    sb.from('managed_requests').select('*', { count: 'exact', head: true }).in('status', ['open', 'assigned', 'sourcing']),
    sb.from('concierge_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    sb.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review', 'mediating']),
    sb.from('requests').select('*', { count: 'exact', head: true }),
  ]);
  return { totalSuppliers, pendingVerification, activeSuppliers, totalBuyers, openManaged, openConcierge, openDisputes, totalRequests };
}

export default function AdminOverview({ user, profile, lang, ...rest }) {
  const [kpis, setKpis] = useState(null);
  const isRTL = lang === 'ar';

  useEffect(() => {
    fetchKPIs().then(setKpis).catch(console.error);
  }, []);

  const loading = !kpis;

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{`
          .admin-overview { padding: 32px 28px; max-width: 1100px; }
          .admin-page-title {
            margin: 0 0 6px; font-size: 26px; font-weight: 300; color: var(--text-primary);
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
          }
          .admin-page-sub {
            margin: 0 0 28px; font-size: 13px; color: var(--text-tertiary);
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
          }
          .admin-section-label {
            margin: 0 0 14px; font-size: 11px; letter-spacing: 1.8px; text-transform: uppercase;
            color: var(--text-tertiary); font-family: var(--font-sans);
          }
          .admin-kpi-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px;
          }
          .admin-kpi-card {
            background: var(--bg-raised); border: 1px solid var(--border-subtle);
            border-radius: 16px; padding: 20px 18px;
          }
          .admin-kpi-label {
            margin: 0 0 10px; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase;
            color: var(--text-tertiary); font-family: var(--font-sans);
          }
          .admin-kpi-value {
            margin: 0 0 4px; font-size: 36px; font-weight: 200; line-height: 1;
            font-family: var(--font-sans); color: var(--text-primary);
          }
          .admin-kpi-sub {
            margin: 0; font-size: 11px; color: var(--text-tertiary);
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
          }
          .admin-quick-links { display: flex; gap: 10px; flex-wrap: wrap; }
          .admin-quick-link {
            padding: 10px 18px; border: 1px solid var(--border-default); border-radius: 10px;
            background: transparent; cursor: pointer; font-size: 13px; color: var(--text-secondary);
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
            min-height: 44px; transition: all 0.15s;
          }
          .admin-quick-link:hover { background: var(--bg-raised); color: var(--text-primary); border-color: var(--border-default); }

          @media (max-width: 900px) { .admin-overview { padding: 20px 16px; } }
          @media (max-width: 768px) {
            .admin-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
            .admin-kpi-value { font-size: 30px; }
            .admin-page-title { font-size: 22px; }
          }
          @media (max-width: 420px) {
            .admin-kpi-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="admin-overview" dir={isRTL ? 'rtl' : 'ltr'}>
          <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
            MAABAR ADMIN
          </p>
          <h1 className="admin-page-title">{isRTL ? 'نظرة عامة' : 'Overview'}</h1>
          <p className="admin-page-sub">
            {isRTL ? `مرحباً ${profile?.full_name?.split(' ')[0] || ''}` : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Admin'}`}
          </p>

          {/* Suppliers */}
          <p className="admin-section-label">{isRTL ? 'الموردون' : 'Suppliers'}</p>
          <div className="admin-kpi-grid">
            <KPICard label={isRTL ? 'المجموع' : 'Total'} value={kpis?.totalSuppliers} loading={loading} />
            <KPICard label={isRTL ? 'قيد المراجعة' : 'Pending Review'} value={kpis?.pendingVerification} loading={loading} color="#d97706" />
            <KPICard label={isRTL ? 'نشطون' : 'Active'} value={kpis?.activeSuppliers} loading={loading} color="#16a34a" />
            <KPICard label={isRTL ? 'التجار' : 'Traders'} value={kpis?.totalBuyers} loading={loading} />
          </div>

          {/* Operations */}
          <p className="admin-section-label">{isRTL ? 'العمليات' : 'Operations'}</p>
          <div className="admin-kpi-grid">
            <KPICard label={isRTL ? 'طلبات مفتوحة' : 'Open Requests'} value={kpis?.totalRequests} loading={loading} />
            <KPICard label={isRTL ? 'إدارة نشطة' : 'Active Managed'} value={kpis?.openManaged} loading={loading} color="#7c3aed" />
            <KPICard label={isRTL ? 'كونسيرج نشط' : 'Active Concierge'} value={kpis?.openConcierge} loading={loading} color="#2563eb" />
            <KPICard label={isRTL ? 'نزاعات مفتوحة' : 'Open Disputes'} value={kpis?.openDisputes} loading={loading} color={kpis?.openDisputes > 0 ? '#dc2626' : undefined} />
          </div>

          {/* Quick links */}
          <p className="admin-section-label">{isRTL ? 'روابط سريعة' : 'Quick access'}</p>
          <div className="admin-quick-links">
            {kpis?.pendingVerification > 0 && (
              <a href="/admin/suppliers?tab=pending_review" style={{ textDecoration: 'none' }}>
                <button className="admin-quick-link">
                  {isRTL ? `${kpis.pendingVerification} موردون ينتظرون المراجعة` : `${kpis.pendingVerification} supplier${kpis.pendingVerification > 1 ? 's' : ''} awaiting review`}
                </button>
              </a>
            )}
            {kpis?.openDisputes > 0 && (
              <a href="/admin/disputes" style={{ textDecoration: 'none' }}>
                <button className="admin-quick-link" style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}>
                  {isRTL ? `${kpis.openDisputes} نزاع مفتوح` : `${kpis.openDisputes} open dispute${kpis.openDisputes > 1 ? 's' : ''}`}
                </button>
              </a>
            )}
            <a href="/admin/managed" style={{ textDecoration: 'none' }}>
              <button className="admin-quick-link">{isRTL ? 'الطلبات المُدارة' : 'Managed Requests'}</button>
            </a>
            <a href="/admin/concierge" style={{ textDecoration: 'none' }}>
              <button className="admin-quick-link">{isRTL ? 'الكونسيرج' : 'Concierge'}</button>
            </a>
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
