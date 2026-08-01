import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import { sb } from '../supabase';
import { getFactoryDisplayCategory, codesForDisplayCategory } from '../lib/factoryCategories';

// Factories in a display category — reads factory_directory_public (email hidden)
// filtered by the real codes the display category maps to.
export default function FactoryCategory({ lang = 'ar' }) {
  const nav = useNavigate();
  const { key } = useParams();
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  usePageTitle('suppliers', lang);
  const cat = getFactoryDisplayCategory(key);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const revealRef = useReveal([lang, loading]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  async function load() {
    setLoading(true);
    const codes = codesForDisplayCategory(key);
    if (!codes.length) { setFactories([]); setLoading(false); return; }
    const { data } = await sb
      .from('factory_directory_public').select('*')
      .in('category', codes).order('sort_order', { ascending: true });
    setFactories(data || []);
    setLoading(false);
  }

  const label = cat ? (cat.label[lang] || cat.label.en) : '';
  const resolveName = (f) => (f.company_name_latin || '').trim() || f.company_name || '';

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <button className={`fx-back${arc}`} onClick={() => nav('/factories')}>
          {isAr ? '→ ' : '← '}{isAr ? 'المصانع' : lang === 'zh' ? '工厂' : 'Factories'}
        </button>
        <h1 className={`fx-h1${arc}`}>{label}</h1>

        {loading ? (
          <p className={`fx-sub${arc}`}>{isAr ? 'جارٍ التحميل...' : '…'}</p>
        ) : factories.length === 0 ? (
          <p className={`fx-sub${arc}`}>
            {isAr ? 'لا توجد مصانع في هذه الفئة بعد.' : lang === 'zh' ? '该类别暂无工厂。' : 'No factories in this category yet.'}
          </p>
        ) : (
          <div className="fx-grid fx-grid-fac" ref={revealRef}>
            {factories.map((f, i) => {
              const photo = (Array.isArray(f.factory_images) ? f.factory_images : []).find((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
              // profile_image is, in practice, a cover/product photo → fill the
              // tile (cover) rather than treating it as a padded logo.
              const img = photo || f.profile_image;
              const name = resolveName(f);
              return (
                <button key={f.id} type="button" className="fx-card reveal" style={{ '--i': i }}
                  onClick={() => nav(`/factory/${f.id}`)}>
                  <div className="fx-media" style={{ aspectRatio: '4 / 3' }}>
                    {img
                      ? <img src={img} alt="" loading="lazy" />
                      : <span className="fx-media-initial" style={{ fontSize: 44 }}>{(name || '?')[0]}</span>}
                  </div>
                  <div className="fx-card-body">
                    <h3 className={`fx-card-title${arc}`}>{name || '—'}</h3>
                    {(f.city || f.country) && (
                      <p className={`fx-card-meta${arc}`}>{[f.city, f.country].filter(Boolean).join(isAr ? '، ' : ', ')}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
