'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BaseAvatar } from '@/components/ui/BaseAvatar';
import { userAvatarSrc } from '@/lib/avatar';
import { VoteButtons } from '../ui/VoteButtons';
import { SanitizedContent } from '../ui/SanitizedContent';
import { useAuth } from '@/contexts/AuthContext';
import { useSweetAlert } from '@/hooks/useSweetAlert';
import { apiService } from '@/services/api';
import { Question } from '@/services/api';
import { VoteChangedData, VoteData } from '@/services/types';

interface QuestionContentProps {
  question: Question;
  onEdit: () => void;
  onDelete: () => void;
  onVoteChanged: (voteData: VoteChangedData) => void;
  onQuestionPublished?: (question: Question) => void;
  onPinChanged?: (data: { questionId: string; isPinned: boolean; pinnedAt?: string }) => void;
  onFeatureChanged?: (data: { questionId: string; isFeatured: boolean; featuredAt?: string }) => void;
}

export function QuestionContent({ 
  question, 
  onEdit, 
  onDelete, 
  onVoteChanged,
  onQuestionPublished,
  onPinChanged,
  onFeatureChanged
}: QuestionContentProps) {
  const { user } = useAuth();
  const { fire: swalFire } = useSweetAlert();
  const [isPublishing, setIsPublishing] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [featureLoading, setFeatureLoading] = useState(false);

  const canEdit = question.can?.update || false;
  const canDelete = (question.can?.delete || false) && !question.published;

  const formatNumber = (num: number) => {
    if (!num || num === 0) return 0;
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
  };

  const handleVoteChanged = (voteData: VoteData) => {
    // Convert VoteData to VoteChangedData format
    const voteChangedData: VoteChangedData = {
      type: 'question',
      id: question.id,
      votes: {
        upvotes: voteData.upvotes,
        downvotes: voteData.downvotes,
        user_vote: voteData.userVote
      }
    };
    
    // Update the local question object's vote state (same as AnswersSection.tsx)
    question.votes = {
      upvotes: voteData.upvotes,
      downvotes: voteData.downvotes,
      score: voteData.upvotes - voteData.downvotes,
      user_vote: voteData.userVote
    };
    
    onVoteChanged(voteChangedData);
  };

  const publishQuestion = async () => {
    if (isPublishing) return;

    const confirmationResult = await swalFire({
      title: 'انتشار سوال',
      text: 'آیا از انتشار این سوال اطمینان دارید؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'بله، منتشر شود',
      cancelButtonText: 'انصراف',
      reverseButtons: true,
      focusCancel: true
    });

    if (!confirmationResult?.isConfirmed) {
      return;
    }

    try {
      setIsPublishing(true);

      const response = await apiService.publishQuestion(question.id);

      if (response.success && response.data) {
        // Update the question object with the response data
        Object.assign(question, response.data);

        // Emit event to parent with updated question
        if (onQuestionPublished) {
          onQuestionPublished(response.data);
        }

        // Show success message
        await swalFire({
          title: 'موفق!',
          text: 'سوال با موفقیت منتشر شد.',
          icon: 'success',
          timer: 3000,
          showConfirmButton: false
        });
      } else {
        throw new Error(response.error || 'خطا در انتشار سوال');
      }

    } catch (error: unknown) {
      console.error('Error publishing question:', error);
      await swalFire({
        title: 'خطا!',
        text: error instanceof Error ? error.message : 'خطا در انتشار سوال',
        icon: 'error'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const togglePin = async () => {
    if (pinLoading || !user) return;

    setPinLoading(true);

    try {
      let response;

      if (question.is_pinned_by_user) {
        // Unpin the question
        response = await apiService.unpinQuestion(question.id);
      } else {
        // Pin the question
        response = await apiService.pinQuestion(question.id);
      }

      if (response.success && response.data) {
        // Update the question object
        question.is_pinned_by_user = response.data.is_pinned_by_user;
        question.pinned_at = response.data.pinned_at || undefined;

        // Emit event to parent
        if (onPinChanged) {
          onPinChanged({
            questionId: question.id,
            isPinned: question.is_pinned_by_user || false,
            pinnedAt: question.pinned_at
          });
        }

        // No success toast for pin toggle
      } else {
        throw new Error(response.error || 'خطا در تغییر وضعیت پین');
      }
    } catch (error: unknown) {
      console.error('Error toggling pin:', error);

      let errorMessage = 'خطا در تغییر وضعیت پین';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      await swalFire({
        title: 'خطا!',
        text: errorMessage,
        icon: 'error'
      });
    } finally {
      setPinLoading(false);
    }
  };

  const toggleFeature = async () => {
    if (featureLoading || !user) return;

    setFeatureLoading(true);

    try {
      let response;

      // Determine the action based on button mode
      let shouldUnfeature = false;

      if (!question.can?.feature && question.can?.unfeature) {
        // Unfeature mode: can only unfeature
        shouldUnfeature = true;
      } else if (question.can?.feature && !question.can?.unfeature) {
        // Feature mode: can only feature
        shouldUnfeature = false;
      } else {
        // Toggle mode: use current featured state
        shouldUnfeature = question.is_featured_by_user || false;
      }

      if (shouldUnfeature) {
        // Unfeature the question
        response = await apiService.unfeatureQuestion(question.id);
      } else {
        // Feature the question
        response = await apiService.featureQuestion(question.id);
      }

      if (response.success && response.data) {
        // Update the question object
        question.is_featured_by_user = response.data.is_featured_by_user;
        question.featured_at = response.data.featured_at || undefined;

        // Update permissions based on the new state
        if (question.can) {
          if (shouldUnfeature) {
            // After unfeaturing, user should be able to feature again
            question.can.feature = true;
            question.can.unfeature = false;
          } else {
            // After featuring, user should be able to unfeature
            question.can.feature = false;
            question.can.unfeature = true;
          }
        }

        // Emit event to parent
        if (onFeatureChanged) {
          onFeatureChanged({
            questionId: question.id,
            isFeatured: question.is_featured_by_user || false,
            featuredAt: question.featured_at
          });
        }

        // No success toast for feature toggle
      } else {
        throw new Error(response.error || 'خطا در تغییر وضعیت ویژگی');
      }
    } catch (error: unknown) {
      console.error('Error toggling feature:', error);

      let errorMessage = 'خطا در تغییر وضعیت ویژگی';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      await swalFire({
        title: 'خطا!',
        text: errorMessage,
        icon: 'error'
      });
    } finally {
      setFeatureLoading(false);
    }
  };

  const handleDelete = async () => {
    onDelete();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6 w-full min-w-0 overflow-hidden">
      {/* Top Row: User Info & Category (right), Creation Date (left) */}
      <div className="flex items-center justify-between mb-4 gap-2 min-w-0">
        {/* Right: User Info & Category */}
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          {/* User Info */}
          {question.user ? (
            <Link
              href={`/authors/${question.user?.username ?? question.user?.id}`}
              className="text-right min-w-0 group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded block"
              title={`نمایش پروفایل ${question.user.name || ''}`}
            >
              <div className="flex gap-2">
                <BaseAvatar 
                  src={userAvatarSrc(question.user)} 
                  name={question.user.name} 
                  size="lg" 
                  className="transition-transform group-hover:scale-105" 
                />
                <div className="flex flex-col justify-between py-[2px]">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate group-hover:underline">
                    {question.user.name}
                  </span>
                  {question.user.score && (
                    <div className="text-xs md:text-sm text-blue-600 whitespace-nowrap">
                      امتیاز: {formatNumber(question.user.score)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="text-right min-w-0">
              <div className="flex gap-2">
                <BaseAvatar 
                  src="" 
                  name="کاربر ناشناس" 
                  size="md" 
                />
                <div className="flex flex-col justify-between py-[2px]">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                    کاربر ناشناس
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Category */}
          {question.category?.name && question.category?.slug && (
            <Link
              href={`/categories/${question.category.slug}`}
              className="px-3 py-1 border text-gray-700 dark:text-gray-300 text-sm rounded-full whitespace-nowrap hover:border-blue-500 hover:text-blue-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title={`مشاهده سوالات دسته ${question.category.name}`}
            >
              {question.category.name}
            </Link>
          )}
        </div>
        
        {/* Left: Creation Date */}
        <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          {formatDate(question.created_at)}
        </div>
      </div>

      {/* Question Title */}
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-relaxed break-words">
        {question.title}
      </h1>

      {/* Tags */}
      {Array.isArray(question.tags) && question.tags.length > 0 && (
        <div className="py-3 mb-4 flex flex-wrap gap-2">
          {question.tags.map((tag) => (
            <Link
              key={tag.id ?? tag.slug}
              href={`/tags/${tag.slug}`}
              className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title={`مشاهده سوالات دارای برچسب ${tag.name}`}
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Bottom Row: Voting and Actions */}
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
        {/* Action Buttons & Stats */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-start min-w-0">
          {/* Views */}
          {(question.views !== undefined || question.views_count !== undefined) && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              <span className="hidden sm:inline">بازدید</span>
              <span>{formatNumber(question.views || question.views_count || 0)}</span>
            </div>
          )}

          {/* Answers Count */}
          {question.answers_count !== undefined && (
            <div className="flex items-center gap-1 whitespace-nowrap">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
              <span className="hidden sm:inline">پاسخ</span>
              <span>{formatNumber(question.answers_count)}</span>
            </div>
          )}

          {/* Edit */}
          {canEdit && (
            <button
              className="flex items-center gap-1 hover:text-blue-600 transition-colors whitespace-nowrap"
              onClick={onEdit}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span className="hidden sm:inline">ویرایش</span>
            </button>
          )}

          {/* Pin Toggle */}
          {user && (
            <button
              onClick={togglePin}
              disabled={pinLoading}
              className={`flex items-center gap-1 transition-colors whitespace-nowrap ${
                question.is_pinned_by_user
                  ? 'text-yellow-600 hover:text-gray-500'
                  : 'text-gray-500 hover:text-yellow-600'
              } ${pinLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={question.is_pinned_by_user ? 'برداشتن پین' : 'پین کردن سوال'}
            >
              {!pinLoading ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  {question.is_pinned_by_user ? (
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
                  ) : (
                    <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4zm5.293 6.707a1 1 0 0 1 1.414 0l3 3a1 1 0 0 1-1.414 1.414L10 11.828l-2.293 2.293a1 1 0 0 1-1.414-1.414l3-3z"></path>
                  )}
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="hidden sm:inline">
                {pinLoading ? 'در حال پردازش...' : (question.is_pinned_by_user ? 'برداشتن پین' : 'پین کردن')}
              </span>
            </button>
          )}

          {/* Feature Toggle */}
          {(question.can?.feature || question.can?.unfeature) && (
            <button
              onClick={toggleFeature}
              disabled={featureLoading}
              className={`flex items-center gap-1 transition-colors whitespace-nowrap ${
                (!question.can?.feature && question.can?.unfeature)
                  ? 'text-orange-600 hover:text-gray-500'
                  : (question.can?.feature && !question.can?.unfeature)
                    ? 'text-gray-500 hover:text-orange-600'
                    : question.is_featured_by_user
                      ? 'text-orange-600 hover:text-gray-500'
                      : 'text-gray-500 hover:text-orange-600'
              } ${featureLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={(!question.can?.feature && question.can?.unfeature)
                ? 'برداشتن ویژگی'
                : (question.can?.feature && !question.can?.unfeature)
                  ? 'ویژه کردن سوال'
                  : (question.is_featured_by_user ? 'برداشتن ویژگی' : 'ویژه کردن سوال')}
            >
              {!featureLoading ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  {((!question.can?.feature && question.can?.unfeature) || question.is_featured_by_user) ? (
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  ) : (
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill="none" stroke="currentColor" strokeWidth="1.5"></path>
                  )}
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span className="hidden sm:inline">
                {featureLoading
                  ? 'در حال پردازش...'
                  : (!question.can?.feature && question.can?.unfeature)
                    ? 'برداشتن ویژگی'
                    : (question.can?.feature && !question.can?.unfeature)
                      ? 'ویژه کردن'
                      : (question.is_featured_by_user ? 'برداشتن ویژگی' : 'ویژه کردن')
                }
              </span>
            </button>
          )}

          {/* Delete */}
          {canDelete && (
            <button
              className="flex items-center gap-1 hover:text-red-600 transition-colors whitespace-nowrap"
              onClick={handleDelete}
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span className="hidden sm:inline">حذف</span>
            </button>
          )}

          {/* Publish Status and Button */}
          {!question.published && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                منتشر نشده
              </span>
              {question.can?.publish && (
                <button
                  onClick={publishQuestion}
                  disabled={isPublishing}
                  className="flex items-center gap-1 hover:text-green-600 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {!isPublishing ? (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isPublishing ? 'در حال انتشار...' : 'انتشار'}</span>
                </button>
              )}
            </div>
          )}

          {/* Solved indicator */}
          {question.is_solved && (
            <div className="flex items-center gap-1 text-green-600 whitespace-nowrap">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="hidden sm:inline">حل شده</span>
            </div>
          )}
        </div>

        {/* Voting Buttons */}
        <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
          <VoteButtons
            resourceType="question"
            resourceId={question.id}
            questionId={question.id}
            initialUpvotes={Array.isArray(question.votes?.upvotes) ? question.votes.upvotes.length : (question.votes?.upvotes || 0)}
            initialDownvotes={Array.isArray(question.votes?.downvotes) ? question.votes.downvotes.length : (question.votes?.downvotes || 0)}
            initialUserVote={question.votes?.user_vote || null}
            onVoteChanged={handleVoteChanged}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 overflow-hidden">
        <SanitizedContent
          content={question.content}
          className="prose dark:prose-invert max-w-none break-words"
        />

        {/* Solved Badge */}
        {question.is_solved && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-600">
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
              </svg>
              #حل شده
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
