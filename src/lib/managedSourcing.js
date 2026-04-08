export function isManagedRequest(request) {
  return request?.type === 'managed' || request?.is_managed === true;
}

export async function generateManagedBriefWithAI() {
  return null;
}