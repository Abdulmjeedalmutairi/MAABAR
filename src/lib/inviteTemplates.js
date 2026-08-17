// Shared invitation-template definitions — used by the "Send invitation" modal
// (InviteModal) and the console Templates reference page (ConsoleTemplates).
// Templates are claim-aware: v.reg = the factory already has an account, so the
// CTA (v.cta) points at their dashboard and the wording says "reply now / manage";
// otherwise it points at the /claim link and says "claim your page".

export const TEMPLATES = [
  { key: 'new_message', ar: 'رسالة جديدة', en: 'New message', zh: '新消息' },
  { key: 'quote', ar: 'طلب تسعير', en: 'Quotation request', zh: '报价请求' },
  { key: 'discover', ar: 'اجذب المشترين', en: 'Get discovered', zh: '吸引买家' },
  { key: 'complete', ar: 'إكمال الملف', en: 'Complete profile', zh: '完善资料' },
  { key: 'reminder', ar: 'تذكير', en: 'Reminder', zh: '提醒' },
  { key: 'catalog', ar: 'رفع كتالوج', en: 'Catalog uploaded', zh: '目录已上传' },
];

export const BODY = {
  // Arabic bodies are for STAFF comprehension only (the "read as" gloss in
  // InviteModal) — they are never sent to a factory. Send stays en/zh.
  ar: {
    new_message: (v) => v.reg
      ? `مرحبًا ${v.factory}،\n\nلديك رسالة جديدة من مشترٍ سعودي على معبر. افتح لوحتك للرد:\n${v.cta}\n\nمعبر`
      : `مرحبًا ${v.factory}،\n\nمشترٍ سعودي على معبر مهتمّ بمنتجاتك. صفحة مصنعك جاهزة — طالِب بها للرد واستقبال الطلبات:\n${v.cta}\n\nمعبر — جسرك إلى المشترين السعوديين.`,
    quote: (v) => `مرحبًا ${v.factory}،\n\nلديك طلب تسعير جديد من مشترٍ سعودي:\n• المنتج: ${v.product || '-'}\n• الكمية: ${v.qty || '-'}\n\n${v.reg ? 'افتح لوحتك للرد الآن:' : 'رُدّ مباشرة من صفحة مصنعك الجاهزة:'}\n${v.cta}\n\nمعبر`,
    discover: (v) => v.reg
      ? `مرحبًا ${v.factory}،\n\nصفحة مصنعك ظاهرة على معبر. أضِف أفضل منتجاتك وصورك ليجدك المشترون السعوديون — المصانع ذات الصفحات المكتملة تصلها طلبات أكثر:\n${v.cta}\n\nمعبر`
      : `مرحبًا ${v.factory}،\n\nطالِب بصفحة مصنعك الجاهزة على معبر وأضِف منتجاتك ليجدك المشترون السعوديون ويطلبوا منك:\n${v.cta}\n\nمعبر`,
    complete: (v) => v.reg
      ? `مرحبًا ${v.factory}،\n\nأكمِل ملفك على معبر لجذب مزيد من المشترين السعوديين — أضِف المنتجات والصور والشهادات:\n${v.cta}\n\nمعبر`
      : `مرحبًا ${v.factory}،\n\nصفحة مصنعك جاهزة على معبر. طالِب بها وأضِف بعض التفاصيل لجذب المشترين السعوديين:\n${v.cta}\n\nمعبر`,
    reminder: (v) => v.reg
      ? `مرحبًا ${v.factory}،\n\nتذكير سريع — مشترون سعوديون بانتظار ردّك على معبر. افتح لوحتك للرد:\n${v.cta}\n\nمعبر`
      : `مرحبًا ${v.factory}،\n\nتذكير سريع — مشترون سعوديون بالانتظار على معبر. طالِب بصفحتك للرد:\n${v.cta}\n\nمعبر`,
    catalog: (v) => v.reg
      ? `مرحبًا ${v.factory}،\n\nكتالوجك ظاهر الآن على معبر — منتجاتك مرئية للمشترين السعوديين. أدِرها من لوحتك:\n${v.cta}\n\nمعبر`
      : `مرحبًا ${v.factory}،\n\nنشرنا كتالوجك على معبر — منتجاتك مرئية الآن للمشترين السعوديين. طالِب بصفحتك لإدارتها:\n${v.cta}\n\nمعبر`,
  },
  en: {
    new_message: (v) => v.reg
      ? `Hi ${v.factory},\n\nYou have a new message from a Saudi buyer on MAABAR. Open your dashboard to reply:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nA Saudi buyer on MAABAR is interested in your products. Your factory page is already prepared — claim it to reply and receive orders:\n${v.cta}\n\nMAABAR — your bridge to Saudi buyers.`,
    quote: (v) => `Hi ${v.factory},\n\nYou have a new quote request from a Saudi buyer:\n• Product: ${v.product || '-'}\n• Quantity: ${v.qty || '-'}\n\n${v.reg ? 'Open your dashboard to reply now:' : 'Reply directly from your ready factory page:'}\n${v.cta}\n\nMAABAR`,
    discover: (v) => v.reg
      ? `Hi ${v.factory},\n\nYour factory page is live on MAABAR. Add your best products and photos so Saudi buyers can find and request you — factories with complete pages get more requests:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nClaim your ready factory page on MAABAR and add your products so Saudi buyers can find and request you:\n${v.cta}\n\nMAABAR`,
    complete: (v) => v.reg
      ? `Hi ${v.factory},\n\nComplete your MAABAR profile to attract more Saudi buyers — add products, photos and certifications:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nYour factory page is ready on MAABAR. Claim it and add a few details to attract Saudi buyers:\n${v.cta}\n\nMAABAR`,
    reminder: (v) => v.reg
      ? `Hi ${v.factory},\n\nA quick reminder — Saudi buyers are waiting for your reply on MAABAR. Open your dashboard to respond:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nA quick reminder — Saudi buyers are waiting on MAABAR. Claim your page to respond:\n${v.cta}\n\nMAABAR`,
    catalog: (v) => v.reg
      ? `Hi ${v.factory},\n\nYour catalog is live on MAABAR — your products are now visible to Saudi buyers. Manage it from your dashboard:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nWe've published your catalog on MAABAR — your products are now visible to Saudi buyers. Claim your page to manage it:\n${v.cta}\n\nMAABAR`,
  },
  zh: {
    new_message: (v) => v.reg
      ? `${v.factory} 您好，\n\n您在 MAABAR 收到一条来自沙特买家的新消息。请打开后台回复：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\nMAABAR 上有沙特买家对您的产品感兴趣。您的工厂主页已准备就绪 — 认领即可回复并接收订单：\n${v.cta}\n\nMAABAR`,
    quote: (v) => `${v.factory} 您好，\n\n您收到一条来自沙特买家的报价请求：\n• 产品：${v.product || '-'}\n• 数量：${v.qty || '-'}\n\n${v.reg ? '请打开后台立即回复：' : '请从您的工厂主页直接回复：'}\n${v.cta}\n\nMAABAR`,
    discover: (v) => v.reg
      ? `${v.factory} 您好，\n\n您的工厂主页已在 MAABAR 上线。上传您的优质产品和照片，让沙特买家能找到并向您询价 — 资料完整的工厂会收到更多请求：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n认领您在 MAABAR 已准备好的工厂主页并上传产品，让沙特买家能找到您：\n${v.cta}\n\nMAABAR`,
    complete: (v) => v.reg
      ? `${v.factory} 您好，\n\n完善您的 MAABAR 资料以吸引更多沙特买家 — 添加产品、照片和认证：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n您的工厂主页已在 MAABAR 准备就绪。认领并补充信息以吸引沙特买家：\n${v.cta}\n\nMAABAR`,
    reminder: (v) => v.reg
      ? `${v.factory} 您好，\n\n温馨提醒 — 沙特买家正在 MAABAR 等待您的回复。请打开后台回应：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n温馨提醒 — 沙特买家正在 MAABAR 等待。认领主页即可回应：\n${v.cta}\n\nMAABAR`,
    catalog: (v) => v.reg
      ? `${v.factory} 您好，\n\n您的目录已在 MAABAR 上线 — 产品现已对沙特买家可见。请从后台管理：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n我们已在 MAABAR 发布您的目录 — 产品现已对沙特买家可见。认领主页即可管理：\n${v.cta}\n\nMAABAR`,
  },
};

export const SUBJECT = {
  ar: { new_message: 'رسالة جديدة على معبر', quote: 'طلب تسعير جديد', discover: 'ليجدك المشترون السعوديون', complete: 'أكمِل صفحتك على معبر', reminder: 'مشترون بانتظارك على معبر', catalog: 'كتالوجك ظاهر على معبر' },
  en: { new_message: 'A new message on MAABAR', quote: 'New quote request', discover: 'Get discovered by Saudi buyers', complete: 'Complete your MAABAR page', reminder: 'Buyers are waiting on MAABAR', catalog: 'Your catalog is live on MAABAR' },
  zh: { new_message: 'MAABAR 上有新消息', quote: '新报价请求', discover: '让沙特买家发现您', complete: '完善您的 MAABAR 主页', reminder: '买家正在 MAABAR 等待', catalog: '您的目录已上线 MAABAR' },
};
