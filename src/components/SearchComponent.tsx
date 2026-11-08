'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Check, MessageCircle, ArrowUp, Eye } from 'lucide-react';
import { BaseInput } from './ui/BaseInput';
import { BaseButton } from './ui/BaseButton';
import { apiService, Question } from '@/services/api';

interface SearchComponentProps {
  modelValue?: string;
  placeholder?: string;
  variant?: 'default' | 'filled' | 'outlined';
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  inputClass?: string;
  searchLimit?: number;
  debounceMs?: number;
  position?: 'desktop' | 'mobile';
  onUpdateModelValue?: (value: string) => void;
  onSearch?: (query: string) => void;
  onSelect?: (question: Question) => void;
  mobileSearchOpen?: boolean;
  onMobileSearchToggle?: () => void;
}

export function SearchComponent({
  modelValue = '',
  placeholder = 'سوال یا کلمه موردنظر خود را جستجو کنید',
  variant = 'filled',
  rounded = 'xl',
  inputClass = '',
  debounceMs = 300,
  position = 'desktop',
  onUpdateModelValue,
  onSearch,
  onSelect,
  mobileSearchOpen: externalMobileSearchOpen,
  onMobileSearchToggle,
}: SearchComponentProps) {
  const router = useRouter();
  
  // Dynamic z-index based on position
  const zIndexes = {
    desktop: {
      container: 'z-[80]',
      dropdown: 'z-[90]',
      backdrop: 'z-[70]',
      mobileOverlay: 'z-[80]'
    },
    mobile: {
      container: 'z-[70]',
      dropdown: 'z-[80]',
      backdrop: 'z-[60]',
      mobileOverlay: 'z-[70]'
    }
  };
  
  const currentZIndex = zIndexes[position];
  
  // Refs
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInput = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchAbortControllerRef = useRef<AbortController | null>(null);
  
  // State
  const [searchQuery, setSearchQuery] = useState(modelValue);
  const [searchResults, setSearchResults] = useState<Question[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<Question[]>([]);
  const [showLimit, setShowLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [internalMobileSearchOpen, setInternalMobileSearchOpen] = useState(false);
  const isMobileSearchOpen = externalMobileSearchOpen !== undefined ? externalMobileSearchOpen : internalMobileSearchOpen;

  // Computed values
  const showNoResults = !isLoading && searchQuery.trim().length > 0 && searchResults.length === 0;
  const displayedResults = allSearchResults.slice(0, showLimit);
  const hasMoreResults = allSearchResults.length > showLimit;

  // Search function
  const performSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setAllSearchResults([]);
      setShowDropdown(false);
      setShowLimit(10);
      return;
    }

    searchAbortControllerRef.current?.abort();
    const controller = new AbortController();
    searchAbortControllerRef.current = controller;

    setIsLoading(true);
    setShowDropdown(true);

    try {
      const questions = await apiService.searchQuestions(query.trim(), 50, controller.signal);
      if (controller.signal.aborted) return;
      setAllSearchResults(questions);
      setSearchResults(questions.slice(0, 10));
      setShowLimit(10);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Search failed:', error);
      setSearchResults([]);
      setAllSearchResults([]);
    } finally {
      if (searchAbortControllerRef.current === controller) {
        setIsLoading(false);
        setSelectedIndex(-1);
      }
    }
  }, []);

  // Handle input changes
  const handleInput = useCallback((value: string) => {
    setSearchQuery(value);
    onUpdateModelValue?.(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchAbortControllerRef.current?.abort();
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, debounceMs);
  }, [performSearch, debounceMs, onUpdateModelValue]);

  // Handle focus
  const handleFocus = useCallback(() => {
    if (searchQuery.trim().length > 0 && displayedResults.length > 0) {
      setShowDropdown(true);
    }
  }, [searchQuery, displayedResults.length]);

  // Hide dropdown
  const hideDropdown = useCallback(() => {
    setShowDropdown(false);
  }, []);

  // Hide backdrop
  const hideBackdrop = useCallback(() => {
    setShowDropdown(false);
    if (onMobileSearchToggle) {
      onMobileSearchToggle();
    } else {
      setInternalMobileSearchOpen(false);
    }
  }, [onMobileSearchToggle]);

  // Select question
  const selectQuestion = useCallback((question: Question) => {
    if (question && question.id) {
      setShowDropdown(false);
      if (onMobileSearchToggle) {
        onMobileSearchToggle();
      } else {
        setInternalMobileSearchOpen(false);
      }
      onSelect?.(question);
      const targetRoute = `/questions/${question.slug}`;
      router.push(targetRoute);
    }
  }, [router, onSelect, onMobileSearchToggle]);


  // Show more questions
  const showMoreQuestions = useCallback(() => {
    const newLimit = Math.min(showLimit + 10, allSearchResults.length);
    setShowLimit(newLimit);
    setSearchResults(allSearchResults.slice(0, newLimit));
  }, [showLimit, allSearchResults]);

  // Handle keyboard navigation
  const handleKeydown = useCallback((e: React.KeyboardEvent) => {
    if (!showDropdown && !isMobileSearchOpen) return;
    if (displayedResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % displayedResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + displayedResults.length) % displayedResults.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && displayedResults[selectedIndex]) {
          selectQuestion(displayedResults[selectedIndex]);
        } else {
          onSearch?.(searchQuery);
          hideDropdown();
          if (onMobileSearchToggle) {
            onMobileSearchToggle();
          } else {
            setInternalMobileSearchOpen(false);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        hideDropdown();
        if (onMobileSearchToggle) {
          onMobileSearchToggle();
        } else {
          setInternalMobileSearchOpen(false);
        }
        break;
    }
  }, [showDropdown, isMobileSearchOpen, displayedResults, selectedIndex, selectQuestion, searchQuery, onSearch, hideDropdown, onMobileSearchToggle]);

  // Handle click outside
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      hideDropdown();
    }
    if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node) && 
        !(event.target as Element).closest('[data-mobile-search-trigger]')) {
      if (onMobileSearchToggle) {
        onMobileSearchToggle();
      } else {
        setInternalMobileSearchOpen(false);
      }
    }
  }, [hideDropdown, onMobileSearchToggle]);

  // Effects
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchAbortControllerRef.current?.abort();
    };
  }, [handleClickOutside]);

  useEffect(() => {
    setSearchQuery(modelValue);
  }, [modelValue]);

  // Render search icon
  const SearchIcon = () => (
    <Search className="w-5 h-5" />
  );

  // Render loading spinner
  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
  );

  // Render no results icon
  const NoResultsIcon = () => (
    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.386 0-4.569-.831-6.293-2.209" />
    </svg>
  );

  return (
    <>
      {/* Desktop Search (only when position is desktop) */}
      {position === 'desktop' && (
        <div className={`flex flex-col relative ${currentZIndex.container}`} ref={dropdownRef}>
        {/* Search Input */}
        <BaseInput
          value={searchQuery}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeydown}
          placeholder={placeholder}
          variant={variant}
          className={`${inputClass} ${rounded === 'xl' ? 'rounded-xl' : rounded === 'lg' ? 'rounded-lg' : rounded === 'md' ? 'rounded-md' : rounded === 'sm' ? 'rounded-sm' : 'rounded-full'}`}
          leftIcon={<SearchIcon />}
          rightIcon={isLoading ? <LoadingSpinner /> : undefined}
        />

        {/* Desktop Search Results Dropdown */}
        {(showDropdown && (displayedResults.length > 0 || showNoResults)) && (
          <div className={`absolute ${currentZIndex.dropdown} w-full mt-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto`}>
            {/* Loading state */}
            {isLoading && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  <span>در حال جستجو...</span>
                </div>
              </div>
            )}

            {/* No results */}
            {!isLoading && showNoResults && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <NoResultsIcon />
                  <span>نتیجه‌ای یافت نشد</span>
                </div>
              </div>
            )}

            {/* Search results */}
            {!isLoading && !showNoResults && (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {displayedResults.map((question, index) => (
                  <li
                    key={question.id}
                    className={`cursor-pointer transition-colors duration-150 ${
                      selectedIndex === index
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => selectQuestion(question)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="p-4">
                      {/* Question title */}
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                        {question.title}
                      </h4>

                      {/* Stats row */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        {/* Solved badge */}
                        {question.is_solved && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold bg-green-100 text-green-700 ml-2">
                            <Check className="w-4 h-4 mr-1 text-green-500" />
                            حل شده
                          </span>
                        )}
                        {/* Category */}
                        {question.category && (
                          <span className="flex items-center gap-1 text-sm ml-2">
                            {question.category.name}
                          </span>
                        )}
                        {/* Answers count */}
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span className="mt-[5px] text-sm">{question.answers_count || 0}</span>
                        </span>
                        <span className="mx-2">|</span>
                        {/* Votes count */}
                        <span className="flex items-center gap-1">
                          <ArrowUp className="w-4 h-4" />
                          <span className="mt-[5px] text-sm">{question.votes_count || 0}</span>
                        </span>
                        <span className="mx-2">|</span>
                        {/* Views */}
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span className="mt-[5px] text-sm">{(question as Question & { views?: number }).views ?? question.views_count ?? 0}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {hasMoreResults && (
              <div className="p-2 text-center">
                <BaseButton 
                  size="sm" 
                  variant="primary" 
                  className="w-full" 
                  onClick={showMoreQuestions} 
                  disabled={isLoading}
                >
                  نمایش بیشتر
                </BaseButton>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {/* Blur Backdrop for Desktop only */}
      {showDropdown && position === 'desktop' && (
        <div 
          className={`fixed inset-0 ${currentZIndex.backdrop} backdrop-blur-md bg-black/20 dark:bg-black/30`}
          onClick={hideBackdrop}
        />
      )}

      {/* Mobile Search Inline (appears in header row) */}
      {isMobileSearchOpen && position === 'mobile' && (
        <div className="relative w-full" ref={mobileSearchRef}>
          {/* Mobile Search Input */}
          <BaseInput
            ref={mobileSearchInput}
            value={searchQuery}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeydown}
            placeholder={placeholder}
            variant={variant}
            className="w-full"
            leftIcon={<SearchIcon />}
            rightIcon={isLoading ? <LoadingSpinner /> : undefined}
          />

          {/* Mobile Search Results Dropdown */}
          {(showDropdown && (displayedResults.length > 0 || showNoResults)) && (
            <div className={`absolute ${currentZIndex.dropdown} w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50`}>
              {/* Loading state */}
              {isLoading && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    <span>در حال جستجو...</span>
                  </div>
                </div>
              )}

              {/* No results */}
              {!isLoading && showNoResults && (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <NoResultsIcon />
                    <span>نتیجه‌ای یافت نشد</span>
                  </div>
                </div>
              )}

              {/* Search results */}
              {!isLoading && !showNoResults && (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {displayedResults.map((question, index) => (
                    <li
                      key={question.id}
                      className={`cursor-pointer transition-colors duration-150 ${
                        selectedIndex === index
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => selectQuestion(question)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="p-4">
                        {/* Question title */}
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                          {question.title}
                        </h4>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {/* Solved badge */}
                          {question.is_solved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 ml-2">
                              <Check className="w-3 h-3 mr-1 text-green-500" />
                              حل شده
                            </span>
                          )}
                          {/* Category */}
                          {question.category && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              {question.category.name}
                            </span>
                          )}
                          {/* Answers count */}
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {question.answers_count || 0}
                          </span>
                          <span className="mx-2">|</span>
                          {/* Votes count */}
                          <span className="flex items-center gap-1">
                            <ArrowUp className="w-3 h-3" />
                            {question.votes_count || 0}
                          </span>
                          <span className="mx-2">|</span>
                          {/* Views */}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {(question as Question & { views?: number }).views ?? question.views_count ?? 0}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              {hasMoreResults && (
                <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                  <BaseButton 
                    size="sm" 
                    variant="primary" 
                    className="w-full" 
                    onClick={showMoreQuestions} 
                    disabled={isLoading}
                  >
                    نمایش بیشتر
                  </BaseButton>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
