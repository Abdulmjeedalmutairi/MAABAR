import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';

// Factory detail — real name + photos + info + full catalog. Request actions
// (product modal + factory-level "custom request" button) are wired in Phase 3
// Commit 6. Placeholder styling.
export default function FactoryDetail({ lang = 'ar' }) {
  const { id } = useParams();
  const isAr = lang === 'ar';
  usePageTitle('suppliers', lang);
  const [factory, setFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);
  async function load() {
    setLoading(true);
    const [{ data: f }, { data: p }] = await Promise.all([
      sb.from('factory_directory_public').select('*').eq('id', id).maybeSingle(),
      sb.from('factory_products').select('*').eq('factory_id', id).order('sort_order', { ascending: true }),
    ]);
    setFactory(f || null);
    setProducts(p || []);
    setLoading(false);
  }

  if (loading) return <div className="full-page"><div className="list-wrap"><p style={{ color: 'var(--text-secondary)' }}>…</p></div></div>;
  if (!factory) return <div className="full-page"><div className="list-wrap"><p style={{ color: 'var(--text-secondary)' }}>{isAr ? 'المصنع غير موجود' : lang === 'zh' ? '未找到工厂' : 'Factory not found'}</p></div></div>;

  const name = (factory.company_name_latin || '').trim() || factory.company_name || '';
  const desc = (isAr ? factory.description_ar : lang === 'zh' ? factory.description_zh : factory.description_en)
    || factory.description_en || factory.description_ar || factory.description_zh || '';
  const photos = (Array.isArray(factory.factory_images) ? factory.factory_images : []).filter((u) => typeof u === 'string' && /^https?:\/\//i.test(u));
  const productName = (p) => (isAr ? p.name_ar : lang === 'zh' ? p.name_zh : p.name_en) || p.name_en || p.name_ar || p.name_zh || '';

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

        {/* Factory-level "custom request" button + product-request modal land in Commit 6. */}

        <h2 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 14px', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'الكتالوج' : lang === 'zh' ? '产品目录' : 'Catalog'}
        </h2>
        {products.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr ? 'لا يوجد كتالوج بعد.' : lang === 'zh' ? '暂无产品目录。' : 'No catalog yet.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1 / 1', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.image
                    ? <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24, color: '#8B7355', fontFamily: "'Cormorant Garamond', serif" }}>{(productName(p) || '?')[0]}</span>}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ fontSize: 12.5, color: 'var(--text-primary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{productName(p) || '—'}</p>
                  {p.ref_code && <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: '2px 0 0' }}>{p.ref_code}</p>}
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
