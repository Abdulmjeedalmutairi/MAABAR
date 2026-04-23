import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { sb } from '../../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY = "'Tajawal', sans-serif";

function KPITile({ label, value, sub, accentColor, loading, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-raised, #fff)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 10, padding: '22px 20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.14)')}
      onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)')}
    >
      <p style={{
        margin: '0 0 12px', fontSize: 10, fontWeight: 500, letterSpacing: 1.8,
        textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY,
      }}>
        {label}
      </p>
      <p style={{
        margin: 0, fontSize: 44, fontWeight: 300, lineHeight: 1,
        letterSpacing: '-0.03em', color: loading ? 'rgba(0,0,0,0.12)' : (accentColor || 'rgba(0,0,0,0.88)'),
        fontFamily: FONT_HEADING,
        fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1',
      }}>
        {loading ? '—' : (value ?? 0)}
      </p>
      {sub && (
        <p style={{
          margin: '8px 0 0', fontSize: 12, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY, lineHeight: 1.4,
        }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p style={{
      margin: '0 0 14px', fontSize: 11, fontWeight: 600, letterSpacing: 1.6,
      textTransform: 'uppercase', color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY,
    }}>
      {children}
    </p>
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
    sb.from('requests').select('*', { count: 'exact', head: true }).eq('sourcing_mode', 'managed').not('managed_status', 'is', null),
    sb.from('concierge_requests').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
    sb.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review', 'mediating']),
    sb.from('requests').select('*', { count: 'exact', head: true }),
  ]);
  return { totalSuppliers, pendingVerification, activeSuppliers, totalBuyers, openManaged, openConcierge, openDisputes, totalRequests };
}

export default function AdminOverview({ user, profile, lang, ...rest }) {
  const nav = useNavigate();
  const [kpis, setKpis] = useState(null);
  const isAr = lang === 'ar';
  const loading = !kpis;

  useEffect(() => { fetchKPIs().then(setKpis).catch(console.error); }, []);

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{`
          .a-overview { padding: 36px 32px; max-width: 1080px; }
          .a-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 32px; }
          .a-quick-links { display: flex; gap: 8px; flex-wrap: wrap; }
          .a-quick-btn {
            padding: 9px 16px; border: 1px solid rgba(0,0,0,0.09); border-radius: 8px;
            background: transparent; cursor: pointer; font-size: 13px;
            color: rgba(0,0,0,0.55); font-family: '${FONT_BODY}';
            min-height: 44px; transition: all 0.12s; white-space: nowrap;
          }
          .a-quick-btn:hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.80); border-color: rgba(0,0,0,0.14); }
          .a-quick-btn.urgent { color: #c0392b; border-color: rgba(192,57,43,0.25); }
          .a-quick-btn.urgent:hover { background: rgba(192,57,43,0.05); border-color: rgba(192,57,43,0.4); }
          .a-quick-btn.amber { color: #8B6914; border-color: rgba(139,105,20,0.25); }
          .a-quick-btn.amber:hover { background: rgba(139,105,20,0.05); border-color: rgba(139,105,20,0.4); }

          @media (max-width: 900px) { .a-overview { padding: 24px 18px; } }
          @media (max-width: 768px) {
            .a-kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; }
          }
          @media (max-width: 400px) {
            .a-kpi-grid { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="a-overview" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Page header */}
          <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(0,0,0,0.28)', fontFamily: FONT_BODY }}>
            MAABAR ADMIN
          </p>
          <h1 style={{ margin: '0 0 28px', fontSize: 28, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
            {isAr ? `مرحباً، ${profile?.full_name?.split(' ')[0] || ''}` : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Admin'}`}
          </h1>

          {/* Suppliers section */}
          <SectionTitle>{isAr ? 'الموردون' : 'Suppliers'}</SectionTitle>
          <div className="a-kpi-grid">
            <KPITile
              label={isAr ? 'إجمالي الموردين' : 'Total Suppliers'}
              value={kpis?.totalSuppliers}
              sub={isAr ? 'مسجلون في المنصة' : 'Registered on platform'}
              loading={loading}
              onClick={() => nav('/admin/suppliers')}
            />
            <KPITile
              label={isAr ? 'قيد المراجعة' : 'Pending Review'}
              value={kpis?.pendingVerification}
              sub={isAr ? 'ينتظرون الموافقة' : 'Awaiting approval'}
              accentColor={kpis?.pendingVerification > 0 ? '#8B6914' : undefined}
              loading={loading}
              onClick={() => nav('/admin/suppliers?tab=pending_review')}
            />
            <KPITile
              label={isAr ? 'موردون نشطون' : 'Active Suppliers'}
              value={kpis?.activeSuppliers}
              sub={isAr ? 'موثّقون ومعتمدون' : 'Verified & approved'}
              accentColor={kpis?.activeSuppliers > 0 ? '#27725a' : undefined}
              loading={loading}
              onClick={() => nav('/admin/suppliers?tab=active')}
            />
            <KPITile
              label={isAr ? 'التجار' : 'Traders'}
              value={kpis?.totalBuyers}
              sub={isAr ? 'مسجلون في المنصة' : 'Registered buyers'}
              loading={loading}
            />
          </div>

          {/* Operations section */}
          <SectionTitle>{isAr ? 'العمليات' : 'Operations'}</SectionTitle>
          <div className="a-kpi-grid">
            <KPITile
              label={isAr ? 'طلبات مفتوحة' : 'Open Requests'}
              value={kpis?.totalRequests}
              sub={isAr ? 'طلبات RFQ نشطة' : 'Active RFQ requests'}
              loading={loading}
            />
            <KPITile
              label={isAr ? 'إدارة نشطة' : 'Active Managed'}
              value={kpis?.openManaged}
              sub={isAr ? 'تحت المتابعة' : 'Under management'}
              accentColor={kpis?.openManaged > 0 ? '#8B6914' : undefined}
              loading={loading}
            />
            <KPITile
              label={isAr ? 'كونسيرج نشط' : 'Active Concierge'}
              value={kpis?.openConcierge}
              sub={isAr ? 'بحث جارٍ' : 'Actively sourcing'}
              loading={loading}
              onClick={() => nav('/admin/concierge')}
            />
            <KPITile
              label={isAr ? 'نزاعات مفتوحة' : 'Open Disputes'}
              value={kpis?.openDisputes}
              sub={isAr ? 'تحتاج مراجعة' : 'Needs attention'}
              accentColor={kpis?.openDisputes > 0 ? '#c0392b' : undefined}
              loading={loading}
            />
          </div>

          {/* Quick access */}
          <SectionTitle>{isAr ? 'وصول سريع' : 'Quick Access'}</SectionTitle>
          <div className="a-quick-links">
            {kpis?.pendingVerification > 0 && (
              <button className="a-quick-btn amber" onClick={() => nav('/admin/suppliers?tab=pending_review')}>
                {isAr
                  ? `${kpis.pendingVerification} مورد ينتظر المراجعة`
                  : `${kpis.pendingVerification} supplier${kpis.pendingVerification > 1 ? 's' : ''} awaiting review`}
              </button>
            )}
            {kpis?.openDisputes > 0 && (
              <button className="a-quick-btn urgent" onClick={() => nav('/admin/disputes')}>
                {isAr
                  ? `${kpis.openDisputes} نزاع مفتوح`
                  : `${kpis.openDisputes} open dispute${kpis.openDisputes > 1 ? 's' : ''}`}
              </button>
            )}
            <button className="a-quick-btn" onClick={() => nav('/admin/concierge')}>
              {isAr ? 'الكونسيرج' : 'Concierge'}
            </button>
            <button className="a-quick-btn" onClick={() => nav('/admin/suppliers')}>
              {isAr ? 'كل الموردين' : 'All Suppliers'}
            </button>
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
