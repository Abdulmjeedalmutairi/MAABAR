/**
 * <TranslatedText> — buyer-side async AI translation component.
 *
 * Renders the original text immediately (no blocking), then kicks off an
 * async translation. When the translation lands, it swaps in and shows a
 * subtle "AI translated" pill plus a toggle to view the original.
 *
 * Design choices:
 *   - Async-first: the page never waits for the API. If the call is slow
 *     or fails, the trader still sees the original text.
 *   - Silent failure: an API error keeps the original text visible without
 *     surfacing an error UI to the buyer (the spTranslationUnavailable key
 *     is wired up as aria-label only).
 *   - Cache: aiTranslate.js holds an in-memory Map keyed by
 *     source|target|text — the same description rendered twice on one page
 *     (or toggled back and forth) costs one network call total.
 *   - Same-language passthrough: when detected source === target, no API
 *     call is made and no pill is shown — just plain text.
 */

import React, { useEffect, useRef, useState } from 'react';
import { detectSourceLang, translateText } from '../lib/aiTranslate';
import { T } from '../lib/supplierDashboardConstants';

export default function TranslatedText({
  text,
  lang,                 // viewer's UI language ('ar' | 'en' | 'zh')
  targetLang,           // optional override; defaults to `lang`
  className,
  style,
}) {
  const tT = T[lang] || T.en;
  const isAr = lang === 'ar';
  const trimmed = (text || '').trim();
  const target = targetLang || lang || 'en';
  const sourceLang = detectSourceLang(trimmed);
  const needsTranslation = trimmed.length > 0 && sourceLang !== target;

  const [translated, setTranslated] = useState(null); // null = not yet loaded
  const [showOriginal, setShowOriginal] = useState(false);
  const [translationFailed, setTranslationFailed] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setTranslated(null);
    setTranslationFailed(false);

    if (!needsTranslation) return undefined;

    (async () => {
      const { translated: result, error } = await translateText(trimmed, target, sourceLang);
      if (cancelledRef.current) return;
      if (error) {
        setTranslationFailed(true);
        return;
      }
      setTranslated(result);
    })();

    return () => { cancelledRef.current = true; };
  }, [trimmed, target, sourceLang, needsTranslation]);

  if (!trimmed) return null;

  // Same language → no pill, no toggle, just text in the parent's style.
  if (!needsTranslation) {
    return <span className={className} style={style}>{trimmed}</span>;
  }

  const showingTranslation = translated !== null && !showOriginal;
  const visibleText = showingTranslation ? translated : trimmed;
  // Direction: source-script when showing original, viewer-script when translated.
  const dirAttr = showingTranslation
    ? (target === 'ar' ? 'rtl' : 'ltr')
    : (sourceLang === 'ar' ? 'rtl' : 'ltr');

  const fontFamily = showingTranslation
    ? (isAr ? "'Tajawal', sans-serif" : 'inherit')
    : (sourceLang === 'ar' ? "'Tajawal', sans-serif" : 'inherit');

  return (
    <span className={className} style={style}>
      <span dir={dirAttr} style={{ fontFamily }}>{visibleText}</span>
      {translated !== null && (
        <span style={{ display: 'block', marginTop: 8, lineHeight: 1.5 }}>
          <span
            title={tT.spAiTranslated}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(45,122,79,0.06)',
              border: '1px solid rgba(45,122,79,0.18)',
              color: '#2d7a4f',
              fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)',
              fontSize: 10,
              letterSpacing: 0.4,
              verticalAlign: 'middle',
            }}
          >
            ✨ {tT.spAiTranslated}
          </span>
          <button
            type="button"
            onClick={() => setShowOriginal(prev => !prev)}
            style={{
              marginInlineStart: 8,
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 11,
              color: 'var(--text-secondary)',
              fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'var(--border-subtle)',
              verticalAlign: 'middle',
            }}
          >
            {showingTranslation ? tT.spShowOriginal : tT.spShowTranslation}
          </button>
        </span>
      )}
      {translationFailed && (
        <span aria-label={tT.spTranslationUnavailable} style={{ display: 'none' }} />
      )}
    </span>
  );
}
