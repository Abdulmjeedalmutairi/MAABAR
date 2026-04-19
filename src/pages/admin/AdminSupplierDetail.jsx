import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';
import { sendMaabarEmail } from '../../lib/maabarEmail';
import { normalizeSupplierDocStoragePath } from '../../lib/supplierOnboarding';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>{label}</span>
      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', wordBreak: 'break-word', fontFamily: mono ? "'Courier New', monospace" : FONT_BODY }}>
        {value || '—'}
      </span>
    </div>
  );
}

function SectionCard({ title, children, style }) {
  return (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '20px 20px 18px', marginBottom: 12, ...style }}>
      {title && (
        <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function InfoGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px 24px' }}>
      {children}
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
  const [signedUrls, setSignedUrls] = useState({});
  const isAr = lang === 'ar';

  const getSignedUrl = useCallback(async (rawPath) => {
    const path = normalizeSupplierDocStoragePath(rawPath);
    if (!path) return null;
    const { data, error } = await sb.storage.from('supplier-docs').createSignedUrl(path, 60 * 30);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  const openDoc = useCallback(async (rawPath) => {
    const url = await getSignedUrl(rawPath);
    if (!url) { alert('Could not open file.'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [getSignedUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('profiles').select('*').eq('id', id).single();
    setSupplier(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!supplier) return;
    const rawPaths = [
      supplier.license_photo,
      supplier.factory_photo,
      ...(Array.isArray(supplier.factory_images) ? supplier.factory_images : []),
      ...(Array.isArray(supplier.factory_videos) ? supplier.factory_videos : []),
    ].filter(Boolean);

    Promise.all(
      rawPaths.map(async (raw) => {
        const signed = await getSignedUrl(raw);
        return [raw, signed];
      })
    ).then((entries) => {
      setSignedUrls(Object.fromEntries(entries.filter(([, v]) => v)));
    });
  }, [supplier, getSignedUrl]);

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
      flash(isAr ? `خطأ: ${error.message}` : `Error: ${error.message}`);
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
    flash(isAr ? 'تم التحديث بنجاح' : 'Status updated');
    setSaving(false);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const CSS = `
    .sd-page { padding: 32px 32px; max-width: 920px; }
    .sd-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; letter-spacing: 0.3px; transition: color 0.12s; }
    .sd-back:hover { color: rgba(0,0,0,0.65); }
    .sd-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .sd-action-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .sd-btn { min-height: 40px; padding: 0 18px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: ${FONT_BODY}; white-space: nowrap; }
    .sd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .sd-btn-approve { background: #27725a; color: #fff; }
    .sd-btn-approve:hover:not(:disabled) { background: #1f5f49; }
    .sd-btn-reject { background: rgba(192,57,43,0.08); color: #c0392b; border: 1px solid rgba(192,57,43,0.2); }
    .sd-btn-reject:hover:not(:disabled) { background: rgba(192,57,43,0.13); }
    .sd-btn-ghost { background: transparent; color: rgba(0,0,0,0.45); border: 1px solid rgba(0,0,0,0.09); }
    .sd-btn-ghost:hover:not(:disabled) { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
    .sd-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .sd-doc-link { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; background: transparent; color: rgba(0,0,0,0.65); font-size: 12px; cursor: pointer; font-family: ${FONT_BODY}; text-decoration: none; min-height: 40px; transition: all 0.12s; }
    .sd-doc-link:hover { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.14); }
    .sd-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
    .sd-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.07); cursor: pointer; display: block; }
    @media (max-width: 900px) { .sd-page { padding: 22px 16px; } }
    @media (max-width: 600px) { .sd-header { flex-direction: column; } .sd-action-bar { width: 100%; } .sd-btn { flex: 1; text-align: center; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="sd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!supplier) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="sd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Supplier not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  const images = [supplier.factory_photo, ...(Array.isArray(supplier.factory_images) ? supplier.factory_images : [])].filter(Boolean);
  const docs = [supplier.license_photo && { label: isAr ? 'السجل التجاري' : 'Business License', url: supplier.license_photo }].filter(Boolean);

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {actionMsg && <div className="sd-flash">{actionMsg}</div>}

        <div className="sd-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="sd-back" onClick={() => nav('/admin/suppliers')}>
            {isAr ? '‹ الموردون' : '‹ Suppliers'}
          </button>

          {/* Header */}
          <div className="sd-header">
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {supplier.full_name || supplier.email}
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <AdminStatusBadge status={supplier.status} lang={lang} />
                {supplier.maabar_supplier_id && (
                  <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY, letterSpacing: 0.4 }}>{supplier.maabar_supplier_id}</span>
                )}
              </div>
            </div>
            <div className="sd-action-bar">
              {supplier.status === 'verification_under_review' && (
                <>
                  <button className="sd-btn sd-btn-approve" disabled={saving} onClick={() => updateStatus('active')}>
                    {saving ? '…' : (isAr ? 'قبول المورد' : 'Approve')}
                  </button>
                  <button className="sd-btn sd-btn-reject" disabled={saving} onClick={() => setShowRejectForm(v => !v)}>
                    {isAr ? 'رفض' : 'Reject'}
                  </button>
                </>
              )}
              {supplier.status === 'active' && (
                <button className="sd-btn sd-btn-ghost" disabled={saving} onClick={() => updateStatus('inactive')}>
                  {isAr ? 'إيقاف' : 'Deactivate'}
                </button>
              )}
              {(supplier.status === 'inactive' || supplier.status === 'rejected') && (
                <button className="sd-btn sd-btn-approve" disabled={saving} onClick={() => updateStatus('active')}>
                  {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>

          {/* Reject form */}
          {showRejectForm && (
            <SectionCard style={{ marginBottom: 12, borderColor: 'rgba(192,57,43,0.20)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY }}>
                {isAr ? 'سبب الرفض (اختياري، للسجل الداخلي)' : 'Rejection reason (optional, internal record)'}
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder={isAr ? 'سبب الرفض...' : 'Reason for rejection…'}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, resize: 'vertical', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="sd-btn sd-btn-reject" disabled={saving} onClick={() => updateStatus('rejected', rejectReason)}>
                  {saving ? '…' : (isAr ? 'تأكيد الرفض' : 'Confirm Rejection')}
                </button>
                <button className="sd-btn sd-btn-ghost" onClick={() => setShowRejectForm(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </SectionCard>
          )}

          {/* Account info */}
          <SectionCard title={isAr ? 'معلومات الحساب' : 'Account Info'}>
            <InfoGrid>
              <InfoRow label={isAr ? 'الاسم الكامل' : 'Full Name'} value={supplier.full_name} />
              <InfoRow label="Email" value={supplier.email} mono />
              <InfoRow label={isAr ? 'واتساب' : 'WhatsApp'} value={supplier.whatsapp} mono />
              <InfoRow label="WeChat" value={supplier.wechat} mono />
              <InfoRow label={isAr ? 'تاريخ الانضمام' : 'Joined'} value={supplier.created_at ? new Date(supplier.created_at).toLocaleString('en-GB') : '—'} mono />
              <InfoRow label={isAr ? 'معرّف معبر' : 'Maabar ID'} value={supplier.maabar_supplier_id} mono />
            </InfoGrid>
          </SectionCard>

          {/* Company */}
          <SectionCard title={isAr ? 'بيانات الشركة' : 'Company'}>
            <InfoGrid>
              <InfoRow label={isAr ? 'اسم الشركة' : 'Company Name'} value={supplier.company_name} />
              <InfoRow label={isAr ? 'الدولة' : 'Country'} value={supplier.country} />
              <InfoRow label={isAr ? 'المدينة' : 'City'} value={supplier.city} />
              <InfoRow label={isAr ? 'التخصص' : 'Speciality'} value={supplier.speciality} />
              <InfoRow label={isAr ? 'نوع النشاط' : 'Business Type'} value={supplier.business_type} />
              <InfoRow label={isAr ? 'سنة التأسيس' : 'Est. Year'} value={supplier.year_established} />
              <InfoRow label={isAr ? 'عدد الموظفين' : 'Employees'} value={supplier.num_employees} />
              <InfoRow label={isAr ? 'سنوات الخبرة' : 'Experience (yrs)'} value={supplier.years_experience} />
              <InfoRow label={isAr ? 'رقم السجل' : 'Reg Number'} value={supplier.reg_number} mono />
            </InfoGrid>
            {supplier.trade_link && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>
                  {isAr ? 'رابط التجارة' : 'Trade Link'}
                </p>
                <a href={supplier.trade_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(0,0,0,0.60)', wordBreak: 'break-all', fontFamily: FONT_BODY }}>
                  {supplier.trade_link} ↗
                </a>
              </div>
            )}
          </SectionCard>

          {/* Documents */}
          {docs.length > 0 && (
            <SectionCard title={isAr ? 'المستندات' : 'Documents'}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {docs.map((doc, i) => (
                  <button key={i} onClick={() => openDoc(doc.url)} className="sd-doc-link" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                    {doc.label} ↗
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Factory images */}
          {images.length > 0 && (
            <SectionCard title={isAr ? 'صور المصنع' : 'Factory Photos'}>
              <div className="sd-img-grid">
                {images.map((raw, i) => {
                  const signed = signedUrls[raw];
                  return signed ? (
                    <a key={i} href={signed} target="_blank" rel="noopener noreferrer">
                      <img src={signed} alt={`Factory ${i + 1}`} className="sd-img" />
                    </a>
                  ) : (
                    <div key={i} className="sd-img" style={{ background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>…</div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Notes */}
          <SectionCard>
            <AdminNoteThread entityType="supplier" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
