import React from 'react';
import { buildProductChips } from '../lib/productChips';

// Small bronze-on-cream selling-point chips under a product name. Deliberately
// lighter than the price and the green certification pills — an at-a-glance
// signal, not a call to action.
export default function ProductChips({ product, factory, lang = 'ar', max = 0, style }) {
  const isAr = lang === 'ar';
  const chips = buildProductChips({ product, factory });
  if (!chips.length) return null;
  const shown = max > 0 ? chips.slice(0, max) : chips;
  const label = (c) => (lang === 'zh' ? c.zh : isAr ? c.ar : c.en);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, ...style }}>
      {shown.map((c) => (
        <span key={c.key} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99,
          fontSize: 10.5, fontWeight: 600, lineHeight: 1.45, whiteSpace: 'nowrap',
          color: '#8B7355', background: 'rgba(139,115,85,0.08)', border: '1px solid rgba(139,115,85,0.20)',
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          <span aria-hidden style={{ fontSize: 9.5 }}>{c.icon}</span>{label(c)}
        </span>
      ))}
    </div>
  );
}
