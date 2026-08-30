'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nestedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    timeoutRef.current = setTimeout(() => {
      setProgress(100);
      nestedTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        nestedTimeoutRef.current = null;
      }, 200);
      timeoutRef.current = null;
    }, 600);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (nestedTimeoutRef.current) {
        clearTimeout(nestedTimeoutRef.current);
        nestedTimeoutRef.current = null;
      }
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gray-200 dark:bg-gray-700">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg transition-all duration-200 ease-out relative"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
        }}
      >
        {/* Glowing tip */}
        <div 
          className="absolute top-0 right-0 w-2 h-full bg-blue-400 rounded-full shadow-lg"
          style={{
            boxShadow: '0 0 15px rgba(59, 130, 246, 1), 0 0 25px rgba(59, 130, 246, 0.8), 0 0 35px rgba(59, 130, 246, 0.6)',
            transform: 'translateX(50%)',
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8) 0%, rgba(147, 197, 253, 1) 50%, rgba(59, 130, 246, 0.8) 100%)',
          }}
        />
      </div>
    </div>
  );
}
