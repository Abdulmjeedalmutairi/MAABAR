import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const STATUS_AR = { open: 'مرفوع', offers_received: 'عروض وصلت', closed: 'عرض مقبول', shipping: 'قيد الشحن', arrived: 'وصل السعودية', delivered: 'تم التسليم' };
const STATUS_EN = { open: 'Posted', offers_received: 'Offers In', closed: 'Accepted', shipping: 'Shipping', arrived: 'Arrived', delivered: 'Delivered' };
const STATUS_STEPS = ['open', 'offers_received', 'closed', 'shipping', 'arrived', 'delivered'];

const OFFER_STATUS_AR = { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' };
const OFFER_STATUS_EN = { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' };

export default function Dashboard({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const [stats, setStats] = useState({ requests: 0, offers: 0, messages: 0, products: 0 });
  const [myRequests, setMyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [trackingInputs, setTrackingInputs] = useState({});
  const [product, setProduct] = useState({ name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    loadStats();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'requests' && !isSupplier) loadMyRequests();
    if (activeTab === 'offers' && isSupplier) loadMyOffers();
  }, [activeTab]);

  const loadStats = async () => {
    if (isSupplier) {
      const [products, offers, messages] = await Promise.all([
        sb.from('products').select('id', { count: 'exact' }).eq('supplier_id', user.id),
        sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id),
        sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      ]);
      setStats({ products: products.count || 0, offers: offers.count || 0, messages: messages.count || 0 });
    } else {
      const [requests, messages] = await Promise.all([
        sb.from('requests').select('id', { count: 'exact' }).eq('buyer_id', user.id),
        sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      ]);
      setStats({ requests: requests.count || 0, messages: messages.count || 0 });
    }
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

  const loadMyOffers = async () => {
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,buyer_id,status,tracking_number,shipping_status)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyOffers(data);
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
    const { error } = await sb.from('products').insert({ supplier_id: user.id, name_ar: product.name_ar, name_en: product.name_en || product.name_ar, name_zh: product.name_zh || product.name_ar, price_from: parseFloat(product.price_from), moq: product.moq, desc_ar: product.desc_ar, is_active: true });
    setSaving(false);
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    alert(isAr ? 'تم إضافة المنتج' : 'Product added');
    setProduct({ name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '' });
    setActiveTab('overview');
    loadStats();
  };

  const StatusBar = ({ status }) => {
    const idx = STATUS_STEPS.indexOf(status);
    const current = idx === -1 ? 0 : idx;
    const label = isAr ? (STATUS_AR[status] || STATUS_AR.open) : (STATUS_EN[status] || STATUS_EN.open);
    return (
      <div style={{ margin: '14px 0 10px' }}>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
          {STATUS_STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= current ? '#1a1a1a' : '#e8e4de', transition: 'background 0.3s' }} />
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#1a1a1a', fontWeight: 600, letterSpacing: 0.5 }}>{label}</p>
      </div>
    );
  };

  if (!user) return null;
  const name = profile?.full_name || profile?.company_name || user.email?.split('@')[0];

  // TABS
  const tabs = isSupplier
    ? [
        { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
        { id: 'offers', label: isAr ? 'عروضي' : 'My Offers' },
        { id: 'add-product', label: isAr ? 'إضافة منتج' : 'Add Product' },
        { id: 'messages', label: isAr ? 'الرسائل' : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
      ]
    : [
        { id: 'overview', label: isAr ? 'نظرة عامة' : 'Overview' },
        { id: 'requests', label: isAr ? 'طلباتي' : 'My Requests' },
        { id: 'messages', label: isAr ? 'الرسائل' : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
      ];

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent', position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'url(https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/hero-image/hero.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: -2 }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(250,248,244,0.93)', zIndex: -1 }} />

      {/* HEADER */}
      <div style={{ padding: '48px 60px 0', borderBottom: '1px solid #e8e4de', background: '#fff' }}>
        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 10 }}>
          {isAr ? 'أهلاً' : 'Welcome back'}
        </p>
        <h1 style={{ fontSize: 36, fontWeight: 300, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', marginBottom: 4, color: '#1a1a1a' }}>
          {name}
        </h1>
        <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 28 }}>
          {isSupplier ? (isAr ? 'لوحة المورد' : 'Supplier Dashboard') : (isAr ? 'لوحة التاجر' : 'Trader Dashboard')}
        </p>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #1a1a1a' : '2px solid transparent',
              color: activeTab === t.id ? '#1a1a1a' : '#6b6b6b',
              fontSize: 14, fontWeight: activeTab === t.id ? 500 : 400,
              cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              fontFamily: isAr ? 'var(--font-ar)' : 'inherit'
            }}>
              {t.label}
              {t.badge && (
                <span style={{ position: 'absolute', top: 8, right: 8, background: '#1a1a1a', color: '#fff', fontSize: 10, fontWeight: 600, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '40px 60px', maxWidth: 900, margin: '0 auto' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
              {isSupplier ? (
                <>
                  <StatCard label={isAr ? 'عروض مقدمة' : 'Offers Submitted'} value={stats.offers} onClick={() => setActiveTab('offers')} />
                  <StatCard label={isAr ? 'منتجات نشطة' : 'Active Products'} value={stats.products} onClick={() => setActiveTab('add-product')} />
                  <StatCard label={isAr ? 'رسائل جديدة' : 'New Messages'} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </>
              ) : (
                <>
                  <StatCard label={isAr ? 'طلبات مرفوعة' : 'Requests Posted'} value={stats.requests} onClick={() => setActiveTab('requests')} />
                  <StatCard label={isAr ? 'رسائل جديدة' : 'New Messages'} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {isSupplier ? (
                <>
                  <button className="btn-dark-sm" onClick={() => nav('/requests')}>{isAr ? 'تصفح طلبات التجار' : 'Browse Trader Requests'}</button>
                  <button className="btn-outline" onClick={() => setActiveTab('add-product')}>{isAr ? 'إضافة منتج جديد' : 'Add New Product'}</button>
                </>
              ) : (
                <>
                  <button className="btn-dark-sm" onClick={() => nav('/products')}>{isAr ? 'تصفح المنتجات' : 'Browse Products'}</button>
                  <button className="btn-outline" onClick={() => setActiveTab('requests')}>{isAr ? 'طلباتي' : 'My Requests'}</button>
                  <button className="btn-outline" onClick={() => nav('/requests')}>{isAr ? 'رفع طلب جديد' : 'Post New Request'}</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* MY REQUESTS — التاجر */}
        {activeTab === 'requests' && !isSupplier && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 300, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>
              {isAr ? 'طلباتي' : 'My Requests'}
            </h2>
            {myRequests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b6b6b' }}>
                <p style={{ fontSize: 16, marginBottom: 16 }}>{isAr ? 'ما عندك طلبات بعد' : 'No requests yet'}</p>
                <button className="btn-dark-sm" onClick={() => nav('/requests')}>{isAr ? 'ارفع أول طلب' : 'Post First Request'}</button>
              </div>
            )}
            {myRequests.map(r => (
              <div key={r.id} style={{ border: '1px solid #e8e4de', padding: 28, marginBottom: 16, borderRadius: 4, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                  </h3>
                  <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#6b6b6b', padding: '3px 10px', border: '1px solid #e8e4de', borderRadius: 20 }}>
                    {isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status}
                  </span>
                </div>

                <StatusBar status={r.shipping_status || r.status} />

                <p style={{ color: '#6b6b6b', fontSize: 13, marginBottom: 16 }}>
                  {isAr ? 'الكمية:' : 'Qty:'} {r.quantity || '—'}
                </p>

                {r.tracking_number && (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f0ede8', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13 }}>{isAr ? 'رقم التتبع:' : 'Tracking:'} <strong>{r.tracking_number}</strong></span>
                    <a href={`https://t.17track.net/en#nums=${r.tracking_number}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1a1a1a', textDecoration: 'underline' }}>
                      {isAr ? 'تتبع الشحنة' : 'Track Shipment'}
                    </a>
                  </div>
                )}

                {r.offers.length > 0 ? r.offers.map(o => (
                  <div key={o.id} style={{ background: '#f0ede8', padding: 16, borderRadius: 4, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: 4 }}>{o.profiles?.company_name || ''}</p>
                      <p style={{ fontSize: 20, fontWeight: 400, marginBottom: 4 }}>{o.price} SAR</p>
                      <p style={{ color: '#6b6b6b', fontSize: 12 }}>MOQ: {o.moq} · {o.delivery_days} {isAr ? 'يوم' : 'days'}</p>
                    </div>
                    <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#6b6b6b', padding: '3px 10px', border: '1px solid #e8e4de', borderRadius: 20 }}>
                      {isAr ? OFFER_STATUS_AR[o.status] || o.status : OFFER_STATUS_EN[o.status] || o.status}
                    </span>
                    {o.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-dark-sm" onClick={() => acceptOffer(o.id, o.supplier_id, r.id)}>{isAr ? 'قبول العرض' : 'Accept'}</button>
                        <button className="btn-outline" onClick={() => nav(`/chat/${o.supplier_id}`)}>{isAr ? 'تواصل' : 'Chat'}</button>
                      </div>
                    )}
                    {o.status === 'accepted' && r.status !== 'delivered' && r.status !== 'shipping' && (
                      <p style={{ fontSize: 12, color: '#6b6b6b' }}>{isAr ? 'في انتظار الشحن من المورد' : 'Waiting for supplier to ship'}</p>
                    )}
                    {r.status === 'shipping' && r.status !== 'delivered' && (
                      <button className="btn-dark-sm" onClick={() => confirmDelivery(r.id, o.supplier_id)}>
                        {isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                      </button>
                    )}
                  </div>
                )) : (
                  <p style={{ color: '#6b6b6b', fontSize: 13 }}>{isAr ? 'لا توجد عروض بعد' : 'No offers yet'}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MY OFFERS — المورد */}
        {activeTab === 'offers' && isSupplier && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 300, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>
              {isAr ? 'عروضي' : 'My Offers'}
            </h2>
            {myOffers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b6b6b' }}>
                <p style={{ fontSize: 16, marginBottom: 16 }}>{isAr ? 'ما قدمت عروض بعد' : 'No offers yet'}</p>
                <button className="btn-dark-sm" onClick={() => nav('/requests')}>{isAr ? 'تصفح الطلبات' : 'Browse Requests'}</button>
              </div>
            )}
            {myOffers.map(o => (
              <div key={o.id} style={{ border: '1px solid #e8e4de', padding: 28, marginBottom: 16, borderRadius: 4, background: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr ? o.requests?.title_ar || o.requests?.title_en : o.requests?.title_en || o.requests?.title_ar}
                  </h3>
                  <span style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: '#6b6b6b', padding: '3px 10px', border: '1px solid #e8e4de', borderRadius: 20 }}>
                    {isAr ? OFFER_STATUS_AR[o.status] || o.status : OFFER_STATUS_EN[o.status] || o.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 32, color: '#6b6b6b', fontSize: 13, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span>{o.price} SAR</span>
                  <span>MOQ: {o.moq}</span>
                  <span>{o.delivery_days} {isAr ? 'يوم' : 'days'}</span>
                </div>

                {o.status === 'accepted' && o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered' && (
                  <div style={{ marginTop: 4, marginBottom: 16 }}>
                    <p style={{ fontSize: 13, marginBottom: 10, color: '#1a1a1a' }}>
                      {isAr ? 'أدخل رقم التتبع لإخطار التاجر' : 'Enter tracking number to notify buyer'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" style={{ maxWidth: 240 }}
                        placeholder={isAr ? 'رقم التتبع' : 'Tracking number'}
                        value={trackingInputs[o.request_id] || ''}
                        onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))}
                      />
                      <button className="btn-dark-sm" onClick={() => submitTracking(o.request_id, o.requests?.buyer_id)}>
                        {isAr ? 'إرسال' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}

                {o.requests?.tracking_number && (
                  <p style={{ fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#f0ede8', borderRadius: 3 }}>
                    {isAr ? 'رقم التتبع:' : 'Tracking:'} <strong>{o.requests.tracking_number}</strong>
                  </p>
                )}

                {o.status === 'accepted' && o.requests?.buyer_id && (
                  <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)}>
                    {isAr ? 'تواصل مع التاجر' : 'Contact Trader'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* MESSAGES */}
        {activeTab === 'messages' && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 300, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>
              {isAr ? 'الرسائل' : 'Messages'}
            </h2>
            <div style={{ border: '1px solid #e8e4de', borderRadius: 4, background: '#fff', overflow: 'hidden' }}>
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #e8e4de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 14, color: '#1a1a1a' }}>{isAr ? 'صندوق الوارد' : 'Inbox'}</p>
                {stats.messages > 0 && (
                  <span style={{ background: '#1a1a1a', color: '#fff', fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '2px 10px' }}>
                    {stats.messages} {isAr ? 'جديد' : 'new'}
                  </span>
                )}
              </div>
              <div style={{ padding: '28px', textAlign: 'center' }}>
                <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: 16 }}>
                  {isAr ? 'كل محادثاتك مع الموردين والتجار هنا' : 'All your conversations with suppliers and traders'}
                </p>
                <button className="btn-dark-sm" onClick={() => nav('/inbox')}>
                  {isAr ? 'فتح صندوق الرسائل' : 'Open Inbox'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT — المورد */}
        {activeTab === 'add-product' && isSupplier && (
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 300, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>
              {isAr ? 'إضافة منتج جديد' : 'Add New Product'}
            </h2>
            <div style={{ background: '#fff', border: '1px solid #e8e4de', padding: 36, maxWidth: 700, borderRadius: 4 }}>
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
                <button className="btn-dark-sm" onClick={addProduct} disabled={saving}>{saving ? '...' : isAr ? 'حفظ' : 'Save'}</button>
                <button className="btn-outline" onClick={() => setActiveTab('overview')}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}

// مكون StatCard
function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', border: `1px solid ${highlight ? '#1a1a1a' : '#e8e4de'}`,
      padding: '28px 24px', cursor: 'pointer', transition: 'all 0.2s',
      borderRadius: 4
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1a1a'}
      onMouseLeave={e => e.currentTarget.style.borderColor = highlight ? '#1a1a1a' : '#e8e4de'}
    >
      <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 12 }}>{label}</p>
      <p style={{ fontSize: 42, fontWeight: 300, color: '#1a1a1a', lineHeight: 1 }}>{value}</p>
    </div>
  );
}