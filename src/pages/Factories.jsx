import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import { sb } from '../supabase';
import {
  displayCategoriesForLang, getFactoryDisplayCategory, codesForDisplayCategory,
  factoryTaglineForCode,
} from '../lib/factoryCategories';
import { UI_CATEGORIES } from '../lib/supplierDashboardConstants';
import { useStaleWhileRevalidate } from '../lib/useStaleWhileRevalidate';
import { prefetchFactoryDetail } from '../lib/prefetchFactoryDetail';
import { CardGridSkeleton } from '../components/Skeleton';

const PAGE = 9;   // "load more" batch

const T = {
  ar: { title: 'المصانع', sub: 'تواصل مباشرة مع المصانع في الصين واستورد بأفضل الأسعار.',
        cats: 'كتالوجات', prods: 'منتج', moq: 'الحد الأدنى', oem: 'OEM/ODM', oemYes: 'متوفر',
        rec: 'موصى به', ver: 'موثّق', exports: 'يصدّر إلى', since: 'منذ',
        view: 'عرض المصنع', quote: 'اطلب عرض سعر', more: 'تحميل المزيد',
        prodsBtn: 'عرض المنتجات', profileBtn: 'عرض الملف',
        trustB: 'جميع المصانع والموردين مُوثّقون ومختارون بعناية', trustS: 'نختار لك الموثوق لتستورد بثقة',
        empty: 'لا توجد مصانع في هذه الفئة بعد.', loading: 'جارٍ التحميل…' },
  en: { title: 'Factories', sub: 'Deal directly with factories in China and import at the best prices.',
        cats: 'catalogs', prods: 'products', moq: 'MOQ', oem: 'OEM/ODM', oemYes: 'available',
        rec: 'Recommended', ver: 'Verified', exports: 'Exports to', since: 'Est.',
        view: 'View factory', quote: 'Request a quote', more: 'Load more',
        prodsBtn: 'View products', profileBtn: 'View profile',
        trustB: 'Every factory & supplier is verified and hand-picked', trustS: 'we pick the trusted ones so you import with confidence',
        empty: 'No factories in this category yet.', loading: 'Loading…' },
  zh: { title: '工厂', sub: '直接对接中国工厂，以最优价格进口。',
        cats: '目录', prods: '产品', moq: '起订量', oem: 'OEM/ODM', oemYes: '可提供',
        rec: '推荐', ver: '已核实', exports: '出口至', since: '成立',
        view: '查看工厂', quote: '请求报价', more: '加载更多',
        prodsBtn: '查看产品', profileBtn: '查看资料',
        trustB: '所有工厂与供应商均经过核实与甄选', trustS: '我们为您甄选可信来源，让您放心进口',
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
  const [visible, setVisible] = useState(PAGE);

  // Cached list (stale-while-revalidate): fetched once per session, instant on
  // revisit + background refresh. Public read-only — nothing to invalidate.
  const { data, isLoading: loading } = useStaleWhileRevalidate('factories-list', async () => {
    // Fast path: the aggregation runs in the DB (factory_directory_with_stats) and
    // returns ONE small row per factory instead of the whole product table. Falls
    // back to the client aggregation below if the RPC isn't deployed yet.
    const rpc = await sb.rpc('factory_directory_with_stats');
    if (!rpc.error && Array.isArray(rpc.data)) {
      const factories = [];
      const map = {};
      rpc.data.forEach((row) => {
        const f = row.factory;
        if (!f) return;
        factories.push(f);
        map[f.id] = { images: row.cover_images || [], products: row.product_count || 0, catalogs: row.catalog_count || 0 };
      });
      return { factories, byFactory: map };
    }

    // Fallback — page through ALL product rows and aggregate on the client. A
    // single select is capped at ~1000 by PostgREST, so page through in parallel.
    const fetchAllProductMeta = async () => {
      const PAGE = 1000;
      // The first page also returns the exact total, so the remaining pages can
      // be fetched in PARALLEL rather than walked one blocking round-trip at a
      // time (that serial walk was most of the 3-4s cold load).
      const first = await sb.from('factory_products')
        .select('factory_id, image, import_id', { count: 'exact' })
        .order('factory_id', { ascending: true })
        .range(0, PAGE - 1);
      if (first.error || !first.data) return [];
      const all = [...first.data];
      const total = first.count ?? first.data.length;
      const rest = [];
      for (let from = PAGE; from < total; from += PAGE) {
        rest.push(sb.from('factory_products')
          .select('factory_id, image, import_id')
          .order('factory_id', { ascending: true })
          .range(from, from + PAGE - 1));
      }
      if (rest.length) {
        const pages = await Promise.all(rest);
        for (const p of pages) { if (p.data) all.push(...p.data); }
      }
      return all;
    };
    const [{ data: facs }, prods] = await Promise.all([
      sb.from('factory_directory_public').select('*').order('sort_order', { ascending: true }),
      fetchAllProductMeta(),
    ]);
    const agg = {};
    (prods || []).forEach((p) => {
      const a = agg[p.factory_id] || (agg[p.factory_id] = { images: [], imports: new Set(), products: 0 });
      a.products += 1;
      if (p.import_id) a.imports.add(p.import_id);
      if (isUrl(p.image) && a.images.length < 5) a.images.push(p.image);
    });
    const map = {};
    Object.keys(agg).forEach((k) => { map[k] = { images: agg[k].images, products: agg[k].products, catalogs: agg[k].imports.size }; });
    return { factories: facs || [], byFactory: map };
  });
  const factories = data?.factories || [];

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
          <CardGridSkeleton count={8} variant="factory" minWidth={260} />
        ) : shown.length === 0 ? (
          <p className={`fx-sub${arc}`}>{c.empty}</p>
        ) : (
          <div className="fx-faclist" ref={revealRef}>
            {shown.map((f, i) => {
              const logo = isUrl(f.profile_image) ? f.profile_image : null;
              const name = resolveName(f);
              const desc = nf(f.description_ar && isAr ? f.description_ar : lang === 'zh' ? f.description_zh : f.description_en)
                || nf(f.description_ar) || factoryTaglineForCode(f.category, lang);
              const loc = [nf(f.city), nf(f.country)].filter(Boolean).join(isAr ? '، ' : ', ');
              const cat = catLabel[f.category];

              return (
                <div key={f.id} className="fx-faccard reveal" style={{ '--i': i % PAGE }}
                  onMouseEnter={() => prefetchFactoryDetail(f.id)} onFocus={() => prefetchFactoryDetail(f.id)}>
                  <div className="fx-fac-top" onClick={() => nav(`/factory/${f.id}`)}>
                    <div className="fx-fac-logo">
                      {logo
                        ? <img src={logo} alt={name} loading="lazy" />
                        : <span className="fx-fac-logo-initial">{(name || '?')[0]}</span>}
                    </div>
                    <div className="fx-fac-content">
                      <div className={`fx-fac-badges${arc}`}>
                        {cat && <span className="fx-fac-cat">{cat}</span>}
                        {f.is_featured && <span className={`fx-fac-badge rec${arc}`}>★ {c.rec}</span>}
                        {f.is_verified && <span className={`fx-fac-badge ver${arc}`}>✓ {c.ver}</span>}
                      </div>
                      <h3 className={`fx-fac-name${arc}`}>{name || '—'}</h3>
                      {loc && (
                        <p className={`fx-fac-loc${arc}`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A8F80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
                          <span>{loc}</span>
                        </p>
                      )}
                      {desc && <p className={`fx-fac-desc${arc}`}>{desc}</p>}
                    </div>
                  </div>

                  <div className="fx-fac-footer">
                    <button className={`fx-fac-footbtn${arc}`} onClick={() => nav(`/factory/${f.id}?focus=products`)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>
                      <span>{c.prodsBtn}</span>
                    </button>
                    <span className="fx-fac-footdiv" />
                    <button className={`fx-fac-footbtn${arc}`} onClick={() => nav(`/factory/${f.id}`)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5M9 3h6l5 5v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /></svg>
                      <span>{c.profileBtn}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > visible && (
          <button className={`fx-loadmore${arc}`} onClick={() => setVisible((v) => v + PAGE)}>{c.more}</button>
        )}

        {!loading && shown.length > 0 && (
          <div className={`fx-fac-trust${arc}`}>
            <div className="fx-fac-trust-ic">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5E7256" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
            </div>
            <div>
              <p className="fx-fac-trust-b">{c.trustB}</p>
              <p className="fx-fac-trust-s">{c.trustS}</p>
            </div>
          </div>
        )}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
