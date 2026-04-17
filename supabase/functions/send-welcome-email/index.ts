import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Legacy function — kept as no-op to avoid webhook errors.
// Email sending has been consolidated into supabase/functions/send-email/index.ts.
serve(async () => {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
