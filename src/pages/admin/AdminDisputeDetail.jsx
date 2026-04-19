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

const OPEN_STATUSES    = ['under_review', 'mediating', 'resolved_buyer', 'resolved_supplier', 'settled', 'dismissed'];
const ALL_STATUSES     = ['open', 'under_review', 'mediating', 'resolved_buyer', 'resolved_supplier', 'settled', 'dismissed'];
const DESTRUCTIVE      = new Set(['resolved_buyer', 'resolved_supplier', 'settled', 'dismissed']);

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function SectionCard({ title, children, style }) {
  return (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '20px', marginBottom: 12, ...style }}>
      {title && <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{title}</p>}
      {children}
    </div>
  );
}

function InfoItem({ label, value, children }) {
  if (!value && !children) return null;
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{label}</div>
      {children || <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, wordBreak: 'break-word' }}>{value}</div>}
    </div>
  );
}

export default function AdminDisputeDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [dispute, setDispute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [resolution, setResolution] = useState('');
  const [confirm, setConfirm] = useState(null);
  const isAr = lang === 'ar';

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('disputes')
      .select('*, raiser:raised_by(full_name, email, company_name, role), against:against_id(full_name, email, company_name, role), resolver:resolved_by(full_name, email)')
      .eq('id', id).single();
    setDispute(data);
    if (data?.resolution) setResolution(data.resolution || '');
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doStatusUpdate = async (newStatus) => {
    if (!dispute) return;
    setSaving(true);
    const before = { status: dispute.status, resolution: dispute.resolution };
    const patch = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(DESTRUCTIVE.has(newStatus) ? { resolved_by: user.id, resolved_at: new Date().toISOString(), resolution: resolution.trim() || null } : {}),
    };
    await sb.from('disputes').update(patch).eq('id', id);
    await logAdminAction({ actorId: user.id, action: `dispute_${newStatus}`, entityType: 'dispute', entityId: id, beforeState: before, afterState: { status: newStatus, resolution: resolution.trim() || null } });
    await load();
    showFlash(isAr ? 'تم تحديث الحالة' : 'Status updated');
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
    .dd-page { padding: 32px 32px; max-width: 880px; }
    .dd-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; transition: color 0.12s; }
    .dd-back:hover { color: rgba(0,0,0,0.65); }
    .dd-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .dd-btn { min-height: 36px; padding: 0 14px; border-radius: 7px; font-size: 12px; cursor: pointer; transition: all 0.12s; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); }
    .dd-btn:hover { background: rgba(0,0,0,0.04); }
    .dd-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .dd-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
    .dd-btn-primary:hover { opacity: 0.88; background: #1a1814; }
    .dd-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
    .dd-btn-danger:hover { background: rgba(192,57,43,0.06); }
    .dd-info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px 24px; }
    @media (max-width: 900px) { .dd-page { padding: 22px 16px; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="dd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!dispute) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="dd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Dispute not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  const availableStatuses = ALL_STATUSES.filter(s => s !== dispute.status);

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="dd-flash">{flashMsg}</div>}

        <AdminConfirmDialog
          isOpen={!!confirm}
          title={isAr ? 'تأكيد تحديث الحالة' : 'Confirm status change'}
          description={isAr ? `هذا الإجراء سيغير حالة النزاع إلى "${confirm?.status}". هذا لا يمكن التراجع عنه بسهولة.` : `This will mark the dispute as "${confirm?.status}". This action is hard to reverse.`}
          confirmWord="CONFIRM"
          onConfirm={() => { doStatusUpdate(confirm.status); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
          isAr={isAr}
          danger
        />

        <div className="dd-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="dd-back" onClick={() => nav('/admin/disputes')}>
            {isAr ? '‹ النزاعات' : '‹ Disputes'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {isAr ? 'تفاصيل النزاع' : 'Dispute Detail'}
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <AdminStatusBadge status={dispute.status} lang={lang} />
                <span style={{ fontSize: 10, fontWeight: 600, color: ({ high: '#c0392b', medium: '#8B6914', low: 'rgba(0,0,0,0.38)' })[dispute.severity], fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: 0.6 }}>{dispute.severity}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {availableStatuses.map(s => (
                <button key={s} className={`dd-btn${DESTRUCTIVE.has(s) ? ' dd-btn-danger' : ''}`} disabled={saving} onClick={() => handleStatusClick(s)}>
                  → {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Parties */}
          <SectionCard title={isAr ? 'الأطراف' : 'Parties'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '14px', background: 'rgba(192,57,43,0.04)', borderRadius: 8, border: '1px solid rgba(192,57,43,0.12)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'مقدم الشكوى' : 'Raised By'}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{dispute.raiser?.full_name || '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY, marginTop: 2 }}>{dispute.raiser?.email}</div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY, marginTop: 2, textTransform: 'capitalize' }}>{dispute.raiser?.role}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(0,0,0,0.02)', borderRadius: 8, border: '1px solid rgba(0,0,0,0.07)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'المُشتكى عليه' : 'Against'}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{dispute.against?.full_name || '—'}</div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY, marginTop: 2 }}>{dispute.against?.email}</div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY, marginTop: 2, textTransform: 'capitalize' }}>{dispute.against?.role}</div>
              </div>
            </div>
          </SectionCard>

          {/* Details */}
          <SectionCard title={isAr ? 'تفاصيل النزاع' : 'Details'}>
            <div className="dd-info-grid" style={{ marginBottom: dispute.description ? 16 : 0 }}>
              <InfoItem label={isAr ? 'السبب' : 'Reason'} value={dispute.reason} />
              <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'} value={fmtDate(dispute.created_at)} />
              {dispute.resolved_at && <InfoItem label={isAr ? 'تاريخ الحل' : 'Resolved'} value={fmtDate(dispute.resolved_at)} />}
              {dispute.resolver && <InfoItem label={isAr ? 'حُلّ بواسطة' : 'Resolved By'} value={dispute.resolver?.full_name || dispute.resolver?.email} />}
            </div>
            {dispute.description && (
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'الوصف' : 'Description'}</div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.7, fontFamily: FONT_BODY }}>{dispute.description}</p>
              </div>
            )}
          </SectionCard>

          {/* Resolution editor */}
          <SectionCard title={isAr ? 'قرار الحل' : 'Resolution'}>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={4}
              placeholder={isAr ? 'اكتب قرار الحل هنا...' : 'Write the resolution here…'}
              dir={isAr ? 'rtl' : 'ltr'}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, resize: 'vertical', outline: 'none', marginBottom: 10 }}
            />
            <button
              className="dd-btn dd-btn-primary"
              disabled={saving || !resolution.trim()}
              onClick={async () => {
                setSaving(true);
                const before = { resolution: dispute.resolution };
                await sb.from('disputes').update({ resolution: resolution.trim(), updated_at: new Date().toISOString() }).eq('id', id);
                await logAdminAction({ actorId: user.id, action: 'dispute_update_resolution', entityType: 'dispute', entityId: id, beforeState: before, afterState: { resolution: resolution.trim() } });
                await load();
                showFlash(isAr ? 'تم حفظ قرار الحل' : 'Resolution saved');
                setSaving(false);
              }}
            >
              {isAr ? 'حفظ القرار' : 'Save Resolution'}
            </button>
          </SectionCard>

          {/* Notes */}
          <SectionCard>
            <AdminNoteThread entityType="dispute" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
