import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const OFFER_STATUS_AR = { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' };
const OFFER_STATUS_EN = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };

export default function DashboardSupplier({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [stats, setStats] = useState({ products: 0, offers: 0, messages: 0 });
  const [myOffers, setMyOffers] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [trackingInputs, setTrackingInputs] = useState({});
  const [product, setProduct] = useState({ name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { nav('/login/supplier'); return; }
    loadStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'offers') loadMyOffers();
    if (activeTab === 'messages') loadInbox();
  }, [activeTab]);

  const loadStats = async () => {
    const [products, offers, messages] = await Promise.all([
      sb.from('products').select('id', { count: 'exact' }).eq('supplier_id', user.id),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
    ]);
    setStats({ products: products.count || 0, offers: offers.count || 0, messages: messages.count || 0 });
  };

  const loadMyOffers = async () => {
    const { data } = await sb.from('offers')
      .select('*,requests(title_ar,title_en,buyer_id,status,tracking_number,shipping_status)')
      .eq('supplier_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setMyOffers(data);
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

  const submitTracking = async (requestId, buyerId) => {
    const num = trackingInputs[requestId];
    if (!num) { alert(isAr ? 'أدخل رقم التتبع' : 'Enter tracking number'); return; }
    await sb.from('requests').update({ tracking_number: num, status: 'shipping', shipping_status: 'shipping' }).eq('id', requestId);
    await sb.from('notifications').insert({ user_id: buyerId, type: 'shipped', title_ar: 'طلبك في الطريق — رقم التتبع: ' + num, title_en: 'Your order is on the way — Tracking: ' + num, title_zh: '您的订单已发货 — 跟踪号：' + num, ref_id: requestId, is_read: false });
    alert(isAr ? 'تم إرسال رقم التتبع' : 'Tracking number sent');
    loadMyOffers();
  };

  const addProduct = async () => {
    if (!product.name_ar || !product.price_from || !product.moq) { alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Fill required fields'); return; }
    setSaving(true);
    const { error } = await sb.from('products').insert({
      supplier_id: user.id,
      name_ar: product.name_ar,
      name_en: product.name_en || product.name_ar,
      name_zh: product.name_zh || product.name_ar,
      price_from: parseFloat(product.price_from),
      moq: product.moq,
      desc_ar: product.desc_ar,
      is_active: true
    });
    setSaving(false);
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    alert(isAr ? 'تم إضافة المنتج' : 'Product added');
    setProduct({ name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '' });
    setActiveTab('overview');
    loadStats();
  };

  const name = profile?.company_name || profile?.full_name || user?.email?.split('@')[0];
  const tabs = [
    { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'offers', label: isAr ? 'عروضي' : 'My Offers' },
    { id: 'add-product', label: isAr ? 'إضافة منتج' : 'Add Product' },
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
        <p style={{ fontSize: 13, color: '#7a7a7a', marginBottom: 32, letterSpacing: 2, textTransform: 'uppercase', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
          {isAr ? 'لوحة المورد' : 'Supplier Dashboard'}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
              <StatCard label={isAr ? 'عروض مقدمة' : 'Offers Submitted'} value={stats.offers} icon="📝" onClick={() => setActiveTab('offers')} />
              <StatCard label={isAr ? 'منتجات نشطة' : 'Active Products'} value={stats.products} icon="📦" onClick={() => setActiveTab('add-product')} />
              <StatCard label={isAr ? 'رسائل جديدة' : 'New Messages'} value={stats.messages} icon="💬" onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <ActionBtn onClick={() => nav('/requests')} primary>{isAr ? 'تصفح طلبات التجار' : 'Browse Requests'}</ActionBtn>
              <ActionBtn onClick={() => setActiveTab('add-product')}>{isAr ? 'إضافة منتج جديد' : 'Add New Product'}</ActionBtn>
            </div>
          </div>
        )}

        {/* MY OFFERS */}
        {activeTab === 'offers' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C' }}>
              {isAr ? 'عروضي' : 'My Offers'}
            </h2>
            {myOffers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#7a7a7a' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                <p style={{ fontSize: 16, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'ما قدمت عروض بعد' : 'No offers yet'}</p>
                <ActionBtn onClick={() => nav('/requests')} primary>{isAr ? 'تصفح الطلبات' : 'Browse Requests'}</ActionBtn>
              </div>
            )}
            {myOffers.map((o, idx) => (
              <div key={o.id} style={{ border: '1px solid #E5E0D8', padding: 28, marginBottom: 16, borderRadius: 8, background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(8px)', animation: `slideUp 0.4s ease ${idx * 0.05}s both`, transition: 'all 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: '#2C2C2C' }}>
                    {isAr ? o.requests?.title_ar || o.requests?.title_en : o.requests?.title_en || o.requests?.title_ar}
                  </h3>
                  <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', padding: '4px 12px', border: '1px solid #E5E0D8', borderRadius: 20 }}>
                    {isAr ? OFFER_STATUS_AR[o.status] || o.status : OFFER_STATUS_EN[o.status] || o.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 32, color: '#7a7a7a', fontSize: 13, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ color: '#2C2C2C', fontSize: 22, fontWeight: 300 }}>{o.price} SAR</span>
                  <span>MOQ: {o.moq}</span>
                  <span>{o.delivery_days} {isAr ? 'يوم' : 'days'}</span>
                </div>

                {o.status === 'accepted' && o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered' && (
                  <div style={{ marginBottom: 16, padding: '16px', background: '#EFECE7', borderRadius: 6 }}>
                    <p style={{ fontSize: 13, marginBottom: 12, color: '#2C2C2C', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {isAr ? 'أدخل رقم التتبع لإخطار التاجر' : 'Enter tracking number to notify buyer'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" style={{ maxWidth: 240 }}
                        placeholder={isAr ? 'رقم التتبع' : 'Tracking number'}
                        value={trackingInputs[o.request_id] || ''}
                        onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))}
                      />
                      <ActionBtn onClick={() => submitTracking(o.request_id, o.requests?.buyer_id)} primary>
                        {isAr ? 'إرسال' : 'Send'}
                      </ActionBtn>
                    </div>
                  </div>
                )}

                {o.requests?.tracking_number && (
                  <p style={{ fontSize: 13, marginBottom: 12, padding: '10px 14px', background: '#EFECE7', borderRadius: 6 }}>
                    {isAr ? 'رقم التتبع:' : 'Tracking:'} <strong>{o.requests.tracking_number}</strong>
                  </p>
                )}

                {o.status === 'accepted' && o.requests?.buyer_id && (
                  <ActionBtn onClick={() => nav(`/chat/${o.requests.buyer_id}`)}>
                    {isAr ? 'تواصل مع التاجر' : 'Contact Trader'}
                  </ActionBtn>
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
              const senderName = m.profiles?.full_name || m.profiles?.company_name || '—';
              const initial = senderName.charAt(0).toUpperCase();
              return (
                <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px',
                  background: !m.is_read ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)',
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
                  {!m.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2C2C2C', flexShrink: 0 }} />}
                </div>
              );
            })}
          </div>
        )}

        {/* ADD PRODUCT */}
        {activeTab === 'add-product' && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ fontSize: 32, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#2C2C2C' }}>
              {isAr ? 'إضافة منتج جديد' : 'Add New Product'}
            </h2>
            <div style={{ background: 'rgba(255,255,255,0.88)', border: '1px solid #E5E0D8', padding: 36, maxWidth: 700, borderRadius: 10, backdropFilter: 'blur(8px)' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم المنتج بالعربي *' : 'Arabic Name *'}</label>
                  <input className="form-input" value={product.name_ar} onChange={e => setProduct({ ...product, name_ar: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم المنتج بالإنجليزي' : 'English Name'}</label>
                  <input className="form-input" value={product.name_en} onChange={e => setProduct({ ...product, name_en: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'اسم المنتج بالصيني' : 'Chinese Name'}</label>
                  <input className="form-input" value={product.name_zh} onChange={e => setProduct({ ...product, name_zh: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">{isAr ? 'السعر من (ريال) *' : 'Price From (SAR) *'}</label>
                  <input className="form-input" type="number" value={product.price_from} onChange={e => setProduct({ ...product, price_from: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">MOQ *</label>
                  <input className="form-input" value={product.moq} onChange={e => setProduct({ ...product, moq: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الوصف' : 'Description'}</label>
                <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={product.desc_ar} onChange={e => setProduct({ ...product, desc_ar: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <ActionBtn onClick={addProduct} primary>{saving ? '...' : isAr ? 'حفظ' : 'Save'}</ActionBtn>
                <ActionBtn onClick={() => setActiveTab('overview')}>{isAr ? 'إلغاء' : 'Cancel'}</ActionBtn>
              </div>
            </div>
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
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>
      {children}
    </button>
  );
}