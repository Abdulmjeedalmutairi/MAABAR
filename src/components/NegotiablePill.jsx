import React from 'react';

// Shown wherever a CONCRETE price renders: our catalog prices are negotiation
// starting points (settled via the request/chat flow), not fixed retail. Bronze-
// on-cream — an invitation to negotiate, not a "sale" warning. Never shown for
// "On request" (that already implies no fixed price).
export default function NegotiablePill({ lang = 'ar', long = false, style }) {
  const isAr = lang === 'ar';
  const label = long
    ? (lang === 'zh' ? '可与工厂议价' : isAr ? 'فاوض المصنع على سعر أفضل' : 'Negotiate a better price')
    : (lang === 'zh' ? '可议价' : isAr ? 'قابل للتفاوض' : 'Negotiable');

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99,
      fontSize: 10.5, fontWeight: 600, lineHeight: 1.45, whiteSpace: 'nowrap',
      color: '#8B7355', background: 'rgba(139,115,85,0.08)', border: '1px solid rgba(139,115,85,0.22)',
      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', ...style,
    }}>
      <span aria-hidden style={{ fontSize: 10 }}>🤝</span>{label}
    </span>
  );
}
