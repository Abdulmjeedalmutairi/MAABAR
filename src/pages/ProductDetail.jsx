import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

export default function ProductDetail({ lang, user, profile }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';

  useEffect(() => { loadProduct(); }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const { data } = await sb
      .from('products')
      .select('*,profiles(id,company_name,city,country,rating,reviews_count,avatar_url)')
      .eq('id', id)
      .single();
    if (data) setProduct(data);
    setLoading(false);
  };

  const submitOrder = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!qty) { alert(isAr ? 'يرجى تحديد الكمية' : 'Please enter quantity'); return; }
    if (!product) return;
    setSending(true);
    const sup = product.profiles || {};
    const short = (isAr ? 'طلب شراء: ' : 'Buy order: ') + (product.name_ar || product.name_en);
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: short, title_en: short, title_zh: short,
      quantity: qty, description: note || '',
      product_ref: id, status: 'open'
    });
    setSending(false);
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    if (sup.id) {
      await sb.from('notifications').insert({
        user_id: sup.id,
        type: 'new_request',
        title_ar: 'طلب شراء جديد على منتجك',
        title_en: 'New purchase order on your product',
        title_zh: '您的产品收到了新采购订单',
        ref_id: id, is_read: false
      });
    }
    alert(isAr ? '✅ تم إرسال طلبك!' : '✅ Order sent!');
    setShowBuyForm(false);
    setQty(''); setNote('');
  };

  const handleChat = () => {
    if (!product) return;
    if (!user) { nav('/login/buyer'); return; }
    const sup = product.profiles || {};
    if (!sup.id) return;
    nav(`/chat/${sup.id}`);
  };

  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
    return s;
  };

  // SKELETON
  if (loading) return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <div style={{ marginBottom: 32, width: 60, height: 16, background: '#E5E0D8', borderRadius: 3 }} />
        <div style={{ width: '100%', maxWidth: 480, height: 320, background: '#E5E0D8', borderRadius: 12, marginBottom: 32, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '60%', height: 40, background: '#E5E0D8', borderRadius: 3, marginBottom: 16 }} />
        <div style={{ width: '30%', height: 28, background: '#E5E0D8', borderRadius: 3, marginBottom: 24 }} />
        <div style={{ width: '100%', height: 80, background: '#E5E0D8', borderRadius: 3 }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    </div>
  );

  if (!product) return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <p style={{ color: '#7a7a7a', textAlign: 'center', padding: 60 }}>
          {isAr ? 'المنتج غير موجود' : 'Product not found'}
        </p>
      </div>
    </div>
  );

  const sup = product.profiles || {};
  const name = lang === 'ar'
    ? product.name_ar || product.name_en
    : lang === 'zh'
    ? product.name_zh || product.name_en
    : product.name_en || product.name_ar;
  const desc = lang === 'ar'
    ? product.desc_ar || product.desc_en
    : product.desc_en || product.desc_ar;

  return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <button className="back-btn" onClick={() => nav('/products')}>
          {isAr ? '← العودة' : '← Back'}
        </button>

        <div className="product-detail-img">
          {product.image_url
            ? <img src={product.image_url} alt={name} />
            : <span>📦</span>}
        </div>

        <h1 className={`product-detail-name${isAr ? ' ar' : ''}`}>{name}</h1>
        <p className="product-detail-price">
          {product.price_from ? `${product.price_from} ${product.currency || 'SAR'}` : '—'}
        </p>

        <div className="product-detail-meta">
          <div>
            <p className="meta-label">{isAr ? 'الحد الأدنى' : 'Min. Order'}</p>
            <p className="meta-val">{product.moq || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{isAr ? 'المورد' : 'Supplier'}</p>
            <p className="meta-val">{sup.company_name || '—'}</p>
          </div>
        </div>

        {desc && (
          <p style={{ color: '#6b6b6b', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
            {desc}
          </p>
        )}

        {/* SUPPLIER CARD */}
        {sup.id && (
          <div className="supplier-card" onClick={() => nav(`/supplier/${sup.id}`)}>
            <div className="avatar">{(sup.company_name || '?')[0]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>{sup.company_name || ''}</p>
              <p className="stars">{stars(Math.round(sup.rating || 0))}</p>
            </div>
            <span style={{ color: '#6b6b6b' }}>→</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          {!isSupplier && (
            <button
              className="btn-primary"
              style={{ background: '#1a1a1a', color: '#fff', letterSpacing: 0 }}
              onClick={() => setShowBuyForm(!showBuyForm)}>
              {isAr ? 'اشترِ الآن' : 'Buy Now'}
            </button>
          )}
          <button className="btn-outline" onClick={handleChat}>
            {isAr ? 'تواصل مع المورد' : 'Contact Supplier'}
          </button>
        </div>

        {/* BUY FORM */}
        {showBuyForm && (
          <div className="buy-form">
            <h3 className="buy-form-title" style={{
              fontSize: 18, fontWeight: 400, marginBottom: 20,
              fontFamily: isAr ? 'var(--font-ar)' : 'inherit'
            }}>
              {isAr ? 'اطلب هذا المنتج' : 'Order This Product'}
            </h3>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الكمية المطلوبة *' : 'Quantity *'}</label>
              <input
                className="form-input"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder={isAr ? 'مثال: 200 كرتون' : 'e.g. 200 cartons'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة للمورد' : 'Note to supplier'}</label>
              <textarea
                className="form-input"
                rows={2}
                style={{ resize: 'none' }}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            {!user && (
              <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 12 }}>
                {isAr ? '* سيُطلب منك تسجيل الدخول عند الإرسال' : '* You\'ll be asked to sign in when submitting'}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-dark-sm" onClick={submitOrder} disabled={sending}>
                {sending ? '...' : isAr ? 'إرسال الطلب للمورد ←' : 'Send Order →'}
              </button>
              <button className="btn-outline" onClick={() => setShowBuyForm(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
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