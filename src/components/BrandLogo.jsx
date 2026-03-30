import React from 'react';

export default function BrandLogo({
  as: Component = 'div',
  onClick,
  size = 'md',
  muted = false,
  align = 'center',
}) {
  const sizes = {
    sm: {
      en: 14,
      ar: 15,
      sep: 13,
      zh: 11,
      gap: 8,
      chineseMargin: 6,
      tracking: '0.14em',
    },
    md: {
      en: 16,
      ar: 17,
      sep: 14,
      zh: 12,
      gap: 10,
      chineseMargin: 8,
      tracking: '0.16em',
    },
    lg: {
      en: 18,
      ar: 20,
      sep: 16,
      zh: 13,
      gap: 12,
      chineseMargin: 10,
      tracking: '0.18em',
    },
  };

  const s = sizes[size] || sizes.md;
  const primary = muted ? 'var(--text-disabled)' : 'var(--text-primary)';
  const secondary = muted ? 'var(--text-tertiary)' : 'var(--text-secondary)';
  const Comp = Component;

  return (
    <Comp
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: align,
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        lineHeight: 1,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: s.gap,
          direction: 'ltr',
          unicodeBidi: 'isolate',
        }}
      >
        <span
          dir="ltr"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: s.en,
            fontWeight: 700,
            letterSpacing: s.tracking,
            color: primary,
            textTransform: 'uppercase',
            unicodeBidi: 'isolate',
          }}
        >
          MAABAR
        </span>
        <span style={{ fontSize: s.sep, color: secondary }}>|</span>
        <span
          dir="rtl"
          style={{
            fontFamily: 'var(--font-ar)',
            fontSize: s.ar,
            fontWeight: 600,
            letterSpacing: 0,
            color: primary,
            unicodeBidi: 'isolate',
          }}
        >
          مَعبر
        </span>
      </div>
      <span
        dir="ltr"
        style={{
          marginTop: s.chineseMargin,
          alignSelf: 'center',
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: s.zh,
          color: secondary,
          letterSpacing: '0.04em',
          lineHeight: 1,
          unicodeBidi: 'isolate',
        }}
      >
        迈巴尔
      </span>
    </Comp>
  );
}
