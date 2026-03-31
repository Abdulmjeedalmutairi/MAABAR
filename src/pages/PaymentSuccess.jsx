import Footer from '../components/Footer';
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

  const { payment, offer, request, total } = location.state || {};
  const checkoutCurrency = String(offer?.currency || 'USD').toUpperCase();
  const currencyLabel = checkoutCurrency === 'SAR' ? t.sar : checkoutCurrency;

  useEffect(() => {
    if (!payment) { nav('/dashboard'); return; }
    // منع الرجوع لصفحة الدفع
    window.history.replaceState(null, '', '/payment-success');
  }, []);

  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  if (!payment) return null;

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#E5E0D8' }}>
              <div style={{ background: '#2C2C2C', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(247,245,242,0.4)', marginBottom: 12, textTransform: 'uppercase' }}>{t.amount}</p>
                <p style={{ fontSize: 36, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)' }}>
                  {fmt(total)} <span style={{ fontSize: 13, opacity: 0.6 }}>{currencyLabel}</span>
                </p>
              </div>
              <div style={{ background: '#F7F5F2', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 12, textTransform: 'uppercase' }}>{t.status}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#2d7a4f' }}>🔒 {t.held}</p>
              </div>
              <div style={{ background: '#F7F5F2', padding: '28px 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: '#7a7a7a', marginBottom: 12, textTransform: 'uppercase' }}>{t.paymentId}</p>
                <p style={{ fontSize: 12, color: '#2C2C2C', fontFamily: 'var(--font-body)', letterSpacing: 0.5, wordBreak: 'break-all' }}>
                  {payment.moyasar_id || payment.id?.slice(0, 16)}
                </p>
              </div>
            </div>
          </div>

          {/* NEXT STEPS */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
              {t.what}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#E5E0D8' }}>
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
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.5 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{t.copy}</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .success-steps { grid-template-columns: 1fr 1fr !important; }
          .success-details { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
