const DEFAULT_PRODUCTION_ORIGIN = 'https://maabar.io';
export const AUTH_CALLBACK_PATH = '/auth/callback';

const AUTH_CALLBACK_KEYS = [
  'code',
  'token_hash',
  'access_token',
  'refresh_token',
  'error',
  'error_description',
  'error_code',
];

function buildParams(raw = '') {
  return new URLSearchParams((raw || '').replace(/^#/, ''));
}

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

export function hasAuthCallbackPayload(search = '', hash = '') {
  const searchParams = buildParams(search);
  const hashParams = buildParams(hash);

  return AUTH_CALLBACK_KEYS.some((key) => searchParams.has(key) || hashParams.has(key));
}

export function buildAuthCallbackPath(search = '', hash = '') {
  return `${AUTH_CALLBACK_PATH}${search || ''}${hash || ''}`;
}

export function buildAuthCallbackUrl(nextPath = '/dashboard', role = '') {
  const url = new URL(AUTH_CALLBACK_PATH, getAppOrigin());
  url.searchParams.set('next', sanitizeNextPath(nextPath));
  if (role) url.searchParams.set('role', role);
  return url.toString();
}
