import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import ProductChips from '../components/ProductChips';
import NegotiablePill from '../components/NegotiablePill';
import MoreOptionsBadge from '../components/MoreOptionsBadge';
import { startFactoryThread, buildProductRef } from '../lib/factoryThreads';
import { sb } from '../supabase';
import {
  displayCategoriesForLang, getFactoryDisplayCategory, codesForDisplayCategory,
} from '../lib/factoryCategories';
import { catalogPriceToSAR } from '../lib/displayCurrency';

const PAGE = 12;

const T = {
  ar: { title: 'المنتجات', sub: 'تصفّح منتجات المصانع من كتالوجاتها الرسمية واطلب عرض سعر مباشرة.',
        search: 'ابحث عن منتج أو مصنع…', moq: 'الحد الأدنى', quote: 'عرض سعر', chat: 'راسل', onReq: 'عند الطلب',
        more: 'تحميل المزيد', empty: 'لا توجد منتجات في هذه الفئة بعد.', loading: 'جارٍ التحميل…',
        noteEyebrow: 'نماذج من المتاح', noteBody: 'ما تراه هنا نماذج مختارة — لدى المصانع والموردين تشكيلة أوسع بكثير مما هو معروض. لم تجد ما تبحث عنه؟ تواصل مع المورد وستجد المزيد.' },
  en: { title: 'Products', sub: 'Browse products from factory catalogs and request a quote directly.',
        search: 'Search a product or factory…', moq: 'MOQ', quote: 'Quote', chat: 'Chat', onReq: 'On request',
        more: 'Load more', empty: 'No products in this category yet.', loading: 'Loading…',
        noteEyebrow: "A selection of what's available", noteBody: "What you see here is a curated selection — factories and suppliers offer far more than what's listed. Didn't find what you need? Reach out to the supplier and you'll find more." },
  zh: { title: '产品', sub: '浏览工厂目录中的产品并直接请求报价。',
        search: '搜索产品或工厂…', moq: '起订量', quote: '报价', chat: '联系', onReq: '面议',
        more: '加载更多', empty: '该类别暂无产品。', loading: '加载中…',
        noteEyebrow: '可选商品的一部分', noteBody: '这里展示的只是精选样例 — 工厂与供应商的种类远不止于此。没找到想要的？联系供应商，会有更多选择。' },
};

const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
const nf = (v) => (v && v !== 'not_found' ? v : '');
const isPriced = (p) => !!(p.price && String(p.price).trim() && p.price !== 'not_found');

// Smart-search normalizer: lowercase, strip Arabic diacritics + tatweel, unify
// alef/ya/ta-marbuta variants, drop punctuation, collapse spaces — so a typed
// "اريكه" matches "أريكة" and "t-shirt" matches "T Shirt". Latin + CJK letters
// and digits are kept as-is, so cross-language matching still works via the
// product's ar/en/zh names.
const normalize = (s) => String(s || '')
  .toLowerCase()
  .replace(/[ً-ْـ]/g, '')               // tashkeel + tatweel
  .replace(/[أإآٱ]/g, 'ا')    // أ إ آ ٱ → ا
  .replace(/ى/g, 'ي')                        // ى → ي
  .replace(/ة/g, 'ه')                        // ة → ه
  .replace(/[^\p{L}\p{N}]+/gu, ' ')                    // punctuation/symbols → space
  .replace(/\s+/g, ' ')
  .trim();
// Every query token must appear somewhere in the product's search text (AND).
const searchMatches = (hay, tokens) => tokens.every((t) => hay.includes(t));

// Global /products ordering (unified with the mobile catalog). Rhythm: one priced
// product, then up to two NEW products from DIFFERENT categories, repeat — so
// priced items lead throughout while fresh, varied products sit right beside them.
// Both queues are newest-first; the "rest" picks avoid repeating the last category.
function orderProducts(list) {
  const byNew = (a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const catOf = (p) => (p.factory && p.factory.category) || null;
  const priced = list.filter(isPriced).sort(byNew);
  const rest = list.filter((p) => !isPriced(p)).sort(byNew);
  const out = [];
  let lastCat = null;
  const takeRest = () => {
    let idx = rest.findIndex((p) => catOf(p) !== lastCat);
    if (idx === -1) idx = 0;   // all remaining share the last category → take newest
    return rest.splice(idx, 1)[0];
  };
  while (priced.length || rest.length) {
    if (priced.length) { const p = priced.shift(); out.push(p); lastCat = catOf(p); }
    for (let k = 0; k < 2 && rest.length; k += 1) { const p = takeRest(); out.push(p); lastCat = catOf(p); }
  }
  return out;
}

export default function FactoryProducts({ lang = 'ar', user }) {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [msgBusy, setMsgBusy] = useState(false);

  // Direct chat with a factory about a product (carries the product reference).
  async function handleMessage(product) {
    if (!user) { nav('/login'); return; }
    if (msgBusy) return;
    setMsgBusy(true);
    try {
      const threadId = await startFactoryThread(product.factory_id);
      nav(`/messages/factory/${threadId}`, { state: { product: buildProductRef(product) } });
    } catch (e) { setMsgBusy(false); alert(e.message || 'Could not open the conversation.'); }
  }
  const activeKey = searchParams.get('cat') || 'all';
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  const c = T[lang] || T.ar;
  usePageTitle('suppliers', lang);

  const chips = useMemo(() => displayCategoriesForLang(lang), [lang]);
  const [items, setItems] = useState([]);   // products joined with their factory
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      // factory_products can exceed PostgREST's default 1000-row cap, so page
      // through all of them — otherwise whole factories past row 1000 never show.
      const PROD_COLS = 'id, factory_id, name_ar, name_en, name_zh, image, moq, price, currency, customization_options, also_count, sort_order, ref_code, description_ar, description_en, created_at';
      const fetchAllProducts = async () => {
        const all = [];
        for (let from = 0; ; from += 1000) {
          const { data, error } = await sb.from('factory_products').select(PROD_COLS)
            .order('factory_id', { ascending: true }).range(from, from + 999);
          if (error || !data || !data.length) break;
          all.push(...data);
          if (data.length < 1000) break;
        }
        return all;
      };
      const [{ data: facs }, prods] = await Promise.all([
        sb.from('factory_directory_public').select('id, company_name, company_name_latin, category, certifications, private_label'),
        fetchAllProducts(),
      ]);
      if (!alive) return;
      const facMap = {};
      (facs || []).forEach((f) => { facMap[f.id] = f; });   // only ACTIVE factories (public view) → respects the draft gate
      // Join, then precompute each product's normalized search text (_hay) once —
      // names (ar/en/zh) + ref + description + factory name — so smart search stays
      // fast across the full catalog on every keystroke.
      const joined = (prods || [])
        .map((p) => {
          const factory = facMap[p.factory_id];
          const _hay = normalize([
            p.name_ar, p.name_en, p.name_zh, p.ref_code, p.description_ar, p.description_en,
            factory && factory.company_name, factory && factory.company_name_latin,
          ].filter(Boolean).join(' '));
          return { ...p, factory, _hay };
        })
        .filter((p) => p.factory && isUrl(p.image));
      setItems(joined);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { setVisible(PAGE); }, [activeKey, q]);

  const activeCat = getFactoryDisplayCategory(activeKey);
  const filtered = useMemo(() => {
    let list = items;
    if (activeCat && !activeCat.all) {
      const codes = codesForDisplayCategory(activeKey);
      list = list.filter((p) => codes.includes(p.factory.category));
    }
    // Smart search: normalize the query the same way, split into tokens, and
    // require every token to appear in the product's precomputed search text.
    const tokens = normalize(q).split(' ').filter(Boolean);
    if (tokens.length) list = list.filter((p) => searchMatches(p._hay, tokens));
    return orderProducts(list);   // priced-first, then newest
  }, [items, activeCat, activeKey, q]);

  const shown = filtered.slice(0, visible);
  // Open a product's detail, passing the FULL filtered list so its prev/next
  // arrows walk exactly what the user was browsing (cross-factory here).
  const openProduct = (p) => nav(`/factory/${p.factory_id}/product/${p.id}`,
    { state: { siblings: filtered.map((x) => ({ id: x.id, fid: x.factory_id })) } });
  const revealRef = useReveal([lang, activeKey, q, shown.length]);
  const pName = (p) => (isAr ? (nf(p.name_ar) || nf(p.name_en)) : lang === 'zh' ? (nf(p.name_zh) || nf(p.name_en)) : (nf(p.name_en) || nf(p.name_ar))) || '—';
  const fName = (p) => nf(p.factory.company_name_latin) || nf(p.factory.company_name) || '';
  // Catalog price (verbatim + currency unless already shown). null → "On request".
  const priceText = (p) => {
    const v = (nf(p.price) || '').trim();
    if (!v) return null;
    if (isAr) return catalogPriceToSAR(v);   // Arabic trader → SAR (Western digits)
    const cur = (nf(p.currency) || '').trim();
    return cur && !v.toLowerCase().includes(cur.toLowerCase()) ? `${v} ${cur}` : v;
  };

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <h1 className={`fx-h1${arc}`}>{c.title}</h1>
        <p className={`fx-sub${arc}`}>{c.sub}</p>

        <input className="fp-psearch" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={c.search} dir={isAr ? 'rtl' : 'ltr'} />

        <div className="fx-filterbar">
          {chips.map((ch) => (
            <button key={ch.key} type="button"
              className={`fx-chip${activeKey === ch.key ? ' on' : ''}${arc}`}
              onClick={() => setSearchParams(ch.key === 'all' ? {} : { cat: ch.key })}>
              {ch.label}
            </button>
          ))}
        </div>

        {/* Curated-selection note — these are examples; suppliers offer more */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 13, flexDirection: isAr ? 'row-reverse' : 'row',
          background: '#FCF9F3', border: '1px solid rgba(154,118,54,0.22)', borderRadius: 18,
          padding: 16, margin: '16px 0', boxShadow: '0 5px 12px rgba(154,118,54,0.07)',
        }}>
          <div style={{ flex: '0 0 auto', width: 42, height: 42, borderRadius: 12, background: 'rgba(154,118,54,0.12)', border: '1px solid rgba(154,118,54,0.28)', display: 'grid', placeItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9A7636" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 4.8L18.9 9l-4.8 1.5L12 15l-1.9-4.5L5.1 9l5-1.2z" />
              <path d="M18.5 14.5l.9 2.2 2.1.6-2.1.7-.9 2.1-.9-2.1-2.1-.7 2.1-.6z" />
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#9A7636', marginBottom: 3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.noteEyebrow}</div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.noteBody}</div>
          </div>
        </div>

        {loading ? (
          <p className={`fx-sub${arc}`}>{c.loading}</p>
        ) : shown.length === 0 ? (
          <p className={`fx-sub${arc}`}>{c.empty}</p>
        ) : (
          <div className="fp-pgrid" ref={revealRef}>
            {shown.map((p) => (
              <div className="fp-pcard reveal" key={p.id}>
                <button type="button" className="fp-pcard-media" onClick={() => openProduct(p)} title={pName(p)}>
                  <img src={p.image} alt={pName(p)} loading="lazy" />
                </button>
                <div className="fp-pcard-body">
                  <p className={`fp-pcard-name${arc}`} onClick={() => openProduct(p)}>{pName(p)}</p>
                  <ProductChips product={p} factory={p.factory} lang={lang} max={3} style={{ margin: '1px 0 2px' }} />
                  <button type="button" className={`fp-pcard-fac${arc}`} onClick={() => nav(`/factory/${p.factory_id}`)}>{fName(p)}</button>
                  <p className={`fp-pcard-moq${arc}`} style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: priceText(p) ? 3 : 0 }}>{priceText(p) || c.onReq}</p>
                  {priceText(p) && <NegotiablePill lang={lang} style={{ marginBottom: 3 }} />}
                  {nf(p.moq) && <p className={`fp-pcard-moq${arc}`}>{c.moq}: {p.moq}</p>}
                  {p.also_count > 0 && <MoreOptionsBadge count={p.also_count} lang={lang} style={{ marginTop: 4 }} />}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button className={`fp-pcard-btn${arc}`} style={{ flex: 1, marginTop: 0 }} onClick={() => nav(`/factory/${p.factory_id}?request=1`)}>{c.quote}</button>
                    <button type="button" onClick={() => handleMessage(p)} disabled={msgBusy}
                      style={{ flex: 1, marginTop: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '9px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-strong)', background: 'transparent',
                        color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', fontSize: 12.5, cursor: msgBusy ? 'default' : 'pointer' }}>
                      {c.chat}
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
