import React, { useEffect, useState, useCallback } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { sb } from '../../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

// The group-by charts still need rows, so they stay bounded and explicit rather
// than unbounded-and-silently-capped. Scalars above use exact counts instead.
// A proper fix is a server-side group-by RPC; this at least stops lying quietly.
const CHART_ROW_CAP = 2000;

const CSS = `
  .an-page { padding: 36px 32px; max-width: 1080px; }
  .an-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .an-page-sub { margin: 0 0 28px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .an-section-title { margin: 0 0 12px; font-size: 10px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .an-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 28px; }
  .an-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
  .an-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 28px; }
  .an-tile { background: var(--bg-raised, #fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 20px; }
  .an-tile-label { margin: 0 0 10px; font-size: 10px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .an-tile-value { margin: 0; font-size: 36px; font-weight: 300; line-height: 1; letter-spacing: -0.02em; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; font-variant-numeric: lining-nums; }
  .an-tile-sub { margin: 8px 0 0; font-size: 11px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .an-bar-wrap { background: var(--bg-raised, #fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 20px; margin-bottom: 28px; }
  .an-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .an-bar-label { font-size: 11px; color: rgba(0,0,0,0.55); font-family: ${FONT_BODY}; width: 110px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .an-bar-track { flex: 1; height: 6px; background: rgba(0,0,0,0.06); border-radius: 99px; overflow: hidden; }
  .an-bar-fill { height: 100%; border-radius: 99px; background: #1a1814; transition: width 0.4s; }
  .an-bar-count { font-size: 11px; color: rgba(0,0,0,0.40); font-family: ${FONT_BODY}; font-variant-numeric: lining-nums; width: 40px; text-align: right; flex-shrink: 0; }
  @media (max-width: 900px) { .an-page { padding: 22px 16px; } .an-grid-4 { grid-template-columns: repeat(2, 1fr); } .an-grid-3 { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 480px) { .an-grid-4 { grid-template-columns: repeat(2, 1fr); } .an-grid-3 { grid-template-columns: 1fr; } .an-grid-2 { grid-template-columns: 1fr; } }
`;

function Tile({ label, value, sub, color }) {
  return (
    <div className="an-tile">
      <p className="an-tile-label">{label}</p>
      <p className="an-tile-value" style={color ? { color } : {}}>{value ?? '—'}</p>
      {sub && <p className="an-tile-sub">{sub}</p>}
    </div>
  );
}

function BarChart({ title, rows, colorFn }) {
  const max = Math.max(...rows.map(r => r.count), 1);
  return (
    <div className="an-bar-wrap">
      <p className="an-section-title">{title}</p>
      {rows.map(r => (
        <div key={r.label} className="an-bar-row">
          <span className="an-bar-label">{r.label}</span>
          <div className="an-bar-track">
            <div className="an-bar-fill" style={{ width: `${(r.count / max) * 100}%`, background: colorFn ? colorFn(r.label) : '#1a1814' }} />
          </div>
          <span className="an-bar-count">{r.count.toLocaleString('en-US')}</span>
        </div>
      ))}
      {rows.length === 0 && <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY }}>No data</p>}
    </div>
  );
}

function fmt(n, decimals = 0) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtSAR(n) { return n != null ? fmt(n) + ' SAR' : '—'; }

export default function AdminAnalytics({ user, profile, lang, ...rest }) {
  const isAr = lang === 'ar';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Scalars come from exact server-side counts. Previously every figure was
    // computed client-side over unbounded .select() calls with no .range()/.limit(),
    // so past PostgREST's max-rows cap each number silently went wrong with no
    // visual indicator. Counts transfer no rows and are correct at any scale.
    const cnt  = (q) => q.then(({ count, error }) => (error ? 0 : (count || 0)));
    const rows = (q) => q.then(({ data, error }) => (error ? [] : (data || [])));

    const nowMs  = Date.now();
    const past30 = new Date(nowMs - 30 * 86400000).toISOString();
    const past7  = new Date(nowMs - 7  * 86400000).toISOString();

    // profiles has NO is_active column — the old `p.is_active !== false` was true for
    // every row (undefined !== false), so "Active Users" always equalled "Total Users".
    // Profiles carry `status`; active is the absence of a disabling one.
    const INACTIVE_STATUSES = ['inactive', 'rejected', 'disabled', 'suspended'];

    const [
      totalUsers, suppliers, buyers, inactiveUsers, newUsers30,
      totalOrders, newOrders7, openTickets, openDisputes,
      totalRequests, pendingReq,
      orderRows, ticketRows, disputeRows, profileRows,
    ] = await Promise.all([
      cnt(sb.from('profiles').select('*', { count: 'exact', head: true })),
      cnt(sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'supplier')),
      cnt(sb.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['buyer', 'trader'])),
      cnt(sb.from('profiles').select('*', { count: 'exact', head: true }).in('status', INACTIVE_STATUSES)),
      cnt(sb.from('profiles').select('*', { count: 'exact', head: true }).gt('created_at', past30)),
      cnt(sb.from('orders').select('*', { count: 'exact', head: true })),
      cnt(sb.from('orders').select('*', { count: 'exact', head: true }).gt('created_at', past7)),
      cnt(sb.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])),
      cnt(sb.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review', 'mediating'])),
      // was service_requests — a table that does not exist, so both request tiles
      // silently rendered 0. The real buyer requests live in public.requests.
      cnt(sb.from('requests').select('*', { count: 'exact', head: true })),
      cnt(sb.from('requests').select('*', { count: 'exact', head: true }).in('status', ['open', 'pending'])),
      rows(sb.from('orders').select('status, amount, currency, platform_fee_pct, platform_fee_amount').limit(CHART_ROW_CAP)),
      rows(sb.from('support_tickets').select('status').limit(CHART_ROW_CAP)),
      rows(sb.from('disputes').select('severity').limit(CHART_ROW_CAP)),
      rows(sb.from('profiles').select('role').limit(CHART_ROW_CAP)),
    ]);

    const countBy = (arr, key) => {
      const map = {};
      (arr || []).forEach(r => { const v = r[key] || 'unknown'; map[v] = (map[v] || 0) + 1; });
      return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }));
    };

    const paidOrders = orderRows.filter(o => o.status === 'paid' && o.currency === 'SAR');
    const gmv  = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
    const fees = paidOrders.reduce((s, o) => s + (o.platform_fee_amount ?? (o.amount * (o.platform_fee_pct || 5) / 100)), 0);

    setData({
      totalUsers,
      activeUsers: Math.max(totalUsers - inactiveUsers, 0),
      newUsers30,
      suppliers,
      buyers,
      gmv,
      fees,
      totalOrders,
      newOrders7,
      openTickets,
      openDisputes,
      totalRequests,
      pendingReq,
      ordersByStatus: countBy(orderRows, 'status'),
      ticketsByStatus: countBy(ticketRows, 'status'),
      disputesBySeverity: countBy(disputeRows, 'severity'),
      usersByRole: countBy(profileRows, 'role'),
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const STATUS_COLORS = { open: '#c0392b', in_progress: '#8B6914', resolved: '#27725a', closed: 'rgba(0,0,0,0.35)', paid: '#27725a', refunded: '#c0392b', disputed: '#c0392b', pending_payment: '#8B6914', cancelled: 'rgba(0,0,0,0.35)' };

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="an-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="an-page-title">{isAr ? 'التحليلات' : 'Analytics'}</h1>
          <p className="an-page-sub">{isAr ? 'نظرة عامة على أداء المنصة' : 'Platform performance overview'}</p>

          {loading ? (
            <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>
          ) : (
            <>
              <p className="an-section-title">{isAr ? 'المستخدمون' : 'Users'}</p>
              <div className="an-grid-4">
                <Tile label={isAr ? 'إجمالي المستخدمين' : 'Total Users'}   value={fmt(data.totalUsers)}  sub={isAr ? 'جميع الأدوار' : 'All roles'} />
                <Tile label={isAr ? 'المستخدمون النشطون' : 'Active Users'} value={fmt(data.activeUsers)} />
                <Tile label={isAr ? 'الموردون' : 'Suppliers'}              value={fmt(data.suppliers)}    color="#27725a" />
                <Tile label={isAr ? 'المشترون' : 'Buyers / Traders'}       value={fmt(data.buyers)} />
              </div>
              <Tile label={isAr ? 'مستخدمون جدد (30 يوماً)' : 'New Users (30 days)'} value={fmt(data.newUsers30)} style={{ marginBottom: 28 }} />

              <p className="an-section-title" style={{ marginTop: 4 }}>{isAr ? 'الطلبات والمدفوعات' : 'Orders & Payments'}</p>
              {data.totalOrders === 0 && (
                <p style={{ margin: '0 0 12px', padding: '10px 13px', borderRadius: 8, background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.18)', color: '#8B6914', fontSize: 12, fontFamily: FONT_BODY }}>
                  {isAr
                    ? 'هذه الأرقام تقرأ جدول orders، ولا يكتب فيه أي مسار في التطبيق — المدفوعات الفعلية في جدول payments. فالأصفار هنا لا تعني عدم وجود مبيعات.'
                    : 'These figures read the orders table, which no app flow writes to — real money lives in payments. Zeros here do not mean there were no sales.'}
                </p>
              )}
              <div className="an-grid-4">
                <Tile label={isAr ? 'حجم المعاملات' : 'GMV (SAR)'}        value={fmtSAR(data.gmv)}       color="#27725a" />
                <Tile label={isAr ? 'رسوم المنصة' : 'Platform Fees'}      value={fmtSAR(data.fees)}      color="#8B6914" />
                <Tile label={isAr ? 'إجمالي الطلبات' : 'Total Orders'}    value={fmt(data.totalOrders)} />
                <Tile label={isAr ? 'طلبات جديدة (7 أيام)' : 'New Orders (7 days)'} value={fmt(data.newOrders7)} />
              </div>

              <p className="an-section-title">{isAr ? 'الدعم والنزاعات' : 'Support & Disputes'}</p>
              <div className="an-grid-4">
                <Tile label={isAr ? 'تذاكر مفتوحة' : 'Open Tickets'}     value={fmt(data.openTickets)}  color={data.openTickets > 0 ? '#8B6914' : undefined} />
                <Tile label={isAr ? 'نزاعات مفتوحة' : 'Open Disputes'}   value={fmt(data.openDisputes)} color={data.openDisputes > 0 ? '#c0392b' : undefined} />
                <Tile label={isAr ? 'إجمالي الطلبات' : 'Total Requests'}  value={fmt(data.totalRequests)} />
                <Tile label={isAr ? 'طلبات معلّقة' : 'Pending Requests'}  value={fmt(data.pendingReq)}  color={data.pendingReq > 0 ? '#8B6914' : undefined} />
              </div>

              <BarChart
                title={isAr ? 'الطلبات حسب الحالة' : 'Orders by Status'}
                rows={data.ordersByStatus}
                colorFn={label => STATUS_COLORS[label] || '#1a1814'}
              />
              <BarChart
                title={isAr ? 'التذاكر حسب الحالة' : 'Tickets by Status'}
                rows={data.ticketsByStatus}
                colorFn={label => STATUS_COLORS[label] || '#1a1814'}
              />
              <div className="an-grid-2">
                <BarChart title={isAr ? 'النزاعات حسب الخطورة' : 'Disputes by Severity'} rows={data.disputesBySeverity} colorFn={l => l === 'high' ? '#c0392b' : l === 'medium' ? '#8B6914' : 'rgba(0,0,0,0.38)'} />
                <BarChart title={isAr ? 'المستخدمون حسب الدور' : 'Users by Role'} rows={data.usersByRole} />
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
