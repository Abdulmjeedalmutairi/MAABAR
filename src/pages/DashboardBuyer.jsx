import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const STATUS_AR = { open: 'مرفوع', offers_received: 'عروض وصلت', closed: 'عرض مقبول', shipping: 'قيد الشحن', arrived: 'وصل السعودية', delivered: 'تم التسليم' };
const STATUS_EN = { open: 'Posted', offers_received: 'Offers In', closed: 'Accepted', shipping: 'Shipping', arrived: 'Arrived', delivered: 'Delivered' };
const STATUS_STEPS = ['open', 'offers_received', 'closed', 'shipping', 'arrived', 'delivered'];
const OFFER_STATUS_AR = { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' };
const OFFER_STATUS_EN = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };

export default function DashboardBuyer({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [stats, setStats] = useState({ requests: 0, messages: 0, offers: 0 });
  const [myRequests, setMyRequests] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingActions, setPendingActions] = useState([]);

  useEffect(() => {
    const nav_ = document.querySelector('nav');
    if (nav_) nav_.classList.add('scrolled');
    return () => { if (nav_) nav_.classList.remove('scrolled'); };
  }, []);

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    loadStats();
    loadPendingActions();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'requests') loadMyRequests();
    if (activeTab === 'messages') loadInbox();
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
        const pendingOffers = r.offers?.filter(o => o.status === 'pending') || [];
        if (pendingOffers.length > 0) {
          actions.push({ type: 'offers', request: r, count: pendingOffers.length });
        }
        if (r.status === 'shipping') {
          actions.push({ type: 'delivery', request: r });
        }
      });
    }
    const { data: msgs } = await sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false);
    if (msgs?.length > 0) {
      actions.push({ type: 'messages', count: msgs.length });
    }
    setPendingActions(actions);
  };

  const loadMyRequests = async () => {
    const { data } = await sb.from('requests').select('*').eq('buyer_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const withOffers = await Promise.all(data.map(async r => {
        const { data: offers } = await sb.from('offers').select('*,profiles(company_name,rating)').eq('request_id', r.id);
        return { ...r, offers: offers || [] };
      }));
      setMyRequests(withOffers);
    }
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages')
      .select('*, profiles!messages_sender_id_fkey(full_name, company_name)')
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      const seen = new Set();
      const unique = data.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; });
      setInbox(unique);
      await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
      setStats(s => ({ ...s, messages: 0 }));
    }
  };

  const acceptOffer = async (offerId, supplierId, requestId) => {
    await sb.from('offers').update({ status: 'accepted' }).eq('id', offerId);
    await sb.from('requests').update({ status: 'closed', shipping_status: 'accepted' }).eq('id', requestId);
    await sb.from('offers').update({ status: 'rejected' }).eq('request_id', requestId).neq('id', offerId);
    await sb.from('notifications').insert({ user_id: supplierId, type: 'offer_accepted', title_ar: 'تم قبول عرضك', title_en: 'Your offer has been accepted', title_zh: '您的报价已被接受', ref_id: offerId, is_read: false });
    loadMyRequests();
    loadPendingActions();
  };

  const confirmDelivery = async (requestId, supplierId) => {
    await sb.from('requests').update({ status: 'delivered', shipping_status: 'delivered' }).eq('id', requestId);
    await sb.from('notifications').insert({ user_id: supplierId, type: 'delivery_confirmed', title_ar: 'التاجر أكد الاستلام', title_en: 'Buyer confirmed delivery', title_zh: '买家已确认收货', ref_id: requestId, is_read: false });
    loadMyRequests();
    loadPendingActions();
  };

  const StatusBar = ({ status }) => {
    const idx = STATUS_STEPS.indexOf(status);
    const current = idx === -1 ? 0 : idx;
    const label = isAr ? (STATUS_AR[status] || STATUS_AR.open) : (STATUS_EN[status] || STATUS_EN.open);
    return (
      <div style={{ margin: '14px 0 10px' }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          {STATUS_STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i <= current ? '#2C2C2C' : '#E5E0D8', transition: 'background 0.3s' }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: '#2C2C2C', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</p>
      </div>
    );
  };

  const name = profile?.full_name || user?.email?.split('@')[0];
  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'requests', label: isAr ? 'طلباتي' : 'My Requests' },
    { id: 'messages', label: isAr ? 'الرسائل' : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
  ];

  const BackBtn = () => (
    <button onClick={() => setActiveTab('overview')} style={{
      background: 'none', border: 'none', color: '#7a7a7a',
      fontSize: 11, cursor: 'pointer', letterSpacing: 2,
      textTransform: 'uppercase', fontFamily: 'var(--font-body)',
      padding: 0, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 6,
      transition: 'color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#2C2C2C'}
      onMouseLeave={e => e.currentTarget.style.color = '#7a7a7a'}>
      {isAr ? 'رجوع →' : '← Back'}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>

      {/* HEADER — نفس الـ Home */}
      <div style={{
        padding: '60px 60px 0',
        background: 'rgba(0,0,0,0.38)', 
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)', marginBottom: 24,
          fontFamily: 'var(--font-body)'
        }}>
          {isAr ? 'مَعبر · لوحة التاجر' : 'Maabar · Trader Dashboard'}
        </p>
        <h1 style={{
          fontSize: isAr ? 56 : 72, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          marginBottom: 16, color: '#F7F5F2',
          letterSpacing: isAr ? 0 : -1, lineHeight: 1.1
        }}>
          {isAr ? `أهلاً، ${name}` : `Welcome, ${name}`}
        </h1>
        <p style={{
          fontSize: 16, color: 'rgba(255,255,255,0.72)',
          marginBottom: 44, fontWeight: 300, lineHeight: 1.7,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
          maxWidth: 460
        }}>
          {isAr ? 'تابع طلباتك وعروضك ورسائلك من مكان واحد' : 'Track your requests, offers and messages in one place'}
        </p>

        {/* TABS */}
        <div style={{ display: 'flex' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '1px solid rgba(255,255,255,0.7)' : '1px solid transparent',
              color: activeTab === t.id ? '#F7F5F2' : 'rgba(255,255,255,0.35)',
              fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
              position: 'relative', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              letterSpacing: 2, textTransform: 'uppercase'
            }}>
              {t.label}
              {t.badge && (
                <span style={{
                  position: 'absolute', top: 8,
                  right: isAr ? 'auto' : 4, left: isAr ? 4 : 'auto',
                  background: '#F7F5F2', color: '#2C2C2C',
                  fontSize: 9, fontWeight: 700, borderRadius: '50%',
                  width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ background: 'rgba(247,245,242,0.92)', backdropFilter: 'blur(8px)', minHeight: 'calc(100vh - 300px)' }}>
        <div style={{ padding: '48px 60px', maxWidth: 960, margin: '0 auto' }}>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>

              {/* IMPORTANT ACTIONS */}
              {pendingActions.length > 0 && (
                <div style={{ marginBottom: 48 }}>
                  <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                    {isAr ? 'يحتاج انتباهك' : 'Needs Attention'} ({pendingActions.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#E5E0D8' }}>
                    {pendingActions.map((action, i) => (
                      <div key={i} onClick={() => setActiveTab(action.type === 'messages' ? 'messages' : 'requests')} style={{
                        background: '#F7F5F2', padding: '16px 24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EFECE7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F7F5F2'}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2C', fontFamily: isAr ? 'var(--font-ar)' : 'inherit', marginBottom: 3 }}>
                            {action.type === 'offers' && (isAr ? `${action.count} عرض ينتظر مراجعتك — ${action.request?.title_ar || action.request?.title_en}` : `${action.count} offer(s) waiting — ${action.request?.title_en || action.request?.title_ar}`)}
                            {action.type === 'delivery' && (isAr ? `تأكيد استلام — ${action.request?.title_ar || action.request?.title_en}` : `Confirm delivery — ${action.request?.title_en || action.request?.title_ar}`)}
                            {action.type === 'messages' && (isAr ? `${action.count} رسالة غير مقروءة` : `${action.count} unread message(s)`)}
                          </p>
                          <p style={{ fontSize: 11, color: '#7a7a7a', letterSpacing: 1 }}>
                            {action.type === 'offers' && (isAr ? 'قارن العروض واختر الأفضل' : 'Compare offers and choose the best')}
                            {action.type === 'delivery' && (isAr ? 'الطلب وصل — أكد الاستلام' : 'Order arrived — confirm receipt')}
                            {action.type === 'messages' && (isAr ? 'اضغط للاطلاع' : 'Tap to view')}
                          </p>
                        </div>
                        <span style={{ fontSize: 18, color: '#2C2C2C', opacity: 0.4 }}>←</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STATS */}
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                  {isAr ? 'الإحصائيات' : 'Overview'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#E5E0D8' }}>
                  <StatCard label={isAr ? 'طلبات مرفوعة' : 'Requests Posted'} value={stats.requests} onClick={() => setActiveTab('requests')} />
                  <StatCard label={isAr ? 'عروض مستلمة' : 'Offers Received'} value={stats.offers} onClick={() => setActiveTab('requests')} highlight={stats.offers > 0} />
                  <StatCard label={isAr ? 'رسائل جديدة' : 'New Messages'} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                  {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#E5E0D8' }}>
                  <QuickAction title={isAr ? 'تصفح المنتجات' : 'Browse Products'} sub={isAr ? 'استكشف المنتجات من الموردين الصينيين' : 'Explore products from Chinese suppliers'} onClick={() => nav('/products')} primary />
                  <QuickAction title={isAr ? 'رفع طلب جديد' : 'Post New Request'} sub={isAr ? 'اطلب منتجاً وانتظر عروض الموردين' : 'Request a product and receive supplier offers'} onClick={() => nav('/requests')} />
                  <QuickAction title={isAr ? 'طلباتي' : 'My Requests'} sub={isAr ? 'تابع طلباتك الحالية وعروضها' : 'Track your current orders and offers'} onClick={() => setActiveTab('requests')} />
                </div>
              </div>

              <button onClick={() => nav('/')} style={{
                background: 'none', border: 'none', color: '#7a7a7a',
                fontSize: 11, cursor: 'pointer', letterSpacing: 2,
                textTransform: 'uppercase', padding: 0, transition: 'color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#2C2C2C'}
                onMouseLeave={e => e.currentTarget.style.color = '#7a7a7a'}>
                {isAr ? 'العودة للرئيسية →' : '← Back to Home'}
              </button>
            </div>
          )}

          {/* MY REQUESTS */}
          {activeTab === 'requests' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
                <h2 style={{ fontSize: 40, fontWeight: 300, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C', letterSpacing: isAr ? 0 : -1 }}>
                  {isAr ? 'طلباتي' : 'My Requests'}
                </h2>
                <button onClick={() => nav('/requests')} style={{
                  background: '#2C2C2C', color: '#F7F5F2', border: 'none',
                  padding: '10px 22px', fontSize: 10, letterSpacing: 2,
                  textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2
                }}>
                  {isAr ? 'طلب جديد' : 'New Request'}
                </button>
              </div>

              {myRequests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ fontSize: 14, color: '#7a7a7a', marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr ? 'ما عندك طلبات بعد' : 'No requests yet'}
                  </p>
                  <button onClick={() => nav('/requests')} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '12px 28px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                    {isAr ? 'ارفع أول طلب' : 'Post First Request'}
                  </button>
                </div>
              )}

              {myRequests.map((r, idx) => (
                <div key={r.id} style={{ borderTop: '1px solid #E5E0D8', padding: '32px 0', animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: '#2C2C2C' }}>
                      {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                    </h3>
                    <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#7a7a7a' }}>
                      {isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status}
                    </span>
                  </div>
                  <StatusBar status={r.shipping_status || r.status} />
                  <p style={{ color: '#7a7a7a', fontSize: 12, marginBottom: 20, letterSpacing: 0.5 }}>
                    {isAr ? 'الكمية:' : 'Qty:'} {r.quantity || '—'}
                  </p>

                  {r.tracking_number && (
                    <div style={{ marginBottom: 20, padding: '12px 16px', background: '#EFECE7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#2C2C2C' }}>{isAr ? 'رقم التتبع:' : 'Tracking:'} <strong>{r.tracking_number}</strong></span>
                      <a href={`https://t.17track.net/en#nums=${r.tracking_number}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#2C2C2C', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>
                        {isAr ? 'تتبع →' : 'Track →'}
                      </a>
                    </div>
                  )}

                  {/* OFFERS COMPARISON */}
                  {r.offers.length > 0 && (
                    <div>
                      {r.offers.length > 1 && (
                        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 12 }}>
                          {isAr ? `${r.offers.length} عروض — قارن واختر` : `${r.offers.length} Offers — Compare & Choose`}
                        </p>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(r.offers.length, 3)}, 1fr)`, gap: 1, background: '#E5E0D8' }}>
                        {r.offers.map(o => (
                          <div key={o.id} style={{
                            background: o.status === 'accepted' ? '#2C2C2C' : '#F7F5F2',
                            padding: '20px',
                            position: 'relative'
                          }}>
                            <p style={{ fontSize: 11, fontWeight: 500, color: o.status === 'accepted' ? 'rgba(247,245,242,0.6)' : '#7a7a7a', marginBottom: 8, letterSpacing: 0.5 }}>
                              {o.profiles?.company_name || '—'}
                            </p>
                            <p style={{ fontSize: 32, fontWeight: 300, color: o.status === 'accepted' ? '#F7F5F2' : '#2C2C2C', fontFamily: 'var(--font-en)', lineHeight: 1, marginBottom: 4 }}>
                              {o.price}
                              <span style={{ fontSize: 12, fontWeight: 400, marginRight: 4, opacity: 0.6 }}>SAR</span>
                            </p>
                            <p style={{ fontSize: 11, color: o.status === 'accepted' ? 'rgba(247,245,242,0.5)' : '#7a7a7a', letterSpacing: 0.5, marginBottom: 16 }}>
                              MOQ: {o.moq} · {o.delivery_days} {isAr ? 'يوم' : 'd'}
                            </p>
                            {o.status === 'pending' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button onClick={() => acceptOffer(o.id, o.supplier_id, r.id)} style={{
                                  background: '#2C2C2C', color: '#F7F5F2', border: 'none',
                                  padding: '9px', fontSize: 10, letterSpacing: 1.5,
                                  textTransform: 'uppercase', cursor: 'pointer', width: '100%'
                                }}>
                                  {isAr ? 'قبول' : 'Accept'}
                                </button>
                                <button onClick={() => nav(`/chat/${o.supplier_id}`)} style={{
                                  background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C',
                                  padding: '8px', fontSize: 10, letterSpacing: 1.5,
                                  textTransform: 'uppercase', cursor: 'pointer', width: '100%'
                                }}>
                                  {isAr ? 'تواصل' : 'Chat'}
                                </button>
                              </div>
                            )}
                            {o.status === 'accepted' && (
                              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(247,245,242,0.5)' }}>
                                {isAr ? 'مقبول' : 'Accepted'}
                              </p>
                            )}
                            {r.status === 'shipping' && o.status === 'accepted' && (
                              <button onClick={() => confirmDelivery(r.id, o.supplier_id)} style={{
                                marginTop: 8, background: '#F7F5F2', color: '#2C2C2C', border: 'none',
                                padding: '9px', fontSize: 10, letterSpacing: 1.5,
                                textTransform: 'uppercase', cursor: 'pointer', width: '100%'
                              }}>
                                {isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {r.offers.length === 0 && (
                    <p style={{ color: '#7a7a7a', fontSize: 12, letterSpacing: 0.5 }}>
                      {isAr ? 'لا توجد عروض بعد' : 'No offers yet'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === 'messages' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C', letterSpacing: isAr ? 0 : -1 }}>
                {isAr ? 'الرسائل' : 'Messages'}
              </h2>
              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ color: '#7a7a7a', fontSize: 13, letterSpacing: 1 }}>
                    {isAr ? 'ما عندك رسائل بعد' : 'No messages yet'}
                  </p>
                </div>
              ) : inbox.map((m, idx) => {
                const senderName = m.profiles?.company_name || m.profiles?.full_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 20,
                    padding: '20px 0', borderTop: '1px solid #E5E0D8',
                    cursor: 'pointer', transition: 'opacity 0.2s',
                    animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#2C2C2C', color: '#F7F5F2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 500, flexShrink: 0
                    }}>
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2C', marginBottom: 4 }}>{senderName}</p>
                      <p style={{ fontSize: 12, color: '#7a7a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{m.content}</p>
                    </div>
                    {!m.is_read && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2C2C2C', flexShrink: 0 }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.5 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? '#2C2C2C' : '#F7F5F2',
      padding: '32px 28px', cursor: 'pointer', transition: 'all 0.25s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = highlight ? '#3a3a3a' : '#EFECE7'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? '#2C2C2C' : '#F7F5F2'}>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: highlight ? 'rgba(255,255,255,0.4)' : '#7a7a7a', marginBottom: 20 }}>{label}</p>
      <p style={{ fontSize: 64, fontWeight: 300, color: highlight ? '#F7F5F2' : '#2C2C2C', lineHeight: 1, fontFamily: 'var(--font-en)' }}>{value}</p>
    </div>
  );
}

function QuickAction({ title, sub, onClick, primary }) {
  return (
    <div onClick={onClick} style={{
      padding: '28px 24px',
      background: primary ? '#2C2C2C' : '#F7F5F2',
      cursor: 'pointer', transition: 'all 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = primary ? '#3a3a3a' : '#EFECE7'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? '#2C2C2C' : '#F7F5F2'}>
      <p style={{ fontSize: 13, fontWeight: 500, color: primary ? '#F7F5F2' : '#2C2C2C', marginBottom: 10, fontFamily: 'var(--font-ar)' }}>{title}</p>
      <p style={{ fontSize: 12, color: primary ? 'rgba(255,255,255,0.45)' : '#7a7a7a', fontFamily: 'var(--font-ar)', lineHeight: 1.6 }}>{sub}</p>
    </div>
  );
}