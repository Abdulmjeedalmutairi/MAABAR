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

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function SectionCard({ title, children, style }) {
  return (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '20px', marginBottom: 12, ...style }}>
      {title && <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{title}</p>}
      {children}
    </div>
  );
}

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

export default function AdminTraderDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [trader, setTrader] = useState(null);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [confirm, setConfirm] = useState(null);
  const isAr = lang === 'ar';

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: ords }, { data: reqs }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('orders').select('id, created_at, status, amount, currency').eq('buyer_id', id).order('created_at', { ascending: false }).limit(10),
      sb.from('requests').select('id, created_at, status, title, category').eq('buyer_id', id).order('created_at', { ascending: false }).limit(10),
    ]);
    setTrader(t);
    setOrders(ords || []);
    setRequests(reqs || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (newStatus) => {
    if (!trader) return;
    setSaving(true);
    const before = { status: trader.status };
    await sb.from('profiles').update({ status: newStatus }).eq('id', id);
    await logAdminAction({ actorId: user.id, action: `trader_${newStatus}`, entityType: 'trader', entityId: id, beforeState: before, afterState: { status: newStatus } });
    await load();
    showFlash(isAr ? 'تم التحديث' : 'Updated');
    setSaving(false);
  };

  const CSS = `
    .td-page { padding: 32px 32px; max-width: 880px; }
    .td-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; transition: color 0.12s; }
    .td-back:hover { color: rgba(0,0,0,0.65); }
    .td-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .td-btn { min-height: 38px; padding: 0 14px; border-radius: 7px; font-size: 12px; cursor: pointer; transition: all 0.12s; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); }
    .td-btn:hover { background: rgba(0,0,0,0.04); }
    .td-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .td-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
    .td-btn-danger:hover { background: rgba(192,57,43,0.06); }
    .td-btn-green { color: #27725a; border-color: rgba(39,114,90,0.22); }
    .td-btn-green:hover { background: rgba(39,114,90,0.05); }
    .td-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px 24px; }
    .td-order-row { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); align-items: center; font-family: ${FONT_BODY}; }
    .td-order-row:last-child { border-bottom: none; }
    @media (max-width: 900px) { .td-page { padding: 22px 16px; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="td-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!trader) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="td-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Trader not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="td-flash">{flashMsg}</div>}

        <AdminConfirmDialog
          isOpen={!!confirm}
          title={isAr ? 'تأكيد الإجراء' : 'Confirm action'}
          description={isAr ? `هل أنت متأكد من تغيير حالة الحساب؟` : 'Are you sure you want to change this account status?'}
          confirmWord="CONFIRM"
          onConfirm={() => { updateStatus(confirm.status); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
          isAr={isAr}
          danger
        />

        <div className="td-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="td-back" onClick={() => nav('/admin/traders')}>
            {isAr ? '‹ التجار' : '‹ Traders'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {trader.full_name || trader.email}
              </h1>
              <AdminStatusBadge status={trader.status} lang={lang} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {trader.status === 'active' && (
                <button className="td-btn td-btn-danger" disabled={saving} onClick={() => setConfirm({ status: 'inactive' })}>
                  {isAr ? 'إيقاف الحساب' : 'Deactivate'}
                </button>
              )}
              {trader.status !== 'active' && (
                <button className="td-btn td-btn-green" disabled={saving} onClick={() => setConfirm({ status: 'active' })}>
                  {isAr ? 'تفعيل الحساب' : 'Activate'}
                </button>
              )}
            </div>
          </div>

          <SectionCard title={isAr ? 'معلومات الحساب' : 'Account Info'}>
            <div className="td-info-grid">
              <InfoItem label={isAr ? 'الاسم الكامل' : 'Full Name'} value={trader.full_name} />
              <InfoItem label="Email" value={trader.email} />
              <InfoItem label={isAr ? 'الشركة' : 'Company'} value={trader.company_name} />
              <InfoItem label={isAr ? 'الدولة' : 'Country'} value={trader.country} />
              <InfoItem label={isAr ? 'المدينة' : 'City'} value={trader.city} />
              <InfoItem label={isAr ? 'واتساب' : 'WhatsApp'} value={trader.whatsapp} />
              <InfoItem label={isAr ? 'تاريخ التسجيل' : 'Joined'} value={fmtDate(trader.created_at)} />
            </div>
          </SectionCard>

          {orders.length > 0 && (
            <SectionCard title={isAr ? `الطلبات (${orders.length})` : `Orders (${orders.length})`}>
              {orders.map(o => (
                <div key={o.id} className="td-order-row">
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.60)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(o.created_at)}</span>
                  <span style={{ fontSize: 12, fontVariantNumeric: 'lining-nums', color: 'rgba(0,0,0,0.75)' }}>{o.amount} {o.currency}</span>
                  <AdminStatusBadge status={o.status} lang={lang} />
                </div>
              ))}
            </SectionCard>
          )}

          {requests.length > 0 && (
            <SectionCard title={isAr ? `طلبات RFQ (${requests.length})` : `RFQ Requests (${requests.length})`}>
              {requests.map(r => (
                <div key={r.id} className="td-order-row">
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.75)', fontFamily: FONT_BODY }}>{r.title || r.category || '—'}</span>
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>{fmtDate(r.created_at)}</span>
                  <AdminStatusBadge status={r.status} lang={lang} />
                </div>
              ))}
            </SectionCard>
          )}

          <SectionCard>
            <AdminNoteThread entityType="trader" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
