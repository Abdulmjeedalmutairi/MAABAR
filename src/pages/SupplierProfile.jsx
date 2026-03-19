import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

export default function SupplierProfile({ lang, user }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const isAr = lang === 'ar';

  useEffect(() => { loadSupplier(); }, [id]);

  const loadSupplier = async () => {
    const [{ data: s }, { data: p }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('products').select('*').eq('supplier_id', id).eq('is_active', true)
    ]);
    if (s) setSupplier(s);
    if (p) setProducts(p);
  };

  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆';
    return s;
  };

  if (!supplier) return <div className="loading">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>;

  return (
    <div className="profile-wrap">
      {/* HERO */}
      <div className="profile-hero">
        <div className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
          {supplier.avatar_url
            ? <img src={supplier.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : (supplier.company_name || '?')[0]}
        </div>
        <div>
          <h1 className={`profile-name${isAr ? ' ar' : ''}`}>{supplier.company_name}</h1>
          <p className="profile-meta">
            <span className="stars">{stars(Math.round(supplier.rating || 0))}</span>
            {supplier.city ? ` · ${supplier.city}` : ''}
            {supplier.country ? ` · ${supplier.country}` : ''}
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="profile-body">
        {(supplier.bio_ar || supplier.bio_en) && (
          <p style={{ fontSize: 15, lineHeight: 1.8, color: '#6b6b6b', marginBottom: 32 }}>
            {isAr ? supplier.bio_ar || supplier.bio_en : supplier.bio_en || supplier.bio_ar}
          </p>
        )}

        <button className="btn-dark-sm" style={{ marginBottom: 32 }}
          onClick={() => { if (!user) nav('/login'); else nav(`/chat/${supplier.id}`); }}>
          {isAr ? 'تواصل مع المورد' : 'Contact Supplier'}
        </button>

        <p className="section-label">{isAr ? 'منتجاته' : 'Products'}</p>

        {products.length === 0 ? (
          <p style={{ color: '#6b6b6b' }}>{isAr ? 'لا توجد منتجات بعد' : 'No products yet'}</p>
        ) : (
          products.map(p => (
            <div key={p.id} className="product-list-item" onClick={() => nav(`/products/${p.id}`)}>
              <div className="product-img">
                {p.image_url ? <img src={p.image_url} alt="" /> : <span style={{ fontSize: 32 }}>📦</span>}
              </div>
              <div className="product-info">
                <h3 className={`product-name${isAr ? ' ar' : ''}`}>{p.name_ar || p.name_en}</h3>
                <p className="product-price">{p.price_from ? `${p.price_from} SAR` : '—'}</p>
                <p className="product-meta">MOQ: {p.moq || '—'}</p>
              </div>
              <button className="btn-dark-sm">{isAr ? 'التفاصيل' : 'Details'}</button>
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