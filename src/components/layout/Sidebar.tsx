'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  ChevronLeft, 
  Home, 
  Grid3X3, 
  Tag, 
  Clock, 
  Users, 
  Newspaper, 
  UserCheck, 
  Info, 
  Mail, 
  Globe, 
  LogIn, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { BaseButton } from '@/components/ui/BaseButton';
import { BaseAvatar } from '@/components/ui/BaseAvatar';
import { userAvatarSrc } from '@/lib/avatar';
import { BaseBadge } from '@/components/ui/BaseBadge';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';


interface SidebarProps {
  isOpen: boolean;
  mounted?: boolean;
  theme: 'light' | 'dark';
  themeMode: 'light' | 'dark';
  onToggle: () => void;
  onThemeChange: (mode: 'light' | 'dark') => void;
}

export function Sidebar({ isOpen, mounted = false, theme, themeMode, onToggle, onThemeChange }: SidebarProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  
  // Get authentication state from context
  const { user, isAuthenticated, login, logout, isLoginLoading, isLogoutLoading } = useAuth();

  const logoUrl = '/assets/icons/main-logo.PNG';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const onThemeClick = (mode: 'light' | 'dark') => {
    onThemeChange(mode);
  };

  const toggleCollapsedTheme = () => {
    const nextMode = themeMode === 'light' ? 'dark' : 'light';
    onThemeChange(nextMode);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };


  const handleMenuItemClick = () => {
    // Close sidebar when menu item is clicked (only on mobile screens)
    if (window.innerWidth < 1280) {
      onToggle();
    }
    // Also close user dropdown if it's open
    setUserDropdownOpen(false);
  };

  // Swipe detection functions for mobile devices
  // Swipe right from left edge (50px) to open sidebar
  // Swipe left anywhere to close sidebar
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe
    const maxVerticalDistance = 100; // Maximum vertical movement to consider it a horizontal swipe

    // Check if it's a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaY) > maxVerticalDistance) {
      setIsSwiping(false);
      return;
    }

    // Swipe right to open sidebar (only when sidebar is closed)
    if (deltaX > minSwipeDistance && !isOpen) {
      onToggle();
    }
    // Swipe left to close sidebar (only when sidebar is open)
    else if (deltaX < -minSwipeDistance && isOpen) {
      onToggle();
    }
    
    setIsSwiping(false);
  };

  // Add touch event listeners for mobile swipe detection
  useEffect(() => {
    const handleGlobalTouchStart = (e: TouchEvent) => {
      // Only handle swipes on mobile screens (width < 1024px)
      if (window.innerWidth >= 1280) return;
      
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      // Only handle swipes on mobile screens (width < 1024px)
      if (window.innerWidth >= 1280) return;
      
      touchEndX.current = e.changedTouches[0].clientX;
      touchEndY.current = e.changedTouches[0].clientY;
      const deltaX = touchEndX.current - touchStartX.current;
      const deltaY = touchEndY.current - touchStartY.current;
      const minSwipeDistance = 50;
      const maxVerticalDistance = 100;

      // Check if it's a horizontal swipe (not vertical scroll)
      if (Math.abs(deltaY) > maxVerticalDistance) {
        return;
      }

      // Swipe right to open sidebar (only when sidebar is closed and swipe starts from left edge)
      if (deltaX > minSwipeDistance && !isOpen && touchStartX.current < 50) {
        // Add haptic feedback simulation
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onToggle();
      }
      // Swipe left to close sidebar (only when sidebar is open)
      else if (deltaX < -minSwipeDistance && isOpen) {
        // Add haptic feedback simulation
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        onToggle();
      }
    };

    // Add global touch listeners for swipe detection
    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isOpen, onToggle]);

  const navigationItems = [
    { href: '/', icon: Home, label: 'خانه' },
    { href: '/categories', icon: Grid3X3, label: 'دسته بندی ها' },
    { href: '/tags', icon: Tag, label: 'برچسب ها' },
    { href: '/activities', icon: Clock, label: 'فعالیت ها' },
    { href: '/authors', icon: Users, label: 'فعالان انجمن' },
    { href: '/news', icon: Newspaper, label: 'اخبار متاورس' },
    { href: '/metaverse', icon: UserCheck, label: 'انجمن متاورس' },
    { href: '/about', icon: Info, label: 'درباره ما' },
    { href: '/contact', icon: Mail, label: 'ارتباط با ما' },
    { href: '#language', icon: Globe, label: 'زبان' },
  ];

  return (
    <aside
      ref={sidebarRef}
      className={clsx(
        'sidebar-container fixed right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50 transform transition-all duration-300 ease-in-out flex flex-col xl:translate-x-0',
        {
          // Mobile widths and slide-in behavior
          'w-80': isOpen,
          'w-16': !isOpen,
          'translate-x-0': isOpen,
          'translate-x-full xl:translate-x-0': !isOpen,
          // Desktop widths: default open to avoid CLS before mount; collapse after mount when closed
          'xl:w-80': !mounted || isOpen,
          'xl:w-16': mounted && !isOpen,
          'opacity-90': isSwiping,
          'opacity-100': !isSwiping
        }
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toggle Button (when collapsed) */}
      {!isOpen && (
        <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0 p-2">
          <button 
            onClick={onToggle} 
            aria-label="باز کردن منو" 
            className="p-2 rounded-full"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      )}

      {/* Fixed Header */}
      <div className={clsx(
        'flex items-center justify-between border-b border-gray-200 dark:border-gray-700 flex-shrink-0',
        { 'p-4': isOpen, 'p-2 pr-[10px]': !isOpen }
      )}>
        <div className={clsx('flex items-center gap-3', { 'flex-1': isOpen })}>
          <Link href="/">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center">
                <Image 
                  src={logoUrl} 
                  alt="انجمن حم" 
                  width={30} 
                  height={30}
                  className="w-full h-full object-contain rounded-full" 
                />
              </div>
            </div>
          </Link>
          <Link 
            href="/" 
            className={clsx(
              'text-right transition-all duration-300',
              { 
                'opacity-100 flex-1': isOpen, 
                'opacity-0 w-0 overflow-hidden': !isOpen 
              }
            )}
          >
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
              انجمن حم
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              پرسش و پاسخ عمومی
            </p>
          </Link>
        </div>
        
        {/* Toggle Button (when expanded) */}
        {isOpen && (
          <button 
            onClick={onToggle} 
            aria-label="بستن منو"
            className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all duration-300 flex-shrink-0"
          >
            <ChevronLeft className="rotate-180 w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      {/* Fixed User Profile Section */}
      <div className={clsx(
        'border-b border-gray-200 dark:border-gray-700 flex-shrink-0 w-full',
        { 'p-4': isOpen, 'px-0 pr-[10px]': !isOpen }
      )}>
        {isAuthenticated && user !== null ? (
          <div className={clsx('flex items-center gap-3', { 'mb-4': isOpen, 'mb-0 py-2 w-full': !isOpen })}>
            {/* User Profile with Collapsible Menu (when expanded) */}
            {isOpen ? (
              <div className="flex-1">
                <button 
                  onClick={toggleUserDropdown} 
                  aria-expanded={userDropdownOpen}
                  aria-label="باز کردن منوی کاربر"
                  className="flex items-center gap-3 w-full p-2 rounded-lg transition-colors outline-none focus:outline-none focus:ring-0 focus:border-0"
                >
                  <BaseAvatar 
                    src={userAvatarSrc(user)} 
                    name={user?.name || 'User'} 
                    size="md"
                    status="online"
                  />
                  <div className="text-right flex-1">
                    <h4 className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {user?.name}
                    </h4>
                    {user?.score !== undefined && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        امتیاز:
                        <BaseBadge variant="primary" size="xs" className="mr-1">
                          {user.score}
                        </BaseBadge>
                      </p>
                    )}
                    {user?.level_name && typeof user.level_name === 'string' ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        سطح:
                        <BaseBadge variant="secondary" size="xs" className="mr-1">
                          {user.level_name}
                        </BaseBadge>
                      </p>
                    ) : null}
                  </div>
                  <svg 
                    className={clsx(
                      'w-4 h-4 text-gray-400 transition-transform duration-200',
                      { 'rotate-180': userDropdownOpen }
                    )} 
                    fill="none" 
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Menu Content */}
                <div 
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: userDropdownOpen ? '200px' : '0px' }}
                >
                  <div className="mt-2 ml-4 space-y-1">
                    <Link 
                      href="/profile" 
                      onClick={handleMenuItemClick}
                      className={clsx(
                        'dropdown-item flex items-center gap-3 px-4 py-2 text-xs md:text-sm rounded-lg transition-colors focus:outline-none ',
                        {
                          'text-gray-700 hover:bg-gray-100': theme === 'light',
                          'text-gray-300 hover:bg-gray-700': theme === 'dark'
                        }
                      )}
                      role="menuitem"
                    >
                      <svg className="w-4 h-4 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      پروفایل
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Collapsed view - just avatar */
              <div className="flex items-center justify-center">
                <BaseAvatar 
                  src={userAvatarSrc(user)} 
                  name={user?.name || 'User'} 
                  size="md"
                  status="online"
                />
              </div>
            )}
          </div>
        ) : (
          /* Guest User Section */
          <div className={clsx('flex items-center gap-3', { 'mb-4': isOpen, 'mb-0': !isOpen })}>
            <BaseAvatar size="md" variant="secondary" />
            <div className={clsx(
              'text-right flex-1 transition-all duration-300',
              { 'opacity-100': isOpen, 'opacity-0 w-0 overflow-hidden': !isOpen }
            )}>
              <h4 className="text-xs md:text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                کاربر مهمان
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">برای ورود کلیک کنید</p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Menu Items */}
      <div className="flex-1 overflow-y-auto scrollable-menu">
        <nav className={clsx({ 'p-4': isOpen, 'p-2': !isOpen })}>
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <li key={item.href}>
                    <Link 
                      href={item.href} 
                      onClick={handleMenuItemClick}
                      className={clsx(
                        'flex items-center rounded-lg transition-colors focus:outline-none',
                        {
                          'gap-3 p-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': isOpen && !isActive,
                          'p-2 justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isOpen && !isActive,
                          'gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-4 border-blue-500': isOpen && isActive,
                          'p-2 justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-r-4 border-blue-500': !isOpen && isActive
                        }
                      )}
                    >
                      <Icon className={clsx(
                        'w-4 h-4 md:w-7 md:h-7 flex-shrink-0',
                        isActive 
                          ? 'text-blue-500 dark:text-blue-400' 
                          : 'text-gray-400 dark:text-gray-500'
                      )} />
                      <span className={clsx(
                        'text-xs md:text-base transition-all duration-300 whitespace-nowrap mt-2',
                        { 'opacity-100': isOpen, 'opacity-0 w-0 overflow-hidden': !isOpen }
                      )}>
                        {item.label}
                      </span>
                    </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Fixed Footer Actions */}
      <div className={clsx(
        'border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800',
        { 'p-4': isOpen, 'p-2': !isOpen }
      )}>
        {/* Login Button (only for guests) */}
        {!isAuthenticated && isOpen && (
          <BaseButton 
            onClick={handleLogin} 
            variant="primary" 
            size="lg" 
            block
            disabled={isLoginLoading}
            className="mb-4 flex justify-between"
            aria-label='login '
          >
            {isLoginLoading ? (
              <svg className="w-4 h-4 md:w-7 md:h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <LogIn className="w-4 h-4 md:w-7 md:h-7" />
            )}
            <span>{isLoginLoading ? 'در حال ورود...' : 'ورود'}</span>
          </BaseButton>
        )}

        {/* Logout Button (only for authenticated users) */}
        {isAuthenticated && isOpen && (
          <BaseButton 
            onClick={handleLogout} 
            variant="danger" 
            size="lg" 
            block
            disabled={isLogoutLoading}
            className="mb-4 flex justify-between"
            aria-label='log out '
          >
            {isLogoutLoading ? (
              <svg className="w-4 h-4 md:w-7 md:h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <LogOut className="w-4 h-4 md:w-7 md:h-7" />
            )}
            <span>{isLogoutLoading ? 'در حال خروج...' : 'خروج'}</span>
          </BaseButton>
        )}

        {/* Theme Toggle (Expanded) */}
        {isOpen && (
          <div className="flex w-full bg-gray-100 dark:bg-gray-700 rounded-full p-1">
            <BaseButton 
              onClick={() => onThemeClick('light')} 
              variant={themeMode === 'light' ? 'primary' : 'ghost'}
              size="sm" 
              className="flex-1 rounded-r-full rounded-l-none h-10"
              aria-label='theme mode'
            >
              <Sun className="w-4 h-4" />
            </BaseButton>
            <BaseButton 
              onClick={() => onThemeClick('dark')} 
              variant={themeMode === 'dark' ? 'primary' : 'ghost'}
              size="sm" 
              className="flex-1 rounded-l-full rounded-r-none h-10"
              aria-label='theme mode'
            >
              <Moon className="w-4 h-4" />
            </BaseButton>
          </div>
        )}

        {/* Collapsed Actions */}
        {!isOpen && (
          <>
            <div className="flex justify-center gap-2 mb-2">
              {!isAuthenticated ? (
                <button 
                  onClick={handleLogin}
                  disabled={isLoginLoading}
                  className="p-2 rounded-full bg-blue-700 dark:bg-yellow-700 text-white disabled:opacity-50" 
                  title="ورود"
                >
                  {isLoginLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <LogIn className="w-5 h-5 text-white" />
                  )}
                </button>
              ) : (
                <button 
                  onClick={handleLogout}
                  disabled={isLogoutLoading}
                  className="p-2 rounded-full bg-blue-100 dark:bg-yellow-700 text-white disabled:opacity-50" 
                  title="خروج"
                >
                  {isLogoutLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <LogOut className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {/* Theme Toggle (Collapsed) */}
              <div className="flex justify-center">
                <button  aria-label='theme mode'
                  onClick={toggleCollapsedTheme}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {themeMode === 'light' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
