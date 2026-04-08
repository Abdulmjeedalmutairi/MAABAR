import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';

const T = {
  ar: {
    back: '← الأسئلة الشائعة',
    eyebrow: 'مَعبر · دليل التاجر',
    title: 'أسئلة التاجر',
    items: [
      { q: 'كيف أرفع طلباً؟', a: 'اذهب إلى صفحة الطلبات واختر المسار المناسب: المُدار إذا أردت أن يتولى معبر المطابقة والتفاوض، أو المباشر إذا كان المنتج واضحاً عندك.' },
      { q: 'من يرد على طلبي؟', a: 'في المسار المُدار، يراجع فريق معبر طلبك أولاً ثم يرسله للموردين المناسبين. في المسار المباشر، يصل الطلب مباشرة للموردين المؤهلين.' },
      { q: 'كيف أقارن العروض؟', a: 'تظهر العروض داخل نفس صفحة الطلب بشكل مرتب يتيح لك المقارنة المباشرة بين السعر والمدة والشروط.' },
      { q: 'هل الدفع آمن؟', a: 'نعم. خيارات الدفع في معبر مصممة لحمايتك — يمكنك الدفع على مراحل حسب مستوى الراحة في كل صفقة.' },
      { q: 'كيف أتواصل مع المورد؟', a: 'بعد قبول العرض، يفتح معبر قناة تواصل مباشرة مع المورد مع دعم للترجمة بين العربية والصينية.' },
      { q: 'ما الفرق بين الطلب المُدار والمباشر؟', a: 'الطلب المُدار: معبر يراجعه ويطابق الموردين المناسبين ثم يعيد لك أفضل 3 خيارات. الطلب المباشر: يصل فوراً للموردين الذين يردون بعروضهم مباشرة.' },
    ],
  },
  en: {
    back: '← FAQ',
    eyebrow: 'Maabar · Trader Guide',
    title: 'Trader FAQ',
    items: [
      { q: 'How do I submit a request?', a: 'Go to the Requests page and choose your path: Managed if you want Maabar to handle matching and negotiation, or Direct if your product is already clear.' },
      { q: 'Who responds to my request?', a: 'On the managed path, Maabar reviews your request first then routes it to the right suppliers. On the direct path, it goes straight to qualified suppliers.' },
      { q: 'How do I compare offers?', a: 'Offers appear inside the same request page in a structured format that lets you compare price, lead time, and terms side by side.' },
      { q: 'Is payment safe?', a: 'Yes. Payment options on Maabar are designed to protect you — you can pay in stages based on your comfort level for each deal.' },
      { q: 'How do I communicate with a supplier?', a: 'Once you accept an offer, Maabar opens a direct channel with the supplier with translation support between Arabic and Chinese.' },
      { q: 'What is the difference between managed and direct?', a: 'Managed: Maabar reviews the request, matches suppliers, and returns the top 3 offers. Direct: it goes straight to suppliers who respond with quotes.' },
    ],
  },
  zh: {
    back: '← 常见问题',
    eyebrow: 'Maabar · 贸易商指南',
    title: '贸易商常见问题',
    items: [
      { q: '如何发布需求？', a: '进入需求页面，选择适合您的路径：如果希望 Maabar 负责匹配和谈判，请选择托管路径；如果产品已经明确，请选择直接路径。' },
      { q: '谁会回应我的需求？', a: '在托管路径中，Maabar 团队会先审核您的需求，再发送给合适的供应商。在直接路径中，需求会直接发送给符合条件的供应商。' },
      { q: '如何比较报价？', a: '报价会以结构化格式显示在同一需求页面，便于您直接比较价格、交货期和条款。' },
      { q: '付款安全吗？', a: '是的。Maabar 的付款选项旨在保护您——您可以根据每笔交易的舒适程度分阶段付款。' },
      { q: '如何与供应商沟通？', a: '接受报价后，Maabar 会为您开通与供应商的直接沟通渠道，并支持中阿语言互译。' },
      { q: '托管路径和直接路径有什么区别？', a: '托管路径：Maabar 审核需求、匹配供应商，并返回最佳 3 个方案。直接路径：需求直接发送给供应商，供应商直接报价。' },
    ],
  },
};

export default function FAQTraders({ lang }) {
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
