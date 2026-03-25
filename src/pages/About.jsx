import Footer from '../components/Footer';
import React from 'react';

const PROBLEMS = {
  ar: [
    { problem: 'التكلفة الحقيقية مجهولة قبل الشراء', solution: 'حاسبة ذكية تحسب الجمارك والشحن وضريبة القيمة المضافة تلقائياً' },
    { problem: 'الجودة لا تُعرف إلا بعد وصول البضاعة', solution: 'نظام العينات — اختبر المنتج قبل أن تلتزم بالطلبية الكاملة' },
    { problem: 'المورد مجهول وغير موثوق', solution: 'تحقق بالذكاء الاصطناعي وTrust Score معتمد لكل مورد' },
    { problem: 'التفاوض باللغة الصينية عائق حقيقي', solution: 'مفاوض ذكي يكتب ردودك الاحترافية بالإنجليزية والصينية' },
    { problem: 'الدفع المباشر للمورد ينطوي على مخاطر', solution: 'ادفع بقدر ما تثق — وزّد ثقتك مع كل صفقة' },
    { problem: 'اختيار طريقة الشحن الخطأ يُضيّع الربح', solution: 'مستشار شحن ذكي يوصي بالأنسب لك حسب الوزن والاستعجال' },
    { problem: 'الربح غير محسوب قبل قرار الاستيراد', solution: 'حاسبة الربح تُظهر هامشك الحقيقي قبل أي التزام' },
  ],
  en: [
    { problem: 'True cost is unknown before purchasing', solution: 'Smart calculator computes customs, shipping, and VAT automatically' },
    { problem: 'Quality is only known after delivery', solution: 'Sample system — test the product before committing to a full order' },
    { problem: 'Supplier identity and reliability are uncertain', solution: 'AI-powered verification and Trust Score for every supplier' },
    { problem: 'Negotiating in Chinese is a real barrier', solution: 'AI negotiator writes professional replies in English and Chinese' },
    { problem: 'Direct payment to suppliers carries risk', solution: 'Pay what you\'re comfortable with — your money moves when you decide' },
    { problem: 'Wrong shipping method eats into profit', solution: 'Smart shipping advisor recommends the best option for your shipment' },
    { problem: 'Profit is uncalculated before importing', solution: 'Profit calculator shows your true margin before any commitment' },
  ],
  zh: [
    { problem: '购买前无法了解真实成本', solution: '智能计算器自动计算关税、运费和增值税' },
    { problem: '收货前无法了解产品质量', solution: '样品系统——承接大订单前先测试产品' },
    { problem: '供应商身份和可靠性不明确', solution: 'AI验证和每位供应商的信任评分' },
    { problem: '用中文谈判是真正的障碍', solution: 'AI谈判助手用英文和中文撰写专业回复' },
    { problem: '直接向供应商付款存在风险', solution: '按您的信任程度付款 — 随着每次交易增加信任' },
    { problem: '错误的运输方式会吞噬利润', solution: '智能运输顾问根据您的货物推荐最佳方案' },
    { problem: '进口前未计算利润', solution: '利润计算器在任何承诺前显示您的真实利润率' },
  ],
};

const T = {
  ar: {
    tag: 'مَعبر · لماذا نحن',
    title: 'لماذا معبر؟',
    story: 'يعلم التاجر السعودي أن الصين تزخر بكل ما يحتاجه السوق. غير أن بينه وبين الصفقة الناجحة عقبات طالما أعاقت نمو تجارته — حتى جاء معبر.',
    problemLabel: 'المشكلة',
    solutionLabel: 'الحل في معبر',
    closing: 'معبر ليس مجرد منصة — بل الجسر الآمن الذي يختصر المسافة، ويحمي المال، ويضمن التاجر السعودي من لحظة القرار حتى لحظة الربح.',
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Why Us',
    title: 'Why Maabar?',
    story: 'The Saudi trader knows that China holds everything the market needs. Yet between him and a successful deal stand obstacles that have long hindered business growth — until Maabar.',
    problemLabel: 'The Problem',
    solutionLabel: 'Maabar\'s Solution',
    closing: 'Maabar is not just a platform — it is the secure bridge that closes the distance, protects your capital, and supports the Saudi trader from the moment of decision to the moment of profit.',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 为什么选择我们',
    title: '为什么选择Maabar？',
    story: '沙特贸易商知道中国拥有市场所需的一切。然而，在他与成功交易之间，长期存在着阻碍业务发展的障碍——直到Maabar的出现。',
    problemLabel: '问题',
    solutionLabel: 'Maabar的解决方案',
    closing: 'Maabar不仅仅是一个平台——它是缩短距离、保护资金、支持沙特贸易商从决策时刻到盈利时刻的安全桥梁。',
    copy: 'Maabar © 2026',
  },
};

export default function About({ lang }) {
  const t = T[lang] || T.ar;
  const problems = PROBLEMS[lang] || PROBLEMS.ar;
  const isAr = lang === 'ar';

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'var(--bg-base)' }}>

      {/* HERO */}
      <div style={{
        padding: '80px 60px 64px',
        background: 'var(--bg-overlay)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <p style={{
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: 'var(--text-tertiary)', marginBottom: 24,
          fontFamily: 'var(--font-body)',
        }}>
          {t.tag}
        </p>
        <h1 style={{
          fontSize: isAr ? 52 : 64, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -1,
          lineHeight: 1.1, marginBottom: 28, maxWidth: 640,
        }}>
          {t.title}
        </h1>
        <p style={{
          fontSize: 16, color: 'var(--text-secondary)',
          maxWidth: 560, lineHeight: 1.9, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
        }}>
          {t.story}
        </p>
      </div>

      {/* PROBLEMS & SOLUTIONS */}
      <div style={{ background: 'var(--bg-subtle)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '64px 60px' }}>

          {/* HEADER ROW */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            background: 'var(--border-subtle)',
            marginBottom: 1,
          }}>
            <div style={{ background: 'var(--bg-raised)', padding: '14px 28px' }}>
              <p style={{
                fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)',
              }}>
                {t.problemLabel}
              </p>
            </div>
            <div style={{ background: 'var(--bg-raised)', padding: '14px 28px' }}>
              <p style={{
                fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                color: 'var(--text-tertiary)', fontFamily: 'var(--font-body)',
              }}>
                {t.solutionLabel}
              </p>
            </div>
          </div>

          {/* ROWS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border-subtle)' }}>
            {problems.map((item, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 1, background: 'var(--border-subtle)',
                animation: `fadeIn 0.4s ease ${i * 0.06}s both`,
              }}>
                {/* PROBLEM */}
                <div style={{
                  background: i % 2 === 0 ? 'var(--bg-muted)' : 'var(--bg-subtle)',
                  padding: '22px 28px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{
                    fontSize: 10, color: '#c00', opacity: 0.7,
                    flexShrink: 0, letterSpacing: 1,
                  }}>✕</span>
                  <p style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                  }}>
                    {item.problem}
                  </p>
                </div>

                {/* SOLUTION */}
                <div style={{
                  background: i % 2 === 0 ? 'var(--bg-muted)' : 'var(--bg-subtle)',
                  padding: '22px 28px',
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{
                    fontSize: 10, color: '#2d7a4f', opacity: 0.8,
                    flexShrink: 0, letterSpacing: 1,
                  }}>✓</span>
                  <p style={{
                    fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 400,
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                  }}>
                    {item.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CLOSING */}
          <div style={{
            marginTop: 64,
            padding: '40px 48px',
            background: 'var(--bg-raised)',
            borderRadius: 2,
          }}>
            <p style={{
              fontSize: isAr ? 18 : 20, fontWeight: 300,
              color: 'var(--text-primary)', lineHeight: 1.9,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
              letterSpacing: isAr ? 0 : -0.3,
              maxWidth: 620,
            }}>
              {t.closing}
            </p>
          </div>

        </div>
      </div>

      <Footer lang={lang} />

      {/* MOBILE */}
      <style>{`
        @media (max-width: 768px) {
          .about-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
