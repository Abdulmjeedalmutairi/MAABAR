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
  const [stats, setStats] = useState({ requests: 0, messages: 0 });
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
    const [requests, messages] = await Promise.all([
      sb.from('requests').select('id', { count: 'exact' }).eq('buyer_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
    ]);
    setStats({ requests: requests.count || 0, messages: messages.count || 0 });
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
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= current ? '#2C2C2C' : '#E5E0D8', transition: 'background 0.3s' }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#2C2C2C', fontWeight: 600, letterSpacing: 0.5 }}>{label}</p>
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

      {/* HEADER */}
      <div style={{ padding: '52px 60px 0', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #E5E0D8' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 8, fontFamily: 'var(--font-ar)' }}>
          {isAr ? 'أهلاً بك' : 'Welcome back'}
        </p>
        <h1 style={{ fontSize: 48, fontWeight: 300, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', marginBottom: 4, color: '#2C2C2C', letterSpacing: isAr ? 0 : -1 }}>
          {name}
        </h1>
        <p style={{ fontSize: 13, color: '#7a7a7a', marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', letterSpacing: 2, textTransform: 'uppercase' }}>
          {isAr ? 'لوحة التاجر' : 'Trader Dashboard'}
        </p>

        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '14px 28px', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #2C2C2C' : '2px solid transparent',
              color: activeTab === t.id ? '#2C2C2C' : '#7a7a7a',
              fontSize: 13, fontWeight: activeTab === t.id ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              fontFamily: isAr ? 'var(--font-ar)' : 'inherit', letterSpacing: 0.5
            }}>
              {t.label}
              {t.badge && (
                <span style={{ position: 'absolute', top: 8, right: 6, background: '#2C2C2C', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '40px 60px', maxWidth: 960, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 40 }}>
              <StatCard
                label={isAr ? 'طلبات مرفوعة' : 'Requests Posted'}
                value={stats.requests}
                icon="📦"
                onClick={() => setActiveTab('requests')}
              />
              <StatCard
                label={isAr ? 'رسائل جديدة' : 'New Messages'}
                value={stats.messages}
                icon="💬"
                onClick={() => setActiveTab('messages')}
                highlight={stats.messages > 0}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <ActionBtn onClick={() => nav('/products')} primary>{isAr ? 'تصفح المنتجات' : 'Browse Products'}</ActionBtn>
              <ActionBtn onClick={() => nav('/requests')}>{isAr ? 'رفع طلب جديد' : 'Post New Request'}</ActionBtn>
              <ActionBtn onClick={() => setActiveTab('requests')}>{isAr ? 'طلباتي' : 'My Requests'}</ActionBtn>
            </div>
          </div>
        )}

        {/* MY REQUESTS */}
        {activeTab === 'requests' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C' }}>
              {isAr ? 'طلباتي' : 'My Requests'}
            </h2>
            {myRequests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a7a7a' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                <p style={{ fontSize: 16, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'ما عندك طلبات بعد' : 'No requests yet'}</p>
                <ActionBtn onClick={() => nav('/requests')} primary>{isAr ? 'ارفع أول طلب' : 'Post First Request'}</ActionBtn>
              </div>
            )}
            {myRequests.map((r, idx) => (
              <div key={r.id} style={{ border: '1px solid #E5E0D8', padding: 28, marginBottom: 16, borderRadius: 8, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)', animation: `slideUp 0.4s ease ${idx * 0.05}s both`, transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: '#2C2C2C' }}>
                    {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                  </h3>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', padding: '4px 12px', border: '1px solid #E5E0D8', borderRadius: 20 }}>
                    {isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status}
                  </span>
                </div>
                <StatusBar status={r.shipping_status || r.status} />
                <p style={{ color: '#7a7a7a', fontSize: 13, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr ? 'الكمية:' : 'Qty:'} {r.quantity || '—'}
                </p>
                {r.tracking_number && (
                  <div style={{ marginBottom: 16, padding: '10px 16px', background: '#EFECE7', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{isAr ? 'رقم التتبع:' : 'Tracking:'} <strong>{r.tracking_number}</strong></span>
                    <a href={`https://t.17track.net/en#nums=${r.tracking_number}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#2C2C2C', textDecoration: 'underline' }}>
                      {isAr ? 'تتبع الشحنة' : 'Track Shipment'}
                    </a>
                  </div>
                )}
                {r.offers.length > 0 ? r.offers.map(o => (
                  <div key={o.id} style={{ background: '#EFECE7', padding: 18, borderRadius: 6, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: 4, color: '#2C2C2C' }}>{o.profiles?.company_name || ''}</p>
                      <p style={{ fontSize: 22, fontWeight: 300, marginBottom: 4, color: '#2C2C2C' }}>{o.price} SAR</p>
                      <p style={{ color: '#7a7a7a', fontSize: 12 }}>MOQ: {o.moq} · {o.delivery_days} {isAr ? 'يوم' : 'days'}</p>
                    </div>
                    <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', padding: '4px 12px', border: '1px solid #E5E0D8', borderRadius: 20 }}>
                      {isAr ? OFFER_STATUS_AR[o.status] || o.status : OFFER_STATUS_EN[o.status] || o.status}
                    </span>
                    {o.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionBtn onClick={() => acceptOffer(o.id, o.supplier_id, r.id)} primary>{isAr ? 'قبول العرض' : 'Accept'}</ActionBtn>
                        <ActionBtn onClick={() => nav(`/chat/${o.supplier_id}`)}>{isAr ? 'تواصل' : 'Chat'}</ActionBtn>
                      </div>
                    )}
                    {o.status === 'accepted' && r.status !== 'delivered' && r.status !== 'shipping' && (
                      <p style={{ fontSize: 12, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'في انتظار الشحن من المورد' : 'Waiting for supplier to ship'}</p>
                    )}
                    {r.status === 'shipping' && r.status !== 'delivered' && (
                      <ActionBtn onClick={() => confirmDelivery(r.id, o.supplier_id)} primary>{isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}</ActionBtn>
                    )}
                  </div>
                )) : (
                  <p style={{ color: '#7a7a7a', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'لا توجد عروض بعد' : 'No offers yet'}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === 'messages' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C' }}>
              {isAr ? 'الرسائل' : 'Messages'}
            </h2>
            {inbox.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a7a7a' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
                <p style={{ fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'ما عندك رسائل بعد' : 'No messages yet'}</p>
              </div>
            ) : inbox.map((m, idx) => {
              const senderName = m.profiles?.company_name || m.profiles?.full_name || '—';
              const initial = senderName.charAt(0).toUpperCase();
              return (
                <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                  background: m.is_read === false ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
                  border: '1px solid #E5E0D8', borderRadius: 8, marginBottom: 10,
                  cursor: 'pointer', transition: 'all 0.2s',
                  animation: `slideUp 0.4s ease ${idx * 0.05}s both`
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-4px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#2C2C2C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, flexShrink: 0 }}>
                    {initial}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2C', marginBottom: 4 }}>{senderName}</p>
                    <p style={{ fontSize: 13, color: '#7a7a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{m.content}</p>
                  </div>
                  {!m.is_read && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2C2C2C', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 14 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? 'rgba(44,44,44,0.06)' : 'rgba(255,255,255,0.82)',
      border: `1px solid ${highlight ? '#2C2C2C' : '#E5E0D8'}`,
      padding: '32px 28px', cursor: 'pointer', borderRadius: 10,
      backdropFilter: 'blur(8px)', transition: 'all 0.25s',
      animation: 'slideUp 0.5s ease both'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = '#2C2C2C'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = highlight ? '#2C2C2C' : '#E5E0D8'; }}>
      <div style={{ fontSize: 24, marginBottom: 16 }}>{icon}</div>
      <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 52, fontWeight: 300, color: '#2C2C2C', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

function ActionBtn({ children, onClick, primary }) {
  return (
    <button onClick={onClick} style={{
      background: primary ? '#2C2C2C' : 'none',
      color: primary ? '#fff' : '#2C2C2C',
      border: primary ? 'none' : '1px solid #2C2C2C',
      padding: '11px 24px', fontSize: 13, fontWeight: 500,
      cursor: 'pointer', borderRadius: 4, transition: 'all 0.2s'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '1'; }}>
      {children}
    </button>
  );
}