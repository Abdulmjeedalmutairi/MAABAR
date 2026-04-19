import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';
import { sendMaabarEmail } from '../../lib/maabarEmail';

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{label}</span>
      <span style={{ fontSize: 14, color: 'var(--text-primary)', wordBreak: 'break-word', fontFamily: mono ? 'var(--font-sans)' : undefined }}>
        {value || '—'}
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px 24px' }}>
        {children}
      </div>
    </div>
  );
}

export default function AdminSupplierDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const isRTL = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('profiles').select('*').eq('id', id).single();
    setSupplier(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  const updateStatus = async (newStatus, reason) => {
    if (!supplier) return;
    setSaving(true);
    const before = { status: supplier.status };
    const { error } = await sb.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) {
      flash(isRTL ? `خطأ: ${error.message}` : `Error: ${error.message}`);
      setSaving(false);
      return;
    }
    await logAdminAction({
      actorId: user.id,
      action: `supplier_${newStatus}`,
      entityType: 'supplier',
      entityId: id,
      beforeState: before,
      afterState: { status: newStatus },
      notes: reason || null,
    });
    if (newStatus === 'active') {
      try {
        await sendMaabarEmail({
          type: 'supplier_approved',
          to: supplier.email,
          data: { name: supplier.full_name || '', lang: supplier.lang || 'en' },
        });
      } catch (e) { console.error('approval email error:', e); }
    }
    await load();
    flash(isRTL ? 'تم التحديث بنجاح' : 'Status updated');
    setSaving(false);
    setShowRejectForm(false);
    setRejectReason('');
  };

  if (loading) {
    return (
      <AdminRouteGuard user={user} profile={profile} lang={lang}>
        <AdminShell user={user} profile={profile} lang={lang}>
          <div style={{ padding: 40, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>Loading…</div>
        </AdminShell>
      </AdminRouteGuard>
    );
  }

  if (!supplier) {
    return (
      <AdminRouteGuard user={user} profile={profile} lang={lang}>
        <AdminShell user={user} profile={profile} lang={lang}>
          <div style={{ padding: 40, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>Supplier not found.</div>
        </AdminShell>
      </AdminRouteGuard>
    );
  }

  const images = [
    supplier.factory_photo,
    ...(Array.isArray(supplier.factory_images) ? supplier.factory_images : []),
  ].filter(Boolean);

  const docs = [
    supplier.license_photo && { label: isRTL ? 'السجل التجاري' : 'Business License', url: supplier.license_photo },
  ].filter(Boolean);

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{`
          .admin-supplier-detail { padding: 28px; max-width: 900px; }
          .admin-back-btn {
            display: inline-flex; align-items: center; gap: 6px; background: none; border: none;
            cursor: pointer; color: var(--text-tertiary); font-size: 13px; padding: 0 0 20px;
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
            min-height: 44px;
          }
          .admin-back-btn:hover { color: var(--text-primary); }
          .admin-detail-header {
            display: flex; align-items: flex-start; justify-content: space-between;
            gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
          }
          .admin-action-bar {
            display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
          }
          .admin-action-btn {
            min-height: 44px; padding: 0 20px; border-radius: 10px; border: none;
            font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
            font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'};
          }
          .admin-action-btn.approve { background: #16a34a; color: #fff; }
          .admin-action-btn.approve:hover { background: #15803d; }
          .admin-action-btn.reject { background: #fee2e2; color: #dc2626; }
          .admin-action-btn.reject:hover { background: #fecaca; }
          .admin-action-btn.ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-default); }
          .admin-action-btn.ghost:hover { background: var(--bg-raised); }
          .admin-section-card {
            background: var(--bg-raised); border: 1px solid var(--border-subtle);
            border-radius: 16px; padding: 20px; margin-bottom: 16px;
          }
          .admin-media-grid {
            display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;
          }
          .admin-media-img {
            width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 10px;
            background: var(--bg-base); border: 1px solid var(--border-subtle); cursor: pointer;
          }
          .admin-flash {
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            background: var(--text-primary); color: var(--bg-base); padding: 10px 22px;
            border-radius: 99px; font-size: 13px; font-family: var(--font-sans);
            z-index: 999; white-space: nowrap; pointer-events: none;
          }
          @media (max-width: 900px) { .admin-supplier-detail { padding: 20px 16px; } }
          @media (max-width: 600px) {
            .admin-detail-header { flex-direction: column; }
            .admin-action-bar { width: 100%; }
            .admin-action-btn { flex: 1; text-align: center; }
          }
        `}</style>

        {actionMsg && <div className="admin-flash">{actionMsg}</div>}

        <div className="admin-supplier-detail" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Back */}
          <button className="admin-back-btn" onClick={() => nav('/admin/suppliers')}>
            {isRTL ? 'العودة ‹' : '‹ Back to Suppliers'}
          </button>

          {/* Header */}
          <div className="admin-detail-header">
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {supplier.full_name || supplier.email}
              </h1>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <AdminStatusBadge status={supplier.status} lang={lang} />
                {supplier.maabar_supplier_id && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{supplier.maabar_supplier_id}</span>
                )}
              </div>
            </div>

            <div className="admin-action-bar">
              {supplier.status === 'verification_under_review' && (
                <>
                  <button
                    className="admin-action-btn approve"
                    disabled={saving}
                    onClick={() => updateStatus('active')}
                  >
                    {saving ? '…' : (isRTL ? 'قبول المورد' : 'Approve')}
                  </button>
                  <button
                    className="admin-action-btn reject"
                    disabled={saving}
                    onClick={() => setShowRejectForm(v => !v)}
                  >
                    {isRTL ? 'رفض' : 'Reject'}
                  </button>
                </>
              )}
              {supplier.status === 'active' && (
                <button className="admin-action-btn ghost" disabled={saving} onClick={() => updateStatus('inactive')}>
                  {isRTL ? 'إيقاف' : 'Deactivate'}
                </button>
              )}
              {(supplier.status === 'inactive' || supplier.status === 'rejected') && (
                <button className="admin-action-btn approve" disabled={saving} onClick={() => updateStatus('active')}>
                  {isRTL ? 'إعادة تفعيل' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>

          {/* Reject reason form */}
          {showRejectForm && (
            <div className="admin-section-card" style={{ marginBottom: 16, borderColor: 'rgba(220,38,38,0.3)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isRTL ? 'سبب الرفض (اختياري، للسجل الداخلي)' : 'Rejection reason (optional, internal record)'}
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder={isRTL ? 'سبب الرفض...' : 'Reason for rejection…'}
                dir={isRTL ? 'rtl' : 'ltr'}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', resize: 'vertical', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="admin-action-btn reject" disabled={saving} onClick={() => updateStatus('rejected', rejectReason)}>
                  {saving ? '…' : (isRTL ? 'تأكيد الرفض' : 'Confirm Rejection')}
                </button>
                <button className="admin-action-btn ghost" onClick={() => setShowRejectForm(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </div>
          )}

          {/* Identity */}
          <div className="admin-section-card">
            <Section title={isRTL ? 'معلومات الحساب' : 'Account Info'}>
              <Row label={isRTL ? 'الاسم الكامل' : 'Full Name'} value={supplier.full_name} />
              <Row label="Email" value={supplier.email} mono />
              <Row label={isRTL ? 'واتساب' : 'WhatsApp'} value={supplier.whatsapp} mono />
              <Row label="WeChat" value={supplier.wechat} mono />
              <Row label={isRTL ? 'تاريخ الانضمام' : 'Joined'} value={supplier.created_at ? new Date(supplier.created_at).toLocaleString() : '—'} mono />
              <Row label={isRTL ? 'معرّف معبر' : 'Maabar ID'} value={supplier.maabar_supplier_id} mono />
            </Section>
          </div>

          {/* Company */}
          <div className="admin-section-card">
            <Section title={isRTL ? 'بيانات الشركة' : 'Company'}>
              <Row label={isRTL ? 'اسم الشركة' : 'Company Name'} value={supplier.company_name} />
              <Row label={isRTL ? 'الدولة' : 'Country'} value={supplier.country} />
              <Row label={isRTL ? 'المدينة' : 'City'} value={supplier.city} />
              <Row label={isRTL ? 'التخصص' : 'Speciality'} value={supplier.speciality} />
              <Row label={isRTL ? 'نوع النشاط' : 'Business Type'} value={supplier.business_type} />
              <Row label={isRTL ? 'سنة التأسيس' : 'Est. Year'} value={supplier.year_established} />
              <Row label={isRTL ? 'عدد الموظفين' : 'Employees'} value={supplier.num_employees} />
              <Row label={isRTL ? 'سنوات الخبرة' : 'Experience (yrs)'} value={supplier.years_experience} />
              <Row label={isRTL ? 'رقم السجل' : 'Reg Number'} value={supplier.reg_number} mono />
            </Section>
            {supplier.trade_link && (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                  {isRTL ? 'رابط التجارة' : 'TRADE LINK'}
                </p>
                <a href={supplier.trade_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#2563eb', wordBreak: 'break-all', fontFamily: 'var(--font-sans)' }}>
                  {supplier.trade_link}
                </a>
              </div>
            )}
          </div>

          {/* Documents */}
          {docs.length > 0 && (
            <div className="admin-section-card">
              <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                {isRTL ? 'المستندات' : 'Documents'}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {docs.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <button style={{
                      padding: '9px 16px', border: '1px solid var(--border-default)', borderRadius: 10,
                      background: 'transparent', color: '#2563eb', fontSize: 13, cursor: 'pointer', minHeight: 44,
                      fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)',
                    }}>
                      {doc.label} ↗
                    </button>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Factory images */}
          {images.length > 0 && (
            <div className="admin-section-card">
              <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                {isRTL ? 'صور المصنع' : 'Factory Photos'}
              </p>
              <div className="admin-media-grid">
                {images.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Factory ${i + 1}`} className="admin-media-img" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="admin-section-card">
            <AdminNoteThread entityType="supplier" entityId={id} user={user} lang={lang} />
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
