export async function fetchProductInquiryThreads(sb, { buyerId, supplierId } = {}) {
  if (!sb || (!buyerId && !supplierId)) return [];
  let q = sb.from('product_inquiries').select('*').order('created_at', { ascending: false });
  if (supplierId) q = q.eq('supplier_id', supplierId);   // supplier's inbound inquiries
  if (buyerId) q = q.eq('buyer_id', buyerId);            // buyer's own inquiries
  const { data, error } = await q;
  if (error) { console.error('fetchProductInquiryThreads error:', error); return []; }
  return data || [];
}

export function getProductInquiryProductName(inquiry) {
  return inquiry?.product_name || inquiry?.product_name_ar || inquiry?.product_name_en || '';
}
export function getProductInquiryAllTranslations() { return {}; }
export function getProductInquiryQuestion() { return ''; }
export function getProductInquiryTemplates() { return []; }
export function getProductInquiryStatusLabel(status) {
  const labels = {
    open: 'مفتوح',
    closed: 'مغلق',
    pending: 'قيد المراجعة',
    replied: 'تم الرد',
  };
  return labels[status] || status || '';
}