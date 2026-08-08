import React from 'react';

// Universal payout-lock banner (unified-onboarding 6a). After the onboarding
// change, verification gates only PAYOUT — a supplier can quote, message and sell
// immediately. This is the single banner shown wherever a payout-related surface
// is gated (the Payout / Wallet tabs), replacing the old "verification locks the
// whole experience" copy. Pass buttons via `actions` so each call site keeps its
// own navigation (start verification, back to dashboard, …). ar/en/zh.
export default function SupplierPayoutLockBanner({ lang = 'en', actions, style }) {
  const isAr = lang === 'ar';
  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : { fontFamily: 'var(--font-sans)' };

  return (
    <div style={{
      padding: '28px 28px 24px',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)',
      background: 'var(--bg-subtle)',
      ...style,
    }}>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, fontWeight: 500 }}>
        {isAr ? 'المدفوعات' : lang === 'zh' ? '收款' : 'Payouts'}
      </p>
      <h2 style={{ fontSize: isAr ? 26 : 30, fontWeight: 300, marginBottom: 12, color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.4, ...arFont }}>
        {isAr ? 'وثّق نشاطك التجاري لاستلام مدفوعاتك' : lang === 'zh' ? '完成企业认证即可收款' : 'Verify your business to get paid'}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: 0, ...arFont }}>
        {isAr
          ? 'يمكنك الاستمرار في تقديم العروض ومراسلة المشترين والبيع من الآن — التحقق مطلوب فقط قبل أن يحوّل مَعبر مستحقاتك إليك.'
          : lang === 'zh'
            ? '您现在就可以继续报价、与买家沟通并销售 — 仅在 Maabar 向您结算款项前才需要完成认证。'
            : 'You can keep quoting, messaging buyers, and selling right now — verification is only required before Maabar releases your earnings to you.'}
      </p>
      {actions && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
