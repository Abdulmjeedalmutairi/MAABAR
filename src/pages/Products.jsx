import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import Footer from '../components/Footer';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { getPrimaryProductImage } from '../lib/productMedia';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';

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

const TRUST_BADGE_STYLE = {
  fontSize: 10,
  padding: '3px 9px',
  borderRadius: 20,
  letterSpacing: 0.4,
  display: 'inline-flex',
  alignItems: 'center',
};

/* ─── Skeleton ───────────────────────────── */
const SkeletonItem = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 16,
    padding: '16px 0', borderBottom: '1px solid var(--border-subtle)',
  }}>
    <div style={{ width: 68, height: 68, borderRadius: 'var(--radius-lg)', background: 'var(--bg-raised)', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '50%', height: 14, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      <div style={{ width: '25%', height: 12, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      <div style={{ width: '35%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
    </div>
    <div style={{ width: 72, height: 34, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
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

function getProductSecondaryName(product, lang) {
  if (lang === 'zh') return product.name_en || product.name_ar || '';
  if (lang === 'ar') return product.name_zh || product.name_en || '';
  return product.name_zh || product.name_ar || '';
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
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const cats = CATEGORIES[lang] || CATEGORIES.ar;

  usePageTitle('products', lang);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await sb
      .from('products')
      .select('*,profiles(company_name,rating,id,status,trade_link,wechat,factory_images,years_experience,trust_score,country,city,maabar_supplier_id)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setProducts(data.filter((product) => isSupplierPubliclyVisible(product.profiles?.status)));
    }

    setLoading(false);
  };

  const filtered = products
    .filter(p => buildSearchableText(p).includes(search.trim().toLowerCase()))
    .filter(p => activeCategory === 'all' || p.category === activeCategory)
    .filter(p => {
      const converted = buildDisplayPrice({
        amount: p.price_from,
        sourceCurrency: p.currency || 'USD',
        displayCurrency: displayCurrency || p.currency || 'USD',
        rates: exchangeRates,
        lang,
      }).displayAmount;
      return !priceRange.min || converted >= parseFloat(priceRange.min);
    })
    .filter(p => {
      const converted = buildDisplayPrice({
        amount: p.price_from,
        sourceCurrency: p.currency || 'USD',
        displayCurrency: displayCurrency || p.currency || 'USD',
        rates: exchangeRates,
        lang,
      }).displayAmount;
      return !priceRange.max || converted <= parseFloat(priceRange.max);
    })
    .sort((a, b) => {
      const aPrice = buildDisplayPrice({ amount: a.price_from, sourceCurrency: a.currency || 'USD', displayCurrency: displayCurrency || a.currency || 'USD', rates: exchangeRates, lang }).displayAmount;
      const bPrice = buildDisplayPrice({ amount: b.price_from, sourceCurrency: b.currency || 'USD', displayCurrency: displayCurrency || b.currency || 'USD', rates: exchangeRates, lang }).displayAmount;
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
              ? 'تصفح منتجات الموردين الصينيين المعتمدين مع تفاصيل أوضح للثقة وMOQ والعينات والتجهيز.'
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
              ? 'أسماء صينية عند توفرها، وMOQ، والعينات، ووقت التجهيز، وإشارات ثقة المورد معروضة بشكل أوضح قبل التواصل.'
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
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
          <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{displayCurrency || 'USD'}</span>
          {(priceRange.min || priceRange.max) && (
            <button
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }}
              onClick={() => setPriceRange({ min: '', max: '' })}>
              {isAr ? 'مسح' : lang === 'zh' ? '清除' : 'Clear'}
            </button>
          )}
        </div>

        {!loading && (
          <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginBottom: 16, letterSpacing: 0.3 }}>
            {filtered.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
          </p>
        )}

        {loading && [1, 2, 3, 4].map(i => <SkeletonItem key={i} />)}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: 'var(--text-disabled)', fontSize: 14, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'لا توجد منتجات مطابقة' : lang === 'zh' ? '暂无匹配产品' : 'No products found'}
            </p>
            {(search || activeCategory !== 'all') && (
              <button onClick={() => { setSearch(''); setActiveCategory('all'); }} style={{
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

        {!loading && filtered.map((p, idx) => {
          const supplierTrustSignals = buildSupplierTrustSignals(p.profiles || {});
          const isReviewedSupplier = isSupplierPubliclyVisible(p.profiles?.status);
          const supplierMaabarId = getSupplierMaabarId(p.profiles || {});
          const secondaryName = getProductSecondaryName(p, lang);

          return (
            <div
              key={p.id}
              className="product-list-item"
              style={{ animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}
              onClick={() => nav(`/products/${p.id}`)}
            >
              <div className="product-img">
                {getPrimaryProductImage(p)
                  ? <img src={getPrimaryProductImage(p)} alt="" />
                  : <span style={{ fontSize: 22, opacity: 0.25 }}>◻</span>}
              </div>

              <div className="product-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                  <h3 className={`product-name${isAr ? ' ar' : ''}`}>
                    {getProductDisplayName(p, lang)}
                  </h3>
                  {isReviewedSupplier && (
                    <span style={{
                      ...TRUST_BADGE_STYLE,
                      background: 'rgba(58,122,82,0.1)',
                      border: '1px solid rgba(58,122,82,0.2)',
                      color: '#5a9a72',
                    }}>
                      ✓ {isAr ? 'مورد موثّق' : lang === 'zh' ? '认证供应商' : 'Verified supplier'}
                    </span>
                  )}
                </div>

                {secondaryName && secondaryName !== getProductDisplayName(p, lang) && (
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 6, fontFamily: lang === 'zh' ? 'inherit' : 'var(--font-sans)' }}>
                    {lang === 'zh'
                      ? `英文 / 其他名称：${secondaryName}`
                      : isAr
                        ? `اسم المصنع / الاسم البديل: ${secondaryName}`
                        : `Factory / alternate name: ${secondaryName}`}
                  </p>
                )}

                {(() => {
                  const price = buildDisplayPrice({ amount: p.price_from, sourceCurrency: p.currency || 'USD', displayCurrency: displayCurrency || p.currency || 'USD', rates: exchangeRates, lang });
                  return (
                    <>
                      <p className="product-price">{p.price_from ? price.formattedDisplay : '—'}</p>
                      {price.isConverted && (
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>
                          {isAr ? `الأصل: ${price.formattedSource}` : lang === 'zh' ? `原始价格：${price.formattedSource}` : `Source: ${price.formattedSource}`}
                        </p>
                      )}
                    </>
                  );
                })()}

                <p className="product-meta">
                  MOQ: {p.moq || '—'} · {p.profiles?.company_name || '—'}
                  {(p.profiles?.city || p.profiles?.country) && ` · ${[p.profiles?.city, p.profiles?.country].filter(Boolean).join(', ')}`}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {p.sample_available && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f' }}>
                      {isAr ? 'عينة متاحة' : lang === 'zh' ? '可提供样品' : 'Sample available'}
                    </span>
                  )}
                  {p.spec_lead_time_days && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(139,120,255,0.08)', border: '1px solid rgba(139,120,255,0.2)', color: 'rgba(139,120,255,0.9)' }}>
                      {isAr ? `تجهيز ${p.spec_lead_time_days} يوم` : lang === 'zh' ? `交期 ${p.spec_lead_time_days} 天` : `Lead time ${p.spec_lead_time_days}d`}
                    </span>
                  )}
                  {p.spec_customization && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {isAr ? 'OEM / تخصيص' : lang === 'zh' ? '支持 OEM / 定制' : 'OEM / customization'}
                    </span>
                  )}
                  {supplierMaabarId && isReviewedSupplier && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(139,120,255,0.08)', border: '1px solid rgba(139,120,255,0.2)', color: 'rgba(139,120,255,0.9)' }}>
                      {isAr ? `معرّف المورد ${supplierMaabarId}` : lang === 'zh' ? `供应商编号 ${supplierMaabarId}` : `Supplier ID ${supplierMaabarId}`}
                    </span>
                  )}
                  {supplierTrustSignals.includes('trade_profile_available') && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                      {isAr ? 'رابط شركة' : lang === 'zh' ? '店铺/官网链接' : 'Trade link'}
                    </span>
                  )}
                  {supplierTrustSignals.includes('wechat_available') && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(139,120,255,0.08)', border: '1px solid rgba(139,120,255,0.2)', color: 'rgba(139,120,255,0.85)' }}>
                      WeChat
                    </span>
                  )}
                  {supplierTrustSignals.includes('factory_media_available') && (
                    <span style={{ ...TRUST_BADGE_STYLE, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {isAr ? 'صور مصنع' : lang === 'zh' ? '工厂图片' : 'Factory photos'}
                    </span>
                  )}
                </div>
              </div>

              <div className="product-btns" onClick={e => e.stopPropagation()}>
                <button
                  className="btn-dark-sm"
                  onClick={() => nav(`/products/${p.id}`)}>
                  {isAr ? 'التفاصيل' : lang === 'zh' ? '详情' : 'Details'}
                </button>
                {!isSupplier && (
                  <button
                    className="btn-outline"
                    onClick={() => nav(`/products/${p.id}`)}>
                    {isAr ? 'اشترِ الآن' : lang === 'zh' ? '立即购买' : 'Buy Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
