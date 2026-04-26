import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import Footer from '../components/Footer';
import IdeaToProduct from '../components/IdeaToProduct';
import {
  getOfferEstimatedTotal,
  getOfferProductSubtotal,
  getOfferShippingCost,
} from '../lib/offerPricing';
import { runWithOptionalColumns } from '../lib/supabaseColumnFallback';
import { buildManagedBriefRow, generateManagedBriefWithAI } from '../lib/managedSourcing';
import { buildTranslatedRequestFields, translateTextToAllLanguages } from '../lib/requestTranslation';
import {
  DISPLAY_CURRENCIES,
  DEFAULT_DISPLAY_CURRENCY,
  formatCurrencyAmount,
  formatPriceWithConversion,
  normalizeDisplayCurrency,
} from '../lib/displayCurrency';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co';

// Function لتحويل JSON إلى نص مقروء إذا كان الوصف يحتوي على JSON
const parseJsonIfNeeded = (text) => {
  if (!text || typeof text !== 'string') return text;
  const trimmed = text.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      const readable = [
        parsed.product_name,
        parsed.description,
        parsed.specifications,
        parsed.notes,
        parsed.quantity ? 'Qty: ' + parsed.quantity : null,
      ].filter(Boolean).join(' · ');
      return readable || null;
    } catch { return text; }
  }
  return text;
};

// Function لترجمة عناوين الطلبات
const translateRequestText = async (text, sourceLang, targetLang) => {
  if (!text || sourceLang === targetLang) return text;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/maabar-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        task: 'chat_translation',
        payload: {
          text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          conversationRole: 'product_request',
        },
      }),
    });
    
    if (!response.ok) {
      console.error('Request translation API error:', await response.text());
      return text;
    }
    
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Request translation error:', error);
    return text;
  }
};

const CATEGORIES = {
  ar: [
    { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture',   label: 'أثاث' },
    { val: 'clothing',    label: 'ملابس' },
    { val: 'building',    label: 'مواد بناء' },
    { val: 'food',        label: 'غذاء' },
    { val: 'other',       label: 'أخرى' },
  ],
  en: [
    { val: 'electronics', label: 'Electronics' },
    { val: 'furniture',   label: 'Furniture' },
    { val: 'clothing',    label: 'Clothing' },
    { val: 'building',    label: 'Building Materials' },
    { val: 'food',        label: 'Food' },
    { val: 'other',       label: 'Other' },
  ],
  zh: [
    { val: 'electronics', label: '电子产品' },
    { val: 'furniture',   label: '家具' },
    { val: 'clothing',    label: '服装' },
    { val: 'building',    label: '建材' },
    { val: 'food',        label: '食品' },
    { val: 'other',       label: '其他' },
  ],
};

/* ─── Skeleton ───────────────────────────── */
const SkeletonCard = () => (
  <div style={{
    border: '1px solid var(--border-subtle)',
    padding: '20px 24px', marginBottom: 10,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-subtle)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '55%', height: 14, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '40%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ width: 96, height: 34, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    </div>
  </div>
);

/* ─── Main ───────────────────────────────── */
export default function Requests({ lang, user, profile, displayCurrency, exchangeRates }) {
  const viewerCurrency = normalizeDisplayCurrency(displayCurrency || DEFAULT_DISPLAY_CURRENCY);
  const nav = useNavigate();
  const location = useLocation();
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [offerForms, setOfferForms] = useState({});
  const [offers, setOffers]       = useState({});
  const [submittingOfferId, setSubmittingOfferId] = useState(null);
  const [newReq, setNewReq]       = useState({ title_ar: '', title_en: '', quantity: '', description: '', category: 'other', budget_per_unit: '', budget_currency: viewerCurrency, payment_plan: '', sample_requirement: '', image_url: '', sourcing_mode: 'direct', response_deadline: '' });

  // Keep the form's default budget currency in sync with the viewer's
  // preferred display currency until they explicitly override it on the form.
  useEffect(() => {
    setNewReq(prev => prev.budget_per_unit ? prev : { ...prev, budget_currency: viewerCurrency });
  }, [viewerCurrency]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(true);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({}); // لتوسيع تفاصيل الطلب
  const [translatedRequests, setTranslatedRequests] = useState({}); // ترجمة عناوين الطلبات
  const refImageRef = useRef(null);
  // تأكد من قيمة lang
  const effectiveLang = lang || 'en';
  const isAr       = effectiveLang === 'ar';
  const isZh       = effectiveLang === 'zh';
  const isSupplier = profile?.role === 'supplier';
  
  // Debug: تحقق من اللغة
  useEffect(() => {
    console.log('Requests page - lang:', lang, 'isSupplier:', isSupplier, 'profile role:', profile?.role, 'isAr:', isAr, 'isZh:', isZh);
  }, [lang, isSupplier, profile, isAr, isZh]);
  const isManagedMode = String(newReq.sourcing_mode || 'direct').toLowerCase() === 'managed';
  const cats       = CATEGORIES[lang] || CATEGORIES.ar;

  // Load request draft from sessionStorage on mount (buyer)
  useEffect(() => {
    if (!isSupplier) {
      const draft = sessionStorage.getItem('maabar_request_draft');
      if (draft) {
        try { setNewReq(prev => ({ ...prev, ...JSON.parse(draft) })); } catch {}
      }
    }
  }, []);

  useEffect(() => {
    if (isSupplier) return;
    const params = new URLSearchParams(location.search);
    const flow = params.get('flow');
    const mode = String(params.get('mode') || '').toLowerCase();
    if (['custom', 'private-label', 'idea'].includes(String(flow || '').toLowerCase())) {
      setIdeaOpen(true);
    }
    if (mode === 'managed') {
      setNewReq((prev) => ({ ...prev, sourcing_mode: 'managed' }));
    }
  }, [isSupplier, location.search]);

  // Save request form to sessionStorage on every change (buyer)
  useEffect(() => {
    if (!isSupplier) {
      sessionStorage.setItem('maabar_request_draft', JSON.stringify(newReq));
    }
  }, [newReq, isSupplier]);

  // Redirect non-logged-in visitor who arrives at /requests via supplier path
  useEffect(() => {
    if (user && !isSupplier && profile?.role === 'supplier') nav('/login/supplier');
  }, [user, profile]);

  useEffect(() => { if (isSupplier) loadRequests(); }, [user, profile, showAllRequests]);

  const loadRequests = async () => {
    setLoading(true);
    let query = sb
      .from('requests')
      .select('*, profiles!buyer_id(full_name, company_name)')
      .in('status', ['open', 'offers_received'])
      .or('sourcing_mode.is.null,sourcing_mode.eq.direct')
      .order('created_at', { ascending: false });
    // Filter by supplier's speciality unless "show all" toggled
    if (!showAllRequests && profile?.speciality) {
      query = query.eq('category', profile.speciality);
    }
    const { data, error } = await query;
    if (error) {
      console.error('loadRequests error:', error);
      setRequests([]);
      setLoading(false);
      return;
    }
    if (data) {
      setRequests(data);
      
      // Build display translations for suppliers
      // Prefer pre-translated DB columns; fall back to runtime AI translation only when missing
      if (isSupplier && lang !== 'ar' && data.length > 0) {
        const translations = {};
        const needsRuntimeTranslation = [];

        for (const request of data) {
          const preTitle = lang === 'zh' ? request.title_zh : request.title_en;
          const preDesc  = lang === 'zh' ? request.description_zh : request.description_en;

          if (preTitle) {
            translations[request.id] = { title: preTitle };
            if (preDesc) translations[request.id].description = preDesc;
          } else {
            // No pre-translated title — queue for runtime translation
            needsRuntimeTranslation.push(request);
          }
        }

        // Runtime translation only for older requests without pre-translated columns
        for (const request of needsRuntimeTranslation) {
          const titleToTranslate = request.title_ar || request.title_en || '';
          const descToTranslate  = parseJsonIfNeeded(request.description || '');

          if (titleToTranslate) {
            const sourceLang = request.title_ar ? 'ar' : 'en';
            const translatedTitle = await translateRequestText(titleToTranslate, sourceLang, lang);
            translations[request.id] = { ...translations[request.id], title: translatedTitle };
          }

          if (descToTranslate) {
            const translatedDesc = await translateRequestText(descToTranslate, 'ar', lang);
            translations[request.id] = { ...translations[request.id], description: translatedDesc };
          }
        }

        setTranslatedRequests(translations);
      }
    }
    setLoading(false);
  };

  const uploadRefImage = async (file) => {
    if (!file) return;
    setUploadingRef(true);
    const path = `requests/${Date.now()}_ref.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    setUploadingRef(false);
    if (error) { console.error('ref image upload error:', error); return; }
    const { data: { publicUrl } } = sb.storage.from('product-images').getPublicUrl(path);
    setNewReq(prev => ({ ...prev, image_url: publicUrl }));
  };

  const submitNewRequest = async () => {
    if (!user) { nav('/login/buyer'); return; }

    const titleAr = String(newReq.title_ar || '').trim();
    const titleEn = String(newReq.title_en || '').trim();
    const fallbackTitle = titleAr || titleEn;
    const quantity = String(newReq.quantity || '').trim();
    const isManagedMode = String(newReq.sourcing_mode || 'direct').toLowerCase() === 'managed';

    if (!fallbackTitle || !quantity || !newReq.payment_plan || !newReq.sample_requirement) {
      alert(isAr ? 'يرجى تعبئة اسم المنتج والكمية وخطة الدفع ومتطلبات العينة' : lang === 'zh' ? '请填写产品名称、数量、付款方案和样品要求' : 'Add product name, quantity, payment plan, and sample requirement');
      return;
    }

    setSubmitting(true);

    // Translate title and description to all 3 languages at write time
    console.log('[submitNewRequest] calling buildTranslatedRequestFields, effectiveLang:', effectiveLang);
    let translatedFields = {};
    try {
      translatedFields = await buildTranslatedRequestFields({
        titleAr,
        titleEn,
        description: String(newReq.description || '').trim(),
        lang: effectiveLang,
      });
    } catch (translationErr) {
      console.error('[submitNewRequest] buildTranslatedRequestFields threw:', translationErr?.message || translationErr);
      translatedFields = {
        title_ar: titleAr || fallbackTitle,
        title_en: titleEn || fallbackTitle,
        title_zh: titleEn || titleAr || fallbackTitle,
        description_ar: String(newReq.description || '').trim(),
        description_en: String(newReq.description || '').trim(),
        description_zh: String(newReq.description || '').trim(),
      };
    }

    const payload = {
      buyer_id: user.id,
      title_ar: translatedFields.title_ar || titleAr || fallbackTitle,
      title_en: translatedFields.title_en || titleEn || fallbackTitle,
      title_zh: translatedFields.title_zh || titleEn || titleAr || fallbackTitle,
      quantity,
      description: String(newReq.description || '').trim(),
      description_ar: translatedFields.description_ar || null,
      description_en: translatedFields.description_en || null,
      description_zh: translatedFields.description_zh || null,
      category: newReq.category || 'other',
      status: 'open',
      budget_per_unit: newReq.budget_per_unit ? parseFloat(newReq.budget_per_unit) : null,
      budget_currency: newReq.budget_per_unit ? normalizeDisplayCurrency(newReq.budget_currency || viewerCurrency) : null,
      payment_plan: newReq.payment_plan ? parseInt(newReq.payment_plan, 10) : null,
      sample_requirement: newReq.sample_requirement,
      reference_image: newReq.reference_image || newReq.image_url || null,
      sourcing_mode: isManagedMode ? 'managed' : 'direct',
      managed_status: isManagedMode ? 'submitted' : null,
      managed_review_state: isManagedMode ? 'pending' : null,
      response_deadline: newReq.response_deadline || null,
    };

    console.log('[submitNewRequest] title_zh before insert:', payload.title_zh);
    // sourcing_mode, managed_status, managed_review_state, managed_priority,
    // managed_ai_ready_at, response_deadline are all defined in
    // supabase/migrations/202604012345_managed_sourcing_mvp.sql — writing them
    // directly. The description_* columns still pass through
    // runWithOptionalColumns for environments that haven't run the
    // translation migration yet.
    const { data: insertedRequest, error, strippedColumns } = await runWithOptionalColumns({
      table: 'requests',
      payload,
      optionalKeys: ['description_ar', 'description_en', 'description_zh'],
      execute: (nextPayload) => sb.from('requests').insert(nextPayload).select('*').single(),
    });
    if (strippedColumns && strippedColumns.length > 0) {
      console.warn('[submitNewRequest] Columns stripped (not in DB schema yet — run migration):', strippedColumns);
    }

    if (!error && isManagedMode && insertedRequest?.id) {
      try {
        const brief = await generateManagedBriefWithAI({ request: payload, lang });
        await sb.from('managed_request_briefs').upsert(buildManagedBriefRow({ requestId: insertedRequest.id, buyerId: user.id, brief }), { onConflict: 'request_id' });
        await sb.from('requests').update({
          managed_status: 'admin_review',
          managed_priority: brief.priority || 'normal',
          managed_ai_ready_at: new Date().toISOString(),
        }).eq('id', insertedRequest.id);
      } catch (managedError) {
        console.error('managed request setup error:', managedError);
      }
    }

    setSubmitting(false);
    if (error) {
      alert(isAr ? 'حدث خطأ أثناء رفع الطلب' : lang === 'zh' ? '提交需求时出错' : 'Something went wrong while posting the request');
      return;
    }

    alert(
      isManagedMode
        ? (isAr ? 'تم استلام طلبك المُدار. معبر سيجهّز الـ brief ويبدأ المراجعة ثم يعرض لك أفضل 3 خيارات داخل صفحة الطلب.' : lang === 'zh' ? '您的托管需求已收到。Maabar 会先整理 brief 并开始审核，然后在同一需求页展示最佳 3 个方案。' : 'Your managed request was received. Maabar will prepare the brief, start review, then show the top 3 options inside the same request page.')
        : (isAr ? 'تم رفع طلبك! سيتواصل معك الموردون قريباً' : lang === 'zh' ? '需求已发布，供应商会尽快联系您' : 'Request posted! Suppliers will contact you soon')
    );
    sessionStorage.removeItem('maabar_request_draft');
    setNewReq({ title_ar: '', title_en: '', quantity: '', description: '', category: 'other', budget_per_unit: '', budget_currency: viewerCurrency, payment_plan: '', sample_requirement: '', image_url: '', reference_image: '', sourcing_mode: 'direct', response_deadline: '' });
    if (isManagedMode && insertedRequest?.id) {
      nav('/dashboard?tab=requests&request=' + insertedRequest.id);
    }
  };

  const toggleOfferForm = (id) => {
    setOfferForms(prev => ({ ...prev, [id]: !prev[id] }));
    setOffers(prev => ({
      ...prev,
      [id]: prev[id] || {
        price: '',
        shippingCost: '',
        shippingMethod: '',
        moq: '',
        days: '',
        origin: 'China',
        note: '',
        currency: viewerCurrency,
      },
    }));
  };

  const toggleDetails = (id) => {
    console.log('toggleDetails called for id:', id, 'current:', expandedDetails[id]);
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const submitOffer = async (requestId, buyerId) => {
    const o = offers[requestId] || {};
    const price = parseFloat(o.price);
    const shippingCost = parseFloat(o.shippingCost);
    const days = parseInt(o.days, 10);
    const moq = String(o.moq || '').trim();
    const origin = String(o.origin || 'China').trim();
    const shippingMethod = String(o.shippingMethod || '').trim();
    const note = String(o.note || '').trim();
    const requestItem = requests.find(r => r.id === requestId);
    const estimatedTotal = getOfferEstimatedTotal({ price, shipping_cost: shippingCost }, requestItem);

    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shippingCost) || shippingCost < 0 || !moq || !Number.isFinite(days) || days <= 0) {
      alert(isAr ? 'تأكد من سعر الوحدة وتكلفة الشحن و MOQ ومدة التسليم قبل الإرسال' : lang === 'zh' ? '请先确认单价、运费、起订量和交期是否正确' : 'Please check unit price, shipping cost, MOQ, and delivery days before sending');
      return;
    }

    setSubmittingOfferId(requestId);
    try {
      const { data: existing, error: existingError } = await sb.from('offers').select('id').eq('request_id', requestId).eq('supplier_id', user.id).not('status', 'eq', 'cancelled').limit(1).maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        alert(isAr ? 'لقد قدمت عرضاً على هذا الطلب مسبقاً' : lang === 'zh' ? '您已提交过此需求的报价' : 'You already submitted an offer on this request');
        return;
      }

      let noteTranslations = {};
      if (note) {
        try {
          const noteLangs = await translateTextToAllLanguages(note, lang || 'zh');
          noteTranslations = { note_ar: noteLangs.ar, note_en: noteLangs.en, note_zh: noteLangs.zh };
        } catch (translationErr) {
          console.error('submitOffer translation error:', translationErr?.message || translationErr);
        }
      }
      const offerCurrency = normalizeDisplayCurrency(o.currency || viewerCurrency);
      const { error } = await runWithOptionalColumns({
        table: 'offers',
        payload: {
          request_id: requestId,
          supplier_id: user.id,
          price,
          currency: offerCurrency,
          shipping_cost: shippingCost,
          shipping_method: shippingMethod || null,
          moq,
          delivery_days: days,
          origin,
          note: note || null,
          ...noteTranslations,
          status: 'pending',
        },
        optionalKeys: ['shipping_cost', 'shipping_method', 'origin', 'note_ar', 'note_en', 'note_zh', 'currency'],
        execute: (nextPayload) => sb.from('offers').insert(nextPayload),
      });
      if (error) throw error;

      await sb.from('requests').update({ status: 'offers_received' }).eq('id', requestId).eq('status', 'open');
      await sb.from('notifications').insert({
        user_id: buyerId, type: 'new_offer',
        title_ar: 'وصلك عرض جديد على طلبك',
        title_en: 'You received a new offer',
        title_zh: '您收到了新报价',
        ref_id: requestId, is_read: false,
      });
      try {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: 'new_offer',
            data: {
              recipientUserId: buyerId,
              name: 'Trader',
              requestTitle: requestItem?.title_ar || requestItem?.title_en || '',
              supplierName: profile?.company_name || user?.email?.split('@')[0] || 'Supplier',
              price,
              shippingCost,
              shippingMethod,
              estimatedTotal,
              deliveryDays: days,
              lang,
            },
          }),
        });
      } catch (e) { console.error('email error:', e); }
      alert(isAr ? 'تم إرسال عرضك!' : lang === 'zh' ? '报价已发送！' : 'Offer submitted!');
      toggleOfferForm(requestId);
      loadRequests();
    } catch (error) {
      console.error('submitOffer error:', error);
      alert(isAr ? 'حدث خطأ أثناء إرسال العرض' : lang === 'zh' ? '发送报价时出错' : 'Error sending offer');
    } finally {
      setSubmittingOfferId(null);
    }
  };

  const filtered = requests
    .filter(r =>
      (r.title_ar || '').includes(search) ||
      (r.title_en || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter(r => !budgetRange.min || !r.budget_per_unit || (parseFloat(r.budget_per_unit) >= parseFloat(budgetRange.min)))
    .filter(r => !budgetRange.max || !r.budget_per_unit || (parseFloat(r.budget_per_unit) <= parseFloat(budgetRange.max)));

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600)  return isAr ? Math.floor(diff / 60) + ' دقيقة'  : lang === 'zh' ? Math.floor(diff / 60) + ' 分钟前' : Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' ساعة' : lang === 'zh' ? Math.floor(diff / 3600) + ' 小时前' : Math.floor(diff / 3600) + 'h ago';
    return isAr ? Math.floor(diff / 86400) + ' يوم' : lang === 'zh' ? Math.floor(diff / 86400) + ' 天前' : Math.floor(diff / 86400) + 'd ago';
  };

  return (
    <div className="supplier-req-wrap">

      {/* ── Header ─────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isSupplier
              ? (isAr ? 'طلبات التجار' : lang === 'zh' ? '采购需求' : 'Trader Requests')
              : (isAr ? 'ارفع طلبك' : lang === 'zh' ? '发布需求' : 'Post Your Request')}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isSupplier
              ? (isAr ? 'قدّم عرضاً احترافياً وواضحاً على الطلبات المفتوحة' : lang === 'zh' ? '针对开放需求提交更专业、更清晰的报价' : 'Submit a cleaner, more professional quote on open requests')
              : (isAr ? 'اكتب طلبك وموردون صينيون يتنافسون لك' : lang === 'zh' ? '发布您的需求，让供应商为您报价竞争' : 'Post your request and suppliers compete for you')}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════
          واجهة التاجر / الزائر
      ════════════════════════════════════ */}
      {!isSupplier && (
        <div style={{ padding: 'clamp(24px, 5vw, 40px) clamp(16px, 6vw, 60px)', maxWidth: 820, width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>

          {/* Draft restore banner */}
          {user && sessionStorage.getItem('maabar_request_draft') && (() => {
            try { const d = JSON.parse(sessionStorage.getItem('maabar_request_draft')); return d.title_ar || d.title_en; } catch { return false; }
          })() && (
            <div style={{
              background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)',
              padding: '12px 18px', borderRadius: 'var(--radius-lg)', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 13, color: '#5a9a72', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? '📝 طلبك محفوظ — أكمل الإرسال' : lang === 'zh' ? '📝 您的草稿已保存 — 完成提交' : '📝 Your draft is saved — complete submission'}
              </span>
            </div>
          )}

          {/* إرشاد للزائر */}
          {!user && (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              padding: '18px 22px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 32,
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr ? 'كيف يشتغل مَعبر؟' : lang === 'zh' ? 'Maabar 如何运作？' : 'How does Maabar work?'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr
                    ? 'اكتب طلبك ← موردون صينيون يرسلون عروضهم ← اختر الأفضل ← استلم بضاعتك'
                    : lang === 'zh' ? '发布需求 ← 供应商报价 ← 选择最佳报价 ← 收货'
                    : 'Post request ← Suppliers send offers ← Choose the best ← Receive your order'}
                </p>
              </div>
              <button onClick={() => nav('/login/buyer')} style={{
                background: '#1a1a1a', color: '#ffffff',
                border: 'none', padding: '9px 20px',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', borderRadius: 'var(--radius-md)',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
                minHeight: 36,
              }}>
                {isAr ? 'تسجيل مجاني' : lang === 'zh' ? '免费注册' : 'Free Sign Up'}
              </button>
            </div>
          )}

          <div style={{
            marginBottom: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}>
            {[
              {
                key: 'managed',
                featured: true,
                title: isAr ? 'دع معبر يتولى الطلب' : lang === 'zh' ? '让 Maabar 代您处理需求' : 'Let Maabar handle the request',
                eyebrow: isAr ? 'الأكثر شمولاً' : lang === 'zh' ? '最完整的路径' : 'Most guided path',
                text: isAr ? 'معبر يجهز الـ brief، يراجع الطلب، يختار الموردين الأنسب فقط، ثم يعرض لك أفضل 3 عروض هنا داخل نفس الطلب.' : lang === 'zh' ? 'Maabar 会整理 brief、审核需求、只匹配合适供应商，然后在同一需求页里给您最佳 3 个方案。' : 'Maabar prepares the brief, reviews the request, matches only suitable suppliers, then returns the top 3 offers in the same request page.',
                onClick: () => setNewReq(prev => ({ ...prev, sourcing_mode: 'managed' })),
              },
              {
                key: 'direct',
                title: isAr ? 'ارفع طلبك بنفسك' : lang === 'zh' ? '自己发布需求' : 'Post your request yourself',
                eyebrow: isAr ? 'للطلبات الواضحة' : lang === 'zh' ? '适合明确需求' : 'For clear requests',
                text: isAr ? 'إذا كان المنتج واضحاً عندك وتريد عروضاً مباشرة، استخدم نموذج الطلب القياسي.' : lang === 'zh' ? '如果产品已经明确并想直接收报价，请使用标准需求表单。' : 'If the product is already clear and you want direct quotes, use the standard request form.',
                onClick: () => setNewReq(prev => ({ ...prev, sourcing_mode: 'direct' })),
              },
              {
                key: 'idea',
                title: isAr ? 'حوّل فكرتك إلى منتج' : lang === 'zh' ? '将您的想法变成产品' : 'Turn your idea into a product',
                eyebrow: isAr ? 'للـ OEM / Private Label' : lang === 'zh' ? '适合 OEM / 自有品牌' : 'For OEM / private label',
                text: isAr ? 'إذا كانت البداية مجرد فكرة أو علامة خاصة، افتح هذا المسار حتى يرتّب معبر brief أوضح قبل التوريد.' : lang === 'zh' ? '如果现在还是一个想法或自有品牌方向，请进入这个路径，让 Maabar 先整理更清晰的 brief。' : 'If you are starting from an idea or private-label concept, use this path so Maabar can structure a clearer brief first.',
                action: () => setIdeaOpen(true),
              },
            ].map((option) => {
              const active = option.key === 'idea' ? false : (option.key === 'managed' ? isManagedMode : !isManagedMode);
              return (
                <div key={option.key} style={{ background: option.featured ? 'var(--bg-subtle)' : 'var(--bg-subtle)', border: `1px solid ${active ? 'rgba(0,0,0,0.15)' : option.featured ? 'rgba(0,0,0,0.08)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-xl)', padding: '18px 20px' }}>
                  <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: option.featured ? 'var(--text-primary)' : 'var(--text-disabled)', marginBottom: 8 }}>
                    {option.eyebrow}
                  </p>
                  <h3 style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{option.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {option.text}
                  </p>
                  <button type="button" className={option.key === 'idea' ? 'btn-outline' : active ? 'btn-primary' : 'btn-outline'} onClick={option.action || option.onClick} style={{ minHeight: 36, fontSize: 12 }}>
                    {option.key === 'managed'
                      ? (isAr ? 'اختيار الطلب المُدار' : lang === 'zh' ? '选择托管需求' : 'Choose managed sourcing')
                      : option.key === 'direct'
                        ? (isAr ? 'اختيار الطلب القياسي' : lang === 'zh' ? '选择标准需求' : 'Choose standard request')
                        : (isAr ? 'ابدأ المسار' : lang === 'zh' ? '开始' : 'Start')}
                  </button>
                </div>
              );
            })}
          </div>

          {/* فورم الطلب */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-muted)',
            padding: '32px 36px',
            borderRadius: 'var(--radius-xl)',
          }}>
            <h3 style={{
              fontSize: 20, fontWeight: 400,
              color: 'var(--text-primary)',
              marginBottom: 6,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              letterSpacing: isAr ? 0 : -0.3,
            }}>
              {isManagedMode
                ? (isAr ? 'طلب مُدار جديد' : lang === 'zh' ? '新的托管需求' : 'New managed sourcing request')
                : (isAr ? 'طلب تسعيرة جديد' : 'New Sourcing Request')}
            </h3>
            <p style={{
              color: 'var(--text-disabled)', fontSize: 13,
              marginBottom: 28, lineHeight: 1.7,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {isManagedMode
                ? (isAr ? 'معبر سيجهّز الـ brief، يراجع الوضوح، يطابق الموردين المناسبين فقط، ثم يعرض لك أفضل 3 عروض داخل صفحة الطلب نفسها.' : lang === 'zh' ? 'Maabar 会准备 brief、审核清晰度、只匹配合适供应商，然后在同一需求页里展示最佳 3 个方案。' : 'Maabar will prepare the brief, review clarity, match only suitable suppliers, then show the top 3 offers inside the same request page.')
                : (isAr ? 'أكتب تفاصيل المنتج اللي تبيه وسيتواصل معك الموردون بأفضل الأسعار' : 'Describe what you need and suppliers will send you their best prices')}
            </p>

            {/* Category */}
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'نوع المنتج *' : 'Product Category *'}
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button key={c.val} onClick={() => setNewReq({ ...newReq, category: c.val })} style={{
                    padding: '6px 14px', fontSize: 12,
                    borderRadius: 20, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: newReq.category === c.val ? 'var(--bg-raised)' : 'transparent',
                    color: newReq.category === c.val ? 'var(--text-primary)' : 'var(--text-disabled)',
                    border: '1px solid',
                    borderColor: newReq.category === c.val ? 'var(--border-muted)' : 'var(--border-subtle)',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    minHeight: 32,
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>
                  {isAr ? 'اسم المنتج بالعربي *' : 'Product Name *'}
                </label>
                <input className="form-input"
                  value={newReq.title_ar}
                  onChange={e => setNewReq({ ...newReq, title_ar: e.target.value })}
                  placeholder={isAr ? 'مثال: كراسي مكتب' : 'e.g. Office Chairs'}
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {isAr ? 'اسم المنتج بالإنجليزي' : 'Product Name (EN)'}
                </label>
                <input className="form-input"
                  value={newReq.title_en}
                  onChange={e => setNewReq({ ...newReq, title_en: e.target.value })}
                  placeholder="e.g. Office Chairs"
                />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>
                  {isAr ? 'الكمية المطلوبة *' : 'Quantity *'}
                </label>
                <input className="form-input"
                  value={newReq.quantity}
                  onChange={e => setNewReq({ ...newReq, quantity: e.target.value })}
                  placeholder={isAr ? 'مثال: 500 قطعة' : 'e.g. 500 units'}
                />
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'المواصفات المطلوبة' : 'Required Specifications'}
              </label>
              <textarea className="form-input" rows={3}
                style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                value={newReq.description}
                onChange={e => setNewReq({ ...newReq, description: e.target.value })}
                placeholder={isAr ? 'المواصفات، اللون، الجودة، المعايير...' : 'Specs, color, quality, standards...'}
                dir={isAr ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>
                  {isAr ? 'الميزانية لكل وحدة' : lang === 'zh' ? '每单位预算' : 'Budget per Unit'}
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="form-input" type="number" min="0"
                    value={newReq.budget_per_unit}
                    onChange={e => setNewReq({ ...newReq, budget_per_unit: e.target.value })}
                    placeholder={isAr ? 'اختياري' : lang === 'zh' ? '可选' : 'Optional'}
                    dir="ltr"
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-input"
                    value={newReq.budget_currency || viewerCurrency}
                    onChange={e => setNewReq({ ...newReq, budget_currency: e.target.value })}
                    style={{ width: 90, direction: 'ltr', fontFamily: 'var(--font-sans)' }}
                  >
                    {DISPLAY_CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>
              {isManagedMode && (
                <div className="form-group">
                  <label className={`form-label${isAr ? ' ar' : ''}`}>
                    {isAr ? 'الموعد المستهدف للعروض أو القرار' : lang === 'zh' ? '目标回复 / 决策日期' : 'Target decision / offer deadline'}
                  </label>
                  <input className="form-input" type="date"
                    value={newReq.response_deadline || ''}
                    onChange={e => setNewReq({ ...newReq, response_deadline: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'خطة الدفع *' : 'Payment Plan *'}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { val: '30', ar: '30% مقدماً', en: '30% upfront' },
                  { val: '50', ar: '50% مقدماً', en: '50% upfront' },
                  { val: '100', ar: '100% مقدماً', en: '100% upfront' },
                ].map(p => (
                  <button key={p.val} type="button" onClick={() => setNewReq({ ...newReq, payment_plan: p.val })} style={{
                    padding: '7px 16px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                    background: newReq.payment_plan === p.val ? 'var(--bg-raised)' : 'transparent',
                    color: newReq.payment_plan === p.val ? 'var(--text-primary)' : 'var(--text-disabled)',
                    border: '1px solid',
                    borderColor: newReq.payment_plan === p.val ? 'var(--border-muted)' : 'var(--border-subtle)',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    minHeight: 32,
                  }}>
                    {isAr ? p.ar : p.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'متطلبات العينة *' : 'Sample Requirement *'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { val: 'none',      ar: 'لا حاجة لعينة',                 en: 'No sample needed' },
                  { val: 'preferred', ar: 'عينة مفضلة إن توفرت',           en: 'Sample preferred if available' },
                  { val: 'required',  ar: 'عينة إلزامية',                  en: 'Sample is mandatory' },
                ].map(s => (
                  <label key={s.val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    <input type="radio" name="sample_req" value={s.val} checked={newReq.sample_requirement === s.val} onChange={() => setNewReq({ ...newReq, sample_requirement: s.val })} style={{ accentColor: 'var(--text-secondary)', cursor: 'pointer' }} />
                    {isAr ? s.ar : s.en}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'صورة مرجعية (اختياري)' : 'Reference Image (optional)'}
              </label>
              <input ref={refImageRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => uploadRefImage(e.target.files[0])} />
              {newReq.image_url ? (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={newReq.image_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                  <button type="button" onClick={() => setNewReq({ ...newReq, image_url: '' })} style={{ fontSize: 11, color: '#a07070', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {isAr ? 'إزالة' : 'Remove'}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => refImageRef.current?.click()} className="btn-outline" style={{ marginTop: 6, fontSize: 11, padding: '7px 16px', minHeight: 32 }}>
                  {uploadingRef ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع صورة' : 'Upload Image')}
                </button>
              )}
            </div>

            {!user && (
              <p style={{
                fontSize: 12, color: 'var(--text-disabled)',
                marginBottom: 20, padding: '10px 14px',
                background: 'var(--bg-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {isAr ? 'سيُطلب منك تسجيل الدخول عند إرسال الطلب' : "You'll be asked to sign in when submitting"}
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
              <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isManagedMode
                  ? (isAr ? 'في الطلب المُدار سيبقى القرار الأساسي داخل صفحة الطلب نفسها: ستتابع الحالة، ثم ترى العروض المختارة لك، ثم تختار أو تطلب تفاوضاً إضافياً من نفس المكان.' : lang === 'zh' ? '托管需求的主要决策都会留在同一需求页：先看状态，再看为您挑选的方案，然后在同一页做选择或要求继续谈判。' : 'For managed sourcing, the primary decision flow stays inside the same request page: track status, review the selected offers, then choose or request more negotiation there.')
                  : (isAr ? 'يتم حفظ مسودة الطلب تلقائياً على هذا الجهاز حتى لا تفقد التفاصيل قبل الإرسال.' : lang === 'zh' ? '此设备会自动保存草稿，避免在提交前丢失内容。' : 'Your draft auto-saves on this device so you do not lose request details before submission.')}
              </p>
              <button
                className="btn-dark-sm"
                onClick={submitNewRequest}
                disabled={submitting}
                style={{ padding: '12px 28px', fontSize: 14, minHeight: 46 }}>
                {submitting ? '...' : isManagedMode ? (isAr ? 'إرسال الطلب المُدار' : lang === 'zh' ? '提交托管需求' : 'Submit managed request') : (isAr ? 'إرسال الطلب' : lang === 'zh' ? '提交需求' : 'Submit Request')}
              </button>
            </div>
          </div>
        </div>
      )}

      {ideaOpen && !isSupplier && (
        <IdeaToProduct lang={lang} user={user} onClose={() => setIdeaOpen(false)} />
      )}

      {/* ════════════════════════════════════
          واجهة المورد
      ════════════════════════════════════ */}
      {isSupplier && (
        <div className="list-wrap">

          <div style={{
            marginBottom: 18,
            padding: '16px 18px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            display: 'grid',
            gap: 8,
          }}>
            <p style={{ fontSize: 11, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', margin: 0 }}>
              {isAr ? 'معيار العرض المهني' : lang === 'zh' ? '专业报价标准' : 'Professional quote standard'}
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'كلما كان عرضك أوضح في السعر وMOQ ومدة التسليم وطريقة الشحن والملاحظات، زادت ثقة التاجر السعودي وارتفعت فرصة الرد.' : lang === 'zh' ? '单价、MOQ、交期、运输方式和补充说明越清楚，沙特买家越容易信任并回复。' : 'The clearer your unit price, MOQ, lead time, shipping method, and notes are, the easier it is for a Saudi buyer to trust and answer.'}
            </p>
          </div>

          <div className="search-bar" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="search-input"
              placeholder={isAr ? 'ابحث...' : lang === 'zh' ? '搜索需求...' : 'Search...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              dir={isAr ? 'rtl' : 'ltr'}
              style={{ flex: 1 }}
            />
            {profile?.speciality && (
              <button
                onClick={() => setShowAllRequests(p => !p)}
                className="btn-outline"
                style={{ fontSize: 11, padding: '7px 14px', minHeight: 36, whiteSpace: 'nowrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {showAllRequests
                  ? (isAr ? 'طلبات تخصصي فقط' : lang === 'zh' ? '只看匹配我的品类' : 'My Specialty Only')
                  : (isAr ? 'عرض كل الطلبات' : lang === 'zh' ? '显示全部需求' : 'Show All Requests')}
              </button>
            )}
          </div>

          {/* ── Budget Filter ─────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'الميزانية:' : lang === 'zh' ? '预算：' : 'Budget:'}
            </span>
            <input
              className="search-input"
              style={{ width: 90 }}
              type="number"
              placeholder={isAr ? 'من' : lang === 'zh' ? '最低' : 'Min'}
              value={budgetRange.min}
              onChange={e => setBudgetRange(p => ({ ...p, min: e.target.value }))}
            />
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>—</span>
            <input
              className="search-input"
              style={{ width: 90 }}
              type="number"
              placeholder={isAr ? 'إلى' : lang === 'zh' ? '最高' : 'Max'}
              value={budgetRange.max}
              onChange={e => setBudgetRange(p => ({ ...p, max: e.target.value }))}
            />
            <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
              {lang === 'zh' ? '人民币 (CNY)' : 'SAR'}
            </span>
            {(budgetRange.min || budgetRange.max) && (
              <button
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }}
                onClick={() => setBudgetRange({ min: '', max: '' })}>
                {isAr ? 'مسح' : lang === 'zh' ? '清除' : 'Clear'}
              </button>
            )}
          </div>

          {!loading && (
            <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginBottom: 20, letterSpacing: 0.3 }}>
              {filtered.length} {isAr ? 'طلبات ظاهرة' : lang === 'zh' ? '可见需求' : 'visible requests'}
            </p>
          )}

          {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

          {!loading && filtered.map(r => (
            <div key={r.id} style={{ marginBottom: offerForms[r.id] ? 0 : 10 }}>

              {/* Request card */}
              <div style={{
                border: '1px solid var(--border-subtle)',
                padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 20,
                background: 'var(--bg-subtle)',
                transition: 'all 0.15s',
                borderRadius: offerForms[r.id] ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.background = 'var(--bg-muted)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className={`status-badge ${r.status === 'offers_received' ? 'status-pending' : 'status-open'}`}>
                      {r.status === 'offers_received'
                        ? (isAr ? 'وصلته عروض' : lang === 'zh' ? '已有报价' : 'Offers received')
                        : (isAr ? 'مفتوح' : lang === 'zh' ? '开放中' : 'Open')}
                    </span>
                    {r.category && r.category !== 'other' && (
                      <span style={{
                        fontSize: 10, padding: '2px 8px',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 20, color: 'var(--text-disabled)',
                        letterSpacing: 0.5,
                      }}>
                        {cats.find(c => c.val === r.category)?.label || r.category}
                      </span>
                    )}
                    {r.sample_requirement === 'required' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,60,60,0.12)', color: '#d96060', border: '1px solid rgba(200,60,60,0.25)', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? '🔴 عينة إلزامية' : lang === 'zh' ? '🔴 必须提供样品' : '🔴 Sample Required'}
                      </span>
                    )}
                    {r.sample_requirement === 'preferred' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? '⚪ عينة مفضلة' : lang === 'zh' ? '⚪ 建议提供样品' : '⚪ Sample Preferred'}
                      </span>
                    )}
                    {r.sample_requirement === 'none' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', color: '#5a9a72', border: '1px solid rgba(58,122,82,0.2)', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? '🟢 بدون عينة' : lang === 'zh' ? '🟢 无需样品' : '🟢 No Sample'}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>
                      {fmtDate(r.created_at)}
                    </span>
                  </div>

                  <h3 className={`req-name${isAr ? ' ar' : ''}`}>
                    {translatedRequests[r.id]?.title || 
                      (lang === 'ar' ? r.title_ar || r.title_en || r.title_zh :
                       lang === 'zh' ? r.title_zh || r.title_en || r.title_ar :
                       r.title_en || r.title_ar || r.title_zh)}
                  </h3>

                  <div className="req-meta">
                    <span>{r.profiles?.company_name || r.profiles?.full_name || (isAr ? 'تاجر' : lang === 'zh' ? '买家' : 'Trader')}</span>
                    <span>{r.quantity || '—'}</span>
                    {(translatedRequests[r.id]?.description || r.description) && (
                      <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>
                        {(parseJsonIfNeeded(translatedRequests[r.id]?.description) || parseJsonIfNeeded(r.description) || '').substring(0, 60)}…
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 14 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الكمية' : lang === 'zh' ? '数量' : 'Quantity'}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{r.quantity || '—'}</p>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الميزانية' : lang === 'zh' ? '预算' : 'Budget'}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {r.budget_per_unit
                          ? formatPriceWithConversion({
                              amount: parseFloat(r.budget_per_unit),
                              sourceCurrency: r.budget_currency || 'SAR',
                              displayCurrency: viewerCurrency,
                              rates: exchangeRates,
                              lang,
                            })
                          : (isAr ? 'غير محددة' : lang === 'zh' ? '未说明' : 'Not specified')}
                      </p>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'خطة الدفع' : lang === 'zh' ? '付款计划' : 'Payment plan'}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>{r.payment_plan ? `${r.payment_plan}%` : '—'}</p>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'العينة' : lang === 'zh' ? '样品要求' : 'Sample'}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0 }}>
                        {r.sample_requirement === 'required'
                          ? (isAr ? 'إلزامية' : lang === 'zh' ? '必须提供' : 'Required')
                          : r.sample_requirement === 'preferred'
                            ? (isAr ? 'مفضلة' : lang === 'zh' ? '优先提供' : 'Preferred')
                            : (isAr ? 'غير مطلوبة' : lang === 'zh' ? '无需样品' : 'Not required')}
                      </p>
                    </div>
                  </div>

                  {r.reference_image && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 12 }}>
                      <img src={r.reference_image} alt="request reference" style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'صورة مرجعية' : lang === 'zh' ? '参考图片' : 'Reference image'}</p>
                        <a href={r.reference_image} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {isAr ? 'فتح الصورة' : lang === 'zh' ? '查看图片' : 'Open image'}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <button className="btn-quote" onClick={() => toggleOfferForm(r.id)}>
                    {offerForms[r.id]
                      ? (isAr ? 'إغلاق' : lang === 'zh' ? '关闭' : 'Close')
                      : (isAr ? 'قدم عرضك' : lang === 'zh' ? '提交报价' : 'Submit Quote')}
                  </button>
                  
                  <button 
                    className="btn-outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Button clicked for request:', r.id, 'title:', r.title_ar);
                      toggleDetails(r.id);
                    }}
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: 12,
                      minHeight: 32,
                      width: '100%',
                      textAlign: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {expandedDetails[r.id] 
                      ? (isAr ? 'إخفاء التفاصيل' : lang === 'zh' ? '隐藏详情' : 'Hide Details') 
                      : (isAr ? 'تفاصيل الطلب' : lang === 'zh' ? '查看详情' : 'Request Details')}
                  </button>
                </div>
              </div>

              {/* تفاصيل الطلب الموسعة */}
              {expandedDetails[r.id] && (
                <div style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '20px 24px',
                  marginBottom: offerForms[r.id] ? 0 : 10,
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                  display: 'block',
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'تفاصيل الطلب الكاملة' : lang === 'zh' ? '需求详情' : 'Request Details'}
                    </h4>
                    
                    {/* الوصف الكامل */}
                    {r.description && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 6 }}>{isAr ? 'الوصف' : lang === 'zh' ? '描述' : 'Description'}</p>
                        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {r.description}
                        </p>
                      </div>
                    )}
                    
                    {/* معلومات إضافية */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'تاريخ الإنشاء' : lang === 'zh' ? '创建日期' : 'Created Date'}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'آخر تحديث' : lang === 'zh' ? '最后更新' : 'Last Updated'}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{new Date(r.updated_at).toLocaleDateString()}</p>
                      </div>
                      
                      {r.response_deadline && (
                        <div>
                          <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'موعد الرد' : lang === 'zh' ? '回复截止' : 'Response Deadline'}</p>
                          <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{new Date(r.response_deadline).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* ملاحظات إضافية */}
                    <div style={{ 
                      padding: '12px 16px', 
                      background: 'var(--bg-subtle)', 
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 6 }}>{isAr ? 'ملاحظة' : lang === 'zh' ? '提示' : 'Note'}</p>
                      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                        {isAr 
                          ? 'بعد الاطلاع على التفاصيل، يمكنك تقديم عرض باستخدام الزر "قدم عرضك" أعلاه.'
                          : lang === 'zh'
                            ? '查看详情后，您可以使用上方的"提交报价"按钮提交报价。'
                            : 'After reviewing the details, you can submit an offer using the "Submit Quote" button above.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Offer form */}
              {offerForms[r.id] && (
                <div style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderTop: 'none',
                  padding: '20px 24px',
                  marginBottom: 10,
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                }}>
                  <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                    <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>
                      {isAr ? 'ماذا يجعل العرض أقوى؟' : lang === 'zh' ? '怎样让报价更专业？' : 'What makes this quote stronger?'}
                    </p>
                    <p style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'اذكر سعراً قابلاً للتنفيذ، MOQ الحقيقي، مدة التسليم الواقعية، وطريقة الشحن أو مصطلح التجارة. وإذا كانت هناك ملاحظات مهمة مثل التغليف أو التخصيص أو الشهادة فضعها في الملاحظة.' : lang === 'zh' ? '请填写可执行的单价、真实 MOQ、实际交期，以及运输方式或贸易条款。如有包装、定制、认证等关键信息，建议在备注中说明。' : 'Use a realistic unit price, true MOQ, realistic lead time, and a clear shipping method or trade term. Use the note to mention packaging, customization, certification, or other key commercial details.'}
                    </p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'سعر الوحدة / المنتج *' : lang === 'zh' ? '产品单价 *' : 'Product / Unit Price *'}
                      </label>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
                        <input className="form-input" type="number"
                          value={offers[r.id]?.price || ''}
                          onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], price: e.target.value } }))}
                          dir="ltr"
                          style={{ flex: 1 }}
                        />
                        <select className="form-input"
                          value={offers[r.id]?.currency || viewerCurrency}
                          onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], currency: e.target.value } }))}
                          style={{ width: 90, direction: 'ltr', fontFamily: 'var(--font-sans)' }}
                        >
                          {DISPLAY_CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                      {offers[r.id]?.price && r.budget_currency && r.budget_currency !== (offers[r.id]?.currency || viewerCurrency) && (
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 6, direction: 'ltr' }}>
                          {isAr ? 'تقريب لميزانية المشتري:' : lang === 'zh' ? '相对买家预算约：' : 'Buyer budget reference:'}{' '}
                          {formatPriceWithConversion({
                            amount: parseFloat(offers[r.id]?.price || 0),
                            sourceCurrency: offers[r.id]?.currency || viewerCurrency,
                            displayCurrency: r.budget_currency,
                            rates: exchangeRates,
                            lang,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'تكلفة الشحن *' : lang === 'zh' ? '运费 *' : 'Shipping Cost *'}
                      </label>
                      <input className="form-input" type="number"
                        value={offers[r.id]?.shippingCost || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], shippingCost: e.target.value } }))}
                        dir="ltr"
                      />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'طريقة الشحن' : lang === 'zh' ? '运输方式' : 'Shipping Method'}
                      </label>
                      <input className="form-input"
                        placeholder={isAr ? 'مثال: بحري / جوي / FOB' : lang === 'zh' ? '例如：海运 / 空运 / FOB' : 'e.g. Sea / Air / FOB'}
                        value={offers[r.id]?.shippingMethod || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], shippingMethod: e.target.value } }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">MOQ *</label>
                      <input className="form-input"
                        value={offers[r.id]?.moq || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], moq: e.target.value } }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'مدة التسليم (أيام) *' : lang === 'zh' ? '交期（天）*' : 'Delivery Days *'}
                      </label>
                      <input className="form-input" type="number"
                        value={offers[r.id]?.days || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], days: e.target.value } }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产国' : 'Country of Origin'}
                      </label>
                      <input className="form-input"
                        value={offers[r.id]?.origin || 'China'}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], origin: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>
                      {isAr ? 'ملاحظة تجارية' : lang === 'zh' ? '商务备注' : 'Commercial note'}
                    </label>
                    <textarea className="form-input" rows={2}
                      style={{ resize: 'none', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                      value={offers[r.id]?.note || ''}
                      onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))}
                      placeholder={isAr ? 'مثل: التغليف، OEM، الشهادات، صلاحية العرض، وقت التجهيز...' : lang === 'zh' ? '例如：包装方式、OEM 定制、认证、报价有效期、备货时间…' : 'e.g. packaging, OEM/customization, certifications, quote validity, production readiness...'}
                    />
                  </div>
                  {(offers[r.id]?.price || offers[r.id]?.shippingCost) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'إجمالي المنتجات' : lang === 'zh' ? '产品合计' : 'Products Total'}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {formatCurrencyAmount(getOfferProductSubtotal({ price: offers[r.id]?.price }, r), offers[r.id]?.currency || viewerCurrency, lang, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الشحن' : lang === 'zh' ? '运费' : 'Shipping'}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {formatCurrencyAmount(getOfferShippingCost({ shipping_cost: offers[r.id]?.shippingCost }), offers[r.id]?.currency || viewerCurrency, lang, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Estimated Total'}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {formatCurrencyAmount(getOfferEstimatedTotal({ price: offers[r.id]?.price, shipping_cost: offers[r.id]?.shippingCost }, r), offers[r.id]?.currency || viewerCurrency, lang, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)} disabled={submittingOfferId === r.id}
                      style={{ minHeight: 40, opacity: submittingOfferId === r.id ? 0.7 : 1 }}>
                      {submittingOfferId === r.id ? (isAr ? 'جاري الإرسال...' : lang === 'zh' ? '发送中...' : 'Sending...') : (isAr ? 'إرسال العرض' : lang === 'zh' ? '发送报价' : 'Send Offer')}
                    </button>
                    <button className="btn-outline" onClick={() => toggleOfferForm(r.id)}
                      style={{ minHeight: 40 }}>
                      {isAr ? 'إلغاء' : lang === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      🔒 {isAr ? 'يراه التاجر فقط — سعرك سري' : lang === 'zh' ? '仅买家可见' : 'Only the buyer sees this — your price is private'}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-disabled)', fontStyle: 'italic' }}>
                      {isAr ? 'ملاحظة: أسعار الصرف تقريبية للتقدير فقط' : lang === 'zh' ? '注：汇率仅供参考' : 'Note: Exchange rates are approximate for estimation only'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: 'var(--text-disabled)', fontSize: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? 'لا توجد طلبات بعد' : lang === 'zh' ? '暂时没有需求' : 'No requests yet'}
              </p>
            </div>
          )}
        </div>
      )}

      <Footer lang={lang} />
    </div>
  );
}