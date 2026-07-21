import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import {
  getSupplierReviewQueueStatuses,
  getSupplierPublicVisibilityStatuses,
} from '../../lib/supplierOnboarding';
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
    // Canonical status vocabulary (supplierOnboarding.js), not hardcoded guesses.
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier').in('status', getSupplierReviewQueueStatuses()),
    // Was .eq('status','active') — approvals write 'verified', so this KPI was
    // permanently 0. Same defect the Suppliers "Active" tab had.
    sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier').in('status', getSupplierPublicVisibilityStatuses()),
    sb.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['buyer', 'trader']),
    sb.from('requests').select('*', { count: 'exact', head: true }).eq('sourcing_mode', 'managed').not('managed_status', 'is', null),
    // Was concierge_requests — a table the buyer flow never populates (AdminConcierge
    // documents this), so the KPI was always 0. Managed requests live in requests.
    sb.from('requests').select('*', { count: 'exact', head: true }).eq('sourcing_mode', 'managed').in('managed_status', ['pending', 'sourcing', 'matching', 'in_progress']),
    sb.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review', 'mediating']),
    // Tile is labelled "Open Requests" — it had no status filter at all.
    sb.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
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
          .a-overview { padding: 0 0 36px; max-width: 1080px; }
          .ov-body { padding: 0 32px; }

          /* Console header — states "لوحة الإدارة" outright, at display scale.
             Kept light so it complements the dark sidebar instead of competing. */
          .ov-hero {
            position: relative; overflow: hidden;
            padding: 40px 32px 34px; margin-bottom: 34px;
            background: linear-gradient(160deg, var(--bg-hero) 0%, var(--bg-page) 62%);
            border-bottom: 1px solid var(--border);
          }
          .ov-hero::after {
            content: ''; position: absolute; top: 0; bottom: 0; width: 3px; background: var(--ink);
          }
          .ov-hero.ltr::after { left: 0; }
          .ov-hero.rtl::after { right: 0; }
          .ov-eyebrow {
            margin: 0 0 12px; font-size: 10px; font-weight: 600;
            letter-spacing: 0.32em; text-transform: uppercase;
            color: var(--text-muted); font-family: var(--font-sans);
          }
          .ov-title { margin: 0; display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
          .ov-title-ar {
            font-family: var(--font-ar); font-size: 40px; font-weight: 700;
            color: var(--ink); line-height: 1.05; letter-spacing: -0.01em;
          }
          .ov-title-en {
            font-family: var(--font-sans); font-size: 15px; font-weight: 500;
            letter-spacing: 0.26em; text-transform: uppercase; color: var(--text-secondary);
          }
          .ov-rule { width: 46px; height: 2px; background: var(--ink); margin: 18px 0 14px; opacity: 0.85; }
          .ov-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
          .ov-welcome { margin: 0; font-size: 14px; color: var(--text-secondary); }
          .ov-role {
            font-size: 9px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
            color: var(--on-dark); background: var(--ink); padding: 3px 9px; border-radius: 4px;
            font-family: var(--font-sans);
          }
          @media (max-width: 900px) {
            .ov-hero { padding: 28px 18px 24px; margin-bottom: 24px; }
            .ov-title-ar { font-size: 30px; }
            .ov-title-en { font-size: 12px; letter-spacing: 0.2em; }
            .ov-body { padding: 0 18px; }
          }
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
          {/* Console header */}
          <header className={`ov-hero ${isAr ? 'rtl' : 'ltr'}`}>
            <p className="ov-eyebrow">MAABAR · معبر</p>
            <h1 className="ov-title">
              <span className="ov-title-ar">لوحة الإدارة</span>
              <span className="ov-title-en">Admin Console</span>
            </h1>
            <div className="ov-rule" />
            <div className="ov-meta">
              <p className="ov-welcome" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr
                  ? `مرحباً، ${profile?.full_name?.split(' ')[0] || ''}`
                  : `Welcome back, ${profile?.full_name?.split(' ')[0] || 'Admin'}`}
              </p>
              {profile?.role && <span className="ov-role">{profile.role.replace('_', ' ')}</span>}
            </div>
          </header>

          <div className="ov-body">
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
              onClick={() => nav('/admin/suppliers?tab=verified')}
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
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
