'use client';

import { useState, useEffect } from 'react';
import { Header, Sidebar, Footer } from './index';
import { QuestionModal } from '@/components/QuestionModal';
import { AuthDialog } from '@/components/AuthDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Question } from '@/services/api';
import clsx from 'clsx';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  // Initialize theme and handle responsive behavior
  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    setMounted(true);
    
    // Set initial sidebar state — open only on xl+ screens; closed on medium/tablet
    const isLargeScreen = window.innerWidth >= 1280;
    setSidebarOpen(isLargeScreen);

    // Initialize theme
    const savedThemeMode = localStorage.getItem('themeMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialThemeMode = savedThemeMode === 'dark'
      ? 'dark'
      : savedThemeMode === 'light'
        ? 'light'
        : prefersDark
          ? 'dark'
          : 'light';
    setThemeMode(initialThemeMode);
    
    setTheme(initialThemeMode);
    
    // Apply theme to document
    if (initialThemeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Handle resize
    const handleResize = () => {
      const isLargeScreen = window.innerWidth >= 1280;
      setSidebarOpen(isLargeScreen);
    };

    // Handle keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleMobileSearch = () => {
    setMobileSearchOpen(!mobileSearchOpen);
  };

  const handleThemeChange = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    
    setTheme(mode);
    
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleMainAction = () => {
    if (isAuthenticated) {
      setQuestionToEdit(null);
      setShowQuestionModal(true);
    } else {
      setShowAuthDialog(true);
    }
  };

  const handleQuestionCreated = async () => {
    setShowQuestionModal(false);
    // Dispatch custom event to refresh questions list
    window.dispatchEvent(new CustomEvent('questions:refresh'));
  };

  const handleQuestionUpdated = async () => {
    setShowQuestionModal(false);
    setQuestionToEdit(null);
    // Dispatch custom event to refresh questions list
    window.dispatchEvent(new CustomEvent('questions:refresh'));
  };

  return (
    <div className="app-container bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div 
        className={clsx(
          'flex flex-col flex-grow transition-colors duration-300 mr-0',
          {
            'xl:mr-80': !mounted || sidebarOpen,
            'xl:mr-16': mounted && !sidebarOpen
          }
        )}
        style={{ width: '-webkit-fill-available' }}
      >
        <Header 
          sidebarOpen={mounted ? sidebarOpen : false} 
          onToggleSidebar={toggleSidebar} 
          onMainAction={handleMainAction}
          mobileSearchOpen={mobileSearchOpen}
          onToggleMobileSearch={toggleMobileSearch}
        />
        <main className="flex-1">
          {children}
        </main>
        <Footer onAskQuestion={handleMainAction} />
      </div>
      
      <Sidebar 
        isOpen={mounted ? sidebarOpen : false} 
        mounted={mounted}
        theme={theme} 
        themeMode={themeMode}
        onToggle={toggleSidebar} 
        onThemeChange={handleThemeChange} 
      />


      {/* Overlay for mobile/tablet/medium screens */}
      {mounted && sidebarOpen && (
        <div 
          onClick={closeSidebar} 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
        />
      )}

      {/* Question Modal */}
      <QuestionModal
        visible={showQuestionModal}
        questionToEdit={questionToEdit}
        onClose={() => setShowQuestionModal(false)}
        onQuestionCreated={handleQuestionCreated}
        onQuestionUpdated={handleQuestionUpdated}
      />

      {/* Auth Dialog */}
      <AuthDialog
        visible={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />
    </div>
  );
}
