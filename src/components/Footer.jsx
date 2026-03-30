import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const T = {
  ar: {
    tagline: 'الجسر الآمن بين التاجر السعودي والمورد الصيني',
    platform: 'المنصة',
    forBuyers: 'للتجار',
    forSuppliers: 'للموردين',
    links: {
      platform: [
        { label: 'عن معبر', path: '/about' },
        { label: 'الأسئلة الشائعة', path: '/faq' },
        { label: 'الشروط والأحكام', path: '/terms' },
        { label: 'تواصل معنا', path: '/contact' },
      ],
      buyers: [
        { label: 'ارفع طلبك', path: '/requests' },
        { label: 'تصفح المنتجات', path: '/products' },
        { label: 'تصفح الموردين', path: '/suppliers' },
      ],
      suppliers: [
        { label: 'انضم كمورد', path: '/login/supplier' },
        { label: 'بوابة الموردين', path: '/supplier' },
      ],
    },
    copy: 'مَعبر © 2026 · جميع الحقوق محفوظة',
  },
  en: {
    tagline: 'The secure bridge between Saudi traders and Chinese suppliers',
    platform: 'Platform',
    forBuyers: 'For Buyers',
    forSuppliers: 'For Suppliers',
    links: {
      platform: [
        { label: 'About Maabar', path: '/about' },
        { label: 'FAQ', path: '/faq' },
        { label: 'Terms & Conditions', path: '/terms' },
        { label: 'Contact Us', path: '/contact' },
      ],
      buyers: [
        { label: 'Post a Request', path: '/requests' },
        { label: 'Browse Products', path: '/products' },
        { label: 'Browse Suppliers', path: '/suppliers' },
      ],
      suppliers: [
        { label: 'Join as Supplier', path: '/login/supplier' },
        { label: 'Supplier Portal', path: '/supplier' },
      ],
    },
    copy: 'Maabar © 2026 · All rights reserved',
  },
  zh: {
    tagline: '连接沙特贸易商与中国供应商的安全桥梁',
    platform: '平台',
    forBuyers: '采购商',
    forSuppliers: '供应商',
    links: {
      platform: [
        { label: '关于Maabar', path: '/about' },
        { label: '常见问题', path: '/faq' },
        { label: '条款与条件', path: '/terms' },
        { label: '联系我们', path: '/contact' },
      ],
      buyers: [
        { label: '发布需求', path: '/requests' },
        { label: '浏览产品', path: '/products' },
        { label: '浏览供应商', path: '/suppliers' },
      ],
      suppliers: [
        { label: '加入成为供应商', path: '/login/supplier' },
        { label: '供应商门户', path: '/supplier' },
      ],
    },
    copy: 'Maabar © 2026 · 保留所有权利',
  },
};

export default function Footer({ lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const linkBtn = (l, i) => (
    <button key={i} onClick={() => nav(l.path)} style={{
      background: 'none', border: 'none',
      color: 'var(--text-secondary)', fontSize: 13,
      cursor: 'pointer', padding: 0,
      textAlign: isAr ? 'right' : 'left',
      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
      transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
      {l.label}
    </button>
  );

  return (
    <footer style={{
      background: 'var(--bg-overlay)',
      padding: '48px 40px 28px',
    }}>

      {/* DESKTOP GRID */}
      <div className="footer-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
        gap: 40,
        marginBottom: 40,
        direction: isAr ? 'rtl' : 'ltr',
      }}>

        {/* LOGO + TAGLINE */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <BrandLogo size="sm" align={isAr ? 'flex-end' : 'flex-start'} />
          </div>
          <p style={{
            fontSize: 13, color: 'var(--text-tertiary)',
            lineHeight: 1.8, maxWidth: 220,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {t.tagline}
          </p>
        </div>

        {/* PLATFORM */}
        <div>
          <p style={{
            fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
            color: 'var(--text-disabled)', marginBottom: 16,
            fontFamily: 'var(--font-sans)',
          }}>
            {t.platform}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {t.links.platform.map(linkBtn)}
          </div>
        </div>

        {/* FOR BUYERS */}
        <div>
          <p style={{
            fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
            color: 'var(--text-disabled)', marginBottom: 16,
            fontFamily: 'var(--font-sans)',
          }}>
            {t.forBuyers}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {t.links.buyers.map(linkBtn)}
          </div>
        </div>

        {/* FOR SUPPLIERS */}
        <div>
          <p style={{
            fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
            color: 'var(--text-disabled)', marginBottom: 16,
            fontFamily: 'var(--font-sans)',
          }}>
            {t.forSuppliers}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {t.links.suppliers.map(linkBtn)}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        direction: isAr ? 'rtl' : 'ltr',
      }}>
        <p style={{
          color: 'var(--text-disabled)', fontSize: 12,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {t.copy}
        </p>
        <div style={{ display: 'flex', gap: 14 }}>
          {['AR', 'EN', '中文'].map((l, i) => (
            <span key={i} style={{
              fontSize: 10, color: 'var(--text-disabled)',
              letterSpacing: 1,
            }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </footer>
  );
}
