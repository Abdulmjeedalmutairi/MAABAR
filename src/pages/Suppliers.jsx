import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

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

const SkeletonCard = () => (
  <div style={{ background: '#F7F5F2', padding: 24, borderRadius: 4, border: '1px solid #E5E0D8' }}>
    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#E5E0D8', flexShrink: 0, animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 16, background: '#E5E0D8', borderRadius: 3, marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '40%', height: 12, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
      </div>
    </div>
    <div style={{ width: '80%', height: 12, background: '#E5E0D8', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
  </div>
);

export default function Suppliers({ lang, user }) {
  const nav = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const isAr = lang === 'ar';
  const cats = CATEGORIES[lang] || CATEGORIES.ar;

  useEffect(() => { loadSuppliers(); }, [activeCat]);

  const loadSuppliers = async () => {
    setLoading(true);
    let query = sb.from('profiles')
      .select('*, products(id)')
      .eq('role', 'supplier')
      .eq('status', 'active')
      .order('rating', { ascending: false });

    if (activeCat !== 'all') query = query.eq('speciality', activeCat);

    const { data } = await query;
    if (data) setSuppliers(data);
    setLoading(false);
  };

  const filtered = suppliers.filter(s =>
    (s.company_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.bio_ar || '').includes(search) ||
    (s.bio_en || '').toLowerCase().includes(search.toLowerCase())
  );

  const stars = (r) => {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= Math.round(r || 0) ? '★' : '☆';
    return s;
  };

  return (
    <div className="full-page">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isAr ? 'الموردون' : lang === 'zh' ? '供应商' : 'Suppliers'}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isAr ? 'موردون صينيون معتمدون جاهزون للتعامل' : lang === 'zh' ? '经过认证的中国供应商' : 'Verified Chinese suppliers ready to work with you'}
          </p>
        </div>
      </div>

      <div className="list-wrap">

        {/* SEARCH */}
        <div style={{ marginBottom: 20 }}>
          <input className="search-input"
            placeholder={isAr ? 'ابحث عن مورد...' : lang === 'zh' ? '搜索供应商...' : 'Search suppliers...'}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* CATEGORY FILTER */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c.val} onClick={() => setActiveCat(c.val)} style={{
              padding: '7px 16px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.2s',
              background: activeCat === c.val ? '#2C2C2C' : 'transparent',
              color: activeCat === c.val ? '#F7F5F2' : '#7a7a7a',
              border: '1px solid', borderColor: activeCat === c.val ? '#2C2C2C' : '#E5E0D8',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* COUNT */}
        {!loading && (
          <p style={{ color: '#7a7a7a', fontSize: 13, marginBottom: 24 }}>
            {filtered.length} {isAr ? 'مورد' : lang === 'zh' ? '供应商' : 'suppliers'}
          </p>
        )}

        {/* SKELETON */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* EMPTY */}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ color: '#7a7a7a', fontSize: 14 }}>
              {isAr ? 'لا يوجد موردون بعد' : 'No suppliers yet'}
            </p>
          </div>
        )}

        {/* SUPPLIERS GRID */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map((s, idx) => (
              <div key={s.id}
                onClick={() => nav(`/supplier/${s.id}`)}
                style={{
                  background: '#F7F5F2', border: '1px solid #E5E0D8',
                  borderRadius: 4, padding: 24, cursor: 'pointer',
                  transition: 'all 0.2s', animation: `fadeIn 0.4s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2C2C2C'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D8'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>

                {/* HEADER */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EFECE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 20, fontWeight: 500, color: '#7a7a7a' }}>{(s.company_name || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#2C2C2C', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.company_name || '—'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#f5a623', fontSize: 13 }}>{stars(s.rating)}</span>
                      {s.reviews_count > 0 && (
                        <span style={{ fontSize: 11, color: '#7a7a7a' }}>({s.reviews_count})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BIO */}
                {(s.bio_ar || s.bio_en || s.bio_zh) && (
                  <p style={{ fontSize: 12, color: '#7a7a7a', lineHeight: 1.6, marginBottom: 16, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr ? s.bio_ar || s.bio_en : lang === 'zh' ? s.bio_zh || s.bio_en : s.bio_en || s.bio_ar}
                  </p>
                )}

                {/* FACTORY IMAGES */}
                {s.factory_images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {s.factory_images.slice(0, 3).map((img, i) => (
                      <div key={i} style={{ width: 56, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* TAGS */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {s.speciality && s.speciality !== 'other' && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: '#EFECE7', borderRadius: 20, color: '#7a7a7a', letterSpacing: 1 }}>
                      {cats.find(c => c.val === s.speciality)?.label || s.speciality}
                    </span>
                  )}
                  {s.city && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: '#EFECE7', borderRadius: 20, color: '#7a7a7a', letterSpacing: 1 }}>
                      📍 {s.city}
                    </span>
                  )}
                  {s.products?.length > 0 && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: '#EFECE7', borderRadius: 20, color: '#7a7a7a', letterSpacing: 1 }}>
                      {s.products.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
                    </span>
                  )}
                  {s.trade_link && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', borderRadius: 20, color: '#2d7a4f', letterSpacing: 1 }}>
                      ✓ {isAr ? 'موثق' : lang === 'zh' ? '已认证' : 'Verified'}
                    </span>
                  )}
                </div>

                {/* FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E0D8', paddingTop: 14 }}>
                  {s.min_order_value ? (
                    <p style={{ fontSize: 11, color: '#7a7a7a', letterSpacing: 0.5 }}>
                      {isAr ? `أقل طلب: ${s.min_order_value} ريال` : `Min order: ${s.min_order_value} SAR`}
                    </p>
                  ) : <span />}
                  <span style={{ fontSize: 12, color: '#2C2C2C', letterSpacing: 1 }}>
                    {isAr ? 'عرض الملف →' : lang === 'zh' ? '查看 →' : 'View →'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}
