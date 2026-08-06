import React from 'react';
import { isSupplierApproved } from '../lib/supplierOnboarding';

// Small pill a buyer/trader sees on a counterpart supplier (offer cards, chat,
// sample requests). Verification no longer gates offers/messaging — a supplier
// can quote and chat the moment they register — so this keeps the buyer aware of
// where the supplier stands: a green "Verified" pill once their documents are
// approved, otherwise an amber "Verification pending" pill.
//
// Render this only for suppliers (callers gate on role where the counterpart may
// be a buyer). `size` — 'sm' (default) matches the inline offer-card pills.
export default function SupplierVerifyBadge({ status, lang = 'en', size = 'sm', style }) {
  const isAr = lang === 'ar';
  const verified = isSupplierApproved(status);

  const base = {
    fontSize: size === 'sm' ? 9 : 10,
    padding: size === 'sm' ? '2px 7px' : '3px 9px',
    borderRadius: 'var(--radius-pill)',
    whiteSpace: 'nowrap',
    ...style,
  };

  if (verified) {
    return (
      <span style={{ ...base, background: 'rgba(45,122,79,0.1)', border: '1px solid rgba(45,122,79,0.2)', color: 'var(--green)' }}>
        ✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
      </span>
    );
  }

  return (
    <span
      title={isAr ? 'التوثيق قيد المراجعة — يمكن للمورد تقديم العروض والمراسلة الآن' : lang === 'zh' ? '认证审核中 — 供应商现在即可报价和沟通' : 'Verification pending — the supplier can already quote and message'}
      style={{ ...base, background: 'rgba(139,105,20,0.08)', border: '1px solid rgba(139,105,20,0.18)', color: '#8B6914' }}
    >
      {isAr ? 'قيد التوثيق' : lang === 'zh' ? '认证审核中' : 'Verification pending'}
    </span>
  );
}
