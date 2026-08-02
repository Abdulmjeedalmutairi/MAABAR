import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import { displayCategoriesForLang } from '../lib/factoryCategories';

// Factories landing — the 10 display categories (config grouping over the real
// codes). Clicking one lists the factories in it.
export default function Factories({ lang = 'ar' }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  usePageTitle('suppliers', lang);
  const cats = displayCategoriesForLang(lang);
  const revealRef = useReveal([lang]);

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <h1 className={`fx-h1${arc}`}>{isAr ? 'المصانع' : lang === 'zh' ? '工厂' : 'Factories'}</h1>
        <p className={`fx-sub${arc}`}>
          {isAr ? 'تصفّح المصانع حسب الفئة واطلب عرض سعر مباشرة.'
            : lang === 'zh' ? '按类别浏览工厂并直接请求报价。'
              : 'Browse factories by category and request a quote directly.'}
        </p>

        <div className="fx-grid fx-grid-cat" ref={revealRef}>
          {cats.map((c, i) => (
            <button key={c.key} type="button" className="fx-card reveal" style={{ '--i': i }}
              onClick={() => nav(`/factories/${c.key}`)}>
              <div className="fx-media" style={{ aspectRatio: '3 / 2' }}>
                <img src={c.image} alt="" loading="lazy" />
              </div>
              <div className="fx-card-body">
                <h3 className={`fx-card-title${arc}`}>{c.label}</h3>
                <p className={`fx-card-desc${arc}`}>{c.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <Footer lang={lang} />
    </div>
  );
}
