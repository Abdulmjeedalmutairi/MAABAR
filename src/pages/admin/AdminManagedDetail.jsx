import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const STATUSES = ['open', 'assigned', 'sourcing', 'completed', 'cancelled'];
const RECOMMENDATIONS = ['best_quality', 'best_price', 'fastest'];

function fmt(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function AdminManagedDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [request, setRequest] = useState(null);
  const [matched, setMatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const isRTL = lang === 'ar';

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

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
    showFlash(isRTL ? 'تم تحديث الحالة' : 'Status updated');
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
    showFlash(isRTL ? 'تم إضافة المورد' : 'Supplier added');
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
    showFlash(isRTL ? 'تم إزالة المورد' : 'Supplier removed');
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

  if (!request) {
    return (
      <AdminRouteGuard user={user} profile={profile} lang={lang}>
        <AdminShell user={user} profile={profile} lang={lang}>
          <div style={{ padding: 40, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>Request not found.</div>
        </AdminShell>
      </AdminRouteGuard>
    );
  }

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{`
          .admin-md { padding: 28px; max-width: 960px; }
          .admin-section-card { background: var(--bg-raised); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
          .admin-back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: var(--text-tertiary); font-size: 13px; padding: 0 0 20px; font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; min-height: 44px; }
          .admin-back-btn:hover { color: var(--text-primary); }
          .admin-action-btn { min-height: 44px; padding: 0 18px; border-radius: 10px; border: 1px solid var(--border-default); font-size: 13px; cursor: pointer; transition: all 0.12s; background: transparent; color: var(--text-secondary); font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; }
          .admin-action-btn:hover { background: var(--bg-raised); color: var(--text-primary); }
          .admin-action-btn.primary { background: var(--text-primary); color: var(--bg-base); border-color: var(--text-primary); font-weight: 600; }
          .admin-action-btn.primary:hover { opacity: 0.9; }
          .admin-action-btn.danger { color: #dc2626; border-color: rgba(220,38,38,0.3); }
          .admin-action-btn.danger:hover { background: #fee2e2; border-color: #dc2626; }
          .admin-supplier-row { background: var(--bg-base); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
          .admin-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
          .admin-mini-input { padding: 8px 10px; background: var(--bg-raised); border: 1px solid var(--border-default); border-radius: 8px; font-size: 13px; color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box; min-height: 40px; font-family: var(--font-sans); }
          .admin-mini-select { padding: 8px 10px; background: var(--bg-raised); border: 1px solid var(--border-default); border-radius: 8px; font-size: 13px; color: var(--text-primary); outline: none; width: 100%; box-sizing: border-box; min-height: 40px; font-family: var(--font-sans); cursor: pointer; }
          .admin-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--text-primary); color: var(--bg-base); padding: 10px 22px; border-radius: 99px; font-size: 13px; font-family: var(--font-sans); z-index: 999; white-space: nowrap; pointer-events: none; }

          @media (max-width: 900px) { .admin-md { padding: 20px 16px; } }
          @media (max-width: 600px) { .admin-row-grid { grid-template-columns: 1fr; } }
        `}</style>

        {flash && <div className="admin-flash">{flash}</div>}

        <div className="admin-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <button className="admin-back-btn" onClick={() => nav('/admin/managed')}>
            {isRTL ? 'العودة ‹' : '‹ Back to Managed Requests'}
          </button>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {request.title}
              </h1>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <AdminStatusBadge status={request.status} lang={lang} />
                {request.trader_decision && <AdminStatusBadge status={request.trader_decision} lang={lang} />}
              </div>
            </div>
            {/* Status changer */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.filter(s => s !== request.status).map(s => (
                <button key={s} className="admin-action-btn" disabled={saving} onClick={() => updateStatus(s)}>
                  → {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="admin-section-card">
            <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{isRTL ? 'تفاصيل الطلب' : 'Request Details'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px' }}>
              {[
                [isRTL ? 'التاجر' : 'Buyer', request.buyer?.full_name || request.buyer?.email],
                [isRTL ? 'الشركة' : 'Company', request.buyer?.company_name],
                [isRTL ? 'الفئة' : 'Category', request.category],
                [isRTL ? 'الكمية' : 'Quantity', request.quantity ? `${request.quantity} ${request.unit || ''}`.trim() : null],
                [isRTL ? 'السعر المستهدف' : 'Target Price', request.target_price ? `${request.target_price} ${request.currency}` : null],
                [isRTL ? 'الموعد النهائي' : 'Deadline', fmt(request.deadline)],
                [isRTL ? 'تاريخ الإنشاء' : 'Created', fmt(request.created_at)],
                [isRTL ? 'قرار التاجر' : 'Trader Decision', request.trader_decision],
              ].map(([label, val]) => val ? (
                <div key={label}>
                  <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{val}</div>
                </div>
              ) : null)}
            </div>
            {request.description && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>{isRTL ? 'الوصف' : 'DESCRIPTION'}</div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{request.description}</p>
              </div>
            )}
          </div>

          {/* Matched suppliers */}
          <div className="admin-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                {isRTL ? `الموردون (${matched.length})` : `Matched Suppliers (${matched.length})`}
              </p>
            </div>

            {/* Add supplier search */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSuppliers()}
                placeholder={isRTL ? 'بحث عن مورد...' : 'Search supplier to add…'}
                dir={isRTL ? 'rtl' : 'ltr'}
                style={{ flex: 1, minWidth: 200, padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', outline: 'none', minHeight: 44, boxSizing: 'border-box' }}
              />
              <button className="admin-action-btn primary" onClick={searchSuppliers} disabled={searching} style={{ minWidth: 80 }}>
                {searching ? '…' : (isRTL ? 'بحث' : 'Search')}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
                {searchResults.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{s.full_name || s.email}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{s.company_name} · {s.country}</div>
                    </div>
                    <button className="admin-action-btn primary" style={{ flexShrink: 0 }} onClick={() => addSupplier(s)}>
                      {isRTL ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {matched.length === 0 && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', margin: 0 }}>
                {isRTL ? 'لم يتم إضافة موردين بعد.' : 'No suppliers added yet.'}
              </p>
            )}

            {matched.map(mrs => (
              <div key={mrs.id} className="admin-supplier-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {mrs.supplier?.full_name || mrs.supplier?.email || '—'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>
                      {mrs.supplier?.company_name} · {mrs.supplier?.country}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <AdminStatusBadge status={mrs.status} lang={lang} />
                    <button className="admin-action-btn danger" style={{ padding: '0 12px', fontSize: 12 }} onClick={() => removeSupplier(mrs)}>
                      {isRTL ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                </div>

                <div className="admin-row-grid">
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>{isRTL ? 'الحالة' : 'STATUS'}</div>
                    <select className="admin-mini-select" value={mrs.status} onChange={e => updateSupplierRow(mrs, { status: e.target.value })}>
                      {['invited', 'responded', 'shortlisted', 'rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>{isRTL ? 'التوصية' : 'RECOMMENDATION'}</div>
                    <select className="admin-mini-select" value={mrs.admin_recommendation || ''} onChange={e => updateSupplierRow(mrs, { admin_recommendation: e.target.value || null })}>
                      <option value="">—</option>
                      {RECOMMENDATIONS.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>{isRTL ? 'سعر الوحدة' : 'UNIT PRICE'}</div>
                    <input type="number" className="admin-mini-input" value={mrs.unit_price || ''} onChange={e => updateSupplierRow(mrs, { unit_price: e.target.value ? parseFloat(e.target.value) : null })} placeholder="0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>{isRTL ? 'أيام التسليم' : 'DELIVERY DAYS'}</div>
                    <input type="number" className="admin-mini-input" value={mrs.delivery_days || ''} onChange={e => updateSupplierRow(mrs, { delivery_days: e.target.value ? parseInt(e.target.value) : null })} placeholder="0" />
                  </div>
                </div>

                {mrs.response_notes && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-raised)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {mrs.response_notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="admin-section-card">
            <AdminNoteThread entityType="managed_request" entityId={id} user={user} lang={lang} />
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
