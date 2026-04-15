import React, { useEffect, useState } from 'react';
import { sb } from '../supabase';

const LAUNCH      = new Date('2026-05-01T00:00:00+03:00').getTime();
const FOUNDER_CAP = 20;

// ─── Fonts ──────────────────────────────────────────────────────────────────
const AR  = "'Tajawal', sans-serif";       // all Arabic text
const EN  = "'Cormorant Garamond', Georgia, serif"; // English + numbers

// ─── Colours ────────────────────────────────────────────────────────────────
const BG        = '#f5f3ef';
const INK       = '#1a1814';
const MUTED     = '#6b6560';
const FAINT     = '#b0ab9e';
const BORDER    = '#e8e5de';
const GREEN     = '#27725a';
const AMBER_INK = '#8B6914';

// ─── Countdown hook ─────────────────────────────────────────────────────────
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

// ─── Section label with extending line ──────────────────────────────────────
function SectionLabel({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        fontFamily: EN,
        fontSize: 10,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: FAINT,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {text}
      </span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

// ─── Small dot ──────────────────────────────────────────────────────────────
function Dot({ color }) {
  return (
    <div style={{
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }} />
  );
}

// ─── Countdown row ──────────────────────────────────────────────────────────
function Countdown({ d, h, m, s }) {
  const boxes = [
    { v: d, l: 'DAYS' },
    { v: h, l: 'HRS'  },
    { v: m, l: 'MIN'  },
    { v: s, l: 'SEC'  },
  ];
  return (
    <div style={{ direction: 'ltr', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
      {boxes.map(({ v, l }, i) => (
        <React.Fragment key={l}>
          {i > 0 && (
            <span style={{
              fontFamily: EN,
              fontSize: 26,
              fontWeight: 300,
              color: '#d4cfc6',
              lineHeight: '48px',
              userSelect: 'none',
            }}>
              :
            </span>
          )}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <div style={{
              background: '#faf9f7',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: 8,
              minWidth: 52,
              textAlign: 'center',
            }}>
              <span style={{
                fontFamily: EN,
                fontSize: 34,
                fontWeight: 300,
                color: INK,
                fontVariantNumeric: 'lining-nums',
                lineHeight: 1,
                display: 'block',
              }}>
                {String(v).padStart(2, '0')}
              </span>
            </div>
            <span style={{
              fontFamily: EN,
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: FAINT,
            }}>
              {l}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Perk row (founder perks box) ───────────────────────────────────────────
// boldText is the substring to bold; rest is the remainder of the sentence.
function PerkRow({ boldNum, boldAr, rest }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ paddingTop: 5, flexShrink: 0 }}>
        <Dot color={GREEN} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: AR, letterSpacing: 0, lineHeight: 1.7 }}>
        {boldNum && (
          <span style={{ fontWeight: 700, color: INK, fontFamily: EN, fontVariantNumeric: 'lining-nums' }}>
            {boldNum}
          </span>
        )}
        {boldAr && (
          <span style={{ fontWeight: 700, color: INK, fontFamily: AR, letterSpacing: 0 }}>
            {boldAr}
          </span>
        )}
        {rest && <span> {rest}</span>}
      </p>
    </div>
  );
}

// ─── Simple perk row (regular state) ────────────────────────────────────────
function SimplePerkRow({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ paddingTop: 5, flexShrink: 0 }}>
        <Dot color={GREEN} />
      </div>
      <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: AR, letterSpacing: 0, lineHeight: 1.7 }}>
        {text}
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function BuyerWaiting({ user }) {
  const [isFounder, setIsFounder] = useState(null);
  const { d, h, m, s } = useCountdown();

  useEffect(() => {
    if (!user?.id) { setIsFounder(false); return; }
    sb.from('profiles')
      .select('id')
      .eq('role', 'buyer')
      .order('created_at', { ascending: true })
      .limit(FOUNDER_CAP)
      .then(({ data }) => {
        setIsFounder(data ? data.some(r => r.id === user.id) : false);
      })
      .catch(() => setIsFounder(false));
  }, [user?.id]);

  // After launch, render nothing so DashboardBuyer shows.
  if (Date.now() >= LAUNCH) return null;

  if (isFounder === null) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: `2px solid ${BORDER}`,
          borderTopColor: INK,
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100dvh',
        background: BG,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 20px 64px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {isFounder ? (
          /* ══════════════════════════════════════════
             FOUNDER STATE
          ══════════════════════════════════════════ */
          <>
            {/* Cream emblem card */}
            <div style={{
              alignSelf: 'center',
              background: '#ede8dc',
              border: '1px solid #d8d0be',
              borderRadius: 18,
              padding: '14px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}>
              <span style={{
                fontFamily: EN,
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: FAINT,
              }}>
                Founding Circle
              </span>
              <span style={{
                fontFamily: AR,
                fontSize: 17,
                fontWeight: 700,
                color: INK,
                letterSpacing: 0,
                lineHeight: 1.3,
              }}>
                نادي المؤسسين
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Dot color={GREEN} />
                <span style={{
                  fontFamily: AR,
                  fontSize: 11,
                  color: GREEN,
                  letterSpacing: 0,
                }}>
                  عضو مؤسس
                </span>
              </div>
            </div>

            {/* Congrats text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{
                margin: 0,
                fontFamily: AR,
                fontSize: 16,
                fontWeight: 700,
                color: INK,
                letterSpacing: 0,
                lineHeight: 1.5,
              }}>
                تهانينا — تم قبولك في نادي المؤسسين
              </p>
              <p style={{
                margin: 0,
                fontFamily: AR,
                fontSize: 13,
                color: MUTED,
                letterSpacing: 0,
                lineHeight: 1.8,
              }}>
                أنت من أوائل 20 تاجر في معبر. مزاياك مفعّلة فور الإطلاق.
              </p>
            </div>

            {/* Section label: مزاياك */}
            <SectionLabel text="مزاياك" />

            {/* Perks box */}
            <div style={{
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{
                background: INK,
                padding: '10px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontFamily: AR,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#ffffff',
                  letterSpacing: 0,
                }}>
                  نادي المؤسسين
                </span>
                <span style={{
                  fontFamily: EN,
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.45)',
                }}>
                  تُفعَّل عند الإطلاق
                </span>
              </div>
              {/* Body */}
              <div style={{
                background: BG,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <PerkRow boldNum="0%" boldAr=" عمولة" rest="لمدة سنة كاملة" />
                <PerkRow boldAr="خدمة الطلب المُدار" rest="مجاناً لـ 6 أشهر" />
                <PerkRow boldAr="أولوية الظهور" rest="أمام الموردين" />
              </div>
            </div>

            {/* Section label: الإطلاق خلال */}
            <SectionLabel text="الإطلاق خلال" />

            {/* Countdown */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Countdown d={d} h={h} m={m} s={s} />
            </div>
          </>
        ) : (
          /* ══════════════════════════════════════════
             REGULAR STATE
          ══════════════════════════════════════════ */
          <>
            {/* Amber box */}
            <div style={{
              background: '#fdf6e3',
              border: '1px solid rgba(139,105,20,0.2)',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Dot color={AMBER_INK} />
                <span style={{
                  fontFamily: AR,
                  fontSize: 10,
                  fontWeight: 700,
                  color: AMBER_INK,
                  letterSpacing: 0,
                }}>
                  للأسف
                </span>
              </div>
              <p style={{
                margin: 0,
                fontFamily: AR,
                fontSize: 15,
                fontWeight: 700,
                color: INK,
                letterSpacing: 0,
                lineHeight: 1.5,
              }}>
                انتهت مقاعد نادي المؤسسين
              </p>
              <p style={{
                margin: 0,
                fontFamily: AR,
                fontSize: 13,
                color: MUTED,
                letterSpacing: 0,
                lineHeight: 1.8,
              }}>
                الـ 20 مقعد امتلأت — لكنك سجّلت مبكراً وهذا لم يمرّ دون أن نلاحظه.
              </p>
            </div>

            {/* Green gift box */}
            <div style={{
              background: '#f0f7f4',
              border: '1px solid rgba(39,114,90,0.2)',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Dot color={GREEN} />
                <span style={{
                  fontFamily: AR,
                  fontSize: 10,
                  fontWeight: 700,
                  color: GREEN,
                  letterSpacing: 0,
                }}>
                  هديتك من معبر
                </span>
              </div>
              <p style={{
                margin: 0,
                fontFamily: AR,
                fontSize: 15,
                fontWeight: 700,
                color: INK,
                letterSpacing: 0,
                lineHeight: 1.5,
              }}>
                ما ستحصل عليه مع معبر
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                <SimplePerkRow text="0% عمولة — معبر لا يأخذ من التاجر شيئاً" />
                <SimplePerkRow text="خدمة الطلب المُدار مجاناً لأول طلب لك" />
              </div>
            </div>

            {/* Section label: الإطلاق خلال */}
            <SectionLabel text="الإطلاق خلال" />

            {/* Countdown */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Countdown d={d} h={h} m={m} s={s} />
            </div>
          </>
        )}

        {/* Sign out */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <button
            onClick={() => sb.auth.signOut()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              color: FAINT,
              cursor: 'pointer',
              fontFamily: AR,
              letterSpacing: 0,
            }}
          >
            تسجيل الخروج
          </button>
        </div>

      </div>
    </div>
  );
}
