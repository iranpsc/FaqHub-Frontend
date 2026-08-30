'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';

interface ProgressContextType {
  isVisible: boolean;
  progress: number;
  startProgress: () => void;
  setProgress: (progress: number) => void;
  completeProgress: () => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) {
        clearTimeout(completeTimeoutRef.current);
        completeTimeoutRef.current = null;
      }
    };
  }, []);

  const startProgress = useCallback(() => {
    setIsVisible(true);
    setProgress(10);
  }, []);

  const completeProgress = useCallback(() => {
    if (completeTimeoutRef.current) {
      clearTimeout(completeTimeoutRef.current);
      completeTimeoutRef.current = null;
    }
    setProgress(100);
    completeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      completeTimeoutRef.current = null;
    }, 200);
  }, []);

  const resetProgress = useCallback(() => {
    setIsVisible(false);
    setProgress(0);
  }, []);

  const value: ProgressContextType = {
    isVisible,
    progress,
    startProgress,
    setProgress,
    completeProgress,
    resetProgress,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
