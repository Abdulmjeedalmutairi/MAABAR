import React from 'react';
import { DISPLAY_CURRENCIES } from '../../lib/displayCurrency';
import {
  PRODUCT_GALLERY_LIMIT,
  buildProductSpecs,
  getProductGalleryImages,
  normalizeProductDraftMedia,
  normalizeProductAttributes,
} from '../../lib/productMedia';

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
  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };

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
    <div style={{ padding: '14px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
      <button type="button" onClick={onRemove} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-disabled)', lineHeight: 1 }}>×</button>
      <div style={{ marginBottom: 10, paddingRight: 28 }}>
        <input
          className="form-input"
          placeholder={isAr ? 'اسم الخاصية (مثال: اللون)' : lang === 'zh' ? '属性名（如：颜色）' : 'Attribute name (e.g. Color)'}
          value={attr.name || ''}
          onChange={e => onChange({ ...attr, name: e.target.value })}
          style={{ fontSize: 12, fontWeight: 500, ...arFont }}
        />
      </div>
      {(attr.values || []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {(attr.values || []).map((val, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
              {val}
              <button type="button" onClick={() => removeValue(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1, padding: '0 0 0 2px' }}>×</button>
            </span>
          ))}
        </div>
      )}
      {(attr.values || []).length < 20 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="form-input"
            placeholder={isAr ? 'اكتب قيمة واضغط Enter' : lang === 'zh' ? '输入值后按 Enter' : 'Type a value, press Enter'}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addValue(); } }}
            style={{ fontSize: 12, flex: 1, ...arFont }}
          />
          <button type="button" onClick={addValue} style={{ fontSize: 11, padding: '0 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
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
  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const productCategories = (categories || []).filter(c => c.val !== 'all');
  const galleryImages = getProductGalleryImages(data);
  const placeholders = getProductFormPlaceholders(lang);
  const completenessItems = getProductCompletenessItems(data, lang);
  const completenessDone = completenessItems.filter(item => item.done).length;
  const completenessPct = Math.round((completenessDone / completenessItems.length) * 100);

  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '28px 32px', maxWidth: 760, borderRadius: 'var(--radius-xl)' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase' }}>{t.galleryImages}</p>
          <p style={{ fontSize: 11, color: 'var(--text-disabled)', ...arFont }}>{t.galleryHint}</p>
        </div>
        <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onImgChange} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {galleryImages.map((url, index) => (
            <div key={`${url}-${index}`} style={{ position: 'relative', height: 110, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
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
            <div onClick={() => imgRef.current?.click()} style={{ height: 110, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-muted)', transition: 'border-color 0.2s', flexDirection: 'column', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
              {uploadingImage
                ? <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{t.uploadingImage}</p>
                : <>
                    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>+ {galleryImages.length === 0 ? t.uploadImage : t.addMoreImages}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-disabled)', opacity: 0.75 }}>{galleryImages.length}/{PRODUCT_GALLERY_LIMIT}</p>
                  </>}
            </div>
          )}
        </div>
        {galleryImages.length >= PRODUCT_GALLERY_LIMIT && <p style={{ fontSize: 10, color: '#a08850', marginTop: 8 }}>{t.maxImagesReached}</p>}
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 8, textTransform: 'uppercase' }}>{t.uploadVideo}</p>
        <input ref={vidRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onVidChange} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div onClick={() => !data.video_url && vidRef.current?.click()} style={{ height: 140, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: data.video_url ? 'default' : 'pointer', overflow: 'hidden', background: 'var(--bg-muted)', transition: 'border-color 0.2s', flexDirection: 'column', gap: 4, position: 'relative' }}
            onMouseEnter={e => { if (!data.video_url) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
            {uploadingVideo
              ? <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{t.uploadingVideo}</p>
              : data.video_url
              ? <>
                  <video src={data.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                  <button type="button" onClick={onRemoveVideo} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                    ×
                  </button>
                </>
              : <>
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>+ {t.uploadVideo}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-disabled)', opacity: 0.6 }}>{t.videoLimitHint} · {t.maxVideo}</p>
                </>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 22, padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 10 }}>
          {isAr ? 'نصيحة قبل النشر' : lang === 'zh' ? '发布前建议' : 'Before you publish'}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            isAr ? 'ابدأ بالاسم الصيني كما يعرفه فريق المبيعات أو المتجر، ثم أضف الاسم الإنجليزي للمشتري.' : lang === 'zh' ? '先填写销售团队或店铺常用的中文产品名，再补英文名给买家查看。' : 'Start with the Chinese product name your sales team/store already uses, then add the buyer-facing English name.',
            isAr ? 'اكتب وصفاً إنجليزياً عملياً يوضح المادة والاستخدام وأهم نقطة جودة.' : lang === 'zh' ? '英文描述建议直接说明材质、用途和最重要的质量点。' : 'Use the English description for material, use case, and the main quality point buyers should notice.',
            isAr ? 'تفاصيل التغليف وOEM ومدة التجهيز ترفع الثقة عند المورد الصيني وعند المشتري السعودي أيضاً.' : lang === 'zh' ? '包装信息、OEM 定制能力和交期会明显提升中方供应商专业感，也方便沙特买家判断。' : 'Packaging details, OEM capability, and lead time noticeably improve professionalism for both Chinese suppliers and Saudi buyers.',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.7, marginTop: 7, flex: '0 0 auto' }} />
              <span style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', ...arFont }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22, padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
              {isAr ? 'جاهزية النشر التجارية' : lang === 'zh' ? '发布完整度' : 'Publishing readiness'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, ...arFont }}>
              {isAr ? 'كلما اكتملت هذه النقاط، ظهر المنتج بشكل أكثر موثوقية للمشتري.' : lang === 'zh' ? '这些信息越完整，买家看到的专业感和可信度就越强。' : 'The more of these details you complete, the more credible the listing feels to buyers.'}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{completenessPct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${completenessPct}%`, height: '100%', borderRadius: 999, background: '#1a1a1a' }} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {completenessItems.map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', ...arFont }}>{item.label}</span>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, border: '1px solid', borderColor: item.done ? 'rgba(58,122,82,0.25)' : 'var(--border-subtle)', background: item.done ? 'rgba(58,122,82,0.08)' : 'var(--bg-subtle)', color: item.done ? '#5a9a72' : 'var(--text-disabled)', whiteSpace: 'nowrap' }}>
                {item.done ? (isAr ? 'مكتمل' : lang === 'zh' ? '已完成' : 'Done') : (isAr ? 'ينقصه' : lang === 'zh' ? '待补充' : 'Missing')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-grid">
        {[
          [t.nameZh, 'name_zh'], [t.nameEn, 'name_en'], [t.nameAr, 'name_ar'], [t.moq, 'moq'],
        ].map(([label, key, type]) => (
          <div key={key} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">{t.category}</label>
          <select className="form-input" value={data.category || 'other'} onChange={e => setData(prev => ({ ...prev, category: e.target.value }))}>
            {productCategories.map(cat => <option key={cat.val} value={cat.val}>{cat.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t.currency}</label>
          <select className="form-input" value={data.currency || 'USD'} onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))}>
            {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t.price}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input className="form-input" type="number" placeholder={placeholders.price_from || (data.currency || 'USD')} value={data.price_from || ''} onChange={e => setData(prev => ({ ...prev, price_from: e.target.value }))} style={{ paddingRight: 52 }} dir="ltr" />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-disabled)', pointerEvents: 'none' }}>{data.currency || 'USD'}</span>
            </div>
            {data.price_from && data.currency === 'USD' && (
              <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 3, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', direction: 'ltr' }}>
                ≈ {(parseFloat(data.price_from || 0) * (usdRate || 3.75)).toFixed(2)} SAR
              </div>
            )}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: '4px 0 12px', ...arFont }}>{t.descHint}</p>
      <div className="form-group">
        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.descEnLabel}</label>
        <textarea className="form-input" rows={3} placeholder={placeholders.desc_en || ''} style={{ resize: 'vertical' }} value={data.desc_en || ''} onChange={e => setData(prev => ({ ...prev, desc_en: e.target.value }))} />
      </div>

      <div className="form-group">
        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.descLabel}</label>
        <textarea className="form-input" rows={2} placeholder={placeholders.desc_ar || ''} style={{ resize: 'vertical', ...arFont }} value={data.desc_ar || ''} onChange={e => setData(prev => ({ ...prev, desc_ar: e.target.value }))} />
      </div>

      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 14, textTransform: 'uppercase' }}>{t.specsTitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            [t.specMaterial, 'spec_material'],
            [t.specDimensions, 'spec_dimensions'],
            [t.specWeight, 'spec_unit_weight'],
            [t.specColors, 'spec_color_options'],
            [t.specPackaging, 'spec_packaging_details'],
            [t.specCustomization, 'spec_customization'],
            [t.specLeadTime, 'spec_lead_time_days', 'number'],
          ].map(([label, key, type]) => (
            <div key={key} className="form-group" style={{ marginBottom: 0 }}>
              <label className={`form-label${isAr ? ' ar' : ''}`}>{label}</label>
              <input className="form-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase' }}>
            {isAr ? 'الخصائص المخصصة' : lang === 'zh' ? '自定义属性' : 'Custom Attributes'}
          </p>
          {(data.attributes || []).length < 20 && (
            <button type="button"
              onClick={() => setData(prev => ({ ...prev, attributes: [...(prev.attributes || []), { name: '', values: [] }] }))}
              style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '5px 12px', cursor: 'pointer' }}>
              {isAr ? '+ إضافة خاصية' : lang === 'zh' ? '+ 添加属性' : '+ Add attribute'}
            </button>
          )}
        </div>
        {(data.attributes || []).length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
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

      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: data.sample_available ? 18 : 0 }}>
          <input type="checkbox" id="sample_toggle" checked={data.sample_available || false} onChange={e => setData(prev => ({ ...prev, sample_available: e.target.checked }))} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--text-secondary)' }} />
          <label htmlFor="sample_toggle" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', ...arFont }}>{t.sampleAvailable}</label>
        </div>
        {data.sample_available && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, animation: 'fadeIn 0.25s ease' }}>
            {[[t.samplePrice, 'sample_price', 'number'], [t.sampleShipping, 'sample_shipping', 'number'], [t.sampleMaxQty, 'sample_max_qty', 'number'], [t.sampleNote, 'sample_note']].map(([label, key, type]) => (
              <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <input className="form-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        {showPreviewAction
          ? <button onClick={onPreview} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{t.continueToPreview}</button>
          : <button onClick={onSave} disabled={saving} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{saving ? t.saving : (saveLabel || t.save)}</button>}
        <button onClick={onCancel} className="btn-outline" style={{ padding: '11px 20px', fontSize: 12, minHeight: 44 }}>{t.cancel}</button>
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
  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const completenessItems = getProductCompletenessItems(product, lang);
  const completenessDone = completenessItems.filter(item => item.done).length;
  const providedNames = [
    { key: 'zh', label: lang === 'ar' ? 'الاسم الصيني' : lang === 'zh' ? '中文名' : 'Chinese name', value: product.name_zh },
    { key: 'en', label: lang === 'ar' ? 'الاسم الإنجليزي' : lang === 'zh' ? '英文名' : 'English name', value: product.name_en },
    { key: 'ar', label: lang === 'ar' ? 'الاسم العربي' : lang === 'zh' ? '阿拉伯语名' : 'Arabic name', value: product.name_ar },
  ].filter((item) => item.value);

  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '28px 32px', maxWidth: 760, borderRadius: 'var(--radius-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 8 }}>{t.previewStep}</p>
          <h3 style={{ fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', ...arFont }}>{displayName || '—'}</h3>
        </div>
        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)', letterSpacing: 1 }}>{t.previewBadge}</span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 20, lineHeight: 1.7, ...arFont }}>{t.previewNote}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>
            {isAr ? 'جاهزية العرض' : lang === 'zh' ? '发布摘要' : 'Listing readiness'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10, ...arFont }}>
            {isAr ? `${completenessDone}/${completenessItems.length} نقاط مكتملة قبل النشر` : lang === 'zh' ? `发布前已完成 ${completenessDone}/${completenessItems.length} 项` : `${completenessDone}/${completenessItems.length} credibility checks completed before publish`}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {isAr ? `${galleryImages.length} صور` : lang === 'zh' ? `${galleryImages.length} 张图片` : `${galleryImages.length} images`}
            </span>
            {product.video_url && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Video</span>}
            {product.sample_available && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>{isAr ? 'عينة مفعلة' : lang === 'zh' ? '样品已开启' : 'Samples enabled'}</span>}
            {specs.length > 0 && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{isAr ? `${specs.length} مواصفات` : lang === 'zh' ? `${specs.length} 项规格` : `${specs.length} specs`}</span>}
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
            {isAr ? 'الأسماء المعروضة' : lang === 'zh' ? '展示名称' : 'Displayed names'}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {providedNames.map((item) => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 24 }}>
        <div>
          {galleryImages.length > 0 ? (
            <>
              <div style={{ height: 300, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-muted)', marginBottom: 12 }}>
                <img src={galleryImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {galleryImages.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}>
                  {galleryImages.slice(1).map((url, index) => (
                    <div key={`${url}-${index}`} style={{ height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: 220, borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', background: 'var(--bg-muted)' }}>{t.previewEmptyMedia}</div>
          )}
        </div>

        <div>
          <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
            <p style={{ fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8 }}>
              {product.price_from || '—'} <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{product.currency || 'USD'}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>MOQ: {product.moq || '—'}</p>
            {product.category && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{t.category}: {product.category}</p>}
          </div>

          {product.video_url && (
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#1a1a1a', marginBottom: 14 }}>
              <video src={product.video_url} controls style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
            </div>
          )}

          {specs.length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 12 }}>{t.specsTitle}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {specs.map(spec => (
                  <div key={spec.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-disabled)', textTransform: 'capitalize' }}>{spec.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right' }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(product.attributes) && product.attributes.filter(a => a.name && a.values?.length).length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', marginTop: 14 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 12 }}>
                {isAr ? 'الخصائص المخصصة' : lang === 'zh' ? '自定义属性' : 'Custom Attributes'}
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {product.attributes.filter(a => a.name && a.values?.length).map((attr, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-disabled)', flexShrink: 0 }}>{attr.name}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                      {attr.values.map((val, j) => (
                        <span key={j} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{val}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.desc_en && <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: product.desc_ar ? 12 : 24 }}>{product.desc_en}</p>}
      {product.desc_ar && <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24, ...arFont }}>{product.desc_ar}</p>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onPublish} disabled={saving} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{saving ? t.saving : t.publishNow}</button>
        <button onClick={onBack} className="btn-outline" style={{ padding: '11px 20px', fontSize: 12, minHeight: 44 }}>{t.backToEdit}</button>
      </div>
    </div>
  );
}
