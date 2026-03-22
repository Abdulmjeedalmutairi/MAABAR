import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';

// ← استبدل بـ publishable key من Moyasar بعد التسجيل
const MOYASAR_PUBLISHABLE_KEY = 'pk_test_YOUR_KEY_HERE';

const T = {
  ar: {
    tag: 'مَعبر · الدفع',
    title: 'إتمام الدفع',
    sub: 'مبلغك محجوز بأمان حتى تستلم طلبك',
    orderSummary: 'ملخص الطلب',
    product: 'المنتج',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    subtotal: 'المجموع',
    maabarFee: 'رسوم مَعبر (2%)',
    total: 'الإجمالي',
    payMethod: 'طريقة الدفع',
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
    escrowNote: 'مبلغك لن يُحوَّل للمورد إلا بعد تأكيدك استلام البضاعة',
    back: 'رجوع',
    cancel: 'إلغاء',
    sar: 'ريال',
  },
  en: {
    tag: 'Maabar · Checkout',
    title: 'Complete Payment',
    sub: 'Your funds are held securely until you confirm receipt',
    orderSummary: 'Order Summary',
    product: 'Product',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    subtotal: 'Subtotal',
    maabarFee: 'Maabar Fee (2%)',
    total: 'Total',
    payMethod: 'Payment Method',
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
    escrowNote: 'Funds will not be released to supplier until you confirm receipt',
    back: 'Back',
    cancel: 'Cancel',
    sar: 'SAR',
  },
  zh: {
    tag: 'Maabar · 结账',
    title: '完成付款',
    sub: '您的资金安全托管，直至确认收货',
    orderSummary: '订单摘要',
    product: '产品',
    quantity: '数量',
    unitPrice: '单价',
    subtotal: '小计',
    maabarFee: 'Maabar手续费 (2%)',
    total: '总计',
    payMethod: '支付方式',
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
    escrowNote: '资金将在您确认收货后才释放给供应商',
    back: '返回',
    cancel: '取消',
    sar: 'SAR',
  }
};

export default function Checkout({ lang, user, profile }) {
  const nav = useNavigate();
  const location = useLocation();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  // بيانات الطلب تجي من الـ navigation state
  const { offer, request } = location.state || {};

  const [payMethod, setPayMethod] = useState('card');
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [paying, setPaying] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);

  // حساب المبالغ
  const subtotal = offer ? parseFloat(offer.price) * parseFloat(request?.quantity || 1) : 0;
  const maabarFee = parseFloat((subtotal * 0.02).toFixed(2));
  const total = parseFloat((subtotal + maabarFee).toFixed(2));
  const supplierAmount = parseFloat((subtotal * 0.96).toFixed(2)); // بعد خصم 4% من المورد

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    if (!offer || !request) { nav('/dashboard'); return; }

    // تحقق من توفر Apple Pay
    if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
      setApplePayAvailable(true);
    }

    // تحميل Moyasar SDK
    const script = document.createElement('script');
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    document.body.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
    document.head.appendChild(link);

    return () => {
      document.body.removeChild(script);
      document.head.removeChild(link);
    };
  }, []);

  const handleApplePay = async () => {
    if (!window.ApplePaySession) return;
    setPaying(true);

    const request = {
      countryCode: 'SA',
      currencyCode: 'SAR',
      supportedNetworks: ['visa', 'masterCard', 'mada'],
      merchantCapabilities: ['supports3DS'],
      total: { label: 'مَعبر', amount: total.toString() },
    };

    const session = new ApplePaySession(3, request);

    session.onvalidatemerchant = async (event) => {
      // هنا راح تحتاج Moyasar merchant validation بعد التسجيل
      // session.completeMerchantValidation(merchantSession);
    };

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
    setPaying(true);
    try {
      await processPayment('card', null);
    } catch {
      setPaying(false);
    }
  };

  const processPayment = async (method, token) => {
    // ← هنا راح يتكامل Moyasar API بعد التسجيل
    // الحين نسجل الدفع في قاعدة البيانات كـ "pending"

    const { data: payment, error } = await sb.from('payments').insert({
      request_id: request.id,
      buyer_id: user.id,
      supplier_id: offer.supplier_id,
      amount: total,
      maabar_fee: maabarFee + (subtotal * 0.04), // 2% من التاجر + 4% من المورد
      supplier_amount: supplierAmount,
      status: 'held',
      moyasar_id: `temp_${Date.now()}`, // ← يُستبدل بـ Moyasar payment ID
    }).select().single();

    if (error) throw error;

    // تحديث حالة الطلب
    await sb.from('requests').update({
      status: 'paid',
      payment_id: payment.id,
    }).eq('id', request.id);

    // إشعار للمورد
    await sb.from('notifications').insert({
      user_id: offer.supplier_id,
      type: 'payment_received',
      title_ar: 'تم استلام الدفع — ابدأ التجهيز',
      title_en: 'Payment received — Start preparing',
      title_zh: '已收到付款 — 开始准备',
      ref_id: request.id,
      is_read: false,
    });

    // توجيه لصفحة النجاح
    nav('/payment-success', {
      state: { payment, offer, request, total, method }
    });
  };

  if (!offer || !request) return null;

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>

      {/* HEADER */}
      <div style={{ padding: '48px 60px 40px', background: 'rgba(0,0,0,0.52)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
          {t.tag}
        </p>
        <h1 style={{ fontSize: isAr ? 44 : 52, fontWeight: 300, color: '#F7F5F2', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', letterSpacing: isAr ? 0 : -1, marginBottom: 10 }}>
          {t.title}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
          {t.sub}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{ background: 'rgba(247,245,242,0.92)', backdropFilter: 'blur(8px)', minHeight: 'calc(100vh - 220px)' }}>
        <div style={{ padding: '48px 60px', maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>

            {/* LEFT — ORDER SUMMARY */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
                {t.orderSummary}
              </p>

              {/* ESCROW NOTE */}
              <div style={{ background: 'rgba(45,122,79,0.06)', border: '1px solid rgba(45,122,79,0.2)', padding: '14px 16px', borderRadius: 3, marginBottom: 24 }}>
                <p style={{ fontSize: 12, color: '#2d7a4f', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  🔒 {t.escrowNote}
                </p>
              </div>

              {/* ITEMS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#E5E0D8', marginBottom: 1 }}>
                {[
                  { label: t.product, val: isAr ? request.title_ar || request.title_en : request.title_en || request.title_ar },
                  { label: t.quantity, val: request.quantity || '—' },
                  { label: t.unitPrice, val: `${fmt(offer.price)} ${t.sar}` },
                  { label: t.subtotal, val: `${fmt(subtotal)} ${t.sar}` },
                  { label: t.maabarFee, val: `${fmt(maabarFee)} ${t.sar}` },
                ].map((item, i) => (
                  <div key={i} style={{ background: '#F7F5F2', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: '#2C2C2C', fontFamily: 'var(--font-body)' }}>{item.val}</span>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div style={{ background: '#2C2C2C', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(247,245,242,0.6)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.total}</span>
                <span style={{ fontSize: 28, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)' }}>
                  {fmt(total)} <span style={{ fontSize: 13, opacity: 0.6 }}>{t.sar}</span>
                </span>
              </div>
            </div>

            {/* RIGHT — PAYMENT */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 20, fontFamily: 'var(--font-body)' }}>
                {t.payMethod}
              </p>

              {/* METHOD TABS */}
              <div style={{ display: 'flex', gap: 1, background: '#E5E0D8', marginBottom: 28 }}>
                {[
                  ...(applePayAvailable ? [{ id: 'apple_pay', label: t.applePay }] : []),
                  { id: 'mada', label: t.mada },
                  { id: 'card', label: t.card },
                ].map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)} style={{
                    flex: 1, padding: '12px 8px', fontSize: 11, cursor: 'pointer',
                    background: payMethod === m.id ? '#2C2C2C' : '#F7F5F2',
                    color: payMethod === m.id ? '#F7F5F2' : '#7a7a7a',
                    border: 'none', transition: 'all 0.2s',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                    letterSpacing: 1,
                  }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* APPLE PAY */}
              {payMethod === 'apple_pay' && (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <button onClick={handleApplePay} disabled={paying} style={{
                    background: '#000', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '16px 48px', fontSize: 17,
                    cursor: 'pointer', width: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: paying ? 0.5 : 1,
                  }}>
                    {paying ? t.paying : <> <span style={{ fontSize: 20 }}>🍎</span> Pay</>}
                  </button>
                </div>
              )}

              {/* CARD / MADA */}
              {(payMethod === 'card' || payMethod === 'mada') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={labelStyle(isAr)}>{t.cardNum}</label>
                    <input style={inputStyle} type="text" maxLength={19}
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                        const formatted = v.replace(/(.{4})/g, '$1 ').trim();
                        setCard({ ...card, number: formatted });
                      }}
                      dir="ltr"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              {/* PAY BUTTON */}
              {payMethod !== 'apple_pay' && (
                <button onClick={handleCardPay} disabled={paying} style={{
                  width: '100%', background: paying ? '#7a7a7a' : '#2C2C2C',
                  color: '#F7F5F2', border: 'none', padding: '15px',
                  fontSize: 13, fontWeight: 500, cursor: paying ? 'not-allowed' : 'pointer',
                  marginTop: 24, letterSpacing: 1, transition: 'all 0.2s',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                }}>
                  {paying ? t.paying : `${t.pay} — ${fmt(total)} ${t.sar}`}
                </button>
              )}

              {/* SECURE */}
              <p style={{ textAlign: 'center', fontSize: 11, color: '#7a7a7a', marginTop: 16, letterSpacing: 1 }}>
                🔒 {t.secure} · Moyasar
              </p>

              {/* CANCEL */}
              <button onClick={() => nav(-1)} style={{ width: '100%', background: 'none', border: 'none', color: '#7a7a7a', fontSize: 11, cursor: 'pointer', marginTop: 12, letterSpacing: 2, textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.5 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>مَعبر © 2026</p>
      </footer>

      {/* MOBILE */}
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
  textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 6,
  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
});

const inputStyle = {
  width: '100%', padding: '12px 14px',
  border: '1px solid #E5E0D8',
  background: 'rgba(247,245,242,0.8)',
  fontSize: 14, color: '#2C2C2C', outline: 'none',
  borderRadius: 3, boxSizing: 'border-box',
  transition: 'border-color 0.2s', letterSpacing: 1,
};