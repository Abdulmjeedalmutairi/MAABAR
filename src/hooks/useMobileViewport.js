import { useEffect } from 'react';

function setViewportVars() {
  const root = document.documentElement;
  const visualViewport = window.visualViewport;
  const viewportHeight = visualViewport?.height || window.innerHeight;
  const viewportWidth = visualViewport?.width || window.innerWidth;
  const viewportTop = visualViewport?.offsetTop || 0;
  const viewportLeft = visualViewport?.offsetLeft || 0;

  root.style.setProperty('--app-dvh', `${viewportHeight}px`);
  root.style.setProperty('--app-vw', `${viewportWidth}px`);
  root.style.setProperty('--vv-top', `${viewportTop}px`);
  root.style.setProperty('--vv-left', `${viewportLeft}px`);

  const keyboardInset = Math.max(0, window.innerHeight - viewportHeight - viewportTop);
  root.style.setProperty('--keyboard-inset', `${keyboardInset}px`);
  root.dataset.keyboardOpen = keyboardInset > 120 ? 'true' : 'false';
}

export default function useMobileViewport() {
  useEffect(() => {
    setViewportVars();

    let raf = null;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(setViewportVars);
    };

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    window.visualViewport?.addEventListener('resize', onResize, { passive: true });
    window.visualViewport?.addEventListener('scroll', onResize, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
    };
  }, []);
}
