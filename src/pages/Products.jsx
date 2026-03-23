import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const CATEGORIES = {
  ar: ['الكل', 'إلكترونيات', 'أثاث', 'ملابس', 'مواد بناء', 'غذاء', 'أخرى'],
  en: ['All', 'Electronics', 'Furniture', 'Clothing', 'Building Materials', 'Food', 'Other'],
  zh: ['全部', '电子产品', '家具', '服装', '建材', '食品', '其他'],
};

const SkeletonItem = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0', borderBottom: '1px solid #E5E0D8' }}>
    <div style={{ width: 100, height: 100, borderRadius: 8, background: '#E5E0D8', flexShrink: 0, animation: 'pulse 1.5s ease infinite' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ width: '55%', height: 18, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ width: '25%', height: 16, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ width: '40%', height: 12, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
    </div>
    <div style={{ width: 80, height: 36, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
  </div>
);

export default function Products({ lang, user, profile }) {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const cats = CATEGORIES[lang] || CATEGORIES.ar;

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
    .sort((a, b) => {
      if (sortBy === 'price_asc') return (a.price_from || 0) - (b.price_from || 0);
      if (sortBy === 'price_desc') return (b.price_from || 0) - (a.price_from || 0);
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="full-page">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isAr ? 'المنتجات' : 'Products'}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isAr ? 'تصفح منتجات الموردين الصينيين' : 'Browse verified Chinese supplier products'}
          </p>
        </div>
      </div>

      <div className="list-wrap">

        {/* SEARCH + SORT */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              className="search-input"
              placeholder={isAr ? 'ابحث عن منتج...' : 'Search products...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '12px 16px', border: '1px solid #E5E0D8',
              background: 'rgba(247,245,242,0.8)', fontSize: 13,
              color: '#2C2C2C', outline: 'none', borderRadius: 3,
              cursor: 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            }}>
            <option value="newest">{isAr ? 'الأحدث' : 'Newest'}</option>
            <option value="price_asc">{isAr ? 'السعر: الأقل' : 'Price: Low'}</option>
            <option value="price_desc">{isAr ? 'السعر: الأعلى' : 'Price: High'}</option>
          </select>
        </div>

        {/* CATEGORIES */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
          {cats.map((c, i) => (
            <button key={i} onClick={() => setActiveCategory(i)} style={{
              padding: '7px 16px', fontSize: 12,
              background: activeCategory === i ? '#2C2C2C' : 'transparent',
              color: activeCategory === i ? '#F7F5F2' : '#7a7a7a',
              border: '1px solid',
              borderColor: activeCategory === i ? '#2C2C2C' : '#E5E0D8',
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* COUNT */}
        {!loading && (
          <p style={{ color: '#7a7a7a', fontSize: 13, marginBottom: 16 }}>
            {filtered.length} {isAr ? 'منتج' : 'products'}
          </p>
        )}

        {/* SKELETON */}
        {loading && (
          <div>
            {[1, 2, 3, 4].map(i => <SkeletonItem key={i} />)}
          </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#7a7a7a', fontSize: 14, marginBottom: 16 }}>
              {isAr ? 'لا توجد منتجات' : 'No products found'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} style={{
                background: 'none', border: '1px solid #E5E0D8',
                color: '#2C2C2C', padding: '8px 20px', fontSize: 12,
                cursor: 'pointer', borderRadius: 3,
              }}>
                {isAr ? 'مسح البحث' : 'Clear search'}
              </button>
            )}
          </div>
        )}

        {/* PRODUCTS LIST */}
        {!loading && filtered.map((p, idx) => (
          <div
            key={p.id}
            className="product-list-item"
            style={{ animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}
          >
            <div className="product-img">
              {p.image_url
                ? <img src={p.image_url} alt="" />
                : <span style={{ fontSize: 32 }}>📦</span>}
            </div>
            <div className="product-info">
              <h3 className={`product-name${isAr ? ' ar' : ''}`}>
                {isAr ? p.name_ar || p.name_en : lang === 'zh' ? p.name_zh || p.name_en : p.name_en || p.name_ar}
              </h3>
              <p className="product-price">
                {p.price_from ? `${p.price_from} SAR` : '—'}
              </p>
              <p className="product-meta">
                MOQ: {p.moq || '—'} · {p.profiles?.company_name || ''}
              </p>
            </div>
            <div className="product-btns">
              <button className="btn-dark-sm" onClick={() => nav(`/products/${p.id}`)}>
                {isAr ? 'التفاصيل' : 'Details'}
              </button>
              {!isSupplier && (
                <button
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: 12 }}
                  onClick={() => nav(`/products/${p.id}`)}>
                  {isAr ? 'اشترِ الآن' : 'Buy Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}
