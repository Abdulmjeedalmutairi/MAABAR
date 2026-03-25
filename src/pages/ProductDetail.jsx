import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

export default function ProductDetail({ lang, user, profile }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [sampleQty, setSampleQty] = useState('1');
  const [sampleNote, setSampleNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingSample, setSendingSample] = useState(false);
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
        user_id: sup.id, type: 'new_request',
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

  const submitSample = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    if (!sup.id) return;

    const maxQty = product.sample_max_qty || 3;
    if (parseInt(sampleQty) > maxQty) {
      alert(isAr ? `الحد الأقصى للعينة ${maxQty} قطع` : `Max sample quantity is ${maxQty}`);
      return;
    }

    setSendingSample(true);
    const total = (parseFloat(product.sample_price || 0) + parseFloat(product.sample_shipping || 0)) * parseInt(sampleQty);

    const { error } = await sb.from('samples').insert({
      product_id: id,
      supplier_id: sup.id,
      buyer_id: user.id,
      quantity: parseInt(sampleQty),
      sample_price: parseFloat(product.sample_price || 0),
      shipping_price: parseFloat(product.sample_shipping || 0),
      total_price: total,
      notes: sampleNote || '',
      status: 'pending',
    });

    setSendingSample(false);
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }

    await sb.from('notifications').insert({
      user_id: sup.id, type: 'new_sample',
      title_ar: 'طلب عينة جديد على منتجك',
      title_en: 'New sample request on your product',
      title_zh: '您的产品收到了新样品请求',
      ref_id: id, is_read: false
    });

    alert(isAr ? '✅ تم إرسال طلب العينة! سيتواصل معك المورد قريباً' : '✅ Sample request sent! The supplier will contact you soon');
    setShowSampleForm(false);
    setSampleQty('1'); setSampleNote('');
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

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  // SKELETON
  if (loading) return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <div style={{ marginBottom: 32, width: 60, height: 16, background: 'var(--bg-hover)', borderRadius: 3 }} />
        <div style={{ width: '100%', maxWidth: 480, height: 320, background: 'var(--bg-hover)', borderRadius: 12, marginBottom: 32, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '60%', height: 40, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 16 }} />
        <div style={{ width: '30%', height: 28, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 24 }} />
        <div style={{ width: '100%', height: 80, background: 'var(--bg-hover)', borderRadius: 3 }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      </div>
    </div>
  );

  if (!product) return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 60 }}>
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

  const sampleTotal = product.sample_available
    ? (parseFloat(product.sample_price || 0) + parseFloat(product.sample_shipping || 0)) * parseInt(sampleQty || 1)
    : 0;

  return (
    <div className="product-detail-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div className="product-detail-inner">
        <button className="back-btn" onClick={() => nav('/products')}>
          {isAr ? '← العودة' : '← Back'}
        </button>

        {/* صورة + فيديو */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div className="product-detail-img" style={{ marginBottom: 0, flex: '1 1 280px' }}>
            {product.image_url
              ? <img src={product.image_url} alt={name} />
              : <span>📦</span>}
          </div>
          {product.video_url && (
            <div style={{ flex: '1 1 280px', maxWidth: 480, height: 320, borderRadius: 12, overflow: 'hidden', background: '#1a1a1a' }}>
              <video src={product.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <h1 className={`product-detail-name${isAr ? ' ar' : ''}`}>{name}</h1>
        <p className="product-detail-price">
          {product.price_from ? `${product.price_from} ${product.currency || 'SAR'}` : '—'}
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 16px',
          background: 'rgba(58,122,82,0.08)',
          border: '1px solid rgba(58,122,82,0.15)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 12, marginBottom: 20,
        }}>
          <span style={{
            width: 14, height: 14, borderRadius: '50%',
            background: 'rgba(58,122,82,0.2)',
            border: '1px solid rgba(58,122,82,0.3)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, color: '#5a9a72', fontWeight: 700, flexShrink: 0,
          }}>✓</span>
          <span style={{ color: '#5a9a72' }}>
            {isAr ? 'مدفوعاتك محمية · ادفع بقدر ما تثق' : "Your payment is protected · Pay what you're comfortable with"}
          </span>
        </div>

        <div className="product-detail-meta">
          <div>
            <p className="meta-label">{isAr ? 'الحد الأدنى' : 'Min. Order'}</p>
            <p className="meta-val">{product.moq || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{isAr ? 'المورد' : 'Supplier'}</p>
            <p className="meta-val">{sup.company_name || '—'}</p>
          </div>
          {product.sample_available && (
            <div>
              <p className="meta-label">{isAr ? 'العينة' : 'Sample'}</p>
              <p className="meta-val" style={{ color: '#2d7a4f', fontSize: 14 }}>
                {fmt(product.sample_price)} SAR
              </p>
            </div>
          )}
        </div>

        {desc && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>{desc}</p>
        )}

        {/* SUPPLIER CARD */}
        {sup.id && (
          <div className="supplier-card" onClick={() => nav(`/supplier/${sup.id}`)}>
            <div className="avatar">{(sup.company_name || '?')[0]}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, marginBottom: 4 }}>{sup.company_name || ''}</p>
              <p className="stars">{stars(Math.round(sup.rating || 0))}</p>
            </div>
            <span style={{ color: 'var(--text-secondary)' }}>→</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        {!isSupplier && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <button
              className="btn-primary"
              style={{ background: '#1a1a1a', color: '#fff', letterSpacing: 0 }}
              onClick={() => { setShowBuyForm(!showBuyForm); setShowSampleForm(false); }}>
              {isAr ? 'اشترِ الآن' : 'Buy Now'}
            </button>

            {product.sample_available && (
              <button
                className="btn-outline"
                style={{ borderColor: '#2d7a4f', color: '#2d7a4f' }}
                onClick={() => { setShowSampleForm(!showSampleForm); setShowBuyForm(false); }}>
                {isAr ? `اطلب عينة — ${fmt(product.sample_price)} SAR` : `Request Sample — ${fmt(product.sample_price)} SAR`}
              </button>
            )}

            <button className="btn-outline" onClick={handleChat}>
              {isAr ? 'تواصل مع المورد' : 'Contact Supplier'}
            </button>
          </div>
        )}

        {/* BUY FORM */}
        {showBuyForm && (
          <div className="buy-form">
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'اطلب هذا المنتج' : 'Order This Product'}
            </h3>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الكمية المطلوبة *' : 'Quantity *'}</label>
              <input className="form-input" value={qty} onChange={e => setQty(e.target.value)}
                placeholder={isAr ? 'مثال: 200 كرتون' : 'e.g. 200 cartons'} />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة للمورد' : 'Note to supplier'}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }}
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            {!user && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {isAr ? '* سيُطلب منك تسجيل الدخول عند الإرسال' : "* You'll be asked to sign in when submitting"}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-dark-sm" onClick={submitOrder} disabled={sending}>
                {sending ? '...' : isAr ? 'إرسال الطلب ←' : 'Send Order →'}
              </button>
              <button className="btn-outline" onClick={() => setShowBuyForm(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* SAMPLE FORM */}
        {showSampleForm && product.sample_available && (
          <div className="buy-form" style={{ borderColor: '#2d7a4f', borderWidth: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: 'var(--text-primary)' }}>
                  {isAr ? 'طلب عينة' : 'Request Sample'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr ? `سعر الوحدة: ${fmt(product.sample_price)} ريال + شحن: ${fmt(product.sample_shipping || 0)} ريال` : `Unit: ${fmt(product.sample_price)} SAR + Shipping: ${fmt(product.sample_shipping || 0)} SAR`}
                </p>
              </div>
              <span style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 10, padding: '3px 10px', borderRadius: 20, letterSpacing: 1 }}>
                {isAr ? 'عينة' : 'SAMPLE'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isAr ? `الكمية (max ${product.sample_max_qty || 3})` : `Quantity (max ${product.sample_max_qty || 3})`}</label>
                <input className="form-input" type="number"
                  min="1" max={product.sample_max_qty || 3}
                  value={sampleQty} onChange={e => setSampleQty(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderRadius: 3, width: '100%' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 1 }}>{isAr ? 'الإجمالي' : 'TOTAL'}</p>
                  <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                    {fmt(sampleTotal)} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SAR</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة' : 'Note'}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }}
                value={sampleNote} onChange={e => setSampleNote(e.target.value)}
                placeholder={isAr ? 'اللون، المواصفات...' : 'Color, specs...'} />
            </div>

            {product.sample_note && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                💬 {product.sample_note}
              </p>
            )}

            {!user && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {isAr ? '* سيُطلب منك تسجيل الدخول عند الإرسال' : "* You'll be asked to sign in when submitting"}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '11px 24px', fontSize: 13, cursor: 'pointer', borderRadius: 3 }}
                onClick={submitSample} disabled={sendingSample}>
                {sendingSample ? '...' : isAr ? 'إرسال طلب العينة ←' : 'Send Sample Request →'}
              </button>
              <button className="btn-outline" onClick={() => setShowSampleForm(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
