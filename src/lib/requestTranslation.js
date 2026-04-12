import { translateChatMessage } from './maabarAi/client';

const ALL_LANGS = ['ar', 'en', 'zh'];

/**
 * Translate a single text to all 3 languages.
 * Exported for use by offer-note and other single-field translation needs.
 */
export async function translateTextToAllLanguages(text, sourceLang) {
  return translateToAllLanguages(text, sourceLang);
}

/**
 * Translate `text` from `sourceLang` to every other language.
 * Returns an object like { ar: '...', en: '...', zh: '...' }.
 * The source language entry is filled with the original text; all others are
 * translated.  On individual translation failure the original text is used as
 * a fallback so submission is never blocked.
 */
async function translateToAllLanguages(text, sourceLang) {
  if (!text || !text.trim()) return { ar: '', en: '', zh: '' };

  const result = { [sourceLang]: text };

  await Promise.all(
    ALL_LANGS.filter((l) => l !== sourceLang).map(async (targetLang) => {
      try {
        const translated = await translateChatMessage({
          text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          conversationRole: 'product_request',
        });
        if (!translated) {
          console.error(`[requestTranslation] Empty response for ${sourceLang}→${targetLang}, using source text as fallback`);
        }
        result[targetLang] = translated || text;
      } catch (err) {
        console.error(`[requestTranslation] Translation failed ${sourceLang}→${targetLang}:`, err?.message || err);
        result[targetLang] = text;
      }
    })
  );

  return { ar: result.ar || text, en: result.en || text, zh: result.zh || text };
}

/**
 * Build fully translated title and description fields for a request payload.
 *
 * @param {object} params
 * @param {string} params.titleAr   - Arabic title typed by buyer (may be empty)
 * @param {string} params.titleEn   - English title typed by buyer (may be empty)
 * @param {string} params.description - Description typed by buyer
 * @param {string} params.lang      - Current UI language of the buyer ('ar'|'en'|'zh')
 * @returns {Promise<object>} Payload fields: title_ar, title_en, title_zh,
 *                            description_ar, description_en, description_zh
 */
export async function buildTranslatedRequestFields({ titleAr, titleEn, description, lang }) {
  const sourceLang = lang || 'ar';
  const tAr = (titleAr || '').trim();
  const tEn = (titleEn || '').trim();
  const desc = (description || '').trim();

  console.log('[requestTranslation] buildTranslatedRequestFields called', { sourceLang, tAr: tAr.slice(0, 40), tEn: tEn.slice(0, 40), descLen: desc.length });

  // ── Titles ────────────────────────────────────────────────────────────────
  let titles;
  if (tAr && tEn) {
    // Both provided: translate EN → ZH (EN→ZH quality is better)
    try {
      const zhTitle = await translateChatMessage({
        text: tEn,
        sourceLanguage: 'en',
        targetLanguage: 'zh',
        conversationRole: 'product_request',
      });
      titles = { ar: tAr, en: tEn, zh: zhTitle || tEn };
    } catch {
      titles = { ar: tAr, en: tEn, zh: tEn };
    }
  } else if (tAr) {
    // Only Arabic: translate to EN and ZH
    titles = await translateToAllLanguages(tAr, 'ar');
  } else if (tEn) {
    // Only English: translate to AR and ZH
    titles = await translateToAllLanguages(tEn, 'en');
  } else {
    titles = { ar: '', en: '', zh: '' };
  }

  // ── Description ───────────────────────────────────────────────────────────
  let descriptions;
  if (desc) {
    descriptions = await translateToAllLanguages(desc, sourceLang);
  } else {
    descriptions = { ar: '', en: '', zh: '' };
  }

  return {
    title_ar: titles.ar,
    title_en: titles.en,
    title_zh: titles.zh,
    description_ar: descriptions.ar,
    description_en: descriptions.en,
    description_zh: descriptions.zh,
  };
}

/**
 * Translate product name and description fields to all 3 languages.
 * Only fills in MISSING name variants; always generates desc_zh since it's new.
 *
 * @param {object} params
 * @param {string} params.nameAr
 * @param {string} params.nameEn
 * @param {string} params.nameZh
 * @param {string} params.descEn
 * @param {string} params.descAr
 * @param {string} params.lang - supplier's UI language ('ar'|'en'|'zh')
 */
export async function buildTranslatedProductFields({ nameAr, nameEn, nameZh, descEn, descAr, lang }) {
  const sourceLang = lang || 'en';
  const nAr = (nameAr || '').trim();
  const nEn = (nameEn || '').trim();
  const nZh = (nameZh || '').trim();
  const dEn = (descEn || '').trim();
  const dAr = (descAr || '').trim();

  // Pick best source for name — prefer the supplier's own lang
  let nameText = '';
  let nameLang = sourceLang;
  if (sourceLang === 'zh' && nZh)      { nameText = nZh; nameLang = 'zh'; }
  else if (sourceLang === 'ar' && nAr) { nameText = nAr; nameLang = 'ar'; }
  else if (nEn)                        { nameText = nEn; nameLang = 'en'; }
  else if (nZh)                        { nameText = nZh; nameLang = 'zh'; }
  else if (nAr)                        { nameText = nAr; nameLang = 'ar'; }

  let names = { ar: nAr, en: nEn, zh: nZh };
  if (nameText) {
    const t = await translateToAllLanguages(nameText, nameLang);
    // Only fill missing variants — don't overwrite what the supplier typed
    names = { ar: nAr || t.ar, en: nEn || t.en, zh: nZh || t.zh };
  }

  // Pick best source for description
  let descText = '';
  let descLang = sourceLang;
  if (sourceLang === 'ar' && dAr) { descText = dAr; descLang = 'ar'; }
  else if (dEn)                   { descText = dEn; descLang = 'en'; }
  else if (dAr)                   { descText = dAr; descLang = 'ar'; }

  let descs = { ar: dAr, en: dEn, zh: '' };
  if (descText) {
    const t = await translateToAllLanguages(descText, descLang);
    descs = {
      ar: dAr || t.ar,
      en: dEn || t.en,
      zh: t.zh, // always populate desc_zh — it's a new column
    };
  }

  return {
    name_ar: names.ar,
    name_en: names.en,
    name_zh: names.zh,
    desc_ar: descs.ar,
    desc_en: descs.en,
    desc_zh: descs.zh || null,
  };
}
