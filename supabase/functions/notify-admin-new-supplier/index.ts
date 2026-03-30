import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const ADMIN_EMAIL = 'info@maabar.io';

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: 'مَعبر | MAABAR <hello@maabar.io>', to, subject, html }),
  });
}

serve(async (req) => {
  try {
    const { record } = await req.json(); // profiles insert trigger payload
    if (record?.role !== 'supplier') return new Response('Not a supplier', { status: 200 });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', record.id).single();
    if (!profile) return new Response('Profile not found', { status: 404 });

    // Build supplier data summary
    const supplierSummary = `
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

    // AI analysis via Claude
    let aiAnalysis = '';
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
${supplierSummary}`,
        }],
      });
      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const parsed = JSON.parse(text);
      aiAnalysis = `
<h3>AI Verification Analysis</h3>
<table border="1" cellpadding="6" style="border-collapse:collapse">
  <tr><td><b>Trust Score</b></td><td>${parsed.trust_score}/10</td></tr>
  <tr><td><b>Manufacturing Hub</b></td><td>${parsed.manufacturing_hub}</td></tr>
  <tr><td><b>Details Consistent</b></td><td>${parsed.details_consistent}</td></tr>
  <tr><td><b>Strengths</b></td><td>${(parsed.strengths || []).join('<br/>')}</td></tr>
  <tr><td><b>Red Flags</b></td><td>${(parsed.red_flags || []).join('<br/>') || 'None'}</td></tr>
  <tr><td><b>Recommendation</b></td><td><b>${parsed.recommendation}</b></td></tr>
</table>`;
    } catch (aiErr) {
      console.error('AI analysis failed:', aiErr);
      aiAnalysis = '<p><em>AI analysis unavailable</em></p>';
    }

    const html = `
<h2>New Supplier Application — Maabar</h2>
<h3>Supplier Details</h3>
<pre style="background:#f5f5f5;padding:12px">${supplierSummary}</pre>
${profile.license_url ? `<p><a href="${profile.license_url}">View Business License</a></p>` : ''}
${profile.factory_image_url ? `<p><a href="${profile.factory_image_url}">View Factory Photo</a></p>` : ''}
${aiAnalysis}
`;

    await sendEmail(ADMIN_EMAIL, `New Supplier Application: ${profile.company_name || 'Unknown'}`, html);

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
