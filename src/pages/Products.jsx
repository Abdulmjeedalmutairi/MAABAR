import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import Footer from '../components/Footer';

const CATEGORIES = {
  ar: ['الكل', 'إلكترونيات', 'أثاث', 'ملابس', 'مواد بناء', 'غذاء', 'أخرى'],
  en: ['All', 'Electronics', 'Furniture', 'Clothing', 'Building Materials', 'Food', 'Other'],
  zh: ['全部', '电子产品', '家具', '服装', '建材', '食品', '其他'],
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

/* ─── Main ───────────────────────────────── */
export default function Products({ lang, user, profile }) {
  const nav = useNavigate();
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [sortBy, setSortBy]             = useState('newest');
  const [priceRange, setPriceRange]     = useState({ min: '', max: '' });
  const isAr       = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const cats       = CATEGORIES[lang] || CATEGORIES.ar;

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    const { data } = await sb
      .from('products')
      .select('*,profiles(company_name,rating,id)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const filtered = products
    .filter(p =>
      (p.name_ar || '').includes(search) ||
      (p.name_en || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter(p => !priceRange.min || (p.price_from >= parseFloat(priceRange.min)))
    .filter(p => !priceRange.max || (p.price_from <= parseFloat(priceRange.max)))
    .sort((a, b) => {
      if (sortBy === 'price_asc')  return (a.price_from || 0) - (b.price_from || 0);
      if (sortBy === 'price_desc') return (b.price_from || 0) - (a.price_from || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="full-page">

      {/* ── Header ─────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isAr ? 'المنتجات' : lang === 'zh' ? '产品' : 'Products'}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isAr ? 'تصفح منتجات الموردين الصينيين المعتمدين'
              : lang === 'zh' ? '浏览认证中国供应商产品'
              : 'Browse verified Chinese supplier products'}
          </p>
        </div>
      </div>

      <div className="list-wrap">

        {/* ── Search + Sort ───────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              className="search-input"
              placeholder={isAr ? 'ابحث عن منتج...' : lang === 'zh' ? '搜索产品...' : 'Search products...'}
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

        {/* ── Categories ─────────────────── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {cats.map((c, i) => (
            <button key={i} onClick={() => setActiveCategory(i)} style={{
              padding: '6px 14px',
              fontSize: 12,
              background: activeCategory === i ? 'var(--bg-raised)' : 'transparent',
              color: activeCategory === i ? 'var(--text-primary)' : 'var(--text-disabled)',
              border: '1px solid',
              borderColor: activeCategory === i ? 'var(--border-muted)' : 'var(--border-subtle)',
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              minHeight: 32,
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* ── Price Filter ───────────────── */}
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
          <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>SAR</span>
          {(priceRange.min || priceRange.max) && (
            <button
              className="btn-outline"
              style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }}
              onClick={() => setPriceRange({ min: '', max: '' })}>
              {isAr ? 'مسح' : lang === 'zh' ? '清除' : 'Clear'}
            </button>
          )}
        </div>

        {/* ── Count ──────────────────────── */}
        {!loading && (
          <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginBottom: 16, letterSpacing: 0.3 }}>
            {filtered.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
          </p>
        )}

        {/* ── Skeleton ───────────────────── */}
        {loading && [1, 2, 3, 4].map(i => <SkeletonItem key={i} />)}

        {/* ── Empty ──────────────────────── */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: 'var(--text-disabled)', fontSize: 14, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'لا توجد منتجات' : lang === 'zh' ? '暂无产品' : 'No products found'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} style={{
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
                {isAr ? 'مسح البحث' : lang === 'zh' ? '清除搜索' : 'Clear search'}
              </button>
            )}
          </div>
        )}

        {/* ── Products list ──────────────── */}
        {!loading && filtered.map((p, idx) => (
          <div
            key={p.id}
            className="product-list-item"
            style={{ animation: `fadeIn 0.3s ease ${idx * 0.04}s both` }}
            onClick={() => nav(`/products/${p.id}`)}
          >
            <div className="product-img">
              {p.image_url
                ? <img src={p.image_url} alt="" />
                : <span style={{ fontSize: 22, opacity: 0.25 }}>◻</span>}
            </div>

            <div className="product-info">
              <h3 className={`product-name${isAr ? ' ar' : ''}`}>
                {isAr
                  ? p.name_ar || p.name_en
                  : lang === 'zh'
                  ? p.name_zh || p.name_en
                  : p.name_en || p.name_ar}
              </h3>
              <p className="product-price">
                {p.price_from ? `${p.price_from} SAR` : '—'}
              </p>
              <p className="product-meta">
                MOQ: {p.moq || '—'} · {p.profiles?.company_name || ''}
              </p>
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
        ))}
      </div>

      <Footer lang={lang} />
    </div>
  );
}