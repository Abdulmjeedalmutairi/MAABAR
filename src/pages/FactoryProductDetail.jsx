import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';
import RequestQuoteModal from '../components/factory/RequestQuoteModal';
import { getFactoryProductImages } from '../lib/productMedia';

const T = {
  ar: {
    back: 'رجوع إلى المصنع', byFactory: 'المصنع', ref: 'رمز المنتج', zoom: 'اضغط للتكبير',
    requestCta: 'اطلب عرض سعر أو تعديلاً',
    notFound: 'المنتج غير موجود', loading: '…',
    specsLabel: 'المواصفات', descLabel: 'الوصف', customLabel: 'خيارات التخصيص', moqLabel: 'الحد الأدنى للطلب',
    contactDetails: 'تواصل مع المورد للتفاصيل', note: 'المصنع يرد بالسعر — لا حاجة لإدخال ميزانية.',
  },
  en: {
    back: 'Back to factory', byFactory: 'Factory', ref: 'Ref', zoom: 'Click to zoom',
    requestCta: 'Request a quote or customization',
    notFound: 'Product not found', loading: '…',
    specsLabel: 'Specifications', descLabel: 'Description', customLabel: 'Customization options', moqLabel: 'MOQ',
    contactDetails: 'Contact supplier for details', note: 'The factory responds with pricing — no budget needed.',
  },
  zh: {
    back: '返回工厂', byFactory: '工厂', ref: '货号', zoom: '点击放大',
    requestCta: '请求报价或定制',
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
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [reqOpen, setReqOpen] = useState(false);

  const openLightbox = () => { setZoom(false); setOrigin({ x: 50, y: 50 }); setLightbox(true); };
  const closeLightbox = () => { setZoom(false); setLightbox(false); };
  const onLightboxMove = (e) => {
    if (!zoom) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

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

  // Esc closes the lightbox.
  const onKey = useCallback((e) => { if (e.key === 'Escape') { setZoom(false); setLightbox(false); } }, []);
  useEffect(() => {
    if (!lightbox) return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, onKey]);

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
  const dLabel = { fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const dVal = { fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <button className={`fx-back${arc}`} onClick={() => nav(`/factory/${factoryId}`)}>{isAr ? '→ ' : '← '}{c.back}</button>

        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 8 }}>
          {/* ── Gallery ── */}
          <div style={{ flex: '1 1 380px', minWidth: 280 }}>
            <button type="button" onClick={() => mainImg && openLightbox()}
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
              <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 16px', fontSize: 12 }}>{c.ref}: {product.ref_code}</p>
            )}

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

            {/* MOQ sits next to the request action (it's a commercial term). */}
            <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 16px', fontSize: 12.5 }}>
              {c.moqLabel}: <span style={{ color: 'var(--text-primary)' }}>{orContact(product.moq)}</span>
            </p>

            <button className={`fx-btn-primary${arc}`} onClick={() => setReqOpen(true)}>{c.requestCta}</button>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '10px 0 0', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.note}</p>
          </div>
        </div>
      </div>

      {/* ── Lightbox (fills the viewport; click the image to magnify + pan) ── */}
      {lightbox && mainImg && (
        <div className="fx-modal-bg" onClick={closeLightbox} style={{ padding: 0 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); closeLightbox(); }} aria-label={isAr ? 'إغلاق' : lang === 'zh' ? '关闭' : 'Close'}
            style={{ position: 'fixed', top: 18, insetInlineEnd: 20, width: 44, height: 44, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 24, lineHeight: 1, cursor: 'pointer', zIndex: 2 }}>×</button>
          <div
            onClick={(e) => { e.stopPropagation(); setZoom((z) => !z); }}
            onMouseMove={onLightboxMove}
            style={{ width: '96vw', height: '94vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: zoom ? 'zoom-out' : 'zoom-in' }}>
            <img src={mainImg} alt={productName}
              style={{
                width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6,
                transition: 'transform 0.18s ease',
                transform: zoom ? 'scale(2.4)' : 'scale(1)',
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }} />
          </div>
        </div>
      )}

      {reqOpen && (
        <RequestQuoteModal
          lang={lang}
          user={user}
          factory={factory}
          product={product}
          displayCurrency={displayCurrency}
          onClose={() => setReqOpen(false)}
        />
      )}

      <Footer lang={lang} />
    </div>
  );
}
