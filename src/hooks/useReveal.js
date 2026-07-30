import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal: fade-in + slide-up each `.reveal` descendant once as it enters
 * the viewport. Extracted from Home.jsx so every request-first surface shares one
 * implementation. Respects prefers-reduced-motion and gracefully no-ops without
 * IntersectionObserver (everything shown immediately).
 *
 * Attach the returned ref to the scroll container. Pass deps that change when the
 * revealable content (re)renders — e.g. [lang, loading, items.length] — so nodes
 * added after an async load get observed too.
 *
 *   const revealRef = useReveal([lang, loading]);
 *   <div ref={revealRef}> …cards with className="reveal"… </div>
 */
export default function useReveal(deps = []) {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal:not(.is-visible)');
    if (!els.length) return;

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
