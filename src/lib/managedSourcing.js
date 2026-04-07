import { SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '../supabase';

export const MANAGED_REQUEST_STAGE_KEYS = ['submitted', 'admin_review', 'sourcing', 'shortlist_ready'];

export const MANAGED_STAGE_LABELS = {
  submitted: { ar: 'تم استلام الطلب', en: 'Request received', zh: '需求已接收' },
  admin_review: { ar: 'قيد المراجعة', en: 'Under review', zh: '审核中' },
  sourcing: { ar: 'جارٍ البحث والتفاوض', en: 'Sourcing & negotiation', zh: '筛选与议价中' },
  shortlist_ready: { ar: 'تم اختيار أفضل 3 عروض', en: 'Top 3 offers selected', zh: '已选出最佳 3 个方案' },
};

export const MANAGED_NEGOTIATION_REASONS = [
  { value: 'better_price', ar: 'أريد سعراً أفضل', en: 'I want a better price', zh: '我想要更好的价格' },
  { value: 'faster_delivery', ar: 'أريد وقت تسليم أسرع', en: 'I want faster delivery', zh: '我想要更快的交期' },
  { value: 'adjust_specs', ar: 'أريد تعديل الكمية أو المواصفات', en: 'I want to adjust quantity or specs', zh: '我想调整数量或规格' },
];

export const MANAGED_MATCH_GROUPS = {
  new: { ar: 'الطلبات الجديدة', en: 'New matches', zh: '新匹配需求' },
  quoted: { ar: 'الطلبات اللي قدّم عليها', en: 'Submitted quotes', zh: '已报价需求' },
  closed: { ar: 'الطلبات المغلقة', en: 'Closed matches', zh: '已关闭需求' },
};

export function getLocalizedText(value, lang = 'ar') {
  if (!value || typeof value !== 'object') return value || '';
  return value[lang] || value.ar || value.en || value.zh || '';
}

export function getManagedStageKey(status) {
  const normalized = String(status || '').toLowerCase().trim();
  if (['submitted', 'received'].includes(normalized)) return 'submitted';
  if (['admin_review', 'under_review', 'needs_follow_up'].includes(normalized)) return 'admin_review';
  if (['supplier_matching', 'sourcing', 'negotiating', 'research_requested', 'buyer_selected'].includes(normalized)) return 'sourcing';
  if (['shortlist_ready', 'decision_requested', 'completed'].includes(normalized)) return 'shortlist_ready';
  return 'submitted';
}

export function getManagedStageIndex(status) {
  return MANAGED_REQUEST_STAGE_KEYS.indexOf(getManagedStageKey(status));
}

export function getManagedStageLabel(status, lang = 'ar') {
  return getLocalizedText(MANAGED_STAGE_LABELS[getManagedStageKey(status)], lang);
}

export function isManagedRequest(request = {}) {
  return String(request?.sourcing_mode || '').toLowerCase() === 'managed';
}

export function getManagedMatchGroup(match = {}) {
  const status = String(match?.status || '').toLowerCase();
  if (['declined', 'closed', 'shortlisted', 'not_selected', 'expired'].includes(status)) return 'closed';
  if (['quoted', 'under_review', 'negotiating'].includes(status)) return 'quoted';
  return 'new';
}

export function getManagedMatchGroupLabel(group, lang = 'ar') {
  return getLocalizedText(MANAGED_MATCH_GROUPS[group], lang);
}

export function buildManagedBriefFallback(request = {}) {
  const rawDescription = String(request.description || '').trim();
  const cleanedDescription = rawDescription.replace(/\s+/g, ' ').trim();
  const parts = cleanedDescription
    .split(/[\n،,؛•\-]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const quantity = String(request.quantity || '').trim();
  const extractedSpecs = [
    ...(quantity ? [{ label: 'quantity', value: quantity }] : []),
    ...parts.slice(0, 6).map((item, index) => ({ label: `spec_${index + 1}`, value: item })),
  ];

  const briefLines = [
    request.title_ar || request.title_en || 'Managed sourcing request',
    quantity ? `Quantity: ${quantity}` : '',
    cleanedDescription ? `Specs: ${cleanedDescription}` : '',
    request.budget_per_unit ? `Budget hint per unit: ${request.budget_per_unit} SAR` : '',
    request.sample_requirement ? `Sample: ${request.sample_requirement}` : '',
  ].filter(Boolean);

  const priority = request.budget_per_unit ? 'high' : 'normal';

  return {
    aiStatus: 'fallback',
    adminReviewStatus: 'pending',
    cleanedDescription,
    extractedSpecs,
    category: request.category || 'other',
    priority,
    supplierBrief: briefLines.join('\n'),
    aiConfidence: 'low',
    aiOutput: {
      source: 'fallback',
      cleanedDescription,
      extractedSpecs,
      priority,
    },
  };
}

export async function generateManagedBriefWithAI({ request, lang = 'ar' }) {
  const fallback = buildManagedBriefFallback(request);

  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/Ai-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        system: `You are Maabar's managed sourcing prep assistant.
Return JSON only with this exact shape:
{
  "cleaned_description": "",
  "extracted_specs": [{"label":"","value":""}],
  "category": "electronics|furniture|clothing|building|food|other",
  "priority": "high|normal|low",
  "supplier_brief": "",
  "ai_confidence": "high|medium|low"
}
Rules:
- Clean and normalize the buyer request for admin review.
- Extract practical sourcing specs.
- Keep supplier_brief concise and supplier-ready.
- Do not invent pricing or certifications not mentioned.
- No markdown. JSON only.`,
        messages: [{
          role: 'user',
          content: JSON.stringify({
            language: lang,
            title_ar: request.title_ar,
            title_en: request.title_en,
            quantity: request.quantity,
            description: request.description,
            category: request.category,
            budget_per_unit: request.budget_per_unit,
            sample_requirement: request.sample_requirement,
            payment_plan: request.payment_plan,
          }),
        }],
      }),
    });

    const payload = await response.json().catch(() => ({}));
    const text = payload?.content?.[0]?.text || '';
    const cleaned = text.replace(/```json|```/g, '').trim();
    if (!response.ok || !cleaned) throw new Error(payload?.error || 'AI brief failed');

    const parsed = JSON.parse(cleaned);
    return {
      aiStatus: 'ready',
      adminReviewStatus: 'pending',
      cleanedDescription: parsed.cleaned_description || fallback.cleanedDescription,
      extractedSpecs: Array.isArray(parsed.extracted_specs) && parsed.extracted_specs.length > 0 ? parsed.extracted_specs : fallback.extractedSpecs,
      category: parsed.category || fallback.category,
      priority: parsed.priority || fallback.priority,
      supplierBrief: parsed.supplier_brief || fallback.supplierBrief,
      aiConfidence: parsed.ai_confidence || 'medium',
      aiOutput: parsed,
    };
  } catch (error) {
    console.error('generateManagedBriefWithAI fallback:', error);
    return fallback;
  }
}

export function buildManagedBriefRow({ requestId, buyerId, brief }) {
  return {
    request_id: requestId,
    buyer_id: buyerId,
    ai_status: brief.aiStatus,
    admin_review_status: brief.adminReviewStatus,
    cleaned_description: brief.cleanedDescription,
    extracted_specs: brief.extractedSpecs,
    category: brief.category,
    priority: brief.priority,
    supplier_brief: brief.supplierBrief,
    ai_confidence: brief.aiConfidence,
    ai_output: brief.aiOutput,
  };
}

export function getManagedVerificationLevel(profile = {}, lang = 'ar') {
  const status = String(profile?.status || '').toLowerCase();
  if (['verified', 'approved', 'active'].includes(status)) {
    return lang === 'ar' ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified';
  }
  return lang === 'ar' ? 'قيد المراجعة' : lang === 'zh' ? '审核中' : 'Under review';
}

export function getManagedShortlistReasonLabel(reasonValue, lang = 'ar') {
  const match = MANAGED_NEGOTIATION_REASONS.find((item) => item.value === reasonValue);
  return match ? getLocalizedText(match, lang) : reasonValue;
}
