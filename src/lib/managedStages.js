// The managed-order lifecycle — one ordered set of 7 stages the trader tracks and
// the admin drives. requests.managed_status holds the current stage's canonical
// value; the tracker maps any historical status onto a stage index.

export const MANAGED_STAGES = [
  { key: 'received',   ar: 'استلمنا طلبك',      en: 'Received',        zh: '已收到' },
  { key: 'sourcing',   ar: 'بحثنا وتفاوضنا',    en: 'Sourcing',        zh: '寻源谈判' },
  { key: 'offer',      ar: 'عرضك جاهز',         en: 'Offer ready',     zh: '报价就绪' },
  { key: 'production', ar: 'قيد الإنتاج',        en: 'In production',   zh: '生产中' },
  { key: 'video',      ar: 'فيديو قبل الشحن',    en: 'Pre-ship video',  zh: '发货前视频' },
  { key: 'shipping',   ar: 'الشحن والتخليص',     en: 'Shipping',        zh: '运输清关' },
  { key: 'delivered',  ar: 'وصل إليك',           en: 'Delivered',       zh: '已送达' },
];

// Every managed_status value (past + present) → its stage key.
const STATUS_TO_STAGE = {
  submitted: 'received', admin_review: 'received',
  sourcing: 'sourcing', matching: 'sourcing', shortlist_ready: 'sourcing',
  buyer_review: 'sourcing', negotiation: 'sourcing', buyer_selected: 'sourcing',
  offer_ready: 'offer',
  approved: 'production', deposit_paid: 'production', in_production: 'production',
  video_review: 'video',
  shipping: 'shipping',
  delivered: 'delivered', completed: 'delivered',
};

// The canonical managed_status the admin writes when advancing to a stage.
export const STATUS_FOR_STAGE = {
  received: 'admin_review', sourcing: 'sourcing', offer: 'offer_ready',
  production: 'in_production', video: 'video_review', shipping: 'shipping', delivered: 'delivered',
};

export function stageKeyOf(managedStatus) {
  return STATUS_TO_STAGE[String(managedStatus || '').toLowerCase()] || 'received';
}

export function stageIndexOf(managedStatus) {
  const key = stageKeyOf(managedStatus);
  return Math.max(0, MANAGED_STAGES.findIndex((s) => s.key === key));
}

export const isCancelled = (managedStatus) =>
  ['cancelled', 'declined', 'rejected'].includes(String(managedStatus || '').toLowerCase());
