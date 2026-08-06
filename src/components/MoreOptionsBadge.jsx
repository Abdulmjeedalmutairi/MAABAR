import React from 'react';

// Shown on a CURATED representative product: the catalog import keeps one
// representative per category and curates away the near-duplicates/variants, so
// this badge tells the buyer the factory's range in this category runs deeper
// than what's shown ("+N more options in this category"). count = same-category
// products that were curated away (factory_products.also_count); 0 → nothing.
export default function MoreOptionsBadge({ count = 0, lang = 'ar', style }) {
  const n = parseInt(count, 10) || 0;
  if (n <= 0) return null;
  const isAr = lang === 'ar';
  const label = lang === 'zh'
    ? `本类另有 ${n} 款`
    : isAr
      ? `+${n} ${n === 1 ? 'خيار آخر' : 'خيارات أخرى'} في هذه الفئة`
      : `+${n} more ${n === 1 ? 'option' : 'options'} in this range`;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99,
      fontSize: 10.5, fontWeight: 600, lineHeight: 1.45, whiteSpace: 'nowrap',
      color: '#2D6A4F', background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.22)',
      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', ...style,
    }}>
      <span aria-hidden style={{ fontSize: 10 }}>⋯</span>{label}
    </span>
  );
}
