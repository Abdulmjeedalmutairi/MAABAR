import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const STATUSES = ['pending', 'in_progress', 'matched', 'closed'];

function fmt(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function AdminConciergeDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [request, setRequest] = useState(null);
  const [connections, setConnections] = useState([]);
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
    const [{ data: req }, { data: conns }] = await Promise.all([
      sb.from('concierge_requests').select('*, requester:requester_id(full_name, email, company_name, whatsapp, wechat)').eq('id', id).single(),
      sb.from('concierge_connections').select('*, supplier:supplier_id(full_name, email, company_name, country, status)').eq('concierge_id', id).order('created_at'),
    ]);
    setRequest(req);
    setConnections(conns || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (newStatus) => {
    if (!request) return;
    setSaving(true);
    const before = { status: request.status };
    await sb.from('concierge_requests').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
    await logAdminAction({ actorId: user.id, action: 'concierge_status_update', entityType: 'concierge', entityId: id, beforeState: before, afterState: { status: newStatus } });
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
    const existingIds = connections.map(c => c.supplier_id);
    setSearchResults((data || []).filter(s => !existingIds.includes(s.id)));
    setSearching(false);
  };

  const addConnection = async (supplier) => {
    const before = { connection_count: connections.length };
    await sb.from('concierge_connections').insert({ concierge_id: id, supplier_id: supplier.id, connected_by: user.id });
    await logAdminAction({ actorId: user.id, action: 'concierge_add_connection', entityType: 'concierge', entityId: id, beforeState: before, afterState: { connected_supplier_id: supplier.id } });
    setSearchResults(prev => prev.filter(s => s.id !== supplier.id));
    await load();
    showFlash(isRTL ? 'تمت إضافة المورد' : 'Supplier connected');
  };

  const updateConnection = async (conn, patch) => {
    await sb.from('concierge_connections').update(patch).eq('id', conn.id);
    await logAdminAction({ actorId: user.id, action: 'concierge_update_connection', entityType: 'concierge', entityId: id, beforeState: conn, afterState: patch });
    await load();
  };

  const removeConnection = async (conn) => {
    await sb.from('concierge_connections').delete().eq('id', conn.id);
    await logAdminAction({ actorId: user.id, action: 'concierge_remove_connection', entityType: 'concierge', entityId: id, beforeState: { supplier_id: conn.supplier_id }, afterState: null });
    await load();
    showFlash(isRTL ? 'تمت الإزالة' : 'Connection removed');
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
          .admin-cd { padding: 28px; max-width: 900px; }
          .admin-section-card { background: var(--bg-raised); border: 1px solid var(--border-subtle); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
          .admin-back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: var(--text-tertiary); font-size: 13px; padding: 0 0 20px; font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; min-height: 44px; }
          .admin-back-btn:hover { color: var(--text-primary); }
          .admin-action-btn { min-height: 44px; padding: 0 18px; border-radius: 10px; border: 1px solid var(--border-default); font-size: 13px; cursor: pointer; transition: all 0.12s; background: transparent; color: var(--text-secondary); font-family: ${isRTL ? 'var(--font-ar)' : 'var(--font-sans)'}; }
          .admin-action-btn:hover { background: var(--bg-raised); color: var(--text-primary); }
          .admin-action-btn.primary { background: var(--text-primary); color: var(--bg-base); border-color: var(--text-primary); font-weight: 600; }
          .admin-action-btn.primary:hover { opacity: 0.9; }
          .admin-action-btn.danger { color: #dc2626; border-color: rgba(220,38,38,0.3); }
          .admin-action-btn.danger:hover { background: #fee2e2; border-color: #dc2626; }
          .admin-conn-card { background: var(--bg-base); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 14px; margin-bottom: 10px; }
          .admin-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: var(--text-primary); color: var(--bg-base); padding: 10px 22px; border-radius: 99px; font-size: 13px; font-family: var(--font-sans); z-index: 999; white-space: nowrap; pointer-events: none; }

          @media (max-width: 900px) { .admin-cd { padding: 20px 16px; } }
        `}</style>

        {flash && <div className="admin-flash">{flash}</div>}

        <div className="admin-cd" dir={isRTL ? 'rtl' : 'ltr'}>
          <button className="admin-back-btn" onClick={() => nav('/admin/concierge')}>
            {isRTL ? 'العودة ‹' : '‹ Back to Concierge'}
          </button>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isRTL ? 'طلب كونسيرج' : 'Concierge Request'}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <AdminStatusBadge status={request.status} lang={lang} />
                {request.request_type && (
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>
                    {request.request_type.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.filter(s => s !== request.status).map(s => (
                <button key={s} className="admin-action-btn" disabled={saving} onClick={() => updateStatus(s)}>
                  → {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Requester info */}
          <div className="admin-section-card">
            <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>{isRTL ? 'مقدم الطلب' : 'Requester'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px 24px', marginBottom: request.description ? 16 : 0 }}>
              {[
                [isRTL ? 'الاسم' : 'Name', request.requester?.full_name],
                ['Email', request.requester?.email],
                [isRTL ? 'الشركة' : 'Company', request.requester?.company_name],
                [isRTL ? 'واتساب' : 'WhatsApp', request.requester?.whatsapp],
                [isRTL ? 'الميزانية' : 'Budget', request.budget ? `${request.budget} ${request.currency}` : null],
                [isRTL ? 'تاريخ الطلب' : 'Submitted', fmt(request.created_at)],
              ].filter(([, v]) => v).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', wordBreak: 'break-word' }}>{val}</div>
                </div>
              ))}
            </div>
            {request.description && (
              <div>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginBottom: 6 }}>{isRTL ? 'الوصف' : 'DESCRIPTION'}</div>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{request.description}</p>
              </div>
            )}
          </div>

          {/* AI Summary */}
          {(request.summary || request.assistant_suggestion) && (
            <div className="admin-section-card" style={{ borderColor: 'rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: '#7c3aed', fontFamily: 'var(--font-sans)' }}>{isRTL ? 'ملخص المساعد الذكي' : 'AI Assistant Summary'}</p>
              {request.assistant_suggestion && (
                <p style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{request.assistant_suggestion}</p>
              )}
              {request.summary && (
                <pre style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                  {typeof request.summary === 'string' ? request.summary : JSON.stringify(request.summary, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Connections */}
          <div className="admin-section-card">
            <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
              {isRTL ? `الموردون المرتبطون (${connections.length})` : `Connected Suppliers (${connections.length})`}
            </p>

            {/* Search to add */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSuppliers()}
                placeholder={isRTL ? 'بحث عن مورد للربط...' : 'Search supplier to connect…'}
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
                    <button className="admin-action-btn primary" style={{ flexShrink: 0 }} onClick={() => addConnection(s)}>
                      {isRTL ? 'ربط' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {connections.length === 0 && (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 13, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', margin: 0 }}>
                {isRTL ? 'لا يوجد موردون مرتبطون.' : 'No suppliers connected yet.'}
              </p>
            )}

            {connections.map(conn => (
              <div key={conn.id} className="admin-conn-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>{conn.supplier?.full_name || conn.supplier?.email}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{conn.supplier?.company_name} · {conn.supplier?.country}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <AdminStatusBadge status={conn.status} lang={lang} />
                    <button className="admin-action-btn danger" style={{ padding: '0 12px', fontSize: 12 }} onClick={() => removeConnection(conn)}>
                      {isRTL ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={conn.status}
                    onChange={e => updateConnection(conn, { status: e.target.value })}
                    style={{ padding: '7px 10px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', minHeight: 36, fontFamily: 'var(--font-sans)' }}
                  >
                    <option value="active">active</option>
                    <option value="closed">closed</option>
                  </select>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                    {isRTL ? 'تدخلات:' : 'Interventions:'} {conn.admin_interventions || 0}
                  </span>
                  <button
                    style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)', minHeight: 36, fontFamily: 'var(--font-sans)' }}
                    onClick={() => updateConnection(conn, { admin_interventions: (conn.admin_interventions || 0) + 1 })}
                  >
                    + {isRTL ? 'تدخل' : 'Intervention'}
                  </button>
                </div>
                {conn.notes && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: 'var(--bg-raised)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {conn.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="admin-section-card">
            <AdminNoteThread entityType="concierge" entityId={id} user={user} lang={lang} />
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
