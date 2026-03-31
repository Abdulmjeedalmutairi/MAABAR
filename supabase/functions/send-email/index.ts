import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('APP_SUPABASE_URL') || 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') || '';
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
  return `<!DOCTYPE html>
<html lang="${locale.lang}" dir="${locale.dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark only">
<meta name="supported-color-schemes" content="dark only">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0b;background:#0a0a0b;font-family:${locale.font};color:#f5f5f2;direction:${locale.dir};text-align:${locale.align};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0b" style="width:100%;background:#0a0a0b;background-color:#0a0a0b;background-image:linear-gradient(#0a0a0b,#0a0a0b);">
    <tr>
      <td align="center" bgcolor="#0a0a0b" style="background:#0a0a0b;background-color:#0a0a0b;background-image:linear-gradient(#0a0a0b,#0a0a0b);padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#0a0a0b;background-color:#0a0a0b;background-image:linear-gradient(#0a0a0b,#0a0a0b);">
          <tr>
            <td bgcolor="#0a0a0b" style="background:#0a0a0b;background-color:#0a0a0b;background-image:linear-gradient(#0a0a0b,#0a0a0b);padding:0;text-align:center;border-bottom:1px solid rgba(255,255,255,.06);">
              <img src="${EMAIL_LOGO_URL}" alt="مَعبر | MAABAR" style="display:block;width:100%;max-width:620px;height:auto;border:0;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#101114" style="background:#101114;background-color:#101114;background-image:linear-gradient(#101114,#101114);padding:40px 32px;">
              ${darkBlend(content, '#101114')}
            </td>
          </tr>
          <tr>
            <td bgcolor="#0a0a0b" style="background:#0a0a0b;background-color:#0a0a0b;background-image:linear-gradient(#0a0a0b,#0a0a0b);padding:18px 24px 34px;text-align:center;border-top:1px solid rgba(255,255,255,.06);">
              <img src="${EMAIL_LOGO_URL}" alt="مَعبر | MAABAR" style="display:block;width:100%;max-width:260px;height:auto;border:0;margin:0 auto;" />
              <div style="font-size:12px;color:rgba(255,255,255,.46);margin-top:12px;line-height:1.8;">
                <a href="https://maabar.io" style="color:rgba(255,255,255,.72);text-decoration:none;">maabar.io</a>
                &nbsp;·&nbsp;
                <a href="mailto:hello@maabar.io" style="color:rgba(255,255,255,.72);text-decoration:none;">hello@maabar.io</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const templates = {
  admin_new_supplier: (d) => ({
    subject: `مورد جديد يطلب التسجيل — ${d.companyName || ''}`,
    to: ADMIN_EMAIL,
    html: wrap(`
<div class="bd">
<p class="gr">مورد جديد</p>
<p class="tg">New Supplier Application</p>
<div class="ib">
<p class="il">تفاصيل المورد</p>
<div class="ir"><span class="ik">اسم الشركة</span><span class="iv">${d.companyName || '-'}</span></div>
<div class="ir"><span class="ik">الإيميل</span><span class="iv">${d.email || '-'}</span></div>
<div class="ir"><span class="ik">WhatsApp</span><span class="iv">${d.whatsapp || '-'}</span></div>
<div class="ir"><span class="ik">WeChat</span><span class="iv">${d.wechat || '-'}</span></div>
<div class="ir"><span class="ik">طريقة الدفع</span><span class="iv">${d.payMethod || '-'}</span></div>
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
        cta: 'ابدأ الآن ←',
      },
      en: {
        subject: 'Your Maabar supplier application was approved',
        eyebrow: 'Supplier Approved',
        title: `Hello ${d.name || ''},`,
        body: 'Your supplier application has been approved on Maabar. You can now sign in and start receiving Saudi buyer opportunities.',
        cta: 'Start now →',
      },
      zh: {
        subject: '您在 Maabar 的供应商申请已通过',
        eyebrow: 'Supplier Approved',
        title: `${d.name || ''}，您好`,
        body: '您在 Maabar 的供应商申请已获批准。现在您可以登录并开始接收来自沙特买家的机会。',
        cta: '立即开始 →',
      },
    }[lang] || {
      subject: 'تم قبول طلبك في مَعبر',
      eyebrow: 'Supplier Approved',
      title: `أهلاً ${d.name || ''}،`,
      body: 'تمت الموافقة على طلب انضمامك كمورد في منصة مَعبر. يمكنك الآن تسجيل الدخول والبدء في استقبال طلبات التجار السعوديين.',
      cta: 'ابدأ الآن ←',
    };

    return ({
      subject: t.subject,
      html: wrap(`
<div style="font-size:24px;font-weight:800;line-height:1.5;color:#f5f5f2;margin:0 0 8px;">${t.title}</div>
<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.42);margin:0 0 22px;">${t.eyebrow}</div>
<p style="margin:0;font-size:16px;line-height:2;color:#ececef;">${t.body}</p>
<div style="text-align:center;margin-top:28px"><a href="https://maabar.io/login/supplier" style="display:inline-block;background:#f5f5f2;color:#0a0a0b;text-decoration:none;padding:16px 28px;border-radius:10px;font-size:16px;font-weight:800">${t.cta}</a></div>
`, { lang }),
    });
  },

  supplier_welcome: (d) => {
    const lang = d.lang || 'ar';
    const t = {
      ar: {
        subject: 'طلبك وصلنا — مَعبر',
        eyebrow: 'Application Received',
        title: `أهلاً ${d.name || ''}،`,
        body: 'استلمنا طلب تسجيلك كمورد. فريقنا سيراجع بياناتك خلال 24 ساعة وسنرسل لك إيميلاً فور اتخاذ القرار.',
      },
      en: {
        subject: 'We received your application — Maabar',
        eyebrow: 'Application Received',
        title: `Hello ${d.name || ''},`,
        body: 'We received your supplier application. Our team will review your details within 24 hours and email you once a decision is made.',
      },
      zh: {
        subject: '我们已收到您的申请 — Maabar',
        eyebrow: 'Application Received',
        title: `${d.name || ''}，您好`,
        body: '我们已收到您的供应商申请。团队将在 24 小时内审核您的资料，并在有结果后通过邮件通知您。',
      },
    }[lang] || {
      subject: 'طلبك وصلنا — مَعبر',
      eyebrow: 'Application Received',
      title: `أهلاً ${d.name || ''}،`,
      body: 'استلمنا طلب تسجيلك كمورد. فريقنا سيراجع بياناتك خلال 24 ساعة وسنرسل لك إيميلاً فور اتخاذ القرار.',
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
<div class="ir"><span class="ik">السعر</span><span class="iv">${d.price || '-'} SAR</span></div>
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
    const locale = localeMeta(d.lang || 'ar');
    return ({
    subject: d.subject || 'مَعبر',
    html: `<!DOCTYPE html>
<html lang="${locale.lang}" dir="${locale.dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="dark only">
<meta name="supported-color-schemes" content="dark only">
<title>${d.subject || 'مَعبر'}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:${locale.font};color:#f3f3f3;direction:${locale.dir};text-align:${locale.align}">
  <div style="max-width:620px;margin:0 auto;background:#0a0a0b;overflow:hidden">
    <div style="padding:34px 24px 26px;background:#0a0a0b;text-align:center;border-bottom:1px solid rgba(255,255,255,.06)">
      ${d.headerImageUrl ? `<img src="${d.headerImageUrl}" alt="Maabar" style="display:block;width:100%;max-width:620px;height:auto;border:0;" />` : `<img src="${EMAIL_LOGO_URL}" alt="مَعبر | MAABAR" style="display:block;width:100%;max-width:620px;height:auto;border:0;" />`}
    </div>
    <div style="padding:0;background:#0a0a0b">
      <div style="padding:42px 32px;background:#101114;background-image:linear-gradient(#101114,#101114);direction:${locale.dir};text-align:${locale.align}">
        ${darkBlend(`
        <p style="margin:0 0 18px;font-size:12px;letter-spacing:2px;color:rgba(255,255,255,.42)">${d.kicker || 'مَعبر | MAABAR'}</p>
        <h1 style="margin:0 0 12px;font-size:36px;line-height:1.45;font-weight:800;color:#ffffff">${d.headline || 'مَعبر'}</h1>
        ${d.subheadline ? `<p style="margin:0 0 22px;font-size:24px;line-height:1.8;font-weight:700;color:#ffffff">${d.subheadline}</p>` : ''}
        ${Array.isArray(d.paragraphs) ? d.paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:18px;line-height:2;color:#ececef">${p}</p>`).join('') : ''}
        ${Array.isArray(d.bullets) && d.bullets.length ? `
        <div style="margin:28px 0;padding:22px;background:#16161a;background-image:linear-gradient(#16161a,#16161a);border:1px solid rgba(255,255,255,.06);border-radius:12px">
          <p style="margin:0 0 16px;font-size:18px;line-height:1.8;font-weight:700;color:#ffffff">${d.bulletsTitle || 'المزايا'}</p>
          <ul style="margin:0;padding:0 22px 0 0;list-style:disc;list-style-position:inside;color:#ececef">
            ${d.bullets.map((item) => `<li style="margin:0 0 12px;font-size:18px;line-height:1.9;color:#ececef">${item}</li>`).join('')}
          </ul>
        </div>` : ''}
        ${d.footnote ? `<p style="margin:0 0 28px;font-size:19px;line-height:1.9;font-weight:800;color:#ffffff">${d.footnote}</p>` : ''}
        <div style="text-align:center;margin-top:28px">
          <a href="${d.ctaUrl || 'https://maabar.io'}" style="display:inline-block;background:#f5f5f2;color:#0a0a0b;text-decoration:none;padding:16px 28px;border-radius:10px;font-size:16px;font-weight:800">${d.ctaText || 'اعرف أكثر ←'}</a>
        </div>
        `, '#111113')}
      </div>
    </div>
    <div style="padding:22px 24px 34px;background:#0a0a0b;border-top:1px solid rgba(255,255,255,.06);text-align:center">
      <img src="${EMAIL_LOGO_URL}" alt="مَعبر | MAABAR" style="display:block;width:100%;max-width:260px;height:auto;border:0;margin:0 auto;" />
      <div style="font-size:12px;color:rgba(255,255,255,.46);margin-top:12px">maabar.io &nbsp;·&nbsp; hello@maabar.io</div>
    </div>
  </div>
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

async function resolveRecipient(to, data) {
  if (to) return to;
  if (data?.recipientUserId && adminSb) {
    const { data: profileRow, error } = await adminSb.from('profiles').select('email').eq('id', data.recipientUserId).single();
    if (error) throw error;
    return profileRow?.email || '';
  }
  return '';
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
      const adminTpl = templates.admin_new_supplier(data || {});
      const [welcomeResult, adminResult] = await Promise.all([
        sendEmail(data.email, welcomeTpl.subject, welcomeTpl.html),
        sendEmail(adminTpl.to || ADMIN_EMAIL, adminTpl.subject, adminTpl.html),
      ]);
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
    const tpl = factory(data || {});
    const recipient = tpl.to || await resolveRecipient(to, data);
    if (!recipient) return new Response(JSON.stringify({ error: 'No recipient' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    const result = await sendEmail(recipient, tpl.subject, tpl.html);
    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
