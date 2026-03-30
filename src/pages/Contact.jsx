import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const T = {
  ar: {
    title: 'تواصل معنا',
    sub: 'نحن هنا للمساعدة.',
    wa: 'واتساب',
    email: 'البريد الإلكتروني',
    support: 'الدعم الذكي 24/7',
    supportSub: 'ابدأ مع وكيل معبر للدعم الفوري داخل المنصة',
    supportBtn: 'افتح الدعم',
  },
  en: {
    title: 'Contact Us',
    sub: 'We are here to help.',
    wa: 'WhatsApp',
    email: 'Email',
    support: 'AI Support 24/7',
    supportSub: 'Start with وكيل معبر for instant help inside the platform',
    supportBtn: 'Open Support',
  },
  zh: {
    title: '联系我们',
    sub: '我们随时为您提供帮助。',
    wa: 'WhatsApp',
    email: '电子邮件',
    support: '24/7 智能支持',
    supportSub: '通过 وكيل معبر 立即获得平台内协助',
    supportBtn: '打开支持',
  }
};

export default function Contact({ lang }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const nav = useNavigate();
  usePageTitle('contact', lang);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', padding: '64px 48px', width: '100%', maxWidth: 560, textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: 42, fontWeight: 300, marginBottom: 12, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>{t.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{t.sub}</p>

          <button onClick={() => nav('/support')} style={{ ...styles.supportBtn, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
            <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(139,120,255,0.85)', marginBottom: 4 }}>{t.support}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{t.supportBtn}</p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{t.supportSub}</p>
            </div>
          </button>

          <a href="https://wa.me/966504248942" style={styles.btn}>
            <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 4 }}>{t.wa}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>+966 50 424 8942</p>
            </div>
          </a>
          <a href="mailto:support@maabar.io" style={styles.btn}>
            <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 4 }}>{t.email}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>support@maabar.io</p>
            </div>
          </a>
        </div>
      </div>
      <Footer lang={lang} />
    </div>
  );
}

const styles = {
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 28px',
    border: '1px solid var(--border-default)',
    background: 'var(--bg-overlay)',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    marginBottom: 12,
    borderRadius: 12,
  },
  supportBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '20px 28px',
    border: '1px solid rgba(139,120,255,0.2)',
    background: 'rgba(139,120,255,0.06)',
    color: 'var(--text-primary)',
    marginBottom: 12,
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'inherit',
  },
};
