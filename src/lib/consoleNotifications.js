import { sb } from '../supabase';

// Unified admin activity inbox — derived (no new tables) from the events the
// founder cares about: new trader messages, quote requests, supplier
// registrations, finished/failed extractions, and support tickets. Each query is
// safe (degrades to empty on error) and capped; results merge into one
// time-sorted feed. Bounced emails are included when email_logs exposes a status.

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const safe = (p) => p.then((r) => r, () => ({ data: [] }));

export async function fetchNotifications() {
  const [msgs, invites, regs, imps, tickets, bounces] = await Promise.all([
    safe(sb.from('factory_thread_messages').select('thread_id, content, created_at')
      .eq('sender_role', 'trader').order('created_at', { ascending: false }).limit(30)),
    safe(sb.from('request_factory_invites').select('request_id, status, created_at')
      .order('created_at', { ascending: false }).limit(30)),
    safe(sb.from('profiles').select('id, full_name, email, created_at')
      .eq('role', 'supplier').order('created_at', { ascending: false }).limit(20)),
    safe(sb.from('factory_catalog_imports').select('id, original_filename, catalog_title, status, updated_at, created_at')
      .in('status', ['extracted', 'failed']).order('updated_at', { ascending: false }).limit(30)),
    safe(sb.from('support_tickets').select('id, subject, status, created_at')
      .order('created_at', { ascending: false }).limit(20)),
    safe(sb.from('email_logs').select('id, to_email, template, status, created_at')
      .in('status', ['bounced', 'failed', 'complained']).order('created_at', { ascending: false }).limit(20)),
  ]);

  const items = [];
  (msgs.data || []).forEach((m) => items.push({ group: 'message', type: 'message', at: m.created_at, title_ar: 'رسالة جديدة من تاجر', title_en: 'New message from a trader', sub: nf(m.content).slice(0, 80), link: `/admin/conversations/${m.thread_id}`, tone: 'info' }));
  (invites.data || []).forEach((i) => items.push({ group: 'quotation', type: 'quotation', at: i.created_at, title_ar: 'طلب تسعير جديد', title_en: 'New quote request', sub: '', link: `/admin/concierge/${i.request_id}`, tone: 'warn' }));
  (regs.data || []).forEach((r) => items.push({ group: 'registered', type: 'registered', at: r.created_at, title_ar: 'مورّد سجّل', title_en: 'Supplier registered', sub: nf(r.full_name) || nf(r.email), link: '/admin2/suppliers', tone: 'ok' }));
  (imps.data || []).forEach((im) => {
    const failed = im.status === 'failed';
    items.push({ group: 'catalog', type: failed ? 'error' : 'extraction', at: im.updated_at || im.created_at, title_ar: failed ? 'فشل استخراج كتالوج' : 'اكتمل استخراج كتالوج', title_en: failed ? 'Extraction failed' : 'Catalog extracted', sub: nf(im.catalog_title) || nf(im.original_filename), link: `/admin/catalog-import/${im.id}`, tone: failed ? 'danger' : 'ok' });
  });
  (tickets.data || []).forEach((tk) => items.push({ group: 'support', type: 'support', at: tk.created_at, title_ar: 'تذكرة دعم', title_en: 'Support ticket', sub: nf(tk.subject), link: `/admin/support/${tk.id}`, tone: 'neutral' }));
  (bounces.data || []).forEach((b) => items.push({ group: 'bounce', type: 'bounce', at: b.created_at, title_ar: 'إيميل مرتد', title_en: 'Email bounced', sub: `${nf(b.to_email)} · ${nf(b.template)}`, link: '/admin/emails', tone: 'danger' }));

  return items.filter((x) => x.at).sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
