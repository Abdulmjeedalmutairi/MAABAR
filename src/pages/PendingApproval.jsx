import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { sb } from '../supabase';

const T = {
  en: {
    tag: 'Maabar · Supplier Application Status',
    title: 'Application received — your company is now in review',
    sub: 'Your supplier application has been received successfully. This page is meant to remove ambiguity: your account is in the review queue, your basic company details are on file, and full supplier access stays locked until approval.',
    badge: 'Founding supplier access',
    steps: [
      { n: '01', t: 'Application submitted', d: 'Your basic company profile and trade link have been stored successfully.' },
      { n: '02', t: 'Manual review in progress', d: 'The first batch is reviewed carefully so the supplier pool stays credible and relevant to Saudi buyer demand.' },
      { n: '03', t: 'Direct follow-up from Maabar', d: 'If we need clarification, or once your account is approved, the team will contact you directly.' },
    ],
    highlights: [
      'Your application is safely received',
      'This is a normal review stage, not an error state',
      'Full supplier tools unlock only after approval',
    ],
    timelineTitle: 'Expected timing',
    timelineBody: 'Review starts after email confirmation. The first follow-up usually happens within 3–5 business days.',
    snapshotTitle: 'Submitted company snapshot',
    snapshotEmpty: 'No extra company details are available yet, but the application is still safely on file.',
    company: 'Company',
    location: 'Location',
    tradeLink: 'Trade profile',
    contacts: 'Contact channels',
    prepareTitle: 'Useful to prepare while you wait',
    prepareItems: ['Business license', 'Registration number', 'Factory photos', 'Payout details for the later approval stage'],
    note: 'For quick questions, reach us at',
    email: 'hello@maabar.io',
    founder: 'We are building the founding supplier group carefully — thanks for the patience.',
    home: 'Back to Home',
    logout: 'Sign Out',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 供应商申请状态',
    title: '申请已收到，您的公司正在审核中',
    sub: '这个页面的目的就是把状态讲清楚：您的供应商申请已经进入审核队列，基础公司资料已记录，完整供应商权限会在审核通过后再开放。',
    badge: '创始供应商早期通道',
    steps: [
      { n: '01', t: '申请已提交', d: '您的基础公司资料和贸易资料链接已经成功保存。' },
      { n: '02', t: '人工审核进行中', d: '首批供应商会被谨慎筛选，确保供应商池对沙特买家来说更可信、更相关。' },
      { n: '03', t: 'Maabar 团队直接跟进', d: '如果需要补充信息，或审核通过后，团队会直接联系您。' },
    ],
    highlights: [
      '申请资料已安全接收',
      '这是正常审核阶段，不是报错页面',
      '完整供应商工具会在通过审核后开放',
    ],
    timelineTitle: '预计时间',
    timelineBody: '邮箱确认后审核才会开始。首次跟进通常会在 3–5 个工作日内进行。',
    snapshotTitle: '已提交资料摘要',
    snapshotEmpty: '当前还没有更多可展示的公司信息，但申请已经安全记录在系统中。',
    company: '公司',
    location: '所在地',
    tradeLink: '贸易资料链接',
    contacts: '联系渠道',
    prepareTitle: '等待期间建议准备',
    prepareItems: ['营业执照', '注册号', '工厂照片', '后续审批阶段需要的收款资料'],
    note: '如需快速咨询，可联系',
    email: 'hello@maabar.io',
    founder: '我们正在认真搭建首批创始供应商名单，感谢您的耐心等待。',
    home: '返回首页',
    logout: '退出登录',
    copy: 'Maabar © 2026',
  },
  ar: {
    tag: 'مَعبر · حالة طلب المورد',
    title: 'تم استلام الطلب — وشركتك الآن تحت المراجعة',
    sub: 'هذه الصفحة موجودة لتوضيح الحالة بالكامل: طلب المورد دخل قائمة المراجعة، وبيانات الشركة الأساسية محفوظة لدينا، بينما يبقى الوصول الكامل للمورد مقفلاً حتى تتم الموافقة.',
    badge: 'وصول تأسيسي مبكر',
    steps: [
      { n: '01', t: 'تم إرسال الطلب', d: 'تم حفظ بيانات الشركة الأساسية ورابط الملف التجاري بنجاح.' },
      { n: '02', t: 'المراجعة اليدوية جارية', d: 'نراجع الدفعة الأولى بعناية حتى تبقى قاعدة الموردين أكثر مصداقية وارتباطاً بالطلب السعودي.' },
      { n: '03', t: 'متابعة مباشرة من فريق مَعبر', d: 'إذا احتجنا أي توضيح إضافي، أو عند الموافقة، سيتواصل معك الفريق مباشرة.' },
    ],
    highlights: [
      'تم استلام الطلب بأمان',
      'هذه مرحلة مراجعة طبيعية وليست حالة خطأ',
      'أدوات المورد الكاملة تُفتح فقط بعد الموافقة',
    ],
    timelineTitle: 'المدة المتوقعة',
    timelineBody: 'تبدأ المراجعة بعد تأكيد البريد الإلكتروني. أول متابعة تصل عادة خلال 3–5 أيام عمل.',
    snapshotTitle: 'ملخص البيانات المرسلة',
    snapshotEmpty: 'لا توجد تفاصيل إضافية معروضة حالياً، لكن الطلب محفوظ لدينا بأمان.',
    company: 'الشركة',
    location: 'الموقع',
    tradeLink: 'الرابط التجاري',
    contacts: 'قنوات التواصل',
    prepareTitle: 'من المفيد تجهيز هذه الأشياء أثناء الانتظار',
    prepareItems: ['الرخصة التجارية', 'رقم التسجيل', 'صور المصنع', 'بيانات استلام الأرباح للمرحلة اللاحقة'],
    note: 'للاستفسارات السريعة تواصل معنا على',
    email: 'hello@maabar.io',
    founder: 'نحن نبني مجموعة الموردين الأوائل بعناية — شكراً لصبرك.',
    home: 'العودة للرئيسية',
    logout: 'تسجيل خروج',
    copy: 'مَعبر © 2026',
  },
};

function buildContactSummary(profile = {}) {
  const items = [];
  if (profile?.wechat) items.push(`WeChat: ${profile.wechat}`);
  if (profile?.whatsapp) items.push(`WhatsApp: ${profile.whatsapp}`);
  if (profile?.phone) items.push(profile.phone);
  return items.join(' · ');
}

export default function PendingApproval({ lang = 'en', profile, setUser, setProfile }) {
  const nav = useNavigate();
  const t = T[lang] || T.en;
  const isAr = lang === 'ar';

  const locationText = [profile?.city, profile?.country].filter(Boolean).join(', ');
  const contactText = buildContactSummary(profile);
  const snapshotRows = [
    profile?.company_name ? { label: t.company, value: profile.company_name } : null,
    locationText ? { label: t.location, value: locationText } : null,
    profile?.trade_link ? { label: t.tradeLink, value: profile.trade_link, href: profile.trade_link } : null,
    contactText ? { label: t.contacts, value: contactText } : null,
  ].filter(Boolean);

  const doSignOut = async () => {
    await sb.auth.signOut();
    setUser(null);
    setProfile(null);
    nav('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '92px 24px 48px' }}>
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 32,
          border: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
          padding: '32px 32px 28px',
          marginBottom: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 28%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
              {t.tag}
            </p>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-secondary)',
              fontSize: 11,
              letterSpacing: 1.1,
              textTransform: 'uppercase',
              marginBottom: 18,
            }}>
              {t.badge}
            </span>
            <h1 style={{
              fontSize: isAr ? 40 : 54,
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: isAr ? 0 : -1.2,
              margin: '0 0 16px',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              maxWidth: 860,
            }}>
              {t.title}
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              maxWidth: 760,
              lineHeight: 1.85,
              margin: 0,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {t.sub}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.18fr 0.82fr', gap: 20 }} className="pending-review-grid">
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ borderRadius: 28, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', padding: 24 }}>
              <div className="pending-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {t.steps.map((step, index) => (
                  <div
                    key={step.n}
                    style={{
                      padding: '20px 18px',
                      borderRadius: 22,
                      border: '1px solid var(--border-subtle)',
                      background: index === 1 ? 'rgba(255,255,255,0.05)' : 'var(--bg-muted)',
                      animation: `pendingFade 0.45s ease ${index * 0.08}s both`,
                    }}
                  >
                    <p style={{ fontSize: 28, lineHeight: 1, margin: '0 0 18px', color: 'var(--text-tertiary)' }}>{step.n}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {step.t}
                    </p>
                    <p style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {step.d}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }} className="pending-detail-grid">
              <div style={{ borderRadius: 28, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', padding: 24 }}>
                <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
                  {t.snapshotTitle}
                </p>
                {snapshotRows.length ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {snapshotRows.map((row) => (
                      <div key={row.label} style={{ padding: '14px 16px', borderRadius: 18, border: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
                        <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{row.label}</p>
                        {row.href ? (
                          <a href={row.href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none', lineHeight: 1.7, wordBreak: 'break-all', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {row.value}
                          </a>
                        ) : (
                          <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {row.value}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {t.snapshotEmpty}
                  </p>
                )}
              </div>

              <div style={{ borderRadius: 28, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', padding: 24 }}>
                <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
                  {t.prepareTitle}
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {t.prepareItems.map((item) => (
                    <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.7, marginTop: 7, flex: '0 0 auto' }} />
                      <span style={{ fontSize: 13, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            borderRadius: 28,
            border: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, var(--bg-subtle), rgba(255,255,255,0.02))',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                {isAr ? 'ملخص الحالة' : lang === 'zh' ? '状态摘要' : 'Status summary'}
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {t.highlights.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-primary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.75, marginTop: 7, flex: '0 0 auto' }} />
                    <span style={{ fontSize: 13, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 10px' }}>
                {t.timelineTitle}
              </p>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.timelineBody}
              </p>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.founder}
              </p>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {t.note}{' '}
              <a href={`mailto:${t.email}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--text-primary)' }}>
                {t.email}
              </a>
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
              <button onClick={() => nav('/')} style={{
                background: 'var(--text-primary)', border: 'none', color: 'var(--bg-base)',
                padding: '11px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                borderRadius: 14, minHeight: 44,
              }}>
                {t.home}
              </button>
              <button onClick={doSignOut} style={{
                background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
                padding: '11px 20px', fontSize: 12, cursor: 'pointer', borderRadius: 14, minHeight: 44,
              }}>
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px', marginTop: 8 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <BrandLogo size="sm" />
          <p style={{ color: 'var(--text-tertiary)', fontSize: 11, letterSpacing: 1, margin: 0 }}>{t.copy}</p>
        </div>
      </footer>

      <style>{`
        @keyframes pendingFade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 960px) {
          .pending-review-grid,
          .pending-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .pending-steps {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
