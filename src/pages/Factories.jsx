import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import CertPills from '../components/CertPills';
import { sb } from '../supabase';
import {
  displayCategoriesForLang, getFactoryDisplayCategory, codesForDisplayCategory,
  factoryTaglineForCode,
} from '../lib/factoryCategories';
import { UI_CATEGORIES } from '../lib/supplierDashboardConstants';

const PAGE = 9;   // "load more" batch

const T = {
  ar: { title: 'المصانع', sub: 'تواصل مباشرة مع المصانع في الصين واستورد بأفضل الأسعار.',
        cats: 'كتالوجات', prods: 'منتج', moq: 'الحد الأدنى', oem: 'OEM/ODM', oemYes: 'متوفر',
        rec: 'موصى به', ver: 'موثّق', exports: 'يصدّر إلى', since: 'منذ',
        view: 'عرض المصنع', quote: 'اطلب عرض سعر', more: 'تحميل المزيد',
        empty: 'لا توجد مصانع في هذه الفئة بعد.', loading: 'جارٍ التحميل…' },
  en: { title: 'Factories', sub: 'Deal directly with factories in China and import at the best prices.',
        cats: 'catalogs', prods: 'products', moq: 'MOQ', oem: 'OEM/ODM', oemYes: 'available',
        rec: 'Recommended', ver: 'Verified', exports: 'Exports to', since: 'Est.',
        view: 'View factory', quote: 'Request a quote', more: 'Load more',
        empty: 'No factories in this category yet.', loading: 'Loading…' },
  zh: { title: '工厂', sub: '直接对接中国工厂，以最优价格进口。',
        cats: '目录', prods: '产品', moq: '起订量', oem: 'OEM/ODM', oemYes: '可提供',
        rec: '推荐', ver: '已核实', exports: '出口至', since: '成立',
        view: '查看工厂', quote: '请求报价', more: '加载更多',
        empty: '该类别暂无工厂。', loading: '加载中…' },
};

const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);

export default function Factories({ lang = 'ar' }) {
  const nav = useNavigate();
  const { key } = useParams();
  const activeKey = key || 'all';
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  const c = T[lang] || T.ar;
  usePageTitle('suppliers', lang);

  const chips = useMemo(() => displayCategoriesForLang(lang), [lang]);
  const catLabel = useMemo(() => {
    const m = {};
    (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).forEach((cat) => { m[cat.val] = cat.label; });
    return m;
  }, [lang]);
  const [factories, setFactories] = useState([]);
  const [byFactory, setByFactory] = useState({});   // { id: { images, products, catalogs } }
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ data: facs }, { data: prods }] = await Promise.all([
        sb.from('factory_directory_public').select('*').order('sort_order', { ascending: true }),
        sb.from('factory_products').select('factory_id, image, import_id'),
      ]);
      if (!alive) return;
      const agg = {};
      (prods || []).forEach((p) => {
        const a = agg[p.factory_id] || (agg[p.factory_id] = { images: [], imports: new Set(), products: 0 });
        a.products += 1;
        if (p.import_id) a.imports.add(p.import_id);
        if (isUrl(p.image) && a.images.length < 5) a.images.push(p.image);
      });
      const map = {};
      Object.keys(agg).forEach((k) => { map[k] = { images: agg[k].images, products: agg[k].products, catalogs: agg[k].imports.size }; });
      setByFactory(map);
      setFactories(facs || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { setVisible(PAGE); }, [activeKey]);

  const activeCat = getFactoryDisplayCategory(activeKey);
  const filtered = useMemo(() => {
    if (!activeCat || activeCat.all) return factories;
    const codes = codesForDisplayCategory(activeKey);
    return factories.filter((f) => codes.includes(f.category));
  }, [factories, activeCat, activeKey]);

  const shown = filtered.slice(0, visible);
  const nf = (v) => (v && v !== 'not_found' ? v : '');
  const resolveName = (f) => nf(f.company_name_latin).trim() || f.company_name || '';
  const flagFor = (country) => (/(china|中国)/i.test(country || '') ? '🇨🇳' : '');
  const revealRef = useReveal([lang, activeKey, shown.length]);

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <h1 className={`fx-h1${arc}`}>{c.title}</h1>
        <p className={`fx-sub${arc}`}>{c.sub}</p>

        {/* Filter bar (sticky) */}
        <div className="fx-filterbar">
          {chips.map((ch) => (
            <button key={ch.key} type="button"
              className={`fx-chip${activeKey === ch.key ? ' on' : ''}${arc}`}
              onClick={() => nav(ch.key === 'all' ? '/factories' : `/factories/${ch.key}`)}>
              {ch.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={`fx-sub${arc}`}>{c.loading}</p>
        ) : shown.length === 0 ? (
          <p className={`fx-sub${arc}`}>{c.empty}</p>
        ) : (
          <div className="fx-faclist" ref={revealRef}>
            {shown.map((f, i) => {
              const meta = byFactory[f.id] || { images: [], products: 0, catalogs: 0 };
              // The factory's profile picture IS the big display image (fallback: a product photo).
              const cover = isUrl(f.profile_image) ? f.profile_image : (meta.images[0] || null);
              const name = resolveName(f);
              const desc = nf(f.description_ar && isAr ? f.description_ar : lang === 'zh' ? f.description_zh : f.description_en)
                || nf(f.description_ar) || factoryTaglineForCode(f.category, lang);
              const loc = [nf(f.city), nf(f.country)].filter(Boolean).join(isAr ? '، ' : ', ');
              const stats = [
                meta.catalogs ? { n: meta.catalogs, l: c.cats } : null,
                meta.products ? { n: meta.products, l: c.prods } : null,
                nf(f.moq_note) ? { n: nf(f.moq_note), l: c.moq, small: true } : null,
                f.private_label ? { n: c.oem, l: c.oemYes, small: true } : null,
              ].filter(Boolean).slice(0, 4);
              const facts = [];
              if (nf(f.export_markets)) facts.push(`${c.exports} ${f.export_markets}`);
              if (f.founded_year) facts.push(`${c.since} ${f.founded_year}`);

              return (
                <div key={f.id} className="fx-faccard reveal" style={{ '--i': i % PAGE }}>
                  <div className="fx-fac-cover" onClick={() => nav(`/factory/${f.id}`)}>
                    {cover ? (
                      <img className="fx-fac-cover-img" src={cover} alt={name} loading="lazy" />
                    ) : (
                      <span className="fx-fac-cover-initial">{(name || '?')[0]}</span>
                    )}
                    <div className="fx-fac-badges">
                      {f.is_featured && <span className={`fx-fac-badge rec${arc}`}>★ {c.rec}</span>}
                      {f.is_verified && <span className={`fx-fac-badge ver${arc}`}>✓ {c.ver}</span>}
                    </div>
                  </div>

                  <div className="fx-fac-body">
                    <h3 className={`fx-fac-name${arc}`} onClick={() => nav(`/factory/${f.id}`)}>
                      {name} {flagFor(f.country)}
                    </h3>
                    {loc && <p className={`fx-fac-loc${arc}`}>{loc}</p>}
                    <p className={`fx-fac-desc${arc}`}>{desc}</p>

                    {catLabel[f.category] && (
                      <div className={`fx-fac-catrow${arc}`}>
                        <span className="fx-fac-cat">{catLabel[f.category]}</span>
                      </div>
                    )}

                    {stats.length > 0 && (
                      <div className="fx-fac-stats">
                        {stats.map((s, j) => (
                          <div className="fx-fac-stat" key={j}>
                            <span className={`fx-fac-stat-n${s.small ? ' sm' : ''}`}>{s.n}</span>
                            <span className="fx-fac-stat-l">{s.l}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <CertPills certs={f.certifications} lang={lang} max={4} style={{ marginTop: 8 }} />
                    {facts.length > 0 && (
                      <div className={`fx-fac-chips${arc}`}>
                        {facts.map((t, j) => <span className="fx-fac-chip" key={j}>{t}</span>)}
                      </div>
                    )}

                    <div className="fx-fac-actions">
                      <button className={`fx-fac-btn${arc}`} onClick={() => nav(`/factory/${f.id}`)}>{c.view}</button>
                      <button className={`fx-fac-btn primary${arc}`} onClick={() => nav(`/factory/${f.id}?request=1`)}>{c.quote}</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > visible && (
          <button className={`fx-loadmore${arc}`} onClick={() => setVisible((v) => v + PAGE)}>{c.more}</button>
        )}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
