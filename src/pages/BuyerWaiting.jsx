import React, { useEffect, useState } from 'react';
import { sb } from '../supabase';
import BrandLogo from '../components/BrandLogo';

const LAUNCH = new Date('2026-05-01T00:00:00+03:00').getTime();
const FOUNDER_LIMIT = 20;

function useCountdown() {
  const [diff, setDiff] = useState(() => Math.max(0, LAUNCH - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, LAUNCH - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor(total / 3600) % 24,
    m: Math.floor(total / 60) % 60,
    s: total % 60,
  };
}

const T = {
  ar: {
    founderBadge: 'دائرة المؤسسين · Founding Circle',
    founderTitle: 'مبروك، أنت من المؤسسين',
    founderSub: 'أنت من أوائل 20 تاجر انضموا إلى مَعبر. هذه المزايا محجوزة لك بشكل دائم.',
    perk1: 'شارة المؤسس — دائمة على حسابك',
    perk2: 'عمولة 0% للأبد',
    perk3: 'خدمة الطلب المُدار مجاناً لأول 3 طلبات',
    regularTitle: 'انتهت مقاعد المؤسسين',
    regularSub: 'مقاعد دائرة المؤسسين (أول 20 تاجر) قد امتلأت. لا يزال بإمكانك الاستفادة من المزايا التالية عند الإطلاق:',
    benefit1: 'عمولة 0% دائماً',
    benefit2: 'خدمة الطلب المُدار مجاناً لأول طلب',
    countdown: 'الإطلاق في',
    days: 'أيام',
    hours: 'ساعات',
    min: 'دقيقة',
    sec: 'ثانية',
    signOut: 'تسجيل الخروج',
  },
  en: {
    founderBadge: 'Founding Circle · دائرة المؤسسين',
    founderTitle: 'Congratulations — you are a founder',
    founderSub: 'You are among the first 20 traders to join Maabar. These benefits are permanently reserved for you.',
    perk1: 'Founding badge — permanent on your account',
    perk2: '0% commission forever',
    perk3: 'Managed Order Service free for your first 3 orders',
    regularTitle: 'Founding spots are full',
    regularSub: 'The Founding Circle (first 20 traders) is closed. You still have access to the following benefits at launch:',
    benefit1: '0% commission always',
    benefit2: 'Managed Order Service free for your first order',
    countdown: 'Launching in',
    days: 'Days',
    hours: 'Hours',
    min: 'Min',
    sec: 'Sec',
    signOut: 'Sign Out',
  },
  zh: {
    founderBadge: '创始圈 · Founding Circle',
    founderTitle: '恭喜，您是创始会员',
    founderSub: '您是最早加入迈巴尔的20位商户之一，以下权益将永久保留。',
    perk1: '创始徽章 — 永久显示在您的账户',
    perk2: '永久0%佣金',
    perk3: '前3笔订单免费享受托管订单服务',
    regularTitle: '创始名额已满',
    regularSub: '创始圈（前20位）名额已关闭。您仍可在正式上线时享受以下权益：',
    benefit1: '永久0%佣金',
    benefit2: '首笔订单免费托管订单服务',
    countdown: '距正式上线',
    days: '天',
    hours: '小时',
    min: '分',
    sec: '秒',
    signOut: '退出登录',
  },
};

function CountdownRow({ d, h, m, s, t, isRtl }) {
  const items = [
    { v: d, l: t.days },
    { v: h, l: t.hours },
    { v: m, l: t.min },
    { v: s, l: t.sec },
  ];
  return (
    <div>
      <p style={{
        margin: '0 0 14px',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-sans)',
      }}>
        {t.countdown}
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        {items.map(({ v, l }) => (
          <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              fontSize: 26,
              fontWeight: 300,
              fontFamily: 'var(--font-sans)',
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              background: '#FFFFFF',
            }}>
              {String(v).padStart(2, '0')}
            </div>
            <span style={{
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
              fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {l}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BuyerWaiting({ user, profile, lang }) {
  const [isFounder, setIsFounder] = useState(null); // null = loading
  const { d, h, m, s } = useCountdown();

  useEffect(() => {
    if (!user?.id) { setIsFounder(false); return; }
    sb.from('profiles')
      .select('id')
      .eq('role', 'buyer')
      .order('created_at', { ascending: true })
      .limit(FOUNDER_LIMIT)
      .then(({ data }) => {
        setIsFounder(data ? data.some(r => r.id === user.id) : false);
      })
      .catch(() => setIsFounder(false));
  }, [user?.id]);

  // If past launch date, render nothing — DashboardBuyer shows instead.
  if (Date.now() >= LAUNCH) return null;

  const t = T[lang] || T.ar;
  const isRtl = lang === 'ar';

  if (isFounder === null) {
    // Minimal loading state
    return (
      <div style={{
        minHeight: 'var(--app-dvh)',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--border-subtle)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: 'var(--app-dvh)',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px 56px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Logo */}
        <div style={{ marginBottom: 4 }}>
          <BrandLogo size="md" />
        </div>

        {isFounder ? (
          /* ── FOUNDER STATE ── */
          <>
            {/* Badge */}
            <div style={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                border: '1px solid var(--text-primary)',
                borderRadius: 100,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
                background: '#FFFFFF',
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--text-primary)',
                  flexShrink: 0,
                }} />
                {t.founderBadge}
              </span>
            </div>

            {/* Heading */}
            <div>
              <h1 style={{
                margin: '0 0 10px',
                fontSize: 28,
                fontWeight: 300,
                lineHeight: 1.2,
                color: 'var(--text-primary)',
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {t.founderTitle}
              </h1>
              <p style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {t.founderSub}
              </p>
            </div>

            {/* Perks */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-subtle)',
              borderRadius: 18,
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              {[t.perk1, t.perk2, t.perk3].map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    flexShrink: 0,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    fontFamily: 'var(--font-sans)',
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
                  }}>
                    {perk}
                  </span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <CountdownRow d={d} h={h} m={m} s={s} t={t} isRtl={isRtl} />
          </>
        ) : (
          /* ── REGULAR STATE ── */
          <>
            {/* Heading */}
            <div>
              <h1 style={{
                margin: '0 0 10px',
                fontSize: 26,
                fontWeight: 300,
                lineHeight: 1.2,
                color: 'var(--text-primary)',
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {t.regularTitle}
              </h1>
              <p style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {t.regularSub}
              </p>
            </div>

            {/* Benefits */}
            <div style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              {[t.benefit1, t.benefit2].map((b, i) => (
                <div key={i} style={{
                  flex: '1 1 200px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="6" width="12" height="9" rx="2" stroke="var(--text-tertiary)" strokeWidth="1.2" />
                      <path d="M5 6V4.5a3 3 0 0 1 6 0V6" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M8 10v1.5" stroke="var(--text-tertiary)" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
                  }}>
                    {b}
                  </span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <CountdownRow d={d} h={h} m={m} s={s} t={t} isRtl={isRtl} />
          </>
        )}

        {/* Sign out */}
        <div>
          <button
            onClick={() => sb.auth.signOut()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              color: 'var(--text-disabled)',
              cursor: 'pointer',
              fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              textDecoration: 'underline',
            }}
          >
            {t.signOut}
          </button>
        </div>
      </div>
    </div>
  );
}
