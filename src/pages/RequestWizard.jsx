import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { UI_CATEGORIES } from '../lib/supplierDashboardConstants';
import { DISPLAY_CURRENCIES, normalizeDisplayCurrency } from '../lib/displayCurrency';
import { createManagedRequest } from '../lib/createManagedRequest';
import { sendMaabarEmail } from '../lib/maabarEmail';
import { waLink } from '../lib/maabarContact';
import { sb } from '../supabase';

const DRAFT_KEY = 'maabar_wizard_draft';
const DESC_MAX = 1000;

const EMPTY_FORM = {
  title_ar: '', title_en: '', description: '', quantity: '',
  category: '', budget_per_unit: '', budget_currency: 'SAR',
  payment_plan: '30', sample_requirement: 'preferred', phone: '',
};

const T = {
  ar: {
    pageTitle: 'طلب مُدار',
    intro: 'نستلم طلبك بالكامل ونتولّى البحث والتواصل والتوصيل حتى باب بيتك.',
    stages: ['تفاصيل الطلب', 'المتطلبات', 'الموازنة والدفع', 'المتابعة والتسليم'],
    videoStrong: 'نصوّر لك المنتج بالفيديو قبل الشحن', videoRest: 'لتتأكد بنفسك قبل أن يصلك.',
    titleLabel: 'عنوان الطلب', titleHint: 'عنوان مختصر يوضّح ما تريد',
    titlePlaceholder: 'مثال: كراسي مكتب دوّارة',
    catLabel: 'ما الذي تبحث عنه؟', catHint: 'اختر الفئة الأقرب لطلبك', catPlaceholder: 'اختر الفئة',
    descLabel: 'وصف طلبك بالتفصيل', descHint: 'كلما كان الوصف أدق، كانت النتائج أفضل',
    descPlaceholder: 'اكتب تفاصيل طلبك، المواصفات، الكمية، الجودة المطلوبة، الاستخدام…',
    budgetLabel: 'ميزانيتك التقديرية للوحدة (اختياري)', budgetHint: 'يساعدنا على البحث ضمن النطاق المناسب لك',
    budgetPlaceholder: 'أدخل ميزانيتك التقديرية',
    paymentLabel: 'الدفعة المقدمة', paymentHint: 'اختر نسبة الدفعة للبدء بالبحث',
    phoneLabel: 'رقم الجوال (واتساب)', phoneHint: 'للتواصل ومتابعة طلبك',
    draft: 'حفظ كمسودة', draftSaved: 'تم حفظ المسودة', submit: 'متابعة', submitting: 'جارٍ الإرسال…',
    security: 'بياناتك آمنة ولن تتم مشاركتها مع أي طرف ثالث',
    signinNote: 'سيُطلب منك تسجيل الدخول عند إرسال الطلب.',
    errTitle: 'يرجى كتابة عنوان للطلب.', errDesc: 'يرجى وصف طلبك بالتفصيل.', errPhone: 'يرجى إدخال رقم الجوال للتواصل.',
    errGeneric: 'حدث خطأ أثناء إرسال الطلب، حاول مرة أخرى.',
    payments: [
      { val: '30', label: '30% مقدماً', hint: 'خيار شائع' },
      { val: '100', label: '100% مقدماً' },
    ],
    successTitle: 'استلمنا طلبك ✓',
    successBody: 'سيتم تعيين مدير حساب مخصّص يتواصل معك عبر واتساب خلال ساعات لتنسيق التفاصيل والبدء بالبحث والتفاوض نيابةً عنك — حتى يصلك طلبك إلى باب بيتك.',
    successNote: 'يمكنك متابعة مراحل طلبك في أي وقت من لوحتك.',
    successBtn: 'متابعة الطلب',
    successWa: 'راسلنا على واتساب الآن',
    successRef: 'رقم طلبك',
  },
  en: {
    pageTitle: 'Managed order',
    intro: 'We take your request end to end — sourcing, negotiation, and delivery to your door.',
    stages: ['Request details', 'Requirements', 'Budget & payment', 'Follow-up & delivery'],
    videoStrong: 'We send you a video of your product before shipping', videoRest: 'so you can check it yourself before it arrives.',
    titleLabel: 'Request title', titleHint: 'A short title of what you need',
    titlePlaceholder: 'e.g. Swivel office chairs',
    catLabel: 'What are you looking for?', catHint: 'Pick the closest category', catPlaceholder: 'Choose a category',
    descLabel: 'Describe your request in detail', descHint: 'The more precise the description, the better the results',
    descPlaceholder: 'Write your specs, quantity, required quality, intended use…',
    budgetLabel: 'Estimated budget per unit (optional)', budgetHint: 'Helps us search within the right range for you',
    budgetPlaceholder: 'Enter your estimated budget',
    paymentLabel: 'Upfront deposit', paymentHint: 'Choose the deposit to start sourcing',
    phoneLabel: 'Mobile number (WhatsApp)', phoneHint: 'To reach you and follow up on your order',
    draft: 'Save as draft', draftSaved: 'Draft saved', submit: 'Continue', submitting: 'Submitting…',
    security: 'Your data is secure and never shared with any third party',
    signinNote: "You'll be asked to sign in when submitting.",
    errTitle: 'Please enter a request title.', errDesc: 'Please describe your request.', errPhone: 'Please enter your contact mobile number.',
    errGeneric: 'Something went wrong while submitting, please try again.',
    payments: [
      { val: '30', label: '30% upfront', hint: 'Popular choice' },
      { val: '100', label: '100% upfront' },
    ],
    successTitle: 'Request received ✓',
    successBody: 'A dedicated account manager will contact you on WhatsApp within hours to coordinate the details and start sourcing & negotiating on your behalf — all the way to your door.',
    successNote: 'You can track your order stages anytime from your dashboard.',
    successBtn: 'View request',
    successWa: 'Message us on WhatsApp',
    successRef: 'Your order no.',
  },
  zh: {
    pageTitle: '托管订单',
    intro: '我们全程负责您的需求——寻源、谈判、直至送货上门。',
    stages: ['需求详情', '要求', '预算与付款', '跟进与交付'],
    videoStrong: '发货前我们会为您拍摄产品视频', videoRest: '让您在收货前亲自确认。',
    titleLabel: '需求标题', titleHint: '简短说明您想要什么',
    titlePlaceholder: '例如：办公转椅',
    catLabel: '您在找什么？', catHint: '选择最接近的类别', catPlaceholder: '选择类别',
    descLabel: '详细描述您的需求', descHint: '描述越精确，结果越好',
    descPlaceholder: '写下规格、数量、所需质量、用途…',
    budgetLabel: '每单位预算（可选）', budgetHint: '帮助我们在合适的范围内寻源',
    budgetPlaceholder: '输入您的预估预算',
    paymentLabel: '预付定金', paymentHint: '选择开始寻源的定金比例',
    phoneLabel: '手机号码（WhatsApp）', phoneHint: '用于联系并跟进您的订单',
    draft: '保存草稿', draftSaved: '草稿已保存', submit: '继续', submitting: '提交中…',
    security: '您的数据安全，绝不会分享给任何第三方',
    signinNote: '提交时会要求您登录。',
    errTitle: '请输入需求标题。', errDesc: '请描述您的需求。', errPhone: '请输入您的联系手机号码。',
    errGeneric: '提交时出错，请重试。',
    payments: [
      { val: '30', label: '预付 30%', hint: '常见选择' },
      { val: '100', label: '预付 100%' },
    ],
    successTitle: '已收到您的需求 ✓',
    successBody: '我们将为您指派专属客户经理，数小时内通过 WhatsApp 与您联系，协调细节并代您开始寻源与谈判——直至送货上门。',
    successNote: '您可随时在仪表板中跟踪订单阶段。',
    successBtn: '查看需求',
    successWa: '通过 WhatsApp 联系我们',
    successRef: '订单号',
  },
};

// Field icons (rounded-square badge in each card) — simple line glyphs.
const svg = (d, extra) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}{extra}</svg>
);
const ICONS = {
  tag: svg(<><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-6.6-6.6A2 2 0 0 1 3.4 12.6V5.4A2 2 0 0 1 5.4 3.4h7.2a2 2 0 0 1 1.4.6l6.6 6.6a2 2 0 0 1 0 2.8z" /><circle cx="7.8" cy="7.8" r="1.2" /></>),
  grid: svg(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  pencil: svg(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />),
  wallet: svg(<><path d="M3 7a2 2 0 0 1 2-2h12v3M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6" /><circle cx="16.5" cy="13" r="1.3" /></>),
  shield: svg(<path d="M12 3l8 3v5.5c0 4.7-3.3 7.6-8 8.9-4.7-1.3-8-4.2-8-8.9V6z" />),
  wa: svg(<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.3A8.5 8.5 0 1 1 21 11.5z" />),
};

function FieldCard({ icon, label, hint, isAr, children }) {
  const font = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '15px 16px 17px', marginBottom: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', ...font }}>{label}</div>
          {hint ? <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.6, ...font }}>{hint}</div> : null}
        </div>
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

export default function RequestWizard({ lang = 'ar', user, displayCurrency }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('requests', lang);
  const viewerCurrency = normalizeDisplayCurrency(displayCurrency || 'SAR');
  const cats = (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).filter((c) => c.val !== 'all');
  const titleKey = isAr ? 'title_ar' : 'title_en';

  const params = new URLSearchParams(location.search);
  const prefillCategory = params.get('category') || params.get('sector') || '';
  const prefillTitle = params.get('prefillTitle') || '';
  const factoryId = params.get('factory') || '';

  const [form, setForm] = useState(() => {
    let base = { ...EMPTY_FORM, budget_currency: viewerCurrency };
    try { const draft = sessionStorage.getItem(DRAFT_KEY); if (draft) base = { ...base, ...JSON.parse(draft) }; } catch { /* ignore */ }
    if (prefillCategory) base.category = prefillCategory;
    if (prefillTitle && !base[titleKey]) base[titleKey] = prefillTitle;
    return base;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);
  const [toast, setToast] = useState('');

  // Persist the draft so it survives the sign-in redirect.
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const titleVal = form[titleKey] || '';
  const descLen = String(form.description || '').length;

  function saveDraft() {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* ignore */ }
    setToast(t.draftSaved);
    setTimeout(() => setToast(''), 1800);
  }

  async function handleSubmit() {
    if (!titleVal.trim()) { setError(t.errTitle); return; }
    if (!String(form.description).trim()) { setError(t.errDesc); return; }
    if (!String(form.phone).trim()) { setError(t.errPhone); return; }
    if (!user) { nav('/login/buyer'); return; }   // draft already in sessionStorage

    setSubmitting(true);
    setError('');
    const payload = { ...form, category: form.category || 'other' };
    const { request, error: submitErr } = await createManagedRequest({ user, form: payload, lang, viewerCurrency });
    setSubmitting(false);
    if (submitErr || !request?.id) { setError(t.errGeneric); return; }

    if (factoryId) {
      try { await sb.functions.invoke('factory-request-email', { body: { requestId: request.id, factoryId } }); } catch { /* best-effort */ }
    }
    // Alert Maabar ops of the new managed request — with the trader's contact so
    // the account manager can reach out on WhatsApp immediately. Best-effort.
    try {
      await sendMaabarEmail({ type: 'admin_new_request', data: {
        requestId: request.request_ref || request.id,
        titleAr: request.title_ar, titleEn: request.title_en,
        category: request.category, quantity: request.quantity, unit: request.unit,
        budget: request.budget_per_unit ? `${request.budget_per_unit} ${request.budget_currency || ''}` : null,
        phone: request.contact_phone || String(form.phone || '').trim(),
        buyerName: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || null,
      } });
    } catch { /* best-effort */ }
    try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setSubmitted(request);
  }

  const dir = isAr ? 'rtl' : 'ltr';
  const arc = isAr ? ' ar' : '';
  const font = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };

  return (
    <div className="full-page" dir={dir}>
      <div className="fx-wrap fx-wrap-narrow">
        <h1 className={`fx-h1${arc}`}>{t.pageTitle}</h1>
        <p className={`fx-sub${arc}`}>{t.intro}</p>

        {submitted ? (
          /* ── Professional confirmation ── */
          <div className="fx-panel" style={{ textAlign: 'center', padding: '46px 28px' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)', border: '1.5px solid rgba(139,115,85,0.32)' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h2 className={`fx-h1${arc}`} style={{ fontSize: 26, margin: '0 0 10px' }}>{t.successTitle}</h2>
            <p style={{ ...font, fontSize: 13, color: 'var(--text-muted)', margin: '0 0 14px' }}>
              {t.successRef}: <b style={{ color: 'var(--text-primary)', letterSpacing: '0.04em' }}>{submitted.request_ref || submitted.id}</b>
            </p>
            <p className={`fx-sub${arc}`} style={{ margin: '0 auto 8px', maxWidth: 470 }}>{t.successBody}</p>
            <p style={{ ...font, fontSize: 12.5, color: 'var(--text-muted)', margin: '0 auto 26px', maxWidth: 420 }}>{t.successNote}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={waLink(`استفسار عن طلبي المُدار رقم ${submitted.request_ref || submitted.id}`)} target="_blank" rel="noopener noreferrer"
                style={{ ...font, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 22px', fontSize: 14, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.42 1.3-1.95 1.34-.5.04-.5.4-3.15-.66-2.67-1.05-4.35-3.76-4.48-3.94-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.19.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.81 2 .88 2.15.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.8.85.27.13.44.2.5.31.07.11.07.63-.17 1.31z" /></svg>
                {t.successWa}
              </a>
              <button type="button" onClick={() => nav('/managed-order/' + submitted.id)}
                style={{ ...font, background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 22px', fontSize: 14, color: 'var(--text-primary)', cursor: 'pointer' }}>{t.successBtn}</button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Managed-order journey stepper (stage 1 is this form; 2–4 are handled by Maabar).
                 flexDirection stays 'row' so dir=rtl lays step 1 on the RIGHT. ── */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginBottom: 26 }}>
              {t.stages.map((label, i) => (
                <React.Fragment key={label}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: '0 0 auto', width: 74 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: i === 0 ? '#1a1814' : 'var(--bg-subtle)', color: i === 0 ? '#fff' : 'var(--text-muted)', border: i === 0 ? 'none' : '1px solid var(--border)' }}>{i + 1}</div>
                    <span style={{ ...font, fontSize: 10, textAlign: 'center', lineHeight: 1.35, color: i === 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>{label}</span>
                  </div>
                  {i < t.stages.length - 1 && <div style={{ flex: 1, height: 1, background: 'var(--border)', marginTop: 15 }} />}
                </React.Fragment>
              ))}
            </div>

            {/* Reassurance the buyer should know up front */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.22)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6A4F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: '0 0 auto' }}><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></svg>
              <p style={{ ...font, fontSize: 13, lineHeight: 1.6, margin: 0, color: 'var(--text-primary)' }}><strong>{t.videoStrong}</strong> — {t.videoRest}</p>
            </div>

            {/* Title (buyer writes it) */}
            <FieldCard icon={ICONS.tag} label={t.titleLabel} hint={t.titleHint} isAr={isAr}>
              <input className="form-input" value={titleVal} onChange={(e) => setField(titleKey, e.target.value)}
                dir={isAr ? 'rtl' : 'ltr'} placeholder={t.titlePlaceholder} maxLength={120} />
            </FieldCard>

            {/* Category */}
            <FieldCard icon={ICONS.grid} label={t.catLabel} hint={t.catHint} isAr={isAr}>
              <select className="form-input" value={form.category} onChange={(e) => setField('category', e.target.value)} style={font}>
                <option value="" disabled>{t.catPlaceholder}</option>
                {cats.map((c) => (<option key={c.val} value={c.val}>{c.label}</option>))}
              </select>
            </FieldCard>

            {/* Description + counter */}
            <FieldCard icon={ICONS.pencil} label={t.descLabel} hint={t.descHint} isAr={isAr}>
              <textarea className="form-input" rows={4} maxLength={DESC_MAX} style={{ resize: 'vertical', ...font }}
                value={form.description} onChange={(e) => setField('description', e.target.value)}
                dir={isAr ? 'rtl' : 'ltr'} placeholder={t.descPlaceholder} />
              <p style={{ ...font, fontSize: 11, color: 'var(--text-muted)', textAlign: isAr ? 'left' : 'right', margin: '4px 2px 0' }}>{descLen} / {DESC_MAX}</p>
            </FieldCard>

            {/* Budget per unit (optional) — input then currency, so dir=rtl puts SAR on the left */}
            <FieldCard icon={ICONS.wallet} label={t.budgetLabel} hint={t.budgetHint} isAr={isAr}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" type="number" min="0" value={form.budget_per_unit}
                  onChange={(e) => setField('budget_per_unit', e.target.value)} placeholder={t.budgetPlaceholder} dir={isAr ? 'rtl' : 'ltr'} style={{ flex: 1 }} />
                <select className="form-input" value={form.budget_currency || viewerCurrency}
                  onChange={(e) => setField('budget_currency', e.target.value)} style={{ width: 92, direction: 'ltr', fontFamily: 'var(--font-sans)' }}>
                  {DISPLAY_CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </FieldCard>

            {/* Upfront deposit (30% / 100%) */}
            <FieldCard icon={ICONS.shield} label={t.paymentLabel} hint={t.paymentHint} isAr={isAr}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {t.payments.map((p) => {
                  const on = form.payment_plan === p.val;
                  return (
                    <button key={p.val} type="button" onClick={() => setField('payment_plan', p.val)}
                      style={{ flex: '1 1 140px', textAlign: isAr ? 'right' : 'left', padding: '11px 14px', borderRadius: 'var(--radius-control)', cursor: 'pointer', ...font,
                        border: on ? '1px solid #1a1814' : '1px solid var(--border)', background: on ? '#1a1814' : 'var(--bg-base)', color: on ? '#fff' : 'var(--text-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{p.label}</span>
                        {p.hint && <span style={{ fontSize: 11, opacity: on ? 0.85 : 0.6 }}>{p.hint}</span>}
                      </span>
                      {on && <span style={{ fontSize: 13, flex: '0 0 auto' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </FieldCard>

            {/* WhatsApp phone */}
            <FieldCard icon={ICONS.wa} label={t.phoneLabel} hint={t.phoneHint} isAr={isAr}>
              <input className="form-input" value={form.phone} onChange={(e) => setField('phone', e.target.value)}
                type="tel" inputMode="tel" dir="ltr" placeholder="+966 5X XXX XXXX" />
            </FieldCard>

            {!!error && <p style={{ ...font, color: '#a05050', fontSize: 13, marginTop: 14 }}>{error}</p>}
            {!user && <p style={{ ...font, fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>{t.signinNote}</p>}

            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexDirection: isAr ? 'row-reverse' : 'row' }}>
              <button type="button" className={`fx-btn-ghost${arc}`} onClick={saveDraft}>{t.draft}</button>
              <button type="button" className={`fx-btn-primary${arc}`} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? t.submitting : (<>{t.submit}<span aria-hidden style={{ fontSize: 17, lineHeight: 1 }}>{isAr ? '←' : '→'}</span></>)}
              </button>
            </div>

            <p style={{ ...font, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 16 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {t.security}
            </p>
          </>
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, insetInlineStart: '50%', transform: 'translateX(-50%)', background: '#1a1814', color: '#fff', padding: '10px 20px', borderRadius: 999, fontSize: 13, ...font, zIndex: 50 }}>{toast}</div>
      )}

      <Footer lang={lang} />
    </div>
  );
}
