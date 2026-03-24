import Footer from '../components/Footer';
import React from 'react';

const T = {
  ar: { title:'تواصل معنا', sub:'نحن هنا للمساعدة.', wa:'واتساب', email:'البريد الإلكتروني' },
  en: { title:'Contact Us', sub:'We are here to help.', wa:'WhatsApp', email:'Email' },
  zh: { title:'联系我们', sub:'我们随时为您提供帮助。', wa:'WhatsApp', email:'电子邮件' }
};

export default function Contact({ lang }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'var(--bg-base)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', padding: '64px 48px', width: '100%', maxWidth: 480, textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <h2 style={{ fontSize: 42, fontWeight: 300, marginBottom: 12, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)' }}>{t.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 48, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{t.sub}</p>
          <a href="https://wa.me/9665XXXXXXXX" style={styles.btn}>
            <span style={{ fontSize: 24 }}>💬</span>
            <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 4 }}>{t.wa}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>+966 5X XXX XXXX</p>
            </div>
          </a>
          <a href="mailto:hello@maabar.com" style={styles.btn}>
            <span style={{ fontSize: 24 }}>✉️</span>
            <div style={{ flex: 1, textAlign: isAr ? 'right' : 'left' }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'var(--text-secondary)', marginBottom: 4 }}>{t.email}</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>hello@maabar.com</p>
            </div>
          </a>
        </div>
      </div>
      <Footer lang={lang} />
    </div>
  );
}

const styles = {
  btn: { display: 'flex', alignItems: 'center', gap: 16, padding: '20px 28px', border: '1px solid var(--border-default)', background: 'var(--bg-overlay)', textDecoration: 'none', color: 'var(--text-primary)', marginBottom: 12, borderRadius: 3 }
};
