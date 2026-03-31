import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import BrandLogo from '../components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const T = {
  ar: {
    tag: 'مَعبر للموردين',
    title: 'وصّل منتجك\nللسوق السعودي',
    sub: 'المشترون السعوديون يرفعون طلباتهم مباشرة — قدم عرضك في ثوانٍ بدون وسطاء.',
    cta: 'انضم كمورد مجاناً ←',
    statLabel: 'طلب مفتوح الآن',
    features: [
      { icon: '📋', t: 'شوف الطلبات مباشرة', d: 'المشترون يحددون وش يبون، الكمية، والمواصفات — أنت بس تقدم السعر.' },
      { icon: '⚡', t: 'تنافس وافوز', d: 'موردون متعددون يتنافسون على نفس الطلب — الأفضل سعراً وجودةً يفوز.' },
      { icon: '🔒', t: 'دفع مضمون', d: 'المبلغ محجوز في النظام ولا يصلك إلا بعد تأكيد الاستلام.' },
    ],
    bottomTitle: 'جاهز تبدأ؟',
    copyright: 'مَعبر © 2026'
  },
  en: {
    tag: 'Maabar for Suppliers',
    title: 'Reach the\nSaudi Market',
    sub: 'Saudi buyers post their requests directly — submit your quote in seconds, no middlemen.',
    cta: 'Join as Supplier — Free →',
    statLabel: 'open requests now',
    features: [
      { icon: '📋', t: 'See requests directly', d: 'Buyers specify exactly what they need — you just submit a price.' },
      { icon: '⚡', t: 'Compete and win', d: 'Multiple suppliers compete — best price wins.' },
      { icon: '🔒', t: 'Guaranteed payment', d: 'Payment moves when the buyer decides — every deal builds trust.' },
    ],
    bottomTitle: 'Ready to start?',
    copyright: 'Maabar © 2026'
  },
  zh: {
    tag: 'Maabar 供应商平台',
    title: '进入\n沙特市场',
    sub: '沙特买家直接发布采购需求 — 秒级提交报价，无中间商。',
    cta: '免费加入供应商 →',
    statLabel: '个开放询价',
    features: [
      { icon: '📋', t: '直接查看询价', d: '买家明确需求 — 您只需提交价格。' },
      { icon: '⚡', t: '竞争获胜', d: '多个供应商竞争同一订单 — 最优价格获胜。' },
      { icon: '🔒', t: '付款保障', d: '资金托管，买家确认收货后才释放。' },
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
    nav('/supplier-access');
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
    </div>
  );
}
