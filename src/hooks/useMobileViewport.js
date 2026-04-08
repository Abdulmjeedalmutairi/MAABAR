import { useEffect } from 'react';

export default function useMobileViewport() {
  useEffect(() => {
    const setVh = () => {
      document.documentElement.style.setProperty('--app-dvh', `${window.innerHeight}px`);
      document.documentElement.style.setProperty('--app-vw', `${window.innerWidth}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);
}
