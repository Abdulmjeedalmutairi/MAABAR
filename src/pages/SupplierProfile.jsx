import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

export default function SupplierProfile({ lang, user }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleForms, setSampleForms] = useState({});
  const [sampleData, setSampleData] = useState({});
  const [sendingSample, setSendingSample] = useState({});
  const isAr = lang === 'ar';

  useEffect(() => { loadSupplier(); }, [id]);

  const loadSupplier = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('products').select('*').eq('supplier_id', id).eq('is_active', true)
    ]);
    if (s) setSupplier(s);
    if (p) setProducts(p);
    setLoading(false);
  };

  const toggleSampleForm = (productId) => {
    setSampleForms(prev => ({ ...prev, [productId]: !prev[productId] }));
    setSampleData(prev => ({ ...prev, [productId]: prev[productId] || { qty: '1', note: '' } }));
  };

  const submitSample = async (p) => {
    if (!user) { nav('/login/buyer'); return; }
    const d = sampleData[p.id] || { qty: '1', note: '' };
    const maxQty = p.sample_max_qty || 3;
    if (parseInt(d.qty) > maxQty) {
      alert(isAr ? `الحد الأقصى ${maxQty} قطع` : `Max ${maxQty} units`);
      return;
    }
    setSendingSample(prev => ({ ...prev, [p.id]: true }));
    const total = (parseFloat(p.sample_price || 0) + parseFloat(p.sample_shipping || 0)) * parseInt(d.qty);
    const { error } = await sb.from('samples').insert({
      product_id: p.id,
      supplier_id: id,
      buyer_id: user.id,
      quantity: parseInt(d.qty),
      sample_price: parseFloat(p.sample_price || 0),
      shipping_price: parseFloat(p.sample_shipping || 0),
      total_price: total,
      notes: d.note || '',
      status: 'pending',
    });
    setSendingSample(prev => ({ ...prev, [p.id]: false }));
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    await sb.from('notifications').insert({
      user_id: id, type: 'new_sample',
      title_ar: 'طلب عينة جديد على منتجك',
      title_en: 'New sample request on your product',
      title_zh: '您的产品收到了新样品请求',
      ref_id: p.id, is_read: false
    });
    alert(isAr ? '✅ تم إرسال طلب العينة!' : '✅ Sample request sent!');
    toggleSampleForm(p.id);
  };

  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
    return s;
  };

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  // SKELETON
  if (loading) return (
    <div className="profile-wrap">
      <div className="profile-hero">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 200, height: 24, background: 'rgba(255,255,255,0.15)', borderRadius: 3, marginBottom: 10, animation: 'pulse 1.5s ease infinite' }} />
          <div style={{ width: 120, height: 14, background: 'rgba(255,255,255,0.1)', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );

  if (!supplier) return (
    <div className="profile-wrap">
      <div className="profile-body">
        <p style={{ color: '#7a7a7a' }}>{isAr ? 'المورد غير موجود' : 'Supplier not found'}</p>
      </div>
    </div>
  );

  return (
    <div className="profile-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HERO */}
      <div className="profile-hero">
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
          {supplier.avatar_url
            ? <img src={supplier.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (supplier.company_name || '?')[0]}
        </div>
        <div>
          <h1 className={`profile-name${isAr ? ' ar' : ''}`}>{supplier.company_name}</h1>
          <p className="profile-meta">
            <span className="stars">{stars(Math.round(supplier.rating || 0))}</span>
            {supplier.city ? ` · ${supplier.city}` : ''}
            {supplier.country ? ` · ${supplier.country}` : ''}
          </p>
          {/* إحصائيات بسيطة */}
          <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'rgba(247,245,242,0.5)', letterSpacing: 1 }}>
              {products.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
            </span>
            {products.filter(p => p.sample_available).length > 0 && (
              <span style={{ fontSize: 12, color: '#2d7a4f', background: 'rgba(45,122,79,0.15)', padding: '2px 10px', borderRadius: 20, letterSpacing: 1 }}>
                {isAr ? 'عينات متاحة' : lang === 'zh' ? '可提供样品' : 'Samples Available'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="profile-body">
        {(supplier.bio_ar || supplier.bio_en) && (
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 32 }}>
            {isAr ? supplier.bio_ar || supplier.bio_en : supplier.bio_en || supplier.bio_ar}
          </p>
        )}

        {/* أزرار التواصل */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <button className="btn-dark-sm"
            onClick={() => { if (!user) nav('/login'); else nav(`/chat/${supplier.id}`); }}>
            {isAr ? 'تواصل مع المورد' : lang === 'zh' ? '联系供应商' : 'Contact Supplier'}
          </button>
          <button className="btn-outline" onClick={() => nav('/requests')}>
            {isAr ? 'ارفع طلب' : lang === 'zh' ? '发布需求' : 'Post Request'}
          </button>
        </div>

        {/* المنتجات */}
        <p className="section-label">{isAr ? 'منتجاته' : lang === 'zh' ? '产品列表' : 'Products'}</p>

        {products.length === 0 ? (
          <p style={{ color: '#6b6b6b' }}>{isAr ? 'لا توجد منتجات بعد' : 'No products yet'}</p>
        ) : (
          products.map((p, idx) => (
            <div key={p.id} style={{ animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
              {/* صف المنتج */}
              <div className="product-list-item" onClick={() => nav(`/products/${p.id}`)}>
                <div className="product-img">
                  {p.image_url
                    ? <img src={p.image_url} alt="" />
                    : <span style={{ fontSize: 32 }}>📦</span>}
                </div>
                <div className="product-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 className={`product-name${isAr ? ' ar' : ''}`}>
                      {isAr ? p.name_ar || p.name_en : lang === 'zh' ? p.name_zh || p.name_en : p.name_en || p.name_ar}
                    </h3>
                    {p.video_url && (
                      <span style={{ fontSize: 9, padding: '2px 8px', background: '#EFECE7', borderRadius: 10, color: '#7a7a7a', letterSpacing: 1 }}>VIDEO</span>
                    )}
                    {p.sample_available && (
                      <span style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 10, color: '#2d7a4f', letterSpacing: 1 }}>
                        {isAr ? 'عينة' : 'SAMPLE'}
                      </span>
                    )}
                  </div>
                  <p className="product-price">{p.price_from ? `${p.price_from} SAR` : '—'}</p>
                  <p className="product-meta">MOQ: {p.moq || '—'}</p>
                </div>
                <div className="product-btns" onClick={e => e.stopPropagation()}>
                  <button className="btn-dark-sm" onClick={() => nav(`/products/${p.id}`)}>
                    {isAr ? 'التفاصيل' : lang === 'zh' ? '详情' : 'Details'}
                  </button>
                  {p.sample_available && (
                    <button
                      style={{
                        background: 'none', border: '1px solid #2d7a4f',
                        color: '#2d7a4f', padding: '8px 16px', fontSize: 12,
                        cursor: 'pointer', borderRadius: 3, whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2d7a4f'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#2d7a4f'; }}
                      onClick={() => toggleSampleForm(p.id)}>
                      {isAr ? `عينة — ${fmt(p.sample_price)} SAR` : `Sample — ${fmt(p.sample_price)} SAR`}
                    </button>
                  )}
                </div>
              </div>

              {/* فورم العينة */}
              {sampleForms[p.id] && (
                <div style={{
                  background: 'rgba(45,122,79,0.04)', border: '1px solid rgba(45,122,79,0.2)',
                  borderTop: 'none', padding: '20px 24px', marginBottom: 14,
                  borderRadius: '0 0 6px 6px', animation: 'fadeIn 0.3s ease',
                }}>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr
                      ? `سعر الوحدة: ${fmt(p.sample_price)} ريال + شحن: ${fmt(p.sample_shipping || 0)} ريال · الحد الأقصى: ${p.sample_max_qty || 3} قطع`
                      : `Unit: ${fmt(p.sample_price)} SAR + Ship: ${fmt(p.sample_shipping || 0)} SAR · Max: ${p.sample_max_qty || 3}`}
                  </p>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ flex: '0 0 120px' }}>
                      <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 6 }}>
                        {isAr ? 'الكمية' : 'Quantity'}
                      </label>
                      <input
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', background: 'var(--bg-raised)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', borderRadius: 3 }}
                        type="number" min="1" max={p.sample_max_qty || 3}
                        value={sampleData[p.id]?.qty || '1'}
                        onChange={e => setSampleData(prev => ({ ...prev, [p.id]: { ...prev[p.id], qty: e.target.value } }))}
                      />
                    </div>
                    <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderRadius: 3, minWidth: 120 }}>
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 1 }}>{isAr ? 'الإجمالي' : 'TOTAL'}</p>
                      <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                        {fmt((parseFloat(p.sample_price || 0) + parseFloat(p.sample_shipping || 0)) * parseInt(sampleData[p.id]?.qty || 1))} SAR
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 6 }}>
                      {isAr ? 'ملاحظة' : 'Note'}
                    </label>
                    <input
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border-default)', background: 'var(--bg-raised)', fontSize: 13, color: 'var(--text-primary)', outline: 'none', borderRadius: 3, boxSizing: 'border-box' }}
                      value={sampleData[p.id]?.note || ''}
                      onChange={e => setSampleData(prev => ({ ...prev, [p.id]: { ...prev[p.id], note: e.target.value } }))}
                      placeholder={isAr ? 'اللون، المواصفات...' : 'Color, specs...'}
                    />
                  </div>

                  {p.sample_note && (
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      💬 {p.sample_note}
                    </p>
                  )}

                  {!user && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {isAr ? '💡 سيُطلب منك تسجيل الدخول عند الإرسال' : "💡 You'll be asked to sign in when submitting"}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '10px 20px', fontSize: 12, cursor: 'pointer', borderRadius: 3, transition: 'opacity 0.2s', opacity: sendingSample[p.id] ? 0.5 : 1 }}
                      onClick={() => submitSample(p)} disabled={sendingSample[p.id]}>
                      {sendingSample[p.id] ? '...' : isAr ? 'إرسال طلب العينة ←' : 'Send Sample Request →'}
                    </button>
                    <button className="btn-outline" onClick={() => toggleSampleForm(p.id)}>
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
