import React from 'react';

const STATUS_MAP = {
  // supplier / profile statuses
  active:                       { label: 'Active',        labelAr: 'نشط',              color: '#16a34a', bg: '#dcfce7' },
  verified:                     { label: 'Verified',      labelAr: 'موثّق',             color: '#16a34a', bg: '#dcfce7' },
  verification_under_review:    { label: 'Under Review',  labelAr: 'قيد المراجعة',      color: '#d97706', bg: '#fef3c7' },
  verification_incomplete:      { label: 'Incomplete',    labelAr: 'غير مكتمل',         color: '#6b7280', bg: '#f3f4f6' },
  email_confirmed:              { label: 'Email OK',      labelAr: 'البريد مؤكد',       color: '#2563eb', bg: '#dbeafe' },
  pending_email_confirmation:   { label: 'Pending Email', labelAr: 'ينتظر التأكيد',     color: '#6b7280', bg: '#f3f4f6' },
  rejected:                     { label: 'Rejected',      labelAr: 'مرفوض',             color: '#dc2626', bg: '#fee2e2' },
  inactive:                     { label: 'Inactive',      labelAr: 'غير نشط',           color: '#dc2626', bg: '#fee2e2' },
  // managed request statuses
  open:                         { label: 'Open',          labelAr: 'مفتوح',             color: '#2563eb', bg: '#dbeafe' },
  assigned:                     { label: 'Assigned',      labelAr: 'معيّن',              color: '#7c3aed', bg: '#ede9fe' },
  sourcing:                     { label: 'Sourcing',      labelAr: 'بحث عن مورد',       color: '#d97706', bg: '#fef3c7' },
  completed:                    { label: 'Completed',     labelAr: 'مكتمل',             color: '#16a34a', bg: '#dcfce7' },
  cancelled:                    { label: 'Cancelled',     labelAr: 'ملغى',              color: '#6b7280', bg: '#f3f4f6' },
  // concierge statuses
  pending:                      { label: 'Pending',       labelAr: 'معلّق',              color: '#6b7280', bg: '#f3f4f6' },
  in_progress:                  { label: 'In Progress',   labelAr: 'جارٍ',              color: '#d97706', bg: '#fef3c7' },
  matched:                      { label: 'Matched',       labelAr: 'تمت المطابقة',      color: '#16a34a', bg: '#dcfce7' },
  closed:                       { label: 'Closed',        labelAr: 'مغلق',              color: '#6b7280', bg: '#f3f4f6' },
  // dispute statuses
  under_review:                 { label: 'Under Review',  labelAr: 'قيد المراجعة',      color: '#d97706', bg: '#fef3c7' },
  mediating:                    { label: 'Mediating',     labelAr: 'وساطة',             color: '#7c3aed', bg: '#ede9fe' },
  resolved_buyer:               { label: 'Resolved (B)',  labelAr: 'حُلّ للتاجر',        color: '#16a34a', bg: '#dcfce7' },
  resolved_supplier:            { label: 'Resolved (S)',  labelAr: 'حُلّ للمورد',        color: '#16a34a', bg: '#dcfce7' },
  settled:                      { label: 'Settled',       labelAr: 'تسوية',             color: '#16a34a', bg: '#dcfce7' },
  dismissed:                    { label: 'Dismissed',     labelAr: 'مرفوض',             color: '#6b7280', bg: '#f3f4f6' },
  // supplier match statuses
  invited:                      { label: 'Invited',       labelAr: 'مدعو',              color: '#6b7280', bg: '#f3f4f6' },
  responded:                    { label: 'Responded',     labelAr: 'ردّ',               color: '#2563eb', bg: '#dbeafe' },
  shortlisted:                  { label: 'Shortlisted',   labelAr: 'في القائمة',        color: '#7c3aed', bg: '#ede9fe' },
  // severity
  high:                         { label: 'High',          labelAr: 'عالية',             color: '#dc2626', bg: '#fee2e2' },
  medium:                       { label: 'Medium',        labelAr: 'متوسطة',            color: '#d97706', bg: '#fef3c7' },
  low:                          { label: 'Low',           labelAr: 'منخفضة',            color: '#16a34a', bg: '#dcfce7' },
};

export default function AdminStatusBadge({ status, lang, style }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const cfg = STATUS_MAP[key] || { label: status || '—', labelAr: status || '—', color: '#6b7280', bg: '#f3f4f6' };
  const label = lang === 'ar' ? cfg.labelAr : cfg.label;

  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.3,
      color: cfg.color,
      background: cfg.bg,
      whiteSpace: 'nowrap',
      fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)',
      ...style,
    }}>
      {label}
    </span>
  );
}
