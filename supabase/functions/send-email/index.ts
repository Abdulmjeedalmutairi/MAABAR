import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('APP_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ADMIN_EMAIL = 'info@maabar.io';
const FROM = 'مَعبر | MAABAR <hello@maabar.io>';
const EMAIL_LOGO_URL = 'https://maabar.io/email-logo-header.svg';
const adminSb = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function brandLockup(variant = 'header') {
  const isHeader = variant === 'header';
  const pad = isHeader ? '28px 22px 24px' : '0';
  const titleSize = isHeader ? 24 : 18;
  const titleSpacing = isHeader ? '2.4px' : '1.8px';
  const zhSize = isHeader ? 14 : 12;
  return `
  <div style="text-align:center;width:100%;padding:${pad};background:#0a0a0b;background-image:linear-gradient(#0a0a0b,#0a0a0b);">
    <div style="font-size:${titleSize}px;line-height:1.2;font-weight:700;color:#f5f5f2;letter-spacing:${titleSpacing}">
      <span dir="ltr" style="display:inline-block">MAABAR</span>
      <span style="display:inline-block;color:rgba(255,255,255,.45);padding:0 10px">|</span>
      <span dir="rtl" style="display:inline-block;letter-spacing:0">مَعبر</span>
    </div>
    <div style="font-size:${zhSize}px;line-height:1.2;color:rgba(255,255,255,.45);margin-top:10px;letter-spacing:.04em">迈巴尔</div>
  </div>`;
}

function darkBlend(content, background = '#0a0a0b') {
  return `
  <div style="background:${background};background-color:${background};background-image:linear-gradient(${background},${background});color:#ffffff;">
    <div style="background:${background};mix-blend-mode:screen;">
      <div style="background:${background};mix-blend-mode:difference;">
        ${content}
      </div>
    </div>
  </div>`;
}

function localeMeta(lang = 'ar') {
  if (lang === 'zh') return { lang: 'zh', dir: 'ltr', align: 'left', font: `'Segoe UI', Arial, sans-serif` };
  if (lang === 'en') return { lang: 'en', dir: 'ltr', align: 'left', font: `'Segoe UI', Arial, sans-serif` };
  return { lang: 'ar', dir: 'rtl', align: 'right', font: `Tahoma, Arial, sans-serif` };
}

function wrap(content, options = {}) {
  const locale = localeMeta(options.lang || 'ar');
  const subject = options.subject || 'مَعبر';
  const grStyle = 'font-family:Arial,sans-serif;font-size:11px;letter-spacing:1.5px;color:#777777;margin:0 0 10px;text-transform:uppercase;';
  const tgStyle = 'font-family:Georgia,serif;font-size:22px;line-height:1.5;font-weight:bold;color:#1a1a1a;margin:0 0 16px;';
  const ibStyle = 'background-color:#f7f5f2;padding:16px 18px;margin:0 0 20px;';
  const ilStyle = 'font-family:Arial,sans-serif;font-size:11px;letter-spacing:1.5px;color:#777777;margin:0 0 10px;text-transform:uppercase;';
  const irStyle = 'padding:6px 0;border-bottom:1px solid #e8e6e3;font-family:Arial,sans-serif;';
  const ikStyle = 'display:inline-block;min-width:120px;font-size:13px;color:#777777;vertical-align:top;';
  const ivStyle = 'display:inline-block;font-size:13px;color:#333333;vertical-align:top;';
  const bwStyle = `margin-top:24px;text-align:${locale.align};`;
  const btStyle = 'display:inline-block;background-color:#2C2C2C;padding:14px 28px;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;';

  // Replace CSS classes with inline styles
  const rendered = content
    .replace(/<div class="bd">/g, `<div style="direction:${locale.dir};text-align:${locale.align};">`)
    .replace(/<p class="gr">/g, `<p style="${grStyle}">`)
    .replace(/<p class="tg">/g, `<p style="${tgStyle}">`)
    .replace(/<div class="ib">/g, `<div style="${ibStyle}">`)
    .replace(/<p class="il">/g, `<p style="${ilStyle}">`)
    .replace(/<div class="ir">/g, `<div style="${irStyle}">`)
    .replace(/<span class="ik">/g, `<span style="${ikStyle}">`)
    .replace(/<span class="iv">/g, `<span style="${ivStyle}">`)
    .replace(/<div class="bw">/g, `<div style="${bwStyle}">`)
    .replace(/class="bt"/g, `style="${btStyle}"`);

  return `<!DOCTYPE html>
<html lang="${locale.lang}" dir="${locale.dir}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f7f5f2">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">

<!-- HEADER -->
<tr>
<td bgcolor="#2C2C2C" style="padding:28px 40px;text-align:center;background-color:#2C2C2C !important;">
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
<tr>
<td style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#ffffff;white-space:nowrap;">MAABAR</td>
<td style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#cccccc;padding:0 10px;">|</td>
<td style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#ffffff;white-space:nowrap;">&#1605;&#1614;&#1593;&#1576;&#1585;</td>
</tr>
<tr>
<td colspan="3" style="font-family:Georgia,serif;font-size:15px;color:#cccccc;text-align:center;padding-top:5px;">&#36855;&#24052;&#23572;</td>
</tr>
</table>
</td>
</tr>

<!-- DIVIDER -->
<tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#e8e6e3" height="1"></td></tr></table></td></tr>

<!-- CONTENT -->
<tr>
<td style="padding:36px 40px;direction:${locale.dir};text-align:${locale.align};font-family:Arial,sans-serif;font-size:15px;color:#000000;line-height:1.7;">
${rendered}
</td>
</tr>

<!-- DIVIDER -->
<tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#e8e6e3" height="1"></td></tr></table></td></tr>

<!-- FOOTER -->
<tr>
<td bgcolor="#f7f5f2" style="padding:24px 40px;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#aaaaaa;">
<p style="margin:0 0 6px 0;">&#169; 2026 &#1605;&#1614;&#1593;&#1576;&#1585; &middot; Riyadh, Saudi Arabia</p>
<p style="margin:0;font-size:11px;">
<a href="https://maabar.io" style="color:#777777;text-decoration:none;">maabar.io</a> &nbsp;&middot;&nbsp;
<a href="mailto:info@maabar.io" style="color:#777777;text-decoration:none;">info@maabar.io</a> &nbsp;&middot;&nbsp;
<a href="https://maabar.io/unsubscribe" style="color:#aaaaaa;text-decoration:none;">&#1573;&#1604;&#1594;&#1575;&#1569; &#1575;&#1604;&#1575;&#1588;&#1578;&#1585;&#1575;&#1603;</a>
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}


const templates = {
  admin_new_supplier: (d) => ({
    subject: `طلب انضمام مورد جديد — ${d.companyName || ''}`,
    to: ADMIN_EMAIL,
    html: wrap(`
<div class="bd">
<p class="gr">Supplier application received</p>
<p class="tg">New Supplier Review Queue Item</p>
<div class="ib">
<p class="il">تفاصيل المورد</p>
<div class="ir"><span class="ik">اسم الشركة</span><span class="iv">${d.companyName || '-'}</span></div>
<div class="ir"><span class="ik">الإيميل</span><span class="iv">${d.email || '-'}</span></div>
<div class="ir"><span class="ik">الدولة / المدينة</span><span class="iv">${[d.country, d.city].filter(Boolean).join(' / ') || '-'}</span></div>
<div class="ir"><span class="ik">التخصص</span><span class="iv">${d.speciality || '-'}</span></div>
<div class="ir"><span class="ik">WhatsApp</span><span class="iv">${d.whatsapp || '-'}</span></div>
<div class="ir"><span class="ik">WeChat</span><span class="iv">${d.wechat || '-'}</span></div>
<div class="ir"><span class="ik">روابط الصفحات التجارية</span><span class="iv">${(Array.isArray(d.tradeLinks) ? d.tradeLinks.filter(Boolean).join(' • ') : '') || d.tradeLink || '-'}</span></div>
<div class="ir"><span class="ik">التحقق لاحقاً</span><span class="iv">السجل التجاري والرخصة والمستندات الكاملة تُجمع في خطوة التحقق اللاحقة عند الحاجة</span></div>
</div>
<div class="bw"><a href="https://maabar.io/admin-seed" class="bt">مراجعة المورد ←</a></div>
</div>`),
  }),

  supplier_approved: (d) => {
    const lang = d.lang || 'ar';
    const t = {
      ar: {
        subject: 'تم قبول طلبك في مَعبر',
        eyebrow: 'Supplier Approved',
        title: `أهلاً ${d.name || ''}،`,
        body: 'تمت الموافقة على طلب انضمامك كمورد في منصة مَعبر. يمكنك الآن تسجيل الدخول والبدء في استقبال طلبات التجار السعوديين.',
        supplierIdLabel: 'معرّف مورد مَعبر',
        supplierIdBody: 'احتفظ بهذا المعرّف للرجوع إليه عند التواصل مع الفريق أو متابعة الحساب.',
        cta: 'ابدأ الآن ←',
      },
      en: {
        subject: 'Your Maabar supplier application was approved',
        eyebrow: 'Supplier Approved',
        title: `Hello ${d.name || ''},`,
        body: 'Your supplier application has been approved on Maabar. You can now sign in and start receiving Saudi buyer opportunities.',
        supplierIdLabel: 'Maabar Supplier ID',
        supplierIdBody: 'Keep this ID for support, approval follow-up, and account reference.',
        cta: 'Start now →',
      },
      zh: {
        subject: '您在 Maabar 的供应商申请已通过',
        eyebrow: 'Supplier Approved',
        title: `${d.name || ''}，您好`,
        body: '您在 Maabar 的供应商申请已获批准。现在您可以登录并开始接收来自沙特买家的机会。',
        supplierIdLabel: 'Maabar 供应商编号',
        supplierIdBody: '建议保留此编号，方便联系团队、跟进审核和识别账户。',
        cta: '立即开始 →',
      },
    }[lang] || {
      subject: 'تم قبول طلبك في مَعبر',
      eyebrow: 'Supplier Approved',
      title: `أهلاً ${d.name || ''}،`,
      body: 'تمت الموافقة على طلب انضمامك كمورد في منصة مَعبر. يمكنك الآن تسجيل الدخول والبدء في استقبال طلبات التجار السعوديين.',
      supplierIdLabel: 'معرّف مورد مَعبر',
      supplierIdBody: 'احتفظ بهذا المعرّف للرجوع إليه عند التواصل مع الفريق أو متابعة الحساب.',
      cta: 'ابدأ الآن ←',
    };

    const supplierIdBlock = d.maabarSupplierId
      ? `<div style="margin-top:18px;padding:16px 18px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.42);">${t.supplierIdLabel}</p>
<p style="margin:0;font-size:20px;line-height:1.5;color:#f5f5f2;font-weight:800;letter-spacing:.06em;">${d.maabarSupplierId}</p>
<p style="margin:8px 0 0;font-size:13px;line-height:1.9;color:#a8a8ad;">${t.supplierIdBody}</p>
</div>`
      : '';

    return ({
      subject: t.subject,
      html: wrap(`
<div style="font-size:24px;font-weight:800;line-height:1.5;color:#f5f5f2;margin:0 0 8px;">${t.title}</div>
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.42);margin:0 0 22px;">${t.eyebrow}</div>
<p style="margin:0;font-size:16px;line-height:2;color:#ececef;">${t.body}</p>
${supplierIdBlock}
<div style="text-align:center;margin-top:28px"><a href="https://maabar.io/login/supplier" style="display:inline-block;background:#f5f5f2;color:#0a0a0b;text-decoration:none;padding:16px 28px;border-radius:10px;font-size:16px;font-weight:800">${t.cta}</a></div>
`, { lang }),
    });
  },

  supplier_welcome: (d) => {
    const lang = d.lang || 'ar';
    const t = {
      ar: {
        subject: 'تم استلام طلب انضمام المورد — مَعبر',
        eyebrow: 'Application Received',
        title: `أهلاً ${d.name || ''}،`,
        body: 'استلمنا طلب انضمامك كمورد مع بيانات شركتك الأساسية. بعد تأكيد البريد الإلكتروني، ستدخل مباشرة إلى لوحة المورد لإكمال التحقق، ثم يراجع فريق مَعبر الطلب بعد إرسال التحقق.',
      },
      en: {
        subject: 'Your supplier application was received — Maabar',
        eyebrow: 'Application Received',
        title: `Hello ${d.name || ''},`,
        body: 'We received your supplier application and basic company details. After email confirmation, you will enter the supplier dashboard to complete verification, and the Maabar team will review the account after verification is submitted.',
      },
      zh: {
        subject: '我们已收到您的供应商申请 — Maabar',
        eyebrow: 'Application Received',
        title: `${d.name || ''}，您好`,
        body: '我们已收到您的供应商申请和基础公司资料。完成邮箱确认后，您会进入供应商控制台继续完成认证；提交认证后，Maabar 团队会开始审核该账户。',
      },
    }[lang] || {
      subject: 'تم استلام طلب انضمام المورد — مَعبر',
      eyebrow: 'Application Received',
      title: `أهلاً ${d.name || ''}،`,
      body: 'استلمنا طلب انضمامك كمورد مع بيانات شركتك الأساسية. بعد تأكيد البريد الإلكتروني، ستدخل مباشرة إلى لوحة المورد لإكمال التحقق، ثم يراجع فريق مَعبر الطلب بعد إرسال التحقق.',
    };

    return ({
      subject: t.subject,
      html: wrap(`
<div style="font-size:24px;font-weight:800;line-height:1.5;color:#f5f5f2;margin:0 0 8px;">${t.title}</div>
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.42);margin:0 0 22px;">${t.eyebrow}</div>
<p style="margin:0;font-size:16px;line-height:2;color:#ececef;">${t.body}</p>
`, { lang }),
    });
  },

  trader_welcome: (d) => {
    const lang = d.lang || 'ar';
    const t = {
      ar: {
        subject: 'أهلاً بك في مَعبر',
        eyebrow: 'Welcome to Maabar',
        title: `أهلاً ${d.name || ''}،`,
        body: 'تم إنشاء حسابك بنجاح. يمكنك الآن رفع طلبات الاستيراد وتلقي عروض الأسعار مباشرة من الموردين الصينيين.',
        cta: 'ابدأ الآن ←',
      },
      en: {
        subject: 'Welcome to Maabar',
        eyebrow: 'Welcome to Maabar',
        title: `Hello ${d.name || ''},`,
        body: 'Your account has been created successfully. You can now post sourcing requests and receive offers directly from Chinese suppliers.',
        cta: 'Get started →',
      },
      zh: {
        subject: '欢迎加入 Maabar',
        eyebrow: 'Welcome to Maabar',
        title: `${d.name || ''}，您好`,
        body: '您的账户已成功创建。现在您可以发布采购需求，并直接接收中国供应商的报价。',
        cta: '立即开始 →',
      },
    }[lang] || {
      subject: 'أهلاً بك في مَعبر',
      eyebrow: 'Welcome to Maabar',
      title: `أهلاً ${d.name || ''}،`,
      body: 'تم إنشاء حسابك بنجاح. يمكنك الآن رفع طلبات الاستيراد وتلقي عروض الأسعار مباشرة من الموردين الصينيين.',
      cta: 'ابدأ الآن ←',
    };

    return ({
      subject: t.subject,
      html: wrap(`
<div style="font-size:24px;font-weight:800;line-height:1.5;color:#f5f5f2;margin:0 0 8px;">${t.title}</div>
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.42);margin:0 0 22px;">${t.eyebrow}</div>
<p style="margin:0;font-size:16px;line-height:2;color:#ececef;">${t.body}</p>
<div style="text-align:center;margin-top:28px"><a href="https://maabar.io/dashboard" style="display:inline-block;background:#f5f5f2;color:#0a0a0b;text-decoration:none;padding:16px 28px;border-radius:10px;font-size:16px;font-weight:800">${t.cta}</a></div>
`, { lang }),
    });
  },

  offer_accepted: (d) => ({
    subject: `تم قبول عرضك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Offer Accepted</p>
<p style="font-size:15px;color:#ececef">تم قبول عرضك على طلب <strong>${d.requestTitle || ''}</strong>. انتقل للوحة التحكم لمتابعة الطلب وانتظار الدفع.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">عرض الطلب ←</a></div>
</div>`),
  }),

  offer_rejected: (d) => ({
    subject: `تم اختيار عرض آخر — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Offer Not Selected</p>
<p style="font-size:15px;color:#ececef">نشكرك على مشاركتك. للأسف تم اختيار عرض آخر على طلب <strong>${d.requestTitle || ''}</strong>. استمر في تقديم عروضك على الطلبات الجديدة.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">تصفح الطلبات ←</a></div>
</div>`),
  }),

  payment_received_supplier: (d) => ({
    subject: `وصلت دفعتك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Payment Received</p>
<div class="ib">
<p class="il">تفاصيل الدفعة</p>
<div class="ir"><span class="ik">الطلب</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">المبلغ</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<p style="font-size:15px;color:#ececef;margin-top:16px">ابدأ التجهيز الآن وأضف رقم التتبع عند الشحن.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">متابعة الطلب ←</a></div>
</div>`),
  }),

  new_offer: (d) => ({
    subject: `عرض سعر جديد على طلبك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">New Offer Received</p>
<div class="ib">
<p class="il">تفاصيل العرض</p>
<div class="ir"><span class="ik">الطلب</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">المورد</span><span class="iv">${d.supplierName || '-'}</span></div>
<div class="ir"><span class="ik">سعر المنتج / الوحدة</span><span class="iv">${d.price || '-'} USD</span></div>
<div class="ir"><span class="ik">الشحن</span><span class="iv">${d.shippingCost === null || d.shippingCost === undefined || d.shippingCost === '' ? 'غير محدد بشكل منفصل' : `${d.shippingCost} USD`}</span></div>
${d.shippingMethod ? `<div class="ir"><span class="ik">طريقة الشحن</span><span class="iv">${d.shippingMethod}</span></div>` : ''}
<div class="ir"><span class="ik">الإجمالي التقديري</span><span class="iv">${d.estimatedTotal || d.price || '-'} USD</span></div>
<div class="ir"><span class="ik">مدة التسليم</span><span class="iv">${d.deliveryDays || '-'} يوم</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">مراجعة العروض ←</a></div>
</div>`),
  }),

  new_message: (d) => ({
    subject: `رسالة جديدة من ${d.senderName || 'Maabar'}`,
    html: wrap(`
<div class="bd">
<p class="gr">رسالة جديدة</p>
<p class="tg">New Message</p>
<p style="font-size:15px;color:#ececef">لديك رسالة جديدة من <strong>${d.senderName || '-'}</strong> على منصة مَعبر.</p>
<div class="ib">
<div class="ir"><span class="ik">المرسل</span><span class="iv">${d.senderName || '-'}</span></div>
<div class="ir"><span class="ik">المعاينة</span><span class="iv">${d.preview || '-'}</span></div>
</div>
<div class="bw"><a href="https://maabar.io/chat/${d.senderId || ''}" class="bt">فتح المحادثة ←</a></div>
</div>`),
  }),

  new_sample: (d) => ({
    subject: `طلب عينة جديد — ${d.productName || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">طلب عينة جديد</p>
<p class="tg">New Sample Request</p>
<div class="ib">
<div class="ir"><span class="ik">المنتج</span><span class="iv">${d.productName || '-'}</span></div>
<div class="ir"><span class="ik">الكمية</span><span class="iv">${d.quantity || '-'}</span></div>
<div class="ir"><span class="ik">الإجمالي التقريبي</span><span class="iv">${d.totalPrice || '-'} SAR</span></div>
</div>
<p style="font-size:15px;color:#ececef">قام تاجر بطلب عينة من منتجك. راجع الطلب من لوحة المورد.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">مراجعة الطلب ←</a></div>
</div>`),
  }),

  sample_approved: (d) => ({
    subject: `تمت الموافقة على طلب العينة — ${d.productName || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">تمت الموافقة على طلب العينة</p>
<p class="tg">Sample Approved</p>
<div class="ib">
<div class="ir"><span class="ik">المنتج</span><span class="iv">${d.productName || '-'}</span></div>
<div class="ir"><span class="ik">الإجمالي</span><span class="iv">${d.totalPrice || '-'} SAR</span></div>
</div>
<p style="font-size:15px;color:#ececef">وافق المورد على طلب العينة. يمكنك الآن متابعة التفاصيل مع المورد داخل المحادثة.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">عرض طلبات العينات ←</a></div>
</div>`),
  }),

  sample_rejected: (d) => ({
    subject: `تم رفض طلب العينة — ${d.productName || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">تم رفض طلب العينة</p>
<p class="tg">Sample Rejected</p>
<div class="ib">
<div class="ir"><span class="ik">المنتج</span><span class="iv">${d.productName || '-'}</span></div>
</div>
<p style="font-size:15px;color:#ececef">قام المورد برفض طلب العينة. يمكنك التواصل معه داخل مَعبر لمعرفة البدائل.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">عرض طلبات العينات ←</a></div>
</div>`),
  }),

  payment_confirmation_buyer: (d) => ({
    subject: `تم استلام دفعتك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً${d.name ? ' ' + d.name : ''}،</p>
<p class="tg">Payment Confirmed</p>
<div class="ib">
<p class="il">تفاصيل الدفعة</p>
<div class="ir"><span class="ik">الطلب</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">المبلغ المدفوع</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<p style="font-size:15px;color:#ececef;margin-top:16px">تم استلام دفعتك بنجاح. المورد سيبدأ التجهيز وسنعلمك عند شحن طلبك.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">متابعة الطلب ←</a></div>
</div>`),
  }),

  supplier_rejected: (d) => ({
    subject: 'بخصوص طلب انضمامك في مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Application Status</p>
<p style="font-size:15px;color:#ececef">نشكرك على اهتمامك بالانضمام لمنصة مَعبر. للأسف، لم نتمكن من قبول طلبك في الوقت الحالي. للاستفسار تواصل معنا على <a href="mailto:hello@maabar.io" style="color:#555">hello@maabar.io</a></p>
</div>`),
  }),
  shipment_tracking: (d) => ({
    subject: `طلبك في الطريق — رقم التتبع: ${d.trackingNumber || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">طلبك في الطريق!</p>
<p class="tg">Shipment Dispatched</p>
<div class="ib">
<p class="il">تفاصيل الشحن</p>
<div class="ir"><span class="ik">شركة الشحن</span><span class="iv">${d.shippingCompany || '-'}</span></div>
<div class="ir"><span class="ik">رقم التتبع</span><span class="iv">${d.trackingNumber || '-'}</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">متابعة الطلب ←</a></div>
</div>`),
  }),
  payout_initiated: (d) => ({
    subject: 'تم تأكيد استلام بضاعتك — مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Payout Initiated</p>
<p style="font-size:15px;color:#ececef">أكّد التاجر استلام الشحنة. سيتم تحويل مبلغك خلال <strong>24 ساعة</strong> عبر طريقة الدفع المسجلة.</p>
<div class="ib">
<div class="ir"><span class="ik">المبلغ</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">عرض لوحة التحكم ←</a></div>
</div>`),
  }),
  custom_marketing: (d) => {
    const infoRows = Array.isArray(d.infoRows) ? d.infoRows : [];
    const paragraphs = Array.isArray(d.paragraphs) ? d.paragraphs : [];
    const renderedParagraphs = paragraphs
      .map((p) => `<div style="font-size:15px;line-height:2;color:#888888;margin:0 0 16px 0;font-weight:400;font-family:'Cairo',Tahoma,Arial,sans-serif;">${p}</div>`)
      .join('');
    const renderedInfoRows = infoRows.length
      ? infoRows
          .map((row, index) => `
 <tr>
 <td style="font-size:13px;color:#666;padding:6px 0;${index < infoRows.length - 1 ? 'border-bottom:1px solid #222;' : ''}font-family:'Cairo',Tahoma,Arial,sans-serif;">${row?.label || '-'}</td>
 <td align="left" style="font-size:13px;color:#aaa;padding:6px 0;${index < infoRows.length - 1 ? 'border-bottom:1px solid #222;' : ''}font-family:'Cairo',Tahoma,Arial,sans-serif;">${row?.value || '-'}</td>
 </tr>`)
          .join('')
      : `
 <tr>
 <td style="font-size:13px;color:#666;padding:6px 0;border-bottom:1px solid #222;font-family:'Cairo',Tahoma,Arial,sans-serif;">عنوان المعلومة</td>
 <td align="left" style="font-size:13px;color:#aaa;padding:6px 0;border-bottom:1px solid #222;font-family:'Cairo',Tahoma,Arial,sans-serif;">القيمة</td>
 </tr>
 <tr>
 <td style="font-size:13px;color:#666;padding:6px 0;border-bottom:1px solid #222;font-family:'Cairo',Tahoma,Arial,sans-serif;">عنوان المعلومة</td>
 <td align="left" style="font-size:13px;color:#aaa;padding:6px 0;border-bottom:1px solid #222;font-family:'Cairo',Tahoma,Arial,sans-serif;">القيمة</td>
 </tr>
 <tr>
 <td style="font-size:13px;color:#666;padding:6px 0;font-family:'Cairo',Tahoma,Arial,sans-serif;">عنوان المعلومة</td>
 <td align="left" style="font-size:13px;color:#aaa;padding:6px 0;font-family:'Cairo',Tahoma,Arial,sans-serif;">القيمة</td>
 </tr>`;

    const contentHtml = d.contentHtml || `
 <div style="font-size:10px;letter-spacing:2px;color:#444;margin-bottom:14px;font-family:'Cairo',Tahoma,Arial,sans-serif;">
 ${d.emailType || d.kicker || 'نوع الإيميل هنا'}
 </div>

 <div style="font-size:24px;line-height:1.6;font-weight:700;color:#ffffff;margin:0 0 16px 0;font-family:'Cairo',Tahoma,Arial,sans-serif;">
 ${d.headline || 'العنوان الرئيسي للإيميل'}
 </div>

 ${renderedParagraphs || `<div style="font-size:15px;line-height:2;color:#888888;margin:0 0 28px 0;font-weight:400;font-family:'Cairo',Tahoma,Arial,sans-serif;">${d.body || 'النص الرئيسي للإيميل يكتب هنا. يمكن أن يكون فقرة واحدة أو أكثر حسب نوع الإيميل.'}</div>`}

 <div style="height:1px;background:#1e1e22;margin:0 0 28px 0;"></div>

 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
 <tr>
 <td style="background:#1a1a1f;border-radius:8px;padding:20px 20px;">
 <div style="font-size:10px;letter-spacing:2px;color:#444;margin-bottom:12px;font-family:'Cairo',Tahoma,Arial,sans-serif;">${d.detailsTitle || 'التفاصيل'}</div>
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
 ${renderedInfoRows}
 </table>
 </td>
 </tr>
 </table>

 ${d.hideCta ? '' : `
 <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 0 0;">
 <tr>
 <td align="center" style="background:#ffffff;border-radius:6px;padding:13px 32px;">
 <a href="${d.ctaUrl || '#'}" style="font-size:14px;font-weight:700;color:#111114;text-decoration:none;font-family:'Cairo',Tahoma,Arial,sans-serif;">
 ${d.ctaText || 'نص الزر هنا ←'}
 </a>
 </td>
 </tr>
 </table>`}`;

    return ({
      subject: d.subject || 'مَعبر',
      html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>${d.subject || 'مَعبر'}</title>
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Cairo',Tahoma,Arial,sans-serif;color:#ffffff;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;width:100%;border-collapse:collapse;">
<tr>
<td align="center" style="padding:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:collapse;">

 <tr>
 <td align="center" style="background:#111114;padding:28px 24px;border-bottom:1px solid #222226;">
 <table role="presentation" cellpadding="0" cellspacing="0" border="0">
 <tr>
 <td align="center" style="font-size:19px;font-weight:700;color:#ffffff;font-family:'Cairo',Tahoma,Arial,sans-serif;letter-spacing:0.3px;">
 مَعبر &nbsp;<span style="color:#383838;">|</span>&nbsp; <span style="color:#aaaaaa;font-size:16px;font-weight:600;">MAABAR</span>
 </td>
 </tr>
 <tr>
 <td align="center" style="font-size:11px;color:#383838;padding-top:5px;letter-spacing:2px;font-family:Arial,sans-serif;">
 迈巴尔
 </td>
 </tr>
 </table>
 </td>
 </tr>

 <tr>
 <td style="background:#111114;padding:44px 32px 36px 32px;text-align:right;direction:rtl;">
 ${contentHtml}
 </td>
 </tr>

 <tr>
 <td align="center" style="background:#0d0d10;padding:20px 24px;border-top:1px solid #1a1a1f;">
 <div style="font-size:10px;letter-spacing:2px;color:#333;font-family:Arial,sans-serif;">
 MAABAR.IO &nbsp;·&nbsp; مَعبر &nbsp;·&nbsp; 迈巴尔
 </div>
 </td>
 </tr>

</table>
</td>
</tr>
</table>

</body>
</html>`,
    });
  },
};

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(result?.message || result?.error || `Resend failed (${res.status})`);
  }
  return result;
}

function normalizeLang(value) {
  if (!value) return '';
  const lang = String(value).toLowerCase();
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('zh') || lang.startsWith('cn')) return 'zh';
  return '';
}

async function resolveEmailContext(to, data = {}) {
  const explicitLang = normalizeLang(data?.lang || data?.language || data?.locale || data?.preferredLanguage);
  if (!adminSb) {
    return { recipient: to || '', lang: explicitLang || 'ar', profileRow: null };
  }

  let profileRow = null;
  if (data?.recipientUserId) {
    const { data: row, error } = await adminSb.from('profiles').select('*').eq('id', data.recipientUserId).maybeSingle();
    if (error) throw error;
    profileRow = row || null;
  } else if (to) {
    const { data: row, error } = await adminSb.from('profiles').select('*').eq('email', to).maybeSingle();
    if (error) throw error;
    profileRow = row || null;
  }

  const recipient = to || profileRow?.email || '';
  const inferredLang = normalizeLang(
    explicitLang ||
    profileRow?.lang ||
    profileRow?.language ||
    profileRow?.locale ||
    profileRow?.preferred_language ||
    profileRow?.preferredLanguage,
  ) || 'ar';

  return { recipient, lang: inferredLang, profileRow };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { type, to, data } = await req.json();

    if (type === 'supplier_signup_bundle') {
      if (!data?.email) {
        return new Response(JSON.stringify({ error: 'Missing supplier email' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const welcomeTpl = templates.supplier_welcome(data || {});
      const welcomeResult = await sendEmail(data.email, welcomeTpl.subject, welcomeTpl.html);

      let adminResult = null;
      if (data?.sendAdmin === true) {
        const adminTpl = templates.admin_new_supplier(data || {});
        adminResult = await sendEmail(adminTpl.to || ADMIN_EMAIL, adminTpl.subject, adminTpl.html);
      }

      return new Response(JSON.stringify({ ok: true, welcomeResult, adminResult }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    if (type === 'inspect_email') {
      if (!data?.emailId) {
        return new Response(JSON.stringify({ error: 'Missing emailId' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      }
      const inspectRes = await fetch(`https://api.resend.com/emails/${data.emailId}`, {
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` },
      });
      const inspectData = await inspectRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ ok: inspectRes.ok, status: inspectRes.status, data: inspectData }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    const factory = templates[type];
    if (!factory) return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    const emailContext = await resolveEmailContext(to, data || {});
    const payload = {
      ...(data || {}),
      lang: normalizeLang(data?.lang || data?.language || emailContext.lang) || 'ar',
      maabarSupplierId: data?.maabarSupplierId || emailContext.profileRow?.maabar_supplier_id || '',
    };
    const tpl = factory(payload);
    const recipient = tpl.to || emailContext.recipient;
    if (!recipient) return new Response(JSON.stringify({ error: 'No recipient' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    const result = await sendEmail(recipient, tpl.subject, tpl.html);
    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
