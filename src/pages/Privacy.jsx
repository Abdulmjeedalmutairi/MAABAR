import React from 'react';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { SECTIONS } from '../lib/terms';

// Privacy is a standalone surface extracted from the Terms source of truth
// (src/lib/terms.js). We pull only the two privacy-relevant sections —
// "Privacy and Data Protection" and "Technical Security" — so the wording
// can never drift from the Terms page. The leading clause numbers ("13." /
// "14.") are stripped at render time since they reference a document this
// page is no longer part of; terms.js itself is left untouched.
const PRIVACY_TITLE_PREFIXES = ['13.', '14.'];
const stripClauseNumber = (title) => title.replace(/^\s*\d+\.\s*/, '');

const T = {
  ar: {
    eyebrow: 'مَعبر · سياسة الخصوصية',
    title: 'سياسة الخصوصية',
    intro: 'توضّح هذه الصفحة كيف تجمع مَعبر بياناتك الشخصية وتحميها، وحقوقك المتعلقة بها، وذلك التزاماً بنظام حماية البيانات الشخصية السعودي (PDPL).',
    referenceNote: 'النسخة العربية هي المرجع الأساسي لهذه الصفحة في الوقت الحالي.',
  },
  en: {
    eyebrow: 'Maabar · Privacy Policy',
    title: 'Privacy Policy',
    intro: 'This page explains how Maabar collects and protects your personal data and the rights you have over it, in compliance with the Saudi Personal Data Protection Law (PDPL).',
    referenceNote: 'For now, the Arabic version remains the primary reference of this page.',
  },
  zh: {
    eyebrow: 'Maabar · 隐私政策',
    title: '隐私政策',
    intro: '本页面说明 Maabar 如何收集和保护您的个人数据以及您对其享有的权利，并遵守沙特个人数据保护法（PDPL）。',
    referenceNote: '当前页面仍以阿拉伯语版本作为主要参考。',
  },
};

export default function Privacy({ lang }) {
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const allSections = SECTIONS[lang] || SECTIONS.ar;
  const sections = allSections.filter((section) =>
    PRIVACY_TITLE_PREFIXES.some((prefix) => section.title.trim().startsWith(prefix))
  );

  usePageTitle('privacy', lang);

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>
      <section className="privacy-hero" style={{ padding: '80px 60px 40px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
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

      <section className="privacy-body" style={{ padding: '40px 60px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {sections.map((section) => (
            <article key={section.title} style={{ border: '1px solid var(--border-subtle)', borderRadius: 24, background: 'var(--bg-base)', padding: '24px 24px 22px' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: isAr ? 24 : 22, lineHeight: 1.4, fontWeight: 400, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {stripClauseNumber(section.title)}
              </h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 2, color: 'var(--text-secondary)', whiteSpace: 'pre-line', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <Footer lang={lang} />

      <style>{`
        @media (max-width: 768px) {
          .privacy-hero,
          .privacy-body {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
