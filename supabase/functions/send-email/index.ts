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
      ar: { subject: 'تم استلام طلب انضمام المورد — مَعبر', eyebrow: 'Application Received', title: `أهلاً ${d.name || ''}،`, body: 'استلمنا طلب انضمامك كمورد مع بيانات شركتك الأساسية. بعد تأكيد البريد الإلكتروني، ستدخل مباشرة إلى لوحة المورد لإكمال التحقق، ثم يراجع فريق مَعبر الطلب بعد إرسال التحقق.', confirmCta: 'تأكيد البريد والمتابعة ←' },
      en: { subject: 'Your supplier application was received — Maabar', eyebrow: 'Application Received', title: `Hello ${d.name || ''},`, body: 'We received your supplier application and basic company details. After email confirmation, you will enter the supplier dashboard to complete verification, and the Maabar team will review the account after verification is submitted.', confirmCta: 'Confirm Email & Continue →' },
      zh: { subject: '我们已收到您的供应商申请 — Maabar', eyebrow: 'Application Received', title: `${d.name || ''}，您好`, body: '我们已收到您的供应商申请和基础公司资料。完成邮箱确认后，您会进入供应商控制台继续完成认证；提交认证后，Maabar 团队会开始审核该账户。', confirmCta: '确认邮箱并继续 →' },
    } as any)[lang] || { subject: 'تم استلام طلب انضمام المورد — مَعبر', eyebrow: 'Application Received', title: `أهلاً ${d.name || ''}،`, body: 'استلمنا طلب انضمامك.', confirmCta: 'Confirm Email & Continue →' };
    const hasConfirmUrl = d.confirmationUrl && d.confirmationUrl !== '#';
    return ({ subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
${hasConfirmUrl ? `<div class="bw"><a href="${d.confirmationUrl}" class="bt">${t.confirmCta}</a></div>` : ''}
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0;">${t.body}</p>
</div>`, { lang }) });
  },

  supplier_confirmation: async (d) => {
    if (!adminSb) throw new Error('No admin client');
    
    const { data: linkData, error } = await adminSb.auth.admin.generateLink({
      type: 'magiclink',
      email: d.email,
      options: { redirectTo: 'https://maabar.io/auth/callback' },
    });
    
    if (error) throw error;
    
    const confirmUrl = linkData?.properties?.action_link || '#';
    const lang = d.lang || 'ar';
    const t = ({
      ar: { 
        subject: 'تأكيد بريدك الإلكتروني — مَعبر', 
        eyebrow: 'Email Confirmation', 
        title: `أهلاً ${d.name || ''}،`, 
        body: 'يرجى تأكيد بريدك الإلكتروني لتفعيل حساب المورد الخاص بك على منصة مَعبر.', 
        confirmCta: 'تفعيل الحساب ←' 
      },
      en: { 
        subject: 'Confirm your email — Maabar', 
        eyebrow: 'Email Confirmation', 
        title: `Hello ${d.name || ''},`, 
        body: 'Please confirm your email address to activate your supplier account on Maabar.', 
        confirmCta: 'Activate Account →' 
      },
      zh: { 
        subject: '确认您的邮箱 — Maabar', 
        eyebrow: '邮箱确认', 
        title: `${d.name || ''}，您好`, 
        body: '请确认您的邮箱地址以激活您在 Maabar 的供应商账户。', 
        confirmCta: '激活账户 →' 
      },
    } as any)[lang] || { 
      subject: 'Confirm your email — Maabar', 
      eyebrow: 'Email Confirmation', 
      title: `Hello ${d.name || ''},`, 
      body: 'Please confirm your email address to activate your supplier account on Maabar.', 
      confirmCta: 'Activate Account →' 
    };
    
    const hasConfirmUrl = confirmUrl && confirmUrl !== '#';
    console.log('[supplier_confirmation] hasConfirmUrl:', hasConfirmUrl, 'lang:', lang);
    const html = wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
${hasConfirmUrl ? `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
 <tr>
 <td align="center" style="padding: 24px 0;">
 <a href="${confirmUrl}" 
 style="display:inline-block;padding:14px 32px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;font-family:sans-serif;border-radius:6px;">
 ${t.confirmCta}
 </a>
 </td>
 </tr>
</table>` : ''}
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0;">${t.body}</p>
</div>`, { lang });
    
    // Ensure html is a non-empty string
    if (!html || typeof html !== 'string') {
      console.error('Generated html is invalid:', html);
      throw new Error('Failed to generate email HTML');
    }
    
    const result = { 
      subject: t.subject, 
      html
    };
    console.log('[supplier_confirmation] returning:', JSON.stringify({ subject: result.subject, htmlLength: result.html?.length, htmlDefined: !!result.html }));
    return result;
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

  // ── Supplier-bound: ZH · EN ─────────────────────────────────────────────────

  offer_accepted: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: `您的报价已被接受 — ${d.requestTitle || ''}`, eyebrow: 'Offer Accepted', title: '您的报价已被接受', body: `买方已接受您对「${d.requestTitle || ''}」的报价，付款即将到账。请登录查看订单详情。`, cta: '查看订单 →' },
      en: { subject: `Your offer was accepted — ${d.requestTitle || ''}`, eyebrow: 'Offer Accepted', title: 'Your offer was accepted', body: `Your offer on "${d.requestTitle || ''}" has been accepted. The buyer will process payment shortly. Log in to track the order.`, cta: 'View order →' },
    } as any)[lang] || { subject: `Your offer was accepted — ${d.requestTitle || ''}`, eyebrow: 'Offer Accepted', title: 'Your offer was accepted', body: `Your offer on "${d.requestTitle || ''}" has been accepted.`, cta: 'View order →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  offer_rejected: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: `该需求已选择其他供应商 — ${d.requestTitle || ''}`, eyebrow: 'Offer Not Selected', title: '已选择其他供应商', body: `感谢您对「${d.requestTitle || ''}」的报价，买方本次选择了其他供应商。请继续参与更多采购需求。`, cta: '浏览需求 →' },
      en: { subject: `Another offer was selected — ${d.requestTitle || ''}`, eyebrow: 'Offer Not Selected', title: 'Another offer was selected', body: `Thank you for your offer on "${d.requestTitle || ''}". The buyer selected another supplier this time. Keep submitting offers on new requests.`, cta: 'Browse requests →' },
    } as any)[lang] || { subject: `Another offer was selected — ${d.requestTitle || ''}`, eyebrow: 'Offer Not Selected', title: 'Another offer was selected', body: `The buyer selected another supplier for "${d.requestTitle || ''}".`, cta: 'Browse requests →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  payment_received_supplier: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: `已收到付款 — ${d.requestTitle || ''}`, eyebrow: 'Payment Received', title: '已收到付款，请开始生产', body: `「${d.requestTitle || ''}」的 ${d.amount || '-'} USD 付款已确认，请立即开始生产并在发货时添加跟踪号。`, cta: '跟进订单 →' },
      en: { subject: `Payment received — ${d.requestTitle || ''}`, eyebrow: 'Payment Received', title: 'Payment confirmed — begin production', body: `Payment of ${d.amount || '-'} USD for "${d.requestTitle || ''}" has been confirmed. Please begin production and add a tracking number when you ship.`, cta: 'Track order →' },
    } as any)[lang] || { subject: `Payment received — ${d.requestTitle || ''}`, eyebrow: 'Payment Received', title: 'Payment confirmed', body: `Payment for "${d.requestTitle || ''}" confirmed. Begin production.`, cta: 'Track order →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  new_sample: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: `新样品申请 — ${d.productName || ''}`, eyebrow: 'New Sample Request', title: '收到新样品申请', body: `买方申请了 ${d.quantity || '-'} 件「${d.productName || ''}」样品，预估总价：${d.totalPrice || '-'} SAR。请登录审核申请。`, cta: '审核申请 →' },
      en: { subject: `New sample request — ${d.productName || ''}`, eyebrow: 'New Sample Request', title: 'You received a sample request', body: `A buyer requested ${d.quantity || '-'} sample(s) of "${d.productName || ''}". Estimated total: ${d.totalPrice || '-'} SAR. Log in to review.`, cta: 'Review request →' },
    } as any)[lang] || { subject: `New sample request — ${d.productName || ''}`, eyebrow: 'New Sample Request', title: 'New sample request', body: `Sample request for "${d.productName || ''}".`, cta: 'Review request →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  // ── Buyer-bound: AR · EN ─────────────────────────────────────────────────────

  new_offer: (d) => {
    const lang = d.lang || 'ar';
    const shippingVal = d.shippingCost === null || d.shippingCost === undefined || d.shippingCost === ''
      ? (lang === 'ar' ? 'مشمول أو غير محدد' : 'Included or unspecified')
      : `${d.shippingCost} USD`;
    const t = ({
      ar: { subject: `عرض سعر جديد على طلبك — ${d.requestTitle || ''}`, eyebrow: 'New Offer Received', title: 'وصلك عرض جديد', reqLabel: 'الطلب', supplierLabel: 'المورد', priceLabel: 'سعر الوحدة', shippingLabel: 'الشحن', totalLabel: 'الإجمالي التقديري', deliveryLabel: 'مدة التسليم', dayUnit: 'يوم', cta: 'مراجعة العرض ←' },
      en: { subject: `New offer on your request — ${d.requestTitle || ''}`, eyebrow: 'New Offer Received', title: 'You received a new offer', reqLabel: 'Request', supplierLabel: 'Supplier', priceLabel: 'Unit price', shippingLabel: 'Shipping', totalLabel: 'Est. total', deliveryLabel: 'Delivery', dayUnit: 'days', cta: 'Review offer →' },
    } as any)[lang] || { subject: `New offer — ${d.requestTitle || ''}`, eyebrow: 'New Offer Received', title: 'New offer received', reqLabel: 'Request', supplierLabel: 'Supplier', priceLabel: 'Price', shippingLabel: 'Shipping', totalLabel: 'Total', deliveryLabel: 'Delivery', dayUnit: 'days', cta: 'Review offer →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<div class="ib">
<div class="ir"><span class="ik">${t.reqLabel}</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">${t.supplierLabel}</span><span class="iv">${d.supplierName || '-'}</span></div>
<div class="ir"><span class="ik">${t.priceLabel}</span><span class="iv">${d.price || '-'} USD</span></div>
<div class="ir"><span class="ik">${t.shippingLabel}</span><span class="iv">${shippingVal}</span></div>
<div class="ir"><span class="ik">${t.totalLabel}</span><span class="iv">${d.estimatedTotal || d.price || '-'} USD</span></div>
<div class="ir"><span class="ik">${t.deliveryLabel}</span><span class="iv">${d.deliveryDays || '-'} ${t.dayUnit}</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  // ── Dual-recipient: AR · EN · ZH (handler resolves role) ────────────────────

  new_message: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: `رسالة جديدة من ${d.senderName || 'Maabar'}`, eyebrow: 'New Message', title: 'لديك رسالة جديدة', senderLabel: 'المرسل', previewLabel: 'المعاينة', cta: 'فتح المحادثة ←' },
      en: { subject: `New message from ${d.senderName || 'Maabar'}`, eyebrow: 'New Message', title: 'You have a new message', senderLabel: 'From', previewLabel: 'Preview', cta: 'Open chat →' },
      zh: { subject: `${d.senderName || 'Maabar'} 发来新消息`, eyebrow: 'New Message', title: '您有一条新消息', senderLabel: '发件人', previewLabel: '预览', cta: '打开对话 →' },
    } as any)[lang] || { subject: `New message from ${d.senderName || 'Maabar'}`, eyebrow: 'New Message', title: 'New message', senderLabel: 'From', previewLabel: 'Preview', cta: 'Open chat →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<div class="ib">
<div class="ir"><span class="ik">${t.senderLabel}</span><span class="iv">${d.senderName || '-'}</span></div>
<div class="ir"><span class="ik">${t.previewLabel}</span><span class="iv">${d.preview || '-'}</span></div>
</div>
<div class="bw"><a href="https://maabar.io/chat/${d.senderId || ''}" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  // ── Buyer-bound (continued): AR · EN ────────────────────────────────────────

  sample_approved: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: `تمت الموافقة على طلب العينة — ${d.productName || ''}`, eyebrow: 'Sample Approved', title: 'تمت الموافقة على طلب العينة', body: `وافق المورد على طلب العينة لمنتج «${d.productName || ''}». تواصل معه عبر المحادثة لترتيب التفاصيل.`, cta: 'عرض طلبات العينات ←' },
      en: { subject: `Sample request approved — ${d.productName || ''}`, eyebrow: 'Sample Approved', title: 'Your sample request was approved', body: `The supplier approved your sample request for "${d.productName || ''}". Contact them via chat to arrange the details.`, cta: 'View sample requests →' },
    } as any)[lang] || { subject: `Sample approved — ${d.productName || ''}`, eyebrow: 'Sample Approved', title: 'Sample approved', body: `Your sample request for "${d.productName || ''}" was approved.`, cta: 'View sample requests →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  sample_rejected: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: `تم رفض طلب العينة — ${d.productName || ''}`, eyebrow: 'Sample Declined', title: 'تم رفض طلب العينة', body: `رفض المورد طلب العينة لمنتج «${d.productName || ''}». تواصل معه عبر المحادثة لمعرفة البدائل.`, cta: 'عرض طلبات العينات ←' },
      en: { subject: `Sample request declined — ${d.productName || ''}`, eyebrow: 'Sample Declined', title: 'Your sample request was declined', body: `The supplier declined your sample request for "${d.productName || ''}". Contact them via chat for alternatives.`, cta: 'View sample requests →' },
    } as any)[lang] || { subject: `Sample declined — ${d.productName || ''}`, eyebrow: 'Sample Declined', title: 'Sample declined', body: `Your sample request for "${d.productName || ''}" was declined.`, cta: 'View sample requests →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=samples" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  payment_confirmation_buyer: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: `تأكيد الدفع — ${d.requestTitle || ''}`, eyebrow: 'Payment Confirmed', title: 'تم استلام دفعتك', reqLabel: 'الطلب', amountLabel: 'المبلغ المدفوع', body: 'تم استلام دفعتك بنجاح. المورد سيبدأ التجهيز وسنعلمك عند شحن طلبك.', cta: 'متابعة الطلب ←' },
      en: { subject: `Payment confirmed — ${d.requestTitle || ''}`, eyebrow: 'Payment Confirmed', title: 'Your payment was received', reqLabel: 'Request', amountLabel: 'Amount paid', body: 'Your payment has been received. The supplier will begin production shortly and you will be notified when your order ships.', cta: 'Track order →' },
    } as any)[lang] || { subject: `Payment confirmed — ${d.requestTitle || ''}`, eyebrow: 'Payment Confirmed', title: 'Payment confirmed', reqLabel: 'Request', amountLabel: 'Amount', body: 'Your payment has been received.', cta: 'Track order →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<div class="ib">
<div class="ir"><span class="ik">${t.reqLabel}</span><span class="iv">${d.requestTitle || '-'}</span></div>
<div class="ir"><span class="ik">${t.amountLabel}</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  supplier_rejected: (d) => ({
    subject: 'بخصوص طلب انضمامك في مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">Application Status</p>
<p class="tg">أهلاً ${d.name || ''}،</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0;">نشكرك على اهتمامك بالانضمام لمنصة مَعبر. للأسف، لم نتمكن من قبول طلبك في الوقت الحالي. للاستفسار تواصل معنا على <a href="mailto:hello@maabar.io" style="color:rgba(0,0,0,0.55);">hello@maabar.io</a></p>
</div>`),
  }),

  shipment_tracking: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: `طلبك في الطريق — ${d.trackingNumber || ''}`, eyebrow: 'Shipment Dispatched', title: 'طلبك في الطريق', carrierLabel: 'شركة الشحن', trackingLabel: 'رقم التتبع', cta: 'متابعة الطلب ←' },
      en: { subject: `Your order has shipped — ${d.trackingNumber || ''}`, eyebrow: 'Shipment Dispatched', title: 'Your order is on the way', carrierLabel: 'Carrier', trackingLabel: 'Tracking number', cta: 'Track order →' },
    } as any)[lang] || { subject: `Shipped — ${d.trackingNumber || ''}`, eyebrow: 'Shipment Dispatched', title: 'Order shipped', carrierLabel: 'Carrier', trackingLabel: 'Tracking', cta: 'Track order →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<div class="ib">
<div class="ir"><span class="ik">${t.carrierLabel}</span><span class="iv">${d.shippingCompany || '-'}</span></div>
<div class="ir"><span class="ik">${t.trackingLabel}</span><span class="iv">${d.trackingNumber || '-'}</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  payout_initiated: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: '收货已确认 — 款项即将转账', eyebrow: 'Payout Initiated', title: '款项即将转账', body: `买方已确认收货，您的 ${d.amount || '-'} SAR 款项将在 24 小时内通过已登记的付款方式转账。`, cta: '查看控制台 →' },
      en: { subject: 'Delivery confirmed — payout on the way', eyebrow: 'Payout Initiated', title: 'Your payout is on the way', body: `The buyer confirmed delivery. Your payout of ${d.amount || '-'} SAR will be transferred within 24 hours via your registered payment method.`, cta: 'View dashboard →' },
    } as any)[lang] || { subject: 'Payout initiated', eyebrow: 'Payout Initiated', title: 'Payout on the way', body: `Your payout of ${d.amount || '-'} SAR will be transferred within 24 hours.`, cta: 'View dashboard →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

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

  supplier_verification_submitted: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: {
        subject: 'استلمنا طلب التحقق — مَعبر',
        eyebrow: 'Verification Received',
        title: `أهلاً ${d.name || ''}،`,
        body: 'استلمنا طلب التحقق التجاري الخاص بك. سيراجع فريق مَعبر بياناتك ويردّ عليك خلال 24 إلى 72 ساعة.',
        cta: 'عرض حالة الحساب ←',
      },
      en: {
        subject: 'Verification request received — Maabar',
        eyebrow: 'Verification Received',
        title: `Hello ${d.name || ''},`,
        body: 'We received your business verification request. The Maabar team will review your details and respond within 24 to 72 hours.',
        cta: 'View account status →',
      },
      zh: {
        subject: '我们已收到您的认证申请 — Maabar',
        eyebrow: 'Verification Received',
        title: `${d.name || ''}，您好`,
        body: '我们已收到您的企业认证申请，Maabar 团队将在 24 至 72 小时内审核您的资料并回复。',
        cta: '查看账户状态 →',
      },
    } as any)[lang] || { subject: 'Verification request received — Maabar', eyebrow: 'Verification Received', title: `Hello ${d.name || ''},`, body: 'We received your verification request and will respond within 24–72 hours.', cta: 'View account status →' };
    return ({
      subject: t.subject,
      html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 24px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=verification" class="bt">${t.cta}</a></div>
</div>`, { lang }),
    });
  },

  admin_supplier_verification: (d) => ({
    subject: `طلب تحقق مورد — ${d.companyName || d.email || ''}`,
    to: ADMIN_EMAIL,
    html: wrap(`
<div class="bd">
<p class="gr">Supplier Verification Request</p>
<p class="tg">طلب تحقق جديد يحتاج مراجعة</p>
<div class="ib">
<p class="il">بيانات المورد</p>
<div class="ir"><span class="ik">اسم الشركة</span><span class="iv">${d.companyName || '-'}</span></div>
<div class="ir"><span class="ik">الإيميل</span><span class="iv">${d.email || '-'}</span></div>
<div class="ir"><span class="ik">الدولة / المدينة</span><span class="iv">${[d.country, d.city].filter(Boolean).join(' / ') || '-'}</span></div>
<div class="ir"><span class="ik">WhatsApp</span><span class="iv">${d.whatsapp || '-'}</span></div>
<div class="ir"><span class="ik">WeChat</span><span class="iv">${d.wechat || '-'}</span></div>
<div class="ir"><span class="ik">الرابط التجاري</span><span class="iv">${d.tradeLink || '-'}</span></div>
<div class="ir"><span class="ik">رقم السجل</span><span class="iv">${d.regNumber || '-'}</span></div>
<div class="ir"><span class="ik">سنوات الخبرة</span><span class="iv">${d.yearsExperience || '-'}</span></div>
<div class="ir"><span class="ik">رخصة الأعمال</span><span class="iv">${d.licensePhoto ? 'مرفوعة ✓' : 'غير مرفوعة'}</span></div>
<div class="ir"><span class="ik">صور المصنع</span><span class="iv">${d.factoryImagesCount || 0} صورة</span></div>
<div class="ir"><span class="ik">فيديوهات المصنع</span><span class="iv">${d.factoryVideosCount || 0} فيديو</span></div>
</div>
<div class="bw"><a href="https://maabar.io/admin-seed" class="bt">مراجعة المورد ←</a></div>
</div>`),
  }),

  // BUG 3 — No confirmation email to supplier after registration
  supplier_application_received: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      en: {
        subject: 'Maabar — Application Received | 申请已收到',
        eyebrow: 'Application Received',
        title: `Hello ${d.companyName || ''},`,
        body: 'We received your supplier application. The Maabar team will review your details and contact you within 24 hours.',
        cta: 'Login to Maabar →',
      },
      zh: {
        subject: 'Maabar — Application Received | 申请已收到',
        eyebrow: '申请已收到',
        title: `${d.companyName || ''}，您好`,
        body: '我们已收到您的供应商申请。Maabar 团队将在 24 小时内审核您的资料并与您联系。',
        cta: '登录 Maabar →',
      },
    } as any)[lang] || {
      subject: 'Maabar — Application Received | 申请已收到',
      eyebrow: 'Application Received',
      title: `Hello ${d.companyName || ''},`,
      body: 'We received your supplier application. The Maabar team will review your details and contact you within 24 hours.',
      cta: 'Login to Maabar →',
    };
    return {
      subject: t.subject,
      html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 24px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io" class="bt">${t.cta}</a></div>
</div>`, { lang }),
    };
  },

  // ── Previously missing templates ─────────────────────────────────────────────

  product_inquiry: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: `新产品询价 — ${d.productName || ''}`, eyebrow: 'New Product Inquiry', title: '收到新产品询价', body: `买方提交了关于「${d.productName || ''}」的询价，请登录查看并回复。`, cta: '查看询价 →' },
      en: { subject: `New product inquiry — ${d.productName || ''}`, eyebrow: 'New Product Inquiry', title: 'You received a product inquiry', body: `A buyer submitted an inquiry about "${d.productName || ''}". Log in to view and respond.`, cta: 'View inquiry →' },
    } as any)[lang] || { subject: `New inquiry — ${d.productName || ''}`, eyebrow: 'New Product Inquiry', title: 'New inquiry', body: `Inquiry received for "${d.productName || ''}".`, cta: 'View inquiry →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=product-inquiries" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  product_inquiry_reply: (d) => {
    const lang = d.lang || 'ar';
    const t = ({
      ar: { subject: `رد على استفسارك — ${d.productName || ''}`, eyebrow: 'Inquiry Reply', title: 'المورد رد على استفسارك', body: `ردّ المورد على استفسارك حول «${d.productName || ''}». سجّل دخولك لعرض الرد الكامل.`, cta: 'عرض الرد ←' },
      en: { subject: `Reply to your inquiry — ${d.productName || ''}`, eyebrow: 'Inquiry Reply', title: 'The supplier replied to your inquiry', body: `The supplier replied to your inquiry about "${d.productName || ''}". Log in to view the full reply.`, cta: 'View reply →' },
    } as any)[lang] || { subject: `Inquiry reply — ${d.productName || ''}`, eyebrow: 'Inquiry Reply', title: 'Supplier replied', body: `Reply received for "${d.productName || ''}".`, cta: 'View reply →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=product-inquiries" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },

  supplier_more_info_required: (d) => {
    const lang = d.lang || 'en';
    const t = ({
      zh: { subject: '需要补充资料 — Maabar 供应商申请', eyebrow: 'Action Required', title: '您的申请需要补充资料', body: '我们需要更多信息来处理您的供应商申请。请登录供应商控制台，完成所需资料后重新提交。', cta: '前往控制台 →' },
      en: { subject: 'Action required — Maabar supplier application', eyebrow: 'Action Required', title: 'We need a few more details', body: 'We need additional information to process your supplier application. Please log in to your dashboard and complete the required details.', cta: 'Go to dashboard →' },
    } as any)[lang] || { subject: 'Action required — Maabar supplier application', eyebrow: 'Action Required', title: 'Additional details needed', body: 'Please log in and complete the required information.', cta: 'Go to dashboard →' };
    return { subject: t.subject, html: wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0 0 20px;">${t.body}</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=verification" class="bt">${t.cta}</a></div>
</div>`, { lang }) };
  },
};

// ─── Send helper ─────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  console.log('[sendEmail] body:', JSON.stringify({ to, subject, htmlLength: html?.length, htmlDefined: !!html }));
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

// Supplier emails: ZH or EN only — never Arabic
function toSupplierLang(lang: string): string {
  return lang === 'zh' ? 'zh' : 'en';
}

// Buyer emails: AR or EN only — never Chinese
function toBuyerLang(lang: string): string {
  return lang === 'ar' ? 'ar' : 'en';
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

// ─── Supabase Auth Email Hook ───────────────────────────────────────────────
const HOOK_SECRET_RAW = Deno.env.get('SEND_EMAIL_HOOK_SECRET') || '';

async function handleSupabaseAuthHook(body: any, authHeader: string | null, headers: Headers) {
  // Check if this is a Supabase Auth Hook (identified by User-Agent)
  const userAgent = headers.get('user-agent') || '';
  const isSupabaseHook = userAgent.includes('Go-http-client');
  
  console.log('[hook] User-Agent:', userAgent);
  console.log('[hook] Is Supabase hook?', isSupabaseHook);
  
  if (!isSupabaseHook) {
    // Only verify auth for non-hook requests (e.g., direct API calls)
    console.log('[hook] Non-hook request, verifying Authorization header');
    if (!authHeader || authHeader !== HOOK_SECRET_RAW) {
      console.error('[hook] Unauthorized non-hook request');
      throw new Error('Unauthorized');
    }
    console.log('[hook] Non-hook request authorized');
  } else {
    // Supabase hook request - allow through directly
    console.log('[hook] Supabase hook request accepted (no auth verification)');
  }

  const { user, email_data, event } = body;
  if (!user || !email_data) {
    throw new Error('Missing user or email_data in hook payload');
  }

  const email = user.email;
  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  const rawLang = normalizeLang(user.user_metadata?.lang || '') || (userRole === 'supplier' ? 'en' : 'ar');
  const lang = userRole === 'supplier' ? toSupplierLang(rawLang) : toBuyerLang(rawLang);
  const name = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const token = email_data.token_hash;
  const redirectTo = email_data.redirect_to || 'https://maabar.io/auth/callback';

  if (!email || !token) {
    throw new Error('Missing email or token in hook payload');
  }

  // Build confirmation URL (Supabase Auth verification endpoint)
  const baseUrl = SUPABASE_URL.endsWith('/') ? SUPABASE_URL.slice(0, -1) : SUPABASE_URL;
  const confirmUrl = `${baseUrl}/auth/v1/verify?token=${token}&type=signup&redirect_to=${encodeURIComponent(redirectTo)}`;

  console.log('[hook] Processing confirmation for:', email, 'lang:', lang, 'confirmUrl length:', confirmUrl.length);

  const t = ({
    ar: { 
      subject: 'تأكيد بريدك الإلكتروني — مَعبر', 
      eyebrow: 'Email Confirmation', 
      title: `أهلاً ${name || ''}،`, 
      body: 'يرجى تأكيد بريدك الإلكتروني لتفعيل حساب المورد الخاص بك على منصة مَعبر.', 
      confirmCta: 'تفعيل الحساب ←' 
    },
    en: { 
      subject: 'Confirm your email — Maabar', 
      eyebrow: 'Email Confirmation', 
      title: `Hello ${name || ''},`, 
      body: 'Please confirm your email address to activate your supplier account on Maabar.', 
      confirmCta: 'Activate Account →' 
    },
    zh: { 
      subject: '确认您的邮箱 — Maabar', 
      eyebrow: '邮箱确认', 
      title: `${name || ''}，您好`, 
      body: '请确认您的邮箱地址以激活您在 Maabar 的供应商账户。', 
      confirmCta: '激活账户 →' 
    },
  } as any)[lang] || { 
    subject: 'Confirm your email — Maabar', 
    eyebrow: 'Email Confirmation', 
    title: `Hello ${name || ''},`, 
    body: 'Please confirm your email address to activate your supplier account on Maabar.', 
    confirmCta: 'Activate Account →' 
  };

  const hasConfirmUrl = confirmUrl && confirmUrl !== '#';
  const html = wrap(`
<div class="bd">
<p class="gr">${t.eyebrow}</p>
<p class="tg">${t.title}</p>
${hasConfirmUrl ? `
<table width="100%" cellpadding="0" cellspacing="0" border="0">
 <tr>
 <td align="center" style="padding: 24px 0;">
 <a href="${confirmUrl}" 
 style="display:inline-block;padding:14px 32px;background:#1a1a1a;color:#ffffff;text-decoration:none;font-size:15px;font-family:sans-serif;border-radius:6px;">
 ${t.confirmCta}
 </a>
 </td>
 </tr>
</table>` : ''}
<p style="font-size:14px;line-height:1.8;color:rgba(0,0,0,0.55);margin:0;">${t.body}</p>
</div>`, { lang });

  await sendEmail(email, t.subject, html);
  return {};
}

// ─── Handler ─────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');

    // Check if this is a Supabase Auth email hook
    if (body.user && body.email_data) {
      console.log('[hook] Received Supabase Auth hook');
      const result = await handleSupabaseAuthHook(body, authHeader, req.headers);
      return new Response(JSON.stringify(result), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // Legacy send-email API
    const { type, to, data } = body;

    if (type === 'supplier_signup_bundle') {
      if (!data?.email) return new Response(JSON.stringify({ error: 'Missing supplier email' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
      const welcomeTpl = await templates.supplier_welcome(data || {});
      const welcomeResult = await sendEmail(data.email, welcomeTpl.subject, welcomeTpl.html);
      let adminResult = null;
      if (data?.sendAdmin === true) {
        const adminTpl = await templates.admin_new_supplier(data || {});
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
    const rawLang = normalizeLang(data?.lang || data?.language || emailContext.lang) || 'ar';
    const recipientRole = emailContext.profileRow?.role || '';
    const resolvedLang = recipientRole === 'supplier' ? toSupplierLang(rawLang)
                       : recipientRole === 'buyer'    ? toBuyerLang(rawLang)
                       : rawLang;
    const payload = {
      ...(data || {}),
      lang: resolvedLang,
      maabarSupplierId: data?.maabarSupplierId || emailContext.profileRow?.maabar_supplier_id || '',
    };
    const tpl = await factory(payload);
    console.log('[handler] tpl:', JSON.stringify({ subject: tpl.subject, htmlLength: tpl.html?.length, htmlDefined: !!tpl.html }));
    const recipient = tpl.to || emailContext.recipient;
    if (!recipient) return new Response(JSON.stringify({ error: 'No recipient' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
    const result = await sendEmail(recipient, tpl.subject, tpl.html);
    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});