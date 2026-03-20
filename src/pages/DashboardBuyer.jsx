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

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    loadStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'requests') loadMyRequests();
    if (activeTab === 'messages') loadInbox();
  }, [activeTab]);

  const loadStats = async () => {
    const [requests, messages, offers] = await Promise.all([
      sb.from('requests').select('id', { count: 'exact' }).eq('buyer_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      sb.from('offers').select('id,request_id,requests!inner(buyer_id)', { count: 'exact' }).eq('requests.buyer_id', user.id).eq('status', 'pending'),
    ]);
    setStats({ requests: requests.count || 0, messages: messages.count || 0, offers: offers.count || 0 });
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
  };

  const confirmDelivery = async (requestId, supplierId) => {
    await sb.from('requests').update({ status: 'delivered', shipping_status: 'delivered' }).eq('id', requestId);
    await sb.from('notifications').insert({ user_id: supplierId, type: 'delivery_confirmed', title_ar: 'التاجر أكد الاستلام', title_en: 'Buyer confirmed delivery', title_zh: '买家已确认收货', ref_id: requestId, is_read: false });
    alert(isAr ? 'تم تأكيد الاستلام' : 'Delivery confirmed');
    loadMyRequests();
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
        <p style={{ fontSize: 11, color: '#2C2C2C', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</p>
      </div>
    );
  };

  const name = profile?.full_name || user?.email?.split('@')[0];
  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'requests', label: isAr ? 'طلباتي' : 'My Requests' },
    { id: 'messages', label: isAr ? 'الرسائل' : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>

      {/* HEADER — أسود شفاف */}
      <div style={{
        padding: '52px 60px 0',
        background: 'rgba(20,20,20,0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <p style={{ fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10, fontFamily: 'var(--font-body)' }}>
          {isAr ? 'أهلاً بك' : 'Welcome back'}
        </p>
        <h1 style={{
          fontSize: 52, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          marginBottom: 6, color: '#F7F5F2',
          letterSpacing: isAr ? 0 : -1.5
        }}>
          {name}
        </h1>
        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.35)',
          marginBottom: 36, letterSpacing: 3,
          textTransform: 'uppercase',
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)'
        }}>
          {isAr ? 'لوحة التاجر' : 'Trader Dashboard'}
        </p>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '14px 28px', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '1px solid rgba(255,255,255,0.7)' : '1px solid transparent',
              color: activeTab === t.id ? '#F7F5F2' : 'rgba(255,255,255,0.35)',
              fontSize: 12, fontWeight: 400, cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              letterSpacing: 1.5, textTransform: 'uppercase'
            }}>
              {t.label}
              {t.badge && (
                <span style={{
                  position: 'absolute', top: 10, right: isAr ? 'auto' : 6, left: isAr ? 6 : 'auto',
                  background: '#F7F5F2', color: '#2C2C2C',
                  fontSize: 9, fontWeight: 700, borderRadius: '50%',
                  width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '48px 60px', maxWidth: 960, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>

            {/* STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, marginBottom: 48, background: '#E5E0D8' }}>
              <StatCard label={isAr ? 'طلبات مرفوعة' : 'Requests Posted'} value={stats.requests} onClick={() => setActiveTab('requests')} />
              <StatCard label={isAr ? 'عروض مقدمة' : 'Offers Received'} value={stats.offers} onClick={() => setActiveTab('requests')} highlight={stats.offers > 0} />
              <StatCard label={isAr ? 'رسائل جديدة' : 'New Messages'} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
            </div>

            {/* QUICK ACTIONS */}
            <div style={{ borderTop: '1px solid #E5E0D8', paddingTop: 32, marginBottom: 48 }}>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 24, fontFamily: 'var(--font-body)' }}>
                {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <QuickAction title={isAr ? 'تصفح المنتجات' : 'Browse Products'} sub={isAr ? 'استكشف المنتجات المتاحة' : 'Explore available products'} onClick={() => nav('/products')} primary />
                <QuickAction title={isAr ? 'رفع طلب جديد' : 'Post New Request'} sub={isAr ? 'اطلب من الموردين الصينيين' : 'Source from Chinese suppliers'} onClick={() => nav('/requests')} />
                <QuickAction title={isAr ? 'طلباتي' : 'My Requests'} sub={isAr ? 'تابع طلباتك الحالية' : 'Track your current orders'} onClick={() => setActiveTab('requests')} />
              </div>
            </div>

            {/* BACK TO HOME */}
            <button onClick={() => nav('/')} style={{
              background: 'none', border: 'none', color: '#7a7a7a',
              fontSize: 12, cursor: 'pointer', letterSpacing: 1.5,
              textTransform: 'uppercase', fontFamily: 'var(--font-body)',
              transition: 'color 0.2s', padding: 0
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#2C2C2C'}
              onMouseLeave={e => e.currentTarget.style.color = '#7a7a7a'}>
              {isAr ? '← العودة للرئيسية' : '← Back to Home'}
            </button>
          </div>
        )}

        {/* MY REQUESTS */}
        {activeTab === 'requests' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
              <h2 style={{ fontSize: 36, fontWeight: 300, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلباتي' : 'My Requests'}
              </h2>
              <button onClick={() => nav('/requests')} style={{
                background: '#2C2C2C', color: '#F7F5F2', border: 'none',
                padding: '10px 20px', fontSize: 11, letterSpacing: 1.5,
                textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2,
                transition: 'opacity 0.2s'
              }}>
                {isAr ? 'طلب جديد' : 'New Request'}
              </button>
            </div>

            {myRequests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                <p style={{ fontSize: 14, color: '#7a7a7a', marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr ? 'ما عندك طلبات بعد' : 'No requests yet'}
                </p>
                <button onClick={() => nav('/requests')} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '12px 28px', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                  {isAr ? 'ارفع أول طلب' : 'Post First Request'}
                </button>
              </div>
            )}

            {myRequests.map((r, idx) => (
              <div key={r.id} style={{
                borderTop: '1px solid #E5E0D8', padding: '28px 0',
                animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: '#2C2C2C' }}>
                    {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                  </h3>
                  <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#7a7a7a' }}>
                    {isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status}
                  </span>
                </div>

                <StatusBar status={r.shipping_status || r.status} />

                <p style={{ color: '#7a7a7a', fontSize: 13, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr ? 'الكمية:' : 'Qty:'} {r.quantity || '—'}
                </p>

                {r.tracking_number && (
                  <div style={{ marginBottom: 20, padding: '12px 16px', background: '#EFECE7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#2C2C2C' }}>{isAr ? 'رقم التتبع:' : 'Tracking:'} <strong>{r.tracking_number}</strong></span>
                    <a href={`https://t.17track.net/en#nums=${r.tracking_number}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#2C2C2C', letterSpacing: 1, textTransform: 'uppercase' }}>
                      {isAr ? 'تتبع' : 'Track →'}
                    </a>
                  </div>
                )}

                {r.offers.length > 0 ? r.offers.map(o => (
                  <div key={o.id} style={{ borderTop: '1px solid #E5E0D8', padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: 4, fontSize: 14, color: '#2C2C2C' }}>{o.profiles?.company_name || ''}</p>
                      <p style={{ fontSize: 24, fontWeight: 300, marginBottom: 4, color: '#2C2C2C', fontFamily: 'var(--font-en)' }}>{o.price} <span style={{ fontSize: 13, color: '#7a7a7a' }}>SAR</span></p>
                      <p style={{ color: '#7a7a7a', fontSize: 12, letterSpacing: 0.5 }}>MOQ: {o.moq} · {o.delivery_days} {isAr ? 'يوم' : 'days'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#7a7a7a' }}>
                        {isAr ? OFFER_STATUS_AR[o.status] : OFFER_STATUS_EN[o.status]}
                      </span>
                      {o.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '9px 20px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', borderRadius: 2 }} onClick={() => acceptOffer(o.id, o.supplier_id, r.id)}>
                            {isAr ? 'قبول' : 'Accept'}
                          </button>
                          <button style={{ background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '9px 16px', fontSize: 11, cursor: 'pointer', borderRadius: 2 }} onClick={() => nav(`/chat/${o.supplier_id}`)}>
                            {isAr ? 'تواصل' : 'Chat'}
                          </button>
                        </div>
                      )}
                      {r.status === 'shipping' && (
                        <button style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '9px 20px', fontSize: 11, letterSpacing: 1, cursor: 'pointer', borderRadius: 2 }} onClick={() => confirmDelivery(r.id, o.supplier_id)}>
                          {isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <p style={{ color: '#7a7a7a', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
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
            <h2 style={{ fontSize: 36, fontWeight: 300, marginBottom: 40, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C' }}>
              {isAr ? 'الرسائل' : 'Messages'}
            </h2>
            {inbox.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                <p style={{ color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'inherit', fontSize: 14 }}>
                  {isAr ? 'ما عندك رسائل بعد' : 'No messages yet'}
                </p>
              </div>
            ) : inbox.map((m, idx) => {
              const senderName = m.profiles?.company_name || m.profiles?.full_name || '—';
              return (
                <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 20,
                  padding: '20px 0', borderTop: '1px solid #E5E0D8',
                  cursor: 'pointer', transition: 'all 0.2s',
                  animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
                }}
                  onMouseEnter={e => e.currentTarget.style.paddingRight = isAr ? '0' : '8px'}
                  onMouseLeave={e => e.currentTarget.style.paddingRight = '0'}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#2C2C2C', color: '#F7F5F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 500, flexShrink: 0
                  }}>
                    {senderName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#2C2C2C', marginBottom: 4 }}>{senderName}</p>
                    <p style={{ fontSize: 12, color: '#7a7a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{m.content}</p>
                  </div>
                  {!m.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2C2C2C', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 80 }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.6 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 1 }}>{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? '#2C2C2C' : 'rgba(255,255,255,0.88)',
      padding: '32px 28px', cursor: 'pointer',
      backdropFilter: 'blur(8px)', transition: 'all 0.25s'
    }}
      onMouseEnter={e => e.currentTarget.style.background = highlight ? '#444' : '#fff'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? '#2C2C2C' : 'rgba(255,255,255,0.88)'}>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: highlight ? 'rgba(255,255,255,0.5)' : '#7a7a7a', marginBottom: 16, fontFamily: 'var(--font-body)' }}>{label}</p>
      <p style={{ fontSize: 56, fontWeight: 300, color: highlight ? '#F7F5F2' : '#2C2C2C', lineHeight: 1, fontFamily: 'var(--font-en)' }}>{value}</p>
    </div>
  );
}

function QuickAction({ title, sub, onClick, primary }) {
  return (
    <div onClick={onClick} style={{
      padding: '24px', border: '1px solid #E5E0D8',
      background: primary ? '#2C2C2C' : 'rgba(255,255,255,0.7)',
      cursor: 'pointer', transition: 'all 0.25s', borderRadius: 2
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: primary ? '#F7F5F2' : '#2C2C2C', marginBottom: 8, fontFamily: 'var(--font-ar)' }}>{title}</p>
      <p style={{ fontSize: 12, color: primary ? 'rgba(255,255,255,0.5)' : '#7a7a7a', fontFamily: 'var(--font-ar)', lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}