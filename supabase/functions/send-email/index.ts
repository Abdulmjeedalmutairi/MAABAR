import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const SUPABASE_URL = Deno.env.get('APP_SUPABASE_URL') || 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') || '';
const ADMIN_EMAIL = 'mjeedalmutairis@gmail.com';
const FROM = 'Maabar <hello@maabar.io>';
const adminSb = SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function wrap(content) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;color:#1a1a1a}
.w{max-width:560px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.hd{background:#0a0a0a;padding:28px 32px;text-align:center}
.ht{color:#fff;font-size:20px;font-weight:700;letter-spacing:3px}
.hs{color:rgba(255,255,255,.4);font-size:12px;margin-top:4px}
.bd{padding:32px}
.gr{font-size:22px;font-weight:700;margin-bottom:8px;color:#0a0a0a}
.tg{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:24px}
.ib{background:#f8f8f8;border-radius:6px;padding:20px;margin:20px 0}
.il{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#999;margin-bottom:14px}
.ir{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #efefef;font-size:14px}
.ir:last-child{border-bottom:none}
.ik{color:#888}.iv{color:#111;font-weight:500}
.bw{text-align:center;margin:28px 0 8px}
.bt{display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:600}
.ft{background:#f8f8f8;padding:20px 32px;border-top:1px solid #efefef;text-align:center}
.fb{font-size:13px;font-weight:700;letter-spacing:2px;color:#0a0a0a}
.fl{font-size:12px;color:#888;margin-top:6px}
.fl a{color:#555;text-decoration:none}
p{line-height:1.8;margin:12px 0}
</style>
</head>
<body>
<div class="w">
<div class="hd"><div class="ht">MAABAR</div><div class="hs">معبر | Maabar</div></div>
${content}
<div class="ft"><div class="fb">MAABAR</div><div class="fl"><a href="https://maabar.io">maabar.io</a> &nbsp;·&nbsp; <a href="mailto:hello@maabar.io">hello@maabar.io</a></div></div>
</div>
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

  supplier_approved: (d) => ({
    subject: 'تم قبول طلبك في مَعبر 🎉',
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Supplier Approved</p>
<p style="font-size:15px;color:#333">تمت الموافقة على طلب انضمامك كمورد في منصة <strong>مَعبر</strong>. يمكنك الآن تسجيل الدخول والبدء في استقبال طلبات التجار السعوديين.</p>
<div class="bw"><a href="https://maabar.io/login/supplier" class="bt">ابدأ الآن ←</a></div>
</div>`),
  }),

  supplier_welcome: (d) => ({
    subject: 'طلبك وصلنا — مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Application Received</p>
<p style="font-size:15px;color:#333">استلمنا طلب تسجيلك كمورد. فريقنا سيراجع بياناتك خلال <strong>24 ساعة</strong> وسنرسل لك إيميلاً فور اتخاذ القرار.</p>
</div>`),
  }),

  trader_welcome: (d) => ({
    subject: 'أهلاً بك في مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Welcome to Maabar</p>
<p style="font-size:15px;color:#333">تم إنشاء حسابك بنجاح. يمكنك الآن رفع طلبات الاستيراد وتلقي عروض الأسعار مباشرة من الموردين الصينيين.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">ابدأ الآن ←</a></div>
</div>`),
  }),

  offer_accepted: (d) => ({
    subject: `تم قبول عرضك — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Offer Accepted</p>
<p style="font-size:15px;color:#333">تم قبول عرضك على طلب <strong>${d.requestTitle || ''}</strong>. انتقل للوحة التحكم لمتابعة الطلب وانتظار الدفع.</p>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">عرض الطلب ←</a></div>
</div>`),
  }),

  offer_rejected: (d) => ({
    subject: `تم اختيار عرض آخر — ${d.requestTitle || ''}`,
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Offer Not Selected</p>
<p style="font-size:15px;color:#333">نشكرك على مشاركتك. للأسف تم اختيار عرض آخر على طلب <strong>${d.requestTitle || ''}</strong>. استمر في تقديم عروضك على الطلبات الجديدة.</p>
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
<p style="font-size:15px;color:#333;margin-top:16px">ابدأ التجهيز الآن وأضف رقم التتبع عند الشحن.</p>
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
<p style="font-size:15px;color:#333">لديك رسالة جديدة من <strong>${d.senderName || '-'}</strong> على منصة مَعبر.</p>
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
<p style="font-size:15px;color:#333">قام تاجر بطلب عينة من منتجك. راجع الطلب من لوحة المورد.</p>
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
<p style="font-size:15px;color:#333">وافق المورد على طلب العينة. يمكنك الآن متابعة التفاصيل مع المورد داخل المحادثة.</p>
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
<p style="font-size:15px;color:#333">قام المورد برفض طلب العينة. يمكنك التواصل معه داخل مَعبر لمعرفة البدائل.</p>
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
<p style="font-size:15px;color:#333;margin-top:16px">تم استلام دفعتك بنجاح. المورد سيبدأ التجهيز وسنعلمك عند شحن طلبك.</p>
<div class="bw"><a href="https://maabar.io/dashboard?tab=requests" class="bt">متابعة الطلب ←</a></div>
</div>`),
  }),

  supplier_rejected: (d) => ({
    subject: 'بخصوص طلب انضمامك في مَعبر',
    html: wrap(`
<div class="bd">
<p class="gr">أهلاً ${d.name || ''}،</p>
<p class="tg">Application Status</p>
<p style="font-size:15px;color:#333">نشكرك على اهتمامك بالانضمام لمنصة مَعبر. للأسف، لم نتمكن من قبول طلبك في الوقت الحالي. للاستفسار تواصل معنا على <a href="mailto:hello@maabar.io" style="color:#555">hello@maabar.io</a></p>
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
<p style="font-size:15px;color:#333">أكّد التاجر استلام الشحنة. سيتم تحويل مبلغك خلال <strong>24 ساعة</strong> عبر طريقة الدفع المسجلة.</p>
<div class="ib">
<div class="ir"><span class="ik">المبلغ</span><span class="iv">${d.amount || '-'} SAR</span></div>
</div>
<div class="bw"><a href="https://maabar.io/dashboard" class="bt">عرض لوحة التحكم ←</a></div>
</div>`),
  }),
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
