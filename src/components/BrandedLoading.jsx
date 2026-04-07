import React from 'react';
import BrandLogo from './BrandLogo';

const COPY = {
  ar: {
    appTitle: 'نجهّز مَعبر',
    appBody: 'لحظة واحدة فقط بينما نحمّل التجربة بالشكل الصحيح.',
    dashboardTitle: 'نحمّل لوحة التحكم',
    dashboardBody: 'نراجع الحساب والصلاحيات ونجهّز لك الوجهة الصحيحة.',
    productTitle: 'نحمّل تفاصيل المنتج',
    productBody: 'نجلب صور المنتج ومعلومات المورد.',
    supplierTitle: 'نحمّل ملف المورد',
    supplierBody: 'نجمع إشارات الثقة والبيانات الأساسية لهذا المورد.',
    chatTitle: 'نفتح المحادثة',
    chatBody: 'نحمّل الرسائل والملف المقابل حتى تبدأ مباشرة.',
  },
  en: {
    appTitle: 'Preparing Maabar',
    appBody: 'Just a moment while we load everything cleanly.',
    dashboardTitle: 'Loading your dashboard',
    dashboardBody: 'We are checking your account and preparing the right destination.',
    productTitle: 'Loading product details',
    productBody: 'We are pulling the product media and supplier snapshot.',
    supplierTitle: 'Loading supplier profile',
    supplierBody: 'We are gathering the supplier trust signals and profile details.',
    chatTitle: 'Opening the conversation',
    chatBody: 'We are loading the messages and partner details now.',
  },
  zh: {
    appTitle: '正在准备 Maabar',
    appBody: '请稍候，系统正在完整加载体验。',
    dashboardTitle: '正在加载控制台',
    dashboardBody: '系统正在检查账户状态并准备正确入口。',
    productTitle: '正在加载产品详情',
    productBody: '系统正在获取产品图片与供应商信息。',
    supplierTitle: '正在加载供应商主页',
    supplierBody: '系统正在整理该供应商的信任信号与资料。',
    chatTitle: '正在打开对话',
    chatBody: '系统正在加载消息记录与对方资料。',
  },
};

function resolveCopy(lang = 'en', title, body, tone = 'app') {
  const locale = COPY[lang] || COPY.en;
  return {
    title: title || locale[`${tone}Title`] || locale.appTitle,
    body: body || locale[`${tone}Body`] || locale.appBody,
  };
}

export default function BrandedLoading({
  lang = 'en',
  title,
  body,
  tag = 'MAABAR',
  tone = 'app',
  fullscreen = false,
  minHeight,
}) {
  const isAr = lang === 'ar';
  const copy = resolveCopy(lang, title, body, tone);

  return (
    <div
      className={`brand-loading-shell ${fullscreen ? 'fullscreen' : 'section'}`}
      style={minHeight ? { minHeight } : undefined}
    >
      <div className="brand-loading-glow brand-loading-glow-primary" />
      <div className="brand-loading-glow brand-loading-glow-secondary" />

      <div className="brand-loading-card">
        <div className="brand-loading-logo-orbit">
          <div className="brand-loading-logo-ring" />
          <div className="brand-loading-logo-core">
            <BrandLogo size="xl" />
          </div>
        </div>

        {tag ? <p className="brand-loading-tag">{tag}</p> : null}

        <h1 className={`brand-loading-title ${isAr ? 'ar' : ''}`.trim()}>
          {copy.title}
        </h1>

        <p className={`brand-loading-body ${isAr ? 'ar' : ''}`.trim()}>
          {copy.body}
        </p>

        <div className="brand-loading-meter" aria-hidden="true">
          <span className="brand-loading-meter-fill" />
        </div>
      </div>
    </div>
  );
}
