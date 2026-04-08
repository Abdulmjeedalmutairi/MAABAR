export async function fetchProductInquiryThreads(sb, { buyerId } = {}) {
  if (!sb || !buyerId) return [];
  const { data, error } = await sb
    .from('product_inquiries')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });
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