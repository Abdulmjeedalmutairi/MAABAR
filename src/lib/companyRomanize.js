/**
 * Company-name ROMANIZATION (pinyin), deliberately separate from the AI
 * translation pipeline (aiTranslate.js / TranslatedText / chat_translation).
 *
 * Romanization ≠ translation: a Chinese company name is rendered in Latin
 * script (pinyin for proper nouns + conventional English for legal suffixes),
 * never machine-translated into Arabic. The heavy lifting is done server-side
 * by the maabar-ai `company_romanization` task, which also persists the result
 * to profiles.company_name_latin — so this is generate-once, then read the
 * column forever after.
 *
 * Display rule everywhere: `company_name_latin || company_name` (never blank).
 * Generation is lazy + self-healing: the first buyer to open a Chinese-named
 * supplier's profile triggers it; every later view (and the directory list)
 * reads the cached column.
 */

import {
  MAABAR_AI_ENDPOINT,
  MAABAR_AI_HEADERS,
  MAABAR_AI_PERSONA_NAME,
  MAABAR_AI_TASKS,
} from './maabarAi/config';

// CJK Unified Ideographs — same block aiTranslate.detectSourceLang uses for zh.
const CJK = /[一-鿿]/;

export function hasChinese(text) {
  return typeof text === 'string' && CJK.test(text);
}

/** Synchronous display name — the Latin column if present, else the raw name. */
export function resolveCompanyName(supplier) {
  const latin = (supplier?.company_name_latin || '').trim();
  if (latin) return latin;
  return supplier?.company_name || '';
}

/** True when this supplier needs romanization generated (Chinese name, no Latin yet). */
export function needsRomanization(supplier) {
  return hasChinese(supplier?.company_name) && !(supplier?.company_name_latin || '').trim();
}

// Dedup so a session never fires the same supplier twice (across list + profile).
// Value: Promise<string|null> resolving to the Latin name (or null on failure).
const inflight = new Map();

/**
 * Lazily romanize a supplier's Chinese company name via the edge task (which
 * persists it). Resolves to the Latin string, or null if not needed / failed.
 * Never throws — a failure just means the UI keeps showing the raw name.
 *
 * @param {{id?: string, company_name?: string, company_name_latin?: string}} supplier
 * @returns {Promise<string|null>}
 */
export async function ensureCompanyRomanization(supplier) {
  if (!needsRomanization(supplier)) return null;
  const id = supplier?.id;
  const name = supplier.company_name;
  const key = id || name;
  if (inflight.has(key)) return inflight.get(key);

  const task = (async () => {
    try {
      const res = await fetch(MAABAR_AI_ENDPOINT, {
        method: 'POST',
        headers: MAABAR_AI_HEADERS,
        body: JSON.stringify({
          task: MAABAR_AI_TASKS.COMPANY_ROMANIZATION,
          personaName: MAABAR_AI_PERSONA_NAME,
          payload: { id, name },
        }),
      });
      const data = await res.json().catch(() => ({}));
      const latin = (data?.latin || '').trim();
      if (!res.ok || !data?.romanized || !latin || latin === name) return null;
      return latin;
    } catch {
      return null;
    }
  })();

  inflight.set(key, task);
  return task;
}
