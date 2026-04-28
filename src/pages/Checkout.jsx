import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';
import {
  getOfferEstimatedTotal,
  getOfferProductSubtotal,
  getOfferShippingCost,
  getOfferShippingMethod,
  hasOfferShippingCost,
} from '../lib/offerPricing';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';
import {
  getMoyasarPublishableKey,
  isMoyasarConfigured,
} from '../lib/paymentGateway';
import {
  buildMoyasarAmountMinorUnits,
  buildMoyasarCallbackUrl,
  savePendingMoyasarCheckout,
} from '../lib/moyasarCheckout';
import { fetchSupplierPublicProfileById } from '../lib/profileVisibility';


const T = {
  ar: {
    tag: 'مَعبر · الدفع',
    title: 'إتمام الدفع',
    sub: 'ادفع بقدر ما تثق — وزّد ثقتك مع كل صفقة',
    orderSummary: 'ملخص الطلب',
    product: 'المنتج',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    productTotal: 'إجمالي المنتجات',
    shippingCost: 'تكلفة الشحن',
    shippingMethod: 'طريقة الشحن',
    shippingNotSpecified: 'غير محدد بشكل منفصل',
    subtotal: 'المجموع قبل الرسوم',
    maabarFee: 'عمولة معبر (0%)',
    total: 'الإجمالي',
    payMethod: 'طريقة الدفع',
    choosePayment: 'اختر طريقة دفعك',
    applePay: 'Apple Pay',
    card: 'بطاقة ائتمانية',
    mada: 'مدى',
    cardNum: 'رقم البطاقة',
    expiry: 'تاريخ الانتهاء',
    cvv: 'CVV',
    cardName: 'الاسم على البطاقة',
    pay: 'ادفع الآن',
    paying: 'جاري الدفع...',
    secure: 'الدفع مشفر وآمن',
    back: 'رجوع',
    cancel: 'إلغاء',
    sar: 'ريال',
    firstPayment: 'الدفعة الأولى',
    secondPayment: 'الدفعة الثانية (قبل الشحن)',
    payOption30: 'الأكثر أماناً',
    payOption50: 'متوازن',
    payOption100: 'أسرع شحن',
    payOption30sub: 'الباقي قبل الشحن · المورد يبدأ فور الاستلام',
    payOption50sub: 'الباقي قبل الشحن · أولوية في التجهيز',
    payOption100sub: 'دفعة واحدة · المورد يشحن فوراً',
    secondPayNote: 'ادفع الدفعة الثانية',
    secondPaymentTitle: 'الدفعة الثانية',
    payNowLabel: 'تدفع الآن',
    amountDue: 'المبلغ المستحق',
    notSpecified: 'غير محدد',
    rfqSummary: 'ملخص الطلب التجاري',
    requestRef: 'مرجع الطلب',
    supplierSnapshot: 'المورد والشروط التجارية',
    supplierName: 'المورد',
    supplierId: 'معرّف المورد',
    verification: 'التحقق',
    verifiedSupplier: 'مورد موثّق',
    leadTime: 'مدة التجهيز',
    origin: 'المنشأ',
    supplierStarts: 'تجهيز المورد',
    supplierStartsNote: 'بعد نجاح الدفع، يُخطر المورد فوراً ويبدأ تنفيذ الطلب حسب الخطة المختارة.',
    protectionTitle: 'حماية الصفقة عبر مَعبر',
    protectionBody: 'يؤكد هذا الدفع الطلب التجاري داخل مَعبر. بعد نجاح العملية لا يتوفر إلغاء يدوي، وأي مشكلة يجب رفعها عبر مَعبر قبل تحرير المبلغ للمورد.',
    commercialTrust: 'إشارات ثقة أوضح للمورد',
    reviewedByMaabar: 'تمت مراجعة الحساب من مَعبر',
    tradeProfile: 'رابط تجاري متوفر',
    wechatAvailable: 'WeChat متاح',
    factoryPhotos: 'صور منشأة متاحة',
    cancellationNote: 'بعد نجاح العملية لا يتوفر إلغاء يدوي. لأي مشكلة استخدم دعم مَعبر قبل تحرير المبلغ.',
    paymentUnavailableTitle: 'الدفع غير متاح حالياً',
    paymentUnavailableBody: 'بوابة الدفع لم تُفعَّل بعد بشكل صحيح. أوقفنا إتمام الدفع حتى لا تُسجَّل العملية داخل مَعبر بدون خصم حقيقي من البطاقة.',
  },
  en: {
    tag: 'Maabar · Checkout',
    title: 'Complete Payment',
    sub: 'Pay what you\'re comfortable with — your money moves when you decide',
    orderSummary: 'Order Summary',
    product: 'Product',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    productTotal: 'Products Total',
    shippingCost: 'Shipping Cost',
    shippingMethod: 'Shipping Method',
    shippingNotSpecified: 'Not specified separately',
    subtotal: 'Subtotal before fees',
    maabarFee: 'Maabar Commission (0%)',
    total: 'Total',
    payMethod: 'Payment Method',
    choosePayment: 'Choose your payment plan',
    applePay: 'Apple Pay',
    card: 'Credit Card',
    mada: 'Mada',
    cardNum: 'Card Number',
    expiry: 'Expiry Date',
    cvv: 'CVV',
    cardName: 'Name on Card',
    pay: 'Pay Now',
    paying: 'Processing...',
    secure: 'Encrypted & Secure',
    back: 'Back',
    cancel: 'Cancel',
    sar: 'SAR',
    firstPayment: 'First Payment',
    secondPayment: 'Second Payment (before shipping)',
    payOption30: 'Safest',
    payOption50: 'Balanced',
    payOption100: 'Fastest',
    payOption30sub: 'Rest before shipping · Supplier starts immediately',
    payOption50sub: 'Rest before shipping · Priority preparation',
    payOption100sub: 'One payment · Supplier ships immediately',
    secondPayNote: 'Pay second installment',
    secondPaymentTitle: 'Second Payment',
    payNowLabel: 'You Pay Now',
    amountDue: 'Amount Due',
    notSpecified: 'Not specified',
    rfqSummary: 'RFQ & Payment Summary',
    requestRef: 'Request Reference',
    supplierSnapshot: 'Supplier & Commercial Terms',
    supplierName: 'Supplier',
    supplierId: 'Supplier ID',
    verification: 'Verification',
    verifiedSupplier: 'Verified supplier',
    leadTime: 'Lead time',
    origin: 'Origin',
    supplierStarts: 'Supplier preparation',
    supplierStartsNote: 'Once payment succeeds, the supplier is notified immediately and can start according to the selected payment plan.',
    protectionTitle: 'Protected through Maabar',
    protectionBody: 'This payment confirms the commercial order on Maabar. Manual cancellation is unavailable after a successful charge, and any issue should be raised with Maabar before funds are released to the supplier.',
    commercialTrust: 'Clearer supplier trust signals',
    reviewedByMaabar: 'Reviewed by Maabar',
    tradeProfile: 'Trade profile on file',
    wechatAvailable: 'WeChat available',
    factoryPhotos: 'Factory photos available',
    cancellationNote: 'Manual cancellation is unavailable after a successful charge. For any issue, contact Maabar support before funds are released.',
    paymentUnavailableTitle: 'Payments are temporarily unavailable',
    paymentUnavailableBody: 'The payment gateway is not configured correctly yet. Checkout is blocked so Maabar does not record a paid order without a real card charge.',
  },
  zh: {
    tag: 'Maabar · 结账',
    title: '完成付款',
    sub: '按您的信任程度付款 — 每笔交易建立更多信任',
    orderSummary: '订单摘要',
    product: '产品',
    quantity: '数量',
    unitPrice: '单价',
    productTotal: '产品合计',
    shippingCost: '运费',
    shippingMethod: '运输方式',
    shippingNotSpecified: '未单独填写',
    subtotal: '手续费前小计',
    maabarFee: 'Maabar 零佣金 (0%)',
    total: '总计',
    payMethod: '支付方式',
    choosePayment: '选择付款计划',
    applePay: 'Apple Pay',
    card: '信用卡',
    mada: 'Mada',
    cardNum: '卡号',
    expiry: '有效期',
    cvv: 'CVV',
    cardName: '持卡人姓名',
    pay: '立即付款',
    paying: '处理中...',
    secure: '加密安全',
    back: '返回',
    cancel: '取消',
    sar: 'SAR',
    firstPayment: '首付',
    secondPayment: '尾款（发货前）',
    payOption30: '最安全',
    payOption50: '均衡',
    payOption100: '最快',
    payOption30sub: '余款发货前付 · 供应商立即开始',
    payOption50sub: '余款发货前付 · 优先处理',
    payOption100sub: '一次付清 · 供应商立即发货',
    secondPayNote: '支付尾款',
    secondPaymentTitle: '支付尾款',
    payNowLabel: '当前支付',
    amountDue: '应付金额',
    notSpecified: '未说明',
    rfqSummary: 'RFQ 与付款摘要',
    requestRef: '需求编号',
    supplierSnapshot: '供应商与商业条款',
    supplierName: '供应商',
    supplierId: '供应商编号',
    verification: '审核状态',
    verifiedSupplier: '认证供应商',
    leadTime: '交期',
    origin: '原产地',
    supplierStarts: '供应商备货',
    supplierStartsNote: '付款成功后，系统会立即通知供应商，并按您选择的付款方案开始处理订单。',
    protectionTitle: '通过 Maabar 受保护',
    protectionBody: '这笔付款会确认 Maabar 内的商业订单。成功扣款后不支持手动取消，如有问题，请在向供应商放款前先联系 Maabar。',
    commercialTrust: '更清晰的供应商信任信号',
    reviewedByMaabar: '已通过 Maabar 审核',
    tradeProfile: '已提供店铺/官网链接',
    wechatAvailable: '支持 WeChat',
    factoryPhotos: '已提供工厂图片',
    cancellationNote: '成功扣款后不支持手动取消。如有问题，请在放款前联系 Maabar 支持。',
    paymentUnavailableTitle: '付款暂不可用',
    paymentUnavailableBody: '支付网关尚未正确配置。当前已阻止结账，避免 Maabar 在没有真实扣款的情况下把订单记录为已付款。',
  }
};

export default function Checkout({ lang, user, profile }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('checkout', lang);

  const { offer, request, isSecondPayment } = location.state || {};
  const isDirectBuy = offer?.isDirect === true; // شراء مباشر أو عينة — دفعة واحدة دائماً
  const checkoutCurrency = String(offer?.currency || 'USD').toUpperCase();
  const currencyLabel = checkoutCurrency === 'SAR' ? t.sar : checkoutCurrency;
  const moyasarPublishableKey = getMoyasarPublishableKey();
  const paymentGatewayReady = isMoyasarConfigured(moyasarPublishableKey);

  const [payMethod, setPayMethod] = useState('card');
  const [selectedPct, setSelectedPct] = useState(isDirectBuy ? 100 : 30);
  const [payError, setPayError] = useState('');
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [moyasarFormReady, setMoyasarFormReady] = useState(false);
  const [checkoutStateKey, setCheckoutStateKey] = useState('');
  const [supplierSnapshot, setSupplierSnapshot] = useState(offer?.profiles || null);

  // حساب المبالغ
  const productTotal = offer ? getOfferProductSubtotal(offer, request) : 0;
  const shippingCost = offer ? getOfferShippingCost(offer) : 0;
  const subtotal = offer ? getOfferEstimatedTotal(offer, request) : 0;
  const maabarFee = 0;
  const total = parseFloat(subtotal.toFixed(2));
  const supplierAmount = parseFloat((subtotal * 0.96).toFixed(2));

  const firstPayment  = isSecondPayment ? parseFloat(request?.payment_second || 0) : Math.round(total * (selectedPct / 100));
  const secondPayment = isSecondPayment ? 0 : total - firstPayment;

  const paymentOptions = [
    {
      pct: 30,
      label: t.payOption30,
      sub: t.payOption30sub,
    },
    {
      pct: 50,
      label: t.payOption50,
      sub: t.payOption50sub,
    },
    {
      pct: 100,
      label: t.payOption100,
      sub: t.payOption100sub,
    },
  ];

  const supplierTrustSignals = buildSupplierTrustSignals(supplierSnapshot || {});
  const supplierMaabarId = getSupplierMaabarId(supplierSnapshot || {});
  const isReviewedSupplier = isSupplierPubliclyVisible(supplierSnapshot?.status);
  const shippingMethod = getOfferShippingMethod(offer, lang);
  const requestTitle = isAr
    ? request?.title_ar || request?.title_en || request?.title_zh || '—'
    : lang === 'zh'
      ? request?.title_zh || request?.title_en || request?.title_ar || '—'
      : request?.title_en || request?.title_ar || request?.title_zh || '—';
  const supplierName = supplierSnapshot?.company_name || t.notSpecified;
  const leadTimeLabel = offer?.delivery_days
    ? (isAr ? `${offer.delivery_days} يوم` : lang === 'zh' ? `${offer.delivery_days} 天` : `${offer.delivery_days} days`)
    : t.notSpecified;
  const originLabel = offer?.origin || supplierSnapshot?.country || 'China';

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    if (!offer || !request) { nav('/dashboard'); return; }
    if (!paymentGatewayReady) {
      setApplePayAvailable(false);
      setMoyasarFormReady(false);
      return;
    }

    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      setApplePayAvailable(true);
    }

    // Patch customElements.define once so repeated Moyasar.init() calls
    // (triggered by re-renders) don't throw "already used with this registry".
    if (!window.__moyasarCustomElementsPatch) {
      window.__moyasarCustomElementsPatch = true;
      const _origDefine = customElements.define.bind(customElements);
      customElements.define = function (name, constructor, options) {
        if (customElements.get(name)) return;
        return _origDefine(name, constructor, options);
      };
    }

    // Inject CSS once — persist across re-renders, never remove.
    if (!document.getElementById('maabar-moyasar-css')) {
      const link = document.createElement('link');
      link.id = 'maabar-moyasar-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('maabar-moyasar-overrides')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'maabar-moyasar-overrides';
      styleEl.textContent = `
        div#mysr { font-family: 'Tajawal', sans-serif !important; background: #faf9f7 !important; border: 1px solid #e8e5de !important; border-radius: 12px !important; padding: 20px 18px !important; box-shadow: none !important; }
        div#mysr input, div#mysr select { font-family: 'Tajawal', sans-serif !important; background: transparent !important; border: none !important; border-bottom: 1px solid #e8e5de !important; border-radius: 0 !important; box-shadow: none !important; outline: none !important; padding: 8px 2px !important; color: #1a1814 !important; }
        div#mysr input:focus, div#mysr select:focus { border-bottom-color: #1a1814 !important; box-shadow: none !important; }
        div#mysr label, div#mysr .label { font-family: 'Tajawal', sans-serif !important; color: #b0ab9e !important; font-size: 12px !important; }
        div#mysr button[type="submit"], div#mysr .bg-primary { background: #1a1814 !important; color: #fff !important; border-radius: 10px !important; font-family: 'Tajawal', sans-serif !important; border: none !important; box-shadow: none !important; }
        div#mysr button[type="submit"]:hover, div#mysr .bg-primary:hover { background: #2d2a24 !important; }
        div#mysr .shadow-input { box-shadow: none !important; border: none !important; border-bottom: 1px solid #e8e5de !important; }
      `;
      document.head.appendChild(styleEl);
    }

    // If script already executed (window.Moyasar present), mark ready and stop.
    if (window.Moyasar?.init) {
      setMoyasarFormReady(true);
      return;
    }

    // Inject script once — persist across re-renders, never remove.
    if (!document.getElementById('maabar-moyasar-script')) {
      const script = document.createElement('script');
      script.id = 'maabar-moyasar-script';
      script.src = 'https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.umd.min.js';
      script.async = true;
      script.onload = () => setMoyasarFormReady(true);
      script.onerror = () => setPayError(isAr ? 'تعذر تحميل نموذج الدفع حالياً' : lang === 'zh' ? '当前无法加载付款表单' : 'Unable to load the payment form right now');
      document.body.appendChild(script);
    }
    // No cleanup — script/CSS/style are intentionally persistent for the page lifetime.
  }, [nav, offer, request, user, paymentGatewayReady, isAr, lang]);

  useEffect(() => {
    setSupplierSnapshot(offer?.profiles || null);
  }, [offer]);

  useEffect(() => {
    let cancelled = false;

    async function loadSupplierSnapshot() {
      if (offer?.profiles || !offer?.supplier_id) return;
      const data = await fetchSupplierPublicProfileById(sb, offer.supplier_id);

      if (!cancelled && data) setSupplierSnapshot(data);
    }

    loadSupplierSnapshot();
    return () => { cancelled = true; };
  }, [offer]);

  useEffect(() => {
    if (!offer || !request) return;

    const nextKey = savePendingMoyasarCheckout({
      offer,
      request,
      isSecondPayment: Boolean(isSecondPayment),
      selectedPct,
      firstPayment,
      secondPayment,
      checkoutCurrency,
      supplierSnapshot: supplierSnapshot || offer?.profiles || null,
      payMethod,
      total,
    });

    setCheckoutStateKey(nextKey);
  }, [offer, request, isSecondPayment, selectedPct, firstPayment, secondPayment, checkoutCurrency, supplierSnapshot, payMethod, total]);

  useEffect(() => {
    if (!paymentGatewayReady || !moyasarFormReady || !offer || !request || !checkoutStateKey) return;
    if (!window.Moyasar?.init) return;

    const mountNode = document.getElementById('maabar-moyasar-form');
    if (!mountNode) return;

    mountNode.innerHTML = '';
    setPayError('');

    try {
      window.Moyasar.init({
        element: '#maabar-moyasar-form',
        amount: buildMoyasarAmountMinorUnits(firstPayment),
        currency: checkoutCurrency,
        description: `${requestTitle} · ${isSecondPayment ? 'second payment' : `${selectedPct}%`} · ${String(request.id).slice(0, 8).toUpperCase()}`,
        publishable_api_key: moyasarPublishableKey,
        callback_url: buildMoyasarCallbackUrl(checkoutStateKey),
        methods: [payMethod === 'apple_pay' ? 'applepay' : 'creditcard'],
        supported_networks: payMethod === 'mada' ? ['mada'] : ['visa', 'mastercard', 'mada'],
        apple_pay: {
          country: 'SA',
          label: 'MAABAR',
          validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
        },
      });
    } catch (error) {
      console.error('moyasar init error:', error);
      setPayError(isAr ? 'تعذر تهيئة نموذج الدفع الآن' : lang === 'zh' ? '暂时无法初始化付款表单' : 'Unable to initialize the payment form right now');
    }
  }, [paymentGatewayReady, moyasarFormReady, offer, request, checkoutStateKey, firstPayment, checkoutCurrency, requestTitle, selectedPct, isSecondPayment, payMethod, moyasarPublishableKey, isAr, lang]);


  if (!offer || !request) return null;

  const fmt = (n) => Number(n).toLocaleString('ar-SA-u-nu-latn', { maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>

      {/* HEADER */}
      <div style={{ padding: '40px 60px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
          {t.tag}
        </p>
        <h1 style={{ fontSize: isAr ? 36 : 42, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : -1, marginBottom: 8 }}>
          {isSecondPayment ? t.secondPaymentTitle : t.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {t.sub}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ padding: 'clamp(24px, 5vw, 40px) clamp(16px, 6vw, 60px)', maxWidth: 900, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>

          {/* LEFT — ORDER SUMMARY */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
              {t.rfqSummary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
              {[
                { label: t.requestRef, val: request?.id ? String(request.id).slice(0, 8).toUpperCase() : '—' },
                { label: t.product, val: requestTitle },
                { label: t.quantity, val: request.quantity || '—' },
                { label: t.unitPrice, val: `${fmt(offer.price)} ${currencyLabel}` },
                { label: t.productTotal, val: `${fmt(productTotal)} ${currencyLabel}` },
                { label: t.shippingCost, val: hasOfferShippingCost(offer) ? `${fmt(shippingCost)} ${currencyLabel}` : t.shippingNotSpecified },
                ...(getOfferShippingMethod(offer, lang) ? [{ label: t.shippingMethod, val: getOfferShippingMethod(offer, lang) }] : []),
                { label: t.subtotal, val: `${fmt(subtotal)} ${currencyLabel}` },
                { label: t.maabarFee, val: `${fmt(maabarFee)} ${currencyLabel}` },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-raised)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{item.val}</span>
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div style={{ background: 'var(--bg-overlay)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.total}</span>
              <span style={{ fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                {fmt(total)} <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{currencyLabel}</span>
              </span>
            </div>

            {/* PAYMENT SPLIT BREAKDOWN */}
            {!isSecondPayment && selectedPct < 100 && (
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.firstPayment}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)' }}>{fmt(firstPayment)} {currencyLabel}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.secondPayment}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{fmt(secondPayment)} {currencyLabel}</span>
                </div>
              </div>
            )}

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 16 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
                {t.supplierSnapshot}
              </p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.supplierName}</span>
                  <strong style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right' }}>{supplierName}</strong>
                </div>
                {supplierMaabarId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.supplierId}</span>
                    <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{supplierMaabarId}</strong>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {isReviewedSupplier && (
                  <span style={trustBadgeStyle('#5a9a72', 'rgba(58,122,82,0.1)', 'rgba(58,122,82,0.18)')}>
                    ✓ {t.verifiedSupplier}
                  </span>
                )}
                <span style={trustBadgeStyle('var(--text-secondary)', 'var(--bg-subtle)', 'var(--border-muted)')}>
                  {t.leadTime}: {leadTimeLabel}
                </span>
                <span style={trustBadgeStyle('var(--text-secondary)', 'var(--bg-subtle)', 'var(--border-subtle)')}>
                  {t.origin}: {originLabel}
                </span>
                {shippingMethod && (
                  <span style={trustBadgeStyle('var(--text-secondary)', 'var(--bg-subtle)', 'var(--border-subtle)')}>
                    {t.shippingMethod}: {shippingMethod}
                  </span>
                )}
              </div>
              {(isReviewedSupplier || supplierTrustSignals.length > 0) && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {[
                    isReviewedSupplier ? t.reviewedByMaabar : null,
                    supplierTrustSignals.includes('trade_profile_available') ? t.tradeProfile : null,
                    supplierTrustSignals.includes('wechat_available') ? t.wechatAvailable : null,
                    supplierTrustSignals.includes('factory_media_available') ? t.factoryPhotos : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>

            <div style={{ background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
                {t.protectionTitle}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.protectionBody}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{t.supplierStarts}:</strong> {t.supplierStartsNote}
              </p>
            </div>
          </div>

          {/* RIGHT — PAYMENT */}
          <div>
            {!paymentGatewayReady && (
              <div style={{
                background: 'rgba(217,96,96,0.08)',
                border: '1px solid rgba(217,96,96,0.22)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: 20,
              }}>
                <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#d96060', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                  {t.paymentUnavailableTitle}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {t.paymentUnavailableBody}
                </p>
              </div>
            )}

            {/* Payment Percentage Options — not for second payment or direct buy/sample */}
            {!isSecondPayment && !isDirectBuy && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
                  {t.choosePayment}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paymentOptions.map(opt => (
                    <button key={opt.pct} onClick={() => setSelectedPct(opt.pct)} disabled={!paymentGatewayReady} style={{
                      padding: '14px 16px', cursor: paymentGatewayReady ? 'pointer' : 'not-allowed', textAlign: isAr ? 'right' : 'left',
                      background: selectedPct === opt.pct ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                      border: `1px solid ${selectedPct === opt.pct ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-lg)', transition: 'all 0.15s',
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: selectedPct === opt.pct ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {opt.pct}% — {opt.label}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {fmt(Math.round(total * opt.pct / 100))} {currencyLabel}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', lineHeight: 1.5 }}>{opt.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pay Amount Display */}
            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 6, letterSpacing: 1 }}>
                {isSecondPayment ? t.amountDue : t.payNowLabel}
              </p>
              <p style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                {fmt(firstPayment)} <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{currencyLabel}</span>
              </p>
            </div>

            {/* METHOD TABS */}
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
              {t.payMethod}
            </p>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {[
                ...(applePayAvailable ? [{ id: 'apple_pay', label: t.applePay }] : []),
                { id: 'mada', label: t.mada },
                { id: 'card', label: t.card },
              ].map(m => (
                <button key={m.id} onClick={() => setPayMethod(m.id)} disabled={!paymentGatewayReady} style={{
                  flex: 1, padding: '9px 8px', fontSize: 11, cursor: paymentGatewayReady ? 'pointer' : 'not-allowed',
                  background: payMethod === m.id ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                  color: payMethod === m.id ? 'var(--text-primary)' : 'var(--text-disabled)',
                  border: `1px solid ${payMethod === m.id ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)', transition: 'all 0.15s',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                }}>
                  {m.label}
                </button>
              ))}
            </div>

            <p style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textAlign: isAr ? 'right' : 'left',
              marginBottom: 12,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              lineHeight: 1.7,
            }}>
              {isAr
                ? 'سيظهر نموذج Moyasar الآمن هنا. لا يسجَّل الطلب كمدفوع داخل مَعبر إلا بعد عودة Moyasar بحالة دفع ناجحة ومتحقق منها.'
                : lang === 'zh'
                  ? '安全的 Moyasar 付款表单会显示在这里。只有在 Moyasar 返回并验证为付款成功后，Maabar 才会把订单记录为已付款。'
                  : 'The secure Moyasar form appears here. Maabar records the order as paid only after Moyasar returns a verified paid status.'}
            </p>

            <p style={{
              fontSize: 12,
              color: 'rgba(220,100,80,0.85)',
              textAlign: isAr ? 'right' : 'left',
              marginBottom: 12,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              lineHeight: 1.5,
            }}>
              {t.cancellationNote}
            </p>

            <div id="maabar-moyasar-form" style={{
              minHeight: paymentGatewayReady ? 280 : 0,
            }} />

            {payError && (
              <p style={{ fontSize: 13, color: '#d96060', textAlign: 'center', marginTop: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {payError}
              </p>
            )}

            <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-disabled)', marginTop: 12, letterSpacing: 0.5 }}>
              {t.secure} · Moyasar
            </p>

            {/* CANCEL */}
            <button onClick={() => nav(-1)} style={{
              width: '100%', background: 'none', border: 'none',
              color: 'var(--text-disabled)', fontSize: 11, cursor: 'pointer',
              marginTop: 10, letterSpacing: 1.5, textTransform: 'uppercase',
              fontFamily: 'var(--font-sans)',
            }}>
              {t.cancel}
            </button>
          </div>
        </div>
      </div>

      <Footer lang={lang} />

      <style>{`
        @media (max-width: 768px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

const trustBadgeStyle = (color, background, borderColor) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 10,
  letterSpacing: 0.4,
  color,
  background,
  border: `1px solid ${borderColor}`,
});
