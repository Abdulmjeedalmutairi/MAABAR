const DEFAULT_PRODUCTION_ORIGIN = 'https://maabar.io';

export function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return process.env.REACT_APP_APP_URL || DEFAULT_PRODUCTION_ORIGIN;
}

export function sanitizeNextPath(nextPath) {
  if (!nextPath || typeof nextPath !== 'string') return '/dashboard';
  if (!nextPath.startsWith('/')) return '/dashboard';
  if (nextPath.startsWith('//')) return '/dashboard';
  return nextPath;
}

export function buildAuthCallbackUrl(nextPath = '/dashboard', role = '') {
  const url = new URL('/auth/callback', getAppOrigin());
  url.searchParams.set('next', sanitizeNextPath(nextPath));
  if (role) url.searchParams.set('role', role);
  return url.toString();
}
