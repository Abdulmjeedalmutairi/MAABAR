import React from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { sb } from '../supabase';
import {
  buildSupplierTrustSignals,
  getSupplierApplicationState,
  getSupplierOnboardingState,
  getSupplierStageLabel,
  getSupplierVerificationState,
} from '../lib/supplierOnboarding';

const T = {
  en: {
    tag: 'Maabar · Supplier Application Status',
    title: 'Application received — your company is in review',
    sub: 'This page is meant to remove ambiguity. Your supplier account is not broken, lost, or waiting for an extra hidden step. Your company is now sitting in Maabar’s supplier review queue.',
    badge: 'Founding supplier review queue',
    statusNow: 'Current status',
    statusReview: 'Under review',
    statusReviewBody: 'Your basic company profile has been received and review is in progress.',
    statusSubmitted: 'Application already submitted',
    statusSubmittedBody: 'You do not need to register again. If we need more proof, we will contact you.',
    statusEmail: 'Email confirmation',
    statusEmailBody: 'Review is active because this email address was already confirmed.',
    statusEmailValue: 'Confirmed',
    statusProof: 'Supporting proof on file',
    statusProofBody: 'Optional verification documents already received with this application.',
    statusSla: 'Expected first follow-up',
    statusSlaBody: 'Usually within 3–5 business days after email confirmation.',
    stepsTitle: 'What happens next',
    steps: [
      { n: '01', t: 'Your company stays in the queue', d: 'The application remains saved safely while the team reviews relevance, credibility, and supplier fit for Saudi demand.' },
      { n: '02', t: 'Maabar may ask for supporting proof', d: 'If needed, the team may ask for business license details, factory photos, or clarification on your trade profile.' },
      { n: '03', t: 'Approval unlocks supplier tools', d: 'Products, offers, requests, messages, and payout setup unlock only after approval.' },
    ],
    snapshotTitle: 'Submitted application summary',
    snapshotEmpty: 'Your application is on file even if not all profile fields are shown yet.',
    company: 'Company',
    location: 'Location',
    tradeLink: 'Trade profile',
    contacts: 'Contact channels',
    wechat: 'WeChat',
    whatsapp: 'WhatsApp',
    verificationTitle: 'Submitted proof snapshot',
    proofOnFile: 'On file',
    proofMissing: 'Not submitted yet',
    license: 'Business license',
    registration: 'Registration number',
    factory: 'Factory / warehouse photo',
    experience: 'Experience details',
    nextActionsTitle: 'What you should do now',
    nextActions: [
      'Wait for Maabar follow-up instead of creating a second account.',
      'Watch the same email address you used to register.',
      'Keep your store link, company name, and WeChat contact accurate in case the team cross-checks them.',
    ],
    prepareTitle: 'Useful to prepare while waiting',
    prepareItems: ['Business license copy', 'Registration number', 'Factory or warehouse photos', 'Preferred payout details for the later approval stage'],
    expectationsTitle: 'Review expectations',
    expectationsItems: [
      'Review starts only after email confirmation.',
      'The first response is usually a follow-up, approval, or proof request — not instant activation.',
      'If your profile link is incomplete or unclear, review can take longer.',
    ],
    supportTitle: 'Support and contact expectations',
    supportBody: 'For normal review, please wait for the queue. For corrections or urgent account issues, contact Maabar support from the same email identity you used during signup.',
    supportCta: 'Email support',
    dashboardCta: 'Open dashboard',
    home: 'Back to Home',
    logout: 'Sign Out',
    email: 'hello@maabar.io',
    founder: 'We are building the first supplier group carefully so Saudi buyers trust the marketplace from day one.',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 供应商申请状态',
    title: '申请已收到，您的公司正在审核中',
    sub: '这个页面就是为了消除不确定感。您的供应商账户不是出错，也不是丢失，更不是还差一个隐藏步骤。您的公司现在已经进入 Maabar 的供应商审核队列。',
    badge: '创始供应商审核队列',
    statusNow: '当前状态',
    statusReview: '审核中',
    statusReviewBody: '您的基础公司资料已收到，团队正在审核。',
    statusSubmitted: '申请已提交',
    statusSubmittedBody: '您无需重复注册。如果需要补充证明材料，团队会直接联系您。',
    statusEmail: '邮箱确认',
    statusEmailBody: '由于该邮箱已经确认，审核流程现已正式开始。',
    statusEmailValue: '已确认',
    statusProof: '已提交证明',
    statusProofBody: '当前申请中已存档的补充认证材料数量。',
    statusSla: '首次跟进预期',
    statusSlaBody: '通常在邮箱确认后的 3–5 个工作日内。',
    stepsTitle: '接下来会发生什么',
    steps: [
      { n: '01', t: '您的公司继续留在审核队列', d: '系统会安全保存申请，团队会评估与沙特市场需求的匹配度、可信度和供应商适配性。' },
      { n: '02', t: 'Maabar 可能要求补充证明', d: '如有需要，团队会要求补充营业执照信息、工厂照片或贸易主页说明。' },
      { n: '03', t: '审核通过后开放供应商工具', d: '只有在审核通过后，产品、报价、需求、消息和收款设置才会开放。' },
    ],
    snapshotTitle: '已提交申请摘要',
    snapshotEmpty: '即使这里暂未显示所有字段，您的申请也已经安全保存在系统中。',
    company: '公司',
    location: '所在地',
    tradeLink: '贸易主页',
    contacts: '联系渠道',
    wechat: 'WeChat',
    whatsapp: 'WhatsApp',
    verificationTitle: '已提交证明概况',
    proofOnFile: '已提交',
    proofMissing: '暂未提交',
    license: '营业执照',
    registration: '注册号',
    factory: '工厂 / 仓库照片',
    experience: '经验信息',
    nextActionsTitle: '您现在应该做什么',
    nextActions: [
      '请不要重复创建第二个账户，先等待 Maabar 跟进。',
      '请留意注册时使用的同一个邮箱地址。',
      '请确保店铺链接、公司名称和 WeChat 信息准确，方便团队核验。',
    ],
    prepareTitle: '等待期间建议准备',
    prepareItems: ['营业执照副本', '注册号', '工厂或仓库照片', '后续审批阶段使用的收款信息'],
    expectationsTitle: '审核预期',
    expectationsItems: [
      '只有在邮箱确认后，审核才会正式开始。',
      '首次回复通常是跟进、批准或补充材料请求，而不是即时开通。',
      '如果店铺链接信息不完整或不清晰，审核时间可能会更长。',
    ],
    supportTitle: '支持与联系说明',
    supportBody: '正常审核请先等待队列。如需更正资料或遇到账户问题，请使用注册时同一邮箱身份联系 Maabar 支持。',
    supportCta: '发送邮件给支持',
    dashboardCta: '打开控制台',
    home: '返回首页',
    logout: '退出登录',
    email: 'hello@maabar.io',
    founder: '我们会谨慎建立首批供应商池，让沙特买家从第一天开始就信任这个市场。',
    copy: 'Maabar © 2026',
  },
  ar: {
    tag: 'مَعبر · حالة طلب المورد',
    title: 'تم استلام الطلب — وشركتك الآن تحت المراجعة',
    sub: 'هذه الصفحة موجودة لإزالة أي غموض. حسابك ليس معلقاً بسبب خطأ، ولم يضع الطلب، ولا توجد خطوة سرية إضافية. شركتك الآن داخل قائمة مراجعة الموردين في مَعبر.',
    badge: 'قائمة مراجعة الموردين الأوائل',
    statusNow: 'الحالة الحالية',
    statusReview: 'تحت المراجعة',
    statusReviewBody: 'تم استلام بيانات الشركة الأساسية، والمراجعة جارية الآن.',
    statusSubmitted: 'الطلب مُرسل بالفعل',
    statusSubmittedBody: 'لا تحتاج لإعادة التسجيل. إذا احتجنا مستندات إضافية سنتواصل معك مباشرة.',
    statusEmail: 'تأكيد البريد',
    statusEmailBody: 'المراجعة مفعلة الآن لأن البريد المستخدم في الطلب تم تأكيده.',
    statusEmailValue: 'مؤكد',
    statusProof: 'الإثباتات المرفوعة',
    statusProofBody: 'عدد مستندات التحقق الإضافية الموجودة حالياً في الطلب.',
    statusSla: 'أول متابعة متوقعة',
    statusSlaBody: 'عادة خلال 3–5 أيام عمل بعد تأكيد البريد.',
    stepsTitle: 'وش اللي بيصير بعد كذا؟',
    steps: [
      { n: '01', t: 'الطلب يبقى محفوظاً في قائمة المراجعة', d: 'نراجع ملاءمة المورد للسوق السعودي، ومصداقية الهوية التجارية، وجودة الرابط التجاري المرسل.' },
      { n: '02', t: 'قد نطلب إثباتات إضافية', d: 'إذا احتجنا، قد نطلب الرخصة التجارية أو صور المصنع أو توضيحاً عن صفحة الشركة التجارية.' },
      { n: '03', t: 'بعد القبول تنفتح أدوات المورد', d: 'المنتجات والعروض والطلبات والرسائل وإعداد الدفعات تنفتح فقط بعد الموافقة.' },
    ],
    snapshotTitle: 'ملخص الطلب المرسل',
    snapshotEmpty: 'حتى لو ما ظهرت كل الحقول هنا، طلبك محفوظ عندنا في النظام.',
    company: 'الشركة',
    location: 'الموقع',
    tradeLink: 'الرابط التجاري',
    contacts: 'قنوات التواصل',
    wechat: 'WeChat',
    whatsapp: 'WhatsApp',
    verificationTitle: 'ملخص الإثباتات المرسلة',
    proofOnFile: 'موجود',
    proofMissing: 'غير مرفوع بعد',
    license: 'الرخصة التجارية',
    registration: 'رقم التسجيل',
    factory: 'صورة المصنع / المستودع',
    experience: 'بيانات الخبرة',
    nextActionsTitle: 'وش المفروض تسوي الآن؟',
    nextActions: [
      'انتظر متابعة مَعبر بدل إنشاء حساب جديد ثاني.',
      'راقب نفس البريد الإلكتروني الذي سجّلت به.',
      'تأكد أن اسم الشركة والرابط التجاري ووسيلة التواصل مثل WeChat صحيحة إذا احتجنا نطابقها.',
    ],
    prepareTitle: 'أشياء مفيد تجهزها أثناء الانتظار',
    prepareItems: ['نسخة من الرخصة التجارية', 'رقم التسجيل', 'صور المصنع أو المستودع', 'بيانات استلام الأرباح للمرحلة اللاحقة'],
    expectationsTitle: 'توقعات المراجعة',
    expectationsItems: [
      'المراجعة تبدأ فقط بعد تأكيد البريد الإلكتروني.',
      'أول رد غالباً يكون متابعة أو طلب إثبات أو قبول — وليس تفعيل فوري.',
      'إذا كان رابط الشركة ناقص أو غير واضح، قد تطول المدة أكثر.',
    ],
    supportTitle: 'الدعم وتوقعات التواصل',
    supportBody: 'في المراجعة العادية انتظر دورك في القائمة. إذا عندك تصحيح مهم أو مشكلة حساب عاجلة، تواصل مع دعم مَعبر من نفس البريد المستخدم وقت التسجيل.',
    supportCta: 'راسل الدعم',
    dashboardCta: 'افتح اللوحة',
    home: 'العودة للرئيسية',
    logout: 'تسجيل خروج',
    email: 'hello@maabar.io',
    founder: 'نبني قاعدة الموردين الأولى بعناية حتى يثق المشترون السعوديون بالمنصة من أول يوم.',
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

function ProofRow({ label, value, isPositive, isAr }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 16,
      border: '1px solid var(--border-subtle)',
      background: 'var(--bg-muted)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{label}</span>
      <span style={{
        fontSize: 11,
        color: isPositive ? '#7bc091' : 'var(--text-disabled)',
        border: `1px solid ${isPositive ? 'rgba(58,122,82,0.2)' : 'var(--border-subtle)'}`,
        background: isPositive ? 'rgba(58,122,82,0.08)' : 'rgba(0,0,0,0.04)',
        borderRadius: 999,
        padding: '4px 10px',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function PendingApproval({ lang = 'en', profile, setUser, setProfile }) {
  const nav = useNavigate();
  const t = T[lang] || T.en;
  const isAr = lang === 'ar';
  const supplierState = getSupplierOnboardingState(profile || {});
  const applicationState = getSupplierApplicationState(profile || {});
  const verificationState = getSupplierVerificationState(profile || {});
  const trustSignals = buildSupplierTrustSignals(profile || {});

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

  const proofRows = [
    { label: t.license, present: Boolean(profile?.license_photo) },
    { label: t.registration, present: Boolean(profile?.reg_number) },
    { label: t.factory, present: Boolean(profile?.factory_photo) },
    { label: t.experience, present: Boolean(profile?.years_experience) },
  ];

  return (
    <div style={{ minHeight: 'var(--app-dvh)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '92px 24px 48px' }}>
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 32,
          border: '1px solid var(--border-subtle)',
          background: 'rgba(0,0,0,0.03)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
          padding: '32px 32px 28px',
          marginBottom: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.03)', pointerEvents: 'none' }} />
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
              border: '1px solid rgba(0,0,0,0.07)',
              background: 'rgba(0,0,0,0.04)',
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
              maxWidth: 820,
              lineHeight: 1.85,
              margin: 0,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {t.sub}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 20 }} className="pending-status-grid">
          {[
            { title: t.statusNow, body: t.statusReviewBody, value: t.statusReview },
            { title: t.statusEmail, body: t.statusEmailBody, value: t.statusEmailValue },
            { title: t.statusSubmitted, body: t.statusSubmittedBody, value: `${applicationState.applicationCompletedRequiredCount}/${applicationState.applicationRequiredCount}` },
            { title: t.statusProof, body: t.statusProofBody, value: `${verificationState.completedRequiredCount}/${verificationState.requiredCount}` },
          ].map((item) => (
            <div key={item.title} style={{ borderRadius: 24, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', padding: 20 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>{item.title}</p>
              <p style={{ fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', margin: '0 0 8px' }}>{item.value}</p>
              <p style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item.body}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.14fr 0.86fr', gap: 20 }} className="pending-review-grid">
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ borderRadius: 28, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', padding: 24 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 14px' }}>
                {t.stepsTitle}
              </p>
              <div className="pending-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {t.steps.map((step, index) => (
                  <div
                    key={step.n}
                    style={{
                      padding: '20px 18px',
                      borderRadius: 22,
                      border: '1px solid var(--border-subtle)',
                      background: index === 1 ? 'rgba(0,0,0,0.04)' : 'var(--bg-muted)',
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
                  {t.verificationTitle}
                </p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {proofRows.map((item) => (
                    <ProofRow key={item.label} label={item.label} value={item.present ? t.proofOnFile : t.proofMissing} isPositive={item.present} isAr={isAr} />
                  ))}
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr
                    ? `إشارات الثقة الحالية: ${trustSignals.includes('trade_profile_available') ? 'رابط تجاري موجود' : 'لا يوجد رابط تجاري'}${trustSignals.includes('wechat_available') ? ' · WeChat موجود' : ''}${verificationState.hasContactMethod ? '' : ' · ما فيه وسيلة تواصل تجارية إضافية حتى الآن'}`
                    : lang === 'zh'
                      ? `当前信任信号：${trustSignals.includes('trade_profile_available') ? '已提供贸易主页链接' : '暂无贸易主页链接'}${trustSignals.includes('wechat_available') ? ' · 已提供 WeChat' : ''}${verificationState.hasContactMethod ? '' : ' · 暂无额外商务联系方式'}`
                      : `Current trust signals: ${trustSignals.includes('trade_profile_available') ? 'trade profile on file' : 'no trade profile on file'}${trustSignals.includes('wechat_available') ? ' · WeChat on file' : ''}${verificationState.hasContactMethod ? '' : ' · no extra business contact shown yet'}`}
                </p>
              </div>
            </div>
          </div>

          <div style={{
            borderRadius: 28,
            border: '1px solid var(--border-subtle)',
            background: 'rgba(0,0,0,0.03)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                {t.nextActionsTitle}
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {t.nextActions.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-primary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.75, marginTop: 7, flex: '0 0 auto' }} />
                    <span style={{ fontSize: 13, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 10px' }}>
                {t.prepareTitle}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {t.prepareItems.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.6, marginTop: 7, flex: '0 0 auto' }} />
                    <span style={{ fontSize: 12, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 10px' }}>
                {t.expectationsTitle}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {t.expectationsItems.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.6, marginTop: 7, flex: '0 0 auto' }} />
                    <span style={{ fontSize: 12, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', margin: '0 0 10px' }}>
                {t.supportTitle}
              </p>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.supportBody}
              </p>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.founder}
              </p>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {t.statusNow}: <strong style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{getSupplierStageLabel(supplierState.stage, lang)}</strong>{' '}
              · {t.email}
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
              <a href={`mailto:${t.email}`} style={{
                background: 'var(--text-primary)', border: 'none', color: 'var(--bg-base)',
                padding: '11px 20px', fontSize: 12, fontWeight: 700,
                borderRadius: 14, minHeight: 44, textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
              }}>
                {t.supportCta}
              </a>
              <button onClick={() => nav('/dashboard')} style={{
                background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
                padding: '11px 20px', fontSize: 12, cursor: 'pointer', borderRadius: 14, minHeight: 44,
              }}>
                {t.dashboardCta}
              </button>
              <button onClick={() => nav('/')} style={{
                background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
                padding: '11px 20px', fontSize: 12, cursor: 'pointer', borderRadius: 14, minHeight: 44,
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
        <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
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

        @media (max-width: 1100px) {
          .pending-status-grid,
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
