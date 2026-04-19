import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const STATUSES = ['open', 'assigned', 'sourcing', 'completed', 'cancelled'];
const RECOMMENDATIONS = ['best_quality', 'best_price', 'fastest'];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY }}>{value}</div>
    </div>
  );
}

export default function AdminManagedDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [request, setRequest] = useState(null);
  const [matched, setMatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const isAr = lang === 'ar';

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: req }, { data: mrs }] = await Promise.all([
      sb.from('managed_requests').select('*, buyer:buyer_id(full_name, email, company_name)').eq('id', id).single(),
      sb.from('managed_request_suppliers').select('*, supplier:supplier_id(full_name, email, company_name, country)').eq('request_id', id).order('added_at'),
    ]);
    setRequest(req);
    setMatched(mrs || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (newStatus) => {
    if (!request) return;
    setSaving(true);
    const before = { status: request.status };
    await sb.from('managed_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    await logAdminAction({ actorId: user.id, action: 'managed_status_update', entityType: 'managed_request', entityId: id, beforeState: before, afterState: { status: newStatus } });
    await load();
    showFlash(isAr ? 'تم تحديث الحالة' : 'Status updated');
    setSaving(false);
  };

  const searchSuppliers = async () => {
    if (!supplierSearch.trim()) return;
    setSearching(true);
    const { data } = await sb.from('profiles')
      .select('id, full_name, email, company_name, country, status')
      .eq('role', 'supplier')
      .or(`full_name.ilike.%${supplierSearch}%,email.ilike.%${supplierSearch}%,company_name.ilike.%${supplierSearch}%`)
      .limit(10);
    const existingIds = matched.map(m => m.supplier_id);
    setSearchResults((data || []).filter(s => !existingIds.includes(s.id)));
    setSearching(false);
  };

  const addSupplier = async (supplier) => {
    const before = { matched_count: matched.length };
    await sb.from('managed_request_suppliers').insert({ request_id: id, supplier_id: supplier.id, added_by: user.id });
    await logAdminAction({ actorId: user.id, action: 'managed_add_supplier', entityType: 'managed_request', entityId: id, beforeState: before, afterState: { added_supplier_id: supplier.id } });
    setSearchResults(prev => prev.filter(s => s.id !== supplier.id));
    await load();
    showFlash(isAr ? 'تم إضافة المورد' : 'Supplier added');
  };

  const updateSupplierRow = async (mrs, patch) => {
    const before = { ...mrs };
    await sb.from('managed_request_suppliers').update(patch).eq('id', mrs.id);
    await logAdminAction({ actorId: user.id, action: 'managed_update_supplier_row', entityType: 'managed_request', entityId: id, beforeState: before, afterState: patch });
    await load();
  };

  const removeSupplier = async (mrs) => {
    await sb.from('managed_request_suppliers').delete().eq('id', mrs.id);
    await logAdminAction({ actorId: user.id, action: 'managed_remove_supplier', entityType: 'managed_request', entityId: id, beforeState: { supplier_id: mrs.supplier_id }, afterState: null });
    await load();
    showFlash(isAr ? 'تم إزالة المورد' : 'Supplier removed');
  };

  const CSS = `
    .md-page { padding: 32px 32px; max-width: 960px; }
    .md-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; letter-spacing: 0.3px; transition: color 0.12s; }
    .md-back:hover { color: rgba(0,0,0,0.65); }
    .md-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .md-btn { min-height: 38px; padding: 0 14px; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.12s; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); }
    .md-btn:hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.80); }
    .md-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .md-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
    .md-btn-primary:hover { opacity: 0.88; background: #1a1814; }
    .md-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
    .md-btn-danger:hover { background: rgba(192,57,43,0.06); border-color: rgba(192,57,43,0.35); }
    .md-mini-input { padding: 8px 10px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 7px; font-size: 12px; color: rgba(0,0,0,0.80); outline: none; width: 100%; box-sizing: border-box; min-height: 38px; font-family: ${FONT_BODY}; }
    .md-mini-select { padding: 8px 10px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 7px; font-size: 12px; color: rgba(0,0,0,0.80); outline: none; width: 100%; box-sizing: border-box; min-height: 38px; font-family: ${FONT_BODY}; cursor: pointer; }
    .md-supplier-row { background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 13px; margin-bottom: 8px; }
    .md-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    @media (max-width: 900px) { .md-page { padding: 22px 16px; } }
    @media (max-width: 600px) { .md-row-grid { grid-template-columns: 1fr; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="md-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!request) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="md-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Request not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="md-flash">{flashMsg}</div>}

        <div className="md-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="md-back" onClick={() => nav('/admin/managed')}>
            {isAr ? '‹ الطلبات المُدارة' : '‹ Managed Requests'}
          </button>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {request.title}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <AdminStatusBadge status={request.status} lang={lang} />
                {request.trader_decision && <AdminStatusBadge status={request.trader_decision} lang={lang} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.filter(s => s !== request.status).map(s => (
                <button key={s} className="md-btn" disabled={saving} onClick={() => updateStatus(s)}>
                  → {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Request details */}
          <SectionCard title={isAr ? 'تفاصيل الطلب' : 'Request Details'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px 24px' }}>
              <InfoItem label={isAr ? 'التاجر' : 'Buyer'} value={request.buyer?.full_name || request.buyer?.email} />
              <InfoItem label={isAr ? 'الشركة' : 'Company'} value={request.buyer?.company_name} />
              <InfoItem label={isAr ? 'الفئة' : 'Category'} value={request.category} />
              <InfoItem label={isAr ? 'الكمية' : 'Quantity'} value={request.quantity ? `${request.quantity} ${request.unit || ''}`.trim() : null} />
              <InfoItem label={isAr ? 'السعر المستهدف' : 'Target Price'} value={request.target_price ? `${request.target_price} ${request.currency}` : null} />
              <InfoItem label={isAr ? 'الموعد النهائي' : 'Deadline'} value={fmtDate(request.deadline)} />
              <InfoItem label={isAr ? 'تاريخ الإنشاء' : 'Created'} value={fmtDate(request.created_at)} />
            </div>
            {request.description && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'الوصف' : 'Description'}</div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.7, fontFamily: FONT_BODY }}>{request.description}</p>
              </div>
            )}
          </SectionCard>

          {/* Matched suppliers */}
          <SectionCard title={isAr ? `الموردون (${matched.length})` : `Matched Suppliers (${matched.length})`}>
            {/* Add supplier search */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSuppliers()}
                placeholder={isAr ? 'بحث عن مورد للإضافة...' : 'Search supplier to add…'}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ flex: 1, minWidth: 200, padding: '9px 12px', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, outline: 'none', minHeight: 38, boxSizing: 'border-box' }}
              />
              <button className="md-btn md-btn-primary" onClick={searchSuppliers} disabled={searching} style={{ minWidth: 72 }}>
                {searching ? '…' : (isAr ? 'بحث' : 'Search')}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 8, marginBottom: 12, overflow: 'hidden' }}>
                {searchResults.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 13px', borderBottom: '1px solid rgba(0,0,0,0.05)', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{s.full_name || s.email}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 1 }}>{s.company_name} · {s.country}</div>
                    </div>
                    <button className="md-btn md-btn-primary" style={{ flexShrink: 0 }} onClick={() => addSupplier(s)}>
                      {isAr ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {matched.length === 0 && (
              <p style={{ color: 'rgba(0,0,0,0.30)', fontSize: 12, fontFamily: FONT_BODY, margin: '0 0 4px' }}>
                {isAr ? 'لم يتم إضافة موردين بعد.' : 'No suppliers added yet.'}
              </p>
            )}

            {matched.map(mrs => (
              <div key={mrs.id} className="md-supplier-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{mrs.supplier?.full_name || mrs.supplier?.email || '—'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 2 }}>{mrs.supplier?.company_name} · {mrs.supplier?.country}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <AdminStatusBadge status={mrs.status} lang={lang} />
                    <button className="md-btn md-btn-danger" style={{ padding: '0 10px', fontSize: 11 }} onClick={() => removeSupplier(mrs)}>
                      {isAr ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                </div>
                <div className="md-row-grid">
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{isAr ? 'الحالة' : 'Status'}</div>
                    <select className="md-mini-select" value={mrs.status} onChange={e => updateSupplierRow(mrs, { status: e.target.value })}>
                      {['invited', 'responded', 'shortlisted', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{isAr ? 'التوصية' : 'Recommendation'}</div>
                    <select className="md-mini-select" value={mrs.admin_recommendation || ''} onChange={e => updateSupplierRow(mrs, { admin_recommendation: e.target.value || null })}>
                      <option value="">—</option>
                      {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{isAr ? 'سعر الوحدة' : 'Unit Price'}</div>
                    <input type="number" className="md-mini-input" value={mrs.unit_price || ''} onChange={e => updateSupplierRow(mrs, { unit_price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 3 }}>{isAr ? 'أيام التسليم' : 'Delivery Days'}</div>
                    <input type="number" className="md-mini-input" value={mrs.delivery_days || ''} onChange={e => updateSupplierRow(mrs, { delivery_days: e.target.value ? parseInt(e.target.value) : null })} placeholder="0" />
                  </div>
                </div>
                {mrs.response_notes && (
                  <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--bg-raised, #fff)', borderRadius: 6, fontSize: 12, color: 'rgba(0,0,0,0.60)', fontFamily: FONT_BODY }}>
                    {mrs.response_notes}
                  </div>
                )}
              </div>
            ))}
          </SectionCard>

          {/* Notes */}
          <SectionCard>
            <AdminNoteThread entityType="managed_request" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
