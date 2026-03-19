import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

export default function Products({ lang, user, profile }) {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await sb.from('products').select('*,profiles(company_name,rating,id)').eq('is_active', true).order('created_at', { ascending: false });
    if (data) setProducts(data);
  };

  const filtered = products.filter(p =>
    (p.name_ar || '').includes(search) || (p.name_en || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="full-page">
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>{isAr ? 'المنتجات' : 'Products'}</h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>{isAr ? 'تصفح منتجات الموردين الصينيين' : 'Browse verified Chinese supplier products'}</p>
        </div>
      </div>
      <div className="list-wrap">
        <div className="search-bar">
          <input className="search-input" placeholder={isAr ? 'ابحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {filtered.length === 0 ? (
          <p style={{ color: '#6b6b6b', textAlign: 'center', padding: 40 }}>{isAr ? 'لا توجد منتجات بعد' : 'No products yet'}</p>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="product-list-item">
              <div className="product-img">
                {p.image_url ? <img src={p.image_url} alt="" /> : <span style={{ fontSize: 32 }}>📦</span>}
              </div>
              <div className="product-info">
                <h3 className={`product-name${isAr ? ' ar' : ''}`}>{p.name_ar || p.name_en}</h3>
                <p className="product-price">{p.price_from ? `${p.price_from} SAR` : '—'}</p>
                <p className="product-meta">MOQ: {p.moq || '—'} · {p.profiles?.company_name || ''}</p>
              </div>
              <div className="product-btns">
                <button className="btn-dark-sm" onClick={() => nav(`/products/${p.id}`)}>
                  {isAr ? 'التفاصيل' : 'Details'}
                </button>
                {!isSupplier && (
                  <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 12 }} onClick={() => nav(`/products/${p.id}`)}>
                    {isAr ? 'اشترِ الآن' : 'Buy Now'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}