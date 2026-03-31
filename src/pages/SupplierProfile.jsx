import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { buildProductSpecs, getPrimaryProductImage, getProductGalleryImages } from '../lib/productMedia';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  getSupplierPublicVisibilityStatuses,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

export default function SupplierProfile({ lang, user, displayCurrency, exchangeRates }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [similarSuppliers, setSimilarSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleForms, setSampleForms] = useState({});
  const [sampleData, setSampleData] = useState({});
  const [sendingSample, setSendingSample] = useState({});
  const [calcQty, setCalcQty] = useState('');
  const [calcProduct, setCalcProduct] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const isAr = lang === 'ar';
  const supplierTrustSignals = buildSupplierTrustSignals(supplier || {});
  const isReviewedSupplier = isSupplierPubliclyVisible(supplier?.status);
  const supplierMaabarId = getSupplierMaabarId(supplier || {});

  useEffect(() => { loadSupplier(); }, [id, user?.id]);

  const loadSupplier = async () => {
    setLoading(true);
    const [{ data: s }, { data: p }, { data: r }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('products').select('*').eq('supplier_id', id).eq('is_active', true),
      sb.from('reviews').select('*,profiles!reviews_buyer_id_fkey(full_name)').eq('supplier_id', id).order('created_at', { ascending: false }),
    ]);

    const canViewSupplier = s && (isSupplierPubliclyVisible(s.status) || user?.id === id);

    if (canViewSupplier) {
      setSupplier(s);
      if (s.speciality) {
        const { data: sim } = await sb.from('profiles')
          .select('id,company_name,rating,city,avatar_url,status')
          .eq('role', 'supplier')
          .in('status', getSupplierPublicVisibilityStatuses())
          .eq('speciality', s.speciality)
          .neq('id', id)
          .limit(3);
        if (sim) setSimilarSuppliers(sim);
      }
      if (p) setProducts(p);
      if (r) setReviews(r);
    } else {
      setSupplier(null);
      setProducts([]);
      setReviews([]);
      setSimilarSuppliers([]);
    }

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
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'new_sample',
          data: {
            recipientUserId: id,
            productName: p.name_ar || p.name_en || p.name_zh || 'Product',
            quantity: d.qty,
            totalPrice: total,
            lang,
          },
        }),
      });
    } catch (e) { console.error('sample email error:', e); }
    alert(isAr ? '✅ تم إرسال طلب العينة!' : '✅ Sample request sent!');
    toggleSampleForm(p.id);
  };

  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
    return s;
  };

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  const calcPrice = () => {
    if (!calcProduct || !calcQty) return;
    const qty   = parseFloat(calcQty);
    const price = calcProduct.price_from;
    setCalcResult({
      unitPrice: price,
      total: qty * price,
      currency: calcProduct.currency || 'USD',
      meetsmoq: qty >= parseFloat(calcProduct.moq || 1),
      moq: calcProduct.moq,
    });
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 className={`profile-name${isAr ? ' ar' : ''}`} style={{ margin: 0 }}>{supplier.company_name}</h1>
            {isReviewedSupplier && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px',
                background: 'rgba(139,120,255,0.10)',
                border: '1px solid rgba(139,120,255,0.25)',
                borderRadius: 20, fontSize: 11,
                color: 'rgba(139,120,255,0.85)',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700 }}>✓</span>
                {isAr ? 'مورد موثّق' : lang === 'zh' ? '认证供应商' : 'Verified Supplier'}
              </div>
            )}
          </div>


          <p className="profile-meta">
            <span className="stars">{stars(Math.round(supplier.rating || 0))}</span>
            {supplier.city ? ` · ${supplier.city}` : ''}
            {supplier.country ? ` · ${supplier.country}` : ''}
          </p>
          {supplierMaabarId && isReviewedSupplier && (
            <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: 11, letterSpacing: 0.4 }}>
              <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'معرّف مورد مَعبر' : lang === 'zh' ? 'Maabar 供应商编号' : 'Maabar Supplier ID'}</span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{supplierMaabarId}</strong>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
              {products.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
            </span>
            {products.filter(p => p.sample_available).length > 0 && (
              <span style={{ fontSize: 11, color: 'rgba(139,120,255,0.85)', background: 'rgba(139,120,255,0.08)', padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(139,120,255,0.2)' }}>
                {isAr ? 'عينات متاحة' : lang === 'zh' ? '可提供样品' : 'Samples Available'}
              </span>
            )}
            {supplier.min_order_value && (
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {isAr ? `أقل طلب: ${supplier.min_order_value} ريال` : `Min order: ${supplier.min_order_value} SAR`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="profile-body">

        {/* FACTORY IMAGES */}
        {supplier.factory_images?.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12 }}>
              {isAr ? 'صور المصنع' : lang === 'zh' ? '工厂图片' : 'Factory Images'}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {supplier.factory_images.map((img, i) => (
                <div key={i} style={{ width: 120, height: 80, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROTECTION BADGE */}
        <div style={{
          padding: '10px 16px', marginBottom: 24,
          background: 'rgba(139,120,255,0.06)',
          border: '1px solid rgba(139,120,255,0.15)',
          borderRadius: 'var(--radius-md)',
          fontSize: 12, color: 'rgba(139,120,255,0.7)',
          textAlign: isAr ? 'right' : 'left',
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {isAr ? 'للحماية الكاملة — أتمّ صفقتك عبر معبر' : lang === 'zh' ? '获得完整保障 — 通过Maabar完成交易' : 'For full protection — complete your deal on Maabar'}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
              {isAr ? 'مراجعة مَعبر' : lang === 'zh' ? 'Maabar 审核' : 'Maabar review'}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isReviewedSupplier
                ? (isAr ? 'تمت مراجعة هذا المورد وإتاحته للمشترين على المنصة.' : lang === 'zh' ? '该供应商已通过 Maabar 审核并对买家开放。' : 'This supplier has been reviewed by Maabar and is visible to buyers.')
                : (isAr ? 'الملف ما زال قيد المراجعة.' : lang === 'zh' ? '该供应商资料仍在审核中。' : 'This supplier profile is still under review.')}
            </p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
              {isAr ? 'دلائل الثقة' : lang === 'zh' ? '信任信号' : 'Trust signals'}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr
                ? `${supplierTrustSignals.includes('trade_profile_available') ? 'رابط الشركة متوفر' : 'لا يوجد رابط شركة معروض'}${supplierTrustSignals.includes('wechat_available') ? ' · WeChat متاح' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · صور منشأة متاحة' : ''}`
                : lang === 'zh'
                  ? `${supplierTrustSignals.includes('trade_profile_available') ? '已提供店铺/官网链接' : '暂未展示店铺链接'}${supplierTrustSignals.includes('wechat_available') ? ' · 支持 WeChat 沟通' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · 提供工厂图片' : ''}`
                  : `${supplierTrustSignals.includes('trade_profile_available') ? 'trade profile available' : 'no public trade profile shown'}${supplierTrustSignals.includes('wechat_available') ? ' · WeChat available' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · factory photos available' : ''}`}
            </p>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
              {isAr ? 'طريقة العمل' : lang === 'zh' ? '合作方式' : 'Working model'}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'التفاوض والاتفاق يتمان عبر معبر، مع حماية أوضح للدفعات والتوثيق.' : lang === 'zh' ? '建议通过 Maabar 完成沟通、报价与交易，以获得更清晰的付款与记录保障。' : 'Use Maabar for communication, quoting, and transaction flow to keep payment and records protected.'}
            </p>
          </div>
        </div>

        {supplier.trade_link && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
            <a href={supplier.trade_link} target="_blank" rel="noreferrer" className="btn-outline" style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
              {isAr ? 'عرض رابط الشركة / المتجر' : lang === 'zh' ? '查看官网 / 店铺链接' : 'View company / store link'}
            </a>
            {supplier.wechat && (
              <span style={{ fontSize: 11, padding: '0 12px', minHeight: 38, borderRadius: 'var(--radius-md)', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                WeChat: {supplier.wechat}
              </span>
            )}
          </div>
        )}

        {(supplier.bio_ar || supplier.bio_en || supplier.bio_zh) && (
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
            {isAr ? supplier.bio_ar || supplier.bio_en : supplier.bio_en || supplier.bio_ar}
          </p>
        )}

        {/* COMPANY STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1, background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 28 }}>
          {[
            supplier.export_years && { label: isAr ? 'سنوات التصدير' : 'Export Years', val: supplier.export_years },
            supplier.city && { label: isAr ? 'المدينة' : 'City', val: supplier.city },
            supplier.country && { label: isAr ? 'الدولة' : 'Country', val: supplier.country },
            supplier.speciality && { label: isAr ? 'التخصص' : 'Specialty', val: supplier.speciality },
            supplier.deals_completed && { label: isAr ? 'صفقات مكتملة' : 'Deals', val: supplier.deals_completed },
            supplier.completion_rate && { label: isAr ? 'نسبة الإتمام' : 'Completion', val: `${supplier.completion_rate}%` },
            supplier.created_at && { label: isAr ? 'عضو منذ' : 'Member Since', val: new Date(supplier.created_at).getFullYear() },
          ].filter(Boolean).map((stat, i) => (
            <div key={i} style={{ background: 'var(--bg-subtle)', padding: '12px 14px' }}>
              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{stat.label}</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{stat.val}</p>
            </div>
          ))}
        </div>

        {/* أزرار التواصل */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
          <button className="btn-dark-sm"
            onClick={() => { if (!user) nav('/login'); else nav(`/chat/${supplier.id}`); }}>
            {isAr ? 'تواصل مباشر' : lang === 'zh' ? '直接联系' : 'Direct Contact'}
          </button>
          {products.some(p => p.sample_available) && (
            <button className="btn-outline" style={{ borderColor: 'rgba(139,120,255,0.3)', color: 'rgba(139,120,255,0.85)' }}
              onClick={() => document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' })}>
              {isAr ? 'طلب عينة' : lang === 'zh' ? '请求样品' : 'Request Sample'}
            </button>
          )}
          <button className="btn-outline" onClick={() => nav('/requests')}>
            {isAr ? 'ارفع طلب' : lang === 'zh' ? '发布需求' : 'Post Request'}
          </button>
        </div>

        {/* المنتجات */}
        <p id="products-section" className="section-label">{isAr ? 'منتجاته' : lang === 'zh' ? '产品列表' : 'Products'}</p>

        {products.length === 0 ? (
          <p style={{ color: '#6b6b6b' }}>{isAr ? 'لا توجد منتجات بعد' : 'No products yet'}</p>
        ) : (
          products.map((p, idx) => (
            <div key={p.id} style={{ animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
              {/* صف المنتج */}
              <div className="product-list-item" onClick={() => nav(`/products/${p.id}`)}>
                <div className="product-img">
                  {getPrimaryProductImage(p)
                    ? <img src={getPrimaryProductImage(p)} alt="" />
                    : <span style={{ fontSize: 32 }}>📦</span>}
                </div>
                <div className="product-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 className={`product-name${isAr ? ' ar' : ''}`}>
                      {isAr ? p.name_ar || p.name_en : lang === 'zh' ? p.name_zh || p.name_en : p.name_en || p.name_ar}
                    </h3>
                    {getProductGalleryImages(p).length > 1 && (
                      <span style={{ fontSize: 9, padding: '2px 8px', background: '#EFECE7', borderRadius: 10, color: '#7a7a7a', letterSpacing: 1 }}>{getProductGalleryImages(p).length} IMG</span>
                    )}
                    {p.video_url && (
                      <span style={{ fontSize: 9, padding: '2px 8px', background: '#EFECE7', borderRadius: 10, color: '#7a7a7a', letterSpacing: 1 }}>VIDEO</span>
                    )}
                    {p.sample_available && (
                      <span style={{ fontSize: 9, padding: '2px 8px', background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 10, color: '#2d7a4f', letterSpacing: 1 }}>
                        {isAr ? 'عينة' : 'SAMPLE'}
                      </span>
                    )}
                  </div>
                  {(() => {
                    const price = buildDisplayPrice({ amount: p.price_from, sourceCurrency: p.currency || 'USD', displayCurrency: displayCurrency || p.currency || 'USD', rates: exchangeRates, lang });
                    return (
                      <>
                        <p className="product-price">{p.price_from ? price.formattedDisplay : '—'}</p>
                        {price.isConverted && <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>{isAr ? `الأصل: ${price.formattedSource}` : lang === 'zh' ? `原始价格：${price.formattedSource}` : `Source: ${price.formattedSource}`}</p>}
                      </>
                    );
                  })()}
                  <p className="product-meta">MOQ: {p.moq || '—'}</p>
                  {buildProductSpecs(p).slice(0, 2).length > 0 && (
                    <p className="product-meta" style={{ marginTop: 4 }}>
                      {buildProductSpecs(p).slice(0, 2).map(spec => `${spec.label}: ${spec.value}`).join(' · ')}
                    </p>
                  )}
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

      {/* PRICE CALCULATOR */}
      {products.length > 0 && (
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-muted)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px 24px',
          marginTop: 24,
        }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 14, textTransform: 'uppercase' }}>
            {isAr ? 'احسب سعرك' : 'Calculate Your Price'}
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <select
              style={{
                flex: 1, minWidth: 140, padding: '10px 12px', fontSize: 13,
                border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)',
                outline: 'none', cursor: 'pointer', minHeight: 42,
              }}
              value={calcProduct?.id || ''}
              onChange={e => { setCalcProduct(products.find(p => p.id === e.target.value) || null); setCalcResult(null); }}>
              <option value="">{isAr ? 'اختر منتج' : 'Select product'}</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {isAr ? p.name_ar || p.name_en : p.name_en || p.name_ar}
                </option>
              ))}
            </select>
            <input
              style={{
                width: 110, padding: '10px 12px', fontSize: 13,
                border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)',
                color: 'var(--text-primary)', borderRadius: 'var(--radius-md)',
                outline: 'none', minHeight: 42,
              }}
              type="number"
              placeholder={isAr ? 'الكمية' : 'Quantity'}
              value={calcQty}
              onChange={e => { setCalcQty(e.target.value); setCalcResult(null); }}
            />
            <button
              className="btn-dark-sm"
              onClick={calcPrice}
              style={{ minHeight: 42 }}>
              {isAr ? 'احسب' : 'Calculate'}
            </button>
          </div>
          {calcResult && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
                  {isAr ? 'سعر الوحدة' : 'Unit Price'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                  {calcResult.unitPrice} {calcResult.currency}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: calcResult.meetsmoq ? 0 : 10 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr ? 'الإجمالي' : 'Total'}
                </span>
                <span style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)' }}>
                  {calcResult.total.toLocaleString()} {calcResult.currency}
                </span>
              </div>
              {!calcResult.meetsmoq && (
                <p style={{ fontSize: 11, color: '#a08850', padding: '6px 10px', background: 'rgba(122,96,48,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(122,96,48,0.2)', marginTop: 8 }}>
                  {isAr ? `الحد الأدنى للطلب: ${calcResult.moq} قطعة` : `Min order: ${calcResult.moq} units`}
                </p>
              )}
            </div>
          )}
        </div>
      )}

        {/* REVIEWS */}
        {reviews.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <p className="section-label" style={{ marginBottom: 20 }}>
              {isAr ? 'التقييمات' : lang === 'zh' ? '评价' : 'Reviews'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map((rv, i) => (
                <div key={rv.id || i} style={{
                  padding: '16px 20px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {rv.profiles?.full_name || (isAr ? 'تاجر' : 'Buyer')}
                    </span>
                    <span style={{ color: '#f5a623', fontSize: 13 }}>
                      {Array.from({ length: 5 }, (_, j) => j < (rv.rating || 0) ? '★' : '☆').join('')}
                    </span>
                  </div>
                  {rv.comment && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {rv.comment}
                    </p>
                  )}
                  {(rv.quality_rating || rv.shipping_rating || rv.communication_rating) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      {rv.quality_rating && <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{isAr ? 'الجودة' : 'Quality'}: {rv.quality_rating}/5</span>}
                      {rv.shipping_rating && <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{isAr ? 'الشحن' : 'Shipping'}: {rv.shipping_rating}/5</span>}
                      {rv.communication_rating && <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{isAr ? 'التواصل' : 'Comm'}: {rv.communication_rating}/5</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SIMILAR SUPPLIERS */}
        {similarSuppliers.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <p className="section-label" style={{ marginBottom: 20 }}>
              {isAr ? 'موردون مشابهون' : lang === 'zh' ? '类似供应商' : 'Similar Suppliers'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {similarSuppliers.map(s => (
                <div key={s.id} onClick={() => nav(`/supplier/${s.id}`)} style={{
                  padding: '16px', background: 'var(--bg-raised)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {s.avatar_url
                        ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{(s.company_name || '?')[0]}</span>}
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{s.company_name}</p>
                  </div>
                  {s.rating > 0 && (
                    <p style={{ fontSize: 12, color: '#f5a623' }}>
                      {Array.from({ length: 5 }, (_, j) => j < Math.round(s.rating) ? '★' : '☆').join('')}
                    </p>
                  )}
                  {s.city && <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>{s.city}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

      <Footer lang={lang} />
    </div>
  );
}
