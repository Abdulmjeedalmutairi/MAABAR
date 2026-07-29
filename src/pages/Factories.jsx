import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { displayCategoriesForLang } from '../lib/factoryCategories';

// Factories landing — the 10 display categories (config grouping over the real
// codes). Clicking one lists the factories in it. Placeholder styling.
export default function Factories({ lang = 'ar' }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  usePageTitle('suppliers', lang);
  const cats = displayCategoriesForLang(lang);

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>{isAr ? 'المصانع' : lang === 'zh' ? '工厂' : 'Factories'}</h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isAr ? 'تصفّح المصانع حسب الفئة واطلب عرض سعر مباشرة.' : lang === 'zh' ? '按类别浏览工厂并直接请求报价。' : 'Browse factories by category and request a quote directly.'}
          </p>
        </div>
      </div>
      <div className="list-wrap">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {cats.map((c) => (
            <div key={c.key} onClick={() => nav(`/factories/${c.key}`)}
              style={{ cursor: 'pointer', background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ height: 120, background: '#EFE8DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.image
                  ? <img src={c.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 13, color: '#8B7355', padding: '0 12px', textAlign: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.label}</span>}
              </div>
              <div style={{ padding: 16 }}>
                <h3 style={{ fontSize: 15, color: 'var(--text-primary)', margin: '0 0 6px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.label}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer lang={lang} />
    </div>
  );
}
