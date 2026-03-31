import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import BrandLogo from '../components/BrandLogo';

const T = {
  ar: {
    tag: 'مَعبر للموردين',
    title: 'وصّل منتجك\nللسوق السعودي',
    sub: 'بوابة تأسيسية أوضح للموردين الصينيين: سجّل الشركة، أضف رابط متجرك، ثم تابع حالة الطلب بخطوات ومراجعة واضحة بدل الغموض.',
    cta: 'انضم كمورد مجاناً ←',
    statLabel: 'طلب مفتوح الآن',
    features: [
      { icon: '📋', t: 'شوف الطلبات مباشرة', d: 'المشترون يحددون وش يبون، الكمية، والمواصفات — وأنت ترد بعرض مهني واضح.' },
      { icon: '⚡', t: 'قدّم عرضاً احترافياً', d: 'أضف السعر وMOQ ومدة التسليم والشحن والملاحظات التجارية بطريقة أوضح للمشتري.' },
      { icon: '🔒', t: 'دفع موثّق', d: 'إتمام الصفقة عبر مَعبر يعطي حماية أفضل للتوثيق والدفع والتواصل.' },
    ],
    trustTitle: 'ما الذي يتوقعه المورد الصيني هنا؟',
    trustItems: [
      'لا نطلب الرخصة أو صور المصنع في أول شاشة تسجيل — فقط الأساسيات الموثوقة.',
      'روابط Alibaba / 1688 / الموقع الرسمي مقبولة كمصدر ثقة أولي.',
      'WeChat اختياري لكنه مفيد إذا كان هذا مسار التواصل المعتاد لديك.',
      'بعد تأكيد البريد تدخل مباشرة إلى صفحة حالة طلب واضحة مع توقع زمني تقريبي.',
    ],
    bottomTitle: 'جاهز تبدأ؟',
    copyright: 'مَعبر © 2026'
  },
  en: {
    tag: 'Maabar for Suppliers',
    title: 'Reach the\nSaudi Market',
    sub: 'A clearer founding-supplier entry for Chinese exporters: register the company, add your store link, then track application status with less ambiguity.',
    cta: 'Join as Supplier — Free →',
    statLabel: 'open requests now',
    features: [
      { icon: '📋', t: 'See requests directly', d: 'Buyers specify quantity, specs, and budget direction — you respond with a cleaner commercial quote.' },
      { icon: '⚡', t: 'Quote more professionally', d: 'Present MOQ, lead time, shipping, and trade notes in a way that feels closer to a real RFQ workflow.' },
      { icon: '🔒', t: 'Protected deal flow', d: 'Closing the transaction on Maabar keeps payment, records, and communication more structured.' },
    ],
    trustTitle: 'What Chinese suppliers usually want to know first',
    trustItems: [
      'Initial signup stays light — no business license upload on the first screen.',
      'Alibaba / 1688 / official company website links are accepted as first-pass trade proof.',
      'WeChat is optional, but recommended if it is your normal business channel.',
      'After email confirmation, you land in a dedicated application-status page with review expectations.',
    ],
    bottomTitle: 'Ready to start?',
    copyright: 'Maabar © 2026'
  },
  zh: {
    tag: 'Maabar 供应商平台',
    title: '进入\n沙特市场',
    sub: '更清晰的中国供应商入驻路径：先提交公司基础资料和店铺链接，再进入明确的申请状态页，不再靠猜测审核进度。',
    cta: '免费加入供应商 →',
    statLabel: '个开放询价',
    features: [
      { icon: '📋', t: '直接查看询价', d: '买家会写明数量、规格和采购方向，您可直接提交更专业的报价。' },
      { icon: '⚡', t: '报价更像正式 RFQ', d: '更清楚地填写 MOQ、交期、运费和商业备注，让买家更容易比较。' },
      { icon: '🔒', t: '交易更有保障', d: '通过 Maabar 完成沟通与交易，付款、记录和流程都会更清晰。' },
    ],
    trustTitle: '中国供应商最关心的几点',
    trustItems: [
      '首次注册保持轻量，不会在第一屏就要求上传完整营业执照。',
      '支持 Alibaba / 1688 / 官网链接作为第一步贸易证明。',
      'WeChat 不是必填，但如果这是您的常用商务渠道，建议填写。',
      '邮箱确认后，系统会直接带您进入明确的申请状态页，并给出审核预期。',
    ],
    bottomTitle: '准备好开始了吗？',
    copyright: 'Maabar © 2026'
  }
};

export default function SupplierLanding({ lang }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('supplier', lang);
  const [count, setCount] = useState(0);

  useEffect(() => {
    sb.from('requests').select('id', { count: 'exact' }).eq('status', 'open').then(({ count: c }) => {
      if (c) setCount(c);
    });
  }, []);

  const goToRegister = () => {
    nav('/login/supplier?mode=signup');
  };

  return (
    <div className="supplier-landing">
      {/* HERO */}
      <div className="sl-hero">
        <div className="sl-hero-left">
          <p className="sl-tag">{t.tag}</p>
          <h1 className={`sl-title${lang === 'en' ? ' en' : ''}`}>
            {t.title.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
          </h1>
          <p className={`sl-sub${lang === 'en' ? ' en' : ''}`}>{t.sub}</p>
          <button className="sl-cta" onClick={goToRegister}>{t.cta}</button>
        </div>
        <div className="sl-stats">
          <div className="sl-stat">
            <div className="sl-stat-num">{count}</div>
            <div className="sl-stat-label">{t.statLabel}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px 12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 16,
          alignItems: 'stretch',
        }} className="supplier-trust-grid">
          <div style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '22px 22px 20px' }}>
            <p style={{ fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginBottom: 12 }}>{t.trustTitle}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {t.trustItems.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'rgba(255,255,255,0.72)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.78)', marginTop: 7, flex: '0 0 auto' }} />
                  <span style={{ fontSize: 13, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', padding: '22px' }}>
            <p style={{ fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.42)', marginBottom: 12 }}>
              {isAr ? 'كيف تسير العملية' : lang === 'zh' ? '流程怎么走' : 'How the flow works'}
            </p>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                isAr ? '1) تسجيل أساسي للشركة + رابط تجاري' : lang === 'zh' ? '1) 提交公司基础资料 + 店铺链接' : '1) Submit basic company details + a trade link',
                isAr ? '2) تأكيد البريد الإلكتروني' : lang === 'zh' ? '2) 确认邮箱' : '2) Confirm your email',
                isAr ? '3) دخول مباشر إلى صفحة حالة الطلب تحت المراجعة' : lang === 'zh' ? '3) 直接进入待审核状态页' : '3) Land directly in the application-status page',
                isAr ? '4) متابعة من فريق مَعبر إذا لزم توضيح أو عند الموافقة' : lang === 'zh' ? '4) 如需补充资料或审核通过，Maabar 团队会直接联系您' : '4) Maabar follows up directly if clarification is needed or once approved',
              ].map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ minWidth: 26, height: 26, borderRadius: 999, border: '1px solid rgba(255,255,255,0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11 }}>{index + 1}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.72)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="sl-features">
        <p className="section-label" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {isAr ? 'لماذا مَعبر' : 'Why Maabar'}
        </p>
        <div className="sl-features-grid">
          {t.features.map((f, i) => (
            <div key={i} className="sl-feature">
              <div className="sl-feature-icon">{f.icon}</div>
              <h3 className={`sl-feature-title${lang === 'en' ? ' en' : ''}`}>{f.t}</h3>
              <p className={`sl-feature-desc${lang === 'en' ? ' en' : ''}`}>{f.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM CTA */}
      <div className="sl-bottom">
        <h2 className={`sl-bottom-title${lang === 'en' ? ' en' : ''}`}>{t.bottomTitle}</h2>
        <button className="sl-cta" onClick={goToRegister}>{t.cta}</button>
      </div>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="footer-logo"><BrandLogo size="sm" /></div>
        <p className="footer-copy">{t.copyright}</p>
      </footer>

      <style>{`
        @media (max-width: 860px) {
          .supplier-trust-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
