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
  <div style={{ background: 'var(--bg-raised)', padding: 24, borderRadius: 4, border: '1px solid var(--border-default)' }}>
    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-hover)', flexShrink: 0, animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ flex: 1 }}>
        <div style={{ width: '60%', height: 16, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 8, animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ width: '40%', height: 12, background: 'var(--bg-hover)', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
      </div>
    </div>
    <div style={{ width: '80%', height: 12, background: 'var(--bg-hover)', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
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
              background: activeCat === c.val ? 'var(--bg-raised)' : 'var(--bg-base)',
              color: activeCat === c.val ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: '1px solid', borderColor: activeCat === c.val ? 'var(--border-strong)' : 'var(--border-default)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            }}>
              {c.label}
            </button>
          ))}
        </div>

        {/* COUNT */}
        {!loading && (
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>
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
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
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
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  borderRadius: 4, padding: 24, cursor: 'pointer',
                  transition: 'all 0.2s', animation: `fadeIn 0.4s ease ${idx * 0.05}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>

                {/* HEADER */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-secondary)' }}>{(s.company_name || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.company_name || '—'}
                      </p>
                      {s.status === 'approved' && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 16, height: 16, borderRadius: '50%',
                          background: 'rgba(139,120,255,0.15)',
                          border: '1px solid rgba(139,120,255,0.3)',
                          color: 'rgba(139,120,255,0.85)',
                          fontSize: 10, fontWeight: 700, flexShrink: 0,
                        }}>✓</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ color: '#f5a623', fontSize: 13 }}>{stars(s.rating)}</span>
                      {s.reviews_count > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>({s.reviews_count})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BIO */}
                {(s.bio_ar || s.bio_en || s.bio_zh) && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
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
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {s.speciality && s.speciality !== 'other' && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: 'var(--bg-hover)', borderRadius: 20, color: 'var(--text-secondary)', letterSpacing: 1 }}>
                      {cats.find(c => c.val === s.speciality)?.label || s.speciality}
                    </span>
                  )}
                  {s.city && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: 'var(--bg-hover)', borderRadius: 20, color: 'var(--text-secondary)', letterSpacing: 1 }}>
                      {s.city}
                    </span>
                  )}
                  {s.products?.length > 0 && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: 'var(--bg-hover)', borderRadius: 20, color: 'var(--text-secondary)', letterSpacing: 1 }}>
                      {s.products.length} {isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products'}
                    </span>
                  )}
                  {s.sample_available && (
                    <span style={{ fontSize: 10, padding: '3px 10px', background: 'rgba(139,120,255,0.08)', border: '1px solid rgba(139,120,255,0.2)', borderRadius: 20, color: 'rgba(139,120,255,0.85)', letterSpacing: 1 }}>
                      {isAr ? 'عينة متاحة' : lang === 'zh' ? '可提供样品' : 'Sample Available'}
                    </span>
                  )}
                </div>

                {/* TRUST SCORE */}
                {s.trust_score > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1 }}>
                        {isAr ? 'مستوى الثقة' : 'Trust Score'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{s.trust_score}%</span>
                    </div>
                    <div style={{ height: 2, background: 'var(--border-subtle)', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ width: `${s.trust_score}%`, height: '100%', background: 'rgba(139,120,255,0.5)', borderRadius: 1 }} />
                    </div>
                  </div>
                )}

                {/* FOOTER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-default)', paddingTop: 12, gap: 8 }}>
                  {s.min_order_value ? (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
                      {isAr ? `أقل طلب: ${s.min_order_value} ريال` : `Min: ${s.min_order_value} SAR`}
                    </p>
                  ) : <span />}
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => { e.stopPropagation(); nav(`/chat/${s.id}`); }}
                      style={{
                        padding: '6px 12px', fontSize: 11, cursor: 'pointer',
                        background: 'rgba(139,120,255,0.08)', border: '1px solid rgba(139,120,255,0.2)',
                        color: 'rgba(139,120,255,0.85)', borderRadius: 'var(--radius-md)',
                        transition: 'all 0.15s', letterSpacing: 0.5,
                        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,120,255,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,120,255,0.08)'; }}>
                      {isAr ? 'تواصل' : lang === 'zh' ? '联系' : 'Chat'}
                    </button>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', letterSpacing: 1, lineHeight: '28px' }}>
                      {isAr ? 'الملف →' : lang === 'zh' ? '查看 →' : 'View →'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
