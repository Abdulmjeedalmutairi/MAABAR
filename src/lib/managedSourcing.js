import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase';

export function isManagedRequest(request) {
  return request?.type === 'managed' || request?.is_managed === true;
}

export function buildManagedBriefRow({ requestId, buyerId, brief }) {
  if (!brief) return null;

  return {
    request_id: requestId,
    buyer_id: buyerId,
    ai_status: brief.ai_status || 'ready',
    admin_review_status: 'pending',
    supplier_brief: brief.supplier_brief || brief.cleaned_description || '',
    admin_internal_notes: brief.admin_internal_notes ?? null,
    admin_follow_up_question: brief.admin_follow_up_question ?? null,
    priority: brief.priority || 'normal',
    extracted_specs: brief.extracted_specs || [],
    cleaned_description: brief.cleaned_description || '',
    category: brief.category || 'other',
    ai_confidence: brief.ai_confidence || 'medium',
    ai_output: brief.ai_output || {},
  };
}

export function getManagedVerificationLevel(profiles, lang = 'ar') {
  // Determine verification level based on supplier profile
  if (!profiles) return 'basic';

  const status = profiles?.status;
  const rating = profiles?.rating;
  const dealsCompleted = profiles?.deals_completed;

  if (status === 'verified' && rating >= 4.5 && dealsCompleted > 10) {
    return 'premium';
  }
  if (status === 'verified' || status === 'approved') {
    return 'verified';
  }
  return 'basic';
}

export function getManagedMatchGroup(request) {
  // Group managed requests for supplier matching
  if (!request) return 'general';

  const category = request.category;
  const priority = request.managed_priority || 'normal';

  if (priority === 'urgent') return 'urgent';
  if (category === 'electronics') return 'electronics';
  if (category === 'furniture') return 'furniture';
  if (category === 'clothing') return 'clothing';
  if (category === 'building') return 'building';
  if (category === 'food') return 'food';

  return 'general';
}

function pickByLang(record, field, lang) {
  if (!record) return '';
  return record[`${field}_${lang}`] || record[`${field}_en`] || record[`${field}_ar`] || record[field] || '';
}

function buildHeuristicBrief({ request, lang, aiStatus = 'ready' }) {
  const description = request?.description || '';
  const category = request?.category || 'other';

  const extractedSpecs = [];
  if (description.includes('كجم') || description.includes('kg')) extractedSpecs.push({ key: 'weight', value: null, unit: 'kg', confidence: 'low' });
  if (description.includes('لون') || description.includes('color')) extractedSpecs.push({ key: 'color', value: null, unit: null, confidence: 'low' });
  if (description.includes('مقاس') || description.includes('size')) extractedSpecs.push({ key: 'size', value: null, unit: null, confidence: 'low' });
  if (description.includes('مادة') || description.includes('material')) extractedSpecs.push({ key: 'material', value: null, unit: null, confidence: 'low' });

  const priority = request?.response_deadline ? 'urgent' : 'normal';
  const aiConfidence = description.length > 50 ? 'high' : description.length > 20 ? 'medium' : 'low';

  const briefBody = description.trim().substring(0, 200);
  const supplierBriefAr = `طلب ${category} من خلال معبر. ${briefBody}`;
  const supplierBriefEn = `Request for ${category} through Maabar. ${briefBody}`;
  const supplierBriefZh = `通过 Maabar 采购 ${category}。${briefBody}`;
  const supplierBriefByLang = { ar: supplierBriefAr, en: supplierBriefEn, zh: supplierBriefZh };

  return {
    ai_status: aiStatus,
    priority,
    extracted_specs: extractedSpecs,
    cleaned_description: description.trim(),
    category,
    ai_confidence: aiConfidence,
    supplier_brief: supplierBriefByLang[lang] || supplierBriefEn,
    admin_follow_up_question: null,
    admin_internal_notes: null,
    ai_output: {
      generated_at: new Date().toISOString(),
      model: 'heuristic-fallback',
      prompt_version: 'managed_brief.v1',
      supplier_brief_all: supplierBriefByLang,
    },
  };
}

function mergePriority(buyerPriority, aiPriority) {
  if (buyerPriority === 'urgent') return 'urgent';
  return aiPriority === 'urgent' ? 'urgent' : 'normal';
}

export async function generateManagedBriefWithAI({ request, lang = 'ar' }) {
  const payload = {
    language: lang,
    title: pickByLang(request, 'title', lang),
    description: pickByLang(request, 'description', lang) || request?.description || '',
    category: request?.category || 'other',
    quantity: request?.quantity ?? null,
    budget: request?.budget_per_unit ?? null,
    budget_currency: request?.budget_currency || null,
    response_deadline: request?.response_deadline || null,
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/maabar-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ task: 'managed_brief', payload }),
    });

    if (!response.ok) {
      throw new Error(`maabar-ai managed_brief failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.result;
    if (!result || typeof result !== 'object') {
      throw new Error('maabar-ai managed_brief: empty result');
    }

    const supplierBriefAll = (result.supplier_brief && typeof result.supplier_brief === 'object')
      ? result.supplier_brief
      : null;
    const supplierBriefText = supplierBriefAll
      ? (supplierBriefAll[lang] || supplierBriefAll.en || supplierBriefAll.ar || '')
      : (typeof result.supplier_brief === 'string' ? result.supplier_brief : '');

    const aiPriority = result.priority === 'urgent' ? 'urgent' : 'normal';
    const priority = mergePriority(request?.managed_priority, aiPriority);

    return {
      ai_status: 'ready',
      priority,
      extracted_specs: Array.isArray(result.extracted_specs) ? result.extracted_specs : [],
      cleaned_description: typeof result.cleaned_description === 'string' ? result.cleaned_description : (request?.description || '').trim(),
      category: result.category || request?.category || 'other',
      ai_confidence: ['high', 'medium', 'low'].includes(result.ai_confidence) ? result.ai_confidence : 'medium',
      supplier_brief: supplierBriefText || (request?.description || '').trim(),
      admin_follow_up_question: typeof result.admin_follow_up_question === 'string' ? result.admin_follow_up_question : null,
      admin_internal_notes: typeof result.admin_internal_notes === 'string' ? result.admin_internal_notes : null,
      ai_output: {
        generated_at: new Date().toISOString(),
        model: 'maabar-ai',
        prompt_version: 'managed_brief.v1',
        supplier_brief_all: supplierBriefAll,
      },
    };
  } catch (error) {
    console.error('generateManagedBriefWithAI error:', error);
    return buildHeuristicBrief({ request, lang, aiStatus: 'failed' });
  }
}
