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

// Mirrors the mapping used by AdminConcierge.jsx — the four concierge buckets
// collapsed from the richer managed_status lifecycle on public.requests.
const TAB_TO_MANAGED_STATUSES = {
  pending:     ['submitted', 'admin_review'],
  in_progress: ['sourcing', 'matching'],
  matched:     ['shortlist_ready', 'buyer_review'],
  closed:      ['buyer_selected', 'completed'],
};

const MANAGED_STATUS_TO_TAB = Object.entries(TAB_TO_MANAGED_STATUSES).reduce((acc, [tab, list]) => {
  list.forEach(ms => { acc[ms] = tab; });
  return acc;
}, {});

// When the admin clicks a bucket button, write a specific managed_status value.
// Pick the canonical leaf for each bucket so a single click advances the request
// into that stage instead of an ambiguous intermediate state.
const TAB_TO_CANONICAL_MANAGED = {
  pending:     'admin_review',
  in_progress: 'sourcing',
  matched:     'shortlist_ready',
  closed:      'completed',
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// Supplier speciality values mirror the buyer-side request categories
// (electronics, furniture, clothing, building, food, other). The admin picks
// one to narrow the Connected-Suppliers list to matching specialists.
const CATEGORY_LABELS = {
  all:         { ar: 'كل الموردين', en: 'All suppliers', zh: '全部供应商' },
  electronics: { ar: 'إلكترونيات',  en: 'Electronics',   zh: '电子产品' },
  furniture:   { ar: 'أثاث',        en: 'Furniture',     zh: '家具' },
  clothing:    { ar: 'ملابس',       en: 'Clothing',      zh: '服装' },
  building:    { ar: 'مواد بناء',   en: 'Building',      zh: '建材' },
  food:        { ar: 'غذاء',        en: 'Food',          zh: '食品' },
  other:       { ar: 'أخرى',        en: 'Other',         zh: '其他' },
};
const CATEGORY_KEYS = ['all', 'electronics', 'furniture', 'clothing', 'building', 'food', 'other'];

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
  // `null` means "use the request's own category as the default once it
  // loads". An explicit admin choice (including 'all') overrides that.
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [searching, setSearching] = useState(false);
  const isAr = lang === 'ar';

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: req, error: reqError }, { data: conns }] = await Promise.all([
      sb.from('requests')
        .select(`
          id, buyer_id, category, description, budget_per_unit, quantity, created_at,
          sourcing_mode, managed_status, payment_plan, sample_requirement, response_deadline,
          requester:profiles!requests_buyer_id_fkey(full_name, email, company_name, whatsapp, wechat),
          brief:managed_request_briefs(
            ai_confidence, cleaned_description, supplier_brief,
            ai_output, extracted_specs,
            admin_follow_up_question, admin_internal_notes
          )
        `)
        .eq('id', id)
        .maybeSingle(),
      // Connected Suppliers on managed requests live in managed_supplier_matches.
      // Same supplier embed as before so the existing card template keeps working.
      sb.from('managed_supplier_matches')
        .select('*, supplier:supplier_id(full_name, email, company_name, country, status)')
        .eq('request_id', id)
        .order('created_at'),
    ]);

    if (reqError) console.error('[AdminConciergeDetail] load error:', reqError);

    // Normalize into the shape the template already renders. Keep `brief` as a
    // structured sub-object so the AI summary section can render each field
    // (supplier_brief_all by language, extracted_specs list, admin follow-up,
    // internal notes) instead of a raw JSON dump.
    let normalized = null;
    if (req) {
      const brief = Array.isArray(req.brief) ? req.brief[0] : req.brief;
      normalized = {
        id: req.id,
        buyer_id: req.buyer_id || null,
        requester: req.requester || null,
        request_type: req.category || 'managed',
        category: req.category || null,
        quantity: req.quantity || null,
        payment_plan: req.payment_plan ?? null,
        sample_requirement: req.sample_requirement || null,
        response_deadline: req.response_deadline || null,
        description: brief?.cleaned_description || req.description || '',
        budget: req.budget_per_unit,
        currency: 'USD',
        status: MANAGED_STATUS_TO_TAB[req.managed_status] || req.managed_status || 'pending',
        managed_status: req.managed_status || null,
        created_at: req.created_at,
        assistant_suggestion: brief?.supplier_brief || null,
        brief: brief ? {
          supplier_brief_all: brief.ai_output?.supplier_brief_all || null,
          extracted_specs: Array.isArray(brief.extracted_specs) ? brief.extracted_specs : [],
          admin_follow_up_question: brief.admin_follow_up_question || null,
          admin_internal_notes: brief.admin_internal_notes || null,
          cleaned_description: brief.cleaned_description || null,
          ai_confidence: brief.ai_confidence || null,
        } : null,
      };
    }

    setRequest(normalized);
    setConnections(conns || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (newStatus) => {
    if (!request) return;
    setSaving(true);
    const before = { status: request.status, managed_status: request.managed_status };
    const targetManagedStatus = TAB_TO_CANONICAL_MANAGED[newStatus] || newStatus;
    const { error } = await sb.from('requests')
      .update({ managed_status: targetManagedStatus })
      .eq('id', id);
    if (error) console.error('[AdminConciergeDetail] updateStatus error:', error);
    await logAdminAction({
      actorId: user.id,
      action: 'concierge_status_update',
      entityType: 'concierge',
      entityId: id,
      beforeState: before,
      afterState: { status: newStatus, managed_status: targetManagedStatus },
    });
    await load();
    showFlash(isAr ? 'تم تحديث الحالة' : 'Status updated');
    setSaving(false);
  };

  // Preload every supplier once, then filter client-side by speciality. The
  // admin narrows candidates via a category dropdown whose values mirror the
  // buyer-side request categories.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setSearching(true);
      const { data, error } = await sb.from('profiles')
        .select('id, full_name, email, company_name, country, status, maabar_supplier_id, speciality')
        .eq('role', 'supplier')
        .order('company_name', { ascending: true })
        .limit(500);
      if (cancelled) return;
      if (error) console.error('[AdminConciergeDetail] loadSuppliers error:', error);
      setAllSuppliers(data || []);
      setSearching(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const existingIds = new Set(connections.map(c => c.supplier_id));
  // Resolve the active category: admin's explicit pick, else the request's
  // own category as a sensible default once it loads.
  const activeCategory = categoryFilter ?? request?.category ?? 'all';
  const searchResults = (() => {
    return allSuppliers
      .filter(s => !existingIds.has(s.id))
      .filter(s => activeCategory === 'all' || (s.speciality || '').toLowerCase() === activeCategory)
      .slice(0, 20);
  })();

  // managed_supplier_matches.status has no CHECK constraint, so the existing
  // ['active', 'closed'] dropdown values from the UI write through. The schema
  // has no admin_interventions column — filter that out so the + Intervention
  // button is a no-op rather than a failed write.
  const MATCH_UPDATE_ALLOWED = new Set([
    'status', 'admin_note', 'supplier_note', 'supplier_response',
    'viewed_at', 'supplier_responded_at', 'closed_at',
  ]);

  const addConnection = async (supplier) => {
    if (!request?.buyer_id) {
      console.error('[AdminConciergeDetail] addConnection: missing buyer_id on request');
      return;
    }
    const before = { connection_count: connections.length };
    const { error } = await sb.from('managed_supplier_matches').insert({
      request_id: id,
      buyer_id: request.buyer_id,
      supplier_id: supplier.id,
      status: 'new',
    });
    if (error) {
      console.error('[AdminConciergeDetail] addConnection error:', error);
      return;
    }
    await logAdminAction({ actorId: user.id, action: 'concierge_add_connection', entityType: 'concierge', entityId: id, beforeState: before, afterState: { connected_supplier_id: supplier.id } });
    await load();
    // searchResults is derived from connections; once load() refreshes
    // `connections`, the newly-connected supplier drops out of the dropdown.
    showFlash(isAr ? 'تمت إضافة المورد' : 'Supplier connected');
  };

  const updateConnection = async (conn, patch) => {
    const filtered = Object.fromEntries(
      Object.entries(patch).filter(([k]) => MATCH_UPDATE_ALLOWED.has(k)),
    );
    if (Object.keys(filtered).length === 0) return;
    const { error } = await sb.from('managed_supplier_matches').update(filtered).eq('id', conn.id);
    if (error) console.error('[AdminConciergeDetail] updateConnection error:', error);
    await logAdminAction({ actorId: user.id, action: 'concierge_update_connection', entityType: 'concierge', entityId: id, beforeState: conn, afterState: filtered });
    await load();
  };

  const removeConnection = async (conn) => {
    const { error } = await sb.from('managed_supplier_matches').delete().eq('id', conn.id);
    if (error) console.error('[AdminConciergeDetail] removeConnection error:', error);
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

          {/* Requester + request details */}
          <SectionCard title={isAr ? 'مقدم الطلب' : 'Requester'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px 24px', marginBottom: request.description ? 16 : 0 }}>
              <InfoItem label={isAr ? 'الاسم' : 'Name'} value={request.requester?.full_name} />
              <InfoItem label="Email" value={request.requester?.email} />
              <InfoItem label={isAr ? 'الشركة' : 'Company'} value={request.requester?.company_name} />
              <InfoItem label={isAr ? 'واتساب' : 'WhatsApp'} value={request.requester?.whatsapp} />
              <InfoItem
                label={isAr ? 'التصنيف' : 'Category'}
                value={request.category
                  ? ((CATEGORY_LABELS[request.category]?.[lang]) || (CATEGORY_LABELS[request.category]?.en) || request.category)
                  : null}
              />
              <InfoItem label={isAr ? 'الكمية' : 'Quantity'} value={request.quantity} />
              <InfoItem label={isAr ? 'الميزانية للوحدة' : 'Budget/unit'} value={request.budget ? `${request.budget} ${request.currency}` : null} />
              <InfoItem
                label={isAr ? 'خطة الدفع' : 'Payment plan'}
                value={request.payment_plan
                  ? (isAr
                      ? `${request.payment_plan}٪ مقدم + ${100 - request.payment_plan}٪ عند الشحن`
                      : lang === 'zh'
                        ? `${request.payment_plan}% 定金 + ${100 - request.payment_plan}% 发货前`
                        : `${request.payment_plan}% upfront + ${100 - request.payment_plan}% on shipping`)
                  : null}
              />
              <InfoItem
                label={isAr ? 'الموعد النهائي' : 'Deadline'}
                value={request.response_deadline ? fmtDate(request.response_deadline) : null}
              />
              <InfoItem label={isAr ? 'تاريخ الطلب' : 'Submitted'} value={fmtDate(request.created_at)} />
            </div>
            {request.description && (
              <div style={{ paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 }}>{isAr ? 'الوصف' : 'Description'}</div>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.65)', lineHeight: 1.7, fontFamily: FONT_BODY }}>{request.description}</p>
              </div>
            )}
          </SectionCard>

          {/* AI summary — amber tint, no purple. Renders structured brief fields
              (supplier_brief_all by language, extracted_specs list, admin
              follow-up, internal notes) with cleaned_description as the last
              resort if everything else is empty. */}
          {(() => {
            const brief = request.brief;
            const suggestion = request.assistant_suggestion;
            if (!brief && !suggestion) return null;

            const briefText = brief?.supplier_brief_all
              ? (brief.supplier_brief_all[lang]
                  || brief.supplier_brief_all.en
                  || brief.supplier_brief_all.ar
                  || brief.supplier_brief_all.zh
                  || null)
              : null;

            const specs = (brief?.extracted_specs || []).filter(s => s && (s.key || s.label || s.name));
            const hasFollowUp = !!brief?.admin_follow_up_question;
            const hasInternalNotes = !!brief?.admin_internal_notes;

            const hasAnyParsed = !!(briefText || specs.length || hasFollowUp || hasInternalNotes || suggestion);
            if (!hasAnyParsed && !brief?.cleaned_description) return null;

            const amberLabel = { fontSize: 10, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: '#8B6914', fontFamily: FONT_BODY, marginBottom: 6 };
            const subLabel = { fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', fontFamily: FONT_BODY, marginBottom: 6 };
            const bodyText = { margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 1.7, fontFamily: FONT_BODY };

            return (
              <SectionCard style={{ borderColor: 'rgba(139,105,20,0.20)', background: 'rgba(139,105,20,0.04)' }}>
                <p style={{ margin: '0 0 12px', ...amberLabel, fontSize: 10, letterSpacing: 1.6, marginBottom: 12 }}>
                  {isAr ? 'ملخص المساعد الذكي' : 'AI Assistant Summary'}
                </p>

                {suggestion && (
                  <p style={{ ...bodyText, marginBottom: 14 }}>{suggestion}</p>
                )}

                {briefText && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={subLabel}>{isAr ? 'الملخص' : 'Brief'}</p>
                    <p style={bodyText}>{briefText}</p>
                  </div>
                )}

                {specs.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={subLabel}>{isAr ? 'المواصفات المستخرجة' : 'Extracted Specs'}</p>
                    <ul style={{ margin: 0, paddingInlineStart: 18, fontFamily: FONT_BODY, fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 1.7 }}>
                      {specs.map((spec, i) => {
                        const label = spec.label || spec.key || spec.name;
                        const value = spec.value != null && spec.value !== ''
                          ? `${spec.value}${spec.unit ? ' ' + spec.unit : ''}`
                          : (isAr ? '—' : '—');
                        return (
                          <li key={i}>
                            <span style={{ color: 'rgba(0,0,0,0.55)' }}>{label}:</span>{' '}
                            <span>{value}</span>
                            {spec.confidence && (
                              <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginInlineStart: 6 }}>
                                ({spec.confidence})
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {hasFollowUp && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={subLabel}>{isAr ? 'سؤال للمتابعة' : 'Follow-up Question'}</p>
                    <p style={bodyText}>{brief.admin_follow_up_question}</p>
                  </div>
                )}

                {hasInternalNotes && (
                  <div style={{ marginBottom: 0 }}>
                    <p style={subLabel}>{isAr ? 'ملاحظات داخلية' : 'Internal Notes'}</p>
                    <p style={bodyText}>{brief.admin_internal_notes}</p>
                  </div>
                )}

                {!hasAnyParsed && brief?.cleaned_description && (
                  <p style={bodyText}>{brief.cleaned_description}</p>
                )}
              </SectionCard>
            );
          })()}

          {/* Connections */}
          <SectionCard title={isAr ? `الموردون المرتبطون (${connections.length})` : `Connected Suppliers (${connections.length})`}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', fontFamily: FONT_BODY }}>
                {isAr ? 'التصنيف' : 'Category'}
              </label>
              <select
                value={activeCategory}
                onChange={e => setCategoryFilter(e.target.value)}
                disabled={searching}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ flex: 1, minWidth: 200, padding: '9px 12px', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, outline: 'none', minHeight: 38, boxSizing: 'border-box', cursor: 'pointer' }}
              >
                {CATEGORY_KEYS.map(k => (
                  <option key={k} value={k}>
                    {(CATEGORY_LABELS[k] && (CATEGORY_LABELS[k][lang] || CATEGORY_LABELS[k].en)) || k}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>
                {searching
                  ? (isAr ? 'جارٍ التحميل…' : 'Loading…')
                  : `${searchResults.length} ${isAr ? 'مورد' : 'supplier' + (searchResults.length !== 1 ? 's' : '')}`}
              </span>
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
