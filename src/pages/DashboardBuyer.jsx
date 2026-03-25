import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-emails';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
import Footer from '../components/Footer';

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
export default function DashboardBuyer({ user, profile, lang }) {
  const nav    = useNavigate();
  const isAr   = lang === 'ar';

  const [stats, setStats]                 = useState({ requests: 0, messages: 0, offers: 0 });
  const [myRequests, setMyRequests]       = useState([]);
  const [inbox, setInbox]                 = useState([]);
  const [activeTab, setActiveTab]         = useState('overview');
  const [pendingActions, setPendingActions] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

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
  const [settings, setSettings]         = useState({ full_name: '', phone: '', city: '', company_name: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    loadStats();
    loadPendingActions();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'requests') loadMyRequests();
    if (activeTab === 'messages') loadInbox();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  const loadStats = async () => {
    const [requests, messages, offers] = await Promise.all([
      sb.from('requests').select('id', { count: 'exact' }).eq('buyer_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      sb.from('offers').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);
    setStats({ requests: requests.count || 0, messages: messages.count || 0, offers: offers.count || 0 });
  };

  const loadPendingActions = async () => {
    const actions = [];
    const { data: reqs } = await sb.from('requests').select('*, offers(id,status)').eq('buyer_id', user.id);
    if (reqs) {
      reqs.forEach(r => {
        const pending = r.offers?.filter(o => o.status === 'pending') || [];
        if (pending.length > 0) actions.push({ type: 'offers', request: r, count: pending.length });
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
      const withOffers = await Promise.all(data.map(async r => {
        const { data: offers } = await sb.from('offers').select('*,profiles(company_name,rating,id)').eq('request_id', r.id);
        return { ...r, offers: offers || [] };
      }));
      setMyRequests(withOffers);
    }
    setLoadingRequests(false);
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, company_name)')
      .eq('receiver_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const seen = new Set();
      setInbox(data.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; }));
      await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
      setStats(s => ({ ...s, messages: 0 }));
    }
  };

  const loadSettings = async () => {
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (data) setSettings({ full_name: data.full_name || '', phone: data.phone || '', city: data.city || '', company_name: data.company_name || '' });
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await sb.from('profiles').update({
      full_name: settings.full_name, phone: settings.phone,
      city: settings.city, company_name: settings.company_name,
    }).eq('id', user.id);
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const acceptOffer = async (offerId, supplierId, requestId) => {
    // Get request title and all other pending offers before updating
    const { data: allOffers } = await sb.from('offers')
      .select('id,supplier_id,profiles(company_name,full_name)')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .neq('id', offerId);
    const { data: reqData } = await sb.from('requests').select('title_ar,title_en').eq('id', requestId).single();
    const reqTitle = reqData?.title_ar || reqData?.title_en || '';

    await sb.from('offers').update({ status: 'accepted' }).eq('id', offerId);
    await sb.from('requests').update({ status: 'closed' }).eq('id', requestId);
    await sb.from('offers').update({ status: 'rejected' }).eq('request_id', requestId).neq('id', offerId);
    await sb.from('notifications').insert({
      user_id: supplierId, type: 'offer_accepted',
      title_ar: 'تم قبول عرضك', title_en: 'Your offer has been accepted', title_zh: '您的报价已被接受',
      ref_id: offerId, is_read: false,
    });
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'offer_accepted', record: { supplier_id: supplierId, request_id: requestId } }),
      });
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
            body: JSON.stringify({ type: 'offer_rejected', record: { supplier_id: o.supplier_id, request_title: reqTitle } }),
          });
        } catch (e) { console.error('email error:', e); }
      }));
    }

    loadMyRequests(); loadPendingActions();
  };

  const confirmDelivery = async (requestId, supplierId, supplierName) => {
    await sb.from('requests').update({ status: 'delivered', shipping_status: 'delivered' }).eq('id', requestId);
    await sb.from('notifications').insert({
      user_id: supplierId, type: 'delivery_confirmed',
      title_ar: 'التاجر أكد الاستلام', title_en: 'Buyer confirmed delivery', title_zh: '买家已确认收货',
      ref_id: requestId, is_read: false,
    });
    loadMyRequests(); loadPendingActions();
    setReviewRating(0); setReviewComment('');
    setReviewModal({ supplierId, requestId, supplierName });
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewModal) return;
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
    if (!window.confirm(isAr ? 'هل تريد حذف هذا الطلب؟' : 'Delete this request?')) return;
    const { error } = await sb.from('requests').delete().eq('id', r.id);
    if (!error) {
      loadMyRequests(); loadPendingActions(); loadStats();
    }
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
      <div style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '48px 60px 0',
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
      <div style={{ background: 'var(--bg-base)', minHeight: 'calc(100vh - 280px)' }}>
        <div style={{ padding: '40px 60px', maxWidth: 960, margin: '0 auto' }}>

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
                            {action.type === 'payment_sent'   && (isAr ? 'تم الدفع — في انتظار تجهيز المورد' : 'Payment sent — Awaiting preparation')}
                            {action.type === 'ready_to_ship'  && (isAr ? `شحنتك جاهزة — ادفع الدفعة الثانية` : `Shipment ready — Pay second installment`)}
                            {action.type === 'delivery'     && (isAr ? `تأكيد استلام — ${action.request?.title_ar || action.request?.title_en}` : `Confirm delivery — ${action.request?.title_en || action.request?.title_ar}`)}
                            {action.type === 'messages'     && (isAr ? `${action.count} رسالة غير مقروءة` : `${action.count} unread message(s)`)}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>
                            {action.type === 'offers'       && (isAr ? 'قارن العروض واختر الأفضل' : 'Compare and choose the best')}
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <QuickAction title={isAr ? 'تصفح المنتجات' : 'Browse Products'} sub={isAr ? 'استكشف منتجات الموردين الصينيين' : 'Explore Chinese supplier products'} onClick={() => nav('/products')} primary isAr={isAr} />
                  <QuickAction title={isAr ? 'رفع طلب جديد'  : 'Post New Request'} sub={isAr ? 'اطلب منتجاً وانتظر عروض الموردين' : 'Request a product and get offers'}   onClick={() => nav('/requests')} isAr={isAr} />
                  <QuickAction title={isAr ? 'طلباتي'         : 'My Requests'}      sub={isAr ? 'تابع طلباتك الحالية'               : 'Track your current orders'}           onClick={() => setActiveTab('requests')} isAr={isAr} />
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
              {!loadingRequests && myRequests.map((r, idx) => (
                <div key={r.id} style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '28px 0',
                  animation: `fadeIn 0.35s ease ${idx * 0.04}s both`,
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
                        {isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status}
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
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: 0, lineHeight: 1.6 }}>
                          {isAr
                            ? 'لا يمكن إلغاء الطلب بعد إتمام الدفع. للمساعدة تواصل معنا على support@maabar.io'
                            : 'Cannot cancel after payment. Contact support@maabar.io for help'}
                        </p>
                      )}
                    </div>
                  </div>

                  <StatusBar status={r.shipping_status || r.status} isAr={isAr} />

                  <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginBottom: 16, letterSpacing: 0.3 }}>
                    {isAr ? 'الكمية:' : 'Qty:'} {r.quantity || '—'}
                  </p>

                  {/* Tracking */}
                  {r.tracking_number && (
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
                  {r.offers.length > 0 && (
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
                        {r.offers.map(o => (
                          <div key={o.id} style={{
                            background: o.status === 'accepted' ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                            padding: '18px 16px',
                            position: 'relative',
                          }}>
                            {r.offers.length > 1 && o.price === Math.min(...r.offers.map(x => x.price)) && (
                              <span style={{
                                position: 'absolute', top: 10,
                                insetInlineEnd: 10,
                                fontSize: 9, padding: '2px 8px',
                                background: 'rgba(58,122,82,0.12)',
                                border: '1px solid rgba(58,122,82,0.2)',
                                color: '#5a9a72', borderRadius: 20,
                              }}>
                                {isAr ? 'الأقل سعراً' : 'Lowest Price'}
                              </span>
                            )}
                            <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 8 }}>
                              {o.profiles?.company_name || '—'}
                            </p>
                            <p style={{ fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1, marginBottom: 4 }}>
                              {o.price} <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>SAR</span>
                            </p>
                            <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 14 }}>
                              MOQ: {o.moq} · {o.delivery_days} {isAr ? 'يوم' : 'd'}
                            </p>

                            {o.status === 'pending' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button onClick={() => acceptOffer(o.id, o.supplier_id, r.id)} className="btn-primary"
                                  style={{ padding: '8px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                  {isAr ? 'قبول' : 'Accept'}
                                </button>
                                <button onClick={() => nav(`/chat/${o.supplier_id}`)} className="btn-outline"
                                  style={{ padding: '7px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                  {isAr ? 'تواصل' : 'Chat'}
                                </button>
                              </div>
                            )}

                            {o.status === 'accepted' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {!['paid','ready_to_ship','shipping','arrived','delivered'].includes(r.status) && (
                                  <button onClick={() => nav('/checkout', { state: { offer: o, request: r } })} className="btn-primary"
                                    style={{ padding: '9px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 36 }}>
                                    {isAr ? 'ادفع الآن' : 'Pay Now'}
                                  </button>
                                )}
                                {r.status === 'paid' && (
                                  <p style={{ fontSize: 10, letterSpacing: 1, color: 'var(--text-disabled)', textAlign: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                    {isAr ? 'تم الدفع — في انتظار تجهيز المورد' : 'Paid — Awaiting preparation'}
                                  </p>
                                )}
                                {r.status === 'ready_to_ship' && (
                                  <div style={{ padding: '12px 12px', background: 'rgba(139,120,255,0.06)', border: '1px solid rgba(139,120,255,0.2)', borderRadius: 'var(--radius-md)' }}>
                                    <p style={{ fontSize: 11, color: 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5 }}>
                                      {isAr ? 'شحنتك جاهزة — ادفع الدفعة الثانية لإتمام الشحن' : 'Shipment ready — Pay second installment to ship'}
                                    </p>
                                    {r.payment_second > 0 && (
                                      <button
                                        className="btn-primary"
                                        style={{ padding: '8px', fontSize: 11, width: '100%', minHeight: 34, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                                        onClick={() => nav('/checkout', { state: { offer: o, request: r, isSecondPayment: true } })}>
                                        {isAr ? `ادفع ${r.payment_second} ريال` : `Pay ${r.payment_second} SAR`}
                                      </button>
                                    )}
                                  </div>
                                )}
                                {r.status === 'shipping' && (
                                  <>
                                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'center', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                      {isAr ? 'في الطريق' : 'On the way'}
                                    </p>
                                    <button onClick={() => confirmDelivery(r.id, o.supplier_id, o.profiles?.company_name)} className="btn-outline"
                                      style={{ padding: '8px', fontSize: 11, width: '100%', minHeight: 34 }}>
                                      {isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                                    </button>
                                  </>
                                )}
                                {r.status === 'delivered' && (
                                  <p style={{ fontSize: 10, letterSpacing: 1, color: '#5a9a72', textAlign: 'center' }}>
                                    {isAr ? 'تم التسليم' : 'Delivered'}
                                  </p>
                                )}
                              </div>
                            )}

                            {o.status === 'rejected' && (
                              <p style={{ fontSize: 10, letterSpacing: 1, color: '#a07070', textAlign: 'center' }}>
                                {isAr ? 'مرفوض' : 'Rejected'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.offers.length === 0 && (
                    <p style={{ color: 'var(--text-disabled)', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'لا توجد عروض بعد' : 'No offers yet'}
                    </p>
                  )}
                </div>
              ))}
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
                </div>

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