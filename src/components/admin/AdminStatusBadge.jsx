import React from 'react';

// Maabar-approved palette only: green, amber, red, neutral — no purple, no blue
const STATUS_MAP = {
  active:                     { en: 'Active',         ar: 'نشط',           c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  verified:                   { en: 'Verified',       ar: 'موثّق',          c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  completed:                  { en: 'Completed',      ar: 'مكتمل',         c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  matched:                    { en: 'Matched',        ar: 'مطابقة',        c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  resolved_buyer:             { en: 'Resolved (B)',   ar: 'حُلّ للتاجر',    c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  resolved_supplier:          { en: 'Resolved (S)',   ar: 'حُلّ للمورد',    c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  settled:                    { en: 'Settled',        ar: 'تسوية',         c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  responded:                  { en: 'Responded',      ar: 'ردّ',            c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  shortlisted:                { en: 'Shortlisted',    ar: 'في القائمة',    c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },
  accepted:                   { en: 'Accepted',       ar: 'مقبول',         c: '#27725a', bg: 'rgba(39,114,90,0.08)',  b: 'rgba(39,114,90,0.18)' },

  verification_under_review:  { en: 'Under Review',  ar: 'قيد المراجعة',  c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },
  under_review:               { en: 'Under Review',  ar: 'قيد المراجعة',  c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },
  in_progress:                { en: 'In Progress',   ar: 'جارٍ',           c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },
  assigned:                   { en: 'Assigned',      ar: 'معيّن',           c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },
  sourcing:                   { en: 'Sourcing',      ar: 'بحث',            c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },
  mediating:                  { en: 'Mediating',     ar: 'وساطة',          c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },
  high:                       { en: 'High',          ar: 'عالية',          c: '#8B6914', bg: 'rgba(139,105,20,0.08)', b: 'rgba(139,105,20,0.18)' },

  rejected:                   { en: 'Rejected',      ar: 'مرفوض',         c: '#c0392b', bg: 'rgba(192,57,43,0.08)',  b: 'rgba(192,57,43,0.18)' },
  inactive:                   { en: 'Inactive',      ar: 'غير نشط',        c: '#c0392b', bg: 'rgba(192,57,43,0.08)',  b: 'rgba(192,57,43,0.18)' },
  dismissed:                  { en: 'Dismissed',     ar: 'مرفوض',         c: '#c0392b', bg: 'rgba(192,57,43,0.08)',  b: 'rgba(192,57,43,0.18)' },
  re_research_requested:      { en: 'Re-Research',   ar: 'إعادة بحث',      c: '#c0392b', bg: 'rgba(192,57,43,0.08)',  b: 'rgba(192,57,43,0.18)' },

  open:                       { en: 'Open',          ar: 'مفتوح',         c: 'rgba(0,0,0,0.55)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.09)' },
  pending:                    { en: 'Pending',       ar: 'معلّق',           c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' },
  invited:                    { en: 'Invited',       ar: 'مدعو',          c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' },
  closed:                     { en: 'Closed',        ar: 'مغلق',          c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' },
  cancelled:                  { en: 'Cancelled',     ar: 'ملغى',           c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' },
  email_confirmed:            { en: 'Email OK',      ar: 'البريد مؤكد',    c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' },
  pending_email_confirmation: { en: 'Awaiting Email',ar: 'ينتظر التأكيد',  c: 'rgba(0,0,0,0.35)', bg: 'rgba(0,0,0,0.03)', b: 'rgba(0,0,0,0.07)' },
  verification_incomplete:    { en: 'Incomplete',    ar: 'غير مكتمل',      c: 'rgba(0,0,0,0.35)', bg: 'rgba(0,0,0,0.03)', b: 'rgba(0,0,0,0.07)' },
  medium:                     { en: 'Medium',        ar: 'متوسطة',        c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' },
  low:                        { en: 'Low',           ar: 'منخفضة',        c: 'rgba(0,0,0,0.35)', bg: 'rgba(0,0,0,0.03)', b: 'rgba(0,0,0,0.07)' },
};

export default function AdminStatusBadge({ status, lang, style }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const cfg = STATUS_MAP[key] || { en: status || '—', ar: status || '—', c: 'rgba(0,0,0,0.45)', bg: 'rgba(0,0,0,0.04)', b: 'rgba(0,0,0,0.08)' };
  const isAr = lang === 'ar';
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 99,
      fontSize: 10, fontWeight: 600, letterSpacing: isAr ? 0 : 0.4,
      color: cfg.c, background: cfg.bg, border: `1px solid ${cfg.b}`,
      whiteSpace: 'nowrap', fontFamily: "'Tajawal', sans-serif",
      fontVariantNumeric: 'lining-nums',
      ...style,
    }}>
      {isAr ? cfg.ar : cfg.en}
    </span>
  );
}
