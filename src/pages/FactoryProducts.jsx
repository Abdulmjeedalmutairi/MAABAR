import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import ProductChips from '../components/ProductChips';
import NegotiablePill from '../components/NegotiablePill';
import MoreOptionsBadge from '../components/MoreOptionsBadge';
import { startFactoryThread, buildProductRef } from '../lib/factoryThreads';
import { logProductEvent } from '../lib/productEvents';
import { sb } from '../supabase';
import {
  displayCategoriesForLang, getFactoryDisplayCategory, codesForDisplayCategory,
} from '../lib/factoryCategories';
import { catalogPriceToSAR } from '../lib/displayCurrency';
import { useStaleWhileRevalidate } from '../lib/useStaleWhileRevalidate';
import { CardGridSkeleton } from '../components/Skeleton';

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

// Global /products ordering (unified with the mobile catalog). Two passes:
//   1) COLLAPSE rows that reuse the EXACT same image — the catalog import sometimes
//      over-splits a "brand-print examples" page into 20+ near-identical products,
//      all pointing at one photo. We keep one representative per image (+ a "+N"
//      variant count) so the same picture never repeats down the grid.
//   2) DIVERSITY round-robin. Suppliers are onboarded in per-category batches (a
//      whole category in a day), so we round-robin ACROSS CATEGORIES first — fair
//      turns, so one day's category can't flood the top — and within a category
//      round-robin across factories. Priced-then-newest breaks ties in each queue.
function orderProducts(list) {
  const byNew = (a, b) => (new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const rank = (a, b) => (isPriced(b) - isPriced(a)) || byNew(a, b);
  const catOf = (p) => (p.factory && p.factory.category) || '∅';

  // 1) Collapse same-image duplicates → one representative + _variantExtra count.
  const byImage = new Map();
  for (const p of list) {
    const k = p.image || `__${p.id}`;   // missing image → never collapses
    if (!byImage.has(k)) byImage.set(k, []);
    byImage.get(k).push(p);
  }
  const reps = [];
  for (const group of byImage.values()) {
    group.sort(rank);
    const rep = group[0];
    reps.push(group.length > 1 ? { ...rep, _variantExtra: group.length - 1 } : rep);
  }

  // 2) Bucket reps by category → factory, then interleave categories fairly.
  const byCat = new Map();
  for (const p of reps) {
    const ck = catOf(p);
    let fm = byCat.get(ck); if (!fm) byCat.set(ck, fm = new Map());
    let q = fm.get(p.factory_id); if (!q) fm.set(p.factory_id, q = []);
    q.push(p);
  }
  for (const fm of byCat.values()) for (const q of fm.values()) q.sort(rank);

  const catOrder = [...byCat.keys()];
  const catHasItems = (ck) => { for (const q of byCat.get(ck).values()) if (q.length) return true; return false; };

  const out = [];
  let ci = 0;          // rotation pointer across categories (fair turns)
  let lastFac = null;
  while (out.length < reps.length) {
    // next category in the rotation that still has items
    let ck = null;
    for (let steps = 0; steps < catOrder.length; steps++) {
      const cand = catOrder[ci % catOrder.length];
      ci++;
      if (catHasItems(cand)) { ck = cand; break; }
    }
    if (ck == null) break;

    // within the category, pick a factory head (avoid the last factory when we can)
    const fm = byCat.get(ck);
    const heads = [];
    for (const q of fm.values()) if (q.length) heads.push(q[0]);
    let pool = heads.filter((p) => p.factory_id !== lastFac);
    if (!pool.length) pool = heads;
    pool.sort(rank);
    const pick = pool[0];
    fm.get(pick.factory_id).shift();
    out.push(pick);
    lastFac = pick.factory_id;
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
    logProductEvent(product, 'chat');
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
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');   // debounced search — one server call per pause
  useEffect(() => { const t = setTimeout(() => setDq(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  // Typeahead suggestions — cheap keyword match on product names (no AI, no RPC:
  // factory_products is public-read). Completes terms + jumps straight to a
  // product. (Synonyms like كنب→أريكة are handled by the semantic search on submit.)
  const [suggestions, setSuggestions] = useState([]);
  const [sugOpen, setSugOpen] = useState(false);
  useEffect(() => {
    const term = q.trim().replace(/[%,]/g, ' ');
    if (term.length < 2) { setSuggestions([]); return undefined; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await sb.from('factory_products')
        .select('id, name_en, name_ar, factory_id, image')
        .or(`name_en.ilike.%${term}%,name_ar.ilike.%${term}%`)
        .not('image', 'is', null)
        .limit(7);
      if (!cancelled) setSuggestions(data || []);
    }, 180);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  const activeCat = getFactoryDisplayCategory(activeKey);
  const categories = useMemo(
    () => (activeCat && !activeCat.all ? codesForDisplayCategory(activeKey) : null),
    [activeCat, activeKey],
  );

  // Tier 2 — server-side paginated browse (browse_products RPC): fetch a page of 40
  // already filtered + ordered on the server, load more on demand. No full-catalog
  // pull, no client-side ordering.
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 40;

  const fetchPage = async (after) => {
    const { data, error } = await sb.rpc('browse_products', {
      p_categories: categories, p_search: dq || null, p_after: after, p_limit: PAGE_SIZE,
    });
    return error ? [] : (data || []);
  };

  // Reset + load page 1 whenever the category or debounced search changes.
  useEffect(() => {
    let alive = true;
    setLoading(true); setItems([]); setHasMore(true);
    (async () => {
      const rows = await fetchPage(null);
      if (!alive) return;
      setItems(rows);
      setHasMore(rows.length === PAGE_SIZE);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [categories, dq]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    if (loadingMore || !hasMore || !items.length) return;
    setLoadingMore(true);
    const rows = await fetchPage(items[items.length - 1].browse_rank);
    setItems((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  const shown = items;
  // Prev/next in the detail view walk exactly the pages loaded so far.
  const openProduct = (p) => {
    logProductEvent(p, 'click');
    nav(`/factory/${p.factory_id}/product/${p.id}`,
      { state: { siblings: items.map((x) => ({ id: x.id, fid: x.factory_id })) } });
  };
  const revealRef = useReveal([lang, activeKey, dq, shown.length]);
  const pName = (p) => (isAr ? (nf(p.name_ar) || nf(p.name_en)) : lang === 'zh' ? (nf(p.name_zh) || nf(p.name_en)) : (nf(p.name_en) || nf(p.name_ar))) || '—';
  const fName = (p) => nf(p.factory.company_name_latin) || nf(p.factory.company_name) || '';
  // Catalog price (verbatim + currency unless already shown). null → "On request".
  const priceText = (p) => {
    const v = (nf(p.price) || '').trim();
    if (!v) return null;
    if (isAr) return catalogPriceToSAR(v, p.currency);   // Arabic trader → SAR (Western digits)
    const cur = (nf(p.currency) || '').trim();
    return cur && !v.toLowerCase().includes(cur.toLowerCase()) ? `${v} ${cur}` : v;
  };

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <h1 className={`fx-h1${arc}`}>{c.title}</h1>
        <p className={`fx-sub${arc}`}>{c.sub}</p>

        <div style={{ position: 'relative' }} onBlur={() => setTimeout(() => setSugOpen(false), 150)}>
          <input className="fp-psearch" value={q}
            onChange={(e) => { setQ(e.target.value); setSugOpen(true); }}
            onFocus={() => setSugOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Escape') setSugOpen(false); }}
            placeholder={c.search} dir={isAr ? 'rtl' : 'ltr'} />
          {sugOpen && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 30, marginTop: 4,
              background: 'var(--surface-raised, #fff)', border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: '0 12px 32px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
              {suggestions.map((sp) => (
                <button key={sp.id} type="button" onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSugOpen(false); openProduct(sp); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px',
                    background: 'none', border: 'none', borderBottom: '1px solid var(--border-soft, rgba(0,0,0,0.05))',
                    cursor: 'pointer', flexDirection: isAr ? 'row-reverse' : 'row', textAlign: isAr ? 'right' : 'left' }}>
                  {sp.image ? <img src={sp.image} alt="" loading="lazy"
                    style={{ width: 34, height: 34, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} /> : null}
                  <span style={{ flex: 1, fontSize: 13.5, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pName(sp)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
          <CardGridSkeleton count={9} variant="product" minWidth={200} />
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
                  {(p._variantExtra || p.also_count) > 0 && <MoreOptionsBadge count={p._variantExtra || p.also_count} lang={lang} style={{ marginTop: 4 }} />}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button className={`fp-pcard-btn${arc}`} style={{ flex: 1, marginTop: 0 }} onClick={() => { logProductEvent(p, 'quote'); nav(`/factory/${p.factory_id}?request=1`); }}>{c.quote}</button>
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

        {!loading && hasMore && shown.length > 0 && (
          <button className={`fx-loadmore${arc}`} onClick={loadMore} disabled={loadingMore}>{loadingMore ? '…' : c.more}</button>
        )}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
