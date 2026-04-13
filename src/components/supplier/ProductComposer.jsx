import React from 'react';
import { DISPLAY_CURRENCIES } from '../../lib/displayCurrency';
import {
  PRODUCT_GALLERY_LIMIT,
  buildProductSpecs,
  getProductGalleryImages,
  normalizeProductDraftMedia,
  normalizeProductAttributes,
} from '../../lib/productMedia';
import { VF_C, VF_CSS, VfField } from './VerificationFormUI';

export const emptyProduct = {
  name_ar: '', name_en: '', name_zh: '',
  price_from: '', currency: 'USD', category: 'other', moq: '',
  desc_en: '', desc_ar: '', desc_zh: '',
  image_url: null, gallery_images: [], video_url: null,
  spec_material: '', spec_dimensions: '', spec_unit_weight: '', spec_color_options: '', spec_packaging_details: '', spec_customization: '', spec_lead_time_days: '',
  attributes: [],
  sample_available: false, sample_price: '', sample_shipping: '', sample_max_qty: '3', sample_note: '',
};

export const PRODUCT_OPTIONAL_DB_FIELDS = [
  'gallery_images',
  'spec_material',
  'spec_dimensions',
  'spec_unit_weight',
  'spec_color_options',
  'spec_packaging_details',
  'spec_customization',
  'spec_lead_time_days',
  'attributes',
  'desc_zh',
];

export const buildProductWritePayload = (rawProduct, supplierId) => {
  const product = normalizeProductDraftMedia(rawProduct);
  const fallbackName = product.name_en || product.name_zh || product.name_ar || '';

  return {
    ...(supplierId ? { supplier_id: supplierId } : {}),
    name_ar: product.name_ar || fallbackName,
    name_en: product.name_en || fallbackName,
    name_zh: product.name_zh || fallbackName,
    price_from: parseFloat(product.price_from),
    currency: product.currency || 'USD',
    category: product.category || 'other',
    moq: product.moq,
    desc_en: product.desc_en,
    desc_ar: product.desc_ar || product.desc_en,
    desc_zh: product.desc_zh || null,
    image_url: product.image_url || null,
    gallery_images: product.gallery_images || [],
    video_url: product.video_url || null,
    spec_material: product.spec_material || null,
    spec_dimensions: product.spec_dimensions || null,
    spec_unit_weight: product.spec_unit_weight || null,
    spec_color_options: product.spec_color_options || null,
    spec_packaging_details: product.spec_packaging_details || null,
    spec_customization: product.spec_customization || null,
    spec_lead_time_days: product.spec_lead_time_days ? parseInt(product.spec_lead_time_days, 10) : null,
    attributes: normalizeProductAttributes(product.attributes),
    sample_available: product.sample_available,
    sample_price: product.sample_available ? parseFloat(product.sample_price) : null,
    sample_shipping: product.sample_available ? parseFloat(product.sample_shipping || 0) : null,
    sample_max_qty: product.sample_available ? parseInt(product.sample_max_qty || 3, 10) : null,
    sample_note: product.sample_note || null,
    is_active: true,
  };
};

export function getProductComposerValidationMessage(product, lang = 'en') {
  if (!product?.name_zh || !product?.name_en || !product?.price_from || !product?.moq || !product?.desc_en) {
    if (lang === 'ar') return 'يرجى تعبئة الحقول المطلوبة: الاسم الصيني، الاسم الإنجليزي، السعر، MOQ، والوصف الإنجليزي';
    if (lang === 'zh') return '请先填写必填字段：中文名、英文名、价格、最小起订量和英文描述';
    return 'Please fill required fields: Chinese name, English name, price, MOQ, and English description';
  }

  return '';
}

export function getProductFormPlaceholders(lang = 'en') {
  if (lang === 'ar') {
    return {
      name_zh: 'مثال: سماعة بلوتوث TWS',
      name_en: 'Example: TWS Bluetooth Earbuds',
      name_ar: 'مثال: سماعات بلوتوث لاسلكية',
      moq: 'مثال: 500',
      price_from: 'مثال: 8.50',
      desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
      desc_ar: 'مثال: علبة ABS مع بلوتوث 5.3 ودعم شعار OEM.',
      spec_material: 'ABS / فولاذ / قطن...',
      spec_dimensions: '20×12×8 cm',
      spec_unit_weight: '0.35 kg',
      spec_color_options: 'أسود، أبيض، مخصص',
      spec_packaging_details: 'كرتون داخلي + كرتون تصدير',
      spec_customization: 'شعار OEM، تغليف خاص، لون خاص',
      spec_lead_time_days: '15',
      sample_price: 'مثال: 50',
      sample_shipping: 'مثال: 25',
      sample_max_qty: '3',
      sample_note: 'مثال: العينة تُخصم من الطلب الكبير',
    };
  }

  if (lang === 'zh') {
    return {
      name_zh: '例：TWS 蓝牙耳机',
      name_en: 'Example: TWS Bluetooth Earbuds',
      name_ar: 'مثال: سماعات بلوتوث لاسلكية',
      moq: '例：500',
      price_from: '例：8.50',
      desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
      desc_ar: '可选：给阿语买家补充说明',
      spec_material: '例：ABS / 铝合金 / 纯棉',
      spec_dimensions: '例：20×12×8 cm',
      spec_unit_weight: '例：0.35 kg',
      spec_color_options: '例：黑 / 白 / 定制色',
      spec_packaging_details: '例：彩盒 + 外箱',
      spec_customization: '例：支持 OEM / Logo / 包装定制',
      spec_lead_time_days: '例：15',
      sample_price: '例：50',
      sample_shipping: '例：25',
      sample_max_qty: '3',
      sample_note: '例：大货下单可返还样品费',
    };
  }

  return {
    name_zh: 'Example: TWS 蓝牙耳机',
    name_en: 'Example: TWS Bluetooth Earbuds',
    name_ar: 'Example: سماعات بلوتوث لاسلكية',
    moq: 'Example: 500',
    price_from: 'Example: 8.50',
    desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
    desc_ar: 'Optional Arabic buyer-facing note',
    spec_material: 'Example: ABS / Aluminum / Cotton',
    spec_dimensions: 'Example: 20×12×8 cm',
    spec_unit_weight: 'Example: 0.35 kg',
    spec_color_options: 'Example: Black / White / Custom',
    spec_packaging_details: 'Example: Retail box + export carton',
    spec_customization: 'Example: OEM logo / custom packaging',
    spec_lead_time_days: 'Example: 15',
    sample_price: 'Example: 50',
    sample_shipping: 'Example: 25',
    sample_max_qty: '3',
    sample_note: 'Example: sample cost can be deducted from bulk order',
  };
}

export function getProductCompletenessItems(product, lang = 'en') {
  return [
    {
      key: 'name_zh',
      label: lang === 'ar' ? 'اسم صيني واضح كما يستخدمه فريق المبيعات أو المتجر' : lang === 'zh' ? '销售团队常用的中文产品名' : 'Chinese sales-facing product name',
      done: Boolean(product?.name_zh),
    },
    {
      key: 'name_en',
      label: lang === 'ar' ? 'اسم إنجليزي واضح للمشتري' : lang === 'zh' ? '给买家看的英文产品名' : 'Buyer-facing English product name',
      done: Boolean(product?.name_en),
    },
    {
      key: 'desc_en',
      label: lang === 'ar' ? 'وصف إنجليزي يشرح المادة والاستخدام والجودة' : lang === 'zh' ? '英文描述包含材质、用途与质量点' : 'English description with material, use, and quality point',
      done: Boolean(product?.desc_en),
    },
    {
      key: 'pricing',
      label: lang === 'ar' ? 'السعر + العملة + MOQ' : lang === 'zh' ? '价格 + 币种 + 最小起订量' : 'Price + currency + MOQ',
      done: Boolean(product?.price_from) && Boolean(product?.currency) && Boolean(product?.moq),
    },
    {
      key: 'media',
      label: lang === 'ar' ? 'صورة رئيسية أو أكثر' : lang === 'zh' ? '至少 1 张主图' : 'At least one product image',
      done: getProductGalleryImages(product).length > 0,
    },
    {
      key: 'specs',
      label: lang === 'ar' ? 'مواصفات أو تعبئة أو OEM أو مدة تجهيز' : lang === 'zh' ? '规格 / 包装 / OEM / 交期 至少一项' : 'At least one spec, packaging, OEM, or lead-time detail',
      done: buildProductSpecs(product).length > 0,
    },
  ];
}

/* ─── Attribute row sub-component (needs local state for the value input) ─ */
function AttributeRow({ attr, onChange, onRemove, isAr, lang }) {
  const [inputVal, setInputVal] = React.useState('');
  const vfFont = { fontFamily: "'Tajawal', sans-serif" };

  const addValue = () => {
    const trimmed = inputVal.trim();
    if (!trimmed || (attr.values || []).includes(trimmed) || (attr.values || []).length >= 20) return;
    onChange({ ...attr, values: [...(attr.values || []), trimmed] });
    setInputVal('');
  };

  const removeValue = (idx) => {
    const newVals = [...(attr.values || [])];
    newVals.splice(idx, 1);
    onChange({ ...attr, values: newVals });
  };

  return (
    <div style={{ padding: '14px 16px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, position: 'relative' }}>
      <button type="button" onClick={onRemove} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: VF_C.ink30, lineHeight: 1 }}>×</button>
      <div style={{ marginBottom: 10, paddingRight: 28 }}>
        <div className="vf-field-wrap">
          <input
            className="vf-input"
            placeholder={isAr ? 'اسم الخاصية (مثال: اللون)' : lang === 'zh' ? '属性名（如：颜色）' : 'Attribute name (e.g. Color)'}
            value={attr.name || ''}
            onChange={e => onChange({ ...attr, name: e.target.value })}
            style={{ fontSize: 14, fontWeight: 500, ...vfFont }}
          />
          <div className="vf-underline" />
        </div>
      </div>
      {(attr.values || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(attr.values || []).map((val, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 999, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink, ...vfFont }}>
              {val}
              <button type="button" onClick={() => removeValue(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: VF_C.ink30, lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {(attr.values || []).length < 20 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div className="vf-field-wrap" style={{ flex: 1 }}>
            <input
              className="vf-input"
              placeholder={isAr ? 'اكتب قيمة واضغط Enter' : lang === 'zh' ? '输入值后按 Enter' : 'Type a value, press Enter'}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addValue(); } }}
              style={{ fontSize: 13, ...vfFont }}
            />
            <div className="vf-underline" />
          </div>
          <button type="button" onClick={addValue} style={{ fontSize: 12, padding: '8px 16px', background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, borderRadius: 10, cursor: 'pointer', color: VF_C.ink60, whiteSpace: 'nowrap', ...vfFont, marginBottom: 2 }}>
            {isAr ? 'إضافة' : lang === 'zh' ? '添加' : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Product Form (defined outside to prevent remount on parent render) ─ */
export function ProductForm({
  data,
  setData,
  onSave,
  onCancel,
  onPreview,
  showPreviewAction = false,
  imgRef,
  vidRef,
  onImgChange,
  onVidChange,
  onRemoveImage,
  onRemoveVideo,
  uploadingImage,
  uploadingVideo,
  t,
  isAr,
  saving,
  usdRate,
  categories,
  saveLabel,
  lang,
}) {
  const vfFont = { fontFamily: "'Tajawal', sans-serif" };
  const productCategories = (categories || []).filter(c => c.val !== 'all');
  const galleryImages = getProductGalleryImages(data);
  const placeholders = getProductFormPlaceholders(lang);
  const completenessItems = getProductCompletenessItems(data, lang);
  const completenessDone = completenessItems.filter(item => item.done).length;
  const completenessPct = Math.round((completenessDone / completenessItems.length) * 100);

  return (
    <div style={{ background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, padding: '28px 32px', maxWidth: 760, borderRadius: 12 }}>
      <style>{VF_CSS}</style>

      {/* ── Media upload ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', ...vfFont }}>{t.galleryImages}</p>
          <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{t.galleryHint}</p>
        </div>
        <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onImgChange} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {galleryImages.map((url, index) => (
            <div key={`${url}-${index}`} style={{ position: 'relative', height: 110, borderRadius: 8, overflow: 'hidden', border: `1px solid ${VF_C.ink10}`, background: VF_C.paper }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {index === 0 && (
                <span style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 9, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', color: '#fff', letterSpacing: 0.5 }}>
                  {t.primaryImage}
                </span>
              )}
              <button type="button" onClick={() => onRemoveImage?.(index)} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                ×
              </button>
            </div>
          ))}
          {galleryImages.length < PRODUCT_GALLERY_LIMIT && (
            <div onClick={() => imgRef.current?.click()} style={{ height: 110, border: `1px dashed ${VF_C.ink10}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: VF_C.paper, transition: 'border-color 0.2s', flexDirection: 'column', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = VF_C.ink30}
              onMouseLeave={e => e.currentTarget.style.borderColor = VF_C.ink10}>
              {uploadingImage
                ? <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{t.uploadingImage}</p>
                : <>
                    <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>+ {galleryImages.length === 0 ? t.uploadImage : t.addMoreImages}</p>
                    <p style={{ fontSize: 9, color: VF_C.ink30, opacity: 0.75 }}>{galleryImages.length}/{PRODUCT_GALLERY_LIMIT}</p>
                  </>}
            </div>
          )}
        </div>
        {galleryImages.length >= PRODUCT_GALLERY_LIMIT && <p style={{ fontSize: 10, color: VF_C.amber, marginTop: 8, ...vfFont }}>{t.maxImagesReached}</p>}
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, marginBottom: 8, textTransform: 'uppercase', ...vfFont }}>{t.uploadVideo}</p>
        <input ref={vidRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onVidChange} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div onClick={() => !data.video_url && vidRef.current?.click()} style={{ height: 140, border: `1px dashed ${VF_C.ink10}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: data.video_url ? 'default' : 'pointer', overflow: 'hidden', background: VF_C.paper, transition: 'border-color 0.2s', flexDirection: 'column', gap: 4, position: 'relative' }}
            onMouseEnter={e => { if (!data.video_url) e.currentTarget.style.borderColor = VF_C.ink30; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = VF_C.ink10; }}>
            {uploadingVideo
              ? <p style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{t.uploadingVideo}</p>
              : data.video_url
              ? <>
                  <video src={data.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                  <button type="button" onClick={onRemoveVideo} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                    ×
                  </button>
                </>
              : <>
                  <p style={{ fontSize: 9, color: VF_C.ink30, opacity: 0.7, ...vfFont }}>
                    {lang === 'zh' ? `${t.videoLimitHint}，${t.maxVideo}` : `${t.videoLimitHint} · ${t.maxVideo}`}
                  </p>
                </>}
          </div>
        </div>
      </div>

      {/* ── Before you publish ── */}
      <div style={{ marginBottom: 22, padding: '16px 18px', borderRadius: 12, border: `1px solid ${VF_C.ink10}`, background: VF_C.paper }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 10, ...vfFont }}>
          {isAr ? 'نصيحة قبل النشر' : lang === 'zh' ? '发布前建议' : 'Before you publish'}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            isAr ? 'ابدأ بالاسم الصيني كما يعرفه فريق المبيعات أو المتجر، ثم أضف الاسم الإنجليزي للمشتري.' : lang === 'zh' ? '先填写销售团队或店铺常用的中文产品名，再补英文名给买家查看。' : 'Start with the Chinese product name your sales team/store already uses, then add the buyer-facing English name.',
            isAr ? 'اكتب وصفاً إنجليزياً عملياً يوضح المادة والاستخدام وأهم نقطة جودة.' : lang === 'zh' ? '英文描述建议直接说明材质、用途和最重要的质量点。' : 'Use the English description for material, use case, and the main quality point buyers should notice.',
            isAr ? 'تفاصيل التغليف وOEM ومدة التجهيز ترفع الثقة عند المورد الصيني وعند المشتري السعودي أيضاً.' : lang === 'zh' ? '包装信息、OEM 定制能力和交期会明显提升中方供应商专业感，也方便沙特买家判断。' : 'Packaging details, OEM capability, and lead time noticeably improve professionalism for both Chinese suppliers and Saudi buyers.',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: VF_C.ink, opacity: 0.5, marginTop: 8, flex: '0 0 auto' }} />
              <span style={{ fontSize: 12, lineHeight: 1.75, color: VF_C.ink60, ...vfFont }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Publishing readiness ── */}
      <div style={{ marginBottom: 22, padding: '16px 18px', borderRadius: 12, border: `1px solid ${VF_C.ink10}`, background: VF_C.paper }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink60, textTransform: 'uppercase', marginBottom: 6, ...vfFont }}>
              {isAr ? 'جاهزية النشر التجارية' : lang === 'zh' ? '发布完整度' : 'Publishing readiness'}
            </p>
            <p style={{ fontSize: 12, color: VF_C.ink60, margin: 0, ...vfFont }}>
              {isAr ? 'كلما اكتملت هذه النقاط، ظهر المنتج بشكل أكثر موثوقية للمشتري.' : lang === 'zh' ? '这些信息越完整，买家看到的专业感和可信度就越强。' : 'The more of these details you complete, the more credible the listing feels to buyers.'}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: VF_C.ink, ...vfFont }}>{completenessPct}%</span>
        </div>
        <div style={{ height: 1.5, background: VF_C.ink10, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${completenessPct}%`, height: '100%', background: VF_C.ink }} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {completenessItems.map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: item.done ? VF_C.ink : VF_C.ink60, ...vfFont }}>{item.label}</span>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, border: '1px solid', borderColor: item.done ? VF_C.sageBr : VF_C.ink10, background: item.done ? VF_C.sageBg : 'transparent', color: item.done ? VF_C.sage : VF_C.ink30, whiteSpace: 'nowrap', ...vfFont }}>
                {item.done ? (isAr ? 'مكتمل' : lang === 'zh' ? '已完成' : 'Done') : (isAr ? 'ينقصه' : lang === 'zh' ? '待补充' : 'Missing')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Names + MOQ + Category + Currency + Price ── */}
      <div className="form-grid" style={{ marginBottom: 8 }}>
        {[
          [t.nameZh, 'name_zh'], [t.nameEn, 'name_en'], [t.nameAr, 'name_ar'], [t.moq, 'moq'],
        ].map(([label, key]) => (
          <VfField key={key} label={label}>
            <input className="vf-input" placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
          </VfField>
        ))}
        <VfField label={t.category}>
          <select className="vf-select" value={data.category || 'other'} onChange={e => setData(prev => ({ ...prev, category: e.target.value }))}>
            {productCategories.map(cat => <option key={cat.val} value={cat.val}>{cat.label}</option>)}
          </select>
        </VfField>
        <VfField label={t.currency}>
          <select className="vf-select" value={data.currency || 'USD'} onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))}>
            {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </VfField>
        <VfField label={t.price}>
          <div style={{ position: 'relative' }}>
            <input className="vf-input" type="number" placeholder={placeholders.price_from || (data.currency || 'USD')} value={data.price_from || ''} onChange={e => setData(prev => ({ ...prev, price_from: e.target.value }))} style={{ paddingRight: 40 }} dir="ltr" />
            <span style={{ position: 'absolute', right: 0, bottom: 11, fontSize: 11, color: VF_C.ink30, pointerEvents: 'none', ...vfFont }}>{data.currency || 'USD'}</span>
          </div>
        </VfField>
      </div>
      {data.price_from && data.currency === 'USD' && (
        <p style={{ fontSize: 12, color: VF_C.ink30, marginBottom: 16, ...vfFont }}>
          ≈ {(parseFloat(data.price_from || 0) * (usdRate || 3.75)).toFixed(2)} SAR
        </p>
      )}

      {/* ── Descriptions ── */}
      <p style={{ fontSize: 12, color: VF_C.ink30, margin: '4px 0 12px', ...vfFont }}>{t.descHint}</p>
      <VfField label={t.descEnLabel}>
        <textarea className="vf-input" rows={3} placeholder={placeholders.desc_en || ''} style={{ resize: 'vertical' }} value={data.desc_en || ''} onChange={e => setData(prev => ({ ...prev, desc_en: e.target.value }))} />
      </VfField>
      <VfField label={t.descLabel}>
        <textarea className="vf-input" rows={2} placeholder={placeholders.desc_ar || ''} style={{ resize: 'vertical', ...vfFont }} value={data.desc_ar || ''} onChange={e => setData(prev => ({ ...prev, desc_ar: e.target.value }))} />
      </VfField>

      {/* ── Specs ── */}
      <div style={{ marginTop: 20, padding: '18px 20px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, marginBottom: 14, textTransform: 'uppercase', ...vfFont }}>{t.specsTitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px' }}>
          {[
            [t.specMaterial, 'spec_material'],
            [t.specDimensions, 'spec_dimensions'],
            [t.specWeight, 'spec_unit_weight'],
            [t.specColors, 'spec_color_options'],
            [t.specPackaging, 'spec_packaging_details'],
            [t.specCustomization, 'spec_customization'],
            [t.specLeadTime, 'spec_lead_time_days', 'number'],
          ].map(([label, key, type]) => (
            <VfField key={key} label={label}>
              <input className="vf-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
            </VfField>
          ))}
        </div>
      </div>

      {/* ── Custom attributes ── */}
      <div style={{ marginTop: 20, padding: '18px 20px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', ...vfFont }}>
            {isAr ? 'الخصائص المخصصة' : lang === 'zh' ? '自定义属性' : 'Custom Attributes'}
          </p>
          {(data.attributes || []).length < 20 && (
            <button type="button"
              onClick={() => setData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { name: '', values: [] }] }))}
              style={{ fontSize: 12, color: VF_C.ink60, background: 'none', border: `1px solid ${VF_C.ink10}`, borderRadius: 10, padding: '5px 14px', cursor: 'pointer', ...vfFont }}>
              {isAr ? '+ إضافة خاصية' : lang === 'zh' ? '+ 添加属性' : '+ Add attribute'}
            </button>
          )}
        </div>
        {(data.attributes || []).length === 0 && (
          <p style={{ fontSize: 12, color: VF_C.ink30, ...vfFont }}>
            {isAr ? 'أضف خصائص مثل: اللون، الحجم، الجهد الكهربائي…' : lang === 'zh' ? '添加自定义属性，如颜色、尺寸、功率等。' : 'Add custom attributes like Color, Size, Wattage, etc.'}
          </p>
        )}
        {(data.attributes || []).length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {(data.attributes || []).map((attr, attrIdx) => (
              <AttributeRow
                key={attrIdx}
                attr={attr}
                isAr={isAr}
                lang={lang}
                onChange={(updated) => setData(prev => {
                  const attrs = [...(prev.attributes || [])];
                  attrs[attrIdx] = updated;
                  return { ...prev, attributes: attrs };
                })}
                onRemove={() => setData(prev => {
                  const attrs = [...(prev.attributes || [])];
                  attrs.splice(attrIdx, 1);
                  return { ...prev, attributes: attrs };
                })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sample availability ── */}
      <div style={{ marginTop: 20, padding: '18px 20px', background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: data.sample_available ? 18 : 0 }}>
          <input type="checkbox" id="sample_toggle" checked={data.sample_available || false} onChange={e => setData(prev => ({ ...prev, sample_available: e.target.checked }))} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: VF_C.ink }} />
          <label htmlFor="sample_toggle" style={{ fontSize: 14, fontWeight: 500, color: VF_C.ink, cursor: 'pointer', ...vfFont }}>{t.sampleAvailable}</label>
        </div>
        {data.sample_available && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0 24px', animation: 'fadeIn 0.25s ease' }}>
            {[[t.samplePrice, 'sample_price', 'number'], [t.sampleShipping, 'sample_shipping', 'number'], [t.sampleMaxQty, 'sample_max_qty', 'number'], [t.sampleNote, 'sample_note']].map(([label, key, type]) => (
              <VfField key={key} label={label}>
                <input className="vf-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
              </VfField>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
        {showPreviewAction
          ? <button onClick={onPreview} className="vf-btn-ink" style={{ display: 'inline-block', width: 'auto', padding: '13px 28px', fontSize: 14 }}>{t.continueToPreview}</button>
          : <button onClick={onSave} disabled={saving} className="vf-btn-ink" style={{ display: 'inline-block', width: 'auto', padding: '13px 28px', fontSize: 14 }}>{saving ? t.saving : (saveLabel || t.save)}</button>}
        <button onClick={onCancel} className="vf-btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '11px 20px', fontSize: 14 }}>{t.cancel}</button>
      </div>
    </div>
  );
}

export function ProductPreviewPanel({ product, onPublish, onBack, t, isAr, saving, lang }) {
  const galleryImages = getProductGalleryImages(product);
  const specs = buildProductSpecs(product);
  const displayName = lang === 'zh'
    ? product.name_zh || product.name_en || product.name_ar
    : lang === 'ar'
    ? product.name_ar || product.name_en || product.name_zh
    : product.name_en || product.name_ar || product.name_zh;
  const vfFont = { fontFamily: "'Tajawal', sans-serif" };
  const completenessItems = getProductCompletenessItems(product, lang);
  const completenessDone = completenessItems.filter(item => item.done).length;
  const providedNames = [
    { key: 'zh', label: lang === 'ar' ? 'الاسم الصيني' : lang === 'zh' ? '中文名' : 'Chinese name', value: product.name_zh },
    { key: 'en', label: lang === 'ar' ? 'الاسم الإنجليزي' : lang === 'zh' ? '英文名' : 'English name', value: product.name_en },
    { key: 'ar', label: lang === 'ar' ? 'الاسم العربي' : lang === 'zh' ? '阿拉伯语名' : 'Arabic name', value: product.name_ar },
  ].filter((item) => item.value);

  return (
    <div style={{ background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, padding: '28px 32px', maxWidth: 760, borderRadius: 12 }}>
      <style>{VF_CSS}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 8, ...vfFont }}>{t.previewStep}</p>
          <h3 style={{ fontSize: 24, fontWeight: 400, color: VF_C.ink, ...vfFont }}>{displayName || '—'}</h3>
        </div>
        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink30, letterSpacing: 1, ...vfFont }}>{t.previewBadge}</span>
      </div>

      <p style={{ fontSize: 12, color: VF_C.ink30, marginBottom: 20, lineHeight: 1.7, ...vfFont }}>{t.previewNote}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '16px 18px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: VF_C.ink60, marginBottom: 10, ...vfFont }}>
            {isAr ? 'جاهزية العرض' : lang === 'zh' ? '发布摘要' : 'Listing readiness'}
          </p>
          <p style={{ fontSize: 13, color: VF_C.ink, marginBottom: 10, ...vfFont }}>
            {isAr ? `${completenessDone}/${completenessItems.length} نقاط مكتملة قبل النشر` : lang === 'zh' ? `发布前已完成 ${completenessDone}/${completenessItems.length} 项` : `${completenessDone}/${completenessItems.length} credibility checks completed before publish`}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>
              {isAr ? `${galleryImages.length} صور` : lang === 'zh' ? `${galleryImages.length} 张图片` : `${galleryImages.length} images`}
            </span>
            {product.video_url && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>Video</span>}
            {product.sample_available && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}`, color: VF_C.sage, ...vfFont }}>{isAr ? 'عينة مفعلة' : lang === 'zh' ? '样品已开启' : 'Samples enabled'}</span>}
            {specs.length > 0 && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>{isAr ? `${specs.length} مواصفات` : lang === 'zh' ? `${specs.length} 项规格` : `${specs.length} specs`}</span>}
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: VF_C.ink30, marginBottom: 10, ...vfFont }}>
            {isAr ? 'الأسماء المعروضة' : lang === 'zh' ? '展示名称' : 'Displayed names'}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {providedNames.map((item) => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: VF_C.ink30, ...vfFont }}>{item.label}</span>
                <span style={{ fontSize: 12, color: VF_C.ink, textAlign: isAr ? 'left' : 'right', ...vfFont }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div>
          {galleryImages.length > 0 ? (
            <>
              <div style={{ height: 300, borderRadius: 12, overflow: 'hidden', border: `1px solid ${VF_C.ink10}`, background: VF_C.paper, marginBottom: 12 }}>
                <img src={galleryImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {galleryImages.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}>
                  {galleryImages.slice(1).map((url, index) => (
                    <div key={`${url}-${index}`} style={{ height: 72, borderRadius: 8, overflow: 'hidden', border: `1px solid ${VF_C.ink10}` }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: 220, borderRadius: 12, border: `1px dashed ${VF_C.ink10}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: VF_C.ink30, background: VF_C.paper, ...vfFont }}>{t.previewEmptyMedia}</div>
          )}
        </div>

        <div>
          <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, marginBottom: 14 }}>
            <p style={{ fontSize: 28, fontWeight: 300, color: VF_C.ink, marginBottom: 8, ...vfFont }}>
              {product.price_from || '—'} <span style={{ fontSize: 13, color: VF_C.ink30 }}>{product.currency || 'USD'}</span>
            </p>
            <p style={{ fontSize: 12, color: VF_C.ink60, ...vfFont }}>MOQ: {product.moq || '—'}</p>
            {product.category && <p style={{ fontSize: 12, color: VF_C.ink60, marginTop: 6, ...vfFont }}>{t.category}: {product.category}</p>}
          </div>

          {product.video_url && (
            <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${VF_C.ink10}`, background: VF_C.ink, marginBottom: 14 }}>
              <video src={product.video_url} controls style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
            </div>
          )}

          {specs.length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 12, ...vfFont }}>{t.specsTitle}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {specs.map(spec => (
                  <div key={spec.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: VF_C.ink30, textTransform: 'capitalize', ...vfFont }}>{spec.label}</span>
                    <span style={{ fontSize: 13, color: VF_C.ink, textAlign: isAr ? 'left' : 'right', ...vfFont }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(product.attributes) && product.attributes.filter(a => a.name && a.values?.length).length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 12, background: VF_C.paper, border: `1px solid ${VF_C.ink10}`, marginTop: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: VF_C.ink30, textTransform: 'uppercase', marginBottom: 12, ...vfFont }}>
                {isAr ? 'الخصائص المخصصة' : lang === 'zh' ? '自定义属性' : 'Custom Attributes'}
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {product.attributes.filter(a => a.name && a.values?.length).map((attr, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: VF_C.ink30, flexShrink: 0, ...vfFont }}>{attr.name}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                      {attr.values.map((val, j) => (
                        <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: VF_C.cream, border: `1px solid ${VF_C.ink10}`, color: VF_C.ink60, ...vfFont }}>{val}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.desc_en && <p style={{ fontSize: 14, lineHeight: 1.8, color: VF_C.ink60, marginBottom: product.desc_ar ? 12 : 24, ...vfFont }}>{product.desc_en}</p>}
      {product.desc_ar && <p style={{ fontSize: 14, lineHeight: 1.8, color: VF_C.ink60, marginBottom: 24, ...vfFont }}>{product.desc_ar}</p>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onPublish} disabled={saving} className="vf-btn-ink" style={{ display: 'inline-block', width: 'auto', padding: '13px 28px', fontSize: 14 }}>{saving ? t.saving : t.publishNow}</button>
        <button onClick={onBack} className="vf-btn-ghost" style={{ display: 'inline-block', width: 'auto', padding: '11px 20px', fontSize: 14 }}>{t.backToEdit}</button>
      </div>
    </div>
  );
}
