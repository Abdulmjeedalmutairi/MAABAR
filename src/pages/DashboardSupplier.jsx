import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const OFFER_STATUS = {
  ar: { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' },
  en: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' },
  zh: { pending: '待审核', accepted: '已接受', rejected: '已拒绝' },
};

const T = {
  ar: {
    tag: 'مَعبر · لوحة المورد',
    welcome: 'أهلاً،',
    subtitle: 'لوحة المورد',
    desc: 'تابع عروضك ومنتجاتك ورسائلك من مكان واحد',
    overview: 'نظرة عامة', offers: 'عروضي', addProduct: 'إضافة منتج', messages: 'الرسائل',
    offersCount: 'عروض مقدمة', productsCount: 'منتجات نشطة', messagesCount: 'رسائل جديدة',
    browseRequests: 'تصفح طلبات التجار', addNewProduct: 'إضافة منتج جديد',
    quickActions: 'الإجراءات السريعة', stats: 'الإحصائيات',
    backHome: 'العودة للرئيسية →', back: 'رجوع →',
    myOffers: 'عروضي', noOffers: 'ما قدمت عروض بعد', browseReqs: 'تصفح الطلبات',
    trackingPrompt: 'أدخل رقم التتبع لإخطار التاجر', trackingNum: 'رقم التتبع', send: 'إرسال',
    contactTrader: 'تواصل مع التاجر', tracking: 'رقم التتبع:',
    messagesTitle: 'الرسائل', noMessages: 'ما عندك رسائل بعد',
    addProductTitle: 'إضافة منتج جديد',
    nameAr: 'اسم المنتج بالعربي *', nameEn: 'اسم المنتج بالإنجليزي', nameZh: 'اسم المنتج بالصيني',
    price: 'السعر من (ريال) *', moq: 'MOQ *', desc: 'الوصف',
    save: 'حفظ', cancel: 'إلغاء', saving: '...',
    needsAttention: 'يحتاج انتباهك', acceptedOffer: 'عرض مقبول — أضف رقم التتبع',
    footer: 'مَعبر © 2026',
    days: 'يوم',
  },
  en: {
    tag: 'Maabar · Supplier Dashboard',
    welcome: 'Welcome,',
    subtitle: 'Supplier Dashboard',
    desc: 'Manage your offers, products and messages in one place',
    overview: 'Overview', offers: 'My Offers', addProduct: 'Add Product', messages: 'Messages',
    offersCount: 'Offers Submitted', productsCount: 'Active Products', messagesCount: 'New Messages',
    browseRequests: 'Browse Trader Requests', addNewProduct: 'Add New Product',
    quickActions: 'Quick Actions', stats: 'Overview',
    backHome: '← Back to Home', back: '← Back',
    myOffers: 'My Offers', noOffers: 'No offers yet', browseReqs: 'Browse Requests',
    trackingPrompt: 'Enter tracking number to notify buyer', trackingNum: 'Tracking number', send: 'Send',
    contactTrader: 'Contact Trader', tracking: 'Tracking:',
    messagesTitle: 'Messages', noMessages: 'No messages yet',
    addProductTitle: 'Add New Product',
    nameAr: 'Arabic Name *', nameEn: 'English Name', nameZh: 'Chinese Name',
    price: 'Price From (SAR) *', moq: 'MOQ *', desc: 'Description',
    save: 'Save', cancel: 'Cancel', saving: '...',
    needsAttention: 'Needs Attention', acceptedOffer: 'Offer accepted — Add tracking number',
    footer: 'Maabar © 2026',
    days: 'days',
  },
  zh: {
    tag: 'Maabar · 供应商控制台',
    welcome: '欢迎，',
    subtitle: '供应商控制台',
    desc: '在一个地方管理您的报价、产品和消息',
    overview: '概览', offers: '我的报价', addProduct: '添加产品', messages: '消息',
    offersCount: '已提交报价', productsCount: '活跃产品', messagesCount: '新消息',
    browseRequests: '浏览采购商需求', addNewProduct: '添加新产品',
    quickActions: '快速操作', stats: '数据概览',
    backHome: '← 返回首页', back: '← 返回',
    myOffers: '我的报价', noOffers: '暂无报价', browseReqs: '浏览需求',
    trackingPrompt: '输入物流单号以通知采购商', trackingNum: '物流单号', send: '发送',
    contactTrader: '联系采购商', tracking: '物流单号：',
    messagesTitle: '消息', noMessages: '暂无消息',
    addProductTitle: '添加新产品',
    nameAr: '阿拉伯语产品名称 *', nameEn: '英语产品名称', nameZh: '中文产品名称 *',
    price: '起始价格 (SAR) *', moq: '最小起订量 *', desc: '产品描述',
    save: '保存', cancel: '取消', saving: '...',
    needsAttention: '需要处理', acceptedOffer: '报价已接受 — 请添加物流单号',
    footer: 'Maabar © 2026',
    days: '天',
  }
};

export default function DashboardSupplier({ user, profile, lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.zh;
  const [stats, setStats] = useState({ products: 0, offers: 0, messages: 0 });
  const [myOffers, setMyOffers] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [trackingInputs, setTrackingInputs] = useState({});
  const [product, setProduct] = useState({ name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '' });
  const [saving, setSaving] = useState(false);
  const [pendingTracking, setPendingTracking] = useState([]);

  useEffect(() => {
    const navEl = document.querySelector('nav');
    if (navEl) navEl.classList.add('scrolled');
    return () => { if (navEl) navEl.classList.remove('scrolled'); };
  }, []);

  useEffect(() => {
    if (!user) { nav('/login/supplier'); return; }
    loadStats();
    loadPendingTracking();
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

  const loadPendingTracking = async () => {
    const { data } = await sb.from('offers')
      .select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number)')
      .eq('supplier_id', user.id)
      .eq('status', 'accepted');
    if (data) {
      setPendingTracking(data.filter(o => o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered'));
    }
  };

  const loadMyOffers = async () => {
    const { data } = await sb.from('offers')
      .select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number,shipping_status)')
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
    if (!num) return;
    await sb.from('requests').update({ tracking_number: num, status: 'shipping', shipping_status: 'shipping' }).eq('id', requestId);
    await sb.from('notifications').insert({ user_id: buyerId, type: 'shipped', title_ar: 'طلبك في الطريق — رقم التتبع: ' + num, title_en: 'Your order is on the way — Tracking: ' + num, title_zh: '您的订单已发货 — 跟踪号：' + num, ref_id: requestId, is_read: false });
    loadMyOffers();
    loadPendingTracking();
  };

  const addProduct = async () => {
    if (!product.name_zh || !product.price_from || !product.moq) return;
    setSaving(true);
    const { error } = await sb.from('products').insert({
      supplier_id: user.id,
      name_ar: product.name_ar || product.name_zh,
      name_en: product.name_en || product.name_zh,
      name_zh: product.name_zh,
      price_from: parseFloat(product.price_from),
      moq: product.moq,
      desc_ar: product.desc_ar,
      is_active: true
    });
    setSaving(false);
    if (error) return;
    setProduct({ name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '' });
    setActiveTab('overview');
    loadStats();
  };

  const getTitle = (item) => {
    if (lang === 'zh') return item?.title_zh || item?.title_en || item?.title_ar;
    if (lang === 'en') return item?.title_en || item?.title_ar;
    return item?.title_ar || item?.title_en;
  };

  const name = profile?.company_name || profile?.full_name || user?.email?.split('@')[0];

  const tabs = [
    { id: 'overview', label: t.overview },
    { id: 'offers', label: t.offers },
    { id: 'add-product', label: t.addProduct },
    { id: 'messages', label: t.messages, badge: stats.messages > 0 ? stats.messages : null },
  ];

  const BackBtn = () => (
    <button onClick={() => setActiveTab('overview')} style={{
      background: 'none', border: 'none', color: '#7a7a7a', fontSize: 11,
      cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
      fontFamily: 'var(--font-body)', padding: 0, marginBottom: 32,
      transition: 'color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#2C2C2C'}
      onMouseLeave={e => e.currentTarget.style.color = '#7a7a7a'}>
      {t.back}
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
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 24, fontFamily: 'var(--font-body)' }}>
          {t.tag}
        </p>
        <h1 style={{ fontSize: 64, fontWeight: 300, fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)', marginBottom: 16, color: '#F7F5F2', letterSpacing: lang === 'ar' ? 0 : -1, lineHeight: 1.1 }}>
          {t.welcome} {name}
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 44, fontWeight: 300, lineHeight: 1.7, fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit', maxWidth: 460 }}>
          {t.desc}
        </p>

        {/* TABS */}
        <div style={{ display: 'flex' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '1px solid rgba(255,255,255,0.7)' : '1px solid transparent',
              color: activeTab === tab.id ? '#F7F5F2' : 'rgba(255,255,255,0.35)',
              fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit',
              letterSpacing: lang === 'zh' ? 0 : 2, textTransform: lang === 'zh' ? 'none' : 'uppercase'
            }}>
              {tab.label}
              {tab.badge && (
                <span style={{ position: 'absolute', top: 8, right: 4, background: '#F7F5F2', color: '#2C2C2C', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tab.badge}
                </span>
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

              {/* PENDING TRACKING */}
              {pendingTracking.length > 0 && (
                <div style={{ marginBottom: 48 }}>
                  <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                    {t.needsAttention} ({pendingTracking.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#E5E0D8' }}>
                    {pendingTracking.map((o, i) => (
                      <div key={i} onClick={() => setActiveTab('offers')} style={{
                        background: '#F7F5F2', padding: '16px 24px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EFECE7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F7F5F2'}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2C', marginBottom: 3 }}>
                            {t.acceptedOffer}
                          </p>
                          <p style={{ fontSize: 11, color: '#7a7a7a', letterSpacing: 0.5 }}>
                            {getTitle(o.requests)}
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
                  {t.stats}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#E5E0D8' }}>
                  <StatCard label={t.offersCount} value={stats.offers} onClick={() => setActiveTab('offers')} />
                  <StatCard label={t.productsCount} value={stats.products} onClick={() => setActiveTab('add-product')} />
                  <StatCard label={t.messagesCount} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                  {t.quickActions}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: '#E5E0D8' }}>
                  <QuickAction title={t.browseRequests} onClick={() => nav('/requests')} primary />
                  <QuickAction title={t.addNewProduct} onClick={() => setActiveTab('add-product')} />
                </div>
              </div>

              <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: '#7a7a7a', fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#2C2C2C'}
                onMouseLeave={e => e.currentTarget.style.color = '#7a7a7a'}>
                {t.backHome}
              </button>
            </div>
          )}

          {/* MY OFFERS */}
          {activeTab === 'offers' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, color: '#2C2C2C', letterSpacing: lang === 'ar' ? 0 : -1, fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>
                {t.myOffers}
              </h2>
              {myOffers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ fontSize: 14, color: '#7a7a7a', marginBottom: 24 }}>{t.noOffers}</p>
                  <button onClick={() => nav('/requests')} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '12px 28px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                    {t.browseReqs}
                  </button>
                </div>
              )}
              {myOffers.map((o, idx) => (
                <div key={o.id} style={{ borderTop: '1px solid #E5E0D8', padding: '28px 0', animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 400, color: '#2C2C2C' }}>
                      {getTitle(o.requests)}
                    </h3>
                    <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#7a7a7a' }}>
                      {OFFER_STATUS[lang]?.[o.status] || o.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, color: '#7a7a7a', fontSize: 13, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ color: '#2C2C2C', fontSize: 28, fontWeight: 300, fontFamily: 'var(--font-en)' }}>
                      {o.price} <span style={{ fontSize: 13, color: '#7a7a7a' }}>SAR</span>
                    </span>
                    <span>MOQ: {o.moq}</span>
                    <span>{o.delivery_days} {t.days}</span>
                  </div>

                  {o.status === 'accepted' && o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered' && (
                    <div style={{ marginBottom: 16, padding: '16px', background: '#EFECE7' }}>
                      <p style={{ fontSize: 13, marginBottom: 12, color: '#2C2C2C' }}>{t.trackingPrompt}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input" style={{ maxWidth: 240 }}
                          placeholder={t.trackingNum}
                          value={trackingInputs[o.request_id] || ''}
                          onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))}
                        />
                        <button onClick={() => submitTracking(o.request_id, o.requests?.buyer_id)} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '10px 20px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 2 }}>
                          {t.send}
                        </button>
                      </div>
                    </div>
                  )}

                  {o.requests?.tracking_number && (
                    <p style={{ fontSize: 13, marginBottom: 12, padding: '10px 14px', background: '#EFECE7' }}>
                      {t.tracking} <strong>{o.requests.tracking_number}</strong>
                    </p>
                  )}

                  {o.status === 'accepted' && o.requests?.buyer_id && (
                    <button onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '10px 20px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 2 }}>
                      {t.contactTrader}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === 'messages' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>
                {t.messagesTitle}
              </h2>
              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ color: '#7a7a7a', fontSize: 13 }}>{t.noMessages}</p>
                </div>
              ) : inbox.map((m, idx) => {
                const senderName = m.profiles?.full_name || m.profiles?.company_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 20,
                    padding: '20px 0', borderTop: '1px solid #E5E0D8',
                    cursor: 'pointer', transition: 'opacity 0.2s',
                    animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#2C2C2C', color: '#F7F5F2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
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

          {/* ADD PRODUCT */}
          {activeTab === 'add-product' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>
                {t.addProductTitle}
              </h2>
              <div style={{ background: 'rgba(247,245,242,0.95)', border: '1px solid #E5E0D8', padding: 36, maxWidth: 700 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t.nameZh}</label>
                    <input className="form-input" value={product.name_zh} onChange={e => setProduct({ ...product, name_zh: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.nameEn}</label>
                    <input className="form-input" value={product.name_en} onChange={e => setProduct({ ...product, name_en: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.nameAr}</label>
                    <input className="form-input" value={product.name_ar} onChange={e => setProduct({ ...product, name_ar: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.price}</label>
                    <input className="form-input" type="number" value={product.price_from} onChange={e => setProduct({ ...product, price_from: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.moq}</label>
                    <input className="form-input" value={product.moq} onChange={e => setProduct({ ...product, moq: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t.desc}</label>
                  <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={product.desc_ar} onChange={e => setProduct({ ...product, desc_ar: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={addProduct} disabled={saving} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '11px 28px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                    {saving ? t.saving : t.save}
                  </button>
                  <button onClick={() => setActiveTab('overview')} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '11px 24px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                    {t.cancel}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.5 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{t.footer}</p>
      </footer>
    </div>
  );
}

function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{ background: highlight ? '#2C2C2C' : '#F7F5F2', padding: '32px 28px', cursor: 'pointer', transition: 'all 0.25s' }}
      onMouseEnter={e => e.currentTarget.style.background = highlight ? '#3a3a3a' : '#EFECE7'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? '#2C2C2C' : '#F7F5F2'}>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: highlight ? 'rgba(255,255,255,0.4)' : '#7a7a7a', marginBottom: 20 }}>{label}</p>
      <p style={{ fontSize: 64, fontWeight: 300, color: highlight ? '#F7F5F2' : '#2C2C2C', lineHeight: 1, fontFamily: "'Inter', sans-serif" }}>{value}</p>
    </div>
  );
}

function QuickAction({ title, onClick, primary }) {
  return (
    <div onClick={onClick} style={{ padding: '28px 24px', background: primary ? '#2C2C2C' : '#F7F5F2', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.background = primary ? '#3a3a3a' : '#EFECE7'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? '#2C2C2C' : '#F7F5F2'}>
      <p style={{ fontSize: 14, fontWeight: 500, color: primary ? '#F7F5F2' : '#2C2C2C', letterSpacing: 0.3 }}>{title}</p>
    </div>
  );
}