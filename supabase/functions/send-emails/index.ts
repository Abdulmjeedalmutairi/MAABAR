import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const RESEND_API_KEY             = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL               = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANTHROPIC_API_KEY          = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const ADMIN_EMAIL                = 'info@maabar.io';
const FROM                       = 'مَعبر | MAABAR <hello@maabar.io>';

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('Resend error:', err);
  }
}

// ─── Email templates ────────────────────────────────────────────────────────

function traderWelcomeHtml(name: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #0a0a0b; padding: 32px 40px; text-align: center; }
  .logo { color: #fff; font-size: 20px; letter-spacing: 4px; font-weight: 600; font-family: sans-serif; }
  .body { padding: 40px; color: #333; }
  .body h2 { font-size: 22px; color: #0a0a0b; margin-bottom: 12px; }
  .body p { font-size: 15px; line-height: 1.8; color: #555; margin-bottom: 12px; }
  .cta { display: inline-block; margin-top: 20px; padding: 14px 32px; background: #0a0a0b; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500; }
  .footer { text-align: center; padding: 20px 40px; font-size: 12px; color: #aaa; background: #fafafa; border-top: 1px solid #eee; }
</style></head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">MAABAR | مَعبر</div></div>
  <div class="body">
    <h2>أهلاً بك يا ${name}! 🎉</h2>
    <p>يسعدنا انضمامك إلى منصة <strong>مَعبر</strong> — الجسر الذي يربط التجار السعوديين بالموردين الصينيين الموثوقين.</p>
    <p>يمكنك الآن نشر طلبات التوريد وتلقّي عروض تنافسية من موردين معتمدين.</p>
    <a href="https://maabar.io/requests" class="cta">ابدأ طلبك الأول</a>
  </div>
  <div class="footer">Maabar · maabar.io · support@maabar.io</div>
</div>
</body></html>`;
}

function supplierWelcomeHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f7f7f7; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header { background: #0a0a0b; padding: 32px 40px; text-align: center; }
  .logo { color: #fff; font-size: 20px; letter-spacing: 4px; font-weight: 600; font-family: sans-serif; }
  .body { padding: 40px; color: #333; }
  .body h2 { font-size: 22px; color: #0a0a0b; margin-bottom: 12px; }
  .body p { font-size: 15px; line-height: 1.8; color: #555; margin-bottom: 12px; }
  .note { background: #f5f5f5; border-left: 3px solid #ccc; padding: 14px 18px; border-radius: 4px; font-size: 14px; color: #666; }
  .footer { text-align: center; padding: 20px 40px; font-size: 12px; color: #aaa; background: #fafafa; border-top: 1px solid #eee; }
</style></head>
<body>
<div class="wrap">
  <div class="header"><div class="logo">MAABAR | مَعبر</div></div>
  <div class="body">
    <h2>Application Received — ${name}</h2>
    <p>Thank you for applying to join Maabar as a supplier. We have received your application and our team will review it shortly.</p>
    <div class="note">You will receive a decision within <strong>24 hours</strong>. Once approved, you can start listing products and receiving orders from Saudi traders.</div>
    <p style="margin-top:20px;">If you have any questions, contact us at <a href="mailto:support@maabar.io">support@maabar.io</a>.</p>
  </div>
  <div class="footer">Maabar · maabar.io · support@maabar.io</div>
</div>
</body></html>`;
}

async function adminAlertHtml(profile: Record<string, unknown>): Promise<string> {
  const summary = `
Company: ${profile.company_name || 'N/A'}
City: ${profile.city || 'N/A'}
Country: ${profile.country || 'N/A'}
Specialty: ${profile.speciality || 'N/A'}
WeChat: ${profile.wechat || 'N/A'}
WhatsApp: ${profile.whatsapp || 'N/A'}
Payment Method: ${profile.pay_method || 'N/A'}
Years Experience: ${profile.years_experience ?? 'N/A'}
Company Reg Number: ${profile.reg_number || 'N/A'}
Trade Link: ${profile.trade_link || 'N/A'}
Employees: ${profile.employees_count ?? 'N/A'}
Business License: ${profile.license_url ? 'Uploaded' : 'Not uploaded'}
Factory Photo: ${profile.factory_image_url ? 'Uploaded' : 'Not uploaded'}
  `.trim();

  let aiTable = '<p><em>AI analysis unavailable</em></p>';
  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a supplier verification assistant for Maabar, a B2B platform connecting Saudi traders with Chinese suppliers.

Analyze this new supplier application and respond ONLY with a JSON object (no markdown) with these exact fields:
- trust_score: number 0-10
- manufacturing_hub: "Yes" or "No" (is the city a known Chinese manufacturing hub?)
- details_consistent: "Yes" or "No"
- strengths: array of strings (max 3)
- red_flags: array of strings (max 3)
- recommendation: "Accept" or "Review" or "Reject"

Supplier data:
${summary}`,
      }],
    });
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const parsed = JSON.parse(text);
    aiTable = `
<h3>AI Verification Analysis</h3>
<table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px">
  <tr><td><b>Trust Score</b></td><td>${parsed.trust_score}/10</td></tr>
  <tr><td><b>Manufacturing Hub</b></td><td>${parsed.manufacturing_hub}</td></tr>
  <tr><td><b>Details Consistent</b></td><td>${parsed.details_consistent}</td></tr>
  <tr><td><b>Strengths</b></td><td>${(parsed.strengths || []).join('<br/>')}</td></tr>
  <tr><td><b>Red Flags</b></td><td>${(parsed.red_flags || []).join('<br/>') || 'None'}</td></tr>
  <tr><td><b>Recommendation</b></td><td><b>${parsed.recommendation}</b></td></tr>
</table>`;
  } catch (e) {
    console.error('AI analysis failed:', e);
  }

  return `
<h2>New Supplier Application — Maabar</h2>
<h3>Supplier Details</h3>
<pre style="background:#f5f5f5;padding:12px;font-size:13px">${summary}</pre>
${profile.license_url ? `<p><a href="${profile.license_url}">View Business License</a></p>` : ''}
${profile.factory_image_url ? `<p><a href="${profile.factory_image_url}">View Factory Photo</a></p>` : ''}
${aiTable}`;
}

function newOfferHtml(traderName: string, requestTitle: string, offerPrice: string, deliveryDays: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;"><tr><td style="background:#0a0a0b;padding:32px 40px;border-radius:10px 10px 0 0;text-align:center;"><div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff;">MAABAR</div><div style="font-size:11px;color:#444;letter-spacing:1px;margin-top:4px;">مَعبر</div></td></tr><tr><td style="background:#111113;padding:40px;border-left:1px solid #1c1c1c;border-right:1px solid #1c1c1c;"><p style="font-size:16px;color:#e2e2e2;margin:0 0 16px;line-height:1.8;">أهلاً ${traderName}،</p><p style="font-size:14px;color:#888;margin:0 0 16px;line-height:2;">قدّم مورد عرض سعر على طلبك <strong style="color:#e2e2e2;">${requestTitle}</strong>.</p><div style="background:#0f0f11;border:1px solid #1c1c1c;border-radius:8px;padding:16px 20px;margin-bottom:24px;"><p style="font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">تفاصيل العرض</p><p style="font-size:13px;color:#666;margin:0;line-height:2;">السعر: ${offerPrice} SAR<br>مدة التسليم: ${deliveryDays} يوم</p></div><table cellpadding="0" cellspacing="0"><tr><td style="background:#fff;border-radius:6px;padding:12px 28px;"><a href="https://maabar.io/dashboard" style="color:#0a0a0b;font-size:13px;font-weight:700;text-decoration:none;">راجع العرض ←</a></td></tr></table></td></tr><tr><td style="background:#111113;padding:24px 40px 32px;border-radius:0 0 10px 10px;border:1px solid #1c1c1c;"><table cellpadding="0" cellspacing="0"><tr><td style="border-right:1px solid #2a2a2a;padding-right:20px;"><div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:3px;">MAABAR</div><div style="font-size:10px;color:#444;margin-bottom:14px;">فريق معبر · Maabar Team</div><div style="font-size:11px;color:#666;margin-bottom:4px;">maabar.io</div><a href="mailto:hello@maabar.io" style="font-size:11px;color:#888;text-decoration:none;display:block;margin-bottom:4px;">hello@maabar.io</a><a href="https://wa.me/966504248942" style="font-size:11px;color:#888;text-decoration:none;">+966 50 424 8942</a></td><td style="padding-left:20px;vertical-align:bottom;"><div style="font-size:9px;color:#333;line-height:1.8;">Saudi × China<br>Bridge</div></td></tr></table></td></tr></table>`;
}

function offerAcceptedHtml(supplierName: string, requestTitle: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;"><tr><td style="background:#0a0a0b;padding:32px 40px;border-radius:10px 10px 0 0;text-align:center;"><div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff;">MAABAR</div><div style="font-size:11px;color:#444;letter-spacing:1px;margin-top:4px;">مَعبر</div></td></tr><tr><td style="background:#111113;padding:40px;border-left:1px solid #1c1c1c;border-right:1px solid #1c1c1c;"><p style="font-size:16px;color:#e2e2e2;margin:0 0 16px;line-height:1.8;">Hello ${supplierName},</p><p style="font-size:14px;color:#888;margin:0 0 16px;line-height:2;">A trader has accepted your offer on <strong style="color:#e2e2e2;">${requestTitle}</strong>.</p><div style="background:#0f0f11;border:1px solid #1c1c1c;border-radius:8px;padding:16px 20px;margin-bottom:24px;"><p style="font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Next Steps</p><p style="font-size:13px;color:#666;margin:0;line-height:2;">① Await payment confirmation<br>② Begin production<br>③ Add tracking number after shipment</p></div><table cellpadding="0" cellspacing="0"><tr><td style="background:#fff;border-radius:6px;padding:12px 28px;"><a href="https://maabar.io/dashboard" style="color:#0a0a0b;font-size:13px;font-weight:700;text-decoration:none;">View Order →</a></td></tr></table></td></tr><tr><td style="background:#111113;padding:24px 40px 32px;border-radius:0 0 10px 10px;border:1px solid #1c1c1c;"><table cellpadding="0" cellspacing="0"><tr><td style="border-right:1px solid #2a2a2a;padding-right:20px;"><div style="font-size:13px;font-weight:700;color:#fff;letter-spacing:3px;">MAABAR</div><div style="font-size:10px;color:#444;margin-bottom:14px;">فريق معبر · Maabar Team</div><div style="font-size:11px;color:#666;margin-bottom:4px;">maabar.io</div><a href="mailto:hello@maabar.io" style="font-size:11px;color:#888;text-decoration:none;display:block;margin-bottom:4px;">hello@maabar.io</a><a href="https://wa.me/966504248942" style="font-size:11px;color:#888;text-decoration:none;">+966 50 424 8942</a></td><td style="padding-left:20px;vertical-align:bottom;"><div style="font-size:9px;color:#333;line-height:1.8;">Saudi × China<br>Bridge</div></td></tr></table></td></tr></table>`;
}

// ─── CORS ───────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  try {
    const body = await req.json();
    const { type, record } = body;

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (type === 'trader_welcome') {
      if (!record?.email) return new Response('No email', { status: 400, headers: corsHeaders });
      const { data: profile } = await sb.from('profiles').select('full_name, company_name').eq('id', record.id).single();
      const name = profile?.full_name || profile?.company_name || record.email.split('@')[0];
      await sendEmail(record.email, 'أهلاً بك في مَعبر!', traderWelcomeHtml(name));
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'supplier_welcome') {
      if (!record?.email) return new Response('No email', { status: 400, headers: corsHeaders });
      const { data: profile } = await sb.from('profiles').select('company_name').eq('id', record.id).single();
      const name = profile?.company_name || record.email.split('@')[0];
      await sendEmail(record.email, "We've received your Maabar application", supplierWelcomeHtml(name));
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'admin_alert') {
      if (!record?.id) return new Response('No record id', { status: 400, headers: corsHeaders });
      const { data: profile } = await sb.from('profiles').select('*').eq('id', record.id).single();
      if (!profile) return new Response('Profile not found', { status: 404, headers: corsHeaders });
      const html = await adminAlertHtml(profile);
      await sendEmail(ADMIN_EMAIL, `New Supplier Application: ${profile.company_name || 'Unknown'}`, html);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'new_offer') {
      // Notify trader about a new offer on their request
      const { buyer_id, request_id, offer_price, delivery_days } = record || {};
      if (!buyer_id || !request_id) return new Response('Missing fields', { status: 400, headers: corsHeaders });
      const { data: authUser } = await sb.auth.admin.getUserById(buyer_id);
      const buyerEmail = authUser?.user?.email;
      if (!buyerEmail) return new Response('Buyer email not found', { status: 404, headers: corsHeaders });
      const { data: buyerProfile } = await sb.from('profiles').select('full_name, company_name').eq('id', buyer_id).single();
      const traderName = buyerProfile?.full_name || buyerProfile?.company_name || buyerEmail.split('@')[0];
      const { data: request } = await sb.from('requests').select('title_ar, title_en').eq('id', request_id).single();
      const requestTitle = request?.title_ar || request?.title_en || 'طلبك';
      await sendEmail(buyerEmail, 'عرض سعر جديد على طلبك 📩', newOfferHtml(traderName, requestTitle, String(offer_price || ''), String(delivery_days || '')));
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'offer_accepted') {
      // Notify supplier that their offer was accepted
      const { supplier_id, request_id } = record || {};
      if (!supplier_id || !request_id) return new Response('Missing fields', { status: 400, headers: corsHeaders });
      const { data: authUser } = await sb.auth.admin.getUserById(supplier_id);
      const supplierEmail = authUser?.user?.email;
      if (!supplierEmail) return new Response('Supplier email not found', { status: 404, headers: corsHeaders });
      const { data: supplierProfile } = await sb.from('profiles').select('company_name, full_name').eq('id', supplier_id).single();
      const supplierName = supplierProfile?.company_name || supplierProfile?.full_name || supplierEmail.split('@')[0];
      const { data: request } = await sb.from('requests').select('title_ar, title_en').eq('id', request_id).single();
      const requestTitle = request?.title_en || request?.title_ar || 'Your Request';
      await sendEmail(supplierEmail, 'تم قبول عرضك 🎉', offerAcceptedHtml(supplierName, requestTitle));
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'supplier_approved') {
      const { supplier_id, supplier_email: emailFromRecord, supplier_name } = record || {};
      let supplier_email = emailFromRecord;
      if (!supplier_email && supplier_id) {
        const { data: authUser } = await sb.auth.admin.getUserById(supplier_id);
        supplier_email = authUser?.user?.email;
      }
      if (!supplier_email) return new Response('No email', { status: 400, headers: corsHeaders });
      const name = supplier_name || supplier_email.split('@')[0];
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#0a0a0b;padding:28px 36px;text-align:center">
  <div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff">MAABAR</div>
  <div style="font-size:11px;color:#444;margin-top:4px">مَعبر</div>
</div>
<div style="background:#111113;padding:36px;border:1px solid #1c1c1c">
  <h2 style="color:#e2e2e2;font-size:22px;margin-bottom:16px">🎉 تم قبول حسابك في مَعبر!</h2>
  <p style="color:#888;font-size:14px;line-height:2">أهلاً ${name}،</p>
  <p style="color:#888;font-size:14px;line-height:2">يسعدنا إخبارك بأن حسابك في مَعبر قد تم قبوله. يمكنك الآن تسجيل الدخول وإضافة منتجاتك وبدء استقبال الطلبات من التجار السعوديين.</p>
  <div style="margin-top:24px">
    <a href="https://maabar.io/login/supplier" style="display:inline-block;background:#fff;color:#0a0a0b;padding:12px 28px;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px">ابدأ الآن ←</a>
  </div>
</div>
<div style="background:#111113;padding:20px 36px;border:1px solid #1c1c1c;text-align:center;font-size:11px;color:#444">hello@maabar.io · maabar.io</div>
</div>`;
      await sendEmail(supplier_email, 'تم قبول حسابك في مَعبر 🎉', html);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'supplier_rejected') {
      const { supplier_id, supplier_email: emailFromRecord, supplier_name } = record || {};
      let supplier_email = emailFromRecord;
      if (!supplier_email && supplier_id) {
        const { data: authUser } = await sb.auth.admin.getUserById(supplier_id);
        supplier_email = authUser?.user?.email;
      }
      if (!supplier_email) return new Response('No email', { status: 400, headers: corsHeaders });
      const name = supplier_name || supplier_email.split('@')[0];
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#0a0a0b;padding:28px 36px;text-align:center">
  <div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff">MAABAR</div>
  <div style="font-size:11px;color:#444;margin-top:4px">مَعبر</div>
</div>
<div style="background:#111113;padding:36px;border:1px solid #1c1c1c">
  <h2 style="color:#e2e2e2;font-size:20px;margin-bottom:16px">بخصوص طلب انضمامك لمَعبر</h2>
  <p style="color:#888;font-size:14px;line-height:2">أهلاً ${name}،</p>
  <p style="color:#888;font-size:14px;line-height:2">نأسف لإخبارك بأنه لم يتم قبول حسابك في مَعبر في الوقت الحالي. للاستفسار أو تقديم معلومات إضافية، تواصل معنا مباشرة على <a href="mailto:support@maabar.io" style="color:#888">support@maabar.io</a>.</p>
</div>
<div style="background:#111113;padding:20px 36px;border:1px solid #1c1c1c;text-align:center;font-size:11px;color:#444">hello@maabar.io · maabar.io</div>
</div>`;
      await sendEmail(supplier_email, 'بخصوص طلب انضمامك لمَعبر', html);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'new_message') {
      const { recipient_id, recipient_email: emailFromRecord, recipient_name, sender_id, sender_name } = record || {};
      let recipient_email = emailFromRecord;
      if (!recipient_email && recipient_id) {
        const { data: authUser } = await sb.auth.admin.getUserById(recipient_id);
        recipient_email = authUser?.user?.email;
      }
      if (!recipient_email) return new Response('No email', { status: 400, headers: corsHeaders });
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#0a0a0b;padding:28px 36px;text-align:center">
  <div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff">MAABAR</div>
</div>
<div style="background:#111113;padding:36px;border:1px solid #1c1c1c">
  <p style="color:#e2e2e2;font-size:16px;margin-bottom:16px">💬 رسالة جديدة في مَعبر</p>
  <p style="color:#888;font-size:14px;line-height:2">لديك رسالة جديدة${sender_name ? ` من ${sender_name}` : ''}. اضغط للرد.</p>
  <div style="margin-top:24px">
    <a href="https://maabar.io/chat/${sender_id || ''}" style="display:inline-block;background:#fff;color:#0a0a0b;padding:12px 28px;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px">فتح المحادثة ←</a>
  </div>
</div>
<div style="background:#111113;padding:20px 36px;border:1px solid #1c1c1c;text-align:center;font-size:11px;color:#444">hello@maabar.io · maabar.io</div>
</div>`;
      await sendEmail(recipient_email, 'رسالة جديدة في مَعبر 💬', html);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'offer_rejected') {
      const { supplier_id, supplier_email, supplier_name, request_title } = record || {};
      if (!supplier_email) return new Response('No email', { status: 400, headers: corsHeaders });
      const name = supplier_name || supplier_email.split('@')[0];
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#0a0a0b;padding:28px 36px;text-align:center">
  <div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff">MAABAR</div>
</div>
<div style="background:#111113;padding:36px;border:1px solid #1c1c1c">
  <p style="color:#e2e2e2;font-size:16px;margin-bottom:16px">بخصوص عرضك</p>
  <p style="color:#888;font-size:14px;line-height:2">أهلاً ${name}،</p>
  <p style="color:#888;font-size:14px;line-height:2">تم اختيار عرض آخر على الطلب <strong style="color:#e2e2e2">${request_title || ''}</strong>. شكراً لمشاركتك — تابع الطلبات الجديدة.</p>
  <div style="margin-top:24px">
    <a href="https://maabar.io/requests" style="display:inline-block;background:#fff;color:#0a0a0b;padding:12px 28px;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px">تصفح الطلبات ←</a>
  </div>
</div>
<div style="background:#111113;padding:20px 36px;border:1px solid #1c1c1c;text-align:center;font-size:11px;color:#444">hello@maabar.io · maabar.io</div>
</div>`;
      await sendEmail(supplier_email, 'بخصوص عرضك على مَعبر', html);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (type === 'payment_received_supplier') {
      const { supplier_email, supplier_name, request_title, amount } = record || {};
      if (!supplier_email) return new Response('No email', { status: 400, headers: corsHeaders });
      const name = supplier_name || supplier_email.split('@')[0];
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
<div style="background:#0a0a0b;padding:28px 36px;text-align:center">
  <div style="font-size:18px;font-weight:700;letter-spacing:4px;color:#fff">MAABAR</div>
</div>
<div style="background:#111113;padding:36px;border:1px solid #1c1c1c">
  <p style="color:#e2e2e2;font-size:18px;margin-bottom:16px">🚀 تم استلام الدفع — ابدأ الإنتاج</p>
  <p style="color:#888;font-size:14px;line-height:2">أهلاً ${name}،</p>
  <p style="color:#888;font-size:14px;line-height:2">تم استلام دفع التاجر لطلب <strong style="color:#e2e2e2">${request_title || ''}</strong>${amount ? ` بقيمة <strong style="color:#e2e2e2">${amount} SAR</strong>` : ''}. يمكنك الآن بدء الإنتاج والتجهيز.</p>
  <div style="margin-top:24px">
    <a href="https://maabar.io/dashboard" style="display:inline-block;background:#fff;color:#0a0a0b;padding:12px 28px;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px">عرض الطلب ←</a>
  </div>
</div>
<div style="background:#111113;padding:20px 36px;border:1px solid #1c1c1c;text-align:center;font-size:11px;color:#444">hello@maabar.io · maabar.io</div>
</div>`;
      await sendEmail(supplier_email, 'تم استلام الدفع — ابدأ الإنتاج 🚀', html);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response('Unknown type', { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
