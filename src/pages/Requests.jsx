import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

export default function Requests({ lang, user, profile }) {
  const nav = useNavigate();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [offerForms, setOfferForms] = useState({});
  const [offers, setOffers] = useState({});
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newReq, setNewReq] = useState({ title_ar: '', title_en: '', quantity: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const isBuyer = user && profile?.role === 'buyer';

  useEffect(() => {
    // الطلبات تحمل فقط للمورد المسجل
    if (isSupplier) loadRequests();
  }, [user, profile]);

  const loadRequests = async () => {
    const { data } = await sb.from('requests')
      .select('*,profiles(full_name,company_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
  };

  const submitNewRequest = async () => {
    // التسجيل يُطلب هنا فقط — عند الإرسال
    if (!user) { nav('/login/buyer'); return; }
    if (!newReq.title_ar || !newReq.quantity) {
      alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Fill required fields'); return;
    }
    setSubmitting(true);
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: newReq.title_ar,
      title_en: newReq.title_en || newReq.title_ar,
      title_zh: newReq.title_ar,
      quantity: newReq.quantity,
      description: newReq.description,
      status: 'open'
    });
    setSubmitting(false);
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    alert(isAr ? '✅ تم رفع طلبك! سيتواصل معك الموردون قريباً' : '✅ Request posted! Suppliers will contact you soon');
    setNewReq({ title_ar: '', title_en: '', quantity: '', description: '' });
    setShowNewRequest(false);
  };

  const toggleOfferForm = (id) => {
    setOfferForms(prev => ({ ...prev, [id]: !prev[id] }));
    setOffers(prev => ({ ...prev, [id]: prev[id] || { price: '', moq: '', days: '', origin: 'China', note: '' } }));
  };

  const submitOffer = async (requestId, buyerId) => {
    const o = offers[requestId];
    if (!o?.price || !o?.moq || !o?.days) { alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : 'Fill required fields'); return; }
    const { error } = await sb.from('offers').insert({
      request_id: requestId,
      supplier_id: user.id,
      price: parseFloat(o.price),
      moq: o.moq,
      delivery_days: parseInt(o.days),
      origin: o.origin,
      note: o.note,
      status: 'pending'
    });
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    await sb.from('notifications').insert({
      user_id: buyerId,
      type: 'new_offer',
      title_ar: '📦 وصلك عرض جديد على طلبك',
      title_en: '📦 You received a new offer',
      title_zh: '📦 您收到了新报价',
      ref_id: requestId,
      is_read: false
    });
    alert(isAr ? '✅ تم إرسال عرضك!' : '✅ Offer submitted!');
    toggleOfferForm(requestId);
    loadRequests();
  };

  const filtered = requests.filter(r =>
    (r.title_ar || '').includes(search) || (r.title_en || '').toLowerCase().includes(search.toLowerCase())
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

      {/* ── واجهة التاجر: فورم رفع طلب فقط ── */}
      {!isSupplier && (
        <div style={{ padding: '40px 60px' }}>
          <div style={{ background: '#fff', border: '1px solid #e8e4de', padding: 40, maxWidth: 680, borderRadius: 4 }}>
            <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 8 }}>
              {isAr ? 'طلب تسعيرة جديد' : 'New Sourcing Request'}
            </h3>
            <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: 28 }}>
              {isAr ? 'أكتب تفاصيل المنتج اللي تبيه وسيتواصل معك الموردون بأفضل الأسعار' : 'Describe what you need and suppliers will send you their best prices'}
            </p>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم المنتج بالعربي *' : 'Product Name *'}</label>
                <input className="form-input" value={newReq.title_ar} onChange={e => setNewReq({ ...newReq, title_ar: e.target.value })} placeholder={isAr ? 'مثال: كراسي مكتب' : 'e.g. Office Chairs'} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'اسم المنتج بالإنجليزي' : 'Product Name (English)'}</label>
                <input className="form-input" value={newReq.title_en} onChange={e => setNewReq({ ...newReq, title_en: e.target.value })} placeholder="e.g. Office Chairs" />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'الكمية المطلوبة *' : 'Quantity *'}</label>
                <input className="form-input" value={newReq.quantity} onChange={e => setNewReq({ ...newReq, quantity: e.target.value })} placeholder={isAr ? 'مثال: 500 قطعة' : 'e.g. 500 units'} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'تفاصيل إضافية' : 'Additional Details'}</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} value={newReq.description} onChange={e => setNewReq({ ...newReq, description: e.target.value })} placeholder={isAr ? 'المواصفات، اللون، الجودة، الميزانية...' : 'Specs, color, quality, budget...'} />
            </div>
            {!user && (
              <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 16, padding: '10px 14px', background: '#f0ede8', borderRadius: 3 }}>
                {isAr ? '💡 سيُطلب منك تسجيل الدخول عند إرسال الطلب' : '💡 You\'ll be asked to sign in when submitting'}
              </p>
            )}
            <button className="btn-dark-sm" onClick={submitNewRequest} disabled={submitting} style={{ padding: '13px 32px', fontSize: 14 }}>
              {submitting ? '...' : isAr ? 'إرسال الطلب ←' : 'Submit Request →'}
            </button>
          </div>
        </div>
      )}

      {/* ── واجهة المورد: قائمة الطلبات ── */}
      {isSupplier && (
        <div className="list-wrap">
          <div className="search-bar">
            <input className="search-input" placeholder={isAr ? 'ابحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <p style={{ color: '#6b6b6b', fontSize: 14, marginBottom: 24 }}>
            {filtered.length} {isAr ? 'طلبات مفتوحة' : 'open requests'}
          </p>

          {filtered.map(r => (
            <div key={r.id}>
              <div className="request-card">
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span className="status-badge status-open">{r.status}</span>
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
                <div className="offer-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'سعر الوحدة (ريال) *' : 'Unit Price (SAR) *'}</label>
                      <input className="form-input" type="number" value={offers[r.id]?.price || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], price: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'الحد الأدنى للكمية *' : 'MOQ *'}</label>
                      <input className="form-input" value={offers[r.id]?.moq || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], moq: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'مدة التسليم (أيام) *' : 'Delivery Days *'}</label>
                      <input className="form-input" type="number" value={offers[r.id]?.days || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], days: e.target.value } }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{isAr ? 'بلد المنشأ *' : 'Country of Origin *'}</label>
                      <input className="form-input" value={offers[r.id]?.origin || 'China'} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], origin: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'ملاحظة' : 'Note'}</label>
                    <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={offers[r.id]?.note || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)}>{isAr ? 'إرسال العرض' : 'Send Offer'}</button>
                    <button className="btn-outline" onClick={() => toggleOfferForm(r.id)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p style={{ color: '#6b6b6b', textAlign: 'center', padding: 40 }}>
              {isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}
            </p>
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