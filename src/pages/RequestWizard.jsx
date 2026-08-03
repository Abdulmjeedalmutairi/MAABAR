import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { UI_CATEGORIES } from '../lib/supplierDashboardConstants';
import { DISPLAY_CURRENCIES, normalizeDisplayCurrency } from '../lib/displayCurrency';
import { createManagedRequest } from '../lib/createManagedRequest';
import { sb } from '../supabase';
import useReveal from '../hooks/useReveal';

const DRAFT_KEY = 'maabar_wizard_draft';

const EMPTY_FORM = {
  title_ar: '', title_en: '', description: '', quantity: '',
  category: 'other', budget_per_unit: '', budget_currency: 'SAR',
  payment_plan: '30', sample_requirement: 'preferred',
};

const T = {
  ar: {
    pageTitle: 'ارفع طلبك', intro: 'اكتب طلبك وسيتولى فريق مَعبر البحث ويعرض لك أفضل الخيارات من موردين مُختارين.',
    typeQ: 'كيف تريد أن نبدأ؟',
    productTitle: 'لدي منتج واضح', productDesc: 'تعرف المنتج الذي تريد توريده — أدخل التفاصيل ودع مَعبر يطابق الموردين.',
    ideaTitle: 'لدي فكرة أطوّرها', ideaDesc: 'ابدأ من فكرة أو علامة خاصة، وسيساعدك مَعبر على تحويلها إلى طلب تصنيع واضح.',
    stepWord: 'الخطوة', ofWord: 'من', next: 'التالي', prev: 'السابق',
    steps: ['المتطلبات', 'الميزانية'],
    catLabel: 'الفئة', titleArLabel: 'اسم المنتج بالعربي *', titleEnLabel: 'اسم المنتج بالإنجليزي',
    qtyLabel: 'الكمية المطلوبة *', descLabel: 'المواصفات المطلوبة',
    budgetLabel: 'الميزانية لكل وحدة (اختياري)', paymentLabel: 'خطة الدفع *', sampleLabel: 'متطلبات العينة *',
    submit: 'إرسال الطلب المُدار', submitting: 'جارٍ الإرسال...',
    signinNote: 'سيُطلب منك تسجيل الدخول عند إرسال الطلب.',
    errTitle: 'يرجى إدخال اسم المنتج.', errQty: 'يرجى إدخال الكمية المطلوبة.',
    errGeneric: 'حدث خطأ أثناء رفع الطلب، حاول مرة أخرى.',
    samples: [
      { val: 'none', label: 'لا حاجة لعينة' },
      { val: 'preferred', label: 'عينة مفضلة إن توفرت' },
      { val: 'required', label: 'عينة إلزامية' },
    ],
    payments: [
      { val: '30', label: '30% مقدماً' }, { val: '50', label: '50% مقدماً' }, { val: '100', label: '100% مقدماً' },
    ],
    optional: 'اختياري',
  },
  en: {
    pageTitle: 'Submit your request', intro: 'Describe what you need and the Maabar team will source it and present the best options from selected suppliers.',
    typeQ: 'How would you like to start?',
    productTitle: 'I have a clear product', productDesc: 'You know the product you want to source — enter the details and let Maabar match suppliers.',
    ideaTitle: 'I have an idea to develop', ideaDesc: 'Start from an idea or private-label concept and Maabar helps turn it into a clear sourcing request.',
    stepWord: 'Step', ofWord: 'of', next: 'Next', prev: 'Back',
    steps: ['Requirements', 'Budget'],
    catLabel: 'Category', titleArLabel: 'Product name (Arabic) *', titleEnLabel: 'Product name (English)',
    qtyLabel: 'Required quantity *', descLabel: 'Required specifications',
    budgetLabel: 'Budget per unit (optional)', paymentLabel: 'Payment plan *', sampleLabel: 'Sample requirement *',
    submit: 'Submit managed request', submitting: 'Submitting...',
    signinNote: "You'll be asked to sign in when submitting.",
    errTitle: 'Please enter a product name.', errQty: 'Please enter the required quantity.',
    errGeneric: 'Something went wrong while posting the request, please try again.',
    samples: [
      { val: 'none', label: 'No sample needed' },
      { val: 'preferred', label: 'Sample preferred if available' },
      { val: 'required', label: 'Sample is mandatory' },
    ],
    payments: [
      { val: '30', label: '30% upfront' }, { val: '50', label: '50% upfront' }, { val: '100', label: '100% upfront' },
    ],
    optional: 'Optional',
  },
  zh: {
    pageTitle: '提交您的需求', intro: '描述您的需求，Maabar 团队会负责寻源，并从甄选供应商中为您呈现最佳方案。',
    typeQ: '您希望如何开始？',
    productTitle: '我有明确的产品', productDesc: '您已知道要采购的产品——填写细节，让 Maabar 匹配供应商。',
    ideaTitle: '我有一个想法要开发', ideaDesc: '从一个想法或自有品牌概念开始，Maabar 帮您整理成清晰的采购需求。',
    stepWord: '步骤', ofWord: '/', next: '下一步', prev: '上一步',
    steps: ['需求', '预算'],
    catLabel: '类别', titleArLabel: '产品名称（阿拉伯语）*', titleEnLabel: '产品名称（英语）',
    qtyLabel: '所需数量 *', descLabel: '所需规格',
    budgetLabel: '每单位预算（可选）', paymentLabel: '付款方式 *', sampleLabel: '样品要求 *',
    submit: '提交托管需求', submitting: '提交中...',
    signinNote: '提交时会要求您登录。',
    errTitle: '请输入产品名称。', errQty: '请输入所需数量。',
    errGeneric: '提交需求时出错，请重试。',
    samples: [
      { val: 'none', label: '无需样品' },
      { val: 'preferred', label: '如方便可提供样品' },
      { val: 'required', label: '必须提供样品' },
    ],
    payments: [
      { val: '30', label: '预付 30%' }, { val: '50', label: '预付 50%' }, { val: '100', label: '预付 100%' },
    ],
    optional: '可选',
  },
};

export default function RequestWizard({ lang = 'ar', user, displayCurrency }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('requests', lang);
  const viewerCurrency = normalizeDisplayCurrency(displayCurrency || 'SAR');
  const cats = (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).filter(c => c.val !== 'all');

  // Pre-fill from a gallery click: Supply Scope passes ?category=, Verified
  // Sectors passes ?sector= (same taxonomy code, 1:1). ?prefillTitle= optional.
  const params = new URLSearchParams(location.search);
  const prefillCategory = params.get('category') || params.get('sector') || '';
  const prefillTitle = params.get('prefillTitle') || '';
  // Factory-level "custom request to this factory" binding (from a factory page).
  const factoryId = params.get('factory') || '';
  // Optional preselected path from the home CTAs: ?type=product (import) / ?type=idea (manufacture).
  const typeParam = params.get('type');

  // null → show the product-vs-idea choice; 'product' → form; 'idea' → IdeaToProduct.
  // Factory-bound requests skip the choice — you're requesting from a specific
  // factory, so go straight to the product form.
  const [pathType, setPathType] = useState(
    factoryId ? 'product' : (typeParam === 'idea' || typeParam === 'product' ? typeParam : null),
  );
  const [step, setStep] = useState(0); // product path: 0 Requirements, 1 Budget
  const [form, setForm] = useState(() => {
    let base = { ...EMPTY_FORM, budget_currency: viewerCurrency };
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) base = { ...base, ...JSON.parse(draft) };
    } catch {}
    if (prefillCategory) base.category = prefillCategory;
    if (prefillTitle && !base.title_ar && !base.title_en) base[isAr ? 'title_ar' : 'title_en'] = prefillTitle;
    return base;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const revealRef = useReveal([pathType]);

  // Persist the draft so it survives the sign-in redirect (decision A: simple
  // sessionStorage restore, no stash-and-resume).
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
  }, [form]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function goNext() {
    if (step === 0) {
      if (!String(form.title_ar).trim() && !String(form.title_en).trim()) { setError(t.errTitle); return; }
      if (!String(form.quantity).trim()) { setError(t.errQty); return; }
    }
    setError('');
    setStep(s => Math.min(1, s + 1));
  }
  function goPrev() { setError(''); setStep(s => Math.max(0, s - 1)); }

  async function handleSubmit() {
    if (!String(form.title_ar).trim() && !String(form.title_en).trim()) { setError(t.errTitle); setStep(0); return; }
    if (!String(form.quantity).trim()) { setError(t.errQty); setStep(0); return; }

    if (!user) { nav('/login/buyer'); return; } // draft already in sessionStorage

    setSubmitting(true);
    setError('');
    const { request, error: submitErr } = await createManagedRequest({ user, form, lang, viewerCurrency });
    setSubmitting(false);
    if (submitErr || !request?.id) { setError(t.errGeneric); return; }

    // Factory-bound custom request: create the invite + email the factory
    // server-side (best-effort; the request already exists either way).
    if (factoryId) {
      try { await sb.functions.invoke('factory-request-email', { body: { requestId: request.id, factoryId } }); } catch {}
    }

    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    nav('/dashboard?tab=requests&request=' + request.id);
  }

  const dir = isAr ? 'rtl' : 'ltr';
  const arc = isAr ? ' ar' : '';

  return (
    <div className="full-page" dir={dir}>
      <div className="fx-wrap fx-wrap-narrow">
        <h1 className={`fx-h1${arc}`}>{t.pageTitle}</h1>
        <p className={`fx-sub${arc}`}>{t.intro}</p>

        {/* ── Step 0: type choice ── */}
        {pathType === null && (
          <div ref={revealRef}>
            <p className={`fx-eyebrow${arc}`}>{t.typeQ}</p>
            <div className="fx-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              {[
                { key: 'product', title: t.productTitle, desc: t.productDesc },
              ].map((opt, i) => (
                <button key={opt.key} type="button" className="fx-choice reveal" style={{ '--i': i }}
                  onClick={() => { setError(''); setPathType(opt.key); }}>
                  <h3 className={`fx-choice-title${arc}`}>{opt.title}</h3>
                  <p className={`fx-choice-desc${arc}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Product path: 2-step managed form ── */}
        {pathType === 'product' && (
          <div>
            {/* progress */}
            <div style={{ marginBottom: 22 }}>
              <p className={`fx-eyebrow${arc}`} style={{ marginBottom: 8 }}>
                {`${t.stepWord} ${step + 1} ${t.ofWord} 2 · ${t.steps[step]}`}
              </p>
              <div className="fx-progress">
                {[0, 1].map(i => (
                  <div key={i} className={`fx-progress-seg${i <= step ? ' on' : ''}`} />
                ))}
              </div>
            </div>

            <div className="fx-panel fx-step" key={step}>
              {/* Step 1 — Requirements */}
              {step === 0 && (
                <>
                  <div className="form-group">
                    <label className={`form-label${arc}`}>{t.catLabel}</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {cats.map(c => (
                        <button key={c.val} type="button" onClick={() => setField('category', c.val)}
                          className={`fx-chip${arc}${form.category === c.val ? ' on' : ''}`}>{c.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className={`form-label${arc}`}>{t.titleArLabel}</label>
                      <input className="form-input" value={form.title_ar} onChange={e => setField('title_ar', e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.titleEnLabel}</label>
                      <input className="form-input" value={form.title_en} onChange={e => setField('title_en', e.target.value)} placeholder="e.g. Office Chairs" />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${arc}`}>{t.qtyLabel}</label>
                      <input className="form-input" value={form.quantity} onChange={e => setField('quantity', e.target.value)} placeholder={isAr ? 'مثال: 500' : 'e.g. 500'} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className={`form-label${arc}`}>{t.descLabel}</label>
                    <textarea className="form-input" rows={3} style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                      value={form.description} onChange={e => setField('description', e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className={`form-label${arc}`}>{t.sampleLabel}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {t.samples.map(sopt => (
                        <label key={sopt.val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', flexDirection: isAr ? 'row-reverse' : 'row', justifyContent: isAr ? 'flex-end' : 'flex-start' }}>
                          <input type="radio" name="w_sample" value={sopt.val} checked={form.sample_requirement === sopt.val} onChange={() => setField('sample_requirement', sopt.val)} style={{ accentColor: '#1a1814', cursor: 'pointer' }} />
                          {sopt.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2 — Budget */}
              {step === 1 && (
                <>
                  <div className="form-group">
                    <label className={`form-label${arc}`}>{t.budgetLabel}</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input className="form-input" type="number" min="0" value={form.budget_per_unit}
                        onChange={e => setField('budget_per_unit', e.target.value)} placeholder={t.optional} dir="ltr" style={{ flex: 1 }} />
                      <select className="form-input" value={form.budget_currency || viewerCurrency}
                        onChange={e => setField('budget_currency', e.target.value)} style={{ width: 92, direction: 'ltr', fontFamily: 'var(--font-sans)' }}>
                        {DISPLAY_CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className={`form-label${arc}`}>{t.paymentLabel}</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {t.payments.map(p => (
                        <button key={p.val} type="button" onClick={() => setField('payment_plan', p.val)}
                          className={`fx-chip${arc}${form.payment_plan === p.val ? ' on' : ''}`}>{p.label}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {!!error && <p style={{ color: '#a05050', fontSize: 13, marginTop: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{error}</p>}
            {!user && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.signinNote}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexDirection: isAr ? 'row-reverse' : 'row' }}>
              <button type="button" className={`fx-btn-ghost${arc}`} onClick={step === 0 ? () => setPathType(null) : goPrev}>
                {t.prev}
              </button>
              {step < 1 ? (
                <button type="button" className={`fx-btn-primary${arc}`} style={{ flex: 1 }} onClick={goNext}>{t.next}</button>
              ) : (
                <button type="button" className={`fx-btn-primary${arc}`} style={{ flex: 1 }} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? t.submitting : t.submit}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
