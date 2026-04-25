import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('APP_SUPABASE_URL') || Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('APP_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const SEND_EMAIL_URL = `${SUPABASE_URL}/functions/v1/send-email`;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.' }, 500);
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Update all pending direct orders past the 24h window in one go,
  // returning the rows so we can fan out notifications + emails.
  const updRes = await sb
    .from('requests')
    .update({ status: 'supplier_rejected' })
    .eq('status', 'pending_supplier_confirmation')
    .lt('created_at', cutoff)
    .not('product_ref', 'is', null)
    .select('id, buyer_id, product_ref, quantity, title_ar, title_en, title_zh, created_at');
  console.log('[auto-reject-orders] update response:', updRes);

  if (updRes.error) {
    return json({ error: 'Failed to update expired orders', details: updRes.error.message }, 500);
  }

  const expiredRows = updRes.data || [];
  if (expiredRows.length === 0) {
    return json({ ok: true, count: 0, ids: [] });
  }

  // Hydrate product names so emails read better.
  const refIds = [...new Set(expiredRows.map((r) => r.product_ref).filter(Boolean))];
  const productsRes = refIds.length
    ? await sb.from('products').select('id, name_ar, name_en, name_zh').in('id', refIds)
    : { data: [], error: null };
  console.log('[auto-reject-orders] products query response:', productsRes);
  const productsById: Record<string, any> = (productsRes.data || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});

  const processed: string[] = [];
  for (const row of expiredRows) {
    const product = productsById[row.product_ref] || null;
    const productName = product?.name_ar || product?.name_en || product?.name_zh || row.title_ar || row.title_en || '';

    const notifRes = await sb.from('notifications').insert({
      user_id: row.buyer_id,
      type: 'supplier_rejected',
      title_ar: `تم إلغاء طلبك تلقائياً — لم يؤكد المورد خلال 24 ساعة: ${productName}`,
      title_en: `Order auto-cancelled — supplier did not confirm within 24h: ${productName}`,
      title_zh: `订单已自动取消 — 供应商 24 小时内未确认：${productName}`,
      ref_id: row.id,
      is_read: false,
    }).select().single();
    console.log('[auto-reject-orders] notification response:', { requestId: row.id, response: notifRes });

    try {
      const r = await fetch(SEND_EMAIL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify({
          type: 'direct_order_rejected',
          data: {
            recipientUserId: row.buyer_id,
            productName,
            quantity: row.quantity,
            autoRejected: true,
          },
        }),
      });
      const body = await r.json().catch(() => null);
      console.log('[auto-reject-orders] email response:', { requestId: row.id, status: r.status, body });
    } catch (emailError) {
      console.error('[auto-reject-orders] email error:', { requestId: row.id, error: String(emailError) });
    }

    processed.push(row.id);
  }

  return json({ ok: true, count: processed.length, ids: processed });
});
