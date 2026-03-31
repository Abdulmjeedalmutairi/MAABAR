import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { buildProductSpecs, getProductGalleryImages } from '../lib/productMedia';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

function getLocalizedText(product, lang, key) {
  if (key === 'name') {
    if (lang === 'ar') return product.name_ar || product.name_en || product.name_zh;
    if (lang === 'zh') return product.name_zh || product.name_en || product.name_ar;
    return product.name_en || product.name_zh || product.name_ar;
  }

  if (key === 'desc') {
    if (lang === 'ar') return product.desc_ar || product.desc_en || product.desc_zh;
    if (lang === 'zh') return product.desc_zh || product.desc_en || product.desc_ar;
    return product.desc_en || product.desc_zh || product.desc_ar;
  }

  return '';
}

export default function ProductDetail({ lang, user, profile, displayCurrency, exchangeRates }) {
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
  const [selectedImage, setSelectedImage] = useState(null);
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';

  useEffect(() => { loadProduct(); }, [id, profile?.role, user?.id]);

  useEffect(() => {
    const firstImage = getProductGalleryImages(product)[0] || null;
    if (firstImage) setSelectedImage(firstImage);
  }, [product]);

  const loadProduct = async () => {
    setLoading(true);
    const { data } = await sb
      .from('products')
      .select('*,profiles(id,company_name,city,country,rating,reviews_count,avatar_url,status,trade_link,wechat,whatsapp,factory_images,years_experience,trust_score,maabar_supplier_id,min_order_value)')
      .eq('id', id)
      .single();

    if (data) {
      const canViewProduct = isSupplierPubliclyVisible(data.profiles?.status)
        || (profile?.role === 'supplier' && user?.id === data.supplier_id);
      setProduct(canViewProduct ? data : null);
    } else {
      setProduct(null);
    }

    setLoading(false);
  };

  const submitOrder = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!qty) { alert(isAr ? 'يرجى تحديد الكمية' : lang === 'zh' ? '请输入数量' : 'Please enter quantity'); return; }
    if (!product) return;

    const sup = product.profiles || {};
    if (!sup.id) { alert(isAr ? 'تعذّر تحديد المورد' : lang === 'zh' ? '未找到供应商' : 'Supplier not found'); return; }

    setSending(true);

    const { data: reqData, error: reqError } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: 'شراء: ' + (product.name_ar || product.name_en || product.name_zh),
      title_en: 'Buy: ' + (product.name_en || product.name_zh || product.name_ar),
      title_zh: '采购: ' + (product.name_zh || product.name_en || product.name_ar),
      quantity: qty,
      description: note || '',
      product_ref: id,
      category: product.category || 'other',
      status: 'closed',
    }).select().single();

    setSending(false);

    if (reqError || !reqData) {
      alert(isAr ? 'حدث خطأ' : lang === 'zh' ? '发生错误' : 'Error');
      return;
    }

    nav('/checkout', {
      state: {
        offer: {
          id: reqData.id,
          request_id: reqData.id,
          supplier_id: sup.id,
          profiles: sup,
          price: product.price_from || 0,
          currency: product.currency || 'USD',
          delivery_days: product.spec_lead_time_days || 30,
          status: 'accepted',
          isDirect: true,
        },
        request: { ...reqData, quantity: qty },
      }
    });
  };

  const submitSample = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    if (!sup.id) {
      setSendingSample(false);
      alert(isAr ? 'تعذّر تحديد المورد، حاول لاحقاً' : lang === 'zh' ? '无法识别供应商，请稍后再试' : 'Supplier not found, try again');
      return;
    }

    const maxQty = product.sample_max_qty || 3;
    if (parseInt(sampleQty, 10) > maxQty) {
      alert(isAr ? `الحد الأقصى للعينة ${maxQty} قطع` : lang === 'zh' ? `样品最多 ${maxQty} 件` : `Max sample quantity is ${maxQty}`);
      return;
    }

    setSendingSample(true);
    const total = (parseFloat(product.sample_price || 0) + parseFloat(product.sample_shipping || 0)) * parseInt(sampleQty || 1, 10);

    const { error } = await sb.from('samples').insert({
      product_id: id,
      supplier_id: sup.id,
      buyer_id: user.id,
      quantity: parseInt(sampleQty || 1, 10),
      sample_price: parseFloat(product.sample_price || 0),
      shipping_price: parseFloat(product.sample_shipping || 0),
      total_price: total,
      notes: sampleNote || '',
      status: 'pending',
    });

    setSendingSample(false);
    if (error) { alert(isAr ? 'حدث خطأ' : lang === 'zh' ? '发生错误' : 'Error'); return; }

    await sb.from('notifications').insert({
      user_id: sup.id, type: 'new_sample',
      title_ar: 'طلب عينة جديد على منتجك',
      title_en: 'New sample request on your product',
      title_zh: '您的产品收到了新样品请求',
      ref_id: id, is_read: false,
    });

    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'new_sample',
          data: {
            recipientUserId: sup.id,
            productName: product.name_ar || product.name_en || product.name_zh || 'Product',
            quantity: sampleQty,
            totalPrice: total,
            lang,
          },
        }),
      });
    } catch (e) { console.error('sample email error:', e); }

    alert(isAr ? '✅ تم إرسال طلب العينة! سيتواصل معك المورد قريباً' : lang === 'zh' ? '✅ 样品请求已发送，供应商会尽快联系您' : '✅ Sample request sent! The supplier will contact you soon');
    setShowSampleForm(false);
    setSampleQty('1');
    setSampleNote('');
  };

  const handleChat = () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    if (!sup.id) {
      alert(isAr ? 'تعذّر تحديد المورد، حاول لاحقاً' : lang === 'zh' ? '无法识别供应商，请稍后再试' : 'Supplier not found, try again');
      return;
    }
    nav(`/chat/${sup.id}`);
  };

  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
    return s;
  };

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

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
          {isAr ? 'المنتج غير موجود' : lang === 'zh' ? '产品不存在' : 'Product not found'}
        </p>
      </div>
    </div>
  );

  const sup = product.profiles || {};
  const name = getLocalizedText(product, lang, 'name');
  const desc = getLocalizedText(product, lang, 'desc');
  const secondaryName = lang === 'zh'
    ? (product.name_en || product.name_ar || '')
    : (product.name_zh || product.name_en || '');
  const supplierTrustSignals = buildSupplierTrustSignals(sup);
  const isReviewedSupplier = isSupplierPubliclyVisible(sup.status);
  const supplierMaabarId = getSupplierMaabarId(sup);

  const sampleTotal = product.sample_available
    ? (parseFloat(product.sample_price || 0) + parseFloat(product.sample_shipping || 0)) * parseInt(sampleQty || 1, 10)
    : 0;
  const galleryImages = getProductGalleryImages(product);
  const previewImage = selectedImage || galleryImages[0] || null;
  const price = buildDisplayPrice({
    amount: product.price_from,
    sourceCurrency: product.currency || 'USD',
    displayCurrency: displayCurrency || product.currency || 'USD',
    rates: exchangeRates,
    lang,
  });
  const productSpecs = buildProductSpecs(product);
  const sourcingHighlights = [
    { label: isAr ? 'MOQ' : lang === 'zh' ? 'MOQ' : 'MOQ', value: product.moq || '—' },
    { label: isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产地' : 'Origin', value: product.origin || sup.country || 'China' },
    { label: isAr ? 'مدة التجهيز' : lang === 'zh' ? '备货周期' : 'Lead time', value: product.spec_lead_time_days ? (isAr ? `${product.spec_lead_time_days} يوم` : lang === 'zh' ? `${product.spec_lead_time_days} 天` : `${product.spec_lead_time_days} days`) : '—' },
    { label: isAr ? 'التخصيص' : lang === 'zh' ? '定制能力' : 'Customization', value: product.spec_customization || (isAr ? 'غير موضح' : lang === 'zh' ? '未说明' : 'Not specified') },
    { label: isAr ? 'العينات' : lang === 'zh' ? '样品' : 'Samples', value: product.sample_available ? (isAr ? 'متاحة' : lang === 'zh' ? '可提供' : 'Available') : (isAr ? 'غير متاحة' : lang === 'zh' ? '暂无' : 'Not available') },
    { label: isAr ? 'التغليف' : lang === 'zh' ? '包装' : 'Packaging', value: product.spec_packaging_details || '—' },
  ];

  return (
    <div className="product-detail-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div className="product-detail-inner">
        <button className="back-btn" onClick={() => nav('/products')}>
          {isAr ? '← العودة' : lang === 'zh' ? '← 返回' : '← Back'}
        </button>

        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <div className="product-detail-img" style={{ marginBottom: 0 }}>
              {previewImage
                ? <img src={previewImage} alt={name} />
                : <span>📦</span>}
            </div>
            {galleryImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginTop: 12 }}>
                {galleryImages.map((img, index) => (
                  <button key={`${img}-${index}`} type="button" onClick={() => setSelectedImage(img)} style={{ border: selectedImage === img ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)', padding: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-muted)', cursor: 'pointer', height: 72 }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {product.video_url && (
            <div style={{ flex: '1 1 280px', maxWidth: 480, height: 320, borderRadius: 12, overflow: 'hidden', background: '#1a1a1a' }}>
              <video src={product.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 className={`product-detail-name${isAr ? ' ar' : ''}`}>{name}</h1>
          {isReviewedSupplier && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72', fontSize: 11,
            }}>
              ✓ {isAr ? 'مورد موثّق' : lang === 'zh' ? '认证供应商' : 'Verified supplier'}
            </span>
          )}
          {product.sample_available && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20,
              background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 11,
            }}>
              {isAr ? 'عينة متاحة' : lang === 'zh' ? '可提供样品' : 'Sample available'}
            </span>
          )}
        </div>

        {secondaryName && secondaryName !== name && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 0, marginBottom: 10 }}>
            {lang === 'zh'
              ? `英文 / 其他名称：${secondaryName}`
              : isAr
                ? `اسم المصنع / الاسم البديل: ${secondaryName}`
                : `Factory / alternate name: ${secondaryName}`}
          </p>
        )}

        <p className="product-detail-price">
          {product.price_from ? price.formattedDisplay : '—'}
        </p>
        {price.isConverted && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: -12, marginBottom: 22 }}>
            {isAr ? `السعر الأصلي: ${price.formattedSource}` : lang === 'zh' ? `原始价格：${price.formattedSource}` : `Original price: ${price.formattedSource}`}
          </p>
        )}

        <div className="product-detail-meta">
          <div>
            <p className="meta-label">{isAr ? 'الحد الأدنى' : lang === 'zh' ? '起订量' : 'Min. Order'}</p>
            <p className="meta-val">{product.moq || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{isAr ? 'المورد' : lang === 'zh' ? '供应商' : 'Supplier'}</p>
            <p className="meta-val">{sup.company_name || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产地' : 'Origin'}</p>
            <p className="meta-val">{product.origin || sup.country || 'China'}</p>
          </div>
          {product.sample_available && (
            <div>
              <p className="meta-label">{isAr ? 'العينة' : lang === 'zh' ? '样品价' : 'Sample'}</p>
              <p className="meta-val" style={{ color: '#2d7a4f', fontSize: 14 }}>
                {fmt(product.sample_price)} SAR
              </p>
            </div>
          )}
        </div>

        <div style={{
          marginBottom: 24,
          padding: '14px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)',
        }}>
          <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
            {isAr ? 'ملخص التوريد' : lang === 'zh' ? '采购摘要' : 'Sourcing snapshot'}
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr
              ? 'هذه الصفحة تعرض معلومات أقرب لتوقعات المورد الصيني: MOQ، وقت التجهيز، العينات، والتخصيص، مع إشارات ثقة المورد قبل التواصل أو الطلب.'
              : lang === 'zh'
                ? '此页面更贴近中国供应商常用展示方式：包含 MOQ、交期、样品、定制与供应商信任信息，便于先判断再沟通。'
                : 'This page surfaces the details buyers usually expect in a China sourcing flow: MOQ, lead time, samples, customization, and supplier trust before you order or chat.'}
          </p>
        </div>

        {desc && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>{desc}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 28 }}>
          {sourcingHighlights.map(item => (
            <div key={item.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{item.value}</p>
            </div>
          ))}
        </div>

        {productSpecs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 28 }}>
            {productSpecs.map(spec => (
              <div key={spec.key} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{spec.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{spec.value}</p>
              </div>
            ))}
          </div>
        )}

        {sup.id && (
          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  {isAr ? 'مراجعة مَعبر' : lang === 'zh' ? 'Maabar 审核' : 'Maabar review'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {isReviewedSupplier
                    ? (isAr ? 'هذا المورد ظاهر للمشترين بعد مراجعة مَعبر.' : lang === 'zh' ? '该供应商已通过 Maabar 审核并向买家展示。' : 'This supplier is visible to buyers after Maabar review.')
                    : (isAr ? 'ملف المورد غير معروض كمورد موثّق.' : lang === 'zh' ? '该供应商尚未以认证状态展示。' : 'This supplier is not currently shown as verified.')} 
                </p>
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  {isAr ? 'دلائل الثقة' : lang === 'zh' ? '信任信号' : 'Trust signals'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {isAr
                    ? `${supplierTrustSignals.includes('trade_profile_available') ? 'رابط الشركة متوفر' : 'لا يوجد رابط شركة ظاهر'}${supplierTrustSignals.includes('wechat_available') ? ' · WeChat متاح' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · صور منشأة متاحة' : ''}`
                    : lang === 'zh'
                      ? `${supplierTrustSignals.includes('trade_profile_available') ? '已提供店铺/官网链接' : '暂无公开店铺链接'}${supplierTrustSignals.includes('wechat_available') ? ' · 支持 WeChat 沟通' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · 提供工厂图片' : ''}`
                      : `${supplierTrustSignals.includes('trade_profile_available') ? 'trade profile available' : 'no public trade profile shown'}${supplierTrustSignals.includes('wechat_available') ? ' · WeChat available' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · factory photos available' : ''}`}
                </p>
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                  {isAr ? 'الهوية التجارية' : lang === 'zh' ? '商业身份' : 'Commercial identity'}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {supplierMaabarId
                    ? (isAr ? `معرّف المورد: ${supplierMaabarId}` : lang === 'zh' ? `供应商编号：${supplierMaabarId}` : `Supplier ID: ${supplierMaabarId}`)
                    : (isAr ? 'معرّف المورد غير ظاهر بعد' : lang === 'zh' ? '暂无供应商编号' : 'Supplier ID not shown yet')}
                  {sup.years_experience ? ` · ${isAr ? `${sup.years_experience} سنة خبرة` : lang === 'zh' ? `${sup.years_experience} 年经验` : `${sup.years_experience} years experience`}` : ''}
                </p>
              </div>
            </div>

            <div className="supplier-card" onClick={() => nav(`/supplier/${sup.id}`)}>
              <div className="avatar" style={{ overflow: 'hidden' }}>
                {sup.avatar_url
                  ? <img src={sup.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (sup.company_name || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ fontWeight: 500, marginBottom: 0 }}>{sup.company_name || ''}</p>
                  {isReviewedSupplier && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>
                      ✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
                    </span>
                  )}
                </div>
                <p className="stars" style={{ marginBottom: 4 }}>{stars(Math.round(sup.rating || 0))}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {[sup.city, sup.country].filter(Boolean).join(', ') || '—'}
                  {sup.reviews_count ? ` · ${sup.reviews_count} ${isAr ? 'تقييم' : lang === 'zh' ? '条评价' : 'reviews'}` : ''}
                </p>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
            </div>

            {(supplierTrustSignals.length > 0 || supplierMaabarId || sup.trade_link || sup.wechat || sup.whatsapp) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {supplierMaabarId && (
                  <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    {isAr ? 'معرّف المورد' : lang === 'zh' ? '供应商编号' : 'Supplier ID'}: {supplierMaabarId}
                  </span>
                )}
                {sup.trade_link && (
                  <a href={sup.trade_link} target="_blank" rel="noreferrer" className="btn-outline" style={{ minHeight: 34, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                    {isAr ? 'رابط الشركة / المتجر' : lang === 'zh' ? '官网 / 店铺链接' : 'Company / store link'}
                  </a>
                )}
                {sup.wechat && (
                  <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    WeChat: {sup.wechat}
                  </span>
                )}
                {sup.whatsapp && (
                  <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    WhatsApp: {sup.whatsapp}
                  </span>
                )}
              </div>
            )}

            {Array.isArray(sup.factory_images) && sup.factory_images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {sup.factory_images.slice(0, 3).map((img, index) => (
                  <div key={`${img}-${index}`} style={{ width: 110, height: 74, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isSupplier && (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 14, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr
                ? 'يمكنك الطلب مباشرة من هذه الصفحة أو مراسلة المورد أولاً لتأكيد التغليف، التخصيص، مدة التجهيز، أو الشحن.'
                : lang === 'zh'
                  ? '您可以直接下单，也可以先联系供应商确认包装、定制、交期或运输方式。'
                  : 'You can order directly from this page, or message the supplier first to confirm packaging, customization, lead time, or shipping terms.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              <button
                className="btn-primary"
                style={{ background: '#1a1a1a', color: '#fff', letterSpacing: 0 }}
                onClick={() => { setShowBuyForm(!showBuyForm); setShowSampleForm(false); }}>
                {isAr ? 'اشترِ الآن' : lang === 'zh' ? '立即下单' : 'Buy Now'}
              </button>

              {product.sample_available && (
                <button
                  className="btn-outline"
                  style={{ borderColor: '#2d7a4f', color: '#2d7a4f' }}
                  onClick={() => { setShowSampleForm(!showSampleForm); setShowBuyForm(false); }}>
                  {isAr ? `اطلب عينة — ${fmt(product.sample_price)} SAR` : lang === 'zh' ? `申请样品 — ${fmt(product.sample_price)} SAR` : `Request Sample — ${fmt(product.sample_price)} SAR`}
                </button>
              )}

              <button className="btn-outline" onClick={handleChat}>
                {isAr ? 'تواصل مع المورد' : lang === 'zh' ? '联系供应商' : 'Contact Supplier'}
              </button>
            </div>
          </>
        )}

        {showBuyForm && (
          <div className="buy-form">
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'أدخل الكمية' : lang === 'zh' ? '输入数量' : 'Enter Quantity'}
            </h3>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الكمية *' : lang === 'zh' ? '数量 *' : 'Quantity *'}</label>
              <input className="form-input" value={qty} onChange={e => setQty(e.target.value)}
                placeholder={isAr ? 'مثال: 200' : lang === 'zh' ? '例如：200' : 'e.g. 200'} type="number" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة (اختياري)' : lang === 'zh' ? '备注（选填）' : 'Note (optional)'}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }}
                value={note} onChange={e => setNote(e.target.value)}
                placeholder={isAr ? 'مثلاً: التغليف، المواصفات النهائية، علامة خاصة...' : lang === 'zh' ? '例如：包装、最终规格、定制标识…' : 'e.g. packaging, final specs, private label...'} />
            </div>
            {!user && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {isAr ? '* سيُطلب منك تسجيل الدخول' : lang === 'zh' ? '* 提交前需要先登录' : '* You\'ll be asked to sign in'}
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-dark-sm" onClick={submitOrder} disabled={sending}>
                {sending ? '...' : isAr ? 'متابعة للدفع ←' : lang === 'zh' ? '前往付款 →' : 'Proceed to Payment →'}
              </button>
              <button className="btn-outline" onClick={() => setShowBuyForm(false)}>
                {isAr ? 'إلغاء' : lang === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {showSampleForm && product.sample_available && (
          <div className="buy-form" style={{ borderColor: '#2d7a4f', borderWidth: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: 'var(--text-primary)' }}>
                  {isAr ? 'طلب عينة' : lang === 'zh' ? '申请样品' : 'Request Sample'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr
                    ? `سعر الوحدة: ${fmt(product.sample_price)} ريال + شحن: ${fmt(product.sample_shipping || 0)} ريال`
                    : lang === 'zh'
                      ? `样品单价：${fmt(product.sample_price)} SAR + 运费：${fmt(product.sample_shipping || 0)} SAR`
                      : `Unit: ${fmt(product.sample_price)} SAR + Shipping: ${fmt(product.sample_shipping || 0)} SAR`}
                </p>
              </div>
              <span style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 10, padding: '3px 10px', borderRadius: 20, letterSpacing: 1 }}>
                {isAr ? 'عينة' : lang === 'zh' ? '样品' : 'SAMPLE'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isAr ? `الكمية (max ${product.sample_max_qty || 3})` : lang === 'zh' ? `数量（最多 ${product.sample_max_qty || 3}）` : `Quantity (max ${product.sample_max_qty || 3})`}</label>
                <input className="form-input" type="number"
                  min="1" max={product.sample_max_qty || 3}
                  value={sampleQty} onChange={e => setSampleQty(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderRadius: 3, width: '100%' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 1 }}>{isAr ? 'الإجمالي' : lang === 'zh' ? '总计' : 'TOTAL'}</p>
                  <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>
                    {fmt(sampleTotal)} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SAR</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة' : lang === 'zh' ? '备注' : 'Note'}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }}
                value={sampleNote} onChange={e => setSampleNote(e.target.value)}
                placeholder={isAr ? 'اللون، المواصفات...' : lang === 'zh' ? '颜色、规格…' : 'Color, specs...'} />
            </div>

            {product.sample_note && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                💬 {product.sample_note}
              </p>
            )}

            {!user && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {isAr ? '* سيُطلب منك تسجيل الدخول عند الإرسال' : lang === 'zh' ? '* 提交时需要先登录' : '* You\'ll be asked to sign in when submitting'}
              </p>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '11px 24px', fontSize: 13, cursor: 'pointer', borderRadius: 3 }}
                onClick={submitSample} disabled={sendingSample}>
                {sendingSample ? '...' : isAr ? 'إرسال طلب العينة ←' : lang === 'zh' ? '发送样品请求 →' : 'Send Sample Request →'}
              </button>
              <button className="btn-outline" onClick={() => setShowSampleForm(false)}>
                {isAr ? 'إلغاء' : lang === 'zh' ? '取消' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
