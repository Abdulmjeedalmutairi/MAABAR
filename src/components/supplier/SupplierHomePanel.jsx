import React, { useEffect, useState } from 'react';
import { fetchSupplierActionItems, sortByUrgency, waitingLabel } from '../../lib/supplierActionItems';

// Redesigned supplier Home (decision #2): opens on the WORK, not the paperwork.
// Order: needs-your-response (urgency = wait time) → activity → one calm verify
// line → what unlocks after verification. No marketing footer, no onboarding stepper.

const INK = '#1A1814', BRONZE = '#8B7355';

const T = {
  ar: {
    eyebrow: 'لوحة المورد', needs: 'يحتاج ردّك', activity: 'نشاطك',
    offers: 'عروض نشطة', products: 'منتجاتك', messages: 'رسائل', inquiries: 'استفسارات',
    kinds: { rfq: 'طلب عرض سعر', direct: 'شراء مباشر', sample: 'طلب عيّنة', inquiry: 'استفسار على منتج', message: 'رسالة' },
    verifyLine: 'منتجاتك ظاهرة للمشترين من الآن. أكمل ملفك لاستلام المدفوعات.', completeProfile: 'أكمل الملف',
    unlocks: 'يفتح بعد التحقق',
    payTitle: 'المدفوعات', payBody: 'استلم قيمة طلباتك بالريال مباشرة على حسابك البنكي.',
    walletTitle: 'المحفظة والإحالات', walletBody: 'تابع أرصدتك وادعُ مصانع أخرى لمَعبر.',
  },
  en: {
    eyebrow: 'Supplier dashboard', needs: 'Needs your response', activity: 'Your activity',
    offers: 'Active offers', products: 'Your products', messages: 'Messages', inquiries: 'Inquiries',
    kinds: { rfq: 'Quote request', direct: 'Direct purchase', sample: 'Sample request', inquiry: 'Product inquiry', message: 'Message' },
    verifyLine: 'Your products are visible to buyers now. Complete your profile to get paid.', completeProfile: 'Complete profile',
    unlocks: 'Unlocks after verification',
    payTitle: 'Payments', payBody: 'Receive your order value in SAR straight to your bank account.',
    walletTitle: 'Wallet & referrals', walletBody: 'Track your balances and invite other factories to Maabar.',
  },
  zh: {
    eyebrow: '供应商面板', needs: '待您回应', activity: '您的活动',
    offers: '活跃报价', products: '您的产品', messages: '消息', inquiries: '咨询',
    kinds: { rfq: '询价', direct: '直接采购', sample: '样品申请', inquiry: '产品咨询', message: '消息' },
    verifyLine: '您的产品现已对买家可见。完成资料即可收款。', completeProfile: '完善资料',
    unlocks: '认证后解锁',
    payTitle: '收款', payBody: '订单款项以 SAR 直接到您的银行账户。',
    walletTitle: '钱包与推荐', walletBody: '查看余额并邀请其他工厂加入马巴尔。',
  },
};

export default function SupplierHomePanel({ sb, supplierId, lang = 'ar', companyName, offersCount = 0, productsCount = 0, messagesCount = 0, inquiriesCount = 0, needsVerification, onOpenRequests, onVerify }) {
  const c = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const font = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const [needs, setNeeds] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { items } = await fetchSupplierActionItems(sb, supplierId);
      if (alive) setNeeds(sortByUrgency(items.filter((x) => x.bucket === 'needs_response')).slice(0, 3));
    })();
    return () => { alive = false; };
  }, [sb, supplierId]);

  const stats = [
    { v: offersCount, k: c.offers, go: onOpenRequests },
    { v: productsCount, k: c.products },
    { v: messagesCount, k: c.messages },
    { v: inquiriesCount, k: c.inquiries },
  ];

  const Locked = ({ title, body, cta }) => (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px dashed #DDD5C8', borderRadius: 14, padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14.5, fontWeight: 600, color: 'var(--text-disabled)', ...font }}>🔒 {title}</div>
      <p style={{ fontSize: 12.5, color: 'var(--text-disabled)', marginTop: 8, lineHeight: 1.6, ...font }}>{body}</p>
      {cta && <button onClick={onVerify} style={{ marginTop: 12, background: INK, color: '#FAF8F5', fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', ...font }}>{c.completeProfile}</button>}
    </div>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: BRONZE, marginBottom: 7, ...font }}>{c.eyebrow}</div>
      <h1 style={{ fontSize: isAr ? 22 : 26, fontWeight: 600, lineHeight: 1.35, color: 'var(--text-primary)', marginBottom: 4, overflowWrap: 'anywhere', ...font }}>{companyName}</h1>

      {/* needs-your-response — dark, urgency shown as wait time */}
      {needs.length > 0 && (
        <div style={{ background: INK, borderRadius: 16, padding: '16px 17px 8px', color: '#FAF8F5', marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: '#C9BCA6', marginBottom: 4, ...font }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D9C39B', flexShrink: 0 }} />{c.needs}
          </div>
          {needs.map((it) => (
            <button key={it.key} onClick={onOpenRequests} style={{ display: 'flex', width: '100%', textAlign: isAr ? 'right' : 'left', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(250,248,245,.13)', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(250,248,245,.13)', cursor: 'pointer' }}>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: '#FAF8F5', lineHeight: 1.4, ...font }}>{it.title || c.kinds[it.kind]}</span>
                <span style={{ display: 'block', fontSize: 12, color: '#B5AB99', marginTop: 3, ...font }}>{c.kinds[it.kind]}</span>
              </span>
              <span style={{ fontSize: 11.5, color: '#D9C39B', fontWeight: 600, whiteSpace: 'nowrap', ...font }}>{waitingLabel(it.waitingSince, lang)}</span>
            </button>
          ))}
        </div>
      )}

      {/* activity */}
      <div style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)', ...font }}>{c.activity}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {stats.map((s, i) => (
            <button key={i} onClick={s.go} style={{ background: 'var(--bg-raised, #fff)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '15px 16px', textAlign: isAr ? 'right' : 'left', cursor: s.go ? 'pointer' : 'default' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 26, fontWeight: 500, lineHeight: 1.1, color: 'var(--text-primary)' }}>{s.v}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', marginTop: 5, ...font }}>{s.k}</div>
            </button>
          ))}
        </div>
      </div>

      {/* one calm verify line */}
      {needsVerification && (
        <div style={{ marginTop: 28, background: 'var(--bronze-soft, #EFE9E1)', border: '1px solid var(--bronze-line, #E2D8C9)', borderRadius: 12, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRONZE, flexShrink: 0 }} />
          <p style={{ fontSize: 13.5, flex: 1, lineHeight: 1.5, color: 'var(--text-primary)', minWidth: 180, ...font }}>{c.verifyLine}</p>
          <button onClick={onVerify} style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: `1.5px solid ${BRONZE}`, paddingBottom: 1, background: 'none', border: 'none', borderBottomWidth: 1.5, borderBottomStyle: 'solid', borderBottomColor: BRONZE, color: 'var(--text-primary)', cursor: 'pointer', ...font }}>{c.completeProfile}</button>
        </div>
      )}

      {/* what unlocks after verification (kept visible as motivation) */}
      {needsVerification && (
        <div style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)', ...font }}>{c.unlocks}</h2>
          <Locked title={c.payTitle} body={c.payBody} cta />
          <Locked title={c.walletTitle} body={c.walletBody} />
        </div>
      )}
    </div>
  );
}
