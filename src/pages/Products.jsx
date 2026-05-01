import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import Footer from '../components/Footer';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { getPrimaryProductImage } from '../lib/productMedia';
import { isSupplierPubliclyVisible } from '../lib/supplierOnboarding';
import { attachSupplierProfiles } from '../lib/profileVisibility';
import { PRODUCT_TIER_EMBED, deriveProductPriceFrom } from '../lib/productPriceLookup';
import { PRODUCT_CERT_EMBED } from '../lib/productCertLookup';
import ProductBuyerCardSummary from '../components/ProductBuyerCardSummary';

const CATEGORIES = {
  ar: [
    { val: 'all', label: 'الكل' },
    { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture', label: 'أثاث' },
    { val: 'clothing', label: 'ملابس' },
    { val: 'building', label: 'مواد بناء' },
    { val: 'food', label: 'غذاء' },
    { val: 'other', label: 'أخرى' },
  ],
  en: [
    { val: 'all', label: 'All' },
    { val: 'electronics', label: 'Electronics' },
    { val: 'furniture', label: 'Furniture' },
    { val: 'clothing', label: 'Clothing' },
    { val: 'building', label: 'Building Materials' },
    { val: 'food', label: 'Food' },
    { val: 'other', label: 'Other' },
  ],
  zh: [
    { val: 'all', label: '全部' },
    { val: 'electronics', label: '电子产品' },
    { val: 'furniture', label: '家具' },
    { val: 'clothing', label: '服装' },
    { val: 'building', label: '建材' },
    { val: 'food', label: '食品' },
    { val: 'other', label: '其他' },
  ],
};

/* ─── Skeleton ───────────────────────────── */
const SkeletonCard = () => (
  <div style={{
    background: '#faf9f7', border: '1px solid #e8e5de',
    borderRadius: 12, overflow: 'hidden',
  }}>
    <div style={{ width: '100%', aspectRatio: '1/1', background: 'var(--bg-raised)' }} />
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '65%', height: 12, background: 'var(--bg-raised)', borderRadius: 4 }} />
      <div style={{ width: '40%', height: 12, background: 'var(--bg-raised)', borderRadius: 4 }} />
      <div style={{ width: '100%', height: 36, background: 'var(--bg-raised)', borderRadius: 8, marginTop: 4 }} />
    </div>
  </div>
);

function buildSearchableText(product = {}) {
  return [
    product.name_ar,
    product.name_en,
    product.name_zh,
    product.desc_ar,
    product.desc_en,
    product.desc_zh,
    product.profiles?.company_name,
    product.profiles?.city,
    product.profiles?.country,
    product.profiles?.maabar_supplier_id,
    product.spec_customization,
    product.spec_material,
    product.spec_packaging_details,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function getProductDisplayName(product, lang) {
  if (lang === 'ar') return product.name_ar || product.name_en || product.name_zh;
  if (lang === 'zh') return product.name_zh || product.name_en || product.name_ar;
  return product.name_en || product.name_zh || product.name_ar;
}

/* ─── Main ───────────────────────────────── */
export default function Products({ lang, user, profile, displayCurrency, exchangeRates }) {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [capabilityFilters, setCapabilityFilters] = useState({ sample: false, customization: false });
  const isAr = lang === 'ar';
  const cats = CATEGORIES[lang] || CATEGORIES.ar;
  const uiDisplayCurrency = displayCurrency || (lang === 'ar' ? 'SAR' : lang === 'zh' ? 'CNY' : 'USD');

  usePageTitle('products', lang);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);

    const { data } = await sb
      .from('products')
      .select(`*, ${PRODUCT_TIER_EMBED}, ${PRODUCT_CERT_EMBED}`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (Array.isArray(data) && data.length > 0) {
      const productsWithSuppliers = await attachSupplierProfiles(sb, data, 'supplier_id', 'profiles');
      setProducts(productsWithSuppliers);
      setLoading(false);
      return;
    }

    setProducts([]);
    setLoading(false);
  };

  const filtered = products
    .filter(p => buildSearchableText(p).includes(search.trim().toLowerCase()))
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .filter(p => {
      const converted = buildDisplayPrice({
        amount: deriveProductPriceFrom(p),
        sourceCurrency: p.currency || 'USD',
        displayCurrency: uiDisplayCurrency,
        rates: exchangeRates,
        lang,
      }).displayAmount;
      return !priceRange.min || converted >= parseFloat(priceRange.min);
    })
    .filter(p => {
      const converted = buildDisplayPrice({
        amount: deriveProductPriceFrom(p),
        sourceCurrency: p.currency || 'USD',
        displayCurrency: uiDisplayCurrency,
        rates: exchangeRates,
        lang,
      }).displayAmount;
      return !priceRange.max || converted <= parseFloat(priceRange.max);
    })
    .filter(p => !capabilityFilters.sample || Boolean(p.sample_available))
    .filter(p => !capabilityFilters.customization || Boolean(p.spec_customization))
    .sort((a, b) => {
      const aPrice = buildDisplayPrice({ amount: deriveProductPriceFrom(a), sourceCurrency: a.currency || 'USD', displayCurrency: uiDisplayCurrency, rates: exchangeRates, lang }).displayAmount;
      const bPrice = buildDisplayPrice({ amount: deriveProductPriceFrom(b), sourceCurrency: b.currency || 'USD', displayCurrency: uiDisplayCurrency, rates: exchangeRates, lang }).displayAmount;
      if (sortBy === 'price_asc') return aPrice - bPrice;
      if (sortBy === 'price_desc') return bPrice - aPrice;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="full-page">

      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isAr ? 'المنتجات' : lang === 'zh' ? '产品' : 'Products'}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isAr
              ? 'تصفح منتجات الموردين الصينيين المعتمدين مع تفاصيل أوضح للثقة والحد الأدنى للطلب والعينات ومدة التجهيز.'
              : lang === 'zh'
                ? '浏览认证中国供应商产品，查看更清晰的 MOQ、样品、交期与信任信息。'
                : 'Browse verified Chinese supplier products with clearer MOQ, sample, lead time, and trust details.'}
          </p>
        </div>
      </div>

      <div className="list-wrap">
        <div style={{
          marginBottom: 18,
          padding: '14px 16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)',
        }}>
          <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
            {isAr ? 'مستوى عرض أقرب للمصنع' : lang === 'zh' ? '更贴近工厂的上架方式' : 'Factory-style listing clarity'}
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr
              ? 'الأسماء الصينية عند توفرها، والحد الأدنى للطلب، والعينات، ومدة التجهيز، وإشارات ثقة المورد معروضة بشكل أوضح قبل التواصل.'
              : lang === 'zh'
                ? '如有中文品名、MOQ、样品、备货周期与供应商信任信号，会在联系前更清楚地展示。'
                : 'Chinese factory naming, MOQ, samples, lead time, and supplier trust signals are surfaced more clearly before you contact the supplier.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              className="search-input"
              placeholder={isAr ? 'ابحث بالعربي أو الإنجليزي أو الصيني...' : lang === 'zh' ? '可搜索中文 / 英文 / 阿文产品名...' : 'Search Arabic, English, or Chinese product names...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              dir={isAr ? 'rtl' : 'ltr'}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '10px 14px',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
              fontSize: 13,
              color: 'var(--text-secondary)',
              outline: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              transition: 'border-color 0.2s',
              minHeight: 42,
            }}>
            <option value="newest">{isAr ? 'الأحدث' : lang === 'zh' ? '最新' : 'Newest'}</option>
            <option value="price_asc">{isAr ? 'السعر: الأقل' : lang === 'zh' ? '价格从低到高' : 'Price: Low'}</option>
            <option value="price_desc">{isAr ? 'السعر: الأعلى' : lang === 'zh' ? '价格从高到低' : 'Price: High'}</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c.val} onClick={() => setActiveCategory(c.val)} style={{
              padding: '6px 14px',
              fontSize: 12,
              background: activeCategory === c.val ? 'var(--bg-raised)' : 'transparent',
              color: activeCategory === c.val ? 'var(--text-primary)' : 'var(--text-disabled)',
              border: '1px solid',
              borderColor: activeCategory === c.val ? 'var(--border-muted)' : 'var(--border-subtle)',
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              minHeight: 32,
            }}>
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr ? 'السعر:' : lang === 'zh' ? '价格:' : 'Price:'}
          </span>
          <input
            className="search-input"
            style={{ width: 90 }}
            type="number"
            placeholder={isAr ? 'من' : lang === 'zh' ? '最小' : 'Min'}
            value={priceRange.min}
            onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
          />
          <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>—</span>
          <input
            className="search-input"
            style={{ width: 90 }}
            type="number"
            placeholder={isAr ? 'إلى' : lang === 'zh' ? '最大' : 'Max'}
            value={priceRange.max}
            onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
          />
          <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{uiDisplayCurrency}</span>
          {(priceRange.min || priceRange.max) && (
            <button
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }}
              onClick={() => setPriceRange({ min: '', max: '' })}>
              {isAr ? 'مسح' : lang === 'zh' ? '清除' : 'Clear'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr ? 'تصفية سريعة:' : lang === 'zh' ? '快速筛选：' : 'Quick filters:'}
          </span>
          <button
            type="button"
            onClick={() => setCapabilityFilters(prev => ({ ...prev, sample: !prev.sample }))}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              minHeight: 32,
              borderRadius: 20,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: capabilityFilters.sample ? 'rgba(45,122,79,0.25)' : 'var(--border-subtle)',
              background: capabilityFilters.sample ? 'rgba(45,122,79,0.08)' : 'transparent',
              color: capabilityFilters.sample ? '#2d7a4f' : 'var(--text-secondary)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
            {isAr ? 'عينة متاحة' : lang === 'zh' ? '可提供样品' : 'Sample available'}
          </button>
          <button
            type="button"
            onClick={() => setCapabilityFilters(prev => ({ ...prev, customization: !prev.customization }))}
            style={{
              padding: '6px 12px',
              fontSize: 11,
              minHeight: 32,
              borderRadius: 20,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: capabilityFilters.customization ? 'rgba(0,0,0,0.15)' : 'var(--border-subtle)',
              background: capabilityFilters.customization ? '#1a1a1a' : 'transparent',
              color: capabilityFilters.customization ? '#ffffff' : 'var(--text-secondary)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
            {isAr ? 'تخصيص / علامة خاصة' : lang === 'zh' ? 'OEM / 定制' : 'OEM / customization'}
          </button>
          {(capabilityFilters.sample || capabilityFilters.customization) && (
            <button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }} onClick={() => setCapabilityFilters({ sample: false, customization: false })}>
              {isAr ? 'مسح التصفية' : lang === 'zh' ? '清空筛选' : 'Clear filters'}
            </button>
          )}
        </div>

        {!loading && (
          <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginBottom: 16, letterSpacing: 0.3 }}>
            {filtered.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
          </p>
        )}

        {loading && (
          <div className="product-grid">
            {[1,2,3,4,5,6,7,8].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: 'var(--text-disabled)', fontSize: 14, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'لا توجد منتجات مطابقة' : lang === 'zh' ? '暂无匹配产品' : 'No products found'}
            </p>
            {(search || activeCategory !== 'all' || capabilityFilters.sample || capabilityFilters.customization) && (
              <button onClick={() => { setSearch(''); setActiveCategory('all'); setCapabilityFilters({ sample: false, customization: false }); }} style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                padding: '8px 20px',
                fontSize: 12,
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                transition: 'all 0.15s',
                minHeight: 36,
              }}>
                {isAr ? 'إعادة ضبط الفلاتر' : lang === 'zh' ? '重置筛选' : 'Reset filters'}
              </button>
            )}
          </div>
        )}

        {!loading && (
          <div className="product-grid">
            {filtered.map((p, idx) => {
              const isReviewedSupplier = isSupplierPubliclyVisible(p.profiles?.status);

              return (
                <div
                  key={p.id}
                  className="product-card"
                  style={{ animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}
                  onClick={() => nav(`/products/${p.id}`)}
                >
                  <div className="product-card-img">
                    {getPrimaryProductImage(p) && (
                      <img src={getPrimaryProductImage(p)} alt="" />
                    )}
                  </div>

                  <div className="product-card-body">
                    {isReviewedSupplier && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#2d7a4f', flexShrink: 0, display: 'inline-block',
                        }} />
                        <span style={{ fontSize: 10, color: '#2d7a4f', fontFamily: 'var(--font-ar)' }}>
                          مورد موثّق
                        </span>
                      </div>
                    )}

                    <h3 className={`product-card-name${isAr ? ' ar' : ''}`}>
                      {getProductDisplayName(p, lang)}
                    </h3>

                    <ProductBuyerCardSummary
                      product={p}
                      displayCurrency={uiDisplayCurrency}
                      exchangeRates={exchangeRates}
                      lang={lang}
                    />

                    <button
                      className="product-card-buy"
                      onClick={e => { e.stopPropagation(); nav(`/products/${p.id}`); }}
                    >
                      اشتر الآن
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
