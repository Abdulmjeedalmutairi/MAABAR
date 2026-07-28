import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import { isSupplierDocsComplete } from '../lib/supplierOnboarding';
import { resolveCompanyName, ensureCompanyRomanization } from '../lib/companyRomanize';
import { getSpecialtyLabel, UI_CATEGORIES as CATEGORIES } from '../lib/supplierDashboardConstants';

const SkeletonCard = () => (
  <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 'var(--radius-card)', border: '1px solid var(--border)' }}>
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
  usePageTitle('suppliers', lang);
  const cats = CATEGORIES[lang] || CATEGORIES.ar;

  useEffect(() => { loadSuppliers(); }, [activeCat]);

  const loadSuppliers = async () => {
    setLoading(true);
    let query = sb.from('supplier_public_profiles')
      .select('*')
      .order('rating', { ascending: false });

    if (activeCat !== 'all') query = query.eq('speciality', activeCat);

    const { data } = await query;
    if (data) {
      setSuppliers(data);
      // Self-heal: romanize any Chinese company names not yet cached. Each call
      // persists server-side and patches just its row as the Latin name resolves.
      data.forEach((s) => {
        ensureCompanyRomanization(s).then((latin) => {
          if (latin) setSuppliers((prev) => prev.map((x) => (x.id === s.id ? { ...x, company_name_latin: latin } : x)));
        });
      });
    }
    setLoading(false);
  };

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return [
      s.company_name,
      s.company_name_latin,
      s.bio_ar,
      s.bio_en,
      s.speciality,
      s.city,
      s.country,
      s.maabar_supplier_id,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

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
            {isAr ? 'موردون صينيون مراجعون من مَعبر مع إشارات ثقة أوضح قبل بدء التفاوض' : lang === 'zh' ? '展示经过 Maabar 审核、信任信号更清晰的中国供应商' : 'Browse China-based suppliers reviewed by Maabar with clearer trust signals before negotiation'}
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
            {filtered.map((s, idx) => {
              const isReviewedSupplier = isSupplierDocsComplete(s.status);
              const factoryPhoto = (Array.isArray(s.factory_images) ? s.factory_images : [])
                .find((img) => typeof img === 'string' && /^https?:\/\//i.test(img) && !img.includes('/supplier-docs/')) || '';
              const displayName = resolveCompanyName(s);
              const initial = ((displayName || '?').trim()[0] || '?').toUpperCase();
              const cardDesc = (isAr ? s.bio_ar : lang === 'zh' ? s.bio_zh : s.bio_en) || s.company_description || s.bio_en || s.bio_ar || s.bio_zh || '';
              const cardLocation = [s.city, s.country].filter(Boolean).join(isAr ? '، ' : ', ');
              const exportMarketsText = (Array.isArray(s.export_markets) ? s.export_markets.filter(Boolean) : (s.export_markets ? [s.export_markets] : [])).slice(0, 2).join(' · ');
              const cardTags = [
                s.speciality && s.speciality !== 'other' ? getSpecialtyLabel(s.speciality, lang) : null,
                s.business_type || null,
                s.customization_support || null,
                s.years_experience ? (isAr ? `${s.years_experience}+ سنة خبرة` : lang === 'zh' ? `${s.years_experience}+ 年经验` : `${s.years_experience}+ yrs`) : null,
                exportMarketsText || null,
                (Array.isArray(s.certifications) && s.certifications.length) ? (isAr ? `${s.certifications.length} شهادة` : lang === 'zh' ? `${s.certifications.length} 项认证` : `${s.certifications.length} certs`) : null,
              ].filter(Boolean).slice(0, 5);

              return (
              <div key={s.id}
                onClick={() => nav(`/supplier/${s.id}`)}
                style={{
                  background: '#FAF8F5',
                  border: isReviewedSupplier ? '1px solid #C2A468' : '1px solid #E6DFD3',
                  borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  animation: `fadeIn 0.4s ease ${idx * 0.05}s both`,
                  boxShadow: isReviewedSupplier ? '0 1px 3px rgba(160,124,58,0.10), 0 8px 22px rgba(160,124,58,0.07)' : '0 1px 2px rgba(0,0,0,0.03)',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>

                {/* MEDIA */}
                <div style={{ position: 'relative', height: 140, background: '#EFE8DC' }}>
                  {factoryPhoto
                    ? <img src={factoryPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5' }}>
                        <span style={{ fontSize: 60, fontWeight: 300, color: '#8B7355', fontFamily: "'Cormorant Garamond', serif" }}>{initial}</span>
                      </div>}
                  <div style={{ position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)', width: 52, height: 52, borderRadius: 12, background: '#FFFFFF', border: '1px solid #E6DFD3', boxShadow: '0 2px 6px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 20, fontWeight: 600, color: '#8B7355', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{initial}</span>}
                  </div>
                </div>

                {/* BODY */}
                <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#2A2420', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {displayName || '—'}
                  </p>
                  {cardLocation && (
                    <p style={{ fontSize: 12, color: '#8A8178', margin: '0 0 12px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{cardLocation}</p>
                  )}

                  {/* BADGES — Field Verified is unconditional; Recommended is gated */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: cardDesc || cardTags.length ? 12 : 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(110,130,102,0.12)', border: '1px solid rgba(110,130,102,0.30)', color: '#5E7256', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'تم التحقق ميدانيًا' : lang === 'zh' ? '实地核验' : 'Field Verified'}
                    </span>
                    {isReviewedSupplier && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: 'rgba(160,124,58,0.12)', border: '1px solid rgba(160,124,58,0.32)', color: '#9A7636', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? 'موصى به' : lang === 'zh' ? '推荐' : 'Recommended'}
                      </span>
                    )}
                  </div>

                  {/* DESCRIPTION */}
                  {cardDesc && (
                    <p style={{ fontSize: 12.5, color: '#6B6560', lineHeight: 1.6, margin: '0 0 14px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {cardDesc}
                    </p>
                  )}

                  {/* TAGS */}
                  {cardTags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                      {cardTags.map((tag, i) => (
                        <span key={i} style={{ fontSize: 10, padding: '3px 9px', borderRadius: 6, background: '#F0E9DD', color: '#7A6E5C', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* CTA */}
                  <button onClick={e => { e.stopPropagation(); nav(`/supplier/${s.id}`); }} style={{ width: '100%', padding: '10px', fontSize: 12.5, fontWeight: 600, color: '#FFFFFF', background: '#8B7355', border: 'none', borderRadius: 10, cursor: 'pointer', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'عرض ملف المورد' : lang === 'zh' ? '查看供应商主页' : 'View supplier profile'}
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
