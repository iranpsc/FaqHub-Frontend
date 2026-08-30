'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthorCard, AuthorStatType } from '@/components/AuthorCard';
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
  initialType?: AuthorStatType;
}

const TYPE_HEADINGS: Record<AuthorStatType, (name: string) => string> = {
  questions: (name) => `سوالات پرسیده شده توسط ${name}`,
  answers: (name) => `سوالاتی که ${name} به آن‌ها پاسخ داده است`,
  comments: (name) => `سوالاتی که ${name} روی آن‌ها نظر گذاشته است`,
};

const TYPE_EMPTY: Record<AuthorStatType, string> = {
  questions: 'این نویسنده هنوز سوالی نپرسیده است.',
  answers: 'این نویسنده هنوز پاسخی ثبت نکرده است.',
  comments: 'این نویسنده هنوز نظری ثبت نکرده است.',
};

function parseStatType(value: string | null): AuthorStatType {
  if (value === 'answers' || value === 'comments') {
    return value;
  }
  return 'questions';
}

export function AuthorDetailPageContent({
  initialAuthor,
  initialQuestions,
  initialPagination,
  authorUsername,
  initialType = 'questions',
}: AuthorDetailPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [author] = useState<User>(initialAuthor);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [pagination, setPagination] = useState<PaginatedResponse<Question>['meta'] | null>(initialPagination);
  const [activeStat, setActiveStat] = useState<AuthorStatType>(initialType);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuthorQuestions = useCallback(async (page = 1, type: AuthorStatType = 'questions') => {
    try {
      setIsLoading(true);
      const response = await apiService.getAuthorQuestions(authorUsername, page, type);
      setQuestions(response.data);
      setPagination(response.meta);
    } catch (err) {
      console.error('Error fetching author questions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authorUsername]);

  const updateUrl = useCallback((page: number, type: AuthorStatType) => {
    const urlParams = new URLSearchParams();
    if (type !== 'questions') {
      urlParams.set('type', type);
    }
    if (page > 1) {
      urlParams.set('page', page.toString());
    }

    const queryString = urlParams.toString();
    const newUrl = queryString
      ? `/authors/${authorUsername}?${queryString}`
      : `/authors/${authorUsername}`;

    router.push(newUrl);
  }, [router, authorUsername]);

  const handlePageChange = useCallback(async (page: number) => {
    if (pagination && page === pagination.current_page) return;

    const target = Math.max(1, page);
    await fetchAuthorQuestions(target, activeStat);
    updateUrl(target, activeStat);
  }, [pagination, fetchAuthorQuestions, activeStat, updateUrl]);

  const handleStatClick = useCallback(async (stat: AuthorStatType) => {
    if (stat === activeStat) return;

    setActiveStat(stat);
    await fetchAuthorQuestions(1, stat);
    updateUrl(1, stat);
  }, [activeStat, fetchAuthorQuestions, updateUrl]);

  const navigateToQuestion = useCallback((question: Question) => {
    router.push(`/questions/${question.slug}`);
  }, [router]);

  useEffect(() => {
    const pageParam = searchParams.get('page');
    const typeParam = parseStatType(searchParams.get('type'));
    const target = parseInt(pageParam || '1', 10);
    const pageChanged = pagination && target !== pagination.current_page;
    const typeChanged = typeParam !== activeStat;

    if (pageChanged || typeChanged) {
      setActiveStat(typeParam);
      fetchAuthorQuestions(target, typeParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
            {TYPE_HEADINGS[activeStat](author.name)}
          </h2>
        </div>
      }
      main={
        <div>
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
            </div>
          ) : questions.length > 0 ? (
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
              <p className="text-gray-600 dark:text-gray-400">{TYPE_EMPTY[activeStat]}</p>
            </div>
          )}
        </div>
      }
      sidebar={
        <div className="space-y-6">
          <AuthorCard
            author={author}
            activeStat={activeStat}
            onStatClick={handleStatClick}
          />
          <HomeSidebar />
        </div>
      }
    />
  );
}
