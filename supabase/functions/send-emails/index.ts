import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const RESEND_API_KEY             = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL               = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANTHROPIC_API_KEY          = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const ADMIN_EMAIL                = 'info@maabar.io';
const FROM                       = 'Maabar <no-reply@maabar.io>';

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

// ─── Handler ────────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const body = await req.json();
    const { type, record } = body;

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (type === 'trader_welcome') {
      if (!record?.email) return new Response('No email', { status: 400 });
      const { data: profile } = await sb.from('profiles').select('full_name, company_name').eq('id', record.id).single();
      const name = profile?.full_name || profile?.company_name || record.email.split('@')[0];
      await sendEmail(record.email, 'أهلاً بك في مَعبر!', traderWelcomeHtml(name));
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (type === 'supplier_welcome') {
      if (!record?.email) return new Response('No email', { status: 400 });
      const { data: profile } = await sb.from('profiles').select('company_name').eq('id', record.id).single();
      const name = profile?.company_name || record.email.split('@')[0];
      await sendEmail(record.email, "We've received your Maabar application", supplierWelcomeHtml(name));
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (type === 'admin_alert') {
      if (!record?.id) return new Response('No record id', { status: 400 });
      const { data: profile } = await sb.from('profiles').select('*').eq('id', record.id).single();
      if (!profile) return new Response('Profile not found', { status: 404 });
      const html = await adminAlertHtml(profile);
      await sendEmail(ADMIN_EMAIL, `New Supplier Application: ${profile.company_name || 'Unknown'}`, html);
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response('Unknown type', { status: 400 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
