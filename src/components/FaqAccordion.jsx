import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FaqAccordion({
  lang,
  eyebrow,
  title,
  intro,
  items,
  backLabel,
  backPath = '/faq',
  sideCard,
}) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>
      <section
        className="faq-role-hero"
        style={{
          padding: '72px 60px 40px',
          background: 'var(--bg-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <button
            onClick={() => nav(backPath)}
            style={{
              border: '1px solid var(--border-subtle)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              minHeight: 42,
              padding: '0 16px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 12,
              marginBottom: 22,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {backLabel}
          </button>

          <div
            className="faq-role-hero-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: sideCard ? 'minmax(0, 1.8fr) minmax(280px, 0.9fr)' : '1fr',
              gap: 28,
              alignItems: 'start',
            }}
          >
            <div>
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
                {eyebrow}
              </p>
              <h1
                style={{
                  margin: '0 0 16px',
                  fontSize: isAr ? 42 : 48,
                  lineHeight: 1.1,
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
                  maxWidth: 760,
                }}
              >
                {title}
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
                {intro}
              </p>
            </div>

            {sideCard && (
              <div
                style={{
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-raised)',
                  borderRadius: 24,
                  padding: 24,
                }}
              >
                <p
                  style={{
                    margin: '0 0 8px',
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {sideCard.eyebrow}
                </p>
                <h2
                  style={{
                    margin: '0 0 12px',
                    fontSize: 20,
                    lineHeight: 1.4,
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  }}
                >
                  {sideCard.title}
                </h2>
                <p
                  style={{
                    margin: '0 0 18px',
                    fontSize: 13,
                    lineHeight: 1.8,
                    color: 'var(--text-secondary)',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  }}
                >
                  {sideCard.text}
                </p>
                {sideCard.actions?.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => nav(action.path)}
                    style={{
                      width: '100%',
                      minHeight: 46,
                      borderRadius: 14,
                      marginTop: 10,
                      border: action.variant === 'ghost'
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                      background: action.variant === 'ghost'
                        ? 'transparent'
                        : 'var(--text-primary)',
                      color: action.variant === 'ghost'
                        ? 'var(--text-secondary)'
                        : 'var(--bg-base)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="faq-role-body" style={{ padding: '32px 60px 80px' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              background: 'var(--bg-base)',
            }}
          >
            {items.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={item.q}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isOpen ? 'var(--bg-subtle)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    style={{
                      width: '100%',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 18,
                      padding: '24px 0',
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18,
                        lineHeight: 1.6,
                        color: 'var(--text-primary)',
                        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        flexShrink: 0,
                        fontSize: 22,
                        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.18s ease',
                      }}
                    >
                      +
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '0 0 24px' }}>
                      <p
                        style={{
                          margin: 0,
                          maxWidth: 860,
                          fontSize: 14,
                          lineHeight: 2,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'pre-line',
                          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                        }}
                      >
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .faq-role-hero-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .faq-role-hero,
          .faq-role-body {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
