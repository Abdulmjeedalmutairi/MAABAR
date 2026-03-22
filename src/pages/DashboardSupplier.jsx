import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

const CATEGORIES = {
  ar: [
    { val: 'all', label: 'الكل' },
    { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture', label: 'أثاث' },
    { val: 'clothing', label: 'ملابس' },
    { val: 'building', label: 'مواد بناء' },
    { val: 'food', label: 'غذاء' },
    { val: 'other', label: 'أخرى' },
  ],
  en: [
    { val: 'all', label: 'All' },
    { val: 'electronics', label: 'Electronics' },
    { val: 'furniture', label: 'Furniture' },
    { val: 'clothing', label: 'Clothing' },
    { val: 'building', label: 'Building Materials' },
    { val: 'food', label: 'Food' },
    { val: 'other', label: 'Other' },
  ],
  zh: [
    { val: 'all', label: '全部' },
    { val: 'electronics', label: '电子产品' },
    { val: 'furniture', label: '家具' },
    { val: 'clothing', label: '服装' },
    { val: 'building', label: '建材' },
    { val: 'food', label: '食品' },
    { val: 'other', label: '其他' },
  ],
};

const OFFER_STATUS = {
  ar: { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' },
  en: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' },
  zh: { pending: '待审核', accepted: '已接受', rejected: '已拒绝' },
};

const T = {
  ar: {
    tag: 'مَعبر · لوحة المورد',
    welcome: 'أهلاً،',
    desc: 'تابع عروضك ومنتجاتك ورسائلك من مكان واحد',
    overview: 'نظرة عامة', myProducts: 'منتجاتي', offers: 'عروضي',
    addProduct: 'إضافة منتج', messages: 'الرسائل',
    offersCount: 'عروض مقدمة', productsCount: 'منتجات نشطة', messagesCount: 'رسائل جديدة',
    browseRequests: 'تصفح طلبات التجار', addNewProduct: 'إضافة منتج جديد',
    quickActions: 'الإجراءات السريعة', stats: 'الإحصائيات',
    backHome: 'العودة للرئيسية →', back: 'رجوع →',
    myOffers: 'عروضي', noOffers: 'ما قدمت عروض بعد', browseReqs: 'تصفح الطلبات',
    trackingPrompt: 'أدخل رقم التتبع لإخطار التاجر', trackingNum: 'رقم التتبع', send: 'إرسال',
    contactTrader: 'تواصل مع التاجر', tracking: 'رقم التتبع:',
    messagesTitle: 'الرسائل', noMessages: 'ما عندك رسائل بعد',
    addProductTitle: 'إضافة منتج جديد', myProductsTitle: 'منتجاتي', noProducts: 'ما أضفت منتجات بعد',
    nameAr: 'اسم المنتج بالعربي', nameEn: 'اسم المنتج بالإنجليزي', nameZh: 'اسم المنتج بالصيني *',
    price: 'السعر من (ريال) *', moq: 'MOQ *', descLabel: 'الوصف',
    save: 'حفظ', cancel: 'إلغاء', saving: '...',
    edit: 'تعديل', delete: 'حذف', confirmDelete: 'هل تبي تحذف هذا المنتج؟',
    active: 'نشط', inactive: 'موقوف', toggleActive: 'تفعيل/إيقاف',
    needsAttention: 'يحتاج انتباهك', acceptedOffer: 'عرض مقبول — أضف رقم التتبع',
    offerRejected: 'تم رفض عرضك على',
    uploadImage: 'رفع صورة', uploadVideo: 'رفع فيديو',
    uploadingImage: 'جاري رفع الصورة...', uploadingVideo: 'جاري رفع الفيديو...',
    imageUploaded: 'تم رفع الصورة', videoUploaded: 'تم رفع الفيديو',
    maxVideo: 'الحد الأقصى للفيديو 50MB',
    sampleSettings: 'إعدادات العينة',
    sampleAvailable: 'متاح للعينة',
    samplePrice: 'سعر العينة (ريال) *',
    sampleShipping: 'تكلفة الشحن (ريال)',
    sampleMaxQty: 'الحد الأقصى للكمية',
    sampleNote: 'ملاحظة للعينة',
    footer: 'مَعبر © 2026', days: 'يوم',
  },
  en: {
    tag: 'Maabar · Supplier Dashboard',
    welcome: 'Welcome,',
    desc: 'Manage your offers, products and messages in one place',
    overview: 'Overview', myProducts: 'My Products', offers: 'My Offers',
    addProduct: 'Add Product', messages: 'Messages',
    offersCount: 'Offers Submitted', productsCount: 'Active Products', messagesCount: 'New Messages',
    browseRequests: 'Browse Trader Requests', addNewProduct: 'Add New Product',
    quickActions: 'Quick Actions', stats: 'Overview',
    backHome: '← Back to Home', back: '← Back',
    myOffers: 'My Offers', noOffers: 'No offers yet', browseReqs: 'Browse Requests',
    trackingPrompt: 'Enter tracking number to notify buyer', trackingNum: 'Tracking number', send: 'Send',
    contactTrader: 'Contact Trader', tracking: 'Tracking:',
    messagesTitle: 'Messages', noMessages: 'No messages yet',
    addProductTitle: 'Add New Product', myProductsTitle: 'My Products', noProducts: 'No products yet',
    nameAr: 'Arabic Name', nameEn: 'English Name', nameZh: 'Chinese Name *',
    price: 'Price From (SAR) *', moq: 'MOQ *', descLabel: 'Description',
    save: 'Save', cancel: 'Cancel', saving: '...',
    edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this product?',
    active: 'Active', inactive: 'Paused', toggleActive: 'Toggle',
    needsAttention: 'Needs Attention', acceptedOffer: 'Offer accepted — Add tracking number',
    offerRejected: 'Your offer was rejected on',
    uploadImage: 'Upload Image', uploadVideo: 'Upload Video',
    uploadingImage: 'Uploading image...', uploadingVideo: 'Uploading video...',
    imageUploaded: 'Image uploaded', videoUploaded: 'Video uploaded',
    maxVideo: 'Max video size: 50MB',
    sampleSettings: 'Sample Settings',
    sampleAvailable: 'Available for Sample',
    samplePrice: 'Sample Price (SAR) *',
    sampleShipping: 'Shipping Cost (SAR)',
    sampleMaxQty: 'Max Sample Quantity',
    sampleNote: 'Sample Note',
    footer: 'Maabar © 2026', days: 'days',
  },
  zh: {
    tag: 'Maabar · 供应商控制台',
    welcome: '欢迎，',
    desc: '在一个地方管理您的报价、产品和消息',
    overview: '概览', myProducts: '我的产品', offers: '我的报价',
    addProduct: '添加产品', messages: '消息',
    offersCount: '已提交报价', productsCount: '活跃产品', messagesCount: '新消息',
    browseRequests: '浏览采购商需求', addNewProduct: '添加新产品',
    quickActions: '快速操作', stats: '数据概览',
    backHome: '← 返回首页', back: '← 返回',
    myOffers: '我的报价', noOffers: '暂无报价', browseReqs: '浏览需求',
    trackingPrompt: '输入物流单号以通知采购商', trackingNum: '物流单号', send: '发送',
    contactTrader: '联系采购商', tracking: '物流单号：',
    messagesTitle: '消息', noMessages: '暂无消息',
    addProductTitle: '添加新产品', myProductsTitle: '我的产品', noProducts: '暂无产品',
    nameAr: '阿拉伯语名称', nameEn: '英语名称', nameZh: '中文名称 *',
    price: '起始价格 (SAR) *', moq: '最小起订量 *', descLabel: '产品描述',
    save: '保存', cancel: '取消', saving: '...',
    edit: '编辑', delete: '删除', confirmDelete: '确认删除此产品？',
    active: '上架', inactive: '下架', toggleActive: '切换状态',
    needsAttention: '需要处理', acceptedOffer: '报价已接受 — 请添加物流单号',
    offerRejected: '您的报价被拒绝',
    uploadImage: '上传图片', uploadVideo: '上传视频',
    uploadingImage: '上传图片中...', uploadingVideo: '上传视频中...',
    imageUploaded: '图片已上传', videoUploaded: '视频已上传',
    maxVideo: '视频最大50MB',
    sampleSettings: '样品设置',
    sampleAvailable: '可提供样品',
    samplePrice: '样品价格 (SAR) *',
    sampleShipping: '运费 (SAR)',
    sampleMaxQty: '最大样品数量',
    sampleNote: '样品备注',
    footer: 'Maabar © 2026', days: '天',
  }
};

const SkeletonCard = () => (
  <div style={{ borderTop: '1px solid #E5E0D8', padding: '28px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ width: '40%', height: 18, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '25%', height: 14, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
      </div>
      <div style={{ width: 80, height: 32, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
    </div>
  </div>
);

const emptyProduct = { name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '', sample_available: false, sample_price: '', sample_shipping: '', sample_max_qty: '3', sample_note: '' };

export default function DashboardSupplier({ user, profile, lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.zh;
  const cats = CATEGORIES[lang] || CATEGORIES.ar;
  const isAr = lang === 'ar';

  const [stats, setStats] = useState({ products: 0, offers: 0, messages: 0 });
  const [myOffers, setMyOffers] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeCat, setActiveCat] = useState('all');
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [product, setProduct] = useState(emptyProduct);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingTracking, setPendingTracking] = useState([]);
  const [rejectedOffers, setRejectedOffers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [offerForms, setOfferForms] = useState({});
  const [offers, setOffers] = useState({});
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const editImageRef = useRef(null);
  const editVideoRef = useRef(null);

  useEffect(() => {
    const navEl = document.querySelector('nav');
    if (navEl) navEl.classList.add('scrolled');
    return () => { if (navEl) navEl.classList.remove('scrolled'); };
  }, []);

  useEffect(() => {
    if (!user) { nav('/login/supplier'); return; }
    loadStats();
    loadPendingTracking();
    loadRejectedOffers();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'offers') loadMyOffers();
    if (activeTab === 'messages') loadInbox();
    if (activeTab === 'my-products') loadMyProducts();
    if (activeTab === 'requests') loadRequests();
    if (activeTab === 'add-product') { setEditingProduct(null); setProduct(emptyProduct); }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'requests') loadRequests();
  }, [activeCat]);

  const loadStats = async () => {
    const [products, offersData, messages] = await Promise.all([
      sb.from('products').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('is_active', true),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
    ]);
    setStats({ products: products.count || 0, offers: offersData.count || 0, messages: messages.count || 0 });
  };

  const loadPendingTracking = async () => {
    const { data } = await sb.from('offers')
      .select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number)')
      .eq('supplier_id', user.id).eq('status', 'accepted');
    if (data) setPendingTracking(data.filter(o => o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered'));
  };

  const loadRejectedOffers = async () => {
    const { data } = await sb.from('offers')
      .select('*,requests(title_ar,title_en,title_zh)')
      .eq('supplier_id', user.id).eq('status', 'rejected').eq('seen', false);
    if (data) setRejectedOffers(data);
  };

  const dismissRejected = async (offerId) => {
    await sb.from('offers').update({ seen: true }).eq('id', offerId);
    setRejectedOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const loadMyOffers = async () => {
    setLoadingOffers(true);
    const { data } = await sb.from('offers')
      .select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number,shipping_status)')
      .eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyOffers(data);
    setLoadingOffers(false);
  };

  const loadMyProducts = async () => {
    setLoadingProducts(true);
    const { data } = await sb.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyProducts(data);
    setLoadingProducts(false);
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    let query = sb.from('requests').select('*,profiles(full_name,company_name)').eq('status', 'open').order('created_at', { ascending: false });
    if (activeCat !== 'all') query = query.eq('category', activeCat);
    const { data } = await query;
    if (data) setRequests(data);
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

  // رفع صورة
  const uploadFile = async (file, type, isEdit = false) => {
    if (!file) return null;
    const isVideo = type === 'video';
    if (isVideo && file.size > 50 * 1024 * 1024) { alert(t.maxVideo); return null; }
    isVideo ? setUploadingVideo(true) : setUploadingImage(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    isVideo ? setUploadingVideo(false) : setUploadingImage(false);
    if (error) { alert(isAr ? 'فشل الرفع' : 'Upload failed'); return null; }
    return STORAGE_URL + path;
  };

  const handleImageUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(file, 'image', isEdit);
    if (!url) return;
    if (isEdit) setEditingProduct(prev => ({ ...prev, image_url: url }));
    else setProduct(prev => ({ ...prev, image_url: url }));
  };

  const handleVideoUpload = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadFile(file, 'video', isEdit);
    if (!url) return;
    if (isEdit) setEditingProduct(prev => ({ ...prev, video_url: url }));
    else setProduct(prev => ({ ...prev, video_url: url }));
  };

  const addProduct = async () => {
    if (!product.name_zh || !product.price_from || !product.moq) return;
    setSaving(true);
    await sb.from('products').insert({
      supplier_id: user.id,
      name_ar: product.name_ar || product.name_zh,
      name_en: product.name_en || product.name_zh,
      name_zh: product.name_zh,
      price_from: parseFloat(product.price_from),
      moq: product.moq,
      desc_ar: product.desc_ar,
      image_url: product.image_url || null,
      video_url: product.video_url || null,
      sample_available: product.sample_available,
      sample_price: product.sample_available ? parseFloat(product.sample_price) : null,
      sample_shipping: product.sample_available ? parseFloat(product.sample_shipping || 0) : null,
      sample_max_qty: product.sample_available ? parseInt(product.sample_max_qty || 3) : null,
      sample_note: product.sample_note || null,
      is_active: true,
    });
    setSaving(false);
    setProduct(emptyProduct);
    setActiveTab('my-products');
    loadStats();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    await sb.from('products').update({
      name_ar: editingProduct.name_ar,
      name_en: editingProduct.name_en,
      name_zh: editingProduct.name_zh,
      price_from: parseFloat(editingProduct.price_from),
      moq: editingProduct.moq,
      desc_ar: editingProduct.desc_ar,
      image_url: editingProduct.image_url || null,
      video_url: editingProduct.video_url || null,
      sample_available: editingProduct.sample_available,
      sample_price: editingProduct.sample_available ? parseFloat(editingProduct.sample_price) : null,
      sample_shipping: editingProduct.sample_available ? parseFloat(editingProduct.sample_shipping || 0) : null,
      sample_max_qty: editingProduct.sample_available ? parseInt(editingProduct.sample_max_qty || 3) : null,
      sample_note: editingProduct.sample_note || null,
    }).eq('id', editingProduct.id);
    setSaving(false);
    setEditingProduct(null);
    loadMyProducts();
    loadStats();
  };

  const toggleProductActive = async (p) => {
    await sb.from('products').update({ is_active: !p.is_active }).eq('id', p.id);
    loadMyProducts(); loadStats();
  };

  const deleteProduct = async (id) => {
    if (!window.confirm(t.confirmDelete)) return;
    await sb.from('products').delete().eq('id', id);
    loadMyProducts(); loadStats();
  };

  const toggleOfferForm = (id) => {
    setOfferForms(prev => ({ ...prev, [id]: !prev[id] }));
    setOffers(prev => ({ ...prev, [id]: prev[id] || { price: '', moq: '', days: '', origin: 'China', note: '' } }));
  };

  const submitOffer = async (requestId, buyerId) => {
    const o = offers[requestId];
    if (!o?.price || !o?.moq || !o?.days) { alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Fill required fields'); return; }
    const { error } = await sb.from('offers').insert({
      request_id: requestId, supplier_id: user.id,
      price: parseFloat(o.price), moq: o.moq,
      delivery_days: parseInt(o.days), origin: o.origin, note: o.note, status: 'pending'
    });
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    await sb.from('notifications').insert({
      user_id: buyerId, type: 'new_offer',
      title_ar: 'وصلك عرض جديد على طلبك',
      title_en: 'You received a new offer',
      title_zh: '您收到了新报价',
      ref_id: requestId, is_read: false
    });
    alert(isAr ? '✅ تم إرسال عرضك!' : '✅ Offer submitted!');
    toggleOfferForm(requestId);
    loadRequests();
  };

  const submitTracking = async (requestId, buyerId) => {
    const num = trackingInputs[requestId];
    if (!num) return;
    await sb.from('requests').update({ tracking_number: num, status: 'shipping', shipping_status: 'shipping' }).eq('id', requestId);
    await sb.from('notifications').insert({
      user_id: buyerId, type: 'shipped',
      title_ar: 'طلبك في الطريق — رقم التتبع: ' + num,
      title_en: 'Your order is on the way — Tracking: ' + num,
      title_zh: '您的订单已发货 — 跟踪号：' + num,
      ref_id: requestId, is_read: false
    });
    loadMyOffers(); loadPendingTracking();
  };

  const getTitle = (item) => {
    if (lang === 'zh') return item?.title_zh || item?.title_en || item?.title_ar;
    if (lang === 'en') return item?.title_en || item?.title_ar;
    return item?.title_ar || item?.title_en;
  };

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600) return isAr ? Math.floor(diff / 60) + ' د' : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : Math.floor(diff / 86400) + 'd';
  };

  const name = profile?.company_name || profile?.full_name || user?.email?.split('@')[0];
  const pendingCount = pendingTracking.length + rejectedOffers.length;

  const tabs = [
    { id: 'overview', label: t.overview },
    { id: 'requests', label: isAr ? 'الطلبات' : lang === 'zh' ? '需求' : 'Requests' },
    { id: 'my-products', label: t.myProducts },
    { id: 'offers', label: t.offers },
    { id: 'add-product', label: t.addProduct },
    { id: 'messages', label: t.messages, badge: stats.messages > 0 ? stats.messages : null },
  ];

  const BackBtn = () => (
    <button onClick={() => setActiveTab('overview')} style={{
      background: 'none', border: 'none', color: '#7a7a7a', fontSize: 11,
      cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
      fontFamily: 'var(--font-body)', padding: 0, marginBottom: 32, transition: 'color 0.2s'
    }}
      onMouseEnter={e => e.currentTarget.style.color = '#2C2C2C'}
      onMouseLeave={e => e.currentTarget.style.color = '#7a7a7a'}>
      {t.back}
    </button>
  );

  // فورم المنتج — مشترك بين إضافة وتعديل
  const ProductForm = ({ data, setData, onSave, onCancel, isEdit, imgRef, vidRef, onImgChange, onVidChange }) => (
    <div style={{ background: 'rgba(247,245,242,0.95)', border: '1px solid #E5E0D8', padding: 36, maxWidth: 700 }}>

      {/* الصورة والفيديو */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* صورة */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 10, textTransform: 'uppercase' }}>{t.uploadImage}</p>
          <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onImgChange} />
          <div onClick={() => imgRef.current?.click()} style={{
            width: '100%', height: 120, border: '1px dashed #E5E0D8',
            borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', background: '#FAFAF8', transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2C2C2C'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E0D8'}>
            {uploadingImage ? (
              <p style={{ fontSize: 11, color: '#7a7a7a' }}>{t.uploadingImage}</p>
            ) : data.image_url ? (
              <img src={data.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <p style={{ fontSize: 11, color: '#7a7a7a' }}>+ {t.uploadImage}</p>
            )}
          </div>
          {data.image_url && <p style={{ fontSize: 10, color: '#2d7a4f', marginTop: 6 }}>✓ {t.imageUploaded}</p>}
        </div>

        {/* فيديو */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 10, textTransform: 'uppercase' }}>{t.uploadVideo}</p>
          <input ref={vidRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onVidChange} />
          <div onClick={() => vidRef.current?.click()} style={{
            width: '100%', height: 120, border: '1px dashed #E5E0D8',
            borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', background: '#FAFAF8', transition: 'border-color 0.2s',
            flexDirection: 'column', gap: 4,
          }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2C2C2C'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E0D8'}>
            {uploadingVideo ? (
              <p style={{ fontSize: 11, color: '#7a7a7a' }}>{t.uploadingVideo}</p>
            ) : data.video_url ? (
              <video src={data.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
            ) : (
              <>
                <p style={{ fontSize: 11, color: '#7a7a7a' }}>+ {t.uploadVideo}</p>
                <p style={{ fontSize: 9, color: '#7a7a7a', opacity: 0.6 }}>{t.maxVideo}</p>
              </>
            )}
          </div>
          {data.video_url && <p style={{ fontSize: 10, color: '#2d7a4f', marginTop: 6 }}>✓ {t.videoUploaded}</p>}
        </div>
      </div>

      {/* حقول الاسم */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">{t.nameZh}</label>
          <input className="form-input" value={data.name_zh || ''} onChange={e => setData({ ...data, name_zh: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t.nameEn}</label>
          <input className="form-input" value={data.name_en || ''} onChange={e => setData({ ...data, name_en: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t.nameAr}</label>
          <input className="form-input" value={data.name_ar || ''} onChange={e => setData({ ...data, name_ar: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t.price}</label>
          <input className="form-input" type="number" value={data.price_from || ''} onChange={e => setData({ ...data, price_from: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">{t.moq}</label>
          <input className="form-input" value={data.moq || ''} onChange={e => setData({ ...data, moq: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">{t.descLabel}</label>
        <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={data.desc_ar || ''} onChange={e => setData({ ...data, desc_ar: e.target.value })} />
      </div>

      {/* إعدادات العينة */}
      <div style={{ marginTop: 24, padding: '20px', background: '#F0EDE8', borderRadius: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: data.sample_available ? 20 : 0 }}>
          <input type="checkbox" id="sample_toggle" checked={data.sample_available || false}
            onChange={e => setData({ ...data, sample_available: e.target.checked })}
            style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="sample_toggle" style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2C', cursor: 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
            {t.sampleAvailable}
          </label>
        </div>

        {data.sample_available && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeIn 0.3s ease' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.samplePrice}</label>
              <input className="form-input" type="number" value={data.sample_price || ''}
                onChange={e => setData({ ...data, sample_price: e.target.value })} placeholder="50" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.sampleShipping}</label>
              <input className="form-input" type="number" value={data.sample_shipping || ''}
                onChange={e => setData({ ...data, sample_shipping: e.target.value })} placeholder="30" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.sampleMaxQty}</label>
              <input className="form-input" type="number" value={data.sample_max_qty || '3'}
                onChange={e => setData({ ...data, sample_max_qty: e.target.value })} placeholder="3" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{t.sampleNote}</label>
              <input className="form-input" value={data.sample_note || ''}
                onChange={e => setData({ ...data, sample_note: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <button onClick={onSave} disabled={saving} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '11px 28px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
          {saving ? t.saving : t.save}
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '11px 24px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
          {t.cancel}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HEADER */}
      <div style={{ padding: '60px 60px 0', background: 'rgba(0,0,0,0.38)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 24, fontFamily: 'var(--font-body)' }}>{t.tag}</p>
        <h1 style={{ fontSize: 64, fontWeight: 300, fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)', marginBottom: 16, color: '#F7F5F2', letterSpacing: lang === 'ar' ? 0 : -1, lineHeight: 1.1 }}>
          {t.welcome} {name}
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 44, fontWeight: 300, lineHeight: 1.7, fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit', maxWidth: 460 }}>{t.desc}</p>
        <div style={{ display: 'flex', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '1px solid rgba(255,255,255,0.7)' : '1px solid transparent',
              color: activeTab === tab.id ? '#F7F5F2' : 'rgba(255,255,255,0.35)',
              fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit',
              letterSpacing: lang === 'zh' ? 0 : 2, textTransform: lang === 'zh' ? 'none' : 'uppercase', whiteSpace: 'nowrap',
            }}>
              {tab.label}
              {tab.badge && <span style={{ position: 'absolute', top: 8, right: 4, background: '#F7F5F2', color: '#2C2C2C', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tab.badge}</span>}
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
              {pendingCount > 0 && (
                <div style={{ marginBottom: 48 }}>
                  <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>{t.needsAttention} ({pendingCount})</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#E5E0D8' }}>
                    {pendingTracking.map((o, i) => (
                      <div key={i} onClick={() => setActiveTab('offers')} style={{ background: '#F7F5F2', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#EFECE7'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F7F5F2'}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2C', marginBottom: 3, fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit' }}>{t.acceptedOffer}</p>
                          <p style={{ fontSize: 11, color: '#7a7a7a' }}>{getTitle(o.requests)}</p>
                        </div>
                        <span style={{ fontSize: 18, color: '#2C2C2C', opacity: 0.4 }}>←</span>
                      </div>
                    ))}
                    {rejectedOffers.map((o, i) => (
                      <div key={i} style={{ background: '#F7F5F2', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#c00', fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit' }}>{t.offerRejected}: {getTitle(o.requests)}</p>
                        <button onClick={() => dismissRejected(o.id)} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#7a7a7a', padding: '6px 14px', fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>
                          {isAr ? 'تجاهل' : lang === 'zh' ? '忽略' : 'Dismiss'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>{t.stats}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#E5E0D8' }}>
                  <StatCard label={t.offersCount} value={stats.offers} onClick={() => setActiveTab('offers')} />
                  <StatCard label={t.productsCount} value={stats.products} onClick={() => setActiveTab('my-products')} />
                  <StatCard label={t.messagesCount} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
              </div>
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>{t.quickActions}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#E5E0D8' }}>
                  <QuickAction title={t.browseRequests} onClick={() => setActiveTab('requests')} primary />
                  <QuickAction title={t.myProducts} onClick={() => setActiveTab('my-products')} />
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

          {/* REQUESTS */}
          {activeTab === 'requests' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 24, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>
                {isAr ? 'طلبات التجار' : lang === 'zh' ? '采购需求' : 'Trader Requests'}
              </h2>

              {/* فلتر الكتاغوري */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button key={c.val} onClick={() => setActiveCat(c.val)} style={{
                    padding: '7px 16px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
                    background: activeCat === c.val ? '#2C2C2C' : 'transparent',
                    color: activeCat === c.val ? '#F7F5F2' : '#7a7a7a',
                    border: '1px solid', borderColor: activeCat === c.val ? '#2C2C2C' : '#E5E0D8',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>

              {loadingRequests && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

              {!loadingRequests && requests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ color: '#7a7a7a', fontSize: 14 }}>{isAr ? 'لا توجد طلبات' : 'No requests'}</p>
                </div>
              )}

              {!loadingRequests && requests.map(r => (
                <div key={r.id}>
                  <div style={{ border: '1px solid #E5E0D8', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, marginBottom: offerForms[r.id] ? 0 : 14, background: 'rgba(247,245,242,0.82)', transition: 'all 0.2s', borderRadius: offerForms[r.id] ? '6px 6px 0 0' : 6 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2C2C2C'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.09)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D8'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span className="status-badge status-open">{r.status}</span>
                        {r.category && r.category !== 'other' && (
                          <span style={{ fontSize: 10, padding: '2px 8px', background: '#EFECE7', borderRadius: 20, color: '#7a7a7a', letterSpacing: 1 }}>
                            {cats.find(c => c.val === r.category)?.label || r.category}
                          </span>
                        )}
                        <span style={{ color: '#6b6b6b', fontSize: 12 }}>{fmtDate(r.created_at)}</span>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                        {getTitle(r)}
                      </h3>
                      <div style={{ display: 'flex', gap: 20, color: '#6b6b6b', fontSize: 13, flexWrap: 'wrap' }}>
                        <span>👤 {r.profiles?.full_name || r.profiles?.company_name || ''}</span>
                        <span>📦 {r.quantity || '—'}</span>
                        {r.description && <span style={{ fontSize: 12 }}>{r.description.substring(0, 60)}...</span>}
                      </div>
                    </div>
                    <button style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '11px 24px', fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', borderRadius: 3, transition: 'all 0.2s' }}
                      onClick={() => toggleOfferForm(r.id)}
                      onMouseEnter={e => e.currentTarget.style.background = '#444'}
                      onMouseLeave={e => e.currentTarget.style.background = '#2C2C2C'}>
                      {isAr ? 'قدم عرضك ←' : lang === 'zh' ? '提交报价 →' : 'Submit Quote →'}
                    </button>
                  </div>

                  {offerForms[r.id] && (
                    <div style={{ background: '#F7F5F2', border: '1px solid #E5E0D8', borderTop: 'none', padding: 24, marginBottom: 14, borderRadius: '0 0 6px 6px' }}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'سعر الوحدة (ريال) *' : 'Unit Price (SAR) *'}</label>
                          <input className="form-input" type="number" value={offers[r.id]?.price || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], price: e.target.value } }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">MOQ *</label>
                          <input className="form-input" value={offers[r.id]?.moq || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], moq: e.target.value } }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'مدة التسليم (أيام) *' : 'Delivery Days *'}</label>
                          <input className="form-input" type="number" value={offers[r.id]?.days || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], days: e.target.value } }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'بلد المنشأ' : 'Origin'}</label>
                          <input className="form-input" value={offers[r.id]?.origin || 'China'} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], origin: e.target.value } }))} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{isAr ? 'ملاحظة' : 'Note'}</label>
                        <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={offers[r.id]?.note || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)}>{isAr ? 'إرسال العرض' : lang === 'zh' ? '发送报价' : 'Send Offer'}</button>
                        <button className="btn-outline" onClick={() => toggleOfferForm(r.id)}>{isAr ? 'إلغاء' : t.cancel}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MY PRODUCTS */}
          {activeTab === 'my-products' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 40 }}>
                <h2 style={{ fontSize: 40, fontWeight: 300, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>{t.myProductsTitle}</h2>
                <button onClick={() => setActiveTab('add-product')} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '10px 22px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                  {isAr ? '+ إضافة' : lang === 'zh' ? '+ 添加' : '+ Add'}
                </button>
              </div>

              {loadingProducts && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

              {!loadingProducts && myProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ color: '#7a7a7a', fontSize: 14, marginBottom: 24 }}>{t.noProducts}</p>
                  <button onClick={() => setActiveTab('add-product')} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '12px 28px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                    {t.addNewProduct}
                  </button>
                </div>
              )}

              {!loadingProducts && myProducts.map((p, idx) => (
                <div key={p.id}>
                  {editingProduct?.id === p.id ? (
                    <div style={{ borderTop: '1px solid #E5E0D8', padding: '28px 0', animation: 'fadeIn 0.3s ease' }}>
                      <input ref={editImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, true)} />
                      <input ref={editVideoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoUpload(e, true)} />
                      <ProductForm
                        data={editingProduct} setData={setEditingProduct}
                        onSave={updateProduct} onCancel={() => setEditingProduct(null)}
                        isEdit={true} imgRef={editImageRef} vidRef={editVideoRef}
                        onImgChange={e => handleImageUpload(e, true)}
                        onVidChange={e => handleVideoUpload(e, true)}
                      />
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid #E5E0D8', padding: '20px 0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
                      <div style={{ width: 64, height: 64, borderRadius: 6, background: '#EFECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 26 }}>📦</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit' }}>
                            {lang === 'zh' ? p.name_zh || p.name_en : lang === 'ar' ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                          </p>
                          {p.video_url && <span style={{ fontSize: 9, padding: '2px 8px', background: '#EFECE7', borderRadius: 10, color: '#7a7a7a', letterSpacing: 1 }}>VIDEO</span>}
                          {p.sample_available && <span style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 10, color: '#2d7a4f', letterSpacing: 1 }}>{isAr ? 'عينة' : 'SAMPLE'}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: '#7a7a7a' }}>{p.price_from} SAR · MOQ: {p.moq}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, letterSpacing: 1, padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: p.is_active ? '#2d7a4f' : '#E5E0D8', color: p.is_active ? '#2d7a4f' : '#7a7a7a', background: p.is_active ? 'rgba(45,122,79,0.06)' : 'transparent' }}>
                          {p.is_active ? t.active : t.inactive}
                        </span>
                        <button onClick={() => toggleProductActive(p)} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#7a7a7a', padding: '6px 12px', fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>{t.toggleActive}</button>
                        <button onClick={() => setEditingProduct(p)} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '6px 12px', fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>{t.edit}</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: '1px solid #ffcccc', color: '#c00', padding: '6px 12px', fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>{t.delete}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MY OFFERS */}
          {activeTab === 'offers' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>{t.myOffers}</h2>
              {loadingOffers && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingOffers && myOffers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ fontSize: 14, color: '#7a7a7a', marginBottom: 24 }}>{t.noOffers}</p>
                  <button onClick={() => setActiveTab('requests')} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '12px 28px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>{t.browseReqs}</button>
                </div>
              )}
              {!loadingOffers && myOffers.map((o, idx) => (
                <div key={o.id} style={{ borderTop: '1px solid #E5E0D8', padding: '28px 0', animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 400, color: '#2C2C2C' }}>{getTitle(o.requests)}</h3>
                    <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 12px', borderRadius: 20, border: '1px solid', borderColor: o.status === 'accepted' ? '#2d7a4f' : o.status === 'rejected' ? '#ffcccc' : '#E5E0D8', color: o.status === 'accepted' ? '#2d7a4f' : o.status === 'rejected' ? '#c00' : '#7a7a7a' }}>
                      {OFFER_STATUS[lang]?.[o.status] || o.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, color: '#7a7a7a', fontSize: 13, marginBottom: 20, flexWrap: 'wrap' }}>
                    <span style={{ color: '#2C2C2C', fontSize: 28, fontWeight: 300, fontFamily: 'var(--font-en)' }}>{o.price} <span style={{ fontSize: 13, color: '#7a7a7a' }}>SAR</span></span>
                    <span>MOQ: {o.moq}</span>
                    <span>{o.delivery_days} {t.days}</span>
                  </div>
                  {o.status === 'accepted' && o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered' && (
                    <div style={{ marginBottom: 16, padding: '16px', background: '#EFECE7' }}>
                      <p style={{ fontSize: 13, marginBottom: 12, color: '#2C2C2C', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{t.trackingPrompt}</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input" style={{ maxWidth: 240 }} placeholder={t.trackingNum} value={trackingInputs[o.request_id] || ''} onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))} />
                        <button onClick={() => submitTracking(o.request_id, o.requests?.buyer_id)} style={{ background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '10px 20px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 2 }}>{t.send}</button>
                      </div>
                    </div>
                  )}
                  {o.requests?.tracking_number && (
                    <p style={{ fontSize: 13, marginBottom: 12, padding: '10px 14px', background: '#EFECE7' }}>{t.tracking} <strong>{o.requests.tracking_number}</strong></p>
                  )}
                  {o.status === 'accepted' && o.requests?.buyer_id && (
                    <button onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '10px 20px', fontSize: 11, letterSpacing: 2, cursor: 'pointer', borderRadius: 2 }}>{t.contactTrader}</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MESSAGES */}
          {activeTab === 'messages' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <BackBtn />
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>{t.messagesTitle}</h2>
              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid #E5E0D8' }}>
                  <p style={{ color: '#7a7a7a', fontSize: 13 }}>{t.noMessages}</p>
                </div>
              ) : inbox.map((m, idx) => {
                const senderName = m.profiles?.full_name || m.profiles?.company_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0', borderTop: '1px solid #E5E0D8', cursor: 'pointer', transition: 'opacity 0.2s', animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}
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
              <h2 style={{ fontSize: 40, fontWeight: 300, marginBottom: 40, color: '#2C2C2C', fontFamily: lang === 'ar' ? 'var(--font-ar)' : lang === 'zh' ? 'inherit' : 'var(--font-en)' }}>{t.addProductTitle}</h2>
              <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, false)} />
              <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoUpload(e, false)} />
              <ProductForm
                data={product} setData={setProduct}
                onSave={addProduct} onCancel={() => setActiveTab('overview')}
                isEdit={false} imgRef={imageRef} vidRef={videoRef}
                onImgChange={e => handleImageUpload(e, false)}
                onVidChange={e => handleVideoUpload(e, false)}
              />
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