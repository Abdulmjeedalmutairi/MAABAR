import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';
import Footer from '../components/Footer';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

// جلب سعر الصرف USD → SAR
const getUsdToSar = async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    return data?.rates?.SAR || 3.75;
  } catch {
    return 3.75; // fallback ثابت
  }
};

const CATEGORIES = {
  ar: [
    { val: 'all', label: 'الكل' }, { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture', label: 'أثاث' }, { val: 'clothing', label: 'ملابس' },
    { val: 'building', label: 'مواد بناء' }, { val: 'food', label: 'غذاء' }, { val: 'other', label: 'أخرى' },
  ],
  en: [
    { val: 'all', label: 'All' }, { val: 'electronics', label: 'Electronics' },
    { val: 'furniture', label: 'Furniture' }, { val: 'clothing', label: 'Clothing' },
    { val: 'building', label: 'Building Materials' }, { val: 'food', label: 'Food' }, { val: 'other', label: 'Other' },
  ],
  zh: [
    { val: 'all', label: '全部' }, { val: 'electronics', label: '电子产品' },
    { val: 'furniture', label: '家具' }, { val: 'clothing', label: '服装' },
    { val: 'building', label: '建材' }, { val: 'food', label: '食品' }, { val: 'other', label: '其他' },
  ],
};

const OFFER_STATUS = {
  ar: { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' },
  en: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' },
  zh: { pending: '待审核', accepted: '已接受', rejected: '已拒绝' },
};

const T = {
  ar: {
    tag: 'مَعبر · لوحة المورد', welcome: 'أهلاً،', desc: 'تابع عروضك ومنتجاتك ورسائلك من مكان واحد',
    overview: 'نظرة عامة', myProducts: 'منتجاتي', offers: 'عروضي', addProduct: 'إضافة منتج',
    messages: 'الرسائل', settings: 'إعداداتي', offersCount: 'عروض مقدمة',
    productsCount: 'منتجات نشطة', messagesCount: 'رسائل جديدة',
    browseRequests: 'تصفح طلبات التجار', addNewProduct: 'إضافة منتج جديد',
    quickActions: 'الإجراءات السريعة', stats: 'الإحصائيات', backHome: 'العودة للرئيسية ←', back: 'رجوع ←',
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
    imageUploaded: 'تم رفع الصورة', videoUploaded: 'تم رفع الفيديو', maxVideo: 'الحد الأقصى للفيديو 50MB',
    sampleSettings: 'إعدادات العينة', sampleAvailable: 'متاح للعينة',
    samplePrice: 'سعر العينة (ريال) *', sampleShipping: 'تكلفة الشحن (ريال)',
    sampleMaxQty: 'الحد الأقصى للكمية', sampleNote: 'ملاحظة للعينة',
    settingsTitle: 'إعدادات الحساب', companyName: 'اسم الشركة',
    bioAr: 'وصف الشركة بالعربي', bioEn: 'وصف الشركة بالإنجليزي', bioZh: 'وصف الشركة بالصيني',
    whatsapp: 'واتساب', wechat: 'WeChat', city: 'المدينة', country: 'الدولة',
    tradeLink: 'رابط صفحتك التجارية', speciality: 'تخصص الشركة', minOrder: 'أقل قيمة طلب (ريال)',
    logo: 'لوقو / صورة الشركة', factoryImages: 'صور المصنع (حتى 3)',
    uploadLogo: 'رفع اللوقو', uploadFactory: 'إضافة صورة', uploadingLogo: 'جاري الرفع...',
    saveSettings: 'حفظ الإعدادات', settingsSaved: 'تم حفظ التغييرات', days: 'يوم',
  },
  en: {
    tag: 'Maabar · Supplier Dashboard', welcome: 'Welcome,', desc: 'Manage your offers, products and messages in one place',
    overview: 'Overview', myProducts: 'My Products', offers: 'My Offers', addProduct: 'Add Product',
    messages: 'Messages', settings: 'Settings', offersCount: 'Offers Submitted',
    productsCount: 'Active Products', messagesCount: 'New Messages',
    browseRequests: 'Browse Trader Requests', addNewProduct: 'Add New Product',
    quickActions: 'Quick Actions', stats: 'Overview', backHome: '← Back to Home', back: '← Back',
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
    uploadingImage: 'Uploading...', uploadingVideo: 'Uploading...',
    imageUploaded: 'Image uploaded', videoUploaded: 'Video uploaded', maxVideo: 'Max 50MB',
    sampleSettings: 'Sample Settings', sampleAvailable: 'Available for Sample',
    samplePrice: 'Sample Price (SAR) *', sampleShipping: 'Shipping Cost (SAR)',
    sampleMaxQty: 'Max Sample Qty', sampleNote: 'Sample Note',
    settingsTitle: 'Account Settings', companyName: 'Company Name',
    bioAr: 'Description (Arabic)', bioEn: 'Description (English)', bioZh: 'Description (Chinese)',
    whatsapp: 'WhatsApp', wechat: 'WeChat', city: 'City', country: 'Country',
    tradeLink: 'Business Profile Link', speciality: 'Specialty', minOrder: 'Min Order Value (SAR)',
    logo: 'Company Logo', factoryImages: 'Factory Images (up to 3)',
    uploadLogo: 'Upload Logo', uploadFactory: 'Add Image', uploadingLogo: 'Uploading...',
    saveSettings: 'Save Settings', settingsSaved: 'Changes saved', days: 'days',
  },
  zh: {
    tag: 'Maabar · 供应商控制台', welcome: '欢迎，', desc: '在一个地方管理您的报价、产品和消息',
    overview: '概览', myProducts: '我的产品', offers: '我的报价', addProduct: '添加产品',
    messages: '消息', settings: '账户设置', offersCount: '已提交报价',
    productsCount: '活跃产品', messagesCount: '新消息',
    browseRequests: '浏览采购商需求', addNewProduct: '添加新产品',
    quickActions: '快速操作', stats: '数据概览', backHome: '← 返回首页', back: '← 返回',
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
    uploadingImage: '上传中...', uploadingVideo: '上传中...',
    imageUploaded: '图片已上传', videoUploaded: '视频已上传', maxVideo: '最大50MB',
    sampleSettings: '样品设置', sampleAvailable: '可提供样品',
    samplePrice: '样品价格 (SAR) *', sampleShipping: '运费 (SAR)',
    sampleMaxQty: '最大样品数量', sampleNote: '样品备注',
    settingsTitle: '账户设置', companyName: '公司名称',
    bioAr: '公司介绍（阿拉伯语）', bioEn: '公司介绍（英语）', bioZh: '公司介绍（中文）',
    whatsapp: 'WhatsApp', wechat: 'WeChat', city: '城市', country: '国家',
    tradeLink: '商业主页链接', speciality: '专业领域', minOrder: '最小订单金额 (SAR)',
    logo: '公司Logo', factoryImages: '工厂图片（最多3张）',
    uploadLogo: '上传Logo', uploadFactory: '添加图片', uploadingLogo: '上传中...',
    saveSettings: '保存设置', settingsSaved: '保存成功', days: '天',
  },
};

/* ─── Skeleton ───────────────────────────── */
const SkeletonCard = () => (
  <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '40%', height: 14, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ width: 72, height: 32, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    </div>
  </div>
);

/* ─── Stat Card ──────────────────────────── */
function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${highlight ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      padding: '24px 28px', cursor: 'pointer', transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 44, fontWeight: 300, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1, letterSpacing: -1.5 }}>{value}</p>
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
      cursor: 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

/* ─── Back Button ────────────────────────── */
function BackBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: 'var(--text-disabled)',
      fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)', padding: 0, marginBottom: 32, transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
      {label}
    </button>
  );
}

const emptyProduct = { name_ar: '', name_en: '', name_zh: '', price_from: '', moq: '', desc_ar: '', sample_available: false, sample_price: '', sample_shipping: '', sample_max_qty: '3', sample_note: '' };

/* ─── Product Form (defined outside to prevent remount on parent render) ─ */
function ProductForm({ data, setData, onSave, onCancel, imgRef, vidRef, onImgChange, onVidChange, uploadingImage, uploadingVideo, t, isAr, saving, usdRate }) {
  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '28px 32px', maxWidth: 680, borderRadius: 'var(--radius-xl)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {[{ label: t.uploadImage, ref: imgRef, onChange: onImgChange, loading: uploadingImage, loadingLabel: t.uploadingImage, url: data.image_url, doneLabel: t.imageUploaded, isImg: true },
          { label: t.uploadVideo, ref: vidRef, onChange: onVidChange, loading: uploadingVideo, loadingLabel: t.uploadingVideo, url: data.video_url, doneLabel: t.videoUploaded, isImg: false }
        ].map((up, i) => (
          <div key={i}>
            <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 8, textTransform: 'uppercase' }}>{up.label}</p>
            <input ref={up.ref} type="file" accept={up.isImg ? 'image/*' : 'video/*'} style={{ display: 'none' }} onChange={up.onChange} />
            <div onClick={() => up.ref.current?.click()} style={{ width: '100%', height: 110, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', background: 'var(--bg-muted)', transition: 'border-color 0.2s', flexDirection: 'column', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
              {up.loading
                ? <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{up.loadingLabel}</p>
                : up.url && up.isImg ? <img src={up.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : up.url && !up.isImg ? <video src={up.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                : <><p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>+ {up.label}</p>{!up.isImg && <p style={{ fontSize: 9, color: 'var(--text-disabled)', opacity: 0.6 }}>{t.maxVideo}</p>}</>}
            </div>
            {up.url && <p style={{ fontSize: 10, color: '#5a9a72', marginTop: 5 }}>✓ {up.doneLabel}</p>}
          </div>
        ))}
      </div>

      <div className="form-grid">
        {[
          [t.nameZh, 'name_zh'], [t.nameEn, 'name_en'], [t.nameAr, 'name_ar'],
          [t.moq, 'moq'],
        ].map(([label, key, type]) => (
          <div key={key} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-input" type={type || 'text'} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
          </div>
        ))}
        {/* حقل السعر بالدولار + الريال */}
        <div className="form-group">
          <label className="form-label">{t.price}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                className="form-input"
                type="number"
                placeholder="USD"
                value={data.price_from || ''}
                onChange={e => setData(prev => ({ ...prev, price_from: e.target.value }))}
                style={{ paddingRight: 40 }}
                dir="ltr"
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-disabled)', pointerEvents: 'none' }}>$</span>
            </div>
            {data.price_from && (
              <div style={{
                flex: 1, padding: '10px 12px', background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)', borderRadius: 3,
                fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center',
                direction: 'ltr',
              }}>
                ≈ {(parseFloat(data.price_from || 0) * (usdRate || 3.75)).toFixed(2)} ﷼
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.descLabel}</label>
        <textarea className="form-input" rows={2} style={{ resize: 'vertical', ...arFont }} value={data.desc_ar || ''} onChange={e => setData(prev => ({ ...prev, desc_ar: e.target.value }))} />
      </div>

      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: data.sample_available ? 18 : 0 }}>
          <input type="checkbox" id="sample_toggle" checked={data.sample_available || false} onChange={e => setData(prev => ({ ...prev, sample_available: e.target.checked }))} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--text-secondary)' }} />
          <label htmlFor="sample_toggle" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', ...arFont }}>{t.sampleAvailable}</label>
        </div>
        {data.sample_available && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeIn 0.25s ease' }}>
            {[[t.samplePrice, 'sample_price', 'number'], [t.sampleShipping, 'sample_shipping', 'number'], [t.sampleMaxQty, 'sample_max_qty', 'number'], [t.sampleNote, 'sample_note']].map(([label, key, type]) => (
              <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <input className="form-input" type={type || 'text'} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={onSave} disabled={saving} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{saving ? t.saving : t.save}</button>
        <button onClick={onCancel} className="btn-outline" style={{ padding: '11px 20px', fontSize: 12, minHeight: 44 }}>{t.cancel}</button>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────── */
export default function DashboardSupplier({ user, profile, lang }) {
  const nav      = useNavigate();
  const location = useLocation();
  const t        = T[lang] || T.zh;
  const cats     = CATEGORIES[lang] || CATEGORIES.zh;
  const isAr     = lang === 'ar';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const [stats, setStats]                   = useState({ products: 0, offers: 0, messages: 0 });
  const [myOffers, setMyOffers]             = useState([]);
  const [myProducts, setMyProducts]         = useState([]);
  const [inbox, setInbox]                   = useState([]);
  const [requests, setRequests]             = useState([]);
  const [activeTab, setActiveTab]           = useState('overview');
  const [activeCat, setActiveCat]           = useState('all');
  const [loadingOffers, setLoadingOffers]   = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [shippingCompany, setShippingCompany] = useState('DHL');
  const [product, setProduct]               = useState(emptyProduct);
  const [usdRate, setUsdRate]               = useState(3.75);
  useEffect(() => { getUsdToSar().then(r => setUsdRate(r)); }, []);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [pendingTracking, setPendingTracking] = useState([]);
  const [rejectedOffers, setRejectedOffers] = useState([]);
  const [completedPayments, setCompletedPayments] = useState(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [offerForms, setOfferForms]         = useState({});
  const [offers, setOffers]                 = useState({});

  const [settings, setSettings] = useState({
    bio_ar: '', bio_en: '', bio_zh: '', company_name: '',
    whatsapp: '', wechat: '', city: '', country: '',
    trade_link: '', speciality: '', min_order_value: '',
    avatar_url: '', factory_images: [],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [productSaveMsg, setProductSaveMsg] = useState('');
  const [editOfferModal, setEditOfferModal]   = useState(null);
  const [editOfferForm, setEditOfferForm]     = useState({});
  const [savingEditOffer, setSavingEditOffer] = useState(false);
  const [uploadingLogo, setUploadingLogo]   = useState(false);
  const [uploadingFactory, setUploadingFactory] = useState(false);
  const [samples, setSamples] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const isNewSupplier = !profile?.company_name || !profile?.speciality;

  const imageRef = useRef(null); const videoRef = useRef(null);
  const editImageRef = useRef(null); const editVideoRef = useRef(null);
  const logoRef = useRef(null); const factoryRef = useRef(null);

  useEffect(() => {
    if (!user) { nav('/login/supplier'); return; }
    loadStats(); loadPendingTracking(); loadRejectedOffers();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'offers')       loadMyOffers();
    if (activeTab === 'messages')     loadInbox();
    if (activeTab === 'my-products')  loadMyProducts();
    if (activeTab === 'requests')     loadRequests();
    if (activeTab === 'settings')     loadSettings();
    if (activeTab === 'samples')      loadSamples();
    if (activeTab === 'reviews')      loadMyReviews();
    if (activeTab === 'add-product')  {
      setEditingProduct(null);
      const draft = sessionStorage.getItem('maabar_product_draft');
      if (draft) {
        try { setProduct(JSON.parse(draft)); } catch { setProduct(emptyProduct); }
      } else {
        setProduct(emptyProduct);
      }
    }
  }, [activeTab]);

  // Save product form draft to sessionStorage on every change
  useEffect(() => {
    if (activeTab === 'add-product' && !editingProduct) {
      sessionStorage.setItem('maabar_product_draft', JSON.stringify(product));
    }
  }, [product, activeTab, editingProduct]);

  useEffect(() => { if (activeTab === 'requests') loadRequests(); }, [activeCat]);

  const loadStats = async () => {
    const [products, offersData, messages, acceptedOffers, payments] = await Promise.all([
      sb.from('products').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('is_active', true),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'accepted'),
      sb.from('payments').select('amount').eq('supplier_id', user.id).eq('status', 'first_paid'),
    ]);
    const totalSales = (payments.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    // Load matching open requests
    const profData = await sb.from('profiles').select('speciality').eq('id', user.id).single();
    let matchingRequests = 0;
    if (profData.data?.speciality) {
      const { count } = await sb.from('requests').select('id', { count: 'exact' }).eq('status', 'open').eq('category', profData.data.speciality);
      matchingRequests = count || 0;
    }
    const { count: pendingSamples } = await sb.from('samples').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'pending');
    setStats({
      products: products.count || 0,
      offers: offersData.count || 0,
      messages: messages.count || 0,
      acceptedOffers: acceptedOffers.count || 0,
      totalSales: Math.round(totalSales),
      matchingRequests,
      pendingSamples: pendingSamples || 0,
    });
  };

  const loadSamples = async () => {
    const { data } = await sb.from('samples').select('*,products(name_ar,name_en,name_zh),profiles!samples_buyer_id_fkey(full_name,company_name)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setSamples(data);
  };

  const loadMyReviews = async () => {
    const { data } = await sb.from('reviews').select('*,profiles!reviews_buyer_id_fkey(full_name,company_name)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyReviews(data);
  };

  const updateSampleStatus = async (sampleId, status) => {
    const sample = samples.find(s => s.id === sampleId);
    const { error } = await sb.from('samples').update({ status }).eq('id', sampleId);
    if (error) {
      alert(isAr ? 'حدث خطأ أثناء تحديث حالة العينة' : lang === 'zh' ? '更新样品状态时出错' : 'Error updating sample status');
      return;
    }

    if (sample?.buyer_id) {
      await sb.from('notifications').insert({
        user_id: sample.buyer_id,
        type: status === 'approved' ? 'sample_approved' : 'sample_rejected',
        title_ar: status === 'approved' ? 'تمت الموافقة على طلب العينة' : 'تم رفض طلب العينة',
        title_en: status === 'approved' ? 'Your sample request was approved' : 'Your sample request was rejected',
        title_zh: status === 'approved' ? '您的样品申请已获批准' : '您的样品申请被拒绝',
        ref_id: sampleId,
        is_read: false,
      });

      try {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: status === 'approved' ? 'sample_approved' : 'sample_rejected',
            data: {
              recipientUserId: sample.buyer_id,
              name: 'Trader',
              productName: sample?.products?.name_ar || sample?.products?.name_en || sample?.products?.name_zh || 'Product',
              totalPrice: sample?.total_price || 0,
            },
          }),
        });
      } catch (e) { console.error('sample status email error:', e); }
    }

    loadSamples(); loadStats();
  };

  const loadPendingTracking = async () => {
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number)').eq('supplier_id', user.id).eq('status', 'accepted');
    if (data) setPendingTracking(data.filter(o => o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered'));
  };

  const loadRejectedOffers = async () => {
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh)').eq('supplier_id', user.id).eq('status', 'rejected').eq('seen', false);
    if (data) setRejectedOffers(data);
  };

  const loadSettings = async () => {
    const { data } = await sb.from('profiles').select('bio_ar,bio_en,bio_zh,company_name,whatsapp,wechat,city,country,trade_link,speciality,min_order_value,avatar_url,factory_images').eq('id', user.id).single();
    if (data) setSettings({ bio_ar: data.bio_ar || '', bio_en: data.bio_en || '', bio_zh: data.bio_zh || '', company_name: data.company_name || '', whatsapp: data.whatsapp || '', wechat: data.wechat || '', city: data.city || '', country: data.country || '', trade_link: data.trade_link || '', speciality: data.speciality || '', min_order_value: data.min_order_value || '', avatar_url: data.avatar_url || '', factory_images: data.factory_images || [] });
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await sb.from('profiles').update({ bio_ar: settings.bio_ar, bio_en: settings.bio_en, bio_zh: settings.bio_zh, company_name: settings.company_name, whatsapp: settings.whatsapp, wechat: settings.wechat, city: settings.city, country: settings.country, trade_link: settings.trade_link, speciality: settings.speciality, min_order_value: settings.min_order_value ? parseFloat(settings.min_order_value) : null }).eq('id', user.id);
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingLogo(true);
    const path = `${user.id}/logo_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error) { const url = STORAGE_URL + path; await sb.from('profiles').update({ avatar_url: url }).eq('id', user.id); setSettings(prev => ({ ...prev, avatar_url: url })); }
    setUploadingLogo(false);
  };

  const uploadFactoryImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if ((settings.factory_images || []).length >= 3) { alert(isAr ? 'الحد الأقصى 3 صور' : 'Max 3 images'); return; }
    setUploadingFactory(true);
    const path = `${user.id}/factory_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error) { const url = STORAGE_URL + path; const newImages = [...(settings.factory_images || []), url]; await sb.from('profiles').update({ factory_images: newImages }).eq('id', user.id); setSettings(prev => ({ ...prev, factory_images: newImages })); }
    setUploadingFactory(false);
  };

  const removeFactoryImage = async (url) => {
    const newImages = (settings.factory_images || []).filter(img => img !== url);
    await sb.from('profiles').update({ factory_images: newImages }).eq('id', user.id);
    setSettings(prev => ({ ...prev, factory_images: newImages }));
  };

  const dismissRejected = async (offerId) => {
    await sb.from('offers').update({ seen: true }).eq('id', offerId);
    setRejectedOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const loadMyOffers = async () => {
    setLoadingOffers(true);
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number,shipping_status,quantity,description,payment_plan)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyOffers(data);
    const { data: payData } = await sb.from('payments').select('request_id').eq('supplier_id', user.id).eq('status', 'completed');
    setCompletedPayments(new Set((payData || []).map(p => p.request_id)));
    setLoadingOffers(false);
  };

  const loadMyProducts = async () => {
    setLoadingProducts(true);
    const { data } = await sb.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyProducts(data);
    setLoadingProducts(false);
  };

  const loadRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    // جلب كل الطلبات المفتوحة بدون فلتر تخصص — الفلتر اختياري من الـ UI فقط
    let query = sb.from('requests').select('*,profiles(full_name,company_name)').eq('status', 'open').order('created_at', { ascending: false });
    if (activeCat !== 'all') query = query.or(`category.eq.${activeCat},category.is.null`);
    const { data } = await query;
    if (data) setRequests(data);
    console.log('loadRequests result:', data?.length, data);
    setLoadingRequests(false);
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages').select('*, profiles!messages_sender_id_fkey(full_name, company_name)').eq('receiver_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const seen = new Set();
      setInbox(data.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; }));
      await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
      setStats(s => ({ ...s, messages: 0 }));
    }
  };

  const uploadFile = async (file, type) => {
    if (!file) return null;
    const isVideo = type === 'video';
    if (isVideo && file.size > 50 * 1024 * 1024) { alert(t.maxVideo); return null; }
    isVideo ? setUploadingVideo(true) : setUploadingImage(true);
    const path = `${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    isVideo ? setUploadingVideo(false) : setUploadingImage(false);
    if (error) { alert(isAr ? 'فشل الرفع' : 'Upload failed'); return null; }
    return STORAGE_URL + path;
  };

  const handleImageUpload = async (e, isEdit = false) => {
    const url = await uploadFile(e.target.files[0], 'image');
    if (!url) return;
    isEdit ? setEditingProduct(prev => ({ ...prev, image_url: url })) : setProduct(prev => ({ ...prev, image_url: url }));
  };

  const handleVideoUpload = async (e, isEdit = false) => {
    const url = await uploadFile(e.target.files[0], 'video');
    if (!url) return;
    isEdit ? setEditingProduct(prev => ({ ...prev, video_url: url })) : setProduct(prev => ({ ...prev, video_url: url }));
  };

  const addProduct = async () => {
    if ((!product.name_zh && !product.name_ar && !product.name_en) || !product.price_from || !product.moq) {
      setProductSaveMsg(isAr ? 'يرجى تعبئة الحقول المطلوبة: اسم المنتج، السعر، MOQ' : 'Please fill required fields: product name, price, MOQ');
      return;
    }
    setSaving(true);
    setProductSaveMsg('');
    const productName = product.name_zh || product.name_ar || product.name_en || '';
    const { error } = await sb.from('products').insert({ supplier_id: user.id, name_ar: product.name_ar || productName, name_en: product.name_en || productName, name_zh: product.name_zh || productName, price_from: parseFloat(product.price_from), moq: product.moq, desc_ar: product.desc_ar, image_url: product.image_url || null, video_url: product.video_url || null, sample_available: product.sample_available, sample_price: product.sample_available ? parseFloat(product.sample_price) : null, sample_shipping: product.sample_available ? parseFloat(product.sample_shipping || 0) : null, sample_max_qty: product.sample_available ? parseInt(product.sample_max_qty || 3) : null, sample_note: product.sample_note || null, is_active: true });
    setSaving(false);
    if (error) {
      console.error('addProduct error:', error);
      setProductSaveMsg(isAr ? 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.' : 'Error saving product. Please try again.');
      return;
    }
    sessionStorage.removeItem('maabar_product_draft');
    setProduct(emptyProduct);
    setProductSaveMsg(isAr ? 'تم إضافة المنتج بنجاح ✓' : 'Product added successfully ✓');
    setTimeout(() => { setProductSaveMsg(''); setActiveTab('my-products'); }, 1500);
    loadStats();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    await sb.from('products').update({ name_ar: editingProduct.name_ar, name_en: editingProduct.name_en, name_zh: editingProduct.name_zh, price_from: parseFloat(editingProduct.price_from), moq: editingProduct.moq, desc_ar: editingProduct.desc_ar, image_url: editingProduct.image_url || null, video_url: editingProduct.video_url || null, sample_available: editingProduct.sample_available, sample_price: editingProduct.sample_available ? parseFloat(editingProduct.sample_price) : null, sample_shipping: editingProduct.sample_available ? parseFloat(editingProduct.sample_shipping || 0) : null, sample_max_qty: editingProduct.sample_available ? parseInt(editingProduct.sample_max_qty || 3) : null, sample_note: editingProduct.sample_note || null }).eq('id', editingProduct.id);
    setSaving(false); setEditingProduct(null); loadMyProducts(); loadStats();
  };

  const toggleProductActive = async (p) => { await sb.from('products').update({ is_active: !p.is_active }).eq('id', p.id); loadMyProducts(); loadStats(); };
  const deleteProduct = async (id) => { if (!window.confirm(t.confirmDelete)) return; await sb.from('products').delete().eq('id', id); loadMyProducts(); loadStats(); };

  const saveEditOffer = async () => {
    if (!editOfferModal) return;
    setSavingEditOffer(true);
    await sb.from('offers').update({
      price: parseFloat(editOfferForm.price),
      moq: editOfferForm.moq,
      delivery_days: parseInt(editOfferForm.days),
      note: editOfferForm.note,
    }).eq('id', editOfferModal.id);
    setSavingEditOffer(false);
    setEditOfferModal(null);
    loadMyOffers();
  };

  const deleteOffer = async (o) => {
    if (o.status !== 'pending') {
      alert(isAr ? 'لا يمكن حذف عرض تم قبوله أو رفضه' : 'Cannot delete an accepted or rejected offer');
      return;
    }
    if (!window.confirm(isAr ? 'هل تريد حذف هذا العرض؟' : 'Delete this offer?')) return;
    await sb.from('offers').delete().eq('id', o.id);
    loadMyOffers(); loadStats();
  };

  const cancelOffer = async (o) => {
    if (!window.confirm(isAr ? 'هل تريد إلغاء هذا العرض؟' : 'Cancel this offer?')) return;
    await sb.from('offers').update({ status: 'cancelled' }).eq('id', o.id);
    const buyerId = o.requests?.buyer_id;
    if (buyerId) {
      const title = getTitle(o.requests);
      await sb.from('notifications').insert({
        user_id: buyerId,
        type: 'offer_cancelled',
        title_ar: `قام المورد بسحب عرضه على طلبك: ${o.requests?.title_ar || title}`,
        title_en: `Supplier withdrew their offer on: ${o.requests?.title_en || title}`,
        title_zh: `供应商撤回了报价: ${o.requests?.title_zh || title}`,
        ref_id: o.request_id,
        is_read: false,
      });
    }
    loadMyOffers();
  };

  const toggleOfferForm = (id) => {
    setOfferForms(prev => ({ ...prev, [id]: !prev[id] }));
    setOffers(prev => ({ ...prev, [id]: prev[id] || { price: '', moq: '', days: '', origin: 'China', note: '' } }));
  };

  const submitOffer = async (requestId, buyerId) => {
    const o = offers[requestId];
    if (!o?.price || !o?.moq || !o?.days) { alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : lang === 'zh' ? '请填写必填字段' : 'Fill required fields'); return; }
    const { data: existing } = await sb.from('offers').select('id').eq('request_id', requestId).eq('supplier_id', user.id).not('status', 'eq', 'cancelled').single();
    if (existing) { alert(isAr ? 'لقد قدمت عرضاً على هذا الطلب مسبقاً' : lang === 'zh' ? '您已提交过此需求的报价' : 'You already submitted an offer on this request'); return; }
    const { error } = await sb.from('offers').insert({ request_id: requestId, supplier_id: user.id, price: parseFloat(o.price), delivery_days: parseInt(o.days), note: o.note || null, status: 'pending' });
    if (error) { alert(isAr ? 'حدث خطأ' : lang === 'zh' ? '发生错误' : 'Error'); return; }
    // Update request status to offers_received when first offer comes in
    await sb.from('requests').update({ status: 'offers_received' }).eq('id', requestId).eq('status', 'open');
    await sb.from('notifications').insert({ user_id: buyerId, type: 'new_offer', title_ar: 'وصلك عرض جديد على طلبك', title_en: 'You received a new offer', title_zh: '您收到了新报价', ref_id: requestId, is_read: false });
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'new_offer',
          data: {
            recipientUserId: buyerId,
            name: 'Trader',
            requestTitle: requests.find(r=>r.id===requestId)?.title_ar || requests.find(r=>r.id===requestId)?.title_en || '',
            supplierName: profile?.company_name || user?.email?.split('@')[0] || 'Supplier',
            price: o.price,
            deliveryDays: o.days,
          },
        }),
      });
    } catch (e) { console.error('email error:', e); }
    alert(isAr ? 'تم إرسال عرضك!' : 'Offer submitted!');
    toggleOfferForm(requestId); loadRequests();
  };

  const submitTracking = async (requestId, buyerId, deliveryDays) => {
    const num = trackingInputs[requestId]; if (!num) return;
    const estimatedDelivery = deliveryDays
      ? new Date(Date.now() + (deliveryDays * 24 * 60 * 60 * 1000)).toISOString()
      : null;
    await sb.from('requests').update({
      tracking_number: num,
      shipping_company: shippingCompany,
      status: 'shipping',
      shipping_status: 'shipping',
      ...(estimatedDelivery ? { estimated_delivery: estimatedDelivery } : {}),
    }).eq('id', requestId);
    await sb.from('notifications').insert({ user_id: buyerId, type: 'shipped', title_ar: 'طلبك في الطريق — رقم التتبع: ' + num, title_en: 'Your order is on the way — Tracking: ' + num, title_zh: '您的订单已发货 — 跟踪号：' + num, ref_id: requestId, is_read: false });
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'shipment_tracking',
          data: {
            recipientUserId: buyerId,
            name: 'Trader',
            trackingNumber: num,
            shippingCompany,
          },
        }),
      });
    } catch (e) { console.error('tracking email error:', e); }
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
    if (diff < 3600)  return isAr ? Math.floor(diff / 60) + ' د'  : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : Math.floor(diff / 86400) + 'd';
  };

  const name         = profile?.company_name || profile?.full_name || user?.email?.split('@')[0];
  const pendingCount = pendingTracking.length + rejectedOffers.length;

  const tabs = [
    { id: 'overview',     label: t.overview },
    { id: 'requests',     label: isAr ? 'الطلبات' : lang === 'zh' ? '需求' : 'Requests' },
    { id: 'my-products',  label: t.myProducts },
    { id: 'offers',       label: t.offers },
    { id: 'add-product',  label: t.addProduct },
    { id: 'samples',      label: isAr ? 'العينات' : lang === 'zh' ? '样品' : 'Samples', badge: stats.pendingSamples > 0 ? stats.pendingSamples : null },
    { id: 'reviews',      label: isAr ? 'تقييماتي' : lang === 'zh' ? '评价' : 'Reviews' },
    { id: 'messages',     label: t.messages, badge: stats.messages > 0 ? stats.messages : null },
    { id: 'settings',     label: t.settings },
  ];

  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const section = { animation: 'fadeIn 0.35s ease' };

  return (
    <div className="dashboard-wrap">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div className="dash-header-pad" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20, fontWeight: 500 }}>{t.tag}</p>
        <h1 style={{ fontSize: isAr ? 34 : 40, fontWeight: 300, ...arFont, color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -1, lineHeight: 1.2, marginBottom: 10 }}>
          {t.welcome} {name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 36, lineHeight: 1.7, ...arFont, maxWidth: 420 }}>{t.desc}</p>

        <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 18px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '1px solid var(--text-primary)' : '1px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-disabled)',
              fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              ...arFont, letterSpacing: lang === 'zh' ? 0 : 1.5,
              textTransform: lang === 'zh' ? 'none' : 'uppercase',
              whiteSpace: 'nowrap', minHeight: 44,
            }}>
              {tab.label}
              {tab.badge && (
                <span style={{ position: 'absolute', top: 6, right: 2, background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', color: 'var(--text-secondary)', fontSize: 8, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT
      ══════════════════════════════════════ */}
      <div style={{ background: 'var(--bg-base)', minHeight: 'calc(100vh - 280px)' }}>
        <div className="dash-content">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={section}>
              {/* ── Onboarding ── */}
              {isNewSupplier && (
                <div style={{ marginBottom: 32, padding: '20px 24px', background: 'rgba(139,120,255,0.06)', border: '1px solid rgba(139,120,255,0.2)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, ...arFont }}>
                    {isAr ? '👋 مرحباً بك في مَعبر — أكمل ملفك لتبدأ' : 'Welcome to Maabar — Complete your profile to start'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 16, ...arFont, lineHeight: 1.7 }}>
                    {isAr ? 'أضف تخصصك واسم شركتك حتى يجدك التجار السعوديون، ثم أضف أول منتج لتبدأ استقبال الطلبات' : 'Add your specialty and company name so buyers can find you, then add your first product'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setActiveTab('settings')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 34 }}>{isAr ? 'أكمل ملفك ←' : 'Complete Profile →'}</button>
                    <button onClick={() => setActiveTab('add-product')} className="btn-outline" style={{ fontSize: 11, minHeight: 34 }}>{isAr ? 'أضف منتج' : 'Add Product'}</button>
                  </div>
                </div>
              )}
              {pendingCount > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>
                    {t.needsAttention} ({pendingCount})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {pendingTracking.map((o, i) => (
                      <div key={i} onClick={() => setActiveTab('offers')} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s', gap: 12 }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.borderColor = 'var(--border-muted)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3, ...arFont }}>{t.acceptedOffer}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{getTitle(o.requests)}</p>
                        </div>
                        <span style={{ color: 'var(--text-disabled)', fontSize: 14 }}>→</span>
                      </div>
                    ))}
                    {rejectedOffers.map((o, i) => (
                      <div key={i} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 13, color: '#a07070', ...arFont }}>{t.offerRejected}: {getTitle(o.requests)}</p>
                        <button onClick={() => dismissRejected(o.id)} className="btn-outline" style={{ padding: '5px 12px', fontSize: 10, minHeight: 30 }}>{isAr ? 'تجاهل' : lang === 'zh' ? '忽略' : 'Dismiss'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>{t.stats}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <StatCard label={t.offersCount}   value={stats.offers}   onClick={() => setActiveTab('offers')} />
                  <StatCard label={t.productsCount} value={stats.products} onClick={() => setActiveTab('my-products')} />
                  <StatCard label={t.messagesCount} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
                {/* Extended Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
                  <StatCard
                    label={isAr ? 'إجمالي المبيعات' : 'Total Sales (SAR)'}
                    value={stats.totalSales ? `${stats.totalSales.toLocaleString()} ` : '—'}
                    onClick={() => {}}
                  />
                  <StatCard
                    label={isAr ? 'نسبة قبول العروض' : 'Offer Accept Rate'}
                    value={stats.offers > 0 ? `${Math.round((stats.acceptedOffers || 0) / stats.offers * 100)}%` : '—'}
                    onClick={() => setActiveTab('offers')}
                  />
                  <StatCard
                    label={isAr ? 'طلبات مفتوحة مناسبة' : 'Matching Open Requests'}
                    value={stats.matchingRequests || '—'}
                    onClick={() => setActiveTab('requests')}
                    highlight={(stats.matchingRequests || 0) > 0}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>{t.quickActions}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <QuickAction title={t.browseRequests} onClick={() => setActiveTab('requests')} primary isAr={isAr} />
                  <QuickAction title={t.myProducts}     onClick={() => setActiveTab('my-products')} isAr={isAr} />
                  <QuickAction title={t.addNewProduct}  onClick={() => setActiveTab('add-product')} isAr={isAr} />
                </div>
              </div>

              <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
                {t.backHome}
              </button>
            </div>
          )}

          {/* ── REQUESTS ── */}
          {activeTab === 'requests' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 24, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلبات التجار' : lang === 'zh' ? '采购需求' : 'Trader Requests'}
              </h2>
              <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button key={c.val} onClick={() => setActiveCat(c.val)} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s', background: activeCat === c.val ? 'var(--bg-raised)' : 'transparent', color: activeCat === c.val ? 'var(--text-primary)' : 'var(--text-disabled)', border: '1px solid', borderColor: activeCat === c.val ? 'var(--border-muted)' : 'var(--border-subtle)', ...arFont, minHeight: 32 }}>{c.label}</button>
                ))}
              </div>

              {loadingRequests && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingRequests && requests.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0' }}><p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد طلبات' : 'No requests'}</p></div>}

              {!loadingRequests && requests.map(r => (
                <div key={r.id} style={{ marginBottom: offerForms[r.id] ? 0 : 10 }}>
                  <div style={{ border: '1px solid var(--border-subtle)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, background: 'var(--bg-subtle)', transition: 'all 0.15s', borderRadius: offerForms[r.id] ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.background = 'var(--bg-muted)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="status-badge status-open">{isAr ? 'مفتوح' : 'open'}</span>
                        {r.category && r.category !== 'other' && <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 20, color: 'var(--text-disabled)' }}>{cats.find(c => c.val === r.category)?.label || r.category}</span>}
                        <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>{fmtDate(r.created_at)}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)', ...arFont }}>{getTitle(r)}</h3>
                      <div style={{ display: 'flex', gap: 16, color: 'var(--text-disabled)', fontSize: 12, flexWrap: 'wrap' }}>
                        <span>{r.profiles?.full_name || r.profiles?.company_name || ''}</span>
                        <span>{r.quantity || '—'}</span>
                        {r.description && <span>{r.description.substring(0, 55)}…</span>}
                      </div>
                    </div>
                    <button className="btn-dark-sm" onClick={() => toggleOfferForm(r.id)} style={{ minHeight: 38, whiteSpace: 'nowrap' }}>
                      {offerForms[r.id] ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'قدم عرضك' : lang === 'zh' ? '提交报价' : 'Submit Quote')}
                    </button>
                  </div>

                  {offerForms[r.id] && (
                    <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '18px 22px', marginBottom: 10, borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                      <div className="form-grid">
                        {/* حقل السعر بالدولار + الريال */}
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'سعر الوحدة (USD) *' : 'Unit Price (USD) *'}</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                className="form-input"
                                type="number"
                                placeholder="USD"
                                value={offers[r.id]?.price || ''}
                                onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], price: e.target.value } }))}
                                style={{ paddingRight: 40 }}
                                dir="ltr"
                              />
                              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-disabled)', pointerEvents: 'none' }}>$</span>
                            </div>
                            {offers[r.id]?.price && (
                              <div style={{
                                flex: 1, padding: '10px 12px', background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-subtle)', borderRadius: 3,
                                fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', direction: 'ltr',
                              }}>
                                ≈ {(parseFloat(offers[r.id]?.price || 0) * (usdRate || 3.75)).toFixed(2)} ﷼
                              </div>
                            )}
                          </div>
                        </div>
                        {[['MOQ *', 'moq'], [isAr ? 'مدة التسليم (أيام) *' : 'Delivery Days *', 'days', 'number'], [isAr ? 'بلد المنشأ' : 'Origin', 'origin']].map(([label, key, type]) => (
                          <div key={key} className="form-group">
                            <label className="form-label">{label}</label>
                            <input className="form-input" type={type || 'text'} value={offers[r.id]?.[key] || (key === 'origin' ? 'China' : '')} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], [key]: e.target.value } }))} />
                          </div>
                        ))}
                      </div>
                      <div className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'ملاحظة' : 'Note'}</label>
                        <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={offers[r.id]?.note || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))} />
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)} style={{ minHeight: 40 }}>{isAr ? 'إرسال العرض' : lang === 'zh' ? '发送报价' : 'Send Offer'}</button>
                        <button className="btn-outline" onClick={() => toggleOfferForm(r.id)} style={{ minHeight: 40 }}>{t.cancel}</button>
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          🔒 {isAr ? 'يراه التاجر فقط — سعرك سري' : lang === 'zh' ? '仅买家可见 — 您的报价保密' : 'Only the buyer sees this — your price is private'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MY PRODUCTS ── */}
          {activeTab === 'my-products' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
                <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.myProductsTitle}</h2>
                <button className="btn-dark-sm" onClick={() => setActiveTab('add-product')} style={{ fontSize: 11, minHeight: 36 }}>{isAr ? '+ إضافة' : lang === 'zh' ? '+ 添加' : '+ Add'}</button>
              </div>

              {loadingProducts && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingProducts && myProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, marginBottom: 24, ...arFont }}>{t.noProducts}</p>
                  <button className="btn-dark-sm" onClick={() => setActiveTab('add-product')} style={{ minHeight: 40 }}>{t.addNewProduct}</button>
                </div>
              )}

              {!loadingProducts && myProducts.map((p, idx) => (
                <div key={p.id}>
                  {editingProduct?.id === p.id ? (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', animation: 'fadeIn 0.3s ease' }}>
                      <input ref={editImageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, true)} />
                      <input ref={editVideoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoUpload(e, true)} />
                      <ProductForm data={editingProduct} setData={setEditingProduct} onSave={updateProduct} onCancel={() => setEditingProduct(null)} imgRef={editImageRef} vidRef={editVideoRef} onImgChange={e => handleImageUpload(e, true)} onVidChange={e => handleVideoUpload(e, true)} uploadingImage={uploadingImage} uploadingVideo={uploadingVideo} t={t} isAr={isAr} saving={saving} usdRate={usdRate} />
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 0', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                      <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-lg)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, opacity: 0.25 }}>◻</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', ...arFont }}>{lang === 'zh' ? p.name_zh || p.name_en : lang === 'ar' ? p.name_ar || p.name_en : p.name_en || p.name_ar}</p>
                          {p.video_url && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>VIDEO</span>}
                          {p.sample_available && <span style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', borderRadius: 10, color: '#5a9a72', letterSpacing: 0.5 }}>{isAr ? 'عينة' : 'SAMPLE'}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{p.price_from} SAR · MOQ: {p.moq}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, border: '1px solid', borderColor: p.is_active ? 'rgba(58,122,82,0.3)' : 'var(--border-subtle)', color: p.is_active ? '#5a9a72' : 'var(--text-disabled)', background: p.is_active ? 'rgba(58,122,82,0.08)' : 'transparent' }}>{p.is_active ? t.active : t.inactive}</span>
                        <button onClick={() => toggleProductActive(p)} className="btn-outline" style={{ padding: '5px 10px', fontSize: 10, minHeight: 28 }}>{t.toggleActive}</button>
                        <button onClick={() => setEditingProduct(p)} className="btn-outline" style={{ padding: '5px 10px', fontSize: 10, minHeight: 28 }}>{t.edit}</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '5px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 28 }}>{t.delete}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MY OFFERS ── */}
          {activeTab === 'offers' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.myOffers}</h2>

              {loadingOffers && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingOffers && myOffers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-disabled)', marginBottom: 24, ...arFont }}>{t.noOffers}</p>
                  <button className="btn-dark-sm" onClick={() => setActiveTab('requests')} style={{ minHeight: 40 }}>{t.browseReqs}</button>
                </div>
              )}

              {!loadingOffers && myOffers.map((o, idx) => (
                <div key={o.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', ...arFont }}>{getTitle(o.requests)}</h3>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: o.status === 'accepted' ? 'rgba(58,122,82,0.3)' : o.status === 'rejected' ? 'rgba(138,58,58,0.3)' : 'var(--border-subtle)', color: o.status === 'accepted' ? '#5a9a72' : o.status === 'rejected' ? '#a07070' : 'var(--text-disabled)' }}>
                        {OFFER_STATUS[lang]?.[o.status] || o.status}
                      </span>
                      {o.status === 'pending' && (
                        <>
                          <button
                            onClick={() => { setEditOfferModal(o); setEditOfferForm({ price: String(o.price), moq: o.moq || '', days: String(o.delivery_days), note: o.note || '' }); }}
                            className="btn-outline"
                            style={{ padding: '3px 8px', fontSize: 10, minHeight: 24 }}>
                            {t.edit}
                          </button>
                          <button
                            onClick={() => cancelOffer(o)}
                            style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                            {isAr ? 'إلغاء العرض' : 'Cancel Offer'}
                          </button>
                          <button
                            onClick={() => deleteOffer(o)}
                            style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                            {t.delete}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 14, flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 26, fontWeight: 300, color: 'var(--text-primary)' }}>{o.price} <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>SAR</span></span>
                    <span>MOQ: {o.moq}</span>
                    <span>{o.delivery_days} {t.days}</span>
                  </div>

                  {/* Accepted offer: full order details */}
                  {o.status === 'accepted' && (
                    <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {o.requests?.quantity && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', ...arFont }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'الكمية: ' : 'Qty: '}</span>{o.requests.quantity}
                        </p>
                      )}
                      {o.requests?.description && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', ...arFont }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'المواصفات: ' : 'Specs: '}</span>{o.requests.description}
                        </p>
                      )}
                      {o.requests?.payment_plan && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'خطة الدفع: ' : 'Payment plan: '}</span>{o.requests.payment_plan}%
                        </p>
                      )}
                      <p style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'حالة الدفع: ' : 'Payment: '}</span>
                        <span style={{ color: ['paid','ready_to_ship','shipping','arrived','delivered'].includes(o.requests?.status) ? '#5a9a72' : '#a07070' }}>
                          {['paid','ready_to_ship','shipping','arrived','delivered'].includes(o.requests?.status)
                            ? (isAr ? 'تم الدفع' : 'Paid')
                            : (isAr ? 'في انتظار الدفع' : 'Pending')}
                        </span>
                      </p>
                      {o.updated_at && (
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                          {isAr ? 'تاريخ القبول: ' : 'Accepted: '}{new Date(o.updated_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* "Shipment Ready" button — when offer accepted and request paid */}
                  {o.status === 'accepted' && o.requests?.status === 'paid' && (
                    <div style={{ marginBottom: 14 }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '11px 24px', fontSize: 12, minHeight: 42, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                        onClick={async () => {
                          await sb.from('requests')
                            .update({ status: 'ready_to_ship' })
                            .eq('id', o.request_id);
                          await sb.from('notifications').insert({
                            user_id: o.requests.buyer_id,
                            type: 'ready_to_ship',
                            title_ar: 'شحنتك جاهزة — ادفع الدفعة الثانية لإتمام الشحن',
                            title_en: 'Your shipment is ready — Pay the second installment to ship',
                            title_zh: '您的货物已准备好 — 支付尾款以完成发货',
                            ref_id: o.request_id,
                            is_read: false,
                          });
                          loadMyOffers();
                        }}>
                        {isAr ? 'الشحنة جاهزة' : lang === 'zh' ? '货物已备好' : 'Shipment Ready'}
                      </button>
                    </div>
                  )}

                  {o.status === 'accepted' && !['paid','shipping','delivered','ready_to_ship'].includes(o.requests?.status || '') && (
                    <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', ...arFont }}>
                        {isAr ? 'في انتظار إتمام الدفع من التاجر' : 'Awaiting payment completion'}
                      </p>
                    </div>
                  )}

                  {o.status === 'accepted' && completedPayments.has(o.request_id) && (
                    <div style={{ marginBottom: 14, padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)', ...arFont }}>{t.trackingPrompt}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <select
                          value={shippingCompany}
                          onChange={e => setShippingCompany(e.target.value)}
                          style={{
                            padding: '10px 12px', fontSize: 13,
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', outline: 'none', minHeight: 40,
                          }}>
                          {['DHL','FedEx','Aramex','UPS','SMSA',isAr ? 'أخرى' : 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input className="form-input" style={{ flex: 1, minWidth: 140 }} placeholder={t.trackingNum} value={trackingInputs[o.request_id] || ''} onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))} dir="ltr" />
                        <button className="btn-dark-sm" onClick={() => submitTracking(o.request_id, o.requests?.buyer_id, o.delivery_days)} style={{ minHeight: 40 }}>{t.send}</button>
                      </div>
                    </div>
                  )}

                  {o.requests?.tracking_number && (
                    <p style={{ fontSize: 12, marginBottom: 12, padding: '8px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                      {t.tracking} <strong style={{ color: 'var(--text-primary)' }}>{o.requests.tracking_number}</strong>
                    </p>
                  )}

                  {o.status === 'accepted' && o.requests?.buyer_id && (
                    <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 38 }}>{t.contactTrader}</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === 'messages' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.messagesTitle}</h2>
              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, ...arFont }}>{t.noMessages}</p>
                </div>
              ) : inbox.map((m, idx) => {
                const senderName = m.profiles?.full_name || m.profiles?.company_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'opacity 0.15s', animation: `fadeIn 0.35s ease ${idx * 0.04}s both`, minHeight: 56 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div className="avatar">{senderName.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{senderName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{m.content}</p>
                    </div>
                    {!m.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, opacity: 0.8 }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ADD PRODUCT ── */}
          {/* ── SAMPLES ── */}
          {activeTab === 'samples' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلبات العينات' : lang === 'zh' ? '样品请求' : 'Sample Requests'}
              </h2>
              {samples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد طلبات عينات بعد' : 'No sample requests yet'}</p>
                </div>
              ) : samples.map((s, idx) => (
                <div key={s.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 0', animation: `fadeIn 0.35s ease ${idx*0.04}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, ...arFont }}>
                        {lang === 'zh' ? s.products?.name_zh : lang === 'ar' ? s.products?.name_ar : s.products?.name_en}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 4 }}>
                        {s.profiles?.company_name || s.profiles?.full_name || '—'} · {isAr ? `الكمية: ${s.quantity}` : `Qty: ${s.quantity}`}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
                        {s.sample_price} SAR {isAr ? '+ شحن' : '+ shipping'} {s.shipping_price} SAR
                      </p>
                      {s.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, ...arFont }}>{s.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: s.status==='approved' ? 'rgba(58,122,82,0.3)' : s.status==='rejected' ? 'rgba(138,58,58,0.3)' : 'var(--border-subtle)', color: s.status==='approved' ? '#5a9a72' : s.status==='rejected' ? '#a07070' : 'var(--text-disabled)' }}>
                        {s.status === 'approved' ? (isAr ? 'مقبول' : 'Approved') : s.status === 'rejected' ? (isAr ? 'مرفوض' : 'Rejected') : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                      {s.status === 'pending' && <>
                        <button onClick={() => updateSampleStatus(s.id, 'approved')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 28, padding: '4px 12px' }}>{isAr ? 'قبول' : 'Approve'}</button>
                        <button onClick={() => updateSampleStatus(s.id, 'rejected')} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 28 }}>{isAr ? 'رفض' : 'Reject'}</button>
                      </>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── REVIEWS ── */}
          {activeTab === 'reviews' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'تقييماتي' : 'My Reviews'}
              </h2>
              {myReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
                    <p style={{ fontSize: 48, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {(myReviews.reduce((s,r) => s+r.rating, 0) / myReviews.length).toFixed(1)}
                    </p>
                    <div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, color: s <= Math.round(myReviews.reduce((sum,r)=>sum+r.rating,0)/myReviews.length) ? '#a08050' : 'var(--border-default)' }}>★</span>)}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 1 }}>{myReviews.length} {isAr ? 'تقييم' : 'reviews'}</p>
                    </div>
                  </div>
                  {myReviews.map((r, idx) => (
                    <div key={r.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '18px 0', animation: `fadeIn 0.35s ease ${idx*0.04}s both` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.profiles?.company_name || r.profiles?.full_name || '—'}</p>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? '#a08050' : 'var(--border-default)' }}>★</span>)}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, ...arFont }}>{r.comment}</p>}
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 6 }}>{new Date(r.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === 'add-product' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.addProductTitle}</h2>
              <input ref={imageRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, false)} />
              <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => handleVideoUpload(e, false)} />
              <ProductForm data={product} setData={setProduct} onSave={addProduct} onCancel={() => setActiveTab('overview')} imgRef={imageRef} vidRef={videoRef} onImgChange={e => handleImageUpload(e, false)} onVidChange={e => handleVideoUpload(e, false)} uploadingImage={uploadingImage} uploadingVideo={uploadingVideo} t={t} isAr={isAr} saving={saving} usdRate={usdRate} />
              {productSaveMsg && (
                <p style={{ marginTop: 12, fontSize: 13, color: productSaveMsg.includes('✓') ? '#5a9a72' : '#a07070', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {productSaveMsg}
                </p>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.settingsTitle}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 660 }}>

                {/* Logo */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{t.logo}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {settings.avatar_url ? <img src={settings.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, opacity: 0.3 }}>◻</span>}
                    </div>
                    <div>
                      <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                      <button onClick={() => logoRef.current?.click()} className="btn-dark-sm" style={{ marginBottom: 6, fontSize: 11, minHeight: 34 }}>{uploadingLogo ? t.uploadingLogo : t.uploadLogo}</button>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{isAr ? 'JPG أو PNG · حتى 5MB' : 'JPG or PNG · Max 5MB'}</p>
                    </div>
                  </div>
                </div>

                {/* Factory images */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{t.factoryImages}</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(settings.factory_images || []).map((img, i) => (
                      <div key={i} style={{ width: 90, height: 90, borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeFactoryImage(img)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.9)', border: 'none', width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                    {(settings.factory_images || []).length < 3 && (
                      <>
                        <input ref={factoryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFactoryImage} />
                        <div onClick={() => factoryRef.current?.click()} style={{ width: 90, height: 90, borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
                          {uploadingFactory ? <p style={{ fontSize: 10, color: 'var(--text-disabled)' }}>...</p> : <p style={{ fontSize: 22, color: 'var(--text-disabled)' }}>+</p>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Company info */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{isAr ? 'بيانات الشركة' : 'Company Info'}</p>
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '24px 28px', borderRadius: 'var(--radius-xl)' }}>
                    <div className="form-grid">
                      {[[t.companyName, 'company_name'], [t.speciality, 'speciality', 'select'], [t.city, 'city'], [t.country, 'country'], [t.whatsapp, 'whatsapp', 'tel'], [t.wechat, 'wechat'], [t.minOrder, 'min_order_value', 'number'], [t.tradeLink, 'trade_link', 'url']].map(([label, key, type]) => (
                        <div key={key} className="form-group">
                          <label className={`form-label${isAr ? ' ar' : ''}`}>{label}</label>
                          {type === 'select'
                            ? <select className="form-input" value={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.value })}>
                                <option value="">{isAr ? 'اختر' : 'Select'}</option>
                                {CATEGORIES[lang]?.filter(c => c.val !== 'all').map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                              </select>
                            : <input className="form-input" type={type || 'text'} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} dir={['whatsapp', 'wechat', 'trade_link'].includes(key) ? 'ltr' : undefined} />}
                        </div>
                      ))}
                    </div>

                    {[[t.bioZh, 'bio_zh'], [t.bioEn, 'bio_en'], [t.bioAr, 'bio_ar', true]].map(([label, key, rtl]) => (
                      <div key={key} className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{label}</label>
                        <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} dir={rtl ? 'rtl' : 'ltr'} />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveSettings} disabled={savingSettings} className="btn-primary" style={{ padding: '12px 32px', fontSize: 13, alignSelf: 'flex-start', minHeight: 46 }}>
                  {savingSettings ? t.saving : t.saveSettings}
                </button>
                {settingsSaved && (
                  <p style={{ color: '#5a9a72', fontSize: 13, marginTop: 8, ...arFont }}>
                    {t.settingsSaved} ✓
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════
          EDIT OFFER MODAL
      ══════════════════════════════════════ */}
      {editOfferModal && (
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
            width: '100%', maxWidth: 440,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'تعديل العرض' : lang === 'zh' ? '编辑报价' : 'Edit Offer'}
            </p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 20, ...arFont }}>
              {getTitle(editOfferModal.requests)}
            </p>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">{t.price}</label>
                <input className="form-input" type="number" dir="ltr" value={editOfferForm.price}
                  onChange={e => setEditOfferForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.moq}</label>
                <input className="form-input" value={editOfferForm.moq}
                  onChange={e => setEditOfferForm(f => ({ ...f, moq: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'أيام التسليم' : lang === 'zh' ? '交货天数' : 'Delivery Days'}</label>
                <input className="form-input" type="number" dir="ltr" value={editOfferForm.days}
                  onChange={e => setEditOfferForm(f => ({ ...f, days: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'ملاحظة' : lang === 'zh' ? '备注' : 'Note'}</label>
                <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={editOfferForm.note}
                  onChange={e => setEditOfferForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEditOffer} disabled={savingEditOffer} className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44 }}>
                {savingEditOffer ? t.saving : t.save}
              </button>
              <button onClick={() => setEditOfferModal(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer lang={lang} />
    </div>
  );
}