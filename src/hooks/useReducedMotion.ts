import { useEffect } from 'react';
import { useStore } from '../store/useStore';

/**
 * Syncs the OS "prefers-reduced-motion" setting into app state.
 * When reduced motion is requested, animations are stepped without tweening.
 */
export function useReducedMotionSync(): void {
  const setReducedMotion = useStore((s) => s.setReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [setReducedMotion]);
}
