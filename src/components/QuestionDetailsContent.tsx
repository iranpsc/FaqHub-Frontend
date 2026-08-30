'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ContentArea } from '@/components/ContentArea';
import { HomeSidebar } from '@/components/HomeSidebar';
import { QuestionContent } from '@/components/question/QuestionContent';
const DynamicCommentsSection = dynamic(
  () => import('@/components/question/CommentsSection').then(m => m.CommentsSection),
  {
    ssr: false,
    loading: () => (
      <div className="mt-4">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-3" />
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      </div>
    )
  }
);
const DynamicAnswersSection = dynamic(
  () => import('@/components/question/AnswersSection').then(m => m.AnswersSection),
  {
    ssr: false,
    loading: () => (
      <div className="mt-6 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded" />
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded" />
      </div>
    )
  }
);
const DynamicQuestionModal = dynamic(
  () => import('@/components/QuestionModal').then(m => m.QuestionModal),
  { ssr: false }
);
import { BaseAlert } from '@/components/ui/BaseAlert';
import { useQuestionDetails } from '@/hooks/useQuestionDetails';
import { useSweetAlert } from '@/hooks/useSweetAlert';
import { apiService } from '@/services/api';
import { useRouter } from 'next/navigation';
import { Answer, VoteChangedData, CommentData, Question } from '@/services/types';

interface QuestionDetailsContentProps {
  slug: string;
  initialQuestion: Question | null;
  initialAnswers: Answer[];
}

export default function QuestionDetailsContent({ slug, initialQuestion, initialAnswers }: QuestionDetailsContentProps) {
  const { fire: swalFire, showLoading, close } = useSweetAlert();
  const router = useRouter();

  const {
    question,
    answers,
    isLoading,
    error,
    refetchQuestion,
    refetchAnswers
  } = useQuestionDetails(slug, true, { question: initialQuestion, answers: initialAnswers });

  // Check if API is unavailable (no initial data and no question)
  const isApiUnavailable = !initialQuestion && !question && !isLoading;

  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [componentKey, setComponentKey] = useState<number>(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (question?.title) {
      document.title = question.title;
    }
  }, [question?.title]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  const handleQuestionUpdated = async () => {
    setIsUpdating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowEditModal(false);
      await refetchQuestion();
      await refetchAnswers();
      setComponentKey(Date.now());
    } catch (err) {
      console.error('Error refreshing question after update:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAnswerAdded = async () => {
    await refetchAnswers();
  };

  const handleVoteChanged = (voteData: VoteChangedData) => {
    if (question && question.votes) {
      question.votes.upvotes = voteData.votes.upvotes;
      question.votes.downvotes = voteData.votes.downvotes;
      question.votes.score = voteData.votes.upvotes - voteData.votes.downvotes;
      question.votes.user_vote = voteData.votes.user_vote;
    }
  };

  const handleAnswerVoteChanged = (voteData: VoteChangedData) => {
    if (voteData.type === 'answer') {
      const answerIndex = answers.findIndex((a) => a.id === voteData.id);
      if (answerIndex !== -1) {
        const existingAnswer = answers[answerIndex];
        const updatedAnswer = {
          ...existingAnswer,
          votes: voteData.votes as Answer['votes']
        };
        const newAnswers = [...answers];
        newAnswers[answerIndex] = updatedAnswer;
      }
    }
  };

  const handleAnswerCorrectnessChanged = () => {
    if (question) {
      const hasCorrectAnswer = answers.some((answer) => answer.is_correct);
      question.is_solved = hasCorrectAnswer;
    }
  };

  const handleAnswerCommentAdded = (_commentData: CommentData) => {
    // Comment list is updated by the answers/comments hook
  };

  const handleEdit = () => setShowEditModal(true);

  const handleDelete = useCallback(async () => {
    if (!question) return;

    if (question.published) {
      await swalFire({
        title: 'خطا!',
        text: 'شما نمی‌توانید سوالات منتشر شده را حذف کنید. فقط سوالات منتشر نشده قابل حذف هستند.',
        icon: 'error',
        confirmButtonText: 'باشه'
      });
      return;
    }

    const confirmResult = await swalFire({
      title: 'آیا مطمئن هستید؟',
      text: 'این عمل قابل بازگشت نیست! سوال و تمام پاسخ‌های آن حذف خواهد شد.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'بله، حذف کن!',
      cancelButtonText: 'لغو',
      reverseButtons: true
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      swalFire({
        title: 'در حال حذف...',
        text: 'لطفاً صبر کنید',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });
      showLoading();

      const result = await apiService.deleteQuestion(String(question.id));
      if (result.success) {
        await swalFire({
          title: 'موفق!',
          text: 'سوال با موفقیت حذف شد.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          timerProgressBar: true
        });
        router.push('/');
      } else {
        const errorMessage = result.error || 'خطایی در حذف سوال رخ داد.';
        const isAuthError = errorMessage.includes('Unauthorized') || errorMessage.includes('Forbidden');
        await swalFire({
          title: 'خطا!',
          text: isAuthError
            ? 'شما نمی‌توانید این سوال را حذف کنید. فقط سوالات منتشر نشده قابل حذف هستند.'
            : errorMessage,
          icon: 'error',
          confirmButtonText: 'باشه'
        });
      }
    } catch (e: unknown) {
      await swalFire({
        title: 'خطا!',
        text: e instanceof Error ? e.message : 'خطایی در حذف سوال رخ داد.',
        icon: 'error',
        confirmButtonText: 'باشه'
      });
    } finally {
      close();
    }
  }, [question, router, swalFire, showLoading, close]);

  return (
    <ContentArea layout="with-sidebar" showSidebar={true} mainWidth="3/4" sidebarWidth="1/4" sidebar={<HomeSidebar />}>
      <div className="w-full">
        {isLoading && (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
          </div>
        )}

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

        {/* Error State */}
        {!isLoading && error && !isApiUnavailable && (
          <div className="text-center py-16">
            <BaseAlert variant="error" message={error} />
          </div>
        )}

        {!isLoading && !error && question && (
          <>
            {isUpdating && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 dark:text-blue-300">در حال بروزرسانی سوال...</span>
              </div>
            )}

            <QuestionContent 
              key={`question-${question.id}-${componentKey}`}
              question={question} 
              onEdit={handleEdit}
              onDelete={handleDelete}
              onVoteChanged={handleVoteChanged}
              onQuestionPublished={async () => {
                await refetchQuestion();
                setComponentKey(Date.now());
              }}
            />

            <DynamicCommentsSection 
              key={`comments-${question.id}-${componentKey}`}
              questionId={question.id} 
              parentType="question"
              onCommentAdded={() => {}}
            />

            <DynamicAnswersSection 
              key={`answers-${question.id}-${componentKey}`}
              questionId={question.id} 
              answers={answers}
              onAnswerAdded={handleAnswerAdded}
              onVoteChanged={handleAnswerVoteChanged}
              onAnswerCorrectnessChanged={handleAnswerCorrectnessChanged}
              onCommentAdded={handleAnswerCommentAdded}
            />
          </>
        )}
      </div>

      {showEditModal && question && (
        <DynamicQuestionModal 
          visible={showEditModal}
          questionToEdit={question}
          onClose={() => setShowEditModal(false)}
          onQuestionUpdated={handleQuestionUpdated}
        />
      )}
    </ContentArea>
  );
}


