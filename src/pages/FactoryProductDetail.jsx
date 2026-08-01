import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';
import { createFactoryRequest } from '../lib/createFactoryRequest';
import { getFactoryProductImages } from '../lib/productMedia';

const T = {
  ar: {
    back: 'رجوع إلى المصنع', byFactory: 'المصنع', ref: 'رمز المنتج', zoom: 'اضغط للتكبير',
    tabProduct: 'اطلب هذا المنتج', tabCustom: 'تصميم مخصص بناءً عليه',
    qtyReq: 'الكمية المطلوبة *', qtyOpt: 'الكمية التقريبية (اختياري)', notes: 'ملاحظات (اختياري)',
    subject: 'اوصف التعديل أو التصميم المطلوب *', subjectPh: 'مثال: نفس المنتج بلون مختلف، أو بشعارنا، أو بمواصفات معدّلة',
    submit: 'إرسال الطلب', sending: 'جارٍ الإرسال...', close: 'إغلاق',
    errQty: 'يرجى إدخال الكمية.', errSubject: 'يرجى وصف ما تريد.', errGeneric: 'حدث خطأ، حاول مرة أخرى.',
    note: 'المصنع يرد بالسعر — لا حاجة لإدخال ميزانية.', signin: 'سيُطلب منك تسجيل الدخول عند الإرسال.',
    doneT: 'تم إرسال طلبك إلى المصنع', doneB: 'سيتم إشعارك عند رد المصنع بعرضه عبر مَعبر.',
    notFound: 'المنتج غير موجود', loading: '…',
    specsLabel: 'المواصفات', descLabel: 'الوصف', customLabel: 'خيارات التخصيص', moqLabel: 'الحد الأدنى للطلب',
    contactDetails: 'تواصل مع المورد للتفاصيل',
  },
  en: {
    back: 'Back to factory', byFactory: 'Factory', ref: 'Ref', zoom: 'Click to zoom',
    tabProduct: 'Request this product', tabCustom: 'Custom design based on this',
    qtyReq: 'Required quantity *', qtyOpt: 'Approx. quantity (optional)', notes: 'Notes (optional)',
    subject: 'Describe the change or custom design *', subjectPh: 'e.g. same product in a different color, with our logo, or modified specs',
    submit: 'Send request', sending: 'Sending...', close: 'Close',
    errQty: 'Please enter a quantity.', errSubject: 'Please describe what you want.', errGeneric: 'Something went wrong, please try again.',
    note: 'The factory responds with pricing — no budget needed.', signin: 'You will be asked to sign in when submitting.',
    doneT: 'Your request has been sent to the factory', doneB: "You'll be notified when the factory responds with its offer through Maabar.",
    notFound: 'Product not found', loading: '…',
    specsLabel: 'Specifications', descLabel: 'Description', customLabel: 'Customization options', moqLabel: 'MOQ',
    contactDetails: 'Contact supplier for details',
  },
  zh: {
    back: '返回工厂', byFactory: '工厂', ref: '货号', zoom: '点击放大',
    tabProduct: '需求此产品', tabCustom: '基于此产品的定制设计',
    qtyReq: '所需数量 *', qtyOpt: '大约数量（可选）', notes: '备注（可选）',
    subject: '描述修改或定制设计 *', subjectPh: '例如：相同产品不同颜色、加我们的 logo，或修改规格',
    submit: '发送需求', sending: '发送中...', close: '关闭',
    errQty: '请输入数量。', errSubject: '请描述您的需求。', errGeneric: '出错了，请重试。',
    note: '工厂会回复价格——无需填写预算。', signin: '提交时会要求您登录。',
    doneT: '您的需求已发送至工厂', doneB: '工厂通过 Maabar 回复报价后会通知您。',
    notFound: '未找到产品', loading: '…',
    specsLabel: '规格', descLabel: '描述', customLabel: '定制选项', moqLabel: '起订量',
    contactDetails: '详情请联系供应商',
  },
};

// Standalone factory catalog product page (replaces ProductRequestModal).
//   /factory/:factoryId/product/:productId
// Gallery + lightbox, then two request paths (tabs), both feeding the factory
// request pipeline (createFactoryRequest): (a) request this product as-is,
// (b) custom design based on it. Both set factory_product_id.
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

  const [tab, setTab] = useState('product'); // 'product' | 'custom'
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [subject, setSubject] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

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
  const onKey = useCallback((e) => { if (e.key === 'Escape') setLightbox(false); }, []);
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

  async function submit() {
    if (tab === 'product' && !String(qty).trim()) { setError(c.errQty); return; }
    if (tab === 'custom' && !subject.trim()) { setError(c.errSubject); return; }
    if (!user) { nav('/login/buyer'); return; }
    setSubmitting(true);
    setError('');
    const { request, error: e } = await createFactoryRequest({
      user, factory, product,
      subject: tab === 'custom' ? subject : undefined,
      quantity: qty, notes, lang, viewerCurrency: displayCurrency,
    });
    setSubmitting(false);
    if (e || !request) { setError(c.errGeneric); return; }
    setDone(true);
  }

  const segBtn = (key, label) => (
    <button type="button" onClick={() => { setTab(key); setError(''); }}
      className={isAr ? 'ar' : ''}
      style={{
        flex: 1, padding: '10px 12px', fontSize: 13, cursor: 'pointer',
        border: 'none', borderRadius: 'var(--radius-control)',
        background: tab === key ? 'var(--ink)' : 'transparent',
        color: tab === key ? '#fff' : 'var(--text-secondary)',
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        fontWeight: tab === key ? 500 : 400, transition: 'var(--transition)',
      }}>{label}</button>
  );

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
            <p className={`fx-card-meta${arc}`} style={{ margin: '0 0 12px', fontSize: 12.5 }}>
              {c.moqLabel}: <span style={{ color: 'var(--text-primary)' }}>{orContact(product.moq)}</span>
            </p>

            <div className="fx-panel" style={{ marginTop: 0, padding: 20 }}>
              {done ? (
                <>
                  <h3 className={arc.trim()} style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 8px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.doneT}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 18px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.doneB}</p>
                  <button className={`fx-btn-ghost${arc}`} onClick={() => nav(`/factory/${factoryId}`)}>{c.close}</button>
                </>
              ) : (
                <>
                  {/* segmented tabs */}
                  <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-hero)', borderRadius: 'var(--radius-control)', marginBottom: 18 }}>
                    {segBtn('product', c.tabProduct)}
                    {segBtn('custom', c.tabCustom)}
                  </div>

                  {tab === 'custom' && (
                    <div className="form-group">
                      <label className={`form-label${arc}`}>{c.subject}</label>
                      <textarea className="form-input" rows={3} style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                        value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={c.subjectPh} dir={isAr ? 'rtl' : 'ltr'} />
                    </div>
                  )}

                  <div className="form-group">
                    <label className={`form-label${arc}`}>{tab === 'product' ? c.qtyReq : c.qtyOpt}</label>
                    <input className="form-input" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder={isAr ? 'مثال: 500' : 'e.g. 500'} dir={isAr ? 'rtl' : 'ltr'} />
                  </div>

                  <div className="form-group">
                    <label className={`form-label${arc}`}>{c.notes}</label>
                    <textarea className="form-input" rows={2} style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                      value={notes} onChange={(e) => setNotes(e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />
                  </div>

                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '2px 0 14px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.note}</p>
                  {!!error && <p style={{ color: '#a05050', fontSize: 13, margin: '0 0 12px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{error}</p>}
                  {!user && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.signin}</p>}

                  <button className={`fx-btn-primary${arc}`} onClick={submit} disabled={submitting}>{submitting ? c.sending : c.submit}</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && mainImg && (
        <div className="fx-modal-bg" onClick={() => setLightbox(false)} style={{ cursor: 'zoom-out' }}>
          <img src={mainImg} alt={productName} style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}

      <Footer lang={lang} />
    </div>
  );
}
