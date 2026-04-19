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

const STATUSES = ['pending', 'in_progress', 'matched', 'closed'];

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
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, wordBreak: 'break-word' }}>{value}</div>
    </div>
  );
}

export default function AdminConciergeDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [request, setRequest] = useState(null);
  const [connections, setConnections] = useState([]);
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
    showFlash(isAr ? 'تمت إضافة المورد' : 'Supplier connected');
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
    showFlash(isAr ? 'تمت الإزالة' : 'Connection removed');
  };

  const CSS = `
    .cd-page { padding: 32px 32px; max-width: 920px; }
    .cd-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; letter-spacing: 0.3px; transition: color 0.12s; }
    .cd-back:hover { color: rgba(0,0,0,0.65); }
    .cd-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .cd-btn { min-height: 38px; padding: 0 14px; border-radius: 8px; font-size: 12px; cursor: pointer; transition: all 0.12s; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); }
    .cd-btn:hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.80); }
    .cd-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cd-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
    .cd-btn-primary:hover { opacity: 0.88; background: #1a1814; }
    .cd-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
    .cd-btn-danger:hover { background: rgba(192,57,43,0.06); border-color: rgba(192,57,43,0.35); }
    .cd-conn-card { background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 13px; margin-bottom: 8px; }
    @media (max-width: 900px) { .cd-page { padding: 22px 16px; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="cd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!request) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="cd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Request not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="cd-flash">{flashMsg}</div>}

        <div className="cd-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="cd-back" onClick={() => nav('/admin/concierge')}>
            {isAr ? '‹ الكونسيرج' : '‹ Concierge'}
          </button>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {isAr ? 'طلب كونسيرج' : 'Concierge Request'}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <AdminStatusBadge status={request.status} lang={lang} />
                {request.request_type && (
                  <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, textTransform: 'capitalize', letterSpacing: 0.3 }}>
                    {request.request_type.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUSES.filter(s => s !== request.status).map(s => (
                <button key={s} className="cd-btn" disabled={saving} onClick={() => updateStatus(s)}>
                  → {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Requester */}
          <SectionCard title={isAr ? 'مقدم الطلب' : 'Requester'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px 24px', marginBottom: request.description ? 16 : 0 }}>
              <InfoItem label={isAr ? 'الاسم' : 'Name'} value={request.requester?.full_name} />
              <InfoItem label="Email" value={request.requester?.email} />
              <InfoItem label={isAr ? 'الشركة' : 'Company'} value={request.requester?.company_name} />
              <InfoItem label={isAr ? 'واتساب' : 'WhatsApp'} value={request.requester?.whatsapp} />
              <InfoItem label={isAr ? 'الميزانية' : 'Budget'} value={request.budget ? `${request.budget} ${request.currency}` : null} />
              <InfoItem label={isAr ? 'تاريخ الطلب' : 'Submitted'} value={fmtDate(request.created_at)} />
            </div>
            {request.description && (
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'الوصف' : 'Description'}</div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.7, fontFamily: FONT_BODY }}>{request.description}</p>
              </div>
            )}
          </SectionCard>

          {/* AI summary — amber tint, no purple */}
          {(request.summary || request.assistant_suggestion) && (
            <SectionCard style={{ borderColor: 'rgba(139,105,20,0.20)', background: 'rgba(139,105,20,0.04)' }}>
              <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: '#8B6914', fontFamily: FONT_BODY }}>
                {isAr ? 'ملخص المساعد الذكي' : 'AI Assistant Summary'}
              </p>
              {request.assistant_suggestion && (
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 1.7, fontFamily: FONT_BODY }}>{request.assistant_suggestion}</p>
              )}
              {request.summary && (
                <pre style={{ margin: 0, fontSize: 11, color: 'rgba(0,0,0,0.55)', fontFamily: "'Courier New', monospace", whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
                  {typeof request.summary === 'string' ? request.summary : JSON.stringify(request.summary, null, 2)}
                </pre>
              )}
            </SectionCard>
          )}

          {/* Connections */}
          <SectionCard title={isAr ? `الموردون المرتبطون (${connections.length})` : `Connected Suppliers (${connections.length})`}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                value={supplierSearch}
                onChange={e => setSupplierSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSuppliers()}
                placeholder={isAr ? 'بحث عن مورد للربط...' : 'Search supplier to connect…'}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ flex: 1, minWidth: 200, padding: '9px 12px', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, outline: 'none', minHeight: 38, boxSizing: 'border-box' }}
              />
              <button className="cd-btn cd-btn-primary" onClick={searchSuppliers} disabled={searching} style={{ minWidth: 72 }}>
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
                    <button className="cd-btn cd-btn-primary" style={{ flexShrink: 0 }} onClick={() => addConnection(s)}>
                      {isAr ? 'ربط' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {connections.length === 0 && (
              <p style={{ color: 'rgba(0,0,0,0.30)', fontSize: 12, fontFamily: FONT_BODY, margin: '0 0 4px' }}>
                {isAr ? 'لا يوجد موردون مرتبطون.' : 'No suppliers connected yet.'}
              </p>
            )}

            {connections.map(conn => (
              <div key={conn.id} className="cd-conn-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{conn.supplier?.full_name || conn.supplier?.email}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 2 }}>{conn.supplier?.company_name} · {conn.supplier?.country}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <AdminStatusBadge status={conn.status} lang={lang} />
                    <button className="cd-btn cd-btn-danger" style={{ padding: '0 10px', fontSize: 11 }} onClick={() => removeConnection(conn)}>
                      {isAr ? 'إزالة' : 'Remove'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={conn.status}
                    onChange={e => updateConnection(conn, { status: e.target.value })}
                    style={{ padding: '7px 10px', background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 7, fontSize: 12, color: 'rgba(0,0,0,0.75)', outline: 'none', cursor: 'pointer', minHeight: 34, fontFamily: FONT_BODY }}
                  >
                    <option value="active">active</option>
                    <option value="closed">closed</option>
                  </select>
                  <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>
                    {isAr ? 'تدخلات:' : 'Interventions:'} {conn.admin_interventions || 0}
                  </span>
                  <button
                    className="cd-btn"
                    onClick={() => updateConnection(conn, { admin_interventions: (conn.admin_interventions || 0) + 1 })}
                  >
                    + {isAr ? 'تدخل' : 'Intervention'}
                  </button>
                </div>
                {conn.notes && (
                  <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--bg-raised, #fff)', borderRadius: 6, fontSize: 12, color: 'rgba(0,0,0,0.60)', fontFamily: FONT_BODY }}>
                    {conn.notes}
                  </div>
                )}
              </div>
            ))}
          </SectionCard>

          {/* Notes */}
          <SectionCard>
            <AdminNoteThread entityType="concierge" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
