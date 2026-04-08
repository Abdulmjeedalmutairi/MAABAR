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
    admin_internal_notes: null,
    admin_follow_up_question: null,
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

export async function generateManagedBriefWithAI({ request, lang = 'ar' }) {
  // Generate AI brief for managed request
  // This is a stub implementation that should be replaced with actual AI call
  
  const description = request.description || '';
  const category = request.category || 'other';
  
  // Simple extraction for demo purposes
  const extractedSpecs = [];
  if (description.includes('كجم') || description.includes('kg')) extractedSpecs.push('weight');
  if (description.includes('لون') || description.includes('color')) extractedSpecs.push('color');
  if (description.includes('مقاس') || description.includes('size')) extractedSpecs.push('size');
  if (description.includes('مادة') || description.includes('material')) extractedSpecs.push('material');
  
  // Determine priority based on request
  let priority = 'normal';
  if (request.urgency === 'high' || request.response_deadline) {
    priority = 'urgent';
  }
  
  // Determine AI confidence based on description length
  const aiConfidence = description.length > 50 ? 'high' : 
                       description.length > 20 ? 'medium' : 'low';
  
  // Generate supplier brief in appropriate language
  let supplierBrief = '';
  if (lang === 'ar') {
    supplierBrief = `طلب ${category} من خلال معبر. ${description.substring(0, 200)}`;
  } else if (lang === 'zh') {
    supplierBrief = `通过Maabar采购${category}。${description.substring(0, 200)}`;
  } else {
    supplierBrief = `Request for ${category} through Maabar. ${description.substring(0, 200)}`;
  }
  
  return {
    ai_status: 'ready',
    priority,
    extracted_specs: extractedSpecs,
    cleaned_description: description.trim(),
    category,
    ai_confidence: aiConfidence,
    ai_output: {
      generated_at: new Date().toISOString(),
      model: 'stub',
      notes: 'This is a stub implementation. Replace with actual AI call.',
    },
    supplier_brief: supplierBrief,
  };
}