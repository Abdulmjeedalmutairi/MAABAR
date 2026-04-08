import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';
import { DISPLAY_CURRENCIES } from '../lib/displayCurrency';
import {
  getOfferEstimatedTotal,
  getOfferProductSubtotal,
  getOfferShippingCost,
  getOfferShippingMethod,
  hasOfferShippingCost,
} from '../lib/offerPricing';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';
import { shouldResumeIdeaFlow } from '../lib/ideaToProductFlow';
import {
  attachDirectoryProfiles,
  attachSupplierProfiles,
} from '../lib/profileVisibility';
import {
  fetchProductInquiryThreads,
  getProductInquiryProductName,
  getProductInquiryStatusLabel,
} from '../lib/productInquiry';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
import Footer from '../components/Footer';
import ManagedBuyerRequestPanel from '../components/ManagedBuyerRequestPanel';
import { isManagedRequest } from '../lib/managedSourcing';

const getTrackingUrl = (company, num) => {
  const urls = {
    'DHL':    `https://www.dhl.com/track?tracking-id=${num}`,
    'FedEx':  `https://www.fedex.com/tracking?tracknumbers=${num}`,
    'Aramex': `https://www.aramex.com/track/${num}`,
    'UPS':    `https://www.ups.com/track?tracknum=${num}`,
    'SMSA':   `https://www.smsaexpress.com/track?awbno=${num}`,
  };
  return urls[company] || `https://t.17track.net/en#nums=${num}`;
};

const STATUS_AR = { open: 'مرفوع', offers_received: 'عروض وصلت', closed: 'عرض مقبول', paid: 'تم الدفع', ready_to_ship: 'الشحنة جاهزة', shipping: 'قيد الشحن', arrived: 'وصل السعودية', delivered: 'تم التسليم' };
const STATUS_EN = { open: 'Posted', offers_received: 'Offers In', closed: 'Accepted', paid: 'Paid', ready_to_ship: 'Ready to Ship', shipping: 'Shipping', arrived: 'Arrived', delivered: 'Delivered' };
const STATUS_STEPS = ['open', 'offers_received', 'closed', 'paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'];

const CITIES_AR = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'القصيم', 'حائل', 'جازان', 'نجران'];
const CITIES_EN = ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Qassim', 'Hail', 'Jazan', 'Najran'];

/* ─── Status Bar ─────────────────────────── */
function StatusBar({ status, isAr }) {
  const idx     = STATUS_STEPS.indexOf(status);
  const current = idx === -1 ? 0 : idx;
  const label   = isAr ? (STATUS_AR[status] || STATUS_AR.open) : (STATUS_EN[status] || STATUS_EN.open);
  return (
    <div style={{ margin: '12px 0 8px' }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {STATUS_STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2,
            background: i <= current ? 'var(--text-tertiary)' : 'var(--border-subtle)',
            borderRadius: 1, transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {label}
      </p>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────── */
function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${highlight ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      padding: '24px 28px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ fontSize: 44, fontWeight: 300, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1, letterSpacing: -1.5 }}>
        {value}
      </p>
    </div>
  );
}

/* ─── Quick Action ───────────────────────── */
function QuickAction({ title, sub, onClick, primary, isAr }) {
  return (
    <div onClick={onClick} style={{
      padding: '24px',
      background: primary ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${primary ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {title}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>
        {sub}
      </p>
    </div>
  );
}

/* ─── Back Button ────────────────────────── */
function BackBtn({ onClick, isAr }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none',
      color: 'var(--text-disabled)', fontSize: 11,
      cursor: 'pointer', letterSpacing: 2,
      textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)',
      padding: 0, marginBottom: 32,
      transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
      {isAr ? 'رجوع ←' : '← Back'}
    </button>
  );
}

/* ─── Main ───────────────────────────────── */
export default function DashboardBuyer({ user, profile, lang, displayCurrency, setDisplayCurrency }) {
  const nav      = useNavigate();
  const location = useLocation();
  const isAr     = lang === 'ar';

  // Handle dashboard query params (tab focus / custom manufacturing resume)
  useEffect(() => {
    if (shouldResumeIdeaFlow(location.search)) {
      nav('/requests?flow=custom');
      return;
    }

    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search, nav]);

  const [stats, setStats]                 = useState({ requests: 0, messages: 0, offers: 0, productInquiries: 0 });
  const [myRequests, setMyRequests]       = useState([]);
  const [inbox, setInbox]                 = useState([]);
  const [productInquiries, setProductInquiries] = useState([]);
  const [activeTab, setActiveTab]         = useState('overview');
  const [pendingActions, setPendingActions] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [samples, setSamples] = useState([]);
  const focusedRequestId = new URLSearchParams(location.search).get('request');

  // Review modal
  const [reviewModal, setReviewModal]       = useState(null);
  const [reviewRating, setReviewRating]     = useState(0);
  const [reviewComment, setReviewComment]   = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Edit/Delete request
  const [editReqModal, setEditReqModal]   = useState(null);
  const [editReqForm, setEditReqForm]     = useState({});
  const [savingEditReq, setSavingEditReq] = useState(false);

  // Cancel request confirmation
  const [cancelConfirmReq, setCancelConfirmReq] = useState(null);

  // Settings
  const [settings, setSettings]         = useState({ full_name: '', phone: '', city: '', company_name: '', preferred_display_currency: displayCurrency || 'USD' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    loadStats();
    loadPendingActions();

    // Realtime — refresh when offers/requests change
    const channel = sb.channel(`buyer-dash-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        loadStats(); loadPendingActions();
        if (activeTab === 'requests') loadMyRequests();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `buyer_id=eq.${user.id}` }, () => {
        loadStats(); loadPendingActions();
        if (activeTab === 'requests') loadMyRequests();
      })
      .subscribe();
    return () => sb.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'requests') loadMyRequests();
    if (activeTab === 'messages') loadInbox();
    if (activeTab === 'product-inquiries') loadProductInquiries();
    if (activeTab === 'samples') loadMySamples();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'requests' || !focusedRequestId || loadingRequests) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-request-id="${String(focusedRequestId)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeTab, focusedRequestId, loadingRequests, myRequests.length]);

  useEffect(() => {
    setSettings(prev => ({ ...prev, preferred_display_currency: displayCurrency || 'USD' }));
  }, [displayCurrency]);

  const loadStats = async () => {
    const [requests, messages, offers, productInquiries] = await Promise.all([
      sb.from('requests').select('id', { count: 'exact' }).eq('buyer_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      sb.from('offers').select('id', { count: 'exact' }).eq('status', 'pending').in('request_id',
        (await sb.from('requests').select('id').eq('buyer_id', user.id)).data?.map(r=>r.id) || []
      ),
      sb.from('product_inquiries').select('id', { count: 'exact' }).eq('buyer_id', user.id),
    ]);
    setStats({ requests: requests.count || 0, messages: messages.count || 0, offers: offers.count || 0, productInquiries: productInquiries.count || 0 });
  };

  const loadPendingActions = async () => {
    const actions = [];
    const { data: reqs } = await sb.from('requests').select('*, offers(id,status)').eq('buyer_id', user.id);
    if (reqs) {
      reqs.forEach(r => {
        const pending = r.offers?.filter(o => o.status === 'pending') || [];
        if (String(r.sourcing_mode || 'direct') === 'managed' && String(r.managed_status || '') === 'shortlist_ready') {
          actions.push({ type: 'managed_shortlist', request: r });
        } else if (pending.length > 0) {
          actions.push({ type: 'offers', request: r, count: pending.length });
        }
        if (r.status === 'paid')          actions.push({ type: 'payment_sent', request: r });
        if (r.status === 'ready_to_ship') actions.push({ type: 'ready_to_ship', request: r });
        if (r.status === 'shipping')      actions.push({ type: 'delivery', request: r });
      });
    }
    const { data: msgs } = await sb.from('messages').select('id').eq('receiver_id', user.id).eq('is_read', false);
    if (msgs?.length > 0) actions.push({ type: 'messages', count: msgs.length });
    setPendingActions(actions);
  };

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    const { data } = await sb.from('requests').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const requestIds = data.map((request) => request.id);
      const managedRequestIds = data.filter((request) => isManagedRequest(request)).map((request) => request.id);

      const [briefsResult, shortlistResult, feedbackResult] = await Promise.all([
        managedRequestIds.length > 0
          ? sb.from('managed_request_briefs').select('*').in('request_id', managedRequestIds)
          : Promise.resolve({ data: [] }),
        managedRequestIds.length > 0
          ? sb.from('managed_shortlisted_offers').select('*').in('request_id', managedRequestIds).order('rank', { ascending: true })
          : Promise.resolve({ data: [] }),
        managedRequestIds.length > 0
          ? sb.from('managed_shortlist_feedback').select('*').in('request_id', managedRequestIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const shortlistWithProfiles = await attachSupplierProfiles(sb, shortlistResult.data || [], 'supplier_id', 'profiles');
      const shortlistByRequest = (shortlistWithProfiles || []).reduce((acc, offer) => {
        acc[offer.request_id] = [...(acc[offer.request_id] || []), offer];
        return acc;
      }, {});
      const briefByRequest = (briefsResult.data || []).reduce((acc, brief) => ({ ...acc, [brief.request_id]: brief }), {});
      const feedbackByRequest = (feedbackResult.data || []).reduce((acc, entry) => {
        acc[entry.request_id] = [...(acc[entry.request_id] || []), entry];
        return acc;
      }, {});

      const withOffers = await Promise.all(data.map(async (request) => {
        const { data: offers } = await sb.from('offers').select('*').eq('request_id', request.id);
        const offersWithProfiles = await attachSupplierProfiles(sb, offers || [], 'supplier_id', 'profiles');
        return {
          ...request,
          offers: offersWithProfiles || [],
          brief: briefByRequest[request.id] || null,
          managedShortlist: shortlistByRequest[request.id] || [],
          managedFeedback: feedbackByRequest[request.id] || [],
        };
      }));
      setMyRequests(withOffers);
    }
    setLoadingRequests(false);
  };

  const loadMySamples = async () => {
    const { data } = await sb.from('samples')
      .select('*,products(name_ar,name_en,name_zh)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSamples(await attachSupplierProfiles(sb, data, 'supplier_id', 'profiles'));
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages')
      .select('*')
      .eq('receiver_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const withProfiles = await attachDirectoryProfiles(sb, data, 'sender_id', 'profiles');
      const seen = new Set();
      setInbox(withProfiles.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; }));
      await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
      setStats(s => ({ ...s, messages: 0 }));
    }
  };

  const loadProductInquiries = async () => {
    try {
      const data = await fetchProductInquiryThreads(sb, { buyerId: user.id });
      setProductInquiries(await attachSupplierProfiles(sb, data, 'supplier_id', 'profiles'));
    } catch (error) {
      console.error('load buyer product inquiries error:', error);
      setProductInquiries([]);
    }
  };

  const loadSettings = async () => {
    const { data } = await sb.from('profiles').select('full_name,phone,city,company_name').eq('id', user.id).single();
    if (data) {
      setSettings({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
        company_name: data.company_name || '',
        preferred_display_currency: displayCurrency || 'USD',
      });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await sb.from('profiles').update({
      full_name: settings.full_name, phone: settings.phone,
      city: settings.city, company_name: settings.company_name,
    }).eq('id', user.id);
    await setDisplayCurrency?.(settings.preferred_display_currency || 'USD');
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const rejectOffer = async (offerId, supplierId, requestId) => {
    if (!window.confirm(isAr ? 'هل تريد رفض هذا العرض؟' : 'Reject this offer?')) return;
    const { data: reqData } = await sb.from('requests').select('title_ar,title_en').eq('id', requestId).single();
    const reqTitle = reqData?.title_ar || reqData?.title_en || '';

    const { error } = await sb.from('offers').update({ status: 'rejected' }).eq('id', offerId);
    if (error) {
      alert(isAr ? 'حدث خطأ أثناء رفض العرض' : 'Error rejecting offer');
      return;
    }

    await sb.from('notifications').insert({
      user_id: supplierId,
      type: 'offer_rejected',
      title_ar: `تم رفض عرضك على الطلب: ${reqTitle}`,
      title_en: `Your offer was rejected for: ${reqTitle}`,
      title_zh: `您的报价已被拒绝: ${reqTitle}`,
      ref_id: requestId,
      is_read: false,
    });

    setMyRequests(prev => prev.map(req => req.id !== requestId ? req : {
      ...req,
      offers: req.offers.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o),
    }));
    loadPendingActions();
    loadStats();
  };

  const acceptOffer = async (offerId, supplierId, requestId) => {
    // Get request title and all other pending offers before updating
    const { data: allOffers } = await sb.from('offers')
      .select('id,supplier_id')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .neq('id', offerId);
    const { data: reqData } = await sb.from('requests').select('title_ar,title_en').eq('id', requestId).single();
    const reqTitle = reqData?.title_ar || reqData?.title_en || '';

    try {
      const { error: e1 } = await sb.from('offers').update({ status: 'accepted' }).eq('id', offerId);
      if (e1) { console.error('acceptOffer: failed to set offer accepted:', e1); alert(isAr ? 'حدث خطأ أثناء قبول العرض' : 'Error accepting offer'); return; }

      const { error: e2 } = await sb.from('requests').update({ status: 'closed' }).eq('id', requestId);
      if (e2) { console.error('acceptOffer: failed to close request:', e2); alert(isAr ? 'حدث خطأ أثناء تحديث الطلب' : 'Error updating request'); return; }

      const { error: e3 } = await sb.from('offers').update({ status: 'rejected' }).eq('request_id', requestId).neq('id', offerId);
      if (e3) { console.error('acceptOffer: failed to reject other offers:', e3); alert(isAr ? 'حدث خطأ أثناء تحديث العروض الأخرى' : 'Error updating other offers'); return; }
    } catch (e) {
      console.error('acceptOffer: unexpected DB error:', e);
      alert(isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error');
      return;
    }

    // All DB writes succeeded — now send notifications and emails
    await sb.from('notifications').insert({
      user_id: supplierId, type: 'offer_accepted',
      title_ar: 'تم قبول عرضك', title_en: 'Your offer has been accepted', title_zh: '您的报价已被接受',
      ref_id: offerId, is_read: false,
    });
    try {
      const res = await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'offer_accepted', data: { recipientUserId: supplierId, name: 'Supplier', requestTitle: reqTitle, lang } }),
      });
      if (!res.ok) {
        console.error('offer_accepted email failed:', await res.text());
      }
    } catch (e) { console.error('email error:', e); }

    // Notify and email each rejected supplier individually
    if (allOffers?.length) {
      await Promise.all(allOffers.map(async (o) => {
        await sb.from('notifications').insert({
          user_id: o.supplier_id, type: 'offer_rejected',
          title_ar: `تم اختيار عرض آخر على الطلب: ${reqTitle}`,
          title_en: `Another offer was selected for: ${reqTitle}`,
          title_zh: `已选择其他报价: ${reqTitle}`,
          ref_id: requestId, is_read: false,
        });
        try {
          await fetch(SEND_EMAILS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ type: 'offer_rejected', data: { recipientUserId: o.supplier_id, name: 'Supplier', requestTitle: reqTitle, lang } }),
          });
        } catch (e) { console.error('email error:', e); }
      }));
    }

    loadMyRequests(); loadPendingActions();
  };

  const recordManagedShortlistAction = async ({ request, shortlistOffer = null, action, reason = null }) => {
    await sb.from('managed_shortlist_feedback').insert({
      request_id: request.id,
      buyer_id: user.id,
      shortlist_offer_id: shortlistOffer?.id || null,
      action,
      reason,
    });
  };

  const chooseManagedOffer = async (request, shortlistOffer) => {
    await recordManagedShortlistAction({ request, shortlistOffer, action: 'choose_offer' });
    await sb.from('managed_shortlisted_offers').update({ selected_by_buyer: true, buyer_selected_at: new Date().toISOString(), status: 'selected_by_buyer' }).eq('id', shortlistOffer.id);
    await sb.from('managed_shortlisted_offers').update({ selected_by_buyer: false }).eq('request_id', request.id).neq('id', shortlistOffer.id);
    await sb.from('requests').update({ managed_status: 'buyer_selected', managed_last_buyer_action: 'choose_offer' }).eq('id', request.id);
    await loadMyRequests();
    await loadPendingActions();
  };

  const requestManagedNegotiation = async (request, shortlistOffer, reason) => {
    await recordManagedShortlistAction({ request, shortlistOffer, action: 'request_negotiation', reason });
    await sb.from('requests').update({ managed_status: 'sourcing', managed_last_buyer_action: 'request_negotiation' }).eq('id', request.id);
    await loadMyRequests();
    await loadPendingActions();
  };

  const rejectManagedOffer = async (request, shortlistOffer) => {
    await recordManagedShortlistAction({ request, shortlistOffer, action: 'not_suitable' });
    await sb.from('managed_shortlisted_offers').update({ status: 'dismissed' }).eq('id', shortlistOffer.id);
    await sb.from('requests').update({ managed_last_buyer_action: 'not_suitable' }).eq('id', request.id);
    await loadMyRequests();
  };

  const restartManagedSearch = async (request) => {
    await recordManagedShortlistAction({ request, action: 'restart_search' });
    await sb.from('requests').update({ managed_status: 'sourcing', managed_last_buyer_action: 'restart_search', managed_research_requested_count: (request.managed_research_requested_count || 0) + 1 }).eq('id', request.id);
    await loadMyRequests();
    await loadPendingActions();
  };

  const confirmDelivery = async (requestId, supplierId, supplierName) => {
    // Update request status
    await sb.from('requests').update({ status: 'delivered', shipping_status: 'delivered' }).eq('id', requestId);

    // Trigger payout: mark payment as completed
    const { data: paymentData } = await sb.from('payments')
      .select('id, amount, amount_second, payment_pct')
      .eq('request_id', requestId)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentData) {
      // If split payment and second payment was made, total is fully paid
      // Mark payment as completed — triggers payout to supplier
      await sb.from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentData.id);
    }

    // Notify supplier
    await sb.from('notifications').insert({
      user_id: supplierId, type: 'delivery_confirmed',
      title_ar: 'التاجر أكد الاستلام — سيتم تحويل المبلغ خلال 24 ساعة',
      title_en: 'Buyer confirmed delivery — payout will be processed within 24h',
      title_zh: '买家已确认收货 — 款项将在24小时内处理',
      ref_id: requestId, is_read: false,
    });

    // Send payout email to supplier
    try {
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
      const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'payout_initiated',
          data: {
            recipientUserId: supplierId,
            name: supplierName || 'Supplier',
            amount: paymentData?.amount || 0,
            lang,
          },
        }),
      });
    } catch (e) { console.error('payout email error:', e); }

    loadMyRequests(); loadPendingActions();
    setReviewRating(0); setReviewComment('');
    setReviewModal({ supplierId, requestId, supplierName });
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewModal) return;
    const { data: existingReview } = await sb.from('reviews')
      .select('id')
      .eq('supplier_id', reviewModal.supplierId)
      .eq('buyer_id', user.id)
      .eq('request_id', reviewModal.requestId)
      .maybeSingle();
    if (existingReview) {
      setReviewModal(null);
      return;
    }
    setSubmittingReview(true);
    await sb.from('reviews').insert({
      supplier_id: reviewModal.supplierId, buyer_id: user.id,
      request_id: reviewModal.requestId, rating: reviewRating, comment: reviewComment || '',
    });
    const { data: reviews } = await sb.from('reviews').select('rating').eq('supplier_id', reviewModal.supplierId);
    if (reviews?.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await sb.from('profiles').update({ rating: avg, reviews_count: reviews.length }).eq('id', reviewModal.supplierId);
    }
    setSubmittingReview(false);
    setReviewModal(null);
    alert(isAr ? 'شكراً على تقييمك!' : 'Thank you for your review!');
  };

  const saveEditRequest = async () => {
    if (!editReqModal) return;
    setSavingEditReq(true);
    await sb.from('requests').update({
      title_ar: editReqForm.title_ar,
      title_en: editReqForm.title_en,
      desc_ar: editReqForm.desc_ar,
      quantity: editReqForm.quantity,
    }).eq('id', editReqModal.id);
    setSavingEditReq(false);
    setEditReqModal(null);
    loadMyRequests();
  };

  const deleteRequest = async (r) => {
    if (r.status !== 'open') {
      alert(isAr ? 'لا يمكن حذف طلب غير مفتوح' : 'Can only delete open requests');
      return;
    }
    const pendingOffers = (r.offers || []).filter(o => o.status === 'pending');
    if (pendingOffers.length > 0) {
      const confirmed = window.confirm(isAr
        ? `يوجد ${pendingOffers.length} عرض على هذا الطلب. هل تريد حذفه وإلغاء كل العروض؟`
        : `There are ${pendingOffers.length} offer(s) on this request. Delete and cancel all offers?`);
      if (!confirmed) return;
      // Notify suppliers
      await Promise.all(pendingOffers.map(o =>
        sb.from('notifications').insert({ user_id: o.supplier_id, type: 'request_deleted', title_ar: `تم حذف الطلب: ${r.title_ar || r.title_en}`, title_en: `Request deleted: ${r.title_en || r.title_ar}`, title_zh: `需求已删除`, ref_id: r.id, is_read: false })
      ));
    } else {
      if (!window.confirm(isAr ? 'هل تريد حذف هذا الطلب؟' : 'Delete this request?')) return;
    }
    await sb.from('requests').delete().eq('id', r.id);
    loadMyRequests(); loadPendingActions(); loadStats();
  };

  const cancelRequest = async (r) => {
    const acceptedOffer = r.offers.find(o => o.status === 'accepted');
    await sb.from('requests').update({ status: 'open' }).eq('id', r.id);
    if (acceptedOffer) {
      await sb.from('offers').update({ status: 'rejected' }).eq('id', acceptedOffer.id);
      const reqNameAr = r.title_ar || r.title_en || '';
      const reqNameEn = r.title_en || r.title_ar || '';
      await sb.from('notifications').insert({
        user_id: acceptedOffer.supplier_id,
        type: 'request_cancelled',
        title_ar: `قام التاجر بإلغاء الطلب: ${reqNameAr}`,
        title_en: `The trader has cancelled the request: ${reqNameEn}`,
        title_zh: `采购商已取消请求: ${reqNameEn}`,
        ref_id: r.id,
        is_read: false,
      });
      await sb.from('messages').insert({
        sender_id: user.id,
        receiver_id: acceptedOffer.supplier_id,
        content: `The trader has cancelled the request: ${reqNameEn}`,
        is_read: false,
      });
    }
    setCancelConfirmReq(null);
    setMyRequests(prev => prev.map(req =>
      req.id !== r.id ? req : {
        ...req,
        status: 'open',
        offers: req.offers.map(o => o.status === 'accepted' ? { ...o, status: 'rejected' } : o),
      }
    ));
  };

  const name = profile?.full_name || user?.email?.split('@')[0];

  const tabs = [
    { id: 'overview',  label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'requests',  label: isAr ? 'طلباتي'    : 'My Requests' },
    { id: 'samples',   label: isAr ? 'العينات'   : 'Samples' },
    { id: 'product-inquiries', label: isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries', badge: stats.productInquiries > 0 ? stats.productInquiries : null },
    { id: 'messages',  label: isAr ? 'الرسائل'   : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
    { id: 'settings',  label: isAr ? 'الإعدادات' : 'Settings' },
  ];

  /* ── shared section style ── */
  const section = { animation: 'fadeIn 0.35s ease' };

  return (
    <div className="dashboard-wrap">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div className="dash-header-pad" style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Label */}
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20, fontWeight: 500 }}>
          {isAr ? 'مَعبر · لوحة التاجر' : 'Maabar · Trader Dashboard'}
        </p>

        {/* Name */}
        <h1 style={{
          fontSize: isAr ? 36 : 42,
          fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          color: 'var(--text-primary)',
          letterSpacing: isAr ? 0 : -1,
          lineHeight: 1.2,
          marginBottom: 10,
        }}>
          {isAr ? `أهلاً، ${name}` : `Welcome, ${name}`}
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-tertiary)',
          marginBottom: 36, lineHeight: 1.7,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          maxWidth: 420,
        }}>
          {isAr ? 'تابع طلباتك وعروضك ورسائلك من مكان واحد' : 'Track your requests, offers and messages in one place'}
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px',
              background: 'none', border: 'none',
              borderBottom: activeTab === t.id
                ? '1px solid var(--text-primary)'
                : '1px solid transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-disabled)',
              fontSize: 11, cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              letterSpacing: 1.5, textTransform: 'uppercase',
              minHeight: 44,
            }}>
              {t.label}
              {t.badge && (
                <span style={{
                  position: 'absolute', top: 6,
                  right: isAr ? 'auto' : 2, left: isAr ? 2 : 'auto',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-secondary)',
                  fontSize: 8, fontWeight: 700, borderRadius: '50%',
                  width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT
      ══════════════════════════════════════ */}
      <div style={{ background: 'var(--bg-base)', minHeight: 'calc(var(--app-dvh) - 280px)' }}>
        <div className="dash-content">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={section}>

              {/* Pending actions */}
              {pendingActions.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>
                    {isAr ? `يحتاج انتباهك (${pendingActions.length})` : `Needs Attention (${pendingActions.length})`}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {pendingActions.map((action, i) => (
                      <div key={i} onClick={() => setActiveTab(['messages'].includes(action.type) ? 'messages' : 'requests')} style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '14px 20px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', transition: 'all 0.15s', gap: 12,
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.borderColor = 'var(--border-muted)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {action.type === 'offers'       && (isAr ? `${action.count} عرض ينتظر مراجعتك — ${action.request?.title_ar || action.request?.title_en}` : `${action.count} offer(s) waiting — ${action.request?.title_en || action.request?.title_ar}`)}
                            {action.type === 'managed_shortlist' && (isAr ? `العروض المختارة لك جاهزة — ${action.request?.title_ar || action.request?.title_en}` : `Selected offers are ready — ${action.request?.title_en || action.request?.title_ar}`)}
                            {action.type === 'payment_sent'   && (isAr ? 'تم الدفع — في انتظار تجهيز المورد' : 'Payment sent — Awaiting preparation')}
                            {action.type === 'ready_to_ship'  && (isAr ? `شحنتك جاهزة — ادفع الدفعة الثانية` : `Shipment ready — Pay second installment`)}
                            {action.type === 'delivery'     && (isAr ? `تأكيد استلام — ${action.request?.title_ar || action.request?.title_en}` : `Confirm delivery — ${action.request?.title_en || action.request?.title_ar}`)}
                            {action.type === 'messages'     && (isAr ? `${action.count} رسالة غير مقروءة` : `${action.count} unread message(s)`)}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>
                            {action.type === 'offers'       && (isAr ? 'قارن العروض واختر الأفضل' : 'Compare and choose the best')}
                            {action.type === 'managed_shortlist' && (isAr ? 'راجع العروض المختارة لك من نفس الطلب' : 'Review the selected offers inside the same request')}
                            {action.type === 'payment_sent'   && (isAr ? 'المورد يجهز شحنتك' : 'Supplier is preparing your order')}
                            {action.type === 'ready_to_ship'  && (isAr ? 'اضغط للدفع وإتمام الشحن' : 'Tap to pay and complete shipping')}
                            {action.type === 'delivery'     && (isAr ? 'الطلب وصل — أكد الاستلام' : 'Order arrived — confirm receipt')}
                            {action.type === 'messages'     && (isAr ? 'اضغط للاطلاع' : 'Tap to view')}
                          </p>
                        </div>
                        <span style={{ color: 'var(--text-disabled)', fontSize: 14 }}>{isAr ? '←' : '→'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>
                  {isAr ? 'الإحصائيات' : 'Overview'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <StatCard label={isAr ? 'طلبات مرفوعة' : 'Requests Posted'}  value={stats.requests} onClick={() => setActiveTab('requests')} />
                  <StatCard label={isAr ? 'عروض مستلمة'  : 'Offers Received'}  value={stats.offers}   onClick={() => setActiveTab('requests')} highlight={stats.offers > 0} />
                  <StatCard label={isAr ? 'رسائل جديدة'  : 'New Messages'}     value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
              </div>

              {/* Quick actions */}
              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>
                  {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <QuickAction title={isAr ? 'تصفح المنتجات' : 'Browse Products'} sub={isAr ? 'استكشف منتجات الموردين الصينيين' : 'Explore Chinese supplier products'} onClick={() => nav('/products')} primary isAr={isAr} />
                  <QuickAction title={isAr ? 'رفع طلب قياسي'  : 'Post Standard RFQ'} sub={isAr ? 'لمنتج واضح وتحتاج عروض مباشرة' : 'For a known product and direct offers'} onClick={() => nav('/requests')} isAr={isAr} />
                  <QuickAction title={isAr ? 'Private Label / Custom' : 'Private Label / Custom'} sub={isAr ? 'إذا تحتاج تصنيع خاص أو علامة خاصة' : 'For OEM, ODM, or custom manufacturing'} onClick={() => nav('/requests?flow=custom')} isAr={isAr} />
                  <QuickAction title={isAr ? 'طلباتي'         : 'My Requests'} sub={isAr ? 'تابع الطلبات، العروض، والدفع' : 'Track requests, offers, and payment steps'} onClick={() => setActiveTab('requests')} isAr={isAr} />
                </div>
              </div>

              <button onClick={() => nav('/')} style={{
                background: 'none', border: 'none',
                color: 'var(--text-disabled)', fontSize: 11,
                cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
                padding: 0, transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
                {isAr ? 'العودة للرئيسية ←' : '← Back to Home'}
              </button>
            </div>
          )}

          {/* ── MY REQUESTS ── */}
          {activeTab === 'requests' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
                <h2 style={{
                  fontSize: isAr ? 28 : 34, fontWeight: 300,
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5,
                }}>
                  {isAr ? 'طلباتي' : 'My Requests'}
                </h2>
                <button className="btn-dark-sm" onClick={() => nav('/requests')}
                  style={{ fontSize: 11, letterSpacing: 1, minHeight: 36 }}>
                  {isAr ? '+ طلب جديد' : '+ New Request'}
                </button>
              </div>

              {/* Loading skeleton */}
              {loadingRequests && [1, 2].map(i => (
                <div key={i} style={{ borderTop: '1px solid var(--border-subtle)', padding: '28px 0' }}>
                  <div style={{ width: '45%', height: 16, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }} />
                  <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}

              {/* Empty */}
              {!loadingRequests && myRequests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-disabled)', marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'ما عندك طلبات بعد' : 'No requests yet'}
                  </p>
                  <button className="btn-dark-sm" onClick={() => nav('/requests')} style={{ minHeight: 40 }}>
                    {isAr ? 'ارفع أول طلب' : 'Post First Request'}
                  </button>
                </div>
              )}

              {/* Requests list */}
              {!loadingRequests && myRequests.map((r, idx) => {
                const managed = isManagedRequest(r);
                const pendingOffers = r.offers.filter(o => o.status === 'pending');
                const acceptedOffer = r.offers.find(o => o.status === 'accepted');
                const offerTotals = r.offers.map(o => getOfferEstimatedTotal(o, r)).filter(Number.isFinite);
                const lowestOfferTotal = offerTotals.length > 0 ? Math.min(...offerTotals) : null;
                const fastestOffer = r.offers.reduce((best, current) => {
                  if (!best) return current;
                  if ((parseInt(current.delivery_days, 10) || Infinity) < (parseInt(best.delivery_days, 10) || Infinity)) return current;
                  return best;
                }, null);
                const isFocusedRequest = String(focusedRequestId || '') === String(r.id);
                const nextStepCopy = (() => {
                  if (managed) {
                    if ((r.managedShortlist || []).length > 0 || String(r.managed_status || '') === 'shortlist_ready') {
                      return {
                        title: isAr ? 'الخطوة التالية: راجع العروض المختارة لك' : 'Next step: review your selected offers',
                        body: isAr ? 'كل قرار في هذا الطلب المُدار يتم من نفس الصفحة: اختر العرض المناسب، اطلب تفاوضاً إضافياً، أو اطلب من معبر أن يعيد البحث.' : 'Every decision for this managed request stays in the same page: choose the right offer, ask for more negotiation, or ask Maabar to search again.',
                      };
                    }
                    return {
                      title: isAr ? 'الطلب الآن داخل المسار المُدار' : 'This request is now inside the managed flow',
                      body: isAr ? 'معبر يجهّز الـ brief، يراجع الوضوح، ويطابق الموردين المناسبين فقط قبل إظهار أفضل 3 عروض لك هنا.' : 'Maabar is preparing the brief, reviewing clarity, and matching only suitable suppliers before showing your top 3 here.',
                    };
                  }
                  if (acceptedOffer && !['paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'].includes(r.status)) {
                    return {
                      title: isAr ? 'الخطوة التالية: راجع العرض المقبول وادفع بأمان داخل مَعبر' : 'Next step: review the accepted offer and pay securely on Maabar',
                      body: isAr ? 'تم حسم قرار التوريد. الآن أكمل الدفع من نفس الطلب حتى يبقى السجل التجاري واضحاً للطرفين.' : 'Supplier selection is done. Complete checkout from this request so payment and execution stay on one clear record.',
                    };
                  }
                  if (r.status === 'ready_to_ship' && r.payment_second > 0) {
                    return {
                      title: isAr ? 'الخطوة التالية: ادفع الدفعة الثانية قبل إصدار الشحنة' : 'Next step: pay the second installment before shipment release',
                      body: isAr ? 'المورد أكد جاهزية الشحنة. أكمل الدفعة المتبقية من هذا الطلب حتى يبدأ الشحن.' : 'The supplier confirmed shipment readiness. Complete the remaining balance here to release shipping.',
                    };
                  }
                  if (r.status === 'shipping') {
                    return {
                      title: isAr ? 'الخطوة التالية: تابع التتبع ثم أكد وصول الشحنة للسعودية' : 'Next step: follow tracking, then confirm arrival in KSA',
                      body: isAr ? 'بمجرد وصول الشحنة يمكنك تحديث الحالة ثم تأكيد الاستلام لاحقاً.' : 'Once the shipment arrives, update the status here and confirm final delivery afterwards.',
                    };
                  }
                  if (r.status === 'arrived') {
                    return {
                      title: isAr ? 'الخطوة التالية: أكد الاستلام لإغلاق الصفقة' : 'Next step: confirm delivery to close the deal',
                      body: isAr ? 'إذا استلمت البضاعة كما هو متفق عليه، أكد الاستلام من هذا الطلب.' : 'If the goods arrived as agreed, confirm delivery from this request.',
                    };
                  }
                  if (pendingOffers.length > 0) {
                    return {
                      title: isAr ? `الخطوة التالية: قارن ${pendingOffers.length} عرض${pendingOffers.length > 1 ? 'اً' : ''} واختر الأنسب` : `Next step: compare ${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} and pick the best fit`,
                      body: isAr ? 'راجع الإجمالي، مدة التجهيز، وطريقة الشحن قبل قبول العرض.' : 'Review total cost, lead time, and shipping method before accepting an offer.',
                    };
                  }
                  if (r.offers.length > 0) {
                    return {
                      title: isAr ? 'العروض موجودة داخل هذا الطلب' : 'Offers are already attached to this request',
                      body: isAr ? 'كل قرار لاحق — قبول، دفع، متابعة، أو استلام — يتم من نفس البطاقة.' : 'Every next decision — accept, pay, track, or confirm receipt — stays inside this same card.',
                    };
                  }
                  return null;
                })();

                return (
                <div key={r.id} data-request-id={r.id} style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '28px 0',
                  animation: `fadeIn 0.35s ease ${idx * 0.04}s both`,
                  scrollMarginTop: 110,
                  background: isFocusedRequest ? 'var(--bg-subtle)' : 'transparent',
                  boxShadow: isFocusedRequest ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                  borderRadius: isFocusedRequest ? 'var(--radius-lg)' : 0,
                }}>
                  {/* Title + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{
                      fontSize: 17, fontWeight: 500,
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                      color: 'var(--text-primary)',
                    }}>
                      {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                    </h3>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
                        {managed ? (isAr ? 'طلب مُدار' : 'Managed request') : (isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status)}
                      </span>
                      {r.status === 'open' && (
                        <>
                          <button
                            onClick={() => { setEditReqModal(r); setEditReqForm({ title_ar: r.title_ar || '', title_en: r.title_en || '', desc_ar: r.desc_ar || '', quantity: r.quantity || '' }); }}
                            className="btn-outline"
                            style={{ padding: '3px 8px', fontSize: 10, minHeight: 24 }}>
                            {isAr ? 'تعديل' : 'Edit'}
                          </button>
                          <button
                            onClick={() => deleteRequest(r)}
                            style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                            {isAr ? 'حذف' : 'Delete'}
                          </button>
                        </>
                      )}
                      {r.status === 'closed' && (
                        <>
                          <button
                            onClick={() => {
                              const accepted = r.offers.find(o => o.status === 'accepted');
                              if (accepted) nav(`/chat/${accepted.supplier_id}`);
                            }}
                            className="btn-outline"
                            style={{ padding: '3px 8px', fontSize: 10, minHeight: 24 }}>
                            {isAr ? 'محادثة المورد' : 'Chat with Supplier'}
                          </button>
                          <button
                            onClick={() => setCancelConfirmReq(r)}
                            style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                            {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
                          </button>
                        </>
                      )}
                      {['paid','ready_to_ship','shipping','arrived','delivered'].includes(r.status) && (
                        <a href={`mailto:support@maabar.io?subject=${encodeURIComponent((isAr ? 'مشكلة في طلب: ' : 'Issue with order: ') + (r.title_ar || r.title_en || r.id))}&body=${encodeURIComponent((isAr ? 'رقم الطلب: ' : 'Order ID: ') + r.id)}`}
                          style={{ fontSize: 11, color: '#a07070', textDecoration: 'none', border: '1px solid rgba(138,58,58,0.25)', padding: '3px 10px', borderRadius: 'var(--radius-md)', display: 'inline-block', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? '⚠ إبلاغ عن مشكلة' : '⚠ Report Issue'}
                        </a>
                      )}
                    </div>
                  </div>

                  {!managed && <StatusBar status={r.shipping_status || r.status} isAr={isAr} />}

                  {nextStepCopy && (
                    <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg-subtle)' }}>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {nextStepCopy.title}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {nextStepCopy.body}
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {isAr ? 'الكمية' : 'Qty'}: {r.quantity || '—'}
                    </span>
                    <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {managed ? (isAr ? 'طلب مُدار' : 'Managed request') : `${isAr ? 'العروض' : 'Offers'}: ${r.offers.length}`}
                    </span>
                    {managed && (
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {isAr ? 'العروض المختارة لك' : 'Selected offers for you'}: {(r.managedShortlist || []).length}
                      </span>
                    )}
                    {!managed && lowestOfferTotal !== null && (
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                        {isAr ? 'أفضل إجمالي' : 'Best total'}: {lowestOfferTotal.toFixed(2)} USD
                      </span>
                    )}
                    {!managed && fastestOffer?.delivery_days && (
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                        {isAr ? 'أسرع تجهيز' : 'Fastest lead time'}: {fastestOffer.delivery_days}{isAr ? ' يوم' : lang === 'zh' ? ' 天' : 'd'}
                      </span>
                    )}
                    {!managed && acceptedOffer?.profiles?.company_name && (
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        {isAr ? 'المورد المختار' : 'Selected supplier'}: {acceptedOffer.profiles.company_name}
                      </span>
                    )}
                    {isFocusedRequest && (
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                        {isAr ? 'آخر طلب تم إنشاؤه' : 'Recently created request'}
                      </span>
                    )}
                  </div>

                  {managed && (
                    <ManagedBuyerRequestPanel
                      request={r}
                      lang={lang}
                      onChooseOffer={chooseManagedOffer}
                      onRequestNegotiation={requestManagedNegotiation}
                      onRejectOffer={rejectManagedOffer}
                      onRestartSearch={restartManagedSearch}
                    />
                  )}

                  {/* Tracking */}
                  {!managed && r.tracking_number && (
                    <div style={{
                      marginBottom: 16, padding: '10px 16px',
                      background: 'var(--bg-raised)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: r.estimated_delivery ? 6 : 0 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {r.shipping_company && (
                            <span style={{ marginInlineEnd: 6, fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{r.shipping_company} ·</span>
                          )}
                          {isAr ? 'رقم التتبع: ' : 'Tracking: '}
                          <strong style={{ color: 'var(--text-primary)' }}>{r.tracking_number}</strong>
                        </span>
                        <a href={getTrackingUrl(r.shipping_company, r.tracking_number)} target="_blank" rel="noreferrer" style={{
                          fontSize: 10, color: 'var(--text-secondary)',
                          letterSpacing: 1.5, textTransform: 'uppercase',
                          textDecoration: 'none', transition: 'color 0.15s',
                        }}>
                          {isAr ? 'تتبع ←' : 'Track →'}
                        </a>
                      </div>
                      {r.estimated_delivery && (
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>
                          {isAr ? 'التسليم المتوقع: ' : 'Expected delivery: '}
                          {new Date(r.estimated_delivery).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Offers grid */}
                  {!managed && r.offers.length > 0 && (
                    <div>
                      {r.offers.length > 1 && (
                        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
                          {isAr ? `${r.offers.length} عروض — قارن واختر` : `${r.offers.length} Offers — Compare & Choose`}
                        </p>
                      )}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min(r.offers.length, 3)}, 1fr)`,
                        gap: 1,
                        background: 'var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                      }}>
                        {r.offers.map(o => {
                          const offerEstimatedTotal = getOfferEstimatedTotal(o, r);
                          const lowestOfferTotal = Math.min(...r.offers.map(x => getOfferEstimatedTotal(x, r)));

                          return (
                          <div key={o.id} style={{
                            background: o.status === 'accepted' ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                            padding: '18px 16px',
                            position: 'relative',
                          }}>
                            {r.offers.length > 1 && offerEstimatedTotal === lowestOfferTotal && (
                              <span style={{
                                position: 'absolute', top: 10,
                                insetInlineEnd: 10,
                                fontSize: 9, padding: '2px 8px',
                                background: 'rgba(58,122,82,0.12)',
                                border: '1px solid rgba(58,122,82,0.2)',
                                color: '#5a9a72', borderRadius: 20,
                              }}>
                                {isAr ? 'الأقل إجمالاً' : lang === 'zh' ? '总价最低' : 'Lowest Total'}
                              </span>
                            )}
                            {(() => {
                              const supplierTrustSignals = buildSupplierTrustSignals(o.profiles || {});
                              const isReviewedSupplier = isSupplierPubliclyVisible(o.profiles?.status);
                              const supplierMaabarId = getSupplierMaabarId(o.profiles || {});

                              return (
                                <>
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                      <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 0, fontWeight: 500 }}>
                                        {o.profiles?.company_name || '—'}
                                      </p>
                                      {isReviewedSupplier && (
                                        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>
                                          ✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
                                        </span>
                                      )}
                                    </div>
                                    {o.profiles?.rating > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span style={{ color: '#a08050', fontSize: 11 }}>{'★'.repeat(Math.round(o.profiles.rating))}{'☆'.repeat(5 - Math.round(o.profiles.rating))}</span>
                                        <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{o.profiles.rating.toFixed(1)} ({o.profiles.reviews_count || 0})</span>
                                      </div>
                                    )}
                                    {(supplierMaabarId || o.profiles?.city || o.profiles?.country || o.profiles?.years_experience) && (
                                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', lineHeight: 1.6, marginBottom: 0 }}>
                                        {supplierMaabarId ? `${isAr ? 'معرّف المورد' : lang === 'zh' ? '供应商编号' : 'Supplier ID'}: ${supplierMaabarId}` : ''}
                                        {supplierMaabarId && (o.profiles?.city || o.profiles?.country) ? ' · ' : ''}
                                        {[o.profiles?.city, o.profiles?.country].filter(Boolean).join(', ')}
                                        {(supplierMaabarId || o.profiles?.city || o.profiles?.country) && o.profiles?.years_experience ? ' · ' : ''}
                                        {o.profiles?.years_experience ? (isAr ? `${o.profiles.years_experience} سنة خبرة` : lang === 'zh' ? `${o.profiles.years_experience} 年经验` : `${o.profiles.years_experience} years`) : ''}
                                      </p>
                                    )}
                                  </div>

                                  {supplierTrustSignals.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                      {supplierTrustSignals.includes('trade_profile_available') && (
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                                          {isAr ? 'رابط شركة' : lang === 'zh' ? '店铺链接' : 'Trade link'}
                                        </span>
                                      )}
                                      {supplierTrustSignals.includes('wechat_available') && (
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                                          WeChat
                                        </span>
                                      )}
                                      {supplierTrustSignals.includes('factory_media_available') && (
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                          {isAr ? 'صور مصنع' : lang === 'zh' ? '工厂图片' : 'Factory photos'}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                                    <p style={{ fontSize: 24, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
                                      {o.price} <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>USD</span>
                                    </p>
                                    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                                      {isAr ? 'سعر الوحدة' : lang === 'zh' ? '产品单价' : 'Unit price'}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                      {isAr ? 'تكلفة المنتجات' : lang === 'zh' ? '产品合计' : 'Products total'}: {getOfferProductSubtotal(o, r).toFixed(2)} USD
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                      {isAr ? 'الشحن' : lang === 'zh' ? '运费' : 'Shipping'}: {hasOfferShippingCost(o) ? `${getOfferShippingCost(o).toFixed(2)} USD` : (isAr ? 'غير محدد بشكل منفصل' : lang === 'zh' ? '未单独填写' : 'Not specified separately')}
                                    </p>
                                    {getOfferShippingMethod(o) && (
                                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        {isAr ? 'طريقة الشحن' : lang === 'zh' ? '运输方式' : 'Shipping method'}: {getOfferShippingMethod(o)}
                                      </p>
                                    )}
                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                                      {isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Estimated total'}: {offerEstimatedTotal.toFixed(2)} USD
                                    </p>
                                    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                                      MOQ: {o.moq} · {o.delivery_days} {isAr ? 'يوم' : lang === 'zh' ? '天' : 'd'}{o.origin ? ` · ${isAr ? 'المنشأ' : lang === 'zh' ? '原产地' : 'Origin'}: ${o.origin}` : ''}
                                    </p>
                                  </div>

                                  {o.note && (
                                    <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
                                        {isAr ? 'ملاحظة تجارية' : lang === 'zh' ? '商务备注' : 'Commercial note'}
                                      </p>
                                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                        {o.note}
                                      </p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            {o.status === 'pending' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button onClick={() => acceptOffer(o.id, o.supplier_id, r.id)} className="btn-primary"
                                  style={{ padding: '8px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                  {isAr ? 'قبول' : lang === 'zh' ? '接受报价' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => rejectOffer(o.id, o.supplier_id, r.id)}
                                  style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '7px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 34, width: '100%' }}>
                                  {isAr ? 'رفض' : lang === 'zh' ? '拒绝' : 'Reject'}
                                </button>
                                <button onClick={() => nav(`/supplier/${o.supplier_id}`)} className="btn-outline"
                                  style={{ padding: '7px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                  {isAr ? 'ملف المورد' : lang === 'zh' ? '供应商主页' : 'Supplier Profile'}
                                </button>
                                <button onClick={() => nav(`/chat/${o.supplier_id}`)} className="btn-outline"
                                  style={{ padding: '7px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                  {isAr ? 'تواصل' : lang === 'zh' ? '联系' : 'Chat'}
                                </button>
                              </div>
                            )}

                            {o.status === 'accepted' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {!['paid','ready_to_ship','shipping','arrived','delivered'].includes(r.status) && (
                                  <>
                                    <button onClick={() => nav('/checkout', { state: { offer: o, request: r } })} className="btn-primary"
                                      style={{ padding: '9px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 36 }}>
                                      {isAr ? 'ادفع الآن' : 'Pay Now'}
                                    </button>
                                    <button
                                      onClick={() => setCancelConfirmReq(r)}
                                      style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '8px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 34, width: '100%' }}>
                                      {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
                                    </button>
                                  </>
                                )}
                                {r.status === 'paid' && (
                                  <p style={{ fontSize: 10, letterSpacing: 1, color: 'var(--text-disabled)', textAlign: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                    {isAr ? 'تم الدفع — في انتظار تجهيز المورد' : 'Paid — Awaiting preparation'}
                                  </p>
                                )}
                                {r.status === 'ready_to_ship' && (
                                  <div style={{ padding: '12px 12px', background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5 }}>
                                      {isAr ? 'شحنتك جاهزة — ادفع الدفعة الثانية لإتمام الشحن' : 'Shipment ready — Pay second installment to ship'}
                                    </p>
                                    {r.payment_second > 0 && (
                                      <button
                                        className="btn-primary"
                                        style={{ padding: '8px', fontSize: 11, width: '100%', minHeight: 34, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                                        onClick={() => nav('/checkout', { state: { offer: o, request: r, isSecondPayment: true } })}>
                                        {isAr ? `ادفع ${r.payment_second} ${o.currency || 'USD'}` : `Pay ${r.payment_second} ${o.currency || 'USD'}`}
                                      </button>
                                    )}
                                  </div>
                                )}
                                {r.status === 'shipping' && (
                                  <>
                                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                      {isAr ? 'في الطريق' : 'On the way'}
                                    </p>
                                    <button onClick={async () => {
                                      await sb.from('requests').update({ status: 'arrived', shipping_status: 'arrived' }).eq('id', r.id);
                                      loadMyRequests();
                                    }} className="btn-outline"
                                      style={{ padding: '8px', fontSize: 11, width: '100%', minHeight: 34, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                      {isAr ? 'وصلت السعودية' : 'Arrived in KSA'}
                                    </button>
                                  </>
                                )}
                                {r.status === 'arrived' && (
                                  <>
                                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                      {isAr ? 'وصلت — أكد الاستلام' : 'Arrived — Confirm receipt'}
                                    </p>
                                    <button onClick={() => confirmDelivery(r.id, o.supplier_id, o.profiles?.company_name)} className="btn-primary"
                                      style={{ padding: '8px', fontSize: 11, width: '100%', minHeight: 34 }}>
                                      {isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                                    </button>
                                  </>
                                )}
                                {r.status === 'delivered' && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <p style={{ fontSize: 10, letterSpacing: 1, color: '#5a9a72', textAlign: 'center' }}>
                                      {isAr ? 'تم التسليم ✓' : lang === 'zh' ? '已交付 ✓' : 'Delivered ✓'}
                                    </p>
                                    <button onClick={() => setReviewModal({ supplierId: o.supplier_id, requestId: r.id, supplierName: o.profiles?.company_name || '' })}
                                      className="btn-outline" style={{ padding: '6px', fontSize: 10, width: '100%', minHeight: 28 }}>
                                      {isAr ? 'قيّم المورد' : lang === 'zh' ? '评价供应商' : 'Rate Supplier'}
                                    </button>
                                  </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6, marginTop: 2 }}>
                                  <button onClick={() => nav(`/supplier/${o.supplier_id}`)} className="btn-outline" style={{ padding: '7px', fontSize: 10, minHeight: 32 }}>
                                    {isAr ? 'ملف المورد' : lang === 'zh' ? '供应商主页' : 'Profile'}
                                  </button>
                                  <button onClick={() => nav(`/chat/${o.supplier_id}`)} className="btn-outline" style={{ padding: '7px', fontSize: 10, minHeight: 32 }}>
                                    {isAr ? 'تواصل' : lang === 'zh' ? '联系' : 'Chat'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {o.status === 'rejected' && (
                              <p style={{ fontSize: 10, letterSpacing: 1, color: '#a07070', textAlign: 'center' }}>
                                {isAr ? 'مرفوض' : 'Rejected'}
                              </p>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {!managed && r.offers.length === 0 && (
                    <p style={{ color: 'var(--text-disabled)', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'لا توجد عروض بعد' : 'No offers yet'}
                    </p>
                  )}
                </div>
              );
              })}
            </div>
          )}

          {/* ── SAMPLES ── */}
          {activeTab === 'samples' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلبات العينات' : 'Sample Requests'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? 'تابع حالة العينات وتواصل مع المورد بعد الموافقة.' : 'Track your sample requests and contact the supplier after approval.'}
              </p>

              {samples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا توجد طلبات عينات بعد' : 'No sample requests yet'}
                  </p>
                </div>
              ) : samples.map((s, idx) => {
                const supplierName = s.profiles?.company_name || s.profiles?.full_name || 'Supplier';
                const productName = s.products?.name_ar || s.products?.name_en || s.products?.name_zh || 'Product';
                const supplierTrustSignals = buildSupplierTrustSignals(s.profiles || {});
                const sampleSupplierMaabarId = getSupplierMaabarId(s.profiles || {});
                const isReviewedSupplier = isSupplierPubliclyVisible(s.profiles?.status);
                return (
                  <div key={s.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '18px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{productName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'المورد:' : lang === 'zh' ? '供应商：' : 'Supplier:'} {supplierName}</p>
                          {isReviewedSupplier && (
                            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>
                              ✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
                            </span>
                          )}
                        </div>
                        {(sampleSupplierMaabarId || s.profiles?.city || s.profiles?.country || s.profiles?.years_experience) && (
                          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 6, lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {sampleSupplierMaabarId ? `${isAr ? 'معرّف المورد' : lang === 'zh' ? '供应商编号' : 'Supplier ID'}: ${sampleSupplierMaabarId}` : ''}
                            {sampleSupplierMaabarId && (s.profiles?.city || s.profiles?.country) ? ' · ' : ''}
                            {[s.profiles?.city, s.profiles?.country].filter(Boolean).join(', ')}
                            {(sampleSupplierMaabarId || s.profiles?.city || s.profiles?.country) && s.profiles?.years_experience ? ' · ' : ''}
                            {s.profiles?.years_experience ? (isAr ? `${s.profiles.years_experience} سنة خبرة` : lang === 'zh' ? `${s.profiles.years_experience} 年经验` : `${s.profiles.years_experience} years`) : ''}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: s.status === 'approved' ? 'rgba(58,122,82,0.1)' : s.status === 'rejected' ? 'rgba(160,112,112,0.1)' : 'var(--bg-subtle)', color: s.status === 'approved' ? '#5a9a72' : s.status === 'rejected' ? '#a07070' : 'var(--text-secondary)' }}>
                        {s.status === 'approved' ? (isAr ? 'تمت الموافقة' : lang === 'zh' ? '已批准' : 'Approved') : s.status === 'rejected' ? (isAr ? 'مرفوضة' : lang === 'zh' ? '已拒绝' : 'Rejected') : (isAr ? 'قيد المراجعة' : lang === 'zh' ? '审核中' : 'Pending')}
                      </span>
                    </div>

                    {(supplierTrustSignals.length > 0 || s.profiles?.rating > 0) && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {s.profiles?.rating > 0 && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            ★ {s.profiles.rating.toFixed(1)}{s.profiles?.reviews_count ? ` · ${s.profiles.reviews_count}` : ''}
                          </span>
                        )}
                        {supplierTrustSignals.includes('trade_profile_available') && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                            {isAr ? 'رابط شركة' : lang === 'zh' ? '店铺链接' : 'Trade link'}
                          </span>
                        )}
                        {supplierTrustSignals.includes('wechat_available') && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                            WeChat
                          </span>
                        )}
                        {supplierTrustSignals.includes('factory_media_available') && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            {isAr ? 'صور مصنع' : lang === 'zh' ? '工厂图片' : 'Factory photos'}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      <span>{isAr ? 'الكمية:' : lang === 'zh' ? '数量：' : 'Qty:'} {s.quantity}</span>
                      <span>{isAr ? 'الإجمالي:' : lang === 'zh' ? '总额：' : 'Total:'} {s.total_price} SAR</span>
                    </div>
                    {s.notes && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>💬 {s.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {s.status === 'approved' && (
                        <button className="btn-primary" onClick={() => nav('/checkout', {
                          state: {
                            offer: {
                              id: s.id,
                              request_id: s.id,
                              supplier_id: s.supplier_id,
                              profiles: s.profiles || null,
                              price: (parseFloat(s.sample_price || 0) + parseFloat(s.shipping_price || 0)),
                              currency: 'SAR',
                              delivery_days: 14,
                              status: 'accepted',
                              isDirect: true,
                            },
                            request: {
                              id: s.id,
                              title_ar: `عينة: ${productName}`,
                              title_en: `Sample: ${productName}`,
                              quantity: s.quantity,
                              status: 'closed',
                              buyer_id: user.id,
                            },
                          }
                        })} style={{ minHeight: 34, fontSize: 11 }}>
                          {isAr ? `ادفع ${s.total_price} SAR` : lang === 'zh' ? `支付 ${s.total_price} SAR` : `Pay ${s.total_price} SAR`}
                        </button>
                      )}
                      <button className="btn-outline" onClick={() => nav(`/supplier/${s.supplier_id}`)} style={{ minHeight: 34, fontSize: 11 }}>
                        {isAr ? 'ملف المورد' : lang === 'zh' ? '供应商主页' : 'Supplier Profile'}
                      </button>
                      <button className="btn-outline" onClick={() => nav(`/chat/${s.supplier_id}`)} style={{ minHeight: 34, fontSize: 11 }}>
                        {isAr ? 'محادثة المورد' : lang === 'zh' ? '联系供应商' : 'Chat Supplier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PRODUCT INQUIRIES ── */}
          {activeTab === 'product-inquiries' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', maxWidth: 760 }}>
                {isAr
                  ? 'كل استفسار ترسله من صفحة المنتج يظهر هنا، وعندما يرد المورد ستشاهد الرد داخل النظام بالإضافة إلى وصوله على بريدك.'
                  : lang === 'zh'
                    ? '您从产品页发送的咨询都会显示在这里。供应商回复后，您可以在系统内看到完整记录，邮件也会同步送达。'
                    : 'Every inquiry you send from a product page appears here. When the supplier replies, you will see it inside the system and also receive it by email.'}
              </p>

              {productInquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا توجد استفسارات منتجات بعد' : lang === 'zh' ? '暂时没有产品咨询' : 'No product inquiries yet'}
                  </p>
                </div>
              ) : productInquiries.map((inquiry, idx) => {
                const supplierName = inquiry.profiles?.company_name || inquiry.profiles?.full_name || (isAr ? 'مورد' : lang === 'zh' ? '供应商' : 'Supplier');
                const productName = getProductInquiryProductName(inquiry.products, lang);
                const statusLabel = getProductInquiryStatusLabel(inquiry.status, lang, 'buyer');
                const replies = inquiry.product_inquiry_replies || [];
                return (
                  <div key={inquiry.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '22px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{productName}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 4 }}>{supplierName}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8, margin: 0, fontFamily: 'var(--font-ar)' }}>{inquiry.question_text}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAr ? 'flex-start' : 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', color: inquiry.status === 'answered' ? '#5a9a72' : 'var(--text-secondary)' }}>
                          {statusLabel}
                        </span>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: 0 }}>{new Date(inquiry.updated_at || inquiry.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
                      </div>
                    </div>

                    {replies.length === 0 ? (
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? 'بانتظار رد المورد.' : lang === 'zh' ? '等待供应商回复。' : 'Waiting for the supplier reply.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {replies.map((reply) => (
                          <div key={reply.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
                              {isAr ? 'رد المورد' : lang === 'zh' ? '供应商回复' : 'Supplier reply'}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      {inquiry.product_id && (
                        <button className="btn-outline" onClick={() => nav(`/products/${inquiry.product_id}`)}>
                          {isAr ? 'فتح المنتج' : lang === 'zh' ? '打开产品' : 'Open Product'}
                        </button>
                      )}
                      {inquiry.supplier_id && (
                        <button className="btn-outline" onClick={() => nav(`/chat/${inquiry.supplier_id}`)}>
                          {isAr ? 'محادثة المورد' : lang === 'zh' ? '联系供应商' : 'Chat Supplier'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === 'messages' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'الرسائل' : 'Messages'}
              </h2>

              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'ما عندك رسائل بعد' : 'No messages yet'}
                  </p>
                </div>
              ) : inbox.map((m, idx) => {
                const senderName = m.profiles?.company_name || m.profiles?.full_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 0', borderTop: '1px solid var(--border-subtle)',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                    animation: `fadeIn 0.35s ease ${idx * 0.04}s both`,
                    minHeight: 56,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div className="avatar">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{senderName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{m.content}</p>
                    </div>
                    {!m.is_read && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, opacity: 0.8 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'إعدادات الحساب' : 'Account Settings'}
              </h2>

              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-muted)',
                padding: '28px 32px',
                maxWidth: 560,
                borderRadius: 'var(--radius-xl)',
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                    <input className="form-input" value={settings.full_name} onChange={e => setSettings({ ...settings, full_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'رقم الجوال' : 'Phone'}</label>
                    <input className="form-input" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} placeholder="+966 5x xxx xxxx" dir="ltr" />
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'المدينة' : 'City'}</label>
                    <select className="form-input" value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })}>
                      <option value="">{isAr ? 'اختر مدينة' : 'Select city'}</option>
                      {(isAr ? CITIES_AR : CITIES_EN).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'اسم الشركة / النشاط' : 'Company / Business'}</label>
                    <input className="form-input" value={settings.company_name} onChange={e => setSettings({ ...settings, company_name: e.target.value })} placeholder={isAr ? 'اختياري' : 'Optional'} />
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'عملة العرض المفضلة' : lang === 'zh' ? '首选显示货币' : 'Preferred Display Currency'}</label>
                    <select className="form-input" value={settings.preferred_display_currency || 'USD'} onChange={e => setSettings({ ...settings, preferred_display_currency: e.target.value })}>
                      {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                    </select>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 8, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr
                    ? 'هذه للعملة المعروضة فقط أثناء التصفح. الدفع والعقود تبقى بعملة المنتج أو الصفقة الأصلية.'
                    : lang === 'zh'
                    ? '这只影响浏览时的显示货币。实际产品/交易货币保持原样。'
                    : 'This only changes browsing display prices. Product and transaction source currencies stay unchanged.'}
                </p>

                <button onClick={saveSettings} disabled={savingSettings} className="btn-primary"
                  style={{ padding: '11px 28px', fontSize: 13, marginTop: 8, minHeight: 44 }}>
                  {savingSettings ? '...' : isAr ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
                {settingsSaved && (
                  <p style={{ color: '#5a9a72', fontSize: 13, marginTop: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'تم حفظ التغييرات ✓' : 'Changes saved ✓'}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════
          REVIEW MODAL
      ══════════════════════════════════════ */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 400,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'تقييم المورد' : 'Rate Supplier'}
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>
              {isAr ? `كيف كانت تجربتك مع ${reviewModal.supplierName}؟` : `How was your experience with ${reviewModal.supplierName}?`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.7 }}>
              {isAr ? 'تقييمك يساعد التجار الآخرين على اختيار الموردين الموثوقين' : 'Your review helps other traders choose reliable suppliers'}
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} style={{
                  fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                  color: star <= reviewRating ? '#a08050' : 'var(--border-default)',
                  transition: 'all 0.15s',
                  transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)',
                }}>★</button>
              ))}
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'تعليق (اختياري)' : 'Comment (optional)'}</label>
              <textarea className="form-input" rows={3}
                style={{ resize: 'none', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder={isAr ? 'شاركنا تجربتك...' : 'Share your experience...'}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={submitReview} disabled={!reviewRating || submittingReview} className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44, opacity: !reviewRating ? 0.4 : 1 }}>
                {submittingReview ? '...' : isAr ? 'إرسال التقييم' : 'Submit Review'}
              </button>
              <button onClick={() => setReviewModal(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {isAr ? 'تخطي' : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT REQUEST MODAL
      ══════════════════════════════════════ */}
      {editReqModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 480,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'تعديل الطلب' : 'Edit Request'}
            </p>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'العنوان بالعربي' : 'Title (Arabic)'}</label>
                <input className="form-input" dir="rtl" value={editReqForm.title_ar}
                  onChange={e => setEditReqForm(f => ({ ...f, title_ar: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'العنوان بالإنجليزي' : 'Title (English)'}</label>
                <input className="form-input" dir="ltr" value={editReqForm.title_en}
                  onChange={e => setEditReqForm(f => ({ ...f, title_en: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'الوصف' : 'Description'}</label>
                <textarea className="form-input" rows={3} style={{ resize: 'none', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                  value={editReqForm.desc_ar}
                  onChange={e => setEditReqForm(f => ({ ...f, desc_ar: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'الكمية' : 'Quantity'}</label>
                <input className="form-input" value={editReqForm.quantity}
                  onChange={e => setEditReqForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEditRequest} disabled={savingEditReq} className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44 }}>
                {savingEditReq ? '...' : isAr ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
              <button onClick={() => setEditReqModal(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CANCEL REQUEST MODAL
      ══════════════════════════════════════ */}
      {cancelConfirmReq && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 400,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>
              {isAr
                ? (cancelConfirmReq.title_ar || cancelConfirmReq.title_en)
                : (cancelConfirmReq.title_en || cancelConfirmReq.title_ar)}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.7 }}>
              {isAr
                ? 'سيتم إلغاء الطلب وإعادته للحالة المفتوحة. هل تريد المتابعة؟'
                : 'This will cancel the accepted offer and re-open the request. Are you sure?'}
            </p>
            <p style={{ fontSize: 12, color: '#a07070', marginBottom: 20, padding: '10px 14px', background: 'rgba(138,58,58,0.08)', border: '1px solid rgba(138,58,58,0.2)', borderRadius: 'var(--radius-md)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>
              {isAr
                ? 'تنبيه: بمجرد إتمام الدفع، لا يمكن الإلغاء واسترداد المبلغ.'
                : 'Note: Once payment is made, the order cannot be cancelled or refunded.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => cancelRequest(cancelConfirmReq)}
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44, background: 'none', border: '1px solid rgba(138,58,58,0.4)', color: '#a07070', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
                {isAr ? 'نعم، إلغاء الطلب' : 'Yes, Cancel Request'}
              </button>
              <button onClick={() => setCancelConfirmReq(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {isAr ? 'رجوع' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} />
    </div>
  );
}