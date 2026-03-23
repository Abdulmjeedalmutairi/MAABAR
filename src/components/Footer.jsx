import React from 'react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <footer style={{
      background: '#2C2C2C',
      padding: '64px 60px 32px',
    }}>

      {/* MAIN CONTENT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
        gap: 48,
        marginBottom: 48,
        direction: isAr ? 'rtl' : 'ltr',
      }}>

        {/* LOGO + TAGLINE */}
        <div>
          <div style={{
            fontFamily: 'var(--font-en)', fontSize: 18,
            fontWeight: 600, color: '#F7F5F2', letterSpacing: 2,
            marginBottom: 16,
          }}>
            MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 14, opacity: 0.7 }}>| مَعبر</span>
          </div>
          <p style={{
            fontSize: 14, color: 'rgba(247,245,242,0.4)',
            lineHeight: 1.8, maxWidth: 220,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
          }}>
            {t.tagline}
          </p>
        </div>

        {/* PLATFORM */}
        <div>
          <p style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: 'rgba(247,245,242,0.3)', marginBottom: 20,
            fontFamily: 'var(--font-body)',
          }}>
            {t.platform}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.links.platform.map((l, i) => (
              <button key={i} onClick={() => nav(l.path)} style={{
                background: 'none', border: 'none',
                color: 'rgba(247,245,242,0.55)', fontSize: 14,
                cursor: 'pointer', padding: 0,
                textAlign: isAr ? 'right' : 'left',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#F7F5F2'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(247,245,242,0.55)'}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* FOR BUYERS */}
        <div>
          <p style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: 'rgba(247,245,242,0.3)', marginBottom: 20,
            fontFamily: 'var(--font-body)',
          }}>
            {t.forBuyers}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.links.buyers.map((l, i) => (
              <button key={i} onClick={() => nav(l.path)} style={{
                background: 'none', border: 'none',
                color: 'rgba(247,245,242,0.55)', fontSize: 14,
                cursor: 'pointer', padding: 0,
                textAlign: isAr ? 'right' : 'left',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#F7F5F2'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(247,245,242,0.55)'}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* FOR SUPPLIERS */}
        <div>
          <p style={{
            fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            color: 'rgba(247,245,242,0.3)', marginBottom: 20,
            fontFamily: 'var(--font-body)',
          }}>
            {t.forSuppliers}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.links.suppliers.map((l, i) => (
              <button key={i} onClick={() => nav(l.path)} style={{
                background: 'none', border: 'none',
                color: 'rgba(247,245,242,0.55)', fontSize: 14,
                cursor: 'pointer', padding: 0,
                textAlign: isAr ? 'right' : 'left',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#F7F5F2'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(247,245,242,0.55)'}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div style={{
        borderTop: '1px solid rgba(247,245,242,0.08)',
        paddingTop: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        direction: isAr ? 'rtl' : 'ltr',
      }}>
        <p style={{
          color: 'rgba(247,245,242,0.25)', fontSize: 13,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
        }}>
          {t.copy}
        </p>
        <div style={{ display: 'flex', gap: 16 }}>
          {['AR', 'EN', '中文'].map((l, i) => (
            <span key={i} style={{
              fontSize: 11, color: 'rgba(247,245,242,0.2)',
              letterSpacing: 1,
            }}>
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* MOBILE */}
      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}