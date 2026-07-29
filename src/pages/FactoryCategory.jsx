import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';
import { getFactoryDisplayCategory, codesForDisplayCategory } from '../lib/factoryCategories';

// Factories in a display category — reads factory_directory_public (email hidden)
// filtered by the real codes the display category maps to.
export default function FactoryCategory({ lang = 'ar' }) {
  const nav = useNavigate();
  const { key } = useParams();
  const isAr = lang === 'ar';
  usePageTitle('suppliers', lang);
  const cat = getFactoryDisplayCategory(key);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [key]);
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
      <div className="page-header">
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', cursor: 'pointer', margin: '0 0 4px' }} onClick={() => nav('/factories')}>
            {isAr ? '← المصانع' : lang === 'zh' ? '← 工厂' : '← Factories'}
          </p>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>{label}</h1>
        </div>
      </div>
      <div className="list-wrap">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>…</p>
        ) : factories.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr ? 'لا توجد مصانع في هذه الفئة بعد.' : lang === 'zh' ? '该类别暂无工厂。' : 'No factories in this category yet.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {factories.map((f) => {
              const photo = (Array.isArray(f.factory_images) ? f.factory_images : []).find((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
              const name = resolveName(f);
              return (
                <div key={f.id} onClick={() => nav(`/factory/${f.id}`)}
                  style={{ cursor: 'pointer', background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ height: 130, background: '#EFE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photo
                      ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 40, color: '#8B7355', fontFamily: "'Cormorant Garamond', serif" }}>{(name || '?')[0]}</span>}
                  </div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 15, color: 'var(--text-primary)', margin: '0 0 4px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{name || '—'}</h3>
                    {(f.city || f.country) && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {[f.city, f.country].filter(Boolean).join(isAr ? '، ' : ', ')}
                      </p>
                    )}
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
