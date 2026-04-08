import React from 'react';
import BrandLogo from './BrandLogo';

const CONTENT = {
  app: {
    ar: { tag: 'مَعبر', title: 'جاري التحميل', body: 'يرجى الانتظار لحظة...' },
    en: { tag: 'MAABAR', title: 'Loading', body: 'Please wait a moment...' },
    zh: { tag: 'MAABAR', title: '加载中', body: '请稍候...' },
  },
  dashboard: {
    ar: { tag: 'لوحة التحكم', title: 'جاري التحميل', body: 'يتم تحضير بياناتك...' },
    en: { tag: 'DASHBOARD', title: 'Loading', body: 'Preparing your data...' },
    zh: { tag: '控制台', title: '加载中', body: '正在准备您的数据...' },
  },
  chat: {
    ar: { tag: 'المحادثة', title: 'جاري التحميل', body: 'يتم تحميل الرسائل...' },
    en: { tag: 'CHAT', title: 'Loading', body: 'Loading messages...' },
    zh: { tag: '聊天', title: '加载中', body: '正在加载消息...' },
  },
};

export default function BrandedLoading({ lang = 'ar', tone = 'app', fullscreen, tag, title, body }) {
  const isAr = lang === 'ar';
  const content = CONTENT[tone]?.[lang] ?? CONTENT[tone]?.en ?? CONTENT.app.en;

  const displayTag   = tag   ?? content.tag;
  const displayTitle = title ?? content.title;
  const displayBody  = body  ?? content.body;

  return (
    <div className={`brand-loading-shell${fullscreen ? ' fullscreen' : ' section'}`}>
      <div className="brand-loading-glow brand-loading-glow-primary" />
      <div className="brand-loading-glow brand-loading-glow-secondary" />

      <div className="brand-loading-card">
        <div className="brand-loading-logo-orbit">
          <div className="brand-loading-logo-ring" />
          <div className="brand-loading-logo-core">
            <BrandLogo size="sm" muted />
          </div>
        </div>

        <p className="brand-loading-tag">{displayTag}</p>
        <h1 className={`brand-loading-title${isAr ? ' ar' : ''}`}>{displayTitle}</h1>
        {displayBody && (
          <p className={`brand-loading-body${isAr ? ' ar' : ''}`}>{displayBody}</p>
        )}

        <div className="brand-loading-meter">
          <div className="brand-loading-meter-fill" />
        </div>
      </div>
    </div>
  );
}
