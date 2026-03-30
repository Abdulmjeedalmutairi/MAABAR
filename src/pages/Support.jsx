import React from 'react';
import Footer from '../components/Footer';
import usePageTitle from '../hooks/usePageTitle';
import { MaabarSupportAgent } from '../components/MaabarSupportAgent';

const COPY = {
  ar: {
    kicker: 'دعم ذكي',
    title: 'دعم معبر 24/7',
    subtitle: 'وكيل معبر يساعدك فوراً في مشاكل الحسابات، الطلبات، الدفع، الموردين، الشحن، والترجمة التجارية.',
  },
  en: {
    kicker: 'AI Support',
    title: 'Maabar Support 24/7',
    subtitle: 'وكيل معبر helps immediately across accounts, orders, payments, suppliers, shipping, and trade translation.',
  },
  zh: {
    kicker: 'AI 支持',
    title: 'Maabar 24/7 支持',
    subtitle: 'وكيل معبر 可立即协助处理账户、订单、付款、供应商、物流与商务翻译问题。',
  },
};

export default function Support({ lang, user, profile }) {
  const t = COPY[lang] || COPY.ar;
  const isAr = lang === 'ar';
  usePageTitle('support', lang);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'var(--bg-base)' }}>
      <section style={{ padding: '54px 24px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <p style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--text-disabled)',
            marginBottom: 12,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {t.kicker}
          </p>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 300,
            color: 'var(--text-primary)',
            marginBottom: 12,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {t.title}
          </h1>
          <p style={{
            maxWidth: 780,
            fontSize: 16,
            lineHeight: 1.9,
            color: 'var(--text-secondary)',
            marginBottom: 28,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {t.subtitle}
          </p>

          <MaabarSupportAgent lang={lang} user={user} profile={profile} />
        </div>
      </section>
      <Footer lang={lang} />
    </div>
  );
}
