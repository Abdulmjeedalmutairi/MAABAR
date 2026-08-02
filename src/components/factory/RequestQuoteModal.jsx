import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFactoryRequest } from '../../lib/createFactoryRequest';
import useAttachmentPicker from '../../hooks/useAttachmentPicker';
import { getFactoryProductImages } from '../../lib/productMedia';
import { displayCategoryForCode } from '../../lib/factoryCategories';
import {
  CUSTOMIZATION_CHIPS, DELIVERY_TIMEFRAMES, REQUEST_UNITS,
  SHIP_COUNTRIES, KSA_CITIES, ATTACH_ACCEPT, labelFor,
} from '../../lib/requestFormOptions';

const T = {
  ar: {
    title: 'اطلب عرض سعر من المصنع',
    subtitle: 'سيتم إرسال طلبك مباشرة إلى المصنع. وسيصلك إشعار عند استلام عرض السعر أو أي تحديث على الطلب.',
    titleInquiry: 'استفسر عن المنتج',
    subtitleInquiry: 'أرسل سؤالك عن المنتج، وسنعرض لك رد المصنع هنا.',
    safe: 'طلبك آمن ومباشر',
    secInfo: 'معلومات الطلب', qty: 'الكمية المطلوبة',
    secCustom: 'هل يحتاج تخصيص؟', customDetails: 'اكتب التفاصيل', customDetailsPh: 'اكتب التفاصيل هنا',
    secDetails: 'تفاصيل الطلب',
    detailsPh: 'اكتب أي تفاصيل إضافية يحتاج المصنع معرفتها\nمثال:\n– اللون: أسود\n– المقاس: 200×160\n– خامة: MDF',
    secAttach: 'المرفقات (اختياري)',
    dropMain: 'اضغط للرفع أو اسحب الملفات هنا', dropSub: 'PDF، صور، ZIP، AI (الحد الأقصى 10 ميجابايت)',
    secDelivery: 'موعد الاستلام المتوقع', secCountry: 'بلد الشحن', secCity: 'المدينة',
    cityPh: 'اختر المدينة', cityOtherPh: 'اكتب المدينة',
    secNotes: 'ملاحظات إضافية (اختياري)', notesPh: 'أي ملاحظات أخرى...',
    submit: 'إرسال الطلب', sending: 'جارٍ الإرسال...',
    disclaimer: 'لن تتم مشاركة بياناتك مع المصنع إلا بعد إرسال طلبك',
    helpT: 'تحتاج مساعدة؟', helpB: 'فريق مَعبر جاهز لمساعدتك', contact: 'تواصل معنا',
    kCategory: 'التصنيف', kFactory: 'المصنع', kLocation: 'الموقع', kRef: 'رمز المنتج',
    asideNote: 'يمكنك إضافة المزيد من التفاصيل في الملاحظات أو المرفقات',
    errQty: 'يرجى إدخال الكمية.', errDetails: 'يرجى كتابة تفاصيل الطلب.',
    errUpload: 'تعذّر رفع أحد الملفات، حاول مرة أخرى.', errGeneric: 'حدث خطأ، حاول مرة أخرى.',
    doneT: 'تم إرسال طلبك إلى المصنع', doneB: 'سيتم إشعارك عند رد المصنع بعرضه عبر مَعبر.',
    close: 'إغلاق', signin: 'سيُطلب منك تسجيل الدخول عند الإرسال.',
  },
  en: {
    title: 'Request a quote from the factory',
    subtitle: "Your request goes straight to the factory. You'll be notified when a quote arrives or the request is updated.",
    titleInquiry: 'Inquire about this product',
    subtitleInquiry: "Send your question about this product; we'll show the factory's reply here.",
    safe: 'Safe & direct',
    secInfo: 'Request information', qty: 'Required quantity',
    secCustom: 'Does it need customization?', customDetails: 'Add details', customDetailsPh: 'Write the details here',
    secDetails: 'Request details',
    detailsPh: 'Any extra details the factory should know\nExample:\n– Color: black\n– Size: 200×160\n– Material: MDF',
    secAttach: 'Attachments (optional)',
    dropMain: 'Click to upload or drag files here', dropSub: 'PDF, images, ZIP, AI (max 10 MB)',
    secDelivery: 'Expected delivery', secCountry: 'Shipping country', secCity: 'City',
    cityPh: 'Select city', cityOtherPh: 'Enter city',
    secNotes: 'Additional notes (optional)', notesPh: 'Any other notes...',
    submit: 'Send request', sending: 'Sending...',
    disclaimer: "Your details aren't shared with the factory until you send the request.",
    helpT: 'Need help?', helpB: 'The Maabar team is here for you', contact: 'Contact us',
    kCategory: 'Category', kFactory: 'Factory', kLocation: 'Location', kRef: 'Product code',
    asideNote: 'You can add more in the details or attachments.',
    errQty: 'Please enter a quantity.', errDetails: 'Please add request details.',
    errUpload: 'A file failed to upload, please try again.', errGeneric: 'Something went wrong, please try again.',
    doneT: 'Your request has been sent to the factory', doneB: "You'll be notified when the factory responds with its offer through Maabar.",
    close: 'Close', signin: "You'll be asked to sign in when you submit.",
  },
  zh: {
    title: '向工厂请求报价',
    subtitle: '您的需求将直接发送至工厂。收到报价或需求更新时会通知您。',
    titleInquiry: '咨询此产品',
    subtitleInquiry: '发送您对此产品的问题，工厂的回复将显示在此处。',
    safe: '安全直达',
    secInfo: '需求信息', qty: '所需数量',
    secCustom: '需要定制吗？', customDetails: '填写详情', customDetailsPh: '在此填写详情',
    secDetails: '需求详情',
    detailsPh: '工厂需要了解的其他详情\n例如：\n– 颜色：黑色\n– 尺寸：200×160\n– 材质：MDF',
    secAttach: '附件（可选）',
    dropMain: '点击上传或拖拽文件', dropSub: 'PDF、图片、ZIP、AI（最大 10 MB）',
    secDelivery: '预计交付时间', secCountry: '收货国家', secCity: '城市',
    cityPh: '选择城市', cityOtherPh: '输入城市',
    secNotes: '补充说明（可选）', notesPh: '其他说明...',
    submit: '发送需求', sending: '发送中...',
    disclaimer: '在您发送需求前，您的信息不会分享给工厂。',
    helpT: '需要帮助？', helpB: 'Maabar 团队随时协助', contact: '联系我们',
    kCategory: '类别', kFactory: '工厂', kLocation: '位置', kRef: '货号',
    asideNote: '您可以在详情或附件中补充更多信息。',
    errQty: '请输入数量。', errDetails: '请填写需求详情。',
    errUpload: '文件上传失败，请重试。', errGeneric: '出错了，请重试。',
    doneT: '您的需求已发送至工厂', doneB: '工厂通过 Maabar 回复报价后会通知您。',
    close: '关闭', signin: '提交时会要求您登录。',
  },
};

function Icon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'shield': return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /></svg>;
    case 'tag': return <svg {...p}><path d="M3 11l8-8 10 10-8 8-10-10z" /><circle cx="8" cy="8" r="1.4" /></svg>;
    case 'factory': return <svg {...p}><path d="M3 21V9l6 4V9l6 4V5l6 4v12H3z" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.4" /></svg>;
    case 'edit': return <svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
    case 'headset': return <svg {...p}><path d="M4 13a8 8 0 0116 0" /><path d="M4 13v3a2 2 0 002 2h1v-5H6a2 2 0 00-2 2z" /><path d="M20 13v3a2 2 0 01-2 2h-1v-5h1a2 2 0 012 2z" /></svg>;
    case 'send': return <svg {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
    case 'upload': return <svg {...p} width={30} height={30}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" /></svg>;
    case 'dots': return <svg {...p}><circle cx="5" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="19" cy="12" r="1.4" /></svg>;
    case 'diamond': return <svg {...p}><path d="M12 3l8 9-8 9-8-9 8-9z" /></svg>;
    case 'sliders': return <svg {...p}><path d="M4 8h9M18 8h2M4 16h4M13 16h7" /><circle cx="15.5" cy="8" r="2" /><circle cx="9.5" cy="16" r="2" /></svg>;
    case 'box': return <svg {...p}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>;
    case 'stamp': return <svg {...p}><path d="M9 3h6v5l2 3H7l2-3V3z" /><path d="M5 16h14" /><path d="M6 21h12" /></svg>;
    default: return null;
  }
}

// Shared factory request-quote modal — product-bound (product set) or a
// factory-level inquiry (product null). Same form + pipeline; the only difference
// is whether a specific catalog product is pre-attached (left card + factory_product_id).
export default function RequestQuoteModal({ lang = 'ar', user, factory, product = null, displayCurrency = 'SAR', mode = 'quote', onClose }) {
  const isAr = lang === 'ar';
  const ar = isAr ? ' ar' : '';
  const c = T[lang] || T.ar;
  const isInquiry = mode === 'inquiry'; // lighter "ask a question" variant (qty optional; fewer fields)
  const nav = useNavigate();
  const picker = useAttachmentPicker(lang);
  const fileRef = useRef(null);

  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('piece');
  const [customTypes, setCustomTypes] = useState([]);
  const [customDetails, setCustomDetails] = useState('');
  const [requestDetails, setRequestDetails] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [countryKey, setCountryKey] = useState('SA');
  const [city, setCity] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggleType = (key) => setCustomTypes((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const gallery = product ? getFactoryProductImages(product) : [];
  const factoryPhotos = (Array.isArray(factory?.factory_images) ? factory.factory_images : []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
  const heroImg = product ? (gallery[0] || null) : (factoryPhotos[0] || factory?.profile_image || null);
  const photoCount = product ? gallery.length : factoryPhotos.length;
  const productName = product
    ? ((isAr ? product.name_ar : lang === 'zh' ? product.name_zh : product.name_en) || product.name_en || product.name_ar || product.name_zh || '')
    : '';
  const factoryName = (factory?.company_name_latin || '').trim() || factory?.company_name || '';
  const catObj = displayCategoryForCode(factory?.category);
  const categoryLabel = catObj ? (catObj.label[lang] || catObj.label.en) : null;
  const location = [factory?.city, factory?.country].filter(Boolean).join(isAr ? '، ' : ', ');
  const asideTitle = product ? productName : factoryName;
  const asideInitial = (asideTitle || '?')[0];

  const submit = useCallback(async () => {
    setError('');
    if (!isInquiry && !String(qty).trim()) { setError(c.errQty); return; }
    if (!requestDetails.trim()) { setError(c.errDetails); return; }
    if (!user) { onClose?.(); nav('/login/buyer'); return; }
    setSubmitting(true);
    let attachmentPaths = [];
    try {
      attachmentPaths = await picker.uploadAll(user.id);
    } catch (e) {
      setSubmitting(false); setError(c.errUpload); return;
    }
    // "other" has no country name field (city is free-text) → store country blank.
    const countryObj = SHIP_COUNTRIES.find((x) => x.key === countryKey);
    const shipCountry = (countryKey === 'other' || !countryObj) ? '' : countryObj.en;
    const { request, error: e } = await createFactoryRequest({
      user, factory, product,
      quantity: qty, unit,
      customizationTypes: customTypes, customizationDetails: customDetails,
      requestDetails,
      deliveryTimeframe: timeframe,
      shipCountry,
      shipCity: city,
      additionalNotes,
      attachmentPaths,
      lang, viewerCurrency: displayCurrency,
    });
    setSubmitting(false);
    if (e || !request) { setError(c.errGeneric); return; }
    setDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qty, unit, customTypes, customDetails, requestDetails, timeframe, countryKey, city, additionalNotes, user, product, factory, lang, displayCurrency, picker]);

  return (
    <div className="rq-overlay" onClick={onClose}>
      <div className="rq-modal" dir={isAr ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
        <div className="rq-head">
          <span className={`rq-badge${ar}`}><Icon name="shield" size={13} />{c.safe}</span>
          <button className="rq-close" onClick={onClose} aria-label={c.close}>×</button>
          <h2 className={`rq-title${ar}`}>{isInquiry ? c.titleInquiry : c.title}</h2>
          <p className={`rq-subtitle${ar}`}>{isInquiry ? c.subtitleInquiry : c.subtitle}</p>
        </div>

        {done ? (
          <div className={`rq-done${ar}`}>
            <h3>{c.doneT}</h3>
            <p>{c.doneB}</p>
            <button className={`rq-submit${ar}`} onClick={onClose}>{c.close}</button>
          </div>
        ) : (
          <>
            <div className="rq-body">
              {/* ── Left: product / factory card ── */}
              <aside className="rq-aside">
                <div className="rq-aside-media">
                  {heroImg ? <img src={heroImg} alt={asideTitle} /> : <span className="rq-initial">{asideInitial}</span>}
                  {photoCount > 1 && <span className="rq-count">1 / {photoCount}</span>}
                </div>
                <h3 className={`rq-aside-name${ar}`}>{asideTitle || '—'}</h3>
                {product && product.ref_code && <p className={`rq-aside-sub${ar}`}>{c.kRef}: {product.ref_code}</p>}
                {categoryLabel && (
                  <div className="rq-aside-row">
                    <Icon name="tag" size={16} />
                    <div><p className={`rq-aside-k${ar}`}>{c.kCategory}</p><p className={`rq-aside-v${ar}`}>{categoryLabel}</p></div>
                  </div>
                )}
                {product && factoryName && (
                  <div className="rq-aside-row">
                    <Icon name="factory" size={16} />
                    <div><p className={`rq-aside-k${ar}`}>{c.kFactory}</p><p className={`rq-aside-v${ar}`}>{factoryName}</p></div>
                  </div>
                )}
                {location && (
                  <div className="rq-aside-row">
                    <Icon name="pin" size={16} />
                    <div><p className={`rq-aside-k${ar}`}>{c.kLocation}</p><p className={`rq-aside-v${ar}`}>{location}</p></div>
                  </div>
                )}
                <div className={`rq-aside-note${ar}`}><Icon name="edit" size={15} />{c.asideNote}</div>
              </aside>

              {/* ── Right: the form ── */}
              <div className="rq-form">
                <h4 className={`rq-sec${ar}`}>{c.secInfo}</h4>
                <label className={`rq-sec${ar}`} style={{ fontSize: 13, fontWeight: 400, margin: '0 0 8px', display: 'block' }}>
                  {c.qty} {!isInquiry && <span className="rq-req">*</span>}
                </label>
                <div className="rq-qty">
                  <select className={`rq-select${ar}`} value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {REQUEST_UNITS.map((u) => <option key={u.key} value={u.key}>{labelFor(u, lang)}</option>)}
                  </select>
                  <input className={`rq-input${ar}`} value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="100" dir="ltr" />
                </div>

                {!isInquiry && (<>
                <h4 className={`rq-sec${ar}`}>{c.secCustom}</h4>
                <div className="rq-chips">
                  {CUSTOMIZATION_CHIPS.map((chip) => (
                    <button key={chip.key} type="button" className={`rq-chip${ar}${customTypes.includes(chip.key) ? ' on' : ''}`} onClick={() => toggleType(chip.key)}>
                      <Icon name={chip.icon} size={20} />
                      {labelFor(chip, lang)}
                    </button>
                  ))}
                </div>
                {customTypes.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <label className={`rq-sec${ar}`} style={{ fontSize: 13, fontWeight: 400, margin: '0 0 8px', display: 'block' }}>{c.customDetails}</label>
                    <input className={`rq-input${ar}`} value={customDetails} onChange={(e) => setCustomDetails(e.target.value)} placeholder={c.customDetailsPh} dir={isAr ? 'rtl' : 'ltr'} />
                  </div>
                )}
                </>)}

                <h4 className={`rq-sec${ar}`}>{c.secDetails} <span className="rq-req">*</span></h4>
                <textarea className={`rq-textarea${ar}`} rows={5} value={requestDetails} onChange={(e) => setRequestDetails(e.target.value)} placeholder={c.detailsPh} dir={isAr ? 'rtl' : 'ltr'} />

                <h4 className={`rq-sec${ar}`}>{c.secAttach}</h4>
                <div className="rq-drop" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={30} />
                  <p className={`rq-drop-main${ar}`}>{c.dropMain}</p>
                  <p className={`rq-drop-sub${ar}`}>{c.dropSub}</p>
                  <input ref={fileRef} type="file" accept={ATTACH_ACCEPT} multiple style={{ display: 'none' }}
                    onChange={(e) => { picker.addFiles(e.target.files); e.target.value = ''; }} />
                </div>
                {picker.files.length > 0 && (
                  <div className="rq-files">
                    {picker.files.map((f) => (
                      <div key={f.id} className={`rq-file${ar}`}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                        <button type="button" className="rq-file-x" onClick={() => picker.removeFile(f.id)} aria-label={c.close}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {picker.error && <p className={`rq-err${ar}`}>{picker.error}</p>}

                {!isInquiry && (<>
                <h4 className={`rq-sec${ar}`}>{c.secDelivery}</h4>
                <div className="rq-pills">
                  {DELIVERY_TIMEFRAMES.map((t) => (
                    <button key={t.key} type="button" className={`rq-pill${ar}${timeframe === t.key ? ' on' : ''}`}
                      onClick={() => setTimeframe((prev) => (prev === t.key ? '' : t.key))}>
                      {labelFor(t, lang)}
                    </button>
                  ))}
                </div>

                <h4 className={`rq-sec${ar}`}>{c.secCountry}</h4>
                <select className={`rq-select${ar}`} value={countryKey} onChange={(e) => { setCountryKey(e.target.value); setCity(''); }}>
                  {SHIP_COUNTRIES.map((co) => <option key={co.key} value={co.key}>{co.flag} {labelFor(co, lang)}</option>)}
                </select>

                <h4 className={`rq-sec${ar}`}>{c.secCity}</h4>
                {countryKey === 'SA' ? (
                  <select className={`rq-select${ar}`} value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="">{c.cityPh}</option>
                    {KSA_CITIES.map((ci) => <option key={ci.en} value={ci.en}>{isAr ? ci.ar : ci.en}</option>)}
                  </select>
                ) : (
                  <input className={`rq-input${ar}`} value={city} onChange={(e) => setCity(e.target.value)} placeholder={c.cityOtherPh} dir={isAr ? 'rtl' : 'ltr'} />
                )}
                </>)}

                <h4 className={`rq-sec${ar}`}>{c.secNotes}</h4>
                <textarea className={`rq-textarea${ar}`} rows={2} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder={c.notesPh} dir={isAr ? 'rtl' : 'ltr'} />

                {error && <p className={`rq-err${ar}`}>{error}</p>}
                {!user && <p className={`rq-hint${ar}`} style={{ margin: '10px 0 0' }}>{c.signin}</p>}
              </div>
            </div>

            <div className="rq-foot">
              <div className={`rq-help${ar}`}>
                <Icon name="headset" size={26} />
                <div>
                  <p className="rq-help-t">{c.helpT}</p>
                  <p className="rq-help-b">{c.helpB} · <a href="mailto:hello@maabar.io">{c.contact}</a></p>
                </div>
              </div>
              <div className="rq-submit-wrap">
                <button className={`rq-submit${ar}`} onClick={submit} disabled={submitting}>
                  <Icon name="send" size={17} />{submitting ? c.sending : (isInquiry ? (isAr ? 'إرسال الاستفسار' : lang === 'zh' ? '发送咨询' : 'Send inquiry') : c.submit)}
                </button>
                <p className={`rq-submit-note${ar}`}>{c.disclaimer}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
