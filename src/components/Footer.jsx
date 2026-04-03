import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const CR_NUMBER = '7042243308';
const CONTACT_EMAIL = 'info@maabar.io';

const T = {
  ar: {
    links: [
      { label: 'عن معبر', path: '/about' },
      { label: 'الأسئلة الشائعة', path: '/faq' },
      { label: 'الشروط والأحكام', path: '/terms' },
      { label: 'تواصل معنا', path: '/contact' },
    ],
    crLabel: 'السجل التجاري',
    copy: 'معبر © 2026 · جميع الحقوق محفوظة',
  },
  en: {
    links: [
      { label: 'About Maabar', path: '/about' },
      { label: 'FAQ', path: '/faq' },
      { label: 'Terms & Conditions', path: '/terms' },
      { label: 'Contact Us', path: '/contact' },
    ],
    crLabel: 'CR No.',
    copy: 'Maabar © 2026 · All rights reserved',
  },
  zh: {
    links: [
      { label: '关于 Maabar', path: '/about' },
      { label: '常见问题', path: '/faq' },
      { label: '条款与条件', path: '/terms' },
      { label: '联系我们', path: '/contact' },
    ],
    crLabel: '商业登记号',
    copy: 'Maabar © 2026 · 保留所有权利',
  },
};

export default function Footer({ lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const linkBtn = (link) => (
    <button
      key={link.path}
      onClick={() => nav(link.path)}
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary)',
        fontSize: 12,
        lineHeight: 1.5,
        cursor: 'pointer',
        padding: 0,
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        transition: 'color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {link.label}
    </button>
  );

  return (
    <footer
      className={`site-footer ${isAr ? 'is-ar' : 'is-ltr'}`}
      style={{
        background: 'var(--bg-overlay)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '22px 20px 14px',
        display: 'block',
        width: '100%',
      }}
    >
      <div
        className="site-footer-shell"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          direction: isAr ? 'rtl' : 'ltr',
          maxWidth: 1080,
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div
          className="footer-top"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'nowrap',
          }}
        >
          <div className="footer-brand" style={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
            <BrandLogo size="sm" align={isAr ? 'flex-end' : 'flex-start'} />
          </div>

          <div
            className="footer-meta"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isAr ? 'flex-end' : 'flex-start',
              gap: 10,
              flex: 1,
              minWidth: 0,
            }}
          >
            <div
              className="footer-links"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px 18px',
                alignItems: 'center',
                justifyContent: isAr ? 'flex-end' : 'flex-start',
              }}
            >
              {t.links.map(linkBtn)}
            </div>
          </div>

          <div
            className="footer-contact-wrap"
            style={{
              display: 'flex',
              alignItems: isAr ? 'flex-end' : 'flex-start',
              justifyContent: isAr ? 'flex-start' : 'flex-end',
              minWidth: 'fit-content',
            }}
          >
            <a
              className="footer-contact"
              href={`mailto:${CONTACT_EMAIL}`}
              style={{
                color: 'var(--text-secondary)',
                fontSize: 12,
                textDecoration: 'none',
                fontFamily: 'var(--font-sans)',
                direction: 'ltr',
                whiteSpace: 'nowrap',
              }}
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>

        <div
          className="footer-bottom"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            direction: isAr ? 'rtl' : 'ltr',
          }}
        >
          <p
            style={{
              margin: 0,
              color: 'var(--text-disabled)',
              fontSize: 11,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {t.copy}
          </p>

          <div
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}
            >
              {t.crLabel} {CR_NUMBER}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .site-footer {
            display: block !important;
            padding: 24px 28px 16px !important;
          }

          .site-footer-shell {
            width: 100%;
            max-width: 1180px !important;
          }

          .footer-top {
            display: grid !important;
            grid-template-columns: minmax(160px, auto) minmax(0, 1fr) minmax(190px, auto);
            align-items: center !important;
            gap: 32px !important;
          }

          .footer-brand {
            justify-content: flex-start;
          }

          .site-footer.is-ar .footer-brand {
            justify-content: flex-end;
          }

          .site-footer.is-ar .footer-meta,
          .site-footer.is-ar .footer-links {
            justify-content: flex-end !important;
            text-align: right;
          }

          .site-footer.is-ltr .footer-meta,
          .site-footer.is-ltr .footer-links {
            justify-content: flex-start !important;
            text-align: left;
          }

          .footer-links {
            width: 100%;
          }

          .footer-contact-wrap {
            justify-content: flex-end !important;
          }

          .site-footer.is-ar .footer-contact-wrap {
            justify-content: flex-start !important;
          }

          .footer-bottom {
            gap: 16px !important;
          }
        }

        @media (max-width: 768px) {
          .footer-top {
            flex-direction: column !important;
            align-items: center !important;
            gap: 14px !important;
          }

          .footer-meta {
            width: 100%;
            align-items: center !important;
          }

          .footer-contact-wrap {
            width: 100%;
            justify-content: center !important;
          }

          .footer-links {
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 18px !important;
            justify-items: center;
          }

          .footer-links > * {
            text-align: center !important;
          }

          .footer-bottom {
            justify-content: center !important;
          }

          .footer-contact {
            align-self: center !important;
          }
        }
      `}</style>
    </footer>
  );
}
