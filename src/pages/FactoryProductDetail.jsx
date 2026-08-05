import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';
import RequestQuoteModal from '../components/factory/RequestQuoteModal';
import ImageLightbox from '../components/ImageLightbox';
import ProductChips from '../components/ProductChips';
import { getFactoryProductImages } from '../lib/productMedia';

const T = {
  ar: {
    back: 'رجوع إلى المصنع', byFactory: 'المصنع', ref: 'رمز المنتج', zoom: 'اضغط للتكبير',
    requestCta: 'اطلب عرض سعر أو تعديلاً', inquireCta: 'استفسر عن المنتج',
    notFound: 'المنتج غير موجود', loading: '…',
    specsLabel: 'المواصفات', descLabel: 'الوصف', customLabel: 'خيارات التخصيص', moqLabel: 'الحد الأدنى للطلب',
    contactDetails: 'تواصل مع المورد للتفاصيل', note: 'المصنع يرد بالسعر — لا حاجة لإدخال ميزانية.',
  },
  en: {
    back: 'Back to factory', byFactory: 'Factory', ref: 'Ref', zoom: 'Click to zoom',
    requestCta: 'Request a quote or customization', inquireCta: 'Inquire about product',
    notFound: 'Product not found', loading: '…',
    specsLabel: 'Specifications', descLabel: 'Description', customLabel: 'Customization options', moqLabel: 'MOQ',
    contactDetails: 'Contact supplier for details', note: 'The factory responds with pricing — no budget needed.',
  },
  zh: {
    back: '返回工厂', byFactory: '工厂', ref: '货号', zoom: '点击放大',
    requestCta: '请求报价或定制', inquireCta: '咨询此产品',
    notFound: '未找到产品', loading: '…',
    specsLabel: '规格', descLabel: '描述', customLabel: '定制选项', moqLabel: '起订量',
    contactDetails: '详情请联系供应商', note: '工厂会回复价格——无需填写预算。',
  },
};

// Standalone factory catalog product page.
//   /factory/:factoryId/product/:productId
// Gallery + lightbox + product details, then a single CTA that opens the shared
// RequestQuoteModal (product pre-attached → factory_product_id set).
export default function FactoryProductDetail({ lang = 'ar', user, displayCurrency }) {
  const { factoryId, productId } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  const c = T[lang] || T.ar;
  usePageTitle('suppliers', lang);

  const [factory, setFactory] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(null);
  const [lightbox, setLightbox] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqMode, setReqMode] = useState('quote'); // 'quote' | 'inquiry'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: f }] = await Promise.all([
        sb.from('factory_products').select('*').eq('id', productId).maybeSingle(),
        sb.from('factory_directory_public').select('*').eq('id', factoryId).maybeSingle(),
      ]);
      if (cancelled) return;
      // Guard mismatched URLs: the product must belong to this factory.
      setProduct(p && String(p.factory_id) === String(factoryId) ? p : null);
      setFactory(f || null);
      setSelectedImage(null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [factoryId, productId]);

  if (loading) {
    return <div className="full-page"><div className="fx-wrap"><p style={{ color: 'var(--text-secondary)' }}>{c.loading}</p></div></div>;
  }
  if (!product || !factory) {
    return (
      <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="fx-wrap">
          <button className={`fx-back${arc}`} onClick={() => nav(`/factory/${factoryId}`)}>{isAr ? '→ ' : '← '}{c.back}</button>
          <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.notFound}</p>
        </div>
        <Footer lang={lang} />
      </div>
    );
  }

  const productName = (isAr ? product.name_ar : lang === 'zh' ? product.name_zh : product.name_en)
    || product.name_en || product.name_ar || product.name_zh || '—';
  const factoryName = (factory.company_name_latin || '').trim() || factory.company_name || '';
  const gallery = getFactoryProductImages(product);
  const mainImg = selectedImage || gallery[0] || null;

  // Display fields (ar/en, fall back to the other language). Missing values show
  // "Contact supplier for details" rather than a blank. Order: specs → desc → custom.
  const specs = (isAr ? product.specifications_ar : product.specifications_en) || product.specifications_en || product.specifications_ar || '';
  const descr = (isAr ? product.description_ar : product.description_en) || product.description_en || product.description_ar || '';
  const custom = Array.isArray(product.customization_options) ? product.customization_options : [];
  const orContact = (v) => v || c.contactDetails;
  // Catalog price (verbatim). Append the currency label unless the price text
  // already carries it. null → the page falls back to "On request".
  const priceText = (() => {
    const p = (product.price || '').trim();
    if (!p) return null;
    const cur = (product.currency || '').trim();
    return cur && !p.toLowerCase().includes(cur.toLowerCase()) ? `${p} ${cur}` : p;
  })();
  const dLabel = { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const dVal = { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <button className={`fx-back${arc}`} onClick={() => nav(`/factory/${factoryId}`)}>{isAr ? '→ ' : '← '}{c.back}</button>

        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 8 }}>
          {/* ── Gallery ── */}
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            <button type="button" onClick={() => mainImg && setLightbox(true)}
              title={mainImg ? c.zoom : undefined}
              style={{
                width: '100%', aspectRatio: '1 / 1', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--bg-hero)',
                padding: 0, cursor: mainImg ? 'zoom-in' : 'default', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
              {mainImg
                ? <img src={mainImg} alt={productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, fontWeight: 300, color: '#8B7355' }}>{(productName || '?')[0]}</span>}
            </button>

            {gallery.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 8, marginTop: 10 }}>
                {gallery.map((img, i) => (
                  <button key={`${img}-${i}`} type="button" onClick={() => setSelectedImage(img)}
                    style={{
                      height: 68, padding: 0, borderRadius: 'var(--radius-control)', overflow: 'hidden', cursor: 'pointer',
                      background: 'var(--bg-hero)',
                      border: `1px solid ${mainImg === img ? 'var(--border-strong)' : 'var(--border)'}`,
                    }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info + request ── */}
          <div style={{ flex: '1 1 360px', minWidth: 280 }}>
            <h1 className={`fx-h1${arc}`} style={{ fontSize: isAr ? 24 : 28, marginBottom: 8 }}>{productName}</h1>
            <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 4px', fontSize: 13 }}>
              {c.byFactory}: <Link to={`/factory/${factoryId}`} style={{ color: 'var(--text-primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{factoryName}</Link>
            </p>
            {product.ref_code && (
              <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 10px', fontSize: 12 }}>{c.ref}: {product.ref_code}</p>
            )}
            <ProductChips product={product} factory={factory} lang={lang} style={{ margin: '0 0 16px' }} />

            {/* Details: specifications → description → customization */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={dLabel}>{c.specsLabel}</div>
                <p style={dVal}>{orContact(specs)}</p>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={dLabel}>{c.descLabel}</div>
                <p style={dVal}>{orContact(descr)}</p>
              </div>
              {custom.length > 0 && (
                <div>
                  <div style={dLabel}>{c.customLabel}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {custom.map((x, i) => {
                      const label = (isAr ? x.ar : x.en) || x.en || x.ar || '';
                      return label ? (
                        <span key={i} style={{ padding: '3px 11px', borderRadius: 20, background: 'var(--bg-hero)', fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{label}</span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Price + MOQ sit next to the request action (commercial terms).
                Show the catalog price when the factory printed one; otherwise
                pricing stays quote-based ("On request"). */}
            <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 6px', fontSize: 13 }}>
              {isAr ? 'السعر' : lang === 'zh' ? '价格' : 'Price'}: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{priceText || (isAr ? 'عند الطلب' : lang === 'zh' ? '面议' : 'On request')}</span>
            </p>
            <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 16px', fontSize: 12.5 }}>
              {c.moqLabel}: <span style={{ color: 'var(--text-primary)' }}>{orContact(product.moq)}</span>
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className={`fx-btn-primary${arc}`} onClick={() => { setReqMode('quote'); setReqOpen(true); }}>{c.requestCta}</button>
              <button className={`fx-btn-ghost${arc}`} onClick={() => { setReqMode('inquiry'); setReqOpen(true); }}>{c.inquireCta}</button>
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '10px 0 0', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.note}</p>
          </div>
        </div>
      </div>

      {/* ── Fullscreen viewer (navigate + zoom + pan) ── */}
      {lightbox && gallery.length > 0 && (
        <ImageLightbox
          images={gallery}
          start={Math.max(0, gallery.indexOf(mainImg))}
          alt={productName}
          onClose={() => setLightbox(false)}
        />
      )}

      {reqOpen && (
        <RequestQuoteModal
          lang={lang}
          user={user}
          factory={factory}
          product={product}
          mode={reqMode}
          displayCurrency={displayCurrency}
          onClose={() => setReqOpen(false)}
        />
      )}

      <Footer lang={lang} />
    </div>
  );
}
