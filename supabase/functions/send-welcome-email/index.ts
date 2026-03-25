import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const SUPABASE_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

async function sendEmail(to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: 'Maabar <no-reply@maabar.io>', to, subject, html }),
  });
}

serve(async (req) => {
  try {
    const { record } = await req.json(); // auth.users insert trigger payload
    if (!record?.email) return new Response('No email', { status: 400 });

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await sb.from('profiles').select('role, full_name, company_name').eq('id', record.id).single();

    const isSupplier = profile?.role === 'supplier';
    const name = profile?.full_name || profile?.company_name || record.email;

    if (isSupplier) {
      await sendEmail(
        record.email,
        "We've received your Maabar application",
        `<p>Hello ${name},</p>
         <p>We've received your supplier application on Maabar. We'll review it and be in touch within 24 hours.</p>
         <p>Best regards,<br/>The Maabar Team</p>`,
      );
    } else {
      await sendEmail(
        record.email,
        'Welcome to Maabar!',
        `<p>Hello ${name},</p>
         <p>Welcome to Maabar — the bridge connecting Saudi traders with verified Chinese suppliers.</p>
         <p>You can now post sourcing requests and receive competitive offers from suppliers.</p>
         <p>Get started at <a href="https://maabar.io/requests">maabar.io/requests</a></p>
         <p>Best regards,<br/>The Maabar Team</p>`,
      );
    }

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
