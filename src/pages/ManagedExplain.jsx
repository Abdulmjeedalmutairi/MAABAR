import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Icons (stroke/fill come from CSS). Rendered by index, so order matters.
const STEP_ICONS = [
  (<svg viewBox="0 0 24 24"><path d="M14 3v5h5M9 3h6l5 5v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /></svg>),
  (<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>),
  (<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>),
  (<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="1" /><path d="M3 8l3-4h12l3 4" /></svg>),
  (<svg viewBox="0 0 24 24"><path d="M4 21V7l8-4 8 4v14M9 21v-6h6v6" /></svg>),
];
const INCL_ICONS = [
  (<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></svg>),
  (<svg viewBox="0 0 24 24"><path d="M12 3l2 5 5 .4-4 3.3 1.3 5-4.3-2.8L7.7 16.7 9 11.7 5 8.4 10 8z" /></svg>),
  (<svg viewBox="0 0 24 24"><path d="M9 11l3 3 8-8" /><path d="M21 12a9 9 0 1 1-6.2-8.5" /></svg>),
  (<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></svg>),
  (<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="1" /><path d="M3 8l3-4h12l3 4" /></svg>),
  (<svg viewBox="0 0 24 24"><path d="M4 21V7l8-4 8 4v14M9 21v-6h6v6" /></svg>),
];
const CHOOSE_ICON = (<svg viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.4V4a1 1 0 0 1 1-1h8.8a2 2 0 0 1 1.4.6l6.2 6.2a2 2 0 0 1 0 2.6z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>);
const VIDEO_ICON = (<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M16 10l6-3v10l-6-3z" /></svg>);

const T = {
  ar: {
    pill: 'الخدمة الأكثر طلباً',
    title: 'الطلب المُدار',
    heroSub: 'أنت تطلب، ونحن ننفّذ. فريق مَعبر يتولّى طلبك من الصين بالكامل — بحثًا وتفاوضًا وفحصًا وشحنًا وتخليصًا — حتى يصلك إلى باب بيتك.',
    ctaMain: 'ابدأ طلبك الآن',
    trust: 'بلا وسطاء · بلا حاجز لغة · متابعة مستمرة حتى الاستلام',
    journeyH: 'كيف يعمل الطلب المُدار؟',
    journeyS: 'خمس خطوات — تكتب طلبك، وننجزه لك بالكامل.',
    steps: [
      { title: 'استلام طلبك', desc: 'تكتب لنا ما تريد استيراده، الكمية، والميزانية التقريبية — والباقي علينا.' },
      { title: 'بحث ومقارنة', desc: 'نبحث عن أفضل الموردين والمصانع، ونعرض عليك العروض والأسعار — وأنت تختار ما يناسبك.' },
      { title: 'إدارة الطلب', tag: '🎥 فيديو قبل الشحن', desc: 'نتفاوض على أفضل سعر، نفحص الجودة، ونصوّر لك المنتج بالفيديو قبل الشحن لتتأكد بنفسك.' },
      { title: 'شحن وتخليص', desc: 'نشحن طلبك ونتولّى التخليص الجمركي ومتابعة كل خطوة حتى وصوله.' },
      { title: 'توصيل لباب بيتك', desc: 'يصلك طلبك جاهزًا إلى باب بيتك — أنت فقط تستلم.' },
    ],
    chooseTitle: 'أنت من يختار السعر',
    chooseBody: 'نعرض عليك العروض والأسعار من عدّة موردين — وتختار العرض الذي يناسبك. القرار دائمًا بيدك، ولن نمضي في أي طلب قبل موافقتك.',
    inclH: 'ماذا يشمل الطلب المُدار؟',
    inclS: 'خدمة كاملة من البداية حتى الاستلام.',
    included: [
      { b: 'فريق متخصص', s: 'يدير طلبك خطوة بخطوة' },
      { b: 'تفاوض على السعر', s: 'أفضل العروض الموثوقة' },
      { b: 'فحص الجودة', s: 'قبل الشحن لك' },
      { b: 'فيديو للمنتج', s: 'تتأكد بنفسك قبل الشحن' },
      { b: 'شحن وتخليص', s: 'جمركي كامل' },
      { b: 'توصيل للباب', s: 'أنت فقط تستلم' },
    ],
    videoStrong: 'نصوّر لك المنتج بالفيديو قبل الشحن',
    videoRest: 'لتطمئن على المنتج بنفسك قبل أن يغادر المصنع — شفافية كاملة.',
    payH: 'طريقة الدفع',
    payS: 'اختر ما يناسبك عند تأكيد الطلب.',
    pays: [
      { amt: '30%', badge: 'خيار شائع', body: 'دفعة مقدّمة 30% لبدء الطلب، والباقي عند اكتمال التجهيز قبل الشحن.' },
      { amt: '100%', body: 'دفع كامل مقدّمًا — لمن يفضّل إنهاء كل شيء من البداية بلا دفعات لاحقة.' },
    ],
    proofStrong: 'أكثر من 1,000 تاجر ومستورد',
    proofSub: 'يثقون بفريق مَعبر في طلباتهم من الصين',
    finalH: 'جاهز تبدأ طلبك؟',
  },
  en: {
    pill: 'Most requested service',
    title: 'Managed Sourcing',
    heroSub: 'You request, we deliver. The Maabar team handles your China order end to end — sourcing, negotiating, inspecting, shipping and customs — right to your doorstep.',
    ctaMain: 'Start your request',
    trust: 'No middlemen · No language barrier · Followed up until you receive',
    journeyH: 'How does Managed Sourcing work?',
    journeyS: 'Five steps — you write your request, we handle the rest.',
    steps: [
      { title: 'Your request', desc: 'Tell us what you want to import, the quantity, and a rough budget — we take it from there.' },
      { title: 'Search & compare', desc: 'We find the best suppliers and factories and present you the offers and prices — you choose what suits you.' },
      { title: 'Managing the order', tag: '🎥 Video before shipping', desc: 'We negotiate the best price, inspect quality, and send you a video of the product before shipping so you can check it yourself.' },
      { title: 'Ship & clear', desc: 'We ship your order, handle customs clearance, and track every step until it arrives.' },
      { title: 'To your doorstep', desc: 'Your order arrives ready at your door — you just receive it.' },
    ],
    chooseTitle: 'You choose the price',
    chooseBody: 'We present you offers and prices from several suppliers — you pick the one that suits you. The decision is always yours, and we never proceed with any order without your approval.',
    inclH: "What's included?",
    inclS: 'A complete service from start to delivery.',
    included: [
      { b: 'Specialist team', s: 'runs your order step by step' },
      { b: 'Price negotiation', s: 'the best trusted offers' },
      { b: 'Quality checks', s: 'before it ships to you' },
      { b: 'Product video', s: 'verify it before shipping' },
      { b: 'Ship & customs', s: 'full clearance' },
      { b: 'Doorstep delivery', s: 'you just receive' },
    ],
    videoStrong: 'We send you a video of the product before shipping',
    videoRest: 'so you can check it yourself before it leaves the factory — full transparency.',
    payH: 'Payment',
    payS: 'Choose what suits you when you confirm.',
    pays: [
      { amt: '30%', badge: 'Popular', body: 'A 30% deposit to start the order, the rest when it is ready before shipping.' },
      { amt: '100%', body: 'Pay in full upfront — for those who prefer to settle everything from the start.' },
    ],
    proofStrong: 'Over 1,000 traders & importers',
    proofSub: 'trust the Maabar team with their China orders',
    finalH: 'Ready to start your request?',
  },
  zh: {
    pill: '最受欢迎的服务',
    title: '托管采购',
    heroSub: '您下单，我们执行。Maabar 团队全程代办您的中国订单 — 寻源、议价、质检、运输与清关 — 直送到您家门口。',
    ctaMain: '立即开始',
    trust: '没有中间商 · 没有语言障碍 · 持续跟进直到签收',
    journeyH: '托管采购如何运作？',
    journeyS: '五个步骤 — 您写下需求，其余由我们完成。',
    steps: [
      { title: '接收需求', desc: '告诉我们您要进口什么、数量以及大致预算 — 剩下的交给我们。' },
      { title: '搜索比价', desc: '我们寻找最优质的供应商与工厂，并向您展示报价 — 由您选择合适的。' },
      { title: '订单管理', tag: '🎥 发货前视频', desc: '我们议价、质检，并在发货前为您拍摄产品视频，让您亲自确认。' },
      { title: '运输清关', desc: '我们发货、办理清关，并跟进每一步直到送达。' },
      { title: '送货上门', desc: '订单备好后送到您家门口 — 您只需签收。' },
    ],
    chooseTitle: '价格由您决定',
    chooseBody: '我们向您展示多家供应商的报价 — 由您选择合适的。决定权始终在您手中，未经您同意我们不会推进任何订单。',
    inclH: '包含哪些服务？',
    inclS: '从开始到交付的完整服务。',
    included: [
      { b: '专业团队', s: '逐步处理您的订单' },
      { b: '价格谈判', s: '最可靠的报价' },
      { b: '质量检查', s: '发货前完成' },
      { b: '产品视频', s: '发货前亲自确认' },
      { b: '运输清关', s: '全程办理' },
      { b: '送货上门', s: '您只需签收' },
    ],
    videoStrong: '发货前我们会为您拍摄产品视频',
    videoRest: '让您在产品出厂前亲自确认 — 全程透明。',
    payH: '付款方式',
    payS: '确认订单时选择合适的方式。',
    pays: [
      { amt: '30%', badge: '常用', body: '预付 30% 启动订单，其余在发货前备货完成时支付。' },
      { amt: '100%', body: '全额预付 — 适合希望一次性结清、无后续付款的您。' },
    ],
    proofStrong: '超过 1,000 名商家与进口商',
    proofSub: '信赖 Maabar 团队处理他们的中国订单',
    finalH: '准备好开始了吗？',
  },
};

export default function ManagedExplain({ lang }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const af = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const arrow = isAr ? '←' : '→';
  usePageTitle('managed', lang);

  const goRequest = () => nav('/request');

  return (
    <div style={{ minHeight: 'var(--app-dvh)', background: 'var(--bg-base)' }}>
      <div className={`mx${isAr ? ' rtl' : ''}`}>

        {/* HERO */}
        <div className="mx-hero">
          <span className="mx-pill" style={af}>★ {t.pill}</span>
          <h1 style={af}>{t.title}</h1>
          <p className="mx-hero-sub" style={af}>{t.heroSub}</p>
          <button className="mx-cta" onClick={goRequest} style={af}>{t.ctaMain}<span aria-hidden="true">{arrow}</span></button>
          <div className="mx-trust" style={af}>{t.trust}</div>
        </div>

        {/* JOURNEY */}
        <div className="mx-sec">
          <h2 className="mx-sec-h" style={af}>{t.journeyH}</h2>
          <p className="mx-sec-s" style={af}>{t.journeyS}</p>
          <div className="mx-steps">
            {t.steps.map((st, i) => (
              <div key={i} className={'mx-step' + (i === 2 ? ' key' : '')}>
                <div className="mx-rail">
                  <div className="mx-snum">{STEP_ICONS[i]}</div>
                  <div className="mx-sline" />
                </div>
                <div className="mx-sbody">
                  <p className="mx-stt" style={af}>{st.title}{st.tag && <span className="mx-tagv" style={af}>{st.tag}</span>}</p>
                  <p className="mx-sdesc" style={af}>{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* You choose the price */}
          <div className="mx-choose">
            <div className="mx-choose-ic">{CHOOSE_ICON}</div>
            <div>
              <b style={af}>{t.chooseTitle}</b>
              <p style={af}>{t.chooseBody}</p>
            </div>
          </div>
        </div>

        {/* INCLUDED */}
        <div className="mx-sec">
          <h2 className="mx-sec-h" style={af}>{t.inclH}</h2>
          <p className="mx-sec-s" style={af}>{t.inclS}</p>
          <div className="mx-grid">
            {t.included.map((g, i) => (
              <div key={i} className="mx-gcard">
                {INCL_ICONS[i]}
                <b style={af}>{g.b}</b>
                <span style={af}>{g.s}</span>
              </div>
            ))}
          </div>
          <div className="mx-video">
            {VIDEO_ICON}
            <div><b style={af}>{t.videoStrong}</b><span style={af}>{t.videoRest}</span></div>
          </div>
        </div>

        {/* PAYMENT */}
        <div className="mx-sec">
          <h2 className="mx-sec-h" style={af}>{t.payH}</h2>
          <p className="mx-sec-s" style={af}>{t.payS}</p>
          <div className="mx-pays">
            {t.pays.map((p, i) => (
              <div key={i} className="mx-pay">
                <div className="mx-pay-top">
                  <span className="mx-pay-amt">{p.amt}</span>
                  {p.badge && <span className="mx-pay-badge" style={af}>{p.badge}</span>}
                </div>
                <p style={af}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* PROOF */}
        <div className="mx-proof">
          <div className="mx-avs" aria-hidden="true"><i>+1K</i><i /><i /><i /></div>
          <b style={af}>{t.proofStrong}</b>
          <span style={af}>{t.proofSub}</span>
        </div>

        {/* FINAL CTA */}
        <div className="mx-final">
          <h2 style={af}>{t.finalH}</h2>
          <button className="mx-cta" onClick={goRequest} style={af}>{t.ctaMain}<span aria-hidden="true">{arrow}</span></button>
        </div>

      </div>
      <Footer lang={lang} />
    </div>
  );
}
