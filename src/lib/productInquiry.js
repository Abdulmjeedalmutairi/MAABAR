export const PRODUCT_INQUIRY_TEMPLATES = [
  {
    key: 'delivery_eta',
    question:    'متى توصلني الشحنة؟',
    question_ar: 'متى توصلني الشحنة؟',
    question_en: 'When will the shipment arrive?',
    question_zh: '货物什么时候能到？',
  },
  {
    key: 'custom_orders',
    question:    'عندكم طلبات مخصصة؟',
    question_ar: 'عندكم طلبات مخصصة؟',
    question_en: 'Do you accept custom orders?',
    question_zh: '你们支持定制订单吗？',
  },
  {
    key: 'shipping_cost',
    question:    'كم تكلفة الشحن؟',
    question_ar: 'كم تكلفة الشحن؟',
    question_en: 'What is the shipping cost?',
    question_zh: '运费是多少？',
  },
];

export function getProductInquiryTemplates() {
  return PRODUCT_INQUIRY_TEMPLATES;
}

export function getProductInquiryQuestion(templateKey, fallback = '') {
  const match = PRODUCT_INQUIRY_TEMPLATES.find((item) => item.key === templateKey);
  return match?.question || fallback || '';
}

export function getProductInquiryQuestionTranslated(templateKey, lang = 'ar', fallback = '') {
  const match = PRODUCT_INQUIRY_TEMPLATES.find((item) => item.key === templateKey);
  if (!match) return fallback || '';
  if (lang === 'zh') return match.question_zh || match.question;
  if (lang === 'en') return match.question_en || match.question;
  return match.question_ar || match.question;
}

// يُرجع الحقول المترجمة للحفظ في DB
export function getProductInquiryAllTranslations(templateKey) {
  const match = PRODUCT_INQUIRY_TEMPLATES.find((item) => item.key === templateKey);
  if (!match) return { question_text_ar: '', question_text_en: '', question_text_zh: '' };
  return {
    question_text_ar: match.question_ar || match.question,
    question_text_en: match.question_en || match.question,
    question_text_zh: match.question_zh || match.question,
  };
}

export function getProductInquiryProductName(product, lang = 'ar') {
  if (!product) return 'Product';
  if (lang === 'zh') return product.name_zh || product.name_en || product.name_ar || 'Product';
  if (lang === 'en') return product.name_en || product.name_ar || product.name_zh || 'Product';
  return product.name_ar || product.name_en || product.name_zh || 'Product';
}

export function getProductInquiryStatusLabel(status, lang = 'ar', role = 'buyer') {
  if (status === 'answered') {
    if (lang === 'zh') return role === 'supplier' ? '已回复' : '供应商已回复';
    if (lang === 'en') return role === 'supplier' ? 'Answered' : 'Supplier replied';
    return role === 'supplier' ? 'تم الرد' : 'رد المورد';
  }

  if (lang === 'zh') return role === 'supplier' ? '待回复' : '等待供应商回复';
  if (lang === 'en') return role === 'supplier' ? 'Awaiting reply' : 'Waiting for supplier reply';
  return role === 'supplier' ? 'بانتظار الرد' : 'بانتظار رد المورد';
}

export function sortProductInquiryReplies(replies = []) {
  return [...(Array.isArray(replies) ? replies : [])].sort(
    (a, b) => new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime(),
  );
}

export async function fetchProductInquiryThreads(sb, filters = {}) {
  if (!sb) return [];

  let query = sb
    .from('product_inquiries')
    .select(`
      *,
      products ( id, name_ar, name_en, name_zh, image_url, gallery_images ),
      product_inquiry_replies ( id, inquiry_id, sender_id, receiver_id, message, message_ar, message_en, message_zh, created_at )
    `)
    .order('updated_at', { ascending: false });

  if (filters.buyerId) query = query.eq('buyer_id', filters.buyerId);
  if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    product_inquiry_replies: sortProductInquiryReplies(item.product_inquiry_replies),
  }));
}
