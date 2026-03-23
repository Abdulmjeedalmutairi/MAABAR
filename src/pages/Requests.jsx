import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const CATEGORIES = {
  ar: [
    { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture', label: 'أثاث' },
    { val: 'clothing', label: 'ملابس' },
    { val: 'building', label: 'مواد بناء' },
    { val: 'food', label: 'غذاء' },
    { val: 'other', label: 'أخرى' },
  ],
  en: [
    { val: 'electronics', label: 'Electronics' },
    { val: 'furniture', label: 'Furniture' },
    { val: 'clothing', label: 'Clothing' },
    { val: 'building', label: 'Building Materials' },
    { val: 'food', label: 'Food' },
    { val: 'other', label: 'Other' },
  ],
  zh: [
    { val: 'electronics', label: '电子产品' },
    { val: 'furniture', label: '家具' },
    { val: 'clothing', label: '服装' },
    { val: 'building', label: '建材' },
    { val: 'food', label: '食品' },
    { val: 'other', label: '其他' },
  ],
};

const SkeletonCard = () => (
  <div style={{ border: '1px solid #E5E0D8', padding: '24px 28px', marginBottom: 14, borderRadius: 6, background: 'rgba(247,245,242,0.82)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ width: '30%', height: 12, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '60%', height: 18, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '45%', height: 12, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
      </div>
      <div style={{ width: 110, height: 38, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite', flexShrink: 0 }} />
    </div>
  </div>
);

export default function Requests({ lang, user, profile }) {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [offerForms, setOfferForms] = useState({});
  const [offers, setOffers] = useState({});
  const [newReq, setNewReq] = useState({ title_ar: '', title_en: '', quantity: '', description: '', category: 'other' });
  const [submitting, setSubmitting] = useState(false);
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const cats = CATEGORIES[lang] || CATEGORIES.ar;

  useEffect(() => {
    if (isSupplier) loadRequests();
  }, [user, profile]);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await sb
      .from('requests')
      .select('*,profiles(full_name,company_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
    setLoading(false);
  };

  const submitNewRequest = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!newReq.title_ar || !newReq.quantity) {
      alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Fill required fields');
      return;
    }
    setSubmitting(true);
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: newReq.title_ar,
      title_en: newReq.title_en || newReq.title_ar,
      title_zh: newReq.title_ar,
      quantity: newReq.quantity,
      description: newReq.description,
      category: newReq.category || 'other',
      status: 'open'
    });
    setSubmitting(false);
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    alert(isAr ? '✅ تم رفع طلبك! سيتواصل معك الموردون قريباً' : '✅ Request posted! Suppliers will contact you soon');
    setNewReq({ title_ar: '', title_en: '', quantity: '', description: '', category: 'other' });
  };

  const toggleOfferForm = (id) => {
    setOfferForms(prev => ({ ...prev, [id]: !prev[id] }));
    setOffers(prev => ({ ...prev, [id]: prev[id] || { price: '', moq: '', days: '', origin: 'China', note: '' } }));
  };

  const submitOffer = async (requestId, buyerId) => {
    const o = offers[requestId];
    if (!o?.price || !o?.moq || !o?.days) {
      alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Fill required fields');
      return;
    }
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

  const filtered = requests.filter(r =>
    (r.title_ar || '').includes(search) ||
    (r.title_en || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600) return isAr ? Math.floor(diff / 60) + ' دقيقة' : Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' ساعة' : Math.floor(diff / 3600) + ' hr ago';
    return isAr ? Math.floor(diff / 86400) + ' يوم' : Math.floor(diff / 86400) + ' days ago';
  };

  return (
    <div className="supplier-req-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isSupplier
              ? (isAr ? 'طلبات التجار' : 'Trader Requests')
              : (isAr ? 'ارفع طلبك' : 'Post Your Request')}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isSupplier
              ? (isAr ? 'قدم عرضك على الطلبات المفتوحة' : 'Submit offers on open requests')
              : (isAr ? 'اكتب طلبك وموردون صينيون يتنافسون لك' : 'Post your request and suppliers compete for you')}
          </p>
        </div>
      </div>

      {/* ── واجهة التاجر / الزائر ── */}
      {!isSupplier && (
        <div style={{ padding: '40px 60px' }}>

          {/* إرشاد للزائر */}
          {!user && (
            <div style={{
              background: 'rgba(44,44,44,0.04)', border: '1px solid #E5E0D8',
              padding: '20px 24px', borderRadius: 4, marginBottom: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#2C2C2C', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {isAr ? 'كيف يشتغل مَعبر؟' : 'How does Maabar work?'}
                </p>
                <p style={{ fontSize: 12, color: '#7a7a7a', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {isAr
                    ? 'اكتب طلبك ← موردون صينيون يرسلون عروضهم ← اختر الأفضل ← استلم بضاعتك'
                    : 'Post request ← Suppliers send offers ← Choose the best ← Receive your order'}
                </p>
              </div>
              <button onClick={() => nav('/login/buyer')} style={{
                background: '#2C2C2C', color: '#F7F5F2', border: 'none',
                padding: '10px 22px', fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2, whiteSpace: 'nowrap',
              }}>
                {isAr ? 'تسجيل مجاني' : 'Free Sign Up'}
              </button>
            </div>
          )}

          {/* فورم الطلب */}
          <div style={{ background: '#fff', border: '1px solid #E5E0D8', padding: 40, maxWidth: 680, borderRadius: 4 }}>
            <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'طلب تسعيرة جديد' : 'New Sourcing Request'}
            </h3>
            <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', lineHeight: 1.7 }}>
              {isAr ? 'أكتب تفاصيل المنتج اللي تبيه وسيتواصل معك الموردون بأفضل الأسعار' : 'Describe what you need and suppliers will send you their best prices'}
            </p>

            {/* الكتاغوري */}
            <div className="form-group">
              <label className="form-label">{isAr ? 'نوع المنتج *' : 'Product Category *'}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button key={c.val} onClick={() => setNewReq({ ...newReq, category: c.val })} style={{
                    padding: '7px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
                    background: newReq.category === c.val ? '#2C2C2C' : 'transparent',
                    color: newReq.category === c.val ? '#F7F5F2' : '#7a7a7a',
                    border: '1px solid', borderColor: newReq.category === c.val ? '#2C2C2C' : '#E5E0D8',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم المنتج بالعربي *' : 'Product Name *'}</label>
                <input className="form-input" value={newReq.title_ar}
                  onChange={e => setNewReq({ ...newReq, title_ar: e.target.value })}
                  placeholder={isAr ? 'مثال: كراسي مكتب' : 'e.g. Office Chairs'} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم المنتج بالإنجليزي' : 'Product Name (English)'}</label>
                <input className="form-input" value={newReq.title_en}
                  onChange={e => setNewReq({ ...newReq, title_en: e.target.value })}
                  placeholder="e.g. Office Chairs" />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الكمية المطلوبة *' : 'Quantity *'}</label>
                <input className="form-input" value={newReq.quantity}
                  onChange={e => setNewReq({ ...newReq, quantity: e.target.value })}
                  placeholder={isAr ? 'مثال: 500 قطعة' : 'e.g. 500 units'} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{isAr ? 'تفاصيل إضافية' : 'Additional Details'}</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }}
                value={newReq.description}
                onChange={e => setNewReq({ ...newReq, description: e.target.value })}
                placeholder={isAr ? 'المواصفات، اللون، الجودة، الميزانية...' : 'Specs, color, quality, budget...'} />
            </div>

            {!user && (
              <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 16, padding: '10px 14px', background: '#f0ede8', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                {isAr ? '💡 سيُطلب منك تسجيل الدخول عند إرسال الطلب' : "💡 You'll be asked to sign in when submitting"}
              </p>
            )}

            <button className="btn-dark-sm" onClick={submitNewRequest} disabled={submitting} style={{ padding: '13px 32px', fontSize: 14 }}>
              {submitting ? '...' : isAr ? 'إرسال الطلب ←' : 'Submit Request →'}
            </button>
          </div>
        </div>
      )}

      {/* ── واجهة المورد ── */}
      {isSupplier && (
        <div className="list-wrap">
          <div className="search-bar">
            <input className="search-input"
              placeholder={isAr ? 'ابحث...' : 'Search...'}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {!loading && (
            <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: 24 }}>
              {filtered.length} {isAr ? 'طلبات مفتوحة' : 'open requests'}
            </p>
          )}

          {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

          {!loading && filtered.map(r => (
            <div key={r.id}>
              <div style={{
                border: '1px solid #E5E0D8', padding: '24px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                gap: 20, marginBottom: offerForms[r.id] ? 0 : 14,
                background: 'rgba(247,245,242,0.82)', transition: 'all 0.2s',
                borderRadius: offerForms[r.id] ? '6px 6px 0 0' : 6,
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2C2C2C'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D8'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
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
                  <h3 className={`req-name${isAr ? ' ar' : ''}`}>
                    {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                  </h3>
                  <div className="req-meta">
                    <span>👤 {r.profiles?.full_name || r.profiles?.company_name || ''}</span>
                    <span>📦 {r.quantity || '—'}</span>
                    {r.description && <span style={{ color: '#6b6b6b', fontSize: 12 }}>{r.description.substring(0, 60)}...</span>}
                  </div>
                </div>
                <button className="btn-quote" onClick={() => toggleOfferForm(r.id)}>
                  {isAr ? 'قدم عرضك ←' : 'Submit Quote →'}
                </button>
              </div>

              {offerForms[r.id] && (
                <div style={{ background: '#F7F5F2', border: '1px solid #E5E0D8', borderTop: 'none', padding: 24, marginBottom: 14, borderRadius: '0 0 6px 6px' }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'سعر الوحدة (ريال) *' : 'Unit Price (SAR) *'}</label>
                      <input className="form-input" type="number"
                        value={offers[r.id]?.price || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], price: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">MOQ *</label>
                      <input className="form-input"
                        value={offers[r.id]?.moq || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], moq: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'مدة التسليم (أيام) *' : 'Delivery Days *'}</label>
                      <input className="form-input" type="number"
                        value={offers[r.id]?.days || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], days: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'بلد المنشأ' : 'Country of Origin'}</label>
                      <input className="form-input"
                        value={offers[r.id]?.origin || 'China'}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], origin: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'ملاحظة' : 'Note'}</label>
                    <textarea className="form-input" rows={2} style={{ resize: 'none' }}
                      value={offers[r.id]?.note || ''}
                      onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)}>
                      {isAr ? 'إرسال العرض' : 'Send Offer'}
                    </button>
                    <button className="btn-outline" onClick={() => toggleOfferForm(r.id)}>
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: '#6b6b6b', fontSize: 14 }}>
                {isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}
              </p>
            </div>
          )}
        </div>
      )}

      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}
