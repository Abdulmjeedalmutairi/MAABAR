import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import { sb } from '../supabase';
import FactoryInquiryModal from '../components/factory/FactoryInquiryModal';
import { displayCategoryForCode } from '../lib/factoryCategories';

// Factory profile page — logo hero + info + full catalog. Two request paths:
// click a product (→ product detail) or the factory-level inquiry (inline modal).
export default function FactoryDetail({ lang = 'ar', user, displayCurrency }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  usePageTitle('suppliers', lang);
  const [factory, setFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(60);
  useEffect(() => { setVisible(60); }, [query]);  // reset the window when the search changes
  const revealRef = useReveal([lang, loading, visible, query]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  async function load() {
    setLoading(true);
    const [{ data: f }, prods] = await Promise.all([
      sb.from('factory_directory_public').select('*').eq('id', id).maybeSingle(),
      fetchAllFactoryProducts(id),
    ]);
    setFactory(f || null);
    setProducts(prods);
    setLoading(false);
  }

  // Page through the full catalog — a plain select caps at 1000 rows, which would
  // silently drop products for large factories (e.g. a 1156-product catalog).
  async function fetchAllFactoryProducts(factoryId) {
    const pageSize = 1000;
    const all = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb.from('factory_products').select('*').eq('factory_id', factoryId)
        .order('sort_order', { ascending: true }).range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
    }
    return all;
  }

  if (loading) return <div className="full-page"><div className="fx-wrap"><p style={{ color: 'var(--text-secondary)' }}>…</p></div></div>;
  if (!factory) return <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}><div className="fx-wrap"><p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'المصنع غير موجود' : lang === 'zh' ? '未找到工厂' : 'Factory not found'}</p></div></div>;

  const name = (factory.company_name_latin || '').trim() || factory.company_name || '';
  const desc = (isAr ? factory.description_ar : lang === 'zh' ? factory.description_zh : factory.description_en)
    || factory.description_en || factory.description_ar || factory.description_zh || '';
  const photos = (Array.isArray(factory.factory_images) ? factory.factory_images : []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
  const productName = (p) => (isAr ? p.name_ar : lang === 'zh' ? p.name_zh : p.name_en) || p.name_en || p.name_ar || p.name_zh || '';

  const backCat = displayCategoryForCode(factory.category);
  const backLabel = backCat ? (backCat.label[lang] || backCat.label.en) : (isAr ? 'المصانع' : lang === 'zh' ? '工厂' : 'Factories');
  const backTo = backCat ? `/factories/${backCat.key}` : '/factories';

  // Only products with a usable image are showcased in the grid (no-image
  // products are excluded, per the display decision).
  const catalog = products.filter((p) => p.image);
  const q = query.trim().toLowerCase();
  const matched = q
    ? catalog.filter((p) => [p.name_ar, p.name_en, p.name_zh, p.ref_code].filter(Boolean).join(' ').toLowerCase().includes(q))
    : catalog;
  const visibleProducts = matched.slice(0, visible);  // "Load more" windowing

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <button className={`fx-back${arc}`} onClick={() => nav(backTo)}>{isAr ? '→ ' : '← '}{backLabel}</button>

        {/* ── Hero: prominent logo + identity ── */}
        <div className="fx-hero">
          <div className="fx-hero-logo">
            {factory.profile_image
              ? <img src={factory.profile_image} alt={name} />
              : <span className="fx-media-initial">{(name || '?')[0]}</span>}
          </div>
          <div className="fx-hero-body">
            <h1 className={`fx-h1${arc}`} style={{ margin: 0 }}>{name}</h1>
            {(factory.city || factory.country) && (
              <p className={`fx-hero-loc${arc}`}>{[factory.city, factory.country].filter(Boolean).join(isAr ? '، ' : ', ')}</p>
            )}
            {desc && <p className={`fx-hero-desc${arc}`}>{desc}</p>}
            <button className={`fx-btn-ghost${arc}`} onClick={() => setInquiryOpen(true)}>
              {isAr ? 'استفسار / طلب مخصص من هذا المصنع' : lang === 'zh' ? '向该工厂咨询 / 定制需求' : 'Inquire / request something custom'}
            </button>
          </div>
        </div>

        {/* Secondary factory photos */}
        {photos.length > 0 && (
          <div className="fx-photos">
            {photos.slice(0, 8).map((u, i) => (
              <span key={i}><img src={u} alt="" loading="lazy" /></span>
            ))}
          </div>
        )}

        <hr className="fx-rule" />
        <h2 className={`fx-section-title${arc}`}>{isAr ? 'الكتالوج' : lang === 'zh' ? '产品目录' : 'Catalog'}</h2>

        {catalog.length === 0 ? (
          <p className={`fx-sub${arc}`} style={{ margin: 0 }}>
            {isAr ? 'لا يوجد كتالوج بعد.' : lang === 'zh' ? '暂无产品目录。' : 'No catalog yet.'}
          </p>
        ) : (
          <>
            <input
              className={`fx-search${arc}`}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن منتج...' : lang === 'zh' ? '搜索产品...' : 'Search products...'}
              dir={isAr ? 'rtl' : 'ltr'}
            />
            {matched.length === 0 ? (
              <p className={`fx-sub${arc}`} style={{ margin: 0 }}>
                {isAr ? 'لا توجد نتائج مطابقة.' : lang === 'zh' ? '无匹配产品。' : 'No matching products.'}
              </p>
            ) : (
              <>
                <div className="fx-grid fx-grid-prod" ref={revealRef}>
                  {visibleProducts.map((p, i) => (
                    <button key={p.id} type="button" className="fx-card reveal" style={{ '--i': Math.min(i, 14) }}
                      onClick={() => nav(`/factory/${factory.id}/product/${p.id}`)}>
                      <div className="fx-media" style={{ aspectRatio: '1 / 1' }}>
                        <img src={p.image} alt="" loading="lazy" />
                      </div>
                      <div className="fx-card-body">
                        <p className={`fx-card-title${arc}`}>{productName(p) || '—'}</p>
                        {p.ref_code && <p className={`fx-card-meta${arc}`}>{p.ref_code}</p>}
                      </div>
                    </button>
                  ))}
                </div>
                {matched.length > visible && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <button className={`fx-btn-ghost${arc}`} onClick={() => setVisible((v) => v + 60)}>
                      {isAr ? 'عرض المزيد' : lang === 'zh' ? '加载更多' : 'Load more'} ({matched.length - visible})
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {inquiryOpen && (
        <FactoryInquiryModal
          lang={lang}
          user={user}
          factory={factory}
          displayCurrency={displayCurrency}
          onClose={() => setInquiryOpen(false)}
        />
      )}

      <Footer lang={lang} />
    </div>
  );
}
