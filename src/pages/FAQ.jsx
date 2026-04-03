import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';

const T = {
  ar: {
    eyebrow: 'مَعبر · مركز المساعدة',
    title: 'الأسئلة الشائعة',
    intro: 'اختر المسار المناسب لك للوصول إلى إجابات واضحة ومختصرة حسب دورك داخل المنصة.',
    traderTitle: 'أسئلة التاجر',
    traderText: 'كل ما يحتاجه التاجر عن الطلبات، الدفع، مقارنة العروض، الشحن، والتواصل مع الموردين.',
    supplierTitle: 'أسئلة المورد',
    supplierText: 'إجابات خاصة بالموردين حول التسجيل، التحقق، العروض، المدفوعات، وما الذي يحدث بعد المراجعة.',
    traderCta: 'اذهب إلى أسئلة التاجر',
    supplierCta: 'اذهب إلى أسئلة المورد',
    termsLabel: 'تحتاج الشروط والأحكام؟',
    termsCta: 'افتح الشروط والأحكام',
  },
  en: {
    eyebrow: 'Maabar · Help Center',
    title: 'Frequently Asked Questions',
    intro: 'Choose the path that fits your role to get clear, focused answers without clutter.',
    traderTitle: 'Trader FAQ',
    traderText: 'Everything traders need to know about requests, payments, comparing offers, shipping, and supplier communication.',
    supplierTitle: 'Supplier FAQ',
    supplierText: 'Role-specific answers for suppliers covering registration, verification, quoting, payouts, and review status.',
    traderCta: 'Open Trader FAQ',
    supplierCta: 'Open Supplier FAQ',
    termsLabel: 'Need the legal page too?',
    termsCta: 'Open Terms & Conditions',
  },
  zh: {
    eyebrow: 'Maabar · 帮助中心',
    title: '常见问题',
    intro: '请选择适合您身份的入口，查看更清晰、更聚焦的常见问题解答。',
    traderTitle: '贸易商常见问题',
    traderText: '面向贸易商的说明：需求发布、付款、比价、运输以及与供应商沟通。',
    supplierTitle: '供应商常见问题',
    supplierText: '面向供应商的说明：注册、认证、报价、收款以及审核期间会发生什么。',
    traderCta: '打开贸易商 FAQ',
    supplierCta: '打开供应商 FAQ',
    termsLabel: '还需要法律条款页面？',
    termsCta: '打开条款与条件',
  },
};

function FaqRoleCard({ title, text, cta, onClick, isAr }) {
  return (
    <div
      style={{
        border: '1px solid var(--border-subtle)',
        borderRadius: 28,
        background: 'var(--bg-raised)',
        padding: 30,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 260,
      }}
    >
      <div>
        <h2
          style={{
            margin: '0 0 14px',
            fontSize: isAr ? 28 : 30,
            lineHeight: 1.2,
            fontWeight: 300,
            color: 'var(--text-primary)',
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.9,
            color: 'var(--text-secondary)',
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            maxWidth: 460,
          }}
        >
          {text}
        </p>
      </div>

      <button
        onClick={onClick}
        style={{
          marginTop: 28,
          minHeight: 48,
          borderRadius: 14,
          border: 'none',
          background: 'var(--text-primary)',
          color: 'var(--bg-base)',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          alignSelf: 'flex-start',
          padding: '0 18px',
        }}
      >
        {cta}
      </button>
    </div>
  );
}

export default function FAQ({ lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  usePageTitle('faq', lang);

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>
      <section
        className="faq-landing-hero"
        style={{
          padding: '80px 60px 44px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p
            style={{
              margin: '0 0 18px',
              fontSize: 11,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {t.eyebrow}
          </p>
          <h1
            style={{
              margin: '0 0 18px',
              fontSize: isAr ? 50 : 58,
              lineHeight: 1.08,
              fontWeight: 300,
              color: 'var(--text-primary)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
            }}
          >
            {t.title}
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: 720,
              fontSize: 15,
              lineHeight: 1.9,
              color: 'var(--text-secondary)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {t.intro}
          </p>
        </div>
      </section>

      <section className="faq-landing-grid-wrap" style={{ padding: '40px 60px 32px' }}>
        <div
          className="faq-main-grid"
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 24,
          }}
        >
          <FaqRoleCard
            title={t.traderTitle}
            text={t.traderText}
            cta={t.traderCta}
            onClick={() => nav('/faq/traders')}
            isAr={isAr}
          />
          <FaqRoleCard
            title={t.supplierTitle}
            text={t.supplierText}
            cta={t.supplierCta}
            onClick={() => nav('/faq/suppliers')}
            isAr={isAr}
          />
        </div>
      </section>

      <section className="faq-landing-footer-cta" style={{ padding: '0 60px 80px' }}>
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            border: '1px solid var(--border-subtle)',
            borderRadius: 24,
            background: 'var(--bg-overlay)',
            padding: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: 'var(--text-secondary)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {t.termsLabel}
          </p>
          <button
            onClick={() => nav('/terms')}
            style={{
              minHeight: 44,
              borderRadius: 999,
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              padding: '0 18px',
            }}
          >
            {t.termsCta}
          </button>
        </div>
      </section>

      <Footer lang={lang} />

      <style>{`
        @media (max-width: 768px) {
          .faq-main-grid {
            grid-template-columns: 1fr !important;
          }

          .faq-landing-hero,
          .faq-landing-grid-wrap,
          .faq-landing-footer-cta {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
