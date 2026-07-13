import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { SECTIONS } from '../lib/terms';

const CR_NUMBER = '7042243308';
const CONTACT_EMAIL = 'info@maabar.io';
const WEBSITE_URL = 'https://maabar.io';

const T = {
  ar: {
    eyebrow: 'مَعبر · الشروط والأحكام',
    title: 'الشروط والأحكام',
    intro: 'تم إعداد هذه الصفحة بصياغة عربية مرجعية، مع إبقائها جاهزة لبنية متعددة اللغات داخل الموقع. باستخدام مَعبر فإنك توافق على هذه الشروط والأحكام.',
    referenceNote: 'النسخة العربية هي المرجع الأساسي لهذه الصفحة في الوقت الحالي.',
    companyLabel: 'السجل التجاري',
    emailLabel: 'البريد الإلكتروني',
    websiteLabel: 'الموقع الإلكتروني',
  },
  en: {
    eyebrow: 'Maabar · Terms & Conditions',
    title: 'Terms & Conditions',
    intro: 'This page is structured for multilingual support while keeping the Arabic legal wording as the primary reference source for now. By using Maabar, you agree to these terms and conditions.',
    referenceNote: 'For now, the Arabic version remains the primary reference of this page.',
    companyLabel: 'CR Number',
    emailLabel: 'Email',
    websiteLabel: 'Website',
  },
  zh: {
    eyebrow: 'Maabar · 条款与条件',
    title: '条款与条件',
    intro: '此页面已按多语言结构准备，但目前仍以阿拉伯语法律文本作为主要参考来源。使用 Maabar 即表示您同意这些条款与条件。',
    referenceNote: '当前页面仍以阿拉伯语版本作为主要参考。',
    companyLabel: '商业登记号',
    emailLabel: '邮箱',
    websiteLabel: '网站',
  },
};

export default function Terms({ lang }) {
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const sections = SECTIONS[lang] || SECTIONS.ar;

  usePageTitle('terms', lang);

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>
      <section className="terms-hero" style={{ padding: '80px 60px 40px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <p style={{ margin: '0 0 18px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)' }}>
            {t.eyebrow}
          </p>
          <h1 style={{ margin: '0 0 18px', fontSize: isAr ? 50 : 58, lineHeight: 1.08, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>
            {t.title}
          </h1>
          <p style={{ margin: '0 0 16px', maxWidth: 760, fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.intro}
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.referenceNote}
          </p>
        </div>
      </section>

      <section className="terms-body" style={{ padding: '32px 60px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {sections.map((section) => (
            <article key={section.title} style={{ border: '1px solid var(--border-subtle)', borderRadius: 24, background: 'var(--bg-base)', padding: '24px 24px 22px' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: isAr ? 24 : 22, lineHeight: 1.4, fontWeight: 400, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {section.title}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: 'var(--text-secondary)', whiteSpace: 'pre-line', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {section.body}
              </p>
            </article>
          ))}
          <p style={{ margin: '10px 4px 0', fontSize: 13, lineHeight: 1.8, color: 'var(--text-disabled)', textAlign: isAr ? 'right' : 'left', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.companyLabel}: <span style={{ fontFamily: 'var(--font-sans)' }}>{CR_NUMBER}</span>
          </p>
        </div>
      </section>

      <Footer lang={lang} />

      <style>{`
        @media (max-width: 900px) {
          .terms-meta-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 768px) {
          .terms-hero,
          .terms-meta-wrap,
          .terms-body {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }

          .terms-meta-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
