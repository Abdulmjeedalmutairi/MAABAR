import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';

const T = {
  ar: {
    back: '← الأسئلة الشائعة',
    eyebrow: 'مَعبر · دليل المورد',
    title: 'أسئلة المورد',
    items: [
      { q: 'كيف أسجّل كمورد في معبر؟', a: 'اذهب إلى بوابة الموردين واملأ نموذج التسجيل بمعلومات شركتك ومجال التخصص. سيراجع الفريق طلبك ويرد عليك خلال يومي عمل.' },
      { q: 'كيف يتم التحقق من حسابي؟', a: 'بعد التسجيل، سترسل وثائق الشركة والنماذج المطلوبة. يراجعها فريق معبر ويبلغك بالنتيجة مباشرةً عبر المنصة.' },
      { q: 'متى أبدأ باستقبال الطلبات؟', a: 'بمجرد اعتماد حسابك، تبدأ بظهور الطلبات المطابقة لتخصصك داخل لوحة التحكم.' },
      { q: 'كيف أرد على طلب؟', a: 'داخل لوحة المورد، اختر الطلب المناسب وقدّم عرضك مع السعر والمدة والشروط. ستُراجَع العروض قبل وصولها للتاجر في مسار الطلب المُدار.' },
      { q: 'كيف يتم الدفع؟', a: 'يتم الدفع عبر معبر وفق جدول زمني متفق عليه مرتبط بمراحل التنفيذ. ستُبلَّغ بكل مرحلة دفع قبل موعدها.' },
      { q: 'ماذا يحدث إذا كان لديّ سؤال أو مشكلة؟', a: 'يمكنك التواصل مع الدعم مباشرةً من داخل المنصة. الفريق متاح لمساعدتك في أي استفسار تقني أو تشغيلي.' },
    ],
  },
  en: {
    back: '← FAQ',
    eyebrow: 'Maabar · Supplier Guide',
    title: 'Supplier FAQ',
    items: [
      { q: 'How do I register as a supplier?', a: 'Go to the Supplier Portal and fill in the registration form with your company details and speciality. The team will review your application and respond within 2 business days.' },
      { q: 'How does account verification work?', a: 'After registering, you submit company documents and any required forms. The Maabar team reviews them and notifies you of the outcome directly on the platform.' },
      { q: 'When do I start receiving requests?', a: 'Once your account is approved, requests matching your speciality begin appearing in your dashboard.' },
      { q: 'How do I respond to a request?', a: 'Inside the supplier dashboard, select the relevant request and submit your offer with price, lead time, and terms. Offers are reviewed before reaching the buyer on the managed path.' },
      { q: 'How does payment work?', a: 'Payment is processed through Maabar on an agreed schedule tied to delivery milestones. You are notified before each payment stage.' },
      { q: 'What if I have a question or issue?', a: 'You can contact support directly from inside the platform. The team is available to help with any technical or operational query.' },
    ],
  },
  zh: {
    back: '← 常见问题',
    eyebrow: 'Maabar · 供应商指南',
    title: '供应商常见问题',
    items: [
      { q: '如何注册成为供应商？', a: '前往供应商门户，填写注册表单，提供您的公司信息和专业领域。团队将在2个工作日内审核您的申请并给予回复。' },
      { q: '账户认证是怎么进行的？', a: '注册后，您需要提交公司文件及相关表格。Maabar 团队会进行审核，并直接在平台上通知您结果。' },
      { q: '什么时候开始接收需求？', a: '账户获批后，与您专业领域匹配的需求将开始出现在您的控制台中。' },
      { q: '如何回应一个需求？', a: '在供应商控制台中，选择合适的需求，提交您的报价（包括价格、交货期和条款）。在托管路径中，报价会经过审核后再发送给买家。' },
      { q: '付款是如何进行的？', a: '付款通过 Maabar 按与交付里程碑挂钩的既定时间表处理。每个付款阶段前您都会收到通知。' },
      { q: '如果我有问题或遇到问题怎么办？', a: '您可以直接从平台内联系支持团队。团队可以帮助您解决任何技术或运营方面的问题。' },
    ],
  },
};

export default function FAQSuppliers({ lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('faq', lang);

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)', direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <button
          onClick={() => nav('/faq')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', marginBottom: 36, padding: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
        >
          {t.back}
        </button>

        <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>{t.eyebrow}</p>
        <h1 style={{ fontSize: isAr ? 36 : 42, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 48, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : -1 }}>{t.title}</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {t.items.map((item, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--border-subtle)', padding: '22px 0' }}>
              <h3 style={{ fontSize: isAr ? 17 : 18, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item.q}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item.a}</p>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border-subtle)' }} />
        </div>
      </div>
      <Footer lang={lang} />
    </div>
  );
}
