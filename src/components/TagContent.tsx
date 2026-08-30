'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ContentArea } from '@/components/ContentArea';
import { HomeSidebar } from '@/components/HomeSidebar';
import { BasePagination } from '@/components/ui/BasePagination';
import { BaseAlert } from '@/components/ui/BaseAlert';
import { QuestionCard } from '@/components/QuestionCard';
import { apiService } from '@/services/api';
import { Question, Tag, PaginatedResponse } from '@/services/types';

interface TagContentProps {
  slug: string;
  initialQuestions: Question[];
  initialTag: Tag | null;
  initialPagination: PaginatedResponse<Question>['meta'] | null;
}

export default function TagContent({ 
  slug, 
  initialQuestions, 
  initialTag, 
  initialPagination 
}: TagContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [tag, setTag] = useState<Tag | null>(initialTag);
  const [pagination, setPagination] = useState<PaginatedResponse<Question>['meta'] | null>(initialPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if API is unavailable (no initial data and no questions)
  const isApiUnavailable = initialQuestions.length === 0 && questions.length === 0 && !isLoading;

  // Update current page when URL changes
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  }, [searchParams, currentPage]);

  // Fetch tag questions when page changes (only if we have initial data)
  useEffect(() => {
    const fetchTagQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiService.getTagQuestions(slug, currentPage);
        setQuestions(response.data);
        setTag(response.tag);
        setPagination(response.meta);
      } catch (err) {
        console.error('Error fetching tag questions:', err);
        setError(err instanceof Error ? err.message : 'خطا در بارگذاری سوالات برچسب');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have initial data and page changed
    if (slug && initialQuestions.length > 0 && currentPage !== 1) {
      fetchTagQuestions();
    }
  }, [slug, currentPage, initialQuestions.length]);

  const handlePageChange = (page: number) => {
    if (pagination && page === pagination.current_page) return;

    // Update URL with page parameter
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set('page', page.toString());
    } else {
      params.delete('page');
    }

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.push(`/tags/${slug}${newUrl}`);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuestionClick = (_question: Question) => {
    // Navigation is handled by ContentArea / link
  };

  return (
    <ContentArea 
      layout="with-sidebar" 
      showSidebar={true} 
      mainWidth="3/4" 
      sidebarWidth="1/4"
      main={
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link href="/tags" className="hover:text-blue-600 dark:hover:text-blue-400">
                  برچسب‌ها
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-gray-100">{tag?.name || slug}</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                سوالات برچسب &quot;{tag?.name || slug}&quot;
              </h1>
            </div>
            <div className="mt-2 sm:mt-0 text-sm text-gray-600 dark:text-gray-400">
              {pagination && !isLoading && (
                <>مجموع {pagination.total} سوال</>
              )}
            </div>
          </div>

          {/* API Unavailable State */}
          {isApiUnavailable && (
            <div className="text-center py-16">
              <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
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

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
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

          {/* Error State */}
          {!isLoading && error && !isApiUnavailable && (
            <BaseAlert variant="error" message={error} />
          )}

          {/* Questions List */}
          {!isLoading && !error && !isApiUnavailable && (
            <div>
              {questions.length > 0 ? (
                <div>
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onClick={handleQuestionClick}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.last_page > 1 && (
                    <div className="mt-8">
                      <BasePagination
                        currentPage={pagination.current_page}
                        totalPages={pagination.last_page}
                        total={pagination.total}
                        perPage={pagination.per_page}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <h2 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">سوالی یافت نشد</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    هنوز سوالی با این برچسب ایجاد نشده است.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      }
      sidebar={<HomeSidebar />}
    />
  );
}
