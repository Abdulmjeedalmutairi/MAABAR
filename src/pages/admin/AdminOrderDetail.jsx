import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const STATUSES = ['pending_payment','paid','processing','shipped','delivered','cancelled','refunded','disputed'];
const DESTRUCTIVE = new Set(['refunded', 'cancelled']);

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtAmt  = (a, c) => a != null ? `${Number(a).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}` : '—';

function SectionCard({ title, children, style }) {
  return (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '20px', marginBottom: 12, ...style }}>
      {title && <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{title}</p>}
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, fontVariantNumeric: 'lining-nums' }}>{value}</div>
    </div>
  );
}

export default function AdminOrderDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [confirm, setConfirm] = useState(null);
  const isAr = lang === 'ar';

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('orders')
      .select('*, buyer:buyer_id(full_name, email, company_name), supplier:supplier_id(full_name, email, company_name)')
      .eq('id', id).single();
    setOrder(data);
    if (data?.refund_reason) setRefundReason(data.refund_reason || '');
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doStatusUpdate = async (newStatus) => {
    if (!order) return;
    setSaving(true);
    const before = { status: order.status };
    const patch = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'refunded' ? { refunded_at: new Date().toISOString(), refund_reason: refundReason.trim() || null } : {}),
      ...(newStatus === 'shipped'   ? { shipped_at:   new Date().toISOString() } : {}),
      ...(newStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
    };
    await sb.from('orders').update(patch).eq('id', id);
    await logAdminAction({ actorId: user.id, action: `order_${newStatus}`, entityType: 'order', entityId: id, beforeState: before, afterState: patch });
    await load();
    showFlash(isAr ? 'تم تحديث الطلب' : 'Order updated');
    setSaving(false);
  };

  const handleStatusClick = (newStatus) => {
    if (DESTRUCTIVE.has(newStatus)) {
      setConfirm({ status: newStatus });
    } else {
      doStatusUpdate(newStatus);
    }
  };

  const CSS = `
    .od-page { padding: 32px 32px; max-width: 880px; }
    .od-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; transition: color 0.12s; }
    .od-back:hover { color: rgba(0,0,0,0.65); }
    .od-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .od-btn { min-height: 36px; padding: 0 14px; border-radius: 7px; font-size: 12px; cursor: pointer; transition: all 0.12s; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); }
    .od-btn:hover { background: rgba(0,0,0,0.04); }
    .od-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .od-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
    .od-btn-danger:hover { background: rgba(192,57,43,0.06); }
    .od-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
    .od-btn-primary:hover { opacity: 0.88; background: #1a1814; }
    .od-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px 24px; }
    .od-amount-box { padding: 20px; background: var(--bg-subtle, #F5F2EE); border-radius: 8px; text-align: center; }
    @media (max-width: 900px) { .od-page { padding: 22px 16px; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="od-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!order) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="od-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Order not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  const fee = order.platform_fee_amount ?? (order.amount * order.platform_fee_pct / 100);
  const net  = order.amount - fee;

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="od-flash">{flashMsg}</div>}

        <AdminConfirmDialog
          isOpen={!!confirm}
          title={confirm?.status === 'refunded' ? (isAr ? 'تأكيد الاسترداد' : 'Confirm Refund') : (isAr ? 'تأكيد الإلغاء' : 'Confirm Cancellation')}
          description={isAr ? 'هذا الإجراء لا يمكن التراجع عنه.' : 'This action cannot be undone.'}
          confirmWord={confirm?.status === 'refunded' ? 'REFUND' : 'CANCEL'}
          onConfirm={() => { doStatusUpdate(confirm.status); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
          isAr={isAr}
          danger
        />

        <div className="od-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="od-back" onClick={() => nav('/admin/orders')}>
            {isAr ? '‹ الطلبات' : '‹ Orders'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {isAr ? 'تفاصيل الطلب' : 'Order Detail'}
              </h1>
              <AdminStatusBadge status={order.status} lang={lang} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.filter(s => s !== order.status).map(s => (
                <button key={s} className={`od-btn${DESTRUCTIVE.has(s) ? ' od-btn-danger' : ''}`} disabled={saving} onClick={() => handleStatusClick(s)}>
                  → {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount summary */}
          <SectionCard>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              <div className="od-amount-box">
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'إجمالي المبلغ' : 'Total Amount'}</div>
                <div style={{ fontSize: 22, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: "'Cormorant Garamond', Georgia, serif", fontVariantNumeric: 'lining-nums' }}>{fmtAmt(order.amount, order.currency)}</div>
              </div>
              <div className="od-amount-box">
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? `رسوم المنصة (${order.platform_fee_pct}%)` : `Platform Fee (${order.platform_fee_pct}%)`}</div>
                <div style={{ fontSize: 22, fontWeight: 400, color: '#8B6914', fontFamily: "'Cormorant Garamond', Georgia, serif", fontVariantNumeric: 'lining-nums' }}>{fmtAmt(fee, order.currency)}</div>
              </div>
              <div className="od-amount-box">
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'صافي للمورد' : 'Net to Supplier'}</div>
                <div style={{ fontSize: 22, fontWeight: 400, color: '#27725a', fontFamily: "'Cormorant Garamond', Georgia, serif", fontVariantNumeric: 'lining-nums' }}>{fmtAmt(net, order.currency)}</div>
              </div>
            </div>
          </SectionCard>

          {/* Parties */}
          <SectionCard title={isAr ? 'الأطراف' : 'Parties'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ padding: 14, background: 'var(--bg-subtle, #F5F2EE)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'المشتري' : 'Buyer'}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{order.buyer?.full_name || '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY, marginTop: 2 }}>{order.buyer?.email}</div>
              </div>
              <div style={{ padding: 14, background: 'var(--bg-subtle, #F5F2EE)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'المورد' : 'Supplier'}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{order.supplier?.company_name || order.supplier?.full_name || '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY, marginTop: 2 }}>{order.supplier?.email}</div>
              </div>
            </div>
          </SectionCard>

          {/* Details */}
          <SectionCard title={isAr ? 'تفاصيل' : 'Details'}>
            <div className="od-info-grid">
              <InfoItem label={isAr ? 'رقم الدفع' : 'Payment Ref'} value={order.payment_reference} />
              <InfoItem label={isAr ? 'طريقة الدفع' : 'Payment Method'} value={order.payment_method} />
              <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'} value={fmtDate(order.created_at)} />
              <InfoItem label={isAr ? 'تاريخ الشحن' : 'Shipped'} value={fmtDate(order.shipped_at)} />
              <InfoItem label={isAr ? 'تاريخ التسليم' : 'Delivered'} value={fmtDate(order.delivered_at)} />
              {order.refunded_at && <InfoItem label={isAr ? 'تاريخ الاسترداد' : 'Refunded'} value={fmtDate(order.refunded_at)} />}
            </div>
            {order.notes && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'ملاحظات' : 'Notes'}</div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', fontFamily: FONT_BODY, lineHeight: 1.6 }}>{order.notes}</p>
              </div>
            )}
          </SectionCard>

          {/* Refund reason */}
          {(order.status === 'refunded' || !['delivered', 'cancelled', 'refunded'].includes(order.status)) && (
            <SectionCard title={isAr ? 'سبب الاسترداد' : 'Refund Reason'}>
              <textarea
                value={refundReason}
                onChange={e => setRefundReason(e.target.value)}
                rows={3}
                placeholder={isAr ? 'سبب الاسترداد إن وُجد...' : 'Refund reason if applicable…'}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, resize: 'vertical', outline: 'none', marginBottom: 10 }}
              />
              <button
                className="od-btn od-btn-danger"
                disabled={saving || !refundReason.trim() || order.status === 'refunded'}
                onClick={() => setConfirm({ status: 'refunded' })}
              >
                {isAr ? 'إصدار استرداد' : 'Issue Refund'}
              </button>
            </SectionCard>
          )}

          <SectionCard>
            <AdminNoteThread entityType="order" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
