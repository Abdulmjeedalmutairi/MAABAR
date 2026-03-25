import Footer from '../components/Footer';
import React, { useState } from 'react';

const FAQS = {
  ar: [
    { q: 'ما هي مَعبر؟', a: 'مَعبر منصة B2B تربط التاجرن السعوديين بالموردين الصينيين مباشرة وبدون وسطاء.' },
    { q: 'كيف أرفع طلباً؟', a: 'سجل دخولك كتاجر، اضغط على "ارفع طلبك الآن"، وصف المنتج والكمية، وانتظر عروض الموردين.' },
    { q: 'كيف يعمل نظام الدفع؟', a: 'المبلغ يُحجز في المنصة حتى تؤكد استلام البضاعة، بعدها يُحوَّل للمورد تلقائياً.' },
    { q: 'كم العمولة؟', a: 'مَعبر تأخذ 6% من كل صفقة — 4% من المورد و2% من التاجر.' },
    { q: 'ماذا لو لم تصل البضاعة؟', a: 'يمكنك رفع نزاع خلال 14 يوم من تاريخ الاستلام المتوقع، ومَعبر تتدخل وتحل المشكلة.' },
    { q: 'كيف أنضم كمورد؟', a: 'اضغط على "بوابة الموردين"، سجل حسابك، وانتظر موافقة الفريق خلال 48 ساعة.' },
    { q: 'هل المنصة مجانية؟', a: 'التسجيل مجاني تماماً. العمولة تُخصم فقط عند إتمام صفقة حقيقية.' },
    { q: 'ما هي اللغات المدعومة؟', a: 'المنصة تدعم العربية والإنجليزية والصينية.' },
  ],
  en: [
    { q: 'What is Maabar?', a: 'Maabar is a B2B platform connecting Saudi buyers directly with Chinese suppliers, no middlemen.' },
    { q: 'How do I post a request?', a: 'Sign in as a buyer, click "Post Your Request", describe the product and quantity, and wait for supplier offers.' },
    { q: 'How does payment work?', a: 'Pay what you\'re comfortable with — 30%, 50%, or the full amount. Your money moves when you decide, and your trust grows with every successful deal.' },
    { q: 'What is the commission?', a: 'Maabar charges 6% per transaction — 4% from supplier and 2% from buyer.' },
    { q: 'What if my order doesn\'t arrive?', a: 'You can raise a dispute within 14 days and Maabar will intervene as a neutral party.' },
    { q: 'How do I join as a supplier?', a: 'Click "Supplier Portal", register your account, and await approval within 48 hours.' },
    { q: 'Is the platform free?', a: 'Registration is completely free. Commission is only charged when a transaction is completed.' },
    { q: 'What languages are supported?', a: 'The platform supports Arabic, English, and Chinese.' },
  ],
  zh: [
    { q: 'Maabar是什么？', a: 'Maabar是一个B2B平台，直接连接沙特买家和中国供应商，无需中间商。' },
    { q: '如何发布询价？', a: '以买家身份登录，点击"发布需求"，描述产品和数量，等待供应商报价。' },
    { q: '付款如何运作？', a: '资金托管直到您确认收货，然后自动转给供应商。' },
    { q: '佣金是多少？', a: 'Maabar收取每笔交易6%的佣金——供应商4%，买家2%。' },
    { q: '如果货物未到达怎么办？', a: '您可以在14天内提出争议，Maabar将作为中立方介入解决。' },
    { q: '如何加入成为供应商？', a: '点击"供应商门户"，注册账户，48小时内等待审批。' },
    { q: '平台免费吗？', a: '注册完全免费。只有在完成交易时才收取佣金。' },
    { q: '支持哪些语言？', a: '平台支持阿拉伯语、英语和中文。' },
  ]
};

export default function FAQ({ lang }) {
  const isAr = lang === 'ar';
  const faqs = FAQS[lang] || FAQS.ar;
  const [open, setOpen] = useState(null);

  return (
    <div className="about-wrap">
      <div className="about-hero">
        <h1 className={`about-title${isAr ? ' ar' : ''}`}>
          {isAr ? 'الأسئلة الشائعة' : lang === 'zh' ? '常见问题' : 'FAQ'}
        </h1>
      </div>
      <div className="about-body">
        {faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--border-muted)', marginBottom: 0 }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', textAlign: isAr ? 'right' : 'left', background: 'none', border: 'none', padding: '20px 0', fontSize: 16, fontWeight: 500, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {f.q}
              <span style={{ fontSize: 20, color: 'var(--text-secondary)', transition: 'transform 0.2s', transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>
            {open === i && (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, paddingBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
