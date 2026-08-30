'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useProgress } from '@/contexts/ProgressContext';

/**
 * Legacy hook for progress bar tied to ProgressContext.
 * The app uses NavigationProgress in layout instead (single implementation).
 * If you use this hook, ensure ProgressProvider wraps the tree.
 */
export function useRouterProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { startProgress, setProgress, completeProgress } = useProgress();
  const isNavigating = useRef(false);
  const progressRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isNavigating.current) return;

    isNavigating.current = true;
    progressRef.current = 0;
    startProgress();

    intervalRef.current = setInterval(() => {
      progressRef.current += Math.random() * 15;
      if (progressRef.current >= 90) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setProgress(90);
      } else {
        setProgress(progressRef.current);
      }
    }, 100);

    timeoutRef.current = setTimeout(() => {
      completeProgress();
      isNavigating.current = false;
      progressRef.current = 0;
      timeoutRef.current = null;
    }, 800);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isNavigating.current = false;
      progressRef.current = 0;
    };
  }, [pathname, searchParams, startProgress, setProgress, completeProgress]);
}
