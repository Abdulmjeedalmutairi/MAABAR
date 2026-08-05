import React from 'react';
import { normalizeCerts, certName, normCertCode, CERT_GREEN, CERT_GREEN_BG, CERT_GREEN_BORDER } from '../lib/certifications';

// Distinctive green certification pills for the factory card + profile. The pill
// shows the abbreviation; the full meaning is the tooltip (title). Unknown certs
// render identically, using whatever name was stored for them.
export default function CertPills({ certs, lang = 'ar', size = 'sm', max = 0, style }) {
  const isAr = lang === 'ar';
  const list = normalizeCerts(certs);
  if (!list.length) return null;

  const shown = max > 0 ? list.slice(0, max) : list;
  const extra = list.length - shown.length;
  const pad = size === 'lg' ? '4px 10px' : '2px 8px';
  const fs = size === 'lg' ? 12 : 11;

  const pill = (label, title, key) => (
    <span key={key} title={title || (isAr ? 'شهادة' : 'Certification')}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: pad, borderRadius: 99,
        fontSize: fs, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap',
        color: CERT_GREEN, background: CERT_GREEN_BG, border: `1px solid ${CERT_GREEN_BORDER}`,
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
      }}>
      <span aria-hidden style={{ fontSize: fs - 1 }}>✓</span>{label}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, ...style }}>
      {shown.map((c, i) => pill(normCertCode(c.code) || c.code, certName(c, lang), i))}
      {extra > 0 && pill(`+${extra}`, list.slice(shown.length).map((c) => normCertCode(c.code)).join(' · '), 'more')}
    </div>
  );
}
