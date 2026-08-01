import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';
import FactoryInquiryModal from '../components/factory/FactoryInquiryModal';

// Factory detail — real name + photos + info + full catalog. Request actions
// (product modal + factory-level "custom request" button) are wired in Phase 3
// Commit 6. Placeholder styling.
export default function FactoryDetail({ lang = 'ar', user, displayCurrency }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  usePageTitle('suppliers', lang);
  const [factory, setFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(60);
  useEffect(() => { setVisible(60); }, [query]);  // reset the window when the search changes

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

  if (loading) return <div className="full-page"><div className="list-wrap"><p style={{ color: 'var(--text-secondary)' }}>…</p></div></div>;
  if (!factory) return <div className="full-page"><div className="list-wrap"><p style={{ color: 'var(--text-secondary)' }}>{isAr ? 'المصنع غير موجود' : lang === 'zh' ? '未找到工厂' : 'Factory not found'}</p></div></div>;

  const name = (factory.company_name_latin || '').trim() || factory.company_name || '';
  const desc = (isAr ? factory.description_ar : lang === 'zh' ? factory.description_zh : factory.description_en)
    || factory.description_en || factory.description_ar || factory.description_zh || '';
  const photos = (Array.isArray(factory.factory_images) ? factory.factory_images : []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
  const productName = (p) => (isAr ? p.name_ar : lang === 'zh' ? p.name_zh : p.name_en) || p.name_en || p.name_ar || p.name_zh || '';

  // Only products with a usable image are showcased in the grid (no-image
  // products are excluded, per the display decision).
  const catalog = products.filter((p) => p.image);
  // Client-side search over the full (already-loaded) catalog by name / ref_code.
  const q = query.trim().toLowerCase();
  const matched = q
    ? catalog.filter((p) =>
        [p.name_ar, p.name_en, p.name_zh, p.ref_code].filter(Boolean).join(' ').toLowerCase().includes(q))
    : catalog;
  const visibleProducts = matched.slice(0, visible);  // "Load more" windowing

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="list-wrap" style={{ paddingTop: 24 }}>
        <h1 className={`page-title${isAr ? ' ar' : ''}`} style={{ marginBottom: 6 }}>{name}</h1>
        {(factory.city || factory.country) && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {[factory.city, factory.country].filter(Boolean).join(isAr ? '، ' : ', ')}
          </p>
        )}

        {photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 20 }}>
            {photos.slice(0, 6).map((u, i) => (
              <div key={i} style={{ aspectRatio: '4 / 3', borderRadius: 10, overflow: 'hidden', background: '#EFE8DC' }}>
                <img src={u} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}

        {desc && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{desc}</p>
        )}

        {/* Factory-level inquiry / custom request → inline modal (same pipeline as a
            product request, but not bound to a catalog product). */}
        <button className="btn-outline" onClick={() => setInquiryOpen(true)}
          style={{ marginBottom: 24, minHeight: 42, padding: '10px 20px', fontSize: 13 }}>
          {isAr ? 'استفسار / طلب مخصص من هذا المصنع' : lang === 'zh' ? '向该工厂咨询 / 定制需求' : 'Inquire / request something custom'}
        </button>

        <h2 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 14px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'الكتالوج' : lang === 'zh' ? '产品目录' : 'Catalog'}
        </h2>
        {catalog.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr ? 'لا يوجد كتالوج بعد.' : lang === 'zh' ? '暂无产品目录。' : 'No catalog yet.'}
          </p>
        ) : (
          <>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن منتج...' : lang === 'zh' ? '搜索产品...' : 'Search products...'}
              dir={isAr ? 'rtl' : 'ltr'}
              style={{
                width: '100%', maxWidth: 360, padding: '9px 12px', marginBottom: 14,
                border: '1px solid var(--border-muted)', borderRadius: 8, fontSize: 13,
                color: 'var(--text-primary)', background: 'var(--bg-raised, #fff)',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            {matched.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? 'لا توجد نتائج مطابقة.' : lang === 'zh' ? '无匹配产品。' : 'No matching products.'}
              </p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {visibleProducts.map((p) => (
                    <div key={p.id} onClick={() => nav(`/factory/${factory.id}/product/${p.id}`)}
                      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ aspectRatio: '1 / 1', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <p style={{ fontSize: 12.5, color: 'var(--text-primary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{productName(p) || '—'}</p>
                        {p.ref_code && <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: '2px 0 0' }}>{p.ref_code}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {matched.length > visible && (
                  <div style={{ textAlign: 'center', marginTop: 22 }}>
                    <button className="btn-outline" onClick={() => setVisible((v) => v + 60)}
                      style={{ minHeight: 42, padding: '10px 24px', fontSize: 13 }}>
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
