/**
 * Buyer-side AI translation helper.
 *
 * Wraps the existing translateChatMessage() from maabarAi/client.js (which
 * calls the maabar-ai edge function with task=chat_translation and falls
 * back to Ai-proxy automatically) and adds:
 *   - lightweight source-language detection (CJK / Arabic / English)
 *   - in-memory cache keyed by source|target|text, so repeated reads of the
 *     same supplier description on the same page never re-hit the API
 *   - graceful fallback: any failure returns the original text untouched
 *     and an `error` flag so the UI can suppress the "AI translated" pill
 *
 * The cache lives only for the page session (refresh clears it). That's
 * intentional for v1 — most traders view one supplier at a time and the
 * latency cost on refresh is one round-trip per field.
 */

import { translateChatMessage } from './maabarAi/client';

const SUPPORTED = ['ar', 'en', 'zh'];

// Module-level cache. Key: `${sourceLang}|${targetLang}|${text}`.
// Value: { translated, sourceLang, error }.
const cache = new Map();

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
