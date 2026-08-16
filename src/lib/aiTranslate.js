/**
 * Buyer-side AI translation helper.
 *
 * Wraps the existing translateChatMessage() from maabarAi/client.js (which
 * calls the maabar-ai edge function with task=chat_translation and falls
 * back to Ai-proxy automatically) and adds:
 *   - lightweight source-language detection (CJK / Arabic / English)
 *   - graceful fallback: any failure returns the original text untouched
 *     and an `error` flag so the UI can suppress the "AI translated" pill
 *
 * Two-tier cache: an in-memory Map for instant same-page hits, plus localStorage
 * so each text is translated by the API only once, ever — reused on every later
 * page load / reopen (mirrors the mobile aiTranslate's AsyncStorage persistence).
 */

import { translateChatMessage } from './maabarAi/client';

const SUPPORTED = ['ar', 'en', 'zh'];

// Two-tier cache. Key: `${sourceLang}|${targetLang}|${text}`.
//   1. in-memory Map — instant hits within the same page session.
//   2. localStorage  — persists each translation across reloads/reopens, so a
//      given text is sent to the API only once, ever.
const cache = new Map();
const STORE_PREFIX = 'mtr|';   // maabar translation cache (localStorage)

export function detectSourceLang(text) {
  if (!text || typeof text !== 'string') return 'en';
  // CJK Unified Ideographs (covers most simplified + traditional Chinese)
  if (/[一-鿿]/.test(text)) return 'zh';
  // Arabic (incl. Arabic Supplement, but the basic block is enough for our content)
  if (/[؀-ۿ]/.test(text)) return 'ar';
  return 'en';
}

/**
 * Translate `text` from its detected (or hinted) source language to
 * `targetLang`. Always resolves — never throws. Same-language input,
 * empty input, and API failures all return `{ translated: <input>, error }`.
 *
 * @param {string} text
 * @param {'ar'|'en'|'zh'} targetLang
 * @param {'ar'|'en'|'zh'} [sourceLangHint] - skip detection if known
 * @returns {Promise<{translated: string, sourceLang: string, error: string|null}>}
 */
/**
 * Synchronous cache peek — returns the already-cached translation (in-memory or
 * localStorage) or null, WITHOUT any API call. Lets a component render a cached
 * translation on first paint instead of flashing the original then swapping in.
 * @returns {string|null}
 */
export function peekTranslation(text, targetLang, sourceLangHint) {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;
  const target = SUPPORTED.includes(targetLang) ? targetLang : 'en';
  const source = SUPPORTED.includes(sourceLangHint) ? sourceLangHint : detectSourceLang(trimmed);
  if (source === target) return null;

  const cacheKey = `${source}|${target}|${trimmed}`;
  if (cache.has(cacheKey)) {
    const hit = cache.get(cacheKey);
    return hit && !hit.error ? hit.translated : null;
  }
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(`${STORE_PREFIX}${cacheKey}`) : null;
    if (saved != null) {
      cache.set(cacheKey, { translated: saved, sourceLang: source, error: null });
      return saved;
    }
  } catch { /* storage unavailable — treat as a miss */ }
  return null;
}

export async function translateText(text, targetLang, sourceLangHint) {
  const trimmed = (text || '').trim();
  if (!trimmed) return { translated: '', sourceLang: targetLang || 'en', error: null };

  const target = SUPPORTED.includes(targetLang) ? targetLang : 'en';
  const source = SUPPORTED.includes(sourceLangHint) ? sourceLangHint : detectSourceLang(trimmed);

  if (source === target) {
    return { translated: trimmed, sourceLang: source, error: null };
  }

  const cacheKey = `${source}|${target}|${trimmed}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Persistent hit — already translated on a previous page load. No API call.
  const storeKey = `${STORE_PREFIX}${cacheKey}`;
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(storeKey) : null;
    if (saved != null) {
      const hit = { translated: saved, sourceLang: source, error: null };
      cache.set(cacheKey, hit);
      return hit;
    }
  } catch { /* storage unavailable (private mode / quota) — fall through to API */ }

  try {
    const translated = await translateChatMessage({
      text: trimmed,
      sourceLanguage: source,
      targetLanguage: target,
      conversationRole: 'supplier_profile',
    });
    const ok = typeof translated === 'string' && translated.trim().length > 0;
    const result = {
      translated: ok ? translated.trim() : trimmed,
      sourceLang: source,
      error: ok ? null : 'empty_response',
    };
    cache.set(cacheKey, result);
    // Persist only real translations so the next page load reuses them.
    if (ok) { try { localStorage.setItem(storeKey, result.translated); } catch { /* quota/full — ignore */ } }
    return result;
  } catch (err) {
    const result = {
      translated: trimmed,
      sourceLang: source,
      error: err?.message || 'translation_failed',
    };
    cache.set(cacheKey, result);
    return result;
  }
}
