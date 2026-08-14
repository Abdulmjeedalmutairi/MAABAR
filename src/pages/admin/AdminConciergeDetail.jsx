import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import ManagedOpsPanel from '../../components/admin/ManagedOpsPanel';
import { sb, SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';
import { CUSTOMIZATION_CHIPS, DELIVERY_TIMEFRAMES, REQUEST_UNITS, labelFor } from '../../lib/requestFormOptions';
import { waTo } from '../../lib/maabarContact';

const SEND_EMAIL_URL = `${SUPABASE_FUNCTIONS_URL}/send-email`;

async function sendEmail(type, data) {
  try {
    await fetch(SEND_EMAIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ type, data }),
    });
  } catch (e) {
    console.error(`[AdminConciergeDetail] email ${type} error:`, e);
  }
}

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
// NOTE: `matched` is intentionally omitted. Reaching `shortlist_ready` must
// happen via AdminSeed.publishManagedShortlist (which also creates the
// managed_shortlisted_offers rows the buyer will actually render).
const TAB_TO_CANONICAL_MANAGED = {
  pending:     'admin_review',
  in_progress: 'sourcing',
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
  const [supplierOffers, setSupplierOffers] = useState([]);
  const [shortlistRows, setShortlistRows] = useState([]);
  const [shortlistingOfferId, setShortlistingOfferId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');
  // `null` means "use the request's own category as the default once it
  // loads". An explicit admin choice (including 'all') overrides that.
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [factoryInvites, setFactoryInvites] = useState([]);
  const [customization, setCustomization] = useState(null);
  const [attachUrls, setAttachUrls] = useState({}); // { path: signedUrl }
  const [searching, setSearching] = useState(false);
  const isAr = lang === 'ar';

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { data: req, error: reqError },
      { data: conns },
      { data: offers },
      { data: shortlist },
      { data: invites },
      { data: cust },
    ] = await Promise.all([
      sb.from('requests')
        .select(`
          id, buyer_id, request_ref, title_ar, title_en, contact_phone, category, description, budget_per_unit, quantity, unit, created_at,
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
      // Submitted supplier offers against this managed request. Admin-only
      // visibility — these are the prices/MOQs admin compares for shortlisting.
      sb.from('offers')
        .select('id, price, shipping_cost, moq, delivery_days, note, status, created_at, supplier_id, managed_match_id, negotiation_note, shortlisted_at, supplier:profiles!offers_supplier_id_fkey(full_name, company_name, country, status, maabar_supplier_id)')
        .eq('request_id', id)
        .eq('managed_visibility', 'admin_only')
        .order('created_at', { ascending: false }),
      // Existing shortlist — used to show "already shortlisted" state and to
      // pick the next rank when inserting.
      sb.from('managed_shortlisted_offers')
        .select('id, offer_id, rank, status, supplier_id')
        .eq('request_id', id)
        .order('rank'),
      // Factory invites on this request (Factories flow) — factory identity +
      // lifecycle. Admin reads factory_directory (incl. email) via is_admin_user().
      sb.from('request_factory_invites')
        .select('id, slug, status, factory_email, opened_at, registered_at, offer_submitted_at, expires_at, created_at, factory:factory_id(company_name, city, country, phone), product:factory_product_id(name_en, name_zh, name_ar, ref_code)')
        .eq('request_id', id)
        .order('created_at', { ascending: false }),
      // Buyer-authored structured customization (admin sees everything).
      sb.from('request_customization').select('*').eq('request_id', id).maybeSingle(),
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
        unit: req.unit || null,
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
    setSupplierOffers(offers || []);
    setShortlistRows(shortlist || []);
    setFactoryInvites(invites || []);
    setCustomization(cust || null);
    setLoading(false);

    // Sign the buyer's attachments so the admin can view/download (admin RLS +
    // the request-attachments admin-read policy make createSignedUrls work).
    const paths = Array.isArray(cust?.attachment_paths) ? cust.attachment_paths : [];
    if (paths.length) {
      const { data: signed } = await sb.storage.from('request-attachments').createSignedUrls(paths, 600);
      if (Array.isArray(signed)) {
        const map = {};
        signed.forEach((s) => { if (s?.path && s?.signedUrl) map[s.path] = s.signedUrl; });
        setAttachUrls(map);
      }
    } else {
      setAttachUrls({});
    }
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

  // The real managed_supplier_matches.status vocabulary, as written by the flows:
  // 'new' on admin assign, 'viewed'/'quoted'/'declined' by the supplier
  // (DashboardSupplier submitManagedMatchOffer), 'shortlisted' by the admin.
  // The old dropdown offered only active/closed, so selecting either overwrote
  // 'quoted' — erasing the one signal that a supplier had actually responded.
  const MATCH_STATUSES = [
    { val: 'new',         ar: 'جديد',       en: 'New' },
    { val: 'viewed',      ar: 'اطّلع',       en: 'Viewed' },
    { val: 'quoted',      ar: 'قدّم عرضاً',  en: 'Quoted' },
    { val: 'declined',    ar: 'اعتذر',      en: 'Declined' },
    { val: 'shortlisted', ar: 'في القائمة', en: 'Shortlisted' },
    { val: 'closed',      ar: 'مغلق',       en: 'Closed' },
  ];

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

    // Notify + email the supplier so they know a managed request was assigned.
    const reqTitle = request.description || request.request_type || '';
    try {
      await sb.from('notifications').insert({
        user_id: supplier.id,
        type: 'managed_match_assigned',
        title_ar: 'طلب مُدار جديد بانتظار عرضك',
        title_en: 'A new managed request is waiting for your offer',
        title_zh: '有新的托管需求等待您的报价',
        ref_id: id,
        is_read: false,
      });
    } catch (e) { console.error('[AdminConciergeDetail] notify supplier error:', e); }
    sendEmail('managed_match_assigned', {
      recipientUserId: supplier.id,
      name: supplier.full_name || supplier.company_name || 'Supplier',
      requestTitle: reqTitle,
    });

    await load();
    // searchResults is derived from connections; once load() refreshes
    // `connections`, the newly-connected supplier drops out of the dropdown.
    showFlash(isAr ? 'تمت إضافة المورد وتم إشعاره' : 'Supplier connected and notified');
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

  const shortlistedOfferIds = new Set(shortlistRows.map((r) => r.offer_id).filter(Boolean));

  // Inline port of AdminSeed.shortlistManagedOffer — keeps admins on this page
  // for the review step. Final "publish shortlist" still lives on
  // /admin-seed?requestId=... via the header button.
  const shortlistOfferInline = async (offer) => {
    if (!request?.buyer_id) return;
    setShortlistingOfferId(offer.id);
    try {
      const shippingTimeDays = (() => {
        const raw = String(offer.negotiation_note || '');
        const match = raw.match(/shipping_time_days:(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })();
      const nextRank = (shortlistRows.reduce((m, r) => Math.max(m, r.rank || 0), 0) || 0) + 1;
      const { error: shortlistError } = await sb.from('managed_shortlisted_offers').upsert({
        request_id: id,
        buyer_id: request.buyer_id,
        supplier_id: offer.supplier_id,
        offer_id: offer.id,
        rank: nextRank,
        unit_price: offer.price,
        moq: offer.moq,
        production_time_days: offer.delivery_days || null,
        shipping_time_days: shippingTimeDays,
        verification_level: null,
        maabar_notes: null,
        selection_reason: null,
        negotiation_summary: offer.note || null,
        status: 'active',
      }, { onConflict: 'request_id,rank' });
      if (shortlistError) {
        console.error('[AdminConciergeDetail] shortlistOffer error:', shortlistError);
        setShortlistingOfferId('');
        return;
      }
      await sb.from('offers').update({ shortlisted_at: new Date().toISOString() }).eq('id', offer.id);
      if (offer.managed_match_id) {
        await sb.from('managed_supplier_matches').update({ status: 'shortlisted' }).eq('id', offer.managed_match_id);
      }
      await logAdminAction({ actorId: user.id, action: 'concierge_shortlist_offer', entityType: 'concierge', entityId: id, beforeState: null, afterState: { offer_id: offer.id, rank: nextRank } });
      await load();
      showFlash(isAr ? 'تمت إضافة العرض للقائمة' : 'Offer added to shortlist');
    } finally {
      setShortlistingOfferId('');
    }
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

  // ── Factory-request display helpers ──
  const uLabel = (k) => { const u = REQUEST_UNITS.find((x) => x.key === k); return u ? labelFor(u, lang) : (k || ''); };
  const custTypes = (customization?.customization_types || []).map((k) => { const c = CUSTOMIZATION_CHIPS.find((x) => x.key === k); return c ? labelFor(c, lang) : k; });
  const custTimeframe = customization?.delivery_timeframe
    ? (() => { const d = DELIVERY_TIMEFRAMES.find((x) => x.key === customization.delivery_timeframe); return d ? labelFor(d, lang) : customization.delivery_timeframe; })()
    : null;
  const custDest = [customization?.ship_city, customization?.ship_country].filter(Boolean).join(isAr ? '، ' : ', ');
  const custAttachments = Array.isArray(customization?.attachment_paths) ? customization.attachment_paths : [];
  const attName = (p) => { const seg = decodeURIComponent(String(p).split('/').pop() || ''); const i = seg.indexOf('_'); return i >= 0 ? seg.slice(i + 1) : seg; };
  const isImg = (n) => /\.(jpe?g|png|webp|gif)$/i.test(n);
  const hasCustomization = !!(customization && (custTypes.length || custTimeframe || custDest || customization.additional_notes || customization.customization_details || custAttachments.length));
  const miniLabel = { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 6 };
  const inviteLink = (slug) => `${window.location.origin}/f/${slug}`;
  const copyLink = (slug) => { try { navigator.clipboard?.writeText(inviteLink(slug)); showFlash(isAr ? 'تم نسخ الرابط' : 'Link copied'); } catch { /* noop */ } };
  const waHref = (inv) => {
    const digits = String(inv.factory?.phone || '').replace(/[^0-9]/g, '');
    if (!digits) return null;
    const text = encodeURIComponent(`Maabar — new quote request: ${inviteLink(inv.slug)}`);
    return `https://wa.me/${digits}?text=${text}`;
  };
  const resendInvite = async (inv) => {
    setSaving(true);
    try {
      const { data, error } = await sb.functions.invoke('factory-invite-resend', { body: { inviteId: inv.id } });
      if (error || data?.ok === false) { showFlash(isAr ? 'تعذّر إعادة الإرسال' : 'Resend failed'); }
      else {
        await logAdminAction({ actorId: user.id, action: 'factory_invite_resend', entityType: 'concierge', entityId: id, beforeState: null, afterState: { invite_id: inv.id, slug: inv.slug } });
        showFlash(isAr ? 'أُعيد إرسال الدعوة للمصنع' : 'Invite re-sent to the factory');
      }
    } catch { showFlash(isAr ? 'تعذّر إعادة الإرسال' : 'Resend failed'); }
    setSaving(false);
  };

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
              {STATUSES.filter(s => s !== request.status && s !== 'matched').map(s => (
                <button key={s} className="cd-btn" disabled={saving} onClick={() => updateStatus(s)}>
                  → {s.replace('_', ' ')}
                </button>
              ))}
              {/* Advancing to `shortlist_ready` must go through AdminSeed's
                  publish step so the shortlist rows actually exist. Clicking
                  this button does NOT mutate managed_status; it opens the
                  review/publish workspace pre-scoped to this request. */}
              <button
                className="cd-btn cd-btn-primary"
                disabled={saving}
                onClick={() => nav(`/admin-seed?requestId=${id}`)}
              >
                {isAr ? 'راجع العروض وانشر القائمة' : 'Review offers & publish shortlist'}
              </button>
            </div>
          </div>

          {/* Managed operations — the lifecycle Maabar drives (stage / offer / video) */}
          {String(request.sourcing_mode || '') === 'managed' && (
            <SectionCard title={isAr ? 'عمليات الطلب المُدار' : 'Managed operations'}>
              <ManagedOpsPanel requestId={id} managedStatus={request.managed_status} isAr={isAr} onChanged={load} />
            </SectionCard>
          )}

          {/* Requester + request details */}
          <SectionCard title={isAr ? 'مقدم الطلب' : 'Requester'}>
            {(request.contact_phone || request.requester?.whatsapp) && (
              <a href={waTo(request.contact_phone || request.requester?.whatsapp, `مرحباً، بخصوص طلبك المُدار رقم ${request.request_ref || request.id}`)}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 9, padding: '9px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.42 1.3-1.95 1.34-.5.04-.5.4-3.15-.66-2.67-1.05-4.35-3.76-4.48-3.94-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.19.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.81 2 .88 2.15.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.8.85.27.13.44.2.5.31.07.11.07.63-.17 1.31z" /></svg>
                {isAr ? 'راسل التاجر على واتساب' : 'Message trader on WhatsApp'}
              </a>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px 24px', marginBottom: request.description ? 16 : 0 }}>
              <InfoItem label={isAr ? 'رقم الطلب' : 'Order no.'} value={request.request_ref} />
              <InfoItem label={isAr ? 'الاسم' : 'Name'} value={request.requester?.full_name} />
              <InfoItem label="Email" value={request.requester?.email} />
              <InfoItem label={isAr ? 'الشركة' : 'Company'} value={request.requester?.company_name} />
              <InfoItem label={isAr ? 'الجوال' : 'Phone'} value={request.contact_phone} />
              <InfoItem label={isAr ? 'واتساب' : 'WhatsApp'} value={request.requester?.whatsapp} />
              <InfoItem
                label={isAr ? 'التصنيف' : 'Category'}
                value={request.category
                  ? ((CATEGORY_LABELS[request.category]?.[lang]) || (CATEGORY_LABELS[request.category]?.en) || request.category)
                  : null}
              />
              <InfoItem label={isAr ? 'الكمية' : 'Quantity'} value={request.quantity ? `${request.quantity}${request.unit ? ' ' + uLabel(request.unit) : ''}` : null} />
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

          {/* Customization & shipping (factory request) + attachments — the admin
              sees everything the buyer entered, including files. */}
          {hasCustomization && (
            <SectionCard title={isAr ? 'التخصيص والشحن' : 'Customization & shipping'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px 24px' }}>
                <InfoItem label={isAr ? 'التخصيص المطلوب' : 'Customization'} value={custTypes.length ? custTypes.join(isAr ? '، ' : ', ') : null} />
                <InfoItem label={isAr ? 'الموعد المتوقّع' : 'Delivery timeframe'} value={custTimeframe} />
                <InfoItem label={isAr ? 'وجهة الشحن' : 'Ship to'} value={custDest || null} />
              </div>
              {customization.customization_details && (
                <div style={{ paddingTop: 14, marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={miniLabel}>{isAr ? 'تفاصيل التخصيص' : 'Customization details'}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.70)', lineHeight: 1.7, fontFamily: FONT_BODY, whiteSpace: 'pre-wrap' }}>{customization.customization_details}</p>
                </div>
              )}
              {customization.additional_notes && (
                <div style={{ paddingTop: 14, marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={miniLabel}>{isAr ? 'ملاحظات إضافية' : 'Additional notes'}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.70)', lineHeight: 1.7, fontFamily: FONT_BODY, whiteSpace: 'pre-wrap' }}>{customization.additional_notes}</p>
                </div>
              )}
              {custAttachments.length > 0 && (
                <div style={{ paddingTop: 14, marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={miniLabel}>{isAr ? `المرفقات (${custAttachments.length})` : `Attachments (${custAttachments.length})`}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {custAttachments.map((p, i) => {
                      const name = attName(p); const url = attachUrls[p]; const img = isImg(name);
                      return (
                        <a key={i} href={url || undefined} target="_blank" rel="noreferrer" title={name}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: img ? 72 : 'auto', height: 72, maxWidth: 220, padding: img ? 0 : '0 12px',
                            border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, overflow: 'hidden',
                            background: 'var(--bg-raised,#fff)', textDecoration: 'none', color: 'rgba(0,0,0,0.6)',
                            fontSize: 12, fontFamily: FONT_BODY, cursor: url ? 'pointer' : 'default', opacity: url ? 1 : 0.5,
                          }}>
                          {img && url
                            ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </SectionCard>
          )}

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
                    {/* Preserve any legacy value (e.g. 'active') so the select never
                        silently mislabels the row it is about to overwrite. */}
                    {conn.status && !MATCH_STATUSES.some(s => s.val === conn.status) && (
                      <option value={conn.status}>{conn.status}</option>
                    )}
                    {MATCH_STATUSES.map(s => (
                      <option key={s.val} value={s.val}>{isAr ? s.ar : s.en}</option>
                    ))}
                  </select>
                </div>
                {conn.notes && (
                  <div style={{ marginTop: 8, padding: '7px 10px', background: 'var(--bg-raised, #fff)', borderRadius: 6, fontSize: 12, color: 'rgba(0,0,0,0.60)', fontFamily: FONT_BODY }}>
                    {conn.notes}
                  </div>
                )}
              </div>
            ))}
          </SectionCard>

          {/* Supplier offers — every admin_only offer against this request */}
          <SectionCard title={isAr ? `عروض الموردين (${supplierOffers.length})` : `Supplier Offers (${supplierOffers.length})`}>
            {supplierOffers.length === 0 ? (
              <p style={{ color: 'rgba(0,0,0,0.30)', fontSize: 12, fontFamily: FONT_BODY, margin: 0 }}>
                {isAr ? 'لم يصل أي عرض بعد من الموردين المُعيَّنين.' : 'No offers submitted yet by assigned suppliers.'}
              </p>
            ) : supplierOffers.map((o) => {
              const isShortlisted = shortlistedOfferIds.has(o.id) || !!o.shortlisted_at;
              const sName = o.supplier?.company_name || o.supplier?.full_name || '—';
              const sId = o.supplier?.maabar_supplier_id;
              const pricePer = o.price != null ? `${o.price} USD/u` : '—';
              const shipping = o.shipping_cost != null ? `+${o.shipping_cost} ${isAr ? 'شحن' : 'ship'}` : '';
              const prodDays = o.delivery_days != null ? `${o.delivery_days} ${isAr ? 'يوم إنتاج' : 'd prod'}` : '';
              return (
                <div key={o.id} className="cd-conn-card" style={isShortlisted ? { borderColor: 'rgba(39,114,90,0.35)', background: 'rgba(39,114,90,0.04)' } : undefined}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY }}>{sName}</div>
                      {sId && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 2 }}>{sId}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <AdminStatusBadge status={isShortlisted ? 'shortlisted' : (o.status || 'pending')} lang={lang} />
                      {!isShortlisted && (
                        <button
                          type="button"
                          className="cd-btn cd-btn-primary"
                          disabled={shortlistingOfferId === o.id}
                          onClick={() => shortlistOfferInline(o)}
                          style={{ padding: '0 12px', fontSize: 11, minHeight: 32 }}
                        >
                          {shortlistingOfferId === o.id
                            ? (isAr ? 'جارٍ…' : 'Adding…')
                            : (isAr ? 'أضف للقائمة المختصرة' : 'Add to shortlist')}
                        </button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'rgba(0,0,0,0.65)', fontFamily: FONT_BODY, direction: 'ltr', marginBottom: 6 }}>
                    <span>{pricePer}</span>
                    {shipping && <span>{shipping}</span>}
                    {!!o.moq && <span>MOQ {o.moq}</span>}
                    {prodDays && <span>{prodDays}</span>}
                  </div>
                  {!!o.note && (
                    <div style={{ marginTop: 6, padding: '7px 10px', background: 'var(--bg-raised, #fff)', borderRadius: 6, fontSize: 12, color: 'rgba(0,0,0,0.60)', fontFamily: FONT_BODY }}>
                      {o.note}
                    </div>
                  )}
                </div>
              );
            })}
            {supplierOffers.length > 0 && (
              <p style={{ margin: '14px 0 0', fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY }}>
                {isAr
                  ? 'اختر أفضل 3 عروض هنا، ثم اضغط «راجع العروض وانشر القائمة» لنشرها للعميل.'
                  : 'Shortlist up to 3 offers here, then click "Review offers & publish shortlist" above to publish to the buyer.'}
              </p>
            )}
          </SectionCard>

          {/* Factory invites (Factories flow) — factory identity + lifecycle.
              Their offers appear under "Supplier Offers" above (admin_only). */}
          {factoryInvites.length > 0 && (
            <SectionCard title={isAr ? `دعوات المصانع (${factoryInvites.length})` : `Factory Invites (${factoryInvites.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {factoryInvites.map((inv) => {
                  const fname = inv.factory?.company_name || '—';
                  const pname = inv.product?.name_en || inv.product?.name_zh || inv.product?.name_ar || null;
                  return (
                    <div key={inv.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary, #1a1814)', fontWeight: 600 }}>{fname}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
                            {inv.factory_email}{inv.factory?.phone ? ` · ${inv.factory.phone}` : ''}{pname ? ` · ${pname}` : ''}{inv.product?.ref_code ? ` (${inv.product.ref_code})` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.6)' }}>{inv.status}</span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(0,0,0,0.45)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {inv.opened_at && <span>{isAr ? '✓ فُتح' : '✓ Opened'}</span>}
                        {inv.registered_at && <span>{isAr ? '✓ سُجّل' : '✓ Registered'}</span>}
                        {inv.offer_submitted_at && <span>{isAr ? '✓ قدّم عرضًا' : '✓ Offer submitted'}</span>}
                      </div>
                      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className="cd-btn" onClick={() => copyLink(inv.slug)}>{isAr ? 'نسخ الرابط' : 'Copy link'}</button>
                        <a className="cd-btn" href={`/f/${inv.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{isAr ? 'فتح الرابط' : 'Open'}</a>
                        {waHref(inv) && <a className="cd-btn" href={waHref(inv)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>WhatsApp</a>}
                        {inv.status !== 'offer_submitted' && (
                          <button type="button" className="cd-btn" disabled={saving} onClick={() => resendInvite(inv)}>{isAr ? 'إعادة إرسال' : 'Resend'}</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* Notes */}
          <SectionCard>
            <AdminNoteThread entityType="concierge" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
