'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthorCard } from '@/components/AuthorCard';
import { QuestionCard } from '@/components/QuestionCard';
import { BasePagination } from '@/components/ui/BasePagination';
import { ContentArea } from '@/components/ContentArea';
import { HomeSidebar } from '@/components/HomeSidebar';
import { apiService } from '@/services/api';
import { User, Question, PaginatedResponse } from '@/services/types';

interface AuthorDetailPageContentProps {
  initialAuthor: User;
  initialQuestions: Question[];
  initialPagination: PaginatedResponse<Question>['meta'];
  authorUsername: string;
}

export function AuthorDetailPageContent({
  initialAuthor,
  initialQuestions,
  initialPagination,
  authorUsername,
}: AuthorDetailPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [author] = useState<User>(initialAuthor);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [pagination, setPagination] = useState<PaginatedResponse<Question>['meta'] | null>(initialPagination);

  const fetchAuthorQuestions = useCallback(async (page = 1) => {
    try {
      const response = await apiService.getAuthorQuestions(authorUsername, page);
      setQuestions(response.data);
      setPagination(response.meta);
    } catch (err) {
      console.error('Error fetching author questions:', err);
    }
  }, [authorUsername]);

  const handlePageChange = useCallback(async (page: number) => {
    if (pagination && page === pagination.current_page) return;

    const target = Math.max(1, page);
    await fetchAuthorQuestions(target);

    const urlParams = new URLSearchParams(searchParams.toString());
    if (target > 1) {
      urlParams.set('page', target.toString());
    } else {
      urlParams.delete('page');
    }

    const queryString = urlParams.toString();
    const newUrl = queryString
      ? `/authors/${authorUsername}?${queryString}`
      : `/authors/${authorUsername}`;

    router.push(newUrl);
  }, [pagination, fetchAuthorQuestions, searchParams, router, authorUsername]);

  const navigateToQuestion = useCallback((question: Question) => {
    router.push(`/questions/${question.slug}`);
  }, [router]);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const target = parseInt(pageParam || '1');
    if (pagination && target !== pagination.current_page) {
      fetchAuthorQuestions(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only depend on searchParams to avoid infinite loop

  return (
    <ContentArea 
      layout="with-sidebar" 
      showSidebar={true} 
      mainWidth="2/3" 
      sidebarWidth="1/3"
      filters={
        <div className="mb-8">
          <h1 className="sr-only">پروفایل {author.name}</h1>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            سوالات پرسیده شده توسط {author.name}
          </h2>
        </div>
      }
      main={
        <div>
          {questions.length > 0 ? (
            <>
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onClick={() => navigateToQuestion(question)}
                  />
                ))}
              </div>

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
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">این نویسنده هنوز سوالی نپرسیده است.</p>
            </div>
          )}
        </div>
      }
      sidebar={
        <div className="space-y-6">
          <AuthorCard author={author} />
          <HomeSidebar />
        </div>
      }
    />
  );
}

