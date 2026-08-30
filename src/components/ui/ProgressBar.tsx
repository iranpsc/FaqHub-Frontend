'use client';

import { useEffect, useState, useRef } from 'react';

interface ProgressBarProps {
  isVisible: boolean;
  progress: number;
}

export function ProgressBar({ isVisible, progress }: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isVisible) {
      setDisplayProgress(0);
      intervalRef.current = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= progress) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return progress;
          }
          return prev + Math.random() * 10;
        });
      }, 50);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      setDisplayProgress(0);
    }
  }, [isVisible, progress]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-gray-200 dark:bg-gray-700">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg transition-all duration-200 ease-out"
        style={{
          width: `${Math.min(displayProgress, 100)}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
        }}
      />
    </div>
  );
}
