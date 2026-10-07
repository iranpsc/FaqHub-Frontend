'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentArea } from '@/components/ContentArea';
import { ActiveUsersSlider } from '@/components/ActiveUsersSlider';
import { PopularCategories } from '@/components/PopularCategories';
import { FilterQuestion } from '@/components/FilterQuestion';
import { QuestionCard } from '@/components/QuestionCard';
import { HomeSidebar } from '@/components/HomeSidebar';
import { BaseAlert } from '@/components/ui/BaseAlert';
import { BasePagination } from '@/components/ui/BasePagination';
import { OptimizedHeroImage } from '@/components/OptimizedHeroImage';
import { useQuestions } from '@/hooks/useQuestions';
import { useUsers } from '@/hooks/useUsers';
import { Question, Category, User } from '@/services/api';

const ACTIVE_USERS_SLIDER_LIMIT = 12;

type PaginationMeta = {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

interface HomeContentProps {
  initialQuestions?: Question[];
  initialPaginationMeta?: PaginationMeta | null;
  initialActiveUsers?: User[];
}

export function HomeContent({
  initialQuestions = [],
  initialPaginationMeta = null,
  initialActiveUsers = []
}: HomeContentProps) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({});

  const {
    questions,
    pagination,
    isLoading,
    error,
    refetch: refetchQuestions
  } = useQuestions({}, false, {
    questions: initialQuestions,
    pagination: initialPaginationMeta ? { meta: initialPaginationMeta } : null,
  });

  const sanitizedQuestions = (questions || []).filter(q =>
    q && typeof q.title === 'string' && typeof q.content === 'string'
  );

  const {
    users: activeUsers,
    isLoading: isLoadingUsers,
    error: userError
  } = useUsers(ACTIVE_USERS_SLIDER_LIMIT, false, initialActiveUsers);

  const sanitizedUsers = (activeUsers || []).filter(u => u && u.id);

  const isApiUnavailable = initialQuestions.length === 0 && sanitizedQuestions.length === 0 && !isLoading;

  useEffect(() => {
    const handleRefresh = () => refetchQuestions();
    const handleLogout = () => refetchQuestions();
    
    window.addEventListener('questions:refresh', handleRefresh);
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('questions:refresh', handleRefresh);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [refetchQuestions]);

  const handleFiltersChanged = (filters: Record<string, unknown>) => {
    setCurrentFilters(filters);
    refetchQuestions(filters);
  };

  const handleCategoryClick = (category: Category) => {
    if (selectedCategory?.id === category.id) {
      setSelectedCategory(null);
      handleFiltersChanged({ ...currentFilters, category_id: undefined });
    } else {
      setSelectedCategory(category);
      handleFiltersChanged({ ...currentFilters, category_id: category.id });
    }
  };

  const handlePageChange = (page: number) => {
    refetchQuestions({ ...currentFilters, page });
  };

  const landingImageUrl = '/assets/images/landing.png';

  return (
    <ContentArea
      layout="with-sidebar"
      showSidebar={true}
      mainWidth="3/4"
      sidebarWidth="1/4"
      hero={
        <div>
          <h1 className="text-center">
            انجمن حم بزرگترین انجمن پرسش و پاسخ ایران
          </h1>
          <OptimizedHeroImage src={landingImageUrl} alt="خوش آمدید به سیستم پرسش و پاسخ" />
        </div>
      }
      filters1={
        <PopularCategories
          limit={15}
          onCategoryClick={handleCategoryClick}
          selectedCategory={selectedCategory}
          className="mb-6"
        />
      }
      filters={<FilterQuestion onFiltersChanged={handleFiltersChanged} />}
      main={
        <div>
          {/* لیست سوالات */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 10 }).map((_, n) => (
                <div key={n} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
                  <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isApiUnavailable && (
            <div className="text-center py-16">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">API سرور در دسترس نیست</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                لطفاً اطمینان حاصل کنید که سرور API در حال اجرا است.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          )}

          {!isLoading && error && !isApiUnavailable && <BaseAlert variant="error" message={error} />}

          {!isLoading && !error && sanitizedQuestions.length > 0 && (
            <div>
              <div className="space-y-4">
                {sanitizedQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={{
                      ...question,
                      title: question.title || "",
                      content: question.content || "",
                    }}
                  />
                ))}
              </div>

              {pagination?.meta && (
                <div className="mt-8">
                  <BasePagination
                    currentPage={pagination.meta.current_page}
                    totalPages={pagination.meta.last_page}
                    total={pagination.meta.total}
                    perPage={pagination.meta.per_page}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && sanitizedQuestions.length === 0 && !isApiUnavailable && (
            <div className="text-center py-16">
              <h2 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">سوالی یافت نشد</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">با پرسیدن اولین سوال شروع کنید.</p>
            </div>
          )}
        </div>
      }
      sidebar={<HomeSidebar />}
      footer={
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              فعالان انجمن
            </h2>
            <button 
              className="border-2 border-blue-600 dark:bg-transparent bg-blue-600 dark:border-blue-500 dark:text-blue-500 text-white md:text-xl rounded-xl px-4 py-2 flex items-center"
              onClick={() => router.push('/authors')}
            >
              مشاهده بیشتر
            </button>
          </div>

          {isLoadingUsers && (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {Array.from({ length: 5 }).map((_, n) => (
                <div key={n} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoadingUsers && userError && <BaseAlert variant="error" message={userError} />}

          {!isLoadingUsers && !userError && sanitizedUsers.length > 0 && (
            <ActiveUsersSlider users={sanitizedUsers} />
          )}

          {!isLoadingUsers && !userError && sanitizedUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">هنوز کاربر فعالی یافت نشد</p>
            </div>
          )}
        </div>
      }
    />
  );
}

export default HomeContent;
