import { sb } from '../supabase';

// Daily-overview counters for the Admin Console dashboard. Each is a lightweight
// head+count query; any single failure degrades to 0 rather than breaking the
// whole board (tables/statuses vary across environments).
const count = async (build) => {
  try { const { count: n } = await build(); return n || 0; }
  catch { return 0; }
};

export async function fetchDashboardStats() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const todayIso = start.toISOString();

  const [
    unreadMessages, pendingQuotations, waitingInvitation,
    catalogsToReview, newTradersToday, openTickets,
  ] = await Promise.all([
    // Trader messages the factory hasn't read yet → conversations awaiting the supplier.
    count(() => sb.from('factory_thread_messages').select('id', { count: 'exact', head: true })
      .eq('sender_role', 'trader').eq('read_by_factory', false)),
    // Factory RFQ invites that haven't produced an offer yet.
    count(() => sb.from('request_factory_invites').select('id', { count: 'exact', head: true })
      .neq('status', 'offer_submitted')),
    // Prepared suppliers with no linked account → invite candidates.
    count(() => sb.from('factory_directory').select('id', { count: 'exact', head: true })
      .is('linked_supplier_id', null)),
    // Imports that finished extraction and need admin review.
    count(() => sb.from('factory_catalog_imports').select('id', { count: 'exact', head: true })
      .in('status', ['extracted', 'reviewing'])),
    // New buyers/traders registered today.
    count(() => sb.from('profiles').select('id', { count: 'exact', head: true })
      .in('role', ['buyer', 'trader']).gte('created_at', todayIso)),
    // Open support tickets.
    count(() => sb.from('support_tickets').select('id', { count: 'exact', head: true })
      .eq('status', 'open')),
  ]);

  return { unreadMessages, pendingQuotations, waitingInvitation, catalogsToReview, newTradersToday, openTickets };
}
