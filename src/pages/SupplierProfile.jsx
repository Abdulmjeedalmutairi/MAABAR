import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { getPrimaryProductImage } from '../lib/productMedia';
import { isSupplierPubliclyVisible } from '../lib/supplierOnboarding';
import { fetchSupplierPublicProfileById } from '../lib/profileVisibility';
import { PRODUCT_TIER_EMBED, deriveProductPriceFrom } from '../lib/productPriceLookup';
import { PRODUCT_CERT_EMBED, getProductCertTypes } from '../lib/productCertLookup';
import { T } from '../lib/supplierDashboardConstants';
import ProductBuyerCardSummary from '../components/ProductBuyerCardSummary';
import BrandedLoading from '../components/BrandedLoading';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

function SectionLabel({ label, isAr }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <p style={{
        fontSize: 10,
        fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif",
        letterSpacing: isAr ? 0 : '1.2px',
        textTransform: 'uppercase',
        color: '#b0ab9e',
        margin: 0,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </p>
      <div style={{ flex: 1, height: 1, background: '#e8e5de' }} />
    </div>
  );
}

export default function SupplierProfile({ lang, user, displayCurrency, exchangeRates }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sampleForms, setSampleForms] = useState({});
  const [sampleData, setSampleData] = useState({});
  const [sendingSample, setSendingSample] = useState({});
  const [calcQty, setCalcQty] = useState('');
  const [calcProduct, setCalcProduct] = useState(null);
  const [calcResult, setCalcResult] = useState(null);

  const isAr = lang === 'ar';
  const isReviewedSupplier = isSupplierPubliclyVisible(supplier?.status);
  const companyDescription = supplier?.company_description || supplier?.bio_en || supplier?.bio_ar || supplier?.bio_zh || '';
  const supplierLanguages = Array.isArray(supplier?.languages) ? supplier.languages : [];
  const exportMarkets = Array.isArray(supplier?.export_markets) ? supplier.export_markets : [];
  const certifications = Array.isArray(supplier?.certifications) ? supplier.certifications : [];

  useEffect(() => { loadSupplier(); }, [id, user?.id]);

  const loadSupplier = async () => {
    setLoading(true);

    let visibleSupplier = await fetchSupplierPublicProfileById(sb, id);

    if (!visibleSupplier && user?.id === id) {
      const { data: ownSupplier } = await sb
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      visibleSupplier = ownSupplier || null;
    }

    if (!visibleSupplier) {
      setSupplier(null);
      setProducts([]);
      setReviews([]);
      setLoading(false);
      return;
    }

    setSupplier(visibleSupplier);

    const [{ data: p }, { data: r }] = await Promise.all([
      sb.from('products').select(`*, ${PRODUCT_TIER_EMBED}, ${PRODUCT_CERT_EMBED}`).eq('supplier_id', id).eq('is_active', true),
      sb.from('reviews').select('*').eq('supplier_id', id).order('created_at', { ascending: false }),
    ]);

    setProducts(p || []);
    setReviews(r || []);
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

  const fmt = (n) => Number(n).toLocaleString('ar-SA-u-nu-latn', { maximumFractionDigits: 2 });

  const calcPrice = () => {
    if (!calcProduct || !calcQty) return;
    const qty = parseFloat(calcQty);
    const price = deriveProductPriceFrom(calcProduct);
    setCalcResult({
      unitPrice: price,
      total: qty * price,
      currency: calcProduct.currency || 'USD',
      meetsmoq: qty >= parseFloat(calcProduct.moq || 1),
      moq: calcProduct.moq,
    });
  };

  if (loading) return (
    <div className="profile-wrap">
      <BrandedLoading lang={lang} tone="supplier" />
    </div>
  );

  if (!supplier) return (
    <div className="profile-wrap">
      <div className="profile-body">
        <p style={{ color: '#7a7a7a' }}>{isAr ? 'المورد غير موجود' : 'Supplier not found'}</p>
      </div>
    </div>
  );

  // Phase 5D — aggregate cert types across all of the supplier's products.
  // Computed once per render (cheap; products is already in memory).
  const tT = T[lang] || T.en;
  const supplierAggregateCertTypes = (() => {
    const seen = new Set();
    const ordered = [];
    for (const p of (products || [])) {
      for (const code of getProductCertTypes(p)) {
        if (!seen.has(code)) { seen.add(code); ordered.push(code); }
      }
    }
    return ordered;
  })();

  const detailItems = [
    supplier.business_type ? { label: isAr ? 'نوع النشاط' : lang === 'zh' ? '企业类型' : 'Business type', value: supplier.business_type } : null,
    supplier.year_established ? { label: isAr ? 'سنة التأسيس' : lang === 'zh' ? '成立年份' : 'Est.', value: supplier.year_established } : null,
    (supplier.city || supplier.country) ? { label: isAr ? 'الموقع' : lang === 'zh' ? '所在地' : 'Location', value: [supplier.city, supplier.country].filter(Boolean).join(', ') } : null,
    supplier.company_address ? { label: isAr ? 'العنوان' : lang === 'zh' ? '地址' : 'Address', value: supplier.company_address } : null,
    supplierLanguages.length > 0 ? { label: isAr ? 'اللغات' : lang === 'zh' ? '支持语言' : 'Languages', value: supplierLanguages.join(' · ') } : null,
    exportMarkets.length > 0 ? { label: isAr ? 'أسواق التصدير' : lang === 'zh' ? '出口市场' : 'Export markets', value: exportMarkets.join(' · ') } : null,
    supplier.customization_support ? { label: isAr ? 'التخصيص' : lang === 'zh' ? '定制' : 'Customization', value: supplier.customization_support } : null,
    supplier.trade_link ? { label: isAr ? 'الملف التجاري' : lang === 'zh' ? '贸易主页' : 'Trade profile', value: supplier.trade_link, isLink: true } : null,
  ].filter(Boolean);

  return (
    <div style={{ background: '#f5f3ef', minHeight: '100dvh' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div className="sp-page">

        {/* ── Hero card ── */}
        <div style={{ background: '#ede8dc', border: '1px solid #d8d0be', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#d8d0be', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 22, color: '#6b6560',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {supplier.avatar_url
                ? <img src={supplier.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (supplier.company_name || '?')[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{
                fontSize: 18, fontWeight: 600, color: '#1a1814', margin: '0 0 4px',
                fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif",
                lineHeight: 1.3,
              }}>
                {supplier.company_name}
              </h1>
              <p style={{ fontSize: 12, color: '#6b6560', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {[supplier.city, supplier.country].filter(Boolean).join(' · ')}
                {supplier.year_established ? ` · ${supplier.year_established}` : ''}
                {supplier.rating > 0 ? ` · ${stars(Math.round(supplier.rating || 0))}` : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {isReviewedSupplier && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', background: 'rgba(45,122,79,0.1)',
                    border: '1px solid rgba(45,122,79,0.2)', borderRadius: 20,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block' }} />
                    <span style={{ fontSize: 11, color: '#2d7a4f', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'مورد موثّق' : lang === 'zh' ? '认证供应商' : 'Verified Supplier'}
                    </span>
                  </div>
                )}
                {supplierAggregateCertTypes.length > 0 && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', background: 'rgba(45,122,79,0.06)',
                    border: '1px solid rgba(45,122,79,0.18)', borderRadius: 20,
                  }}>
                    <span style={{ fontSize: 11, color: '#2d7a4f', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      ✓ {tT.supplierCertifiedPill}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase 5D — aggregate cert types across this supplier's products */}
          {supplierAggregateCertTypes.length > 0 && (
            <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 10, background: 'rgba(45,122,79,0.04)', border: '1px solid rgba(45,122,79,0.15)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {tT.supplierCertsAggregateLabel}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {supplierAggregateCertTypes.map(code => (
                  <span
                    key={code}
                    style={{
                      fontSize: 11,
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: code === 'SASO' ? 'rgba(45,122,79,0.15)' : 'rgba(45,122,79,0.06)',
                      border: `1px solid ${code === 'SASO' ? 'rgba(45,122,79,0.35)' : 'rgba(45,122,79,0.18)'}`,
                      color: '#2d7a4f',
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    }}
                  >
                    {code === 'SASO' ? `✓ ${code}` : code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            {[
              { label: isAr ? 'منتجات' : lang === 'zh' ? '产品' : 'Products', value: products.length },
              { label: isAr ? 'صفقات' : lang === 'zh' ? '成交' : 'Deals', value: supplier.deals_completed || '—' },
              { label: isAr ? 'أدنى طلب' : lang === 'zh' ? '最低订单' : 'Min order', value: supplier.min_order_value ? `${supplier.min_order_value}$` : '—' },
              { label: isAr ? 'تأسست' : lang === 'zh' ? '成立' : 'Est.', value: supplier.year_established || '—' },
            ].map((stat, i) => (
              <div key={i} style={{
                padding: '10px 8px', textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                background: '#ede8dc',
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1814', margin: '0 0 2px', fontFamily: "'Cormorant Garamond', serif", fontVariantNumeric: 'lining-nums' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 10, color: '#6b6560', margin: 0, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '0.8px', textTransform: 'uppercase' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => { if (!user) nav('/login'); else nav(`/chat/${supplier.id}`); }}
              style={{ background: '#1a1814', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontFamily: "'Tajawal', sans-serif", fontWeight: 600, cursor: 'pointer' }}>
              {isAr ? 'تواصل مباشر' : lang === 'zh' ? '直接联系' : 'Direct Contact'}
            </button>
            {products.some(p => p.sample_available) && (
              <button
                onClick={() => document.getElementById('sp-products')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ background: 'none', color: '#1a1814', border: '1px solid #d8d0be', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontFamily: "'Tajawal', sans-serif", fontWeight: 600, cursor: 'pointer' }}>
                {isAr ? 'طلب عينة' : lang === 'zh' ? '请求样品' : 'Request Sample'}
              </button>
            )}
          </div>
        </div>

        {/* ── About ── */}
        {companyDescription && (
          <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <SectionLabel label={isAr ? 'عن الشركة' : lang === 'zh' ? '公司介绍' : 'About'} isAr={isAr} />
            <p style={{ fontSize: 14, color: '#6b6560', lineHeight: 1.85, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {companyDescription}
            </p>
          </div>
        )}

        {/* ── Company details ── */}
        {detailItems.length > 0 && (
          <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <SectionLabel label={isAr ? 'تفاصيل الشركة' : lang === 'zh' ? '公司详情' : 'Company Details'} isAr={isAr} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 24px' }}>
              {detailItems.map(item => (
                <div key={item.label}>
                  <p style={{ fontSize: 10, fontFamily: "'Cormorant Garamond', serif", letterSpacing: '1px', textTransform: 'uppercase', color: '#b0ab9e', margin: '0 0 3px' }}>
                    {item.label}
                  </p>
                  {item.isLink
                    ? <a href={item.value} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1a1814', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', textDecoration: 'underline', wordBreak: 'break-all', display: 'block' }}>{item.value}</a>
                    : <p style={{ fontSize: 13, color: '#1a1814', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5 }}>{item.value}</p>
                  }
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Certifications ── */}
        {certifications.length > 0 && (
          <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', margin: 0, whiteSpace: 'nowrap' }}>
                  {isAr ? 'شهادات الجودة' : lang === 'zh' ? '质量认证' : 'Quality Certifications'}
                </p>
                <div style={{ flex: 1, height: 1, background: '#e8e5de' }} />
              </div>
              {isReviewedSupplier && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 20, flexShrink: 0 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block' }} />
                  <span style={{ fontSize: 10, color: '#2d7a4f', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {certifications.map((cert, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1814', margin: '0 0 2px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{cert.name}</p>
                    {cert.issuer && <p style={{ fontSize: 12, color: '#6b6560', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{cert.issuer}</p>}
                  </div>
                  {cert.valid_until && (
                    <p style={{ fontSize: 11, color: '#b0ab9e', margin: 0, whiteSpace: 'nowrap', fontFamily: "'Cormorant Garamond', serif" }}>{cert.valid_until}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Products ── */}
        <div id="sp-products" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', margin: 0, whiteSpace: 'nowrap' }}>
              {isAr ? 'المنتجات' : lang === 'zh' ? '产品列表' : 'Products'}
            </p>
            <div style={{ flex: 1, height: 1, background: '#e8e5de' }} />
          </div>
          {products.length === 0 ? (
            <p style={{ color: '#6b6560', fontSize: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'لا توجد منتجات بعد' : 'No products yet'}
            </p>
          ) : (
            <div className="product-grid">
              {products.map((p, idx) => {
                const productPriceFrom = deriveProductPriceFrom(p);
                const price = buildDisplayPrice({ amount: productPriceFrom, sourceCurrency: p.currency || 'USD', displayCurrency: displayCurrency || p.currency || 'USD', rates: exchangeRates, lang });
                const animation = { animation: `fadeIn 0.4s ease ${idx * 0.04}s both` };
                return (
                  <div key={p.id}>
                    <div className="product-card" style={animation} onClick={() => nav(`/products/${p.id}`)}>
                      <div className="product-card-img">
                        {getPrimaryProductImage(p) && (
                          <img src={getPrimaryProductImage(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <div className="product-card-body">
                        {isReviewedSupplier && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2d7a4f', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 10, color: '#2d7a4f', fontFamily: 'var(--font-ar)' }}>مورد موثّق</span>
                          </div>
                        )}
                        <h3 className={`product-card-name${isAr ? ' ar' : ''}`}>
                          {isAr ? p.name_ar || p.name_en : lang === 'zh' ? p.name_zh || p.name_en : p.name_en || p.name_ar}
                        </h3>
                        <ProductBuyerCardSummary
                          product={p}
                          displayCurrency={displayCurrency || p.currency || 'USD'}
                          exchangeRates={exchangeRates}
                          lang={lang}
                        />
                        <button className="product-card-buy" onClick={e => { e.stopPropagation(); nav(`/products/${p.id}`); }}>
                          اشتر الآن
                        </button>
                        {p.sample_available && (
                          <button
                            onClick={e => { e.stopPropagation(); toggleSampleForm(p.id); }}
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: '#2d7a4f', cursor: 'pointer', fontFamily: "'Tajawal', sans-serif", textAlign: isAr ? 'right' : 'left', marginTop: 2 }}>
                            {isAr ? `طلب عينة — ${fmt(p.sample_price)} ر.س` : `Sample — ${fmt(p.sample_price)} SAR`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Sample form */}
                    {sampleForms[p.id] && (
                      <div style={{
                        background: 'rgba(45,122,79,0.04)', border: '1px solid rgba(45,122,79,0.2)',
                        borderTop: 'none', padding: '20px 16px', marginBottom: 8,
                        borderRadius: '0 0 8px 8px', animation: 'fadeIn 0.3s ease',
                      }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                          {isAr
                            ? `سعر الوحدة: ${fmt(p.sample_price)} ريال + شحن: ${fmt(p.sample_shipping || 0)} ريال · الحد الأقصى: ${p.sample_max_qty || 3} قطع`
                            : `Unit: ${fmt(p.sample_price)} SAR + Ship: ${fmt(p.sample_shipping || 0)} SAR · Max: ${p.sample_max_qty || 3}`}
                        </p>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
                          <div style={{ flex: '0 0 110px' }}>
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
                          <div style={{ background: 'var(--bg-hover)', padding: '10px 14px', borderRadius: 3, minWidth: 110 }}>
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
                            {p.sample_note}
                          </p>
                        )}
                        {!user && (
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            {isAr ? 'سيُطلب منك تسجيل الدخول عند الإرسال' : "You'll be asked to sign in when submitting"}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '10px 18px', fontSize: 12, cursor: 'pointer', borderRadius: 3, opacity: sendingSample[p.id] ? 0.5 : 1 }}
                            onClick={() => submitSample(p)} disabled={sendingSample[p.id]}>
                            {sendingSample[p.id] ? '...' : isAr ? 'إرسال طلب العينة' : 'Send Sample Request'}
                          </button>
                          <button
                            onClick={() => toggleSampleForm(p.id)}
                            style={{ background: 'none', border: '1px solid #e8e5de', color: '#6b6560', padding: '10px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Price calculator ── */}
        {products.length > 0 && (
          <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <SectionLabel label={isAr ? 'احسب سعرك' : lang === 'zh' ? '价格计算' : 'Price Calculator'} isAr={isAr} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <select
                style={{ flex: 1, minWidth: 140, padding: '10px 12px', fontSize: 13, border: '1px solid #e8e5de', background: '#faf9f7', color: '#6b6560', borderRadius: 8, outline: 'none', cursor: 'pointer', minHeight: 42, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
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
                style={{ width: 110, padding: '10px 12px', fontSize: 13, border: '1px solid #e8e5de', background: '#faf9f7', color: '#1a1814', borderRadius: 8, outline: 'none', minHeight: 42 }}
                type="number"
                placeholder={isAr ? 'الكمية' : 'Quantity'}
                value={calcQty}
                onChange={e => { setCalcQty(e.target.value); setCalcResult(null); }}
              />
              <button
                onClick={calcPrice}
                style={{ background: '#1a1814', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13, fontFamily: "'Tajawal', sans-serif", fontWeight: 600, cursor: 'pointer', minHeight: 42 }}>
                {isAr ? 'احسب' : 'Calculate'}
              </button>
            </div>
            {calcResult && (
              <div style={{ borderTop: '1px solid #e8e5de', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#b0ab9e' }}>{isAr ? 'سعر الوحدة' : 'Unit Price'}</span>
                  <span style={{ fontSize: 12, color: '#1a1814', fontFamily: "'Cormorant Garamond', serif", fontVariantNumeric: 'lining-nums' }}>{calcResult.unitPrice} {calcResult.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: calcResult.meetsmoq ? 0 : 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1814', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span style={{ fontSize: 20, fontWeight: 300, color: '#1a1814', fontFamily: "'Cormorant Garamond', serif", fontVariantNumeric: 'lining-nums' }}>{calcResult.total.toLocaleString()} {calcResult.currency}</span>
                </div>
                {!calcResult.meetsmoq && (
                  <p style={{ fontSize: 11, color: '#a08850', padding: '6px 10px', background: 'rgba(122,96,48,0.1)', borderRadius: 8, border: '1px solid rgba(122,96,48,0.2)', marginTop: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? `الحد الأدنى للطلب: ${calcResult.moq} قطعة` : `Min order: ${calcResult.moq} units`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Reviews ── */}
        {reviews.length > 0 && (
          <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <SectionLabel label={isAr ? 'التقييمات' : lang === 'zh' ? '评价' : 'Reviews'} isAr={isAr} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map((rv, i) => (
                <div key={rv.id || i} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #e8e5de', borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#6b6560', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'مشتري موثّق عبر مَعبر' : lang === 'zh' ? '通过 Maabar 成交的买家' : 'Maabar buyer'}
                    </span>
                    <span style={{ color: '#f5a623', fontSize: 13 }}>
                      {Array.from({ length: 5 }, (_, j) => j < (rv.rating || 0) ? '★' : '☆').join('')}
                    </span>
                  </div>
                  {rv.comment && (
                    <p style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.6, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {rv.comment}
                    </p>
                  )}
                  {(rv.quality_rating || rv.shipping_rating || rv.communication_rating) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                      {rv.quality_rating && <span style={{ fontSize: 10, color: '#b0ab9e' }}>{isAr ? 'الجودة' : 'Quality'}: {rv.quality_rating}/5</span>}
                      {rv.shipping_rating && <span style={{ fontSize: 10, color: '#b0ab9e' }}>{isAr ? 'الشحن' : 'Shipping'}: {rv.shipping_rating}/5</span>}
                      {rv.communication_rating && <span style={{ fontSize: 10, color: '#b0ab9e' }}>{isAr ? 'التواصل' : 'Comm'}: {rv.communication_rating}/5</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
