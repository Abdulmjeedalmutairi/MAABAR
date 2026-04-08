export function isManagedRequest(request) {
  return request?.type === 'managed' || request?.is_managed === true;
}

export function buildManagedBriefRow() { return null; }

export function getManagedVerificationLevel() { return null; }

export async function generateManagedBriefWithAI() {
  return null;
}