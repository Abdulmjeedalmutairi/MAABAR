import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';

const MOYASAR_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';
const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const T = {
  ar: {
    tag: 'مَعبر · الدفع',
    title: 'إتمام الدفع',
    sub: 'ادفع بقدر ما تثق — وزّد ثقتك مع كل صفقة',
    orderSummary: 'ملخص الطلب',
    product: 'المنتج',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    subtotal: 'المجموع',
    maabarFee: 'رسوم مَعبر (2%)',
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
  },
  en: {
    tag: 'Maabar · Checkout',
    title: 'Complete Payment',
    sub: 'Pay what you\'re comfortable with — your money moves when you decide',
    orderSummary: 'Order Summary',
    product: 'Product',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    subtotal: 'Subtotal',
    maabarFee: 'Maabar Fee (2%)',
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
  },
  zh: {
    tag: 'Maabar · 结账',
    title: '完成付款',
    sub: '按您的信任程度付款 — 每笔交易建立更多信任',
    orderSummary: '订单摘要',
    product: '产品',
    quantity: '数量',
    unitPrice: '单价',
    subtotal: '小计',
    maabarFee: 'Maabar手续费 (2%)',
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
  }
};

export default function Checkout({ lang, user, profile }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const { offer, request, isSecondPayment } = location.state || {};

  const [payMethod, setPayMethod] = useState('card');
  const [selectedPct, setSelectedPct] = useState(30);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  // حساب المبالغ
  const subtotal = offer ? parseFloat(offer.price) * parseFloat(request?.quantity || 1) : 0;
  const maabarFee = parseFloat((subtotal * 0.02).toFixed(2));
  const total = parseFloat((subtotal + maabarFee).toFixed(2));
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

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    if (!offer || !request) { nav('/dashboard'); return; }

    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      setApplePayAvailable(true);
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
    document.head.appendChild(link);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
      if (document.head.contains(link)) document.head.removeChild(link);
    };
  }, []);

  const handleApplePay = async () => {
    if (!window.ApplePaySession) return;
    setPaying(true);

    const appleRequest = {
      countryCode: 'SA', currencyCode: 'SAR',
      supportedNetworks: ['visa', 'masterCard', 'mada'],
      merchantCapabilities: ['supports3DS'],
      total: { label: 'مَعبر', amount: firstPayment.toString() },
    };

    const session = new ApplePaySession(3, appleRequest);
    session.onvalidatemerchant = async () => {};
    session.onpaymentauthorized = async (event) => {
      try {
        await processPayment('apple_pay', event.payment.token);
        session.completePayment(ApplePaySession.STATUS_SUCCESS);
      } catch {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        setPaying(false);
      }
    };
    session.oncancel = () => setPaying(false);
    session.begin();
  };

  const handleCardPay = async () => {
    if (!card.number || !card.expiry || !card.cvv || !card.name) {
      alert(isAr ? 'يرجى تعبئة كل الحقول' : 'Please fill all fields');
      return;
    }
    setPayError('');
    setPaying(true);
    try {
      await processPayment('card', null);
    } catch (e) {
      setPaying(false);
      setPayError(isAr ? 'فشلت عملية الدفع — تحقق من بيانات بطاقتك وحاول مجدداً' : 'Payment failed — please check your card details and try again');
    }
  };

  const processPayment = async (method, token) => {
    if (isSecondPayment) {
      // دفع الدفعة الثانية
      await sb.from('payments').insert({
        request_id: request.id,
        buyer_id: user.id,
        supplier_id: offer.supplier_id,
        amount: firstPayment,
        amount_first: 0,
        amount_second: firstPayment,
        payment_pct: request.payment_pct,
        status: 'second_paid',
        moyasar_id: `temp_${Date.now()}`,
      });
      await sb.from('requests').update({
        status: 'shipping',
        shipping_status: 'shipping',
      }).eq('id', request.id);
    } else {
      // دفع الدفعة الأولى (أو الكاملة)
      const { data: payment, error } = await sb.from('payments').insert({
        request_id: request.id,
        buyer_id: user.id,
        supplier_id: offer.supplier_id,
        amount: total,
        amount_first: firstPayment,
        amount_second: secondPayment,
        payment_pct: selectedPct,
        maabar_fee: maabarFee + (subtotal * 0.04),
        supplier_amount: supplierAmount,
        status: 'first_paid',
        moyasar_id: `temp_${Date.now()}`,
      }).select().single();

      if (error) throw error;

      await sb.from('requests').update({
        status: 'paid',
        payment_id: payment.id,
        payment_pct: selectedPct,
        payment_second: secondPayment,
      }).eq('id', request.id);

      // إشعار للمورد
      const reqTitle = request?.title_ar || request?.title_en || '';
      try {
        const { data: supProf } = await sb.from('profiles').select('email,company_name').eq('id', offer.supplier_id).single();
        if (supProf?.email) {
          await fetch(SEND_EMAILS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({
              type: 'payment_received_supplier',
              to: supProf.email,
              data: { requestTitle: reqTitle, amount: firstPayment, name: supProf.company_name || 'Supplier' },
            }),
          });
        }
      } catch (e) { console.error('email error:', e); }
      await sb.from('notifications').insert({
        user_id: offer.supplier_id,
        type: 'payment_received',
        title_ar: `وصلت دفعتك الأولى — ${firstPayment} ريال. ابدأ التجهيز الآن`,
        title_en: `First payment received — ${firstPayment} SAR. Start preparation now`,
        title_zh: `首付已收到 — ${firstPayment} SAR. 立即开始备货`,
        ref_id: request.id,
        is_read: false,
      });
    }

    // إيميل تأكيد للتاجر
    try {
      if (user?.email) {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: 'payment_confirmation_buyer',
            to: user.email,
            data: { requestTitle: reqTitle, amount: firstPayment, name: '' },
          }),
        });
      }
    } catch (e) { console.error('buyer email error:', e); }

    nav('/payment-success', {
      state: { offer, request, total: firstPayment, method, isSecondPayment }
    });
  };

  if (!offer || !request) return null;

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'var(--bg-base)' }}>

      {/* HEADER */}
      <div style={{ padding: '40px 60px 32px', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
          {t.tag}
        </p>
        <h1 style={{ fontSize: isAr ? 36 : 42, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : -1, marginBottom: 8 }}>
          {isSecondPayment ? (isAr ? 'الدفعة الثانية' : 'Second Payment') : t.title}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {t.sub}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ padding: '40px 60px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

          {/* LEFT — ORDER SUMMARY */}
          <div>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontFamily: 'var(--font-sans)' }}>
              {t.orderSummary}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 16 }}>
              {[
                { label: t.product, val: isAr ? request.title_ar || request.title_en : request.title_en || request.title_ar },
                { label: t.quantity, val: request.quantity || '—' },
                { label: t.unitPrice, val: `${fmt(offer.price)} ${t.sar}` },
                { label: t.subtotal, val: `${fmt(subtotal)} ${t.sar}` },
                { label: t.maabarFee, val: `${fmt(maabarFee)} ${t.sar}` },
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
                {fmt(total)} <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{t.sar}</span>
              </span>
            </div>

            {/* PAYMENT SPLIT BREAKDOWN */}
            {!isSecondPayment && selectedPct < 100 && (
              <div style={{ background: 'rgba(139,120,255,0.06)', border: '1px solid rgba(139,120,255,0.15)', borderRadius: 'var(--radius-lg)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.firstPayment}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'rgba(139,120,255,0.85)' }}>{fmt(firstPayment)} {t.sar}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.secondPayment}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{fmt(secondPayment)} {t.sar}</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — PAYMENT */}
          <div>
            {/* Payment Percentage Options — not for second payment */}
            {!isSecondPayment && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontFamily: 'var(--font-sans)' }}>
                  {t.choosePayment}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paymentOptions.map(opt => (
                    <button key={opt.pct} onClick={() => setSelectedPct(opt.pct)} style={{
                      padding: '14px 16px', cursor: 'pointer', textAlign: isAr ? 'right' : 'left',
                      background: selectedPct === opt.pct ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                      border: `1px solid ${selectedPct === opt.pct ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-lg)', transition: 'all 0.15s',
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: selectedPct === opt.pct ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {opt.pct}% — {opt.label}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(139,120,255,0.85)' }}>
                          {fmt(Math.round(total * opt.pct / 100))} {t.sar}
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
                {isSecondPayment ? (isAr ? 'المبلغ المستحق' : 'Amount Due') : (isAr ? 'تدفع الآن' : 'You Pay Now')}
              </p>
              <p style={{ fontSize: 32, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
                {fmt(firstPayment)} <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{t.sar}</span>
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
                <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
                  flex: 1, padding: '9px 8px', fontSize: 11, cursor: 'pointer',
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

            {/* APPLE PAY */}
            {payMethod === 'apple_pay' && (
              <button onClick={handleApplePay} disabled={paying} style={{
                width: '100%', background: '#000', color: '#fff', border: 'none',
                borderRadius: 8, padding: '14px', fontSize: 15,
                cursor: paying ? 'not-allowed' : 'pointer',
                opacity: paying ? 0.5 : 1, marginBottom: 12,
              }}>
                {paying ? t.paying : 'Apple Pay'}
              </button>
            )}

            {/* CARD / MADA */}
            {(payMethod === 'card' || payMethod === 'mada') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle(isAr)}>{t.cardNum}</label>
                  <input style={inputStyle} type="text" maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                      setCard({ ...card, number: v.replace(/(.{4})/g, '$1 ').trim() });
                    }}
                    dir="ltr"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle(isAr)}>{t.expiry}</label>
                    <input style={inputStyle} type="text" maxLength={5}
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
                        setCard({ ...card, expiry: v });
                      }}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label style={labelStyle(isAr)}>{t.cvv}</label>
                    <input style={inputStyle} type="password" maxLength={4}
                      placeholder="•••"
                      value={card.cvv}
                      onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle(isAr)}>{t.cardName}</label>
                  <input style={inputStyle} type="text"
                    placeholder="MOHAMMED AL-MUTAIRI"
                    value={card.name}
                    onChange={e => setCard({ ...card, name: e.target.value.toUpperCase() })}
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {/* CANCELLATION POLICY */}
            {payMethod !== 'apple_pay' && (
              <p style={{
                fontSize: 12,
                color: 'rgba(220,100,80,0.85)',
                textAlign: 'center',
                marginBottom: 12,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                lineHeight: 1.5,
              }}>
                بعد إتمام الدفع لا يمكن الإلغاء أو استرداد المبلغ
              </p>
            )}

            {/* PAY BUTTON */}
            {payMethod !== 'apple_pay' && (
              <button onClick={handleCardPay} disabled={paying} style={{
                width: '100%', background: paying ? 'var(--bg-raised)' : 'rgba(255,255,255,0.88)',
                color: paying ? 'var(--text-disabled)' : '#0a0a0b',
                border: 'none', padding: '14px',
                fontSize: 14, fontWeight: 500, cursor: paying ? 'not-allowed' : 'pointer',
                borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                minHeight: 48,
              }}>
                {paying ? t.paying : `${t.pay} — ${fmt(firstPayment)} ${t.sar}`}
              </button>
            )}
            {payError && (
              <p style={{ fontSize: 13, color: '#d96060', textAlign: 'center', marginTop: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {payError}
              </p>
            )}

            {/* SECURE */}
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

const labelStyle = (isAr) => ({
  display: 'block', fontSize: 10, letterSpacing: 1.5,
  textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6,
  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
});

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border-default)',
  background: 'var(--bg-raised)',
  fontSize: 13, color: 'var(--text-primary)', outline: 'none',
  borderRadius: 'var(--radius-md)', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
