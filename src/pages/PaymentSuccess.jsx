import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb, SUPABASE_ANON_KEY } from '../supabase';
import { getOfferEstimatedTotal, getOfferShippingMethod } from '../lib/offerPricing';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';
import {
  buildMoyasarAmountMinorUnits,
  clearPendingMoyasarCheckout,
  loadPendingMoyasarCheckout,
} from '../lib/moyasarCheckout';
import { fetchSupplierPublicProfileById } from '../lib/profileVisibility';
import BrandedLoading from '../components/BrandedLoading';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';

const T = {
  ar: {
    tag: 'مَعبر · تأكيد الدفع',
    title: 'تم الدفع بنجاح',
    sub: 'ادفع بقدر ما تثق — وزّد ثقتك مع كل صفقة',
    loadingTitle: 'نراجع حالة الدفع الآن',
    loadingBody: 'لا يتم اعتماد الدفع داخل مَعبر إلا بعد التحقق من Moyasar وإغلاق خطوة الدفع بأمان.',
    failedTitle: 'لم يتم تأكيد الدفع',
    failedBody: 'لم يصلنا تأكيد دفع ناجح من Moyasar، لذلك لم نسجل الطلب كمدفوع داخل مَعبر.',
    backToCheckout: 'العودة للدفع',
    dashboard: 'متابعة الطلب',
    home: 'العودة للرئيسية',
    sar: 'ريال',
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
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Payment Confirmed',
    title: 'Payment Successful',
    sub: 'Pay what you\'re comfortable with — your money moves when you decide',
    loadingTitle: 'We are verifying your payment',
    loadingBody: 'Maabar records a payment only after Moyasar returns a verified successful status.',
    failedTitle: 'Payment was not confirmed',
    failedBody: 'Maabar did not receive a verified paid status from Moyasar, so the order was not marked as paid.',
    backToCheckout: 'Back to Checkout',
    dashboard: 'Track Order',
    home: 'Back to Home',
    sar: 'SAR',
    what: 'What happens next?',
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
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 付款确认',
    title: '付款成功',
    sub: '按您的信任程度付款 — 每次交易都在积累信任',
    loadingTitle: '正在核验付款状态',
    loadingBody: '只有在 Moyasar 返回并验证为成功付款后，Maabar 才会把订单记录为已付款。',
    failedTitle: '付款未确认',
    failedBody: 'Maabar 没有收到 Moyasar 的已付款验证结果，因此订单尚未标记为已付款。',
    backToCheckout: '返回付款页',
    dashboard: '跟踪订单',
    home: '返回首页',
    sar: 'SAR',
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
    copy: 'Maabar © 2026',
  }
};

function buildFailureMessage(lang, fallback) {
  if (fallback) return fallback;
  if (lang === 'zh') return '付款未完成或未通过验证。';
  if (lang === 'en') return 'Payment did not complete or could not be verified.';
  return 'الدفع لم يكتمل أو لم يتم التحقق منه.';
}

export default function PaymentSuccess({ lang, user }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const paymentIdFromQuery = String(params.get('id') || '').trim();
  const paymentStatusFromQuery = String(params.get('status') || '').trim().toLowerCase();
  const paymentMessageFromQuery = String(params.get('message') || '').trim();
  const rawStateKey = String(params.get('stateKey') || '').trim();
  const stateKey = rawStateKey ? (() => { try { return decodeURIComponent(rawStateKey); } catch { return rawStateKey; } })() : '';
  const pendingContext = loadPendingMoyasarCheckout(stateKey);
  const initialState = location.state || pendingContext || {};
  const processedRef = useRef(false);

  const [payment, setPayment] = useState(location.state?.payment || null);
  const [offer, setOffer] = useState(initialState.offer || null);
  const [request, setRequest] = useState(initialState.request || null);
  const [amountPaid, setAmountPaid] = useState(Number(initialState.total || initialState.firstPayment || 0));
  const [secondPaymentDue, setSecondPaymentDue] = useState(Number(initialState.secondPaymentDue || initialState.secondPayment || 0));
  const [supplierSnapshot, setSupplierSnapshot] = useState(initialState.supplier || initialState.supplierSnapshot || initialState.offer?.profiles || null);
  const [processingState, setProcessingState] = useState(location.state?.payment ? 'success' : (paymentIdFromQuery ? 'verifying' : 'idle'));
  const [errorMessage, setErrorMessage] = useState('');

  const checkoutCurrency = String(offer?.currency || initialState.checkoutCurrency || 'USD').toUpperCase();
  const currencyLabel = checkoutCurrency === 'SAR' ? t.sar : checkoutCurrency;
  const supplierTrustSignals = buildSupplierTrustSignals(supplierSnapshot || {});
  const supplierMaabarId = getSupplierMaabarId(supplierSnapshot || {});
  const isReviewedSupplier = isSupplierPubliclyVisible(supplierSnapshot?.status);
  const shippingMethod = getOfferShippingMethod(offer);
  const requestTitle = isAr
    ? request?.title_ar || request?.title_en || request?.title_zh || '—'
    : lang === 'zh'
      ? request?.title_zh || request?.title_en || request?.title_ar || '—'
      : request?.title_en || request?.title_ar || request?.title_zh || '—';
  const supplierName = supplierSnapshot?.company_name || t.supplier;
  const leadTimeLabel = offer?.delivery_days
    ? (isAr ? `${offer.delivery_days} يوم` : lang === 'zh' ? `${offer.delivery_days} 天` : `${offer.delivery_days} days`)
    : '—';
  const checkpointTitle = secondPaymentDue > 0 ? t.nextCheckpointSplit : t.nextCheckpointPaid;
  const checkpointBody = secondPaymentDue > 0 ? t.nextCheckpointSplitBody : t.nextCheckpointPaidBody;

  useEffect(() => {
    setOffer(initialState.offer || null);
    setRequest(initialState.request || null);
    setSecondPaymentDue(Number(initialState.secondPaymentDue || initialState.secondPayment || 0));
    setAmountPaid(Number(initialState.total || initialState.firstPayment || 0));
    setSupplierSnapshot(initialState.supplier || initialState.supplierSnapshot || initialState.offer?.profiles || null);
  }, [location.state, stateKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplierSnapshot() {
      if (supplierSnapshot || offer?.profiles || !offer?.supplier_id) return;
      const data = await fetchSupplierPublicProfileById(sb, offer.supplier_id);

      if (!cancelled && data) setSupplierSnapshot(data);
    }

    loadSupplierSnapshot();
    return () => { cancelled = true; };
  }, [offer, supplierSnapshot]);

  useEffect(() => {
    if (payment && location.state?.payment) {
      window.history.replaceState(null, '', '/payment-success');
      return;
    }

    if (!paymentIdFromQuery) {
      if (!payment) nav('/dashboard');
      return;
    }

    if (processedRef.current) return;
    processedRef.current = true;

    async function finalizePayment() {
      if (!user) {
        setProcessingState('failed');
        setErrorMessage(buildFailureMessage(lang, lang === 'ar' ? 'يجب تسجيل الدخول بنفس الحساب لإكمال التحقق من الدفع.' : lang === 'zh' ? '请使用同一账号登录后再完成付款核验。' : 'Please sign in with the same account to complete payment verification.'));
        return;
      }

      if (!offer || !request) {
        setProcessingState('failed');
        setErrorMessage(buildFailureMessage(lang, lang === 'ar' ? 'تعذر استرجاع تفاصيل الطلب بعد العودة من بوابة الدفع.' : lang === 'zh' ? '从支付网关返回后，无法恢复订单上下文。' : 'The checkout context could not be restored after returning from the payment gateway.'));
        return;
      }

      if (paymentStatusFromQuery && paymentStatusFromQuery !== 'paid') {
        setProcessingState('failed');
        setErrorMessage(buildFailureMessage(lang, paymentMessageFromQuery));
        return;
      }

      try {
        const { data: verifyData, error: verifyError } = await sb.functions.invoke('verify-moyasar-payment', {
          body: { paymentId: paymentIdFromQuery },
          headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        });

        if (verifyError) throw verifyError;

        const verifiedPayment = verifyData?.payment;
        if (!verifiedPayment || String(verifiedPayment.status || '').toLowerCase() !== 'paid') {
          throw new Error(buildFailureMessage(lang, paymentMessageFromQuery));
        }

        const expectedMinorUnits = buildMoyasarAmountMinorUnits(initialState.firstPayment || initialState.total || amountPaid);
        if (expectedMinorUnits > 0 && Number(verifiedPayment.amount) !== expectedMinorUnits) {
          throw new Error(lang === 'ar' ? 'قيمة الدفع لا تطابق المبلغ المتوقع لهذا الطلب.' : lang === 'zh' ? '付款金额与当前订单预期金额不一致。' : 'The payment amount does not match the expected order amount.');
        }

        const verifiedCurrency = String(verifiedPayment.currency || '').toUpperCase();
        if (verifiedCurrency && verifiedCurrency !== checkoutCurrency) {
          throw new Error(lang === 'ar' ? 'عملة الدفع لا تطابق عملة الطلب الحالية.' : lang === 'zh' ? '付款币种与当前订单币种不一致。' : 'The payment currency does not match the current checkout currency.');
        }

        const { data: existingPayment } = await sb
          .from('payments')
          .select('id,status,moyasar_id')
          .eq('moyasar_id', verifiedPayment.id)
          .limit(1)
          .maybeSingle();

        let persistedPayment = existingPayment;
        const firstPaymentAmount = Number(initialState.firstPayment || amountPaid || 0);
        const secondInstallmentAmount = Number(initialState.secondPayment || secondPaymentDue || 0);
        const totalAmount = Number(initialState.total || amountPaid || 0);
        const selectedPct = Number(initialState.selectedPct || request?.payment_pct || 0);
        const subtotal = offer ? getOfferEstimatedTotal(offer, request) : 0;
        const maabarFee = 0;
        const supplierAmount = parseFloat((subtotal * 0.96).toFixed(2));
        const reqTitle = request?.title_ar || request?.title_en || request?.title_zh || '';
        const isDirect = Boolean(offer?.isDirect);

        if (!persistedPayment) {
          if (initialState.isSecondPayment) {
            const { data: insertedPayment, error: insertError } = await sb.from('payments').insert({
              request_id: request.id,
              buyer_id: user.id,
              supplier_id: offer.supplier_id,
              amount: firstPaymentAmount,
              amount_first: 0,
              amount_second: firstPaymentAmount,
              payment_pct: request.payment_pct,
              maabar_fee: 0,
              supplier_amount: parseFloat((firstPaymentAmount * 0.96).toFixed(2)),
              status: 'second_paid',
              moyasar_id: verifiedPayment.id,
            }).select('id,status,moyasar_id').single();

            if (insertError) throw insertError;
            persistedPayment = insertedPayment;

            await sb.from('requests').update({
              status: 'shipping',
              shipping_status: 'shipping',
            }).eq('id', request.id);
          } else {
            const { data: insertedPayment, error: insertError } = await sb.from('payments').insert({
              request_id: request.id,
              buyer_id: user.id,
              supplier_id: offer.supplier_id,
              amount: totalAmount,
              amount_first: firstPaymentAmount,
              amount_second: secondInstallmentAmount,
              payment_pct: selectedPct,
              maabar_fee: maabarFee,
              supplier_amount: supplierAmount,
              status: 'first_paid',
              moyasar_id: verifiedPayment.id,
            }).select('id,status,moyasar_id').single();

            if (insertError) throw insertError;
            persistedPayment = insertedPayment;

            await sb.from('requests').update({
              status: 'paid',
              payment_id: insertedPayment.id,
              payment_pct: selectedPct,
              payment_second: secondInstallmentAmount,
            }).eq('id', request.id);

            try {
              await fetch(SEND_EMAILS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                body: JSON.stringify({
                  type: isDirect ? 'direct_order_paid_supplier' : 'payment_received_supplier',
                  data: { recipientUserId: offer.supplier_id, requestTitle: reqTitle, amount: firstPaymentAmount, name: 'Supplier', lang, paidAt: new Date().toISOString() },
                }),
              });
            } catch (emailError) {
              console.error('supplier payment email error:', emailError);
            }

            await sb.from('notifications').insert({
              user_id: offer.supplier_id,
              type: 'payment_received',
              title_ar: isDirect
                ? `تم استلام الدفع كاملاً — ${firstPaymentAmount} ${currencyLabel}. ابدأ التجهيز الآن`
                : `وصلت دفعتك الأولى — ${firstPaymentAmount} ${currencyLabel}. ابدأ التجهيز الآن`,
              title_en: isDirect
                ? `Full payment received — ${firstPaymentAmount} ${currencyLabel}. Start preparation now`
                : `First payment received — ${firstPaymentAmount} ${currencyLabel}. Start preparation now`,
              title_zh: isDirect
                ? `已收到全额付款 — ${firstPaymentAmount} ${currencyLabel}. 立即开始备货`
                : `首付已收到 — ${firstPaymentAmount} ${currencyLabel}. 立即开始备货`,
              ref_id: request.id,
              is_read: false,
            });

            try {
              if (user?.email) {
                await fetch(SEND_EMAILS_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
                  body: JSON.stringify({
                    type: isDirect ? 'direct_order_paid_buyer' : 'payment_confirmation_buyer',
                    to: user.email,
                    data: { requestTitle: reqTitle, amount: firstPaymentAmount, name: '', lang, paidAt: new Date().toISOString() },
                  }),
                });
              }
            } catch (buyerEmailError) {
              console.error('buyer payment email error:', buyerEmailError);
            }
          }
        }

        clearPendingMoyasarCheckout(stateKey);
        setPayment({ id: persistedPayment?.id || verifiedPayment.id, status: persistedPayment?.status || verifiedPayment.status, moyasar_id: verifiedPayment.id });
        setAmountPaid(firstPaymentAmount || amountPaid);
        setProcessingState('success');
        window.history.replaceState(null, '', '/payment-success');
      } catch (error) {
        console.error('payment success finalize error:', error);
        setProcessingState('failed');
        setErrorMessage(buildFailureMessage(lang, error instanceof Error ? error.message : paymentMessageFromQuery));
      }
    }

    finalizePayment();
  }, [payment, paymentIdFromQuery, offer, request, user, paymentStatusFromQuery, paymentMessageFromQuery, lang, amountPaid, initialState, checkoutCurrency, currencyLabel, nav, secondPaymentDue, stateKey]);

  const backToCheckout = () => {
    if (offer && request) {
      nav('/checkout', { state: { offer, request, isSecondPayment: Boolean(initialState.isSecondPayment) } });
      return;
    }
    nav('/dashboard');
  };

  if (processingState === 'verifying') {
    return (
      <BrandedLoading
        lang={lang}
        tag={t.tag}
        title={t.loadingTitle}
        body={t.loadingBody}
        tone="app"
        fullscreen
      />
    );
  }

  if (processingState === 'failed') {
    return (
      <StatusShell
        isAr={isAr}
        tag={t.tag}
        title={t.failedTitle}
        body={errorMessage || t.failedBody}
        primaryAction={{ label: t.backToCheckout, onClick: backToCheckout }}
        secondaryAction={{ label: t.dashboard, onClick: () => nav('/dashboard') }}
      />
    );
  }

  if (!payment || !offer || !request) {
    return null;
  }

  const fmt = (n) => Number(n || 0).toLocaleString(isAr ? 'ar-SA' : 'en-US', { maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: 'var(--app-dvh)', background: '#F7F5F2', paddingTop: 'var(--page-top-offset)' }}>
      <div style={{ padding: '56px 60px 48px', borderBottom: '1px solid #E5E0D8', background: '#FCFBF9' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#8D8A84', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
            {t.tag}
          </p>
          <h1 style={{ fontSize: isAr ? 38 : 48, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', letterSpacing: isAr ? 0 : -1.4 }}>
            {t.title}
          </h1>
          <p style={{ fontSize: 14, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
            {t.sub}
          </p>
        </div>
      </div>

      <div style={{ padding: 'clamp(24px, 6vw, 48px) clamp(16px, 6vw, 60px) max(32px, calc(64px + var(--safe-bottom)))' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div className="success-details" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 28 }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', padding: '28px 28px 24px' }}>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#8D8A84', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
                {t.requestSummary}
              </p>
              <div className="success-summary-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <SummaryRow label={t.amount} value={`${fmt(amountPaid)} ${currencyLabel}`} />
                <SummaryRow label={t.paymentId} value={payment.moyasar_id || payment.id} mono />
                <SummaryRow label={t.status} value={t.held} />
                <SummaryRow label={t.requestRef} value={String(request.id).slice(0, 8).toUpperCase()} mono />
                <SummaryRow label={t.supplier} value={supplierName} />
                <SummaryRow label={t.supplierId} value={supplierMaabarId || '—'} mono />
                <SummaryRow label={t.leadTime} value={leadTimeLabel} />
                <SummaryRow label={t.shippingMethod} value={shippingMethod || '—'} />
              </div>
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #E5E0D8' }}>
                <p style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {requestTitle}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isReviewedSupplier && <span style={successBadgeStyle('#5a9a72', 'rgba(58,122,82,0.1)', 'rgba(58,122,82,0.2)')}>✓ {t.verifiedSupplier}</span>}
                  {supplierTrustSignals.includes('trade_profile_available') && <span style={successBadgeStyle('var(--text-secondary)', 'var(--bg-subtle)', 'var(--border-subtle)')}>{t.tradeProfile}</span>}
                  {supplierTrustSignals.includes('wechat_available') && <span style={successBadgeStyle('var(--text-secondary)', 'var(--bg-subtle)', 'var(--border-subtle)')}>{t.wechatAvailable}</span>}
                  {supplierTrustSignals.includes('factory_media_available') && <span style={successBadgeStyle('var(--text-secondary)', 'var(--bg-subtle)', 'var(--border-subtle)')}>{t.factoryPhotos}</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', padding: '24px 24px 22px' }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#8D8A84', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
                  {t.verification}
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.supplier}</span>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{supplierName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.leadTime}</span>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{leadTimeLabel}</strong>
                  </div>
                  {shippingMethod && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                      <span style={{ fontSize: 12, color: '#7a7a7a' }}>{t.shippingMethod}</span>
                      <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{shippingMethod}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg-subtle)', padding: '24px 24px 22px' }}>
                <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 14, fontFamily: 'var(--font-body)' }}>
                  {t.nextCheckpoint}
                </p>
                <h3 style={{ fontSize: isAr ? 20 : 22, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {checkpointTitle}
                </h3>
                <p style={{ fontSize: 12, color: '#5f5f63', lineHeight: 1.8, marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {checkpointBody}
                </p>
                <p style={{ fontSize: 12, color: '#5f5f63', lineHeight: 1.75, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.buyerProtection}:</strong> {t.buyerProtectionBody}
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
              {t.what}
            </p>
            <div className="success-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#E5E0D8' }}>
              {t.steps.map((s, i) => (
                <div key={i} style={{ background: i === 0 ? '#1a1a1a' : 'var(--bg-subtle)', padding: '24px 20px', animation: `fadeIn 0.4s ease ${i * 0.1}s both` }}>
                  <p style={{ fontFamily: 'var(--font-en)', fontSize: 24, fontWeight: 300, color: i === 0 ? 'rgba(247,245,242,0.2)' : '#E5E0D8', marginBottom: 16, lineHeight: 1 }}>
                    {s.n}
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: i === 0 ? '#ffffff' : 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {s.t}
                  </p>
                  <p style={{ fontSize: 11, color: i === 0 ? 'rgba(247,245,242,0.45)' : '#7a7a7a', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {s.d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => nav('/dashboard')} style={{
              background: '#1a1a1a', color: '#ffffff', border: 'none',
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

      <footer style={{ background: '#FFFFFF', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ fontFamily: 'var(--font-ar)', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: 0 }}>
          مَعبر <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, opacity: 0.5 }}>| MAABAR</span>
        </div>
        <p style={{ color: 'var(--text-disabled)', fontSize: 11, letterSpacing: 1 }}>{t.copy}</p>
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

function StatusShell({ isAr, tag, title, body, primaryAction, secondaryAction }) {
  return (
    <div style={{ minHeight: 'var(--app-dvh)', background: '#F7F5F2', paddingTop: 'var(--page-top-offset)', display: 'flex', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: '0 clamp(16px, 5vw, 24px)' }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', padding: '34px 30px' }}>
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#8D8A84', marginBottom: 14, fontFamily: 'var(--font-body)' }}>{tag}</p>
          <h1 style={{ fontSize: isAr ? 30 : 36, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{title}</h1>
          <p style={{ fontSize: 14, color: '#6A6A6F', lineHeight: 1.8, marginBottom: 22, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{body}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={primaryAction.onClick} style={{ background: '#1a1a1a', color: '#ffffff', border: 'none', padding: '12px 24px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>{primaryAction.label}</button>
            <button onClick={secondaryAction.onClick} style={{ background: 'none', color: '#7a7a7a', border: '1px solid #E5E0D8', padding: '12px 24px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>{secondaryAction.label}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div style={{ padding: '14px 16px', border: '1px solid #E5E0D8', background: '#FBFAF8' }}>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#8D8A84', marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', margin: 0, fontFamily: mono ? 'var(--font-en)' : 'inherit', wordBreak: 'break-word' }}>{value}</p>
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
