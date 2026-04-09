import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('APP_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ADMIN_EMAIL = 'info@maabar.io';
const FROM = 'مَعبر | MAABAR <hello@maabar.io>';
const adminSb = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function localeMeta(lang = 'ar') {
  if (lang === 'zh') return { lang: 'zh', dir: 'ltr', align: 'left', font: `'Segoe UI', Arial, sans-serif` };
  if (lang === 'en') return { lang: 'en', dir: 'ltr', align: 'left', font: `'Segoe UI', Arial, sans-serif` };
  return { lang: 'ar', dir: 'rtl', align: 'right', font: `Tahoma, Arial, sans-serif` };
}

function wrap(content, options: any = {}) {
  const locale = localeMeta(options.lang || 'ar');
  const subject = options.subject || 'مَعبر';

  const grStyle = 'font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:rgba(0,0,0,0.22);margin:0 0 10px;text-transform:uppercase;';
  const tgStyle = 'font-family:Georgia,serif;font-size:22px;line-height:1.4;font-weight:700;color:rgba(0,0,0,0.88);margin:0 0 16px;';
  const ibStyle = 'background-color:#FAF8F5;border:1px solid rgba(0,0,0,0.07);border-radius:10px;padding:16px 18px;margin:0 0 20px;';
  const ilStyle = 'font-family:Arial,sans-serif;font-size:10px;letter-spacing:2px;color:rgba(0,0,0,0.22);margin:0 0 10px;text-transform:uppercase;';
  const irStyle = 'padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.07);font-family:Arial,sans-serif;';
  const ikStyle = 'display:inline-block;min-width:130px;font-size:12px;color:rgba(0,0,0,0.45);vertical-align:top;';
  const ivStyle = 'display:inline-block;font-size:12px;color:rgba(0,0,0,0.88);font-weight:600;vertical-align:top;';
  const bwStyle = `margin-top:24px;text-align:${locale.align};`;
  const btStyle = 'display:inline-block;background-color:#1a1a1a;padding:14px 28px;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:600;border-radius:10px;';

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
<body style="margin:0;padding:0;background:#EDE9E3;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#EDE9E3">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);">

<!-- HEADER -->
<tr>
<td bgcolor="#FAF8F5" style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.07);">
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
<tr>
<td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(0,0,0,0.88);letter-spacing:2px;white-space:nowrap;">مَعبر</td>
<td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(0,0,0,0.22);padding:0 10px;">|</td>
<td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:rgba(0,0,0,0.88);letter-spacing:2px;white-space:nowrap;">MAABAR</td>
</tr>
<tr>
<td colspan="3" style="font-family:Arial,sans-serif;font-size:11px;color:rgba(0,0,0,0.22);text-align:center;padding-top:6px;letter-spacing:2px;">迈巴尔</td>
</tr>
</table>
</td>
</tr>

<!-- DIVIDER -->
<tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="rgba(0,0,0,0.07)" height="1"></td></tr></table></td></tr>

<!-- CONTENT -->
<tr>
<td style="padding:36px 40px;direction:${locale.dir};text-align:${locale.align};font-family:Arial,sans-serif;font-size:14px;color:rgba(0,0,0,0.88);line-height:1.8;background:#ffffff;">
${rendered}
</td>
</tr>

<!-- DIVIDER -->
<tr><td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="rgba(0,0,0,0.07)" height="1"></td></tr></table></td></tr>

<!-- FOOTER -->
<tr>
<td bgcolor="#FAF8F5" style="padding:24px 40px;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:rgba(0,0,0,0.35);">
<p style="margin:0 0 8px 0;">© 2026 مَعبر · Riyadh, Saudi Arabia</p>
<p style="margin:0;">
<a href="https://maabar.io" style="color:rgba(0,0,0,0.45);text-decoration:none;">maabar.io</a> &nbsp;·&nbsp;
<a href="mailto:info@maabar.io" style="color:rgba(0,0,0,0.45);text-decoration:none;">info@maabar.io</a> &nbsp;·&nbsp;
<a href="https://maabar.io/unsubscribe" style="color:rgba(0,0,0,0.25);text-decoration:none;">إلغاء الاشتراك</a>
</p>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Templates ───────────────────────────────────────────────────────────────
const templates: Record<string, (d: any) => any> = {

  supplier_confirmation: async (d) => {
    if (!adminSb) throw new Error('No admin client');
    const { data: linkData, error } = await adminSb.auth.admin.generateLink({
      type: 'signup',
      email: d.email,
      options: { redirectTo: d.redirectTo || 'https://maabar.io/dashboard' },
    });
    if (error) throw error;
    const confirmUrl = linkData?.properties?.action_link || '';
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: 'تأكيد بريدك الإلكتروني — مَعبر', eyebrow: 'Confirm Your Email', title: `أهلاً ${d.name || ''}،`, body: 'شكراً لتسجيلك كمورد في مَعبر. اضغط على الزر أدناه لتأكيد بريدك الإلكتروني وتفعيل حسابك.', cta: 'تأكيد البريد الإلكتروني ←' },
      en: { subject: 'Confirm your email — Maabar', eyebrow: 'Confirm Your Email', title: `Hello ${d.name || ''},`, body: 'Thank you for registering as a supplier on Maabar. Click the button below to confirm your email and activate your account.', cta: 'Confirm Email →' },
      zh: { subject: '请确认您的邮箱 — Maabar', eyebrow: 'Confirm Your Email', title: `${d.name || ''}，您好`, body: '感谢您在 Maabar 注册为供应商。请点击下方按钮确认您的邮箱并激活账户。', cta: '确认邮箱 →' },
    } as any)[lang] || { subject: 'تأكيد بريدك — مَعبر', eyebrow: 'Confirm Your Email', title: `أهلاً،`, body: 'اضغط لتأكيد بريدك.', cta: 'تأكيد ←' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 24px;">${t.body}</p>
<div class="bw"><a href="${confirmUrl}" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

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
    const t = ({
      ar: { subject: 'تم قبول طلبك في مَعبر', eyebrow: 'Supplier Approved', title: `أهلاً ${d.name || ''}،`, body: 'تمت الموافقة على طلب انضمامك كمورد في منصة مَعبر. يمكنك الآن تسجيل الدخول والبدء في استقبال طلبات التجار السعوديين.', supplierIdLabel: 'معرّف مورد مَعبر', supplierIdBody: 'احتفظ بهذا المعرّف للرجوع إليه عند التواصل مع الفريق أو متابعة الحساب.', cta: 'ابدأ الآن ←' },
      en: { subject: 'Your Maabar supplier application was approved', eyebrow: 'Supplier Approved', title: `Hello ${d.name || ''},`, body: 'Your supplier application has been approved on Maabar. You can now sign in and start receiving Saudi buyer opportunities.', supplierIdLabel: 'Maabar Supplier ID', supplierIdBody: 'Keep this ID for support, approval follow-up, and account reference.', cta: 'Start now →' },
      zh: { subject: '您在 Maabar 的供应商申请已通过', eyebrow: 'Supplier Approved', title: `${d.name || ''}，您好`, body: '您在 Maabar 的供应商申请已获批准。现在您可以登录并开始接收来自沙特买家的机会。', supplierIdLabel: 'Maabar 供应商编号', supplierIdBody: '建议保留此编号，方便联系团队、跟进审核和识别账户。', cta: '立即开始 →' },
    } as any)[lang] || { subject: 'تم قبول طلبك في مَعبر', eyebrow: 'Supplier Approved', title: `أهلاً ${d.name || ''}،`, body: 'تمت الموافقة على طلب انضمامك كمورد في منصة مَعبر.', supplierIdLabel: 'معرّف مورد مَعبر', supplierIdBody: 'احتفظ بهذا المعرّف.', cta: 'ابدأ الآن ←' };

    const supplierIdBlock = d.maabarSupplierId ? `
<div style="margin-top:18px;padding:16px 18px;border-radius:10px;background:#FAF8F5;border:1px solid rgba(0,0,0,0.07);">
<p style="margin:0 0 6px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(0,0,0,0.22);">${t.supplierIdLabel}</p>
<p style="margin:0;font-size:20px;line-height:1.5;color:rgba(0,0,0,0.88);font-weight:700;letter-spacing:.06em;">${d.maabarSupplierId}</p>
<p style="margin:8px 0 0;font-size:12px;line-height:1.8;color:rgba(0,0,0,0.45);">${t.supplierIdBody}</p>
</div>` : '';

    return ({ subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 16px;">${t.body}</p>
${supplierIdBlock}
<div class="bw"><a href="https://maabar.io/login/supplier" class="bt">${t.cta}</a></div>
</div>`, { lang }) });
  },

  supplier_welcome: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: 'تم استلام طلب انضمام المورد — مَعبر', eyebrow: 'Application Received', title: `أهلاً ${d.name || ''}،`, body: 'استلمنا طلب انضمامك كمورد مع بيانات شركتك الأساسية. بعد تأكيد البريد الإلكتروني، ستدخل مباشرة إلى لوحة المورد لإكمال التحقق، ثم يراجع فريق مَعبر الطلب بعد إرسال التحقق.' },
      en: { subject: 'Your supplier application was received — Maabar', eyebrow: 'Application Received', title: `Hello ${d.name || ''},`, body: 'We received your supplier application and basic company details. After email confirmation, you will enter the supplier dashboard to complete verification, and the Maabar team will review the account after verification is submitted.' },
      zh: { subject: '我们已收到您的供应商申请 — Maabar', eyebrow: 'Application Received', title: `${d.name || ''}，您好`, body: '我们已收到您的供应商申请和基础公司资料。完成邮箱确认后，您会进入供应商控制台继续完成认证；提交认证后，Maabar 团队会开始审核该账户。' },
    } as any)[lang] || { subject: 'تم استلام طلب انضمام المورد — مَعبر', eyebrow: 'Application Received', title: `أهلاً ${d.name || ''}،`, body: 'استلمنا طلب انضمامك.' };
    return ({ subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0;">${t.body}</p>
</div>`, { lang }) });
  },

  trader_welcome: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: 'أهلاً بك في مَعبر', eyebrow: 'Welcome to Maabar', title: `أهلاً ${d.name || ''}،`, body: 'تم إنشاء حسابك بنجاح. يمكنك الآن رفع طلبات الاستيراد وتلقي عروض الأسعار مباشرة من الموردين الصينيين.', cta: 'ابدأ الآن ←' },
      en: { subject: 'Welcome to Maabar', eyebrow: 'Welcome to Maabar', title: `Hello ${d.name || ''},`, body: 'Your account has been created successfully. You can now post sourcing requests and receive offers directly from Chinese suppliers.', cta: 'Get started →' },
      zh: { subject: '欢迎加入 Maabar', eyebrow: 'Welcome to Maabar', title: `${d.name || ''}，您好`, body: '您的账户已成功创建。现在您可以发布采购需求，并直接接收中国供应商的报价。', cta: '立即开始 →' },
    } as any)[lang] || { subject: 'أهلاً بك في مَعبر', eyebrow: 'Welcome to Maabar', title: `أهلاً ${d.name || ''}،`, body: 'تم إنشاء حسابك بنجاح.', cta: 'ابدأ الآن ←' };
    return ({ subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 24px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">${t.cta}</a></div>
</div>`, { lang }) });
  },

  offer_accepted: (d) => ({
    subject: `تم قبول عرضك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Offer Accepted</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">تم قبول عرضك على طلب <strong style="color:rgba(0,0,0,0.88);">${d.requestTitle || ''}</strong>. انتقل للوحة التحكم لمتابعة الطلب وانتظار الدفع.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">عرض الطلب ←</a></div>
</div>`),
  }),

  offer_rejected: (d) => ({
    subject: `تم اختيار عرض آخر — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Offer Not Selected</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">نشكرك على مشاركتك. للأسف تم اختيار عرض آخر على طلب <strong style="color:rgba(0,0,0,0.88);">${d.requestTitle || ''}</strong>. استمر في تقديم عروضك على الطلبات الجديدة.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">تصفح الطلبات ←</a></div>
</div>`),
  }),

  payment_received_supplier: (d) => ({
    subject: `وصلت دفعتك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Payment Received</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<div class="ib">
<p class="il">تفاصيل الدفعة</p>
<div class="ir"><span class="ik">الطلب</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">المبلغ</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">ابدأ التجهيز الآن وأضف رقم التتبع عند الشحن.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">متابعة الطلب ←</a></div>
</div>`),
  }),

  new_offer: (d) => ({
    subject: `عرض سعر جديد على طلبك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">New Offer Received</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<div class="ib">
<p class="il">تفاصيل العرض</p>
<div class="ir"><span class="ik">الطلب</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">المورد</span><span class="iv">${d.supplierName || '-'}</span></div>
<div class="ir"><span class="ik">سعر الوحدة</span><span class="iv">${d.price || '-'} USD</span></div>
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
<p class="gr">New Message</p>
<p class="tg">لديك رسالة جديدة</p>
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
<p class="gr">New Sample Request</p>
<p class="tg">طلب عينة جديد</p>
<div class="ib">
<div class="ir"><span class="ik">المنتج</span><span class="iv">${d.productName || '-'}</span></div>
<div class="ir"><span class="ik">الكمية</span><span class="iv">${d.quantity || '-'}</span></div>
<div class="ir"><span class="ik">الإجمالي التقريبي</span><span class="iv">${d.totalPrice || '-'} SAR</span></div>
</div>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">قام تاجر بطلب عينة من منتجك. راجع الطلب من لوحة المورد.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">مراجعة الطلب ←</a></div>
</div>`),
  }),

  sample_approved: (d) => ({
    subject: `تمت الموافقة على طلب العينة — ${d.productName || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Sample Approved</p>
<p class="tg">تمت الموافقة على طلب العينة</p>
<div class="ib">
<div class="ir"><span class="ik">المنتج</span><span class="iv">${d.productName || '-'}</span></div>
<div class="ir"><span class="ik">الإجمالي</span><span class="iv">${d.totalPrice || '-'} SAR</span></div>
</div>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">وافق المورد على طلب العينة. يمكنك الآن متابعة التفاصيل مع المورد داخل المحادثة.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">عرض طلبات العينات ←</a></div>
</div>`),
  }),

  sample_rejected: (d) => ({
    subject: `تم رفض طلب العينة — ${d.productName || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Sample Rejected</p>
<p class="tg">تم رفض طلب العينة</p>
<div class="ib">
<div class="ir"><span class="ik">المنتج</span><span class="iv">${d.productName || '-'}</span></div>
</div>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">قام المورد برفض طلب العينة. يمكنك التواصل معه داخل مَعبر لمعرفة البدائل.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">عرض طلبات العينات ←</a></div>
</div>`),
  }),

  payment_confirmation_buyer: (d) => ({
    subject: `تم استلام دفعتك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Payment Confirmed</p>
<p class="tg">أهلاً${d.name ? ' ' + d.name : ''}،</p>
<div class="ib">
<p class="il">تفاصيل الدفعة</p>
<div class="ir"><span class="ik">الطلب</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">المبلغ المدفوع</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">تم استلام دفعتك بنجاح. المورد سيبدأ التجهيز وسنعلمك عند شحن طلبك.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">متابعة الطلب ←</a></div>
</div>`),
  }),

  supplier_rejected: (d) => ({
    subject: 'بخصوص طلب انضمامك في مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">Application Status</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0;">نشكرك على اهتمامك بالانضمام لمنصة مَعبر. للأسف، لم نتمكن من قبول طلبك في الوقت الحالي. للاستفسار تواصل معنا على <a href="mailto:hello@maabar.io" style="color:rgba(0,0,0,0.55);">hello@maabar.io</a></p>
</div>`),
  }),

  shipment_tracking: (d) => ({
    subject: `طلبك في الطريق — رقم التتبع: ${d.trackingNumber || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">Shipment Dispatched</p>
<p class="tg">طلبك في الطريق</p>
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
<p class="gr">Payout Initiated</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 16px;">أكّد التاجر استلام الشحنة. سيتم تحويل مبلغك خلال <strong style="color:rgba(0,0,0,0.88);">24 ساعة</strong> عبر طريقة الدفع المسجلة.</p>
<div class="ib">
<div class="ir"><span class="ik">المبلغ</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">عرض لوحة التحكم ←</a></div>
</div>`),
  }),

  custom_marketing: (d) => {
    const infoRows = Array.isArray(d.infoRows) ? d.infoRows : [];
    const paragraphs = Array.isArray(d.paragraphs) ? d.paragraphs : [];
    const renderedParagraphs = paragraphs.map((p: string) => `<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 16px;">${p}</p>`).join('');
    const renderedInfoRows = infoRows.length
      ? infoRows.map((row: any) => `<div class="ir"><span class="ik">${row?.label || '-'}</span><span class="iv">${row?.value || '-'}</span></div>`).join('')
      : `<div class="ir"><span class="ik">التفاصيل</span><span class="iv">—</span></div>`;
    return ({
      subject: d.subject || 'مَعبر',
      html: wrap(`
<div class="bd">
<p class="gr">${d.kicker || d.emailType || 'مَعبر'}</p>
<p class="tg">${d.headline || ''}</p>
${renderedParagraphs || `<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${d.body || ''}</p>`}
<div class="ib">
<p class="il">${d.detailsTitle || 'التفاصيل'}</p>
${renderedInfoRows}
</div>
${d.hideCta ? '' : `<div class="bw"><a href="${d.ctaUrl || '#'}" class="bt">${d.ctaText || 'اكتشف المزيد ←'}</a></div>`}
</div>`),
    });
  },
};

// ─── Send helper ─────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(result?.message || result?.error || `Resend failed (${res.status})`);
  return result;
}

function normalizeLang(value: any) {
  if (!value) return '';
  const lang = String(value).toLowerCase();
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('zh') || lang.startsWith('cn')) return 'zh';
  return '';
}

async function resolveEmailContext(to: string, data: any = {}) {
  const explicitLang = normalizeLang(data?.lang || data?.language || data?.locale || data?.preferredLanguage);
  if (!adminSb) return { recipient: to || '', lang: explicitLang || 'ar', profileRow: null };

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
    explicitLang || profileRow?.lang || profileRow?.language || profileRow?.locale || profileRow?.preferred_language || profileRow?.preferredLanguage,
  ) || 'ar';

  return { recipient, lang: inferredLang, profileRow };
}

// ─── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { type, to, data } = await req.json();

    if (type === 'supplier_signup_bundle') {
      if (!data?.email) return new Response(JSON.stringify({ error: 'Missing supplier email' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
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
      if (!data?.emailId) return new Response(JSON.stringify({ error: 'Missing emailId' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      const inspectRes = await fetch(`https://api.resend.com/emails/${data.emailId}`, { headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` } });
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