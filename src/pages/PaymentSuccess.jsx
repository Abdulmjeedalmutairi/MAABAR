import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';
import { getOfferShippingMethod } from '../lib/offerPricing';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';

const T = {
  ar: {
    tag: 'مَعبر · تأكيد الدفع',
    title: 'تم الدفع بنجاح',
    sub: 'ادفع بقدر ما تثق — وزّد ثقتك مع كل صفقة',
    what: 'ماذا يحدث الآن؟',
    steps: [
      { n: '01', t: 'تم استلام دفعتك', d: 'دفعتك وصلت — وبقدر ثقتك تكبر صفقتك القادمة.' },
      { n: '02', t: 'المورد يجهز طلبك', d: 'تم إشعار المورد وسيبدأ بتجهيز طلبك فوراً.' },
      { n: '03', t: 'تتبع الشحن', d: 'ستستلم رقم التتبع بعد شحن البضاعة.' },
      { n: '04', t: 'تأكيد الاستلام', d: 'بعد استلامك، اضغط تأكيد وسيُحوَّل المبلغ للمورد.' },
    ],
    amount: 'المبلغ المدفوع',
    paymentId: 'رقم العملية',
    status: 'الحالة',
    held: 'محجوز — في أمان',
    requestSummary: 'ملخص الطلب التجاري',
    requestRef: 'مرجع الطلب',
    supplier: 'المورد',
    supplierId: 'معرّف المورد',
    leadTime: 'مدة التجهيز',
    shippingMethod: 'طريقة الشحن',
    verification: 'التحقق',
    verifiedSupplier: 'مورد موثّق',
    reviewedByMaabar: 'تمت مراجعة الحساب من مَعبر',
    tradeProfile: 'رابط تجاري متوفر',
    wechatAvailable: 'WeChat متاح',
    factoryPhotos: 'صور منشأة متاحة',
    nextCheckpoint: 'المحطة التجارية التالية',
    nextCheckpointSplit: 'المتبقي قبل الشحن',
    nextCheckpointSplitBody: 'سيبقى على الطلب مبلغ متبقٍ قبل إصدار الشحنة. راجع الطلب من اللوحة عندما يؤكد المورد الجاهزية.',
    nextCheckpointPaid: 'تمت تغطية الدفعات الحالية',
    nextCheckpointPaidBody: 'المورد أُشعر الآن، ويمكنه متابعة تجهيز الطلب حسب حالته داخل مَعبر.',
    buyerProtection: 'حماية الصفقة',
    buyerProtectionBody: 'احتفظ بكل التحديثات والدفع داخل مَعبر حتى تبقى المراجعة والمرجع التجاري واضحين للطرفين.',
    dashboard: 'متابعة الطلب',
    home: 'العودة للرئيسية',
    sar: 'ريال',
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Payment Confirmed',
    title: 'Payment Successful',
    sub: 'Pay what you\'re comfortable with — your money moves when you decide',
    what: "What happens next?",
    steps: [
      { n: '01', t: 'Payment Received', d: 'Your payment is in — your trust grows with every successful deal.' },
      { n: '02', t: 'Supplier Preparing', d: 'The supplier has been notified and will begin preparing your order.' },
      { n: '03', t: 'Track Shipment', d: 'You will receive a tracking number once the order is shipped.' },
      { n: '04', t: 'Confirm Receipt', d: 'After receiving your order, confirm and funds will be released to the supplier.' },
    ],
    amount: 'Amount Paid',
    paymentId: 'Transaction ID',
    status: 'Status',
    held: 'Held — Secure',
    requestSummary: 'Commercial Order Summary',
    requestRef: 'Request Reference',
    supplier: 'Supplier',
    supplierId: 'Supplier ID',
    leadTime: 'Lead time',
    shippingMethod: 'Shipping method',
    verification: 'Verification',
    verifiedSupplier: 'Verified supplier',
    reviewedByMaabar: 'Reviewed by Maabar',
    tradeProfile: 'Trade profile on file',
    wechatAvailable: 'WeChat available',
    factoryPhotos: 'Factory photos available',
    nextCheckpoint: 'Next Commercial Checkpoint',
    nextCheckpointSplit: 'Remaining balance before shipment',
    nextCheckpointSplitBody: 'A remaining balance is still due before shipment release. Track the order from your dashboard when the supplier confirms readiness.',
    nextCheckpointPaid: 'Current payment milestone covered',
    nextCheckpointPaidBody: 'The supplier has now been notified and can continue fulfillment according to the order stage on Maabar.',
    buyerProtection: 'Deal protection',
    buyerProtectionBody: 'Keep payment, updates, and any issue review inside Maabar so both sides keep one clear commercial record.',
    dashboard: 'Track Order',
    home: 'Back to Home',
    sar: 'SAR',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 付款确认',
    title: '付款成功',
    sub: '按您的信任程度付款 — 每次交易都在积累信任',
    what: '接下来会发生什么？',
    steps: [
      { n: '01', t: '已收到付款', d: '您的付款已到位 — 每次成功交易都在增加您的信任度。' },
      { n: '02', t: '供应商准备中', d: '供应商已收到通知，将立即开始准备您的订单。' },
      { n: '03', t: '跟踪货物', d: '发货后您将收到物流单号。' },
      { n: '04', t: '确认收货', d: '收到货物后，确认收货，资金将释放给供应商。' },
    ],
    amount: '已付金额',
    paymentId: '交易编号',
    status: '状态',
    held: '托管中 — 安全',
    requestSummary: '商业订单摘要',
    requestRef: '需求编号',
    supplier: '供应商',
    supplierId: '供应商编号',
    leadTime: '交期',
    shippingMethod: '运输方式',
    verification: '审核状态',
    verifiedSupplier: '认证供应商',
    reviewedByMaabar: '已通过 Maabar 审核',
    tradeProfile: '已提供店铺/官网链接',
    wechatAvailable: '支持 WeChat',
    factoryPhotos: '已提供工厂图片',
    nextCheckpoint: '下一商业节点',
    nextCheckpointSplit: '发货前仍有尾款',
    nextCheckpointSplitBody: '发货前仍需支付尾款。供应商确认备货完成后，请在控制台继续跟进。',
    nextCheckpointPaid: '当前付款节点已完成',
    nextCheckpointPaidBody: '系统已通知供应商，后续可按 Maabar 内的订单阶段继续处理。',
    buyerProtection: '交易保护',
    buyerProtectionBody: '请尽量把付款、更新和任何问题处理都保留在 Maabar 内，这样双方都有清晰的商业记录。',
    dashboard: '跟踪订单',
    home: '返回首页',
    sar: 'SAR',
    copy: 'Maabar © 2026',
  }
};

export default function PaymentSuccess({ lang }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const { payment, offer, request, total, supplier: supplierFromState, secondPaymentDue } = location.state || {};
  const checkoutCurrency = String(offer?.currency || 'USD').toUpperCase();
  const currencyLabel = checkoutCurrency === 'SAR' ? t.sar : checkoutCurrency;
  const [supplierSnapshot, setSupplierSnapshot] = useState(supplierFromState || offer?.profiles || null);

  useEffect(() => {
    if (!payment) { nav('/dashboard'); return; }
    window.history.replaceState(null, '', '/payment-success');
  }, [nav, payment]);

  useEffect(() => {
    setSupplierSnapshot(supplierFromState || offer?.profiles || null);
  }, [offer, supplierFromState]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplierSnapshot() {
      if (supplierFromState || offer?.profiles || !offer?.supplier_id) return;
      const { data } = await sb
        .from('profiles')
        .select('id,company_name,status,trade_link,wechat,whatsapp,factory_images,trust_score,maabar_supplier_id,city,country')
        .eq('id', offer.supplier_id)
        .single();

      if (!cancelled && data) setSupplierSnapshot(data);
    }

    loadSupplierSnapshot();
    return () => { cancelled = true; };
  }, [offer, supplierFromState]);

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  if (!payment) return null;

  const requestTitle = isAr
    ? request?.title_ar || request?.title_en || request?.title_zh || '—'
    : lang === 'zh'
      ? request?.title_zh || request?.title_en || request?.title_ar || '—'
      : request?.title_en || request?.title_ar || request?.title_zh || '—';
  const shippingMethod = getOfferShippingMethod(offer);
  const supplierTrustSignals = buildSupplierTrustSignals(supplierSnapshot || {});
  const supplierMaabarId = getSupplierMaabarId(supplierSnapshot || {});
  const isReviewedSupplier = isSupplierPubliclyVisible(supplierSnapshot?.status);
  const leadTimeLabel = offer?.delivery_days
    ? (isAr ? `${offer.delivery_days} يوم` : lang === 'zh' ? `${offer.delivery_days} 天` : `${offer.delivery_days} days`)
    : '—';
  const requestReference = request?.id ? String(request.id).slice(0, 8).toUpperCase() : '—';
  const checkpointTitle = secondPaymentDue > 0 ? t.nextCheckpointSplit : t.nextCheckpointPaid;
  const checkpointBody = secondPaymentDue > 0 ? t.nextCheckpointSplitBody : t.nextCheckpointPaidBody;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>

      {/* HEADER */}
      <div style={{
        padding: '60px 60px 48px',
        background: 'rgba(0,0,0,0.52)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 24, fontFamily: 'var(--font-body)' }}>
          {t.tag}
        </p>

        {/* CHECK ICON */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(45,122,79,0.2)',
          border: '1px solid rgba(45,122,79,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 22,
        }}>
          ✓
        </div>

        <h1 style={{
          fontSize: isAr ? 44 : 52, fontWeight: 300,
          color: '#F7F5F2', letterSpacing: isAr ? 0 : -1,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          marginBottom: 10, lineHeight: 1.1,
        }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
          {t.sub}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ background: 'rgba(247,245,242,0.92)', backdropFilter: 'blur(8px)', minHeight: 'calc(100vh - 280px)' }}>
        <div style={{ padding: '48px 60px', maxWidth: 860, margin: '0 auto' }}>

          {/* PAYMENT DETAILS */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
              {t.amount}
            </p>
            <div className="success-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#E5E0D8' }}>
              <div style={{ background: '#2C2C2C', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(247,245,242,0.4)', marginBottom: 12, textTransform: 'uppercase' }}>{t.amount}</p>
                <p style={{ fontSize: 36, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)' }}>
                  {fmt(total)} <span style={{ fontSize: 13, opacity: 0.6 }}>{currencyLabel}</span>
                </p>
              </div>
              <div style={{ background: '#F7F5F2', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 12, textTransform: 'uppercase' }}>{t.requestRef}</p>
                <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 500, marginBottom: 8 }}>{requestReference}</p>
                <p style={{ fontSize: 11, color: '#7a7a7a', lineHeight: 1.65, margin: 0 }}>{requestTitle}</p>
              </div>
              <div style={{ background: '#F7F5F2', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 12, textTransform: 'uppercase' }}>{t.supplier}</p>
                <p style={{ fontSize: 13, color: '#2C2C2C', fontWeight: 500, marginBottom: 8 }}>{supplierSnapshot?.company_name || '—'}</p>
                <p style={{ fontSize: 11, color: '#7a7a7a', lineHeight: 1.65, margin: 0 }}>
                  {supplierMaabarId ? `${t.supplierId}: ${supplierMaabarId}` : leadTimeLabel !== '—' ? `${t.leadTime}: ${leadTimeLabel}` : '—'}
                </p>
              </div>
              <div style={{ background: '#F7F5F2', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 12, textTransform: 'uppercase' }}>{t.status}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#2d7a4f', marginBottom: 8 }}>🔒 {t.held}</p>
                <p style={{ fontSize: 11, color: '#7a7a7a', lineHeight: 1.65, margin: 0, wordBreak: 'break-word' }}>
                  {t.paymentId}: {payment.moyasar_id || payment.id?.slice(0, 16)}
                </p>
              </div>
            </div>
          </div>

          <div className="success-summary-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 16, marginBottom: 48 }}>
            <div style={{ border: '1px solid #E5E0D8', background: '#F7F5F2', padding: '24px 24px 22px' }}>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
                {t.requestSummary}
              </p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.supplier}</span>
                  <strong style={{ fontSize: 13, color: '#2C2C2C', textAlign: isAr ? 'left' : 'right' }}>{supplierSnapshot?.company_name || '—'}</strong>
                </div>
                {supplierMaabarId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.supplierId}</span>
                    <strong style={{ fontSize: 13, color: '#2C2C2C' }}>{supplierMaabarId}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                  <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.leadTime}</span>
                  <strong style={{ fontSize: 13, color: '#2C2C2C' }}>{leadTimeLabel}</strong>
                </div>
                {shippingMethod && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.shippingMethod}</span>
                    <strong style={{ fontSize: 13, color: '#2C2C2C' }}>{shippingMethod}</strong>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {isReviewedSupplier && <span style={successBadgeStyle('#5a9a72', 'rgba(58,122,82,0.1)', 'rgba(58,122,82,0.2)')}>✓ {t.verifiedSupplier}</span>}
                {supplierTrustSignals.includes('trade_profile_available') && <span style={successBadgeStyle('rgba(139,120,255,0.9)', 'rgba(139,120,255,0.08)', 'rgba(139,120,255,0.2)')}>{t.tradeProfile}</span>}
                {supplierTrustSignals.includes('wechat_available') && <span style={successBadgeStyle('rgba(139,120,255,0.9)', 'rgba(139,120,255,0.08)', 'rgba(139,120,255,0.2)')}>{t.wechatAvailable}</span>}
                {supplierTrustSignals.includes('factory_media_available') && <span style={successBadgeStyle('#7a7a7a', 'rgba(255,255,255,0.75)', '#E5E0D8')}>{t.factoryPhotos}</span>}
              </div>
            </div>

            <div style={{ border: '1px solid rgba(139,120,255,0.15)', background: 'rgba(139,120,255,0.06)', padding: '24px 24px 22px' }}>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(139,120,255,0.9)', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
                {t.nextCheckpoint}
              </p>
              <h3 style={{ fontSize: isAr ? 20 : 22, fontWeight: 400, color: '#2C2C2C', marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                {checkpointTitle}
              </h3>
              <p style={{ fontSize: 12, color: '#5f5f63', lineHeight: 1.8, marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                {checkpointBody}
              </p>
              <p style={{ fontSize: 12, color: '#5f5f63', lineHeight: 1.75, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                <strong style={{ color: '#2C2C2C', fontWeight: 500 }}>{t.buyerProtection}:</strong> {t.buyerProtectionBody}
              </p>
            </div>
          </div>

          {/* NEXT STEPS */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
              {t.what}
            </p>
            <div className="success-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#E5E0D8' }}>
              {t.steps.map((s, i) => (
                <div key={i} style={{ background: i === 0 ? '#2C2C2C' : '#F7F5F2', padding: '24px 20px', animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
                  <p style={{ fontFamily: 'var(--font-en)', fontSize: 24, fontWeight: 300, color: i === 0 ? 'rgba(247,245,242,0.2)' : '#E5E0D8', marginBottom: 16, lineHeight: 1 }}>
                    {s.n}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: i === 0 ? '#F7F5F2' : '#2C2C2C', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {s.t}
                  </p>
                  <p style={{ fontSize: 11, color: i === 0 ? 'rgba(247,245,242,0.45)' : '#7a7a7a', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIONS */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => nav('/dashboard')} style={{
              background: '#2C2C2C', color: '#F7F5F2', border: 'none',
              padding: '13px 32px', fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2,
              fontFamily: 'var(--font-body)', transition: 'all 0.2s',
            }}>
              {t.dashboard}
            </button>
            <button onClick={() => nav('/')} style={{
              background: 'none', border: '1px solid #E5E0D8',
              color: '#7a7a7a', padding: '13px 28px', fontSize: 11,
              letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
              borderRadius: 2, fontFamily: 'var(--font-body)',
            }}>
              {t.home}
            </button>
          </div>
        </div>
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-ar)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 1 }}>
          مَعبر <span style={{ fontFamily: 'var(--font-en)', fontSize: 13, opacity: 0.5 }}>| MAABAR</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{t.copy}</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .success-details { grid-template-columns: 1fr !important; }
          .success-summary-grid { grid-template-columns: 1fr !important; }
          .success-steps { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const successBadgeStyle = (color, background, borderColor) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 10,
  letterSpacing: 0.35,
  color,
  background,
  border: `1px solid ${borderColor}`,
});
