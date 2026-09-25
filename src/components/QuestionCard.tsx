'use client';

import { BaseCard } from './ui/BaseCard';
import { BaseBadge } from './ui/BaseBadge';
import { BaseAvatar } from './ui/BaseAvatar';
import { userAvatarSrc } from '@/lib/avatar';
import clsx from 'clsx';
import { Question } from '@/services/api';
import { htmlToPlainText } from '@/lib/sanitize';
import { useState } from 'react';
import Link from 'next/link';

interface QuestionCardProps {
  question: Question;
  onClick?: (question: Question) => void;
}

export function QuestionCard({ question, onClick }: QuestionCardProps) {
  const [showAllTags, setShowAllTags] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getContentPreview = (content: string) => {
    const decodedText = htmlToPlainText(content);
    return decodedText.length > 200
      ? decodedText.substring(0, 200) + '...'
      : decodedText;
  };


  // Conditional styling based on pinned/featured status - matching Vue implementation
  const cardClassName = clsx(
    'mb-4 hover:shadow-md transition-all duration-300',
    {
      // Both pinned and featured - gradient with green and orange
      'bg-gradient-to-r from-green-50 to-orange-50 dark:from-green-900/20 dark:to-orange-900/20 border-green-300 dark:border-green-700': 
        question.is_pinned_by_user && question.is_featured_by_user,
      // Only pinned - green styling
      'bg-green-100 dark:bg-green-900/20 border-green-400 dark:border-green-800': 
        question.is_pinned_by_user && !question.is_featured_by_user,
      // Only featured - orange styling
      'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800': 
        question.is_featured_by_user && !question.is_pinned_by_user,
    }
  );


  return (
    <BaseCard variant="outline" className={clsx(cardClassName, 'min-w-0 overflow-hidden')}>
      <div className="p-1 md:p-6 min-w-0">
        {/* Section 1: Category and Pin Badge (right), Creation Date and Pin Button (left) */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 min-h-[32px]">
          <div className="flex flex-wrap items-center gap-2 mb-4 min-w-0">
            {/* Category Badge */}
            {question.category && (
              <Link className='!outline-0' href={`/categories/${question.category.slug}`}>
                <span className="cursor-pointer transition-all duration-300 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 2xl:px-8 py-1 pt-[5px] border border-gray-400 dark:border-gray-200 rounded-full text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm 2xl:text-base">
                  {question.category.name}
                </span>
              </Link>
            )}

            {/* Pin Badge */}
            {question.is_pinned_by_user && (
              <BaseBadge 
                variant="success" 
                size="sm"
                className="flex items-center gap-1 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 2xl:px-8 py-1 sm:py-1.5 md:py-2 border-2 border-green-400 dark:border-green-200 text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm 2xl:text-base"
              >
                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3 lg:h-3 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 2a1.5 1.5 0 0 0-1.415.996l-.346 1.039a4 4 0 0 1-1.905 2.53l-.346.17a.5.5 0 0 0-.297.642l.774 2.316a.5.5 0 0 0 .475.354h2.064l1.173 3.52a.5.5 0 0 0 .95 0L10.346 10h-.346z" />
                </svg>
                <span className="hidden sm:inline">پین شده</span>
                <span className="sm:hidden">پین</span>
              </BaseBadge>
            )}
            
            {/* Featured Badge */}
            {question.is_featured_by_user && (
              <BaseBadge 
                variant="warning" 
                size="sm"
                className="flex items-center gap-1 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 2xl:px-8 py-1 sm:py-1.5 md:py-2 border-2 border-orange-400 dark:border-orange-200 text-xs sm:text-sm md:text-sm lg:text-sm xl:text-sm 2xl:text-base"
              >
                <svg className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3 lg:h-3 xl:w-3 xl:h-3 2xl:w-4 2xl:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                ویژه
              </BaseBadge>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Creation Date */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(question.created_at)}
            </div>
          </div>
        </div>

        {/* Section 2: Title and Content Preview */}
        <div className="mb-4 cursor-pointer min-w-0" onClick={() => onClick?.(question)}>
          <Link href={`/questions/${question.slug}`} className="block min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 leading-relaxed hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words overflow-hidden">
              {question.title}
            </h2>
          </Link>
          <div 
            className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed break-words overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              lineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {getContentPreview(question.content)}
          </div>
        </div>

        {/* Tags Section */}
        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 my-2 min-h-[36px] items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">برچسب‌ها:</span>
            {(showAllTags ? question.tags : question.tags.slice(0, 5)).map((tag) => (
              <BaseBadge
                key={tag.id}
                size="sm"
                variant="info"
                className="px-2 py-1 border border-blue-300 dark:border-blue-700 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
              >
                {tag.name}
              </BaseBadge>
            ))}
            {question.tags.length > 5 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                style={{ alignSelf: 'center' }}
              >
                {showAllTags ? 'نمایش کمتر' : `+${question.tags.length - 5} بیشتر`}
              </button>
            )}
          </div>
        )}

        {/* Section 3: User Info and Stats */}
        <div className="flex w-full items-center border-t border-gray-200 dark:border-gray-700 pt-4 text-sm text-gray-500 dark:text-gray-400 min-w-0 overflow-hidden">
          {/* User Info and Stats */}
          <div className="flex items-center flex-wrap gap-6 text-xs md:text-sm">
            {/* User Info */}
            {question.user && (
              <Link
                href={`/authors/${question.user?.username ?? question.user?.id}`}
                className="flex items-center gap-2 hover:underline text-blue-600 dark:text-blue-500"
              >
                <BaseAvatar 
                  src={userAvatarSrc(question.user)} 
                  name={question.user.name} 
                  size="sm" 
                />
                <span>{question.user.name}</span>
              </Link>
            )}
            
            {/* Stats */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {question.answers_count || 0} <span className="hidden md:block">پاسخ</span>
            </span>
            
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {question.votes_count || 0} <span className="hidden md:block">رای</span>
            </span>
            
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {question.views || question.views_count || 0} <span className="hidden md:block">بازدید</span>
            </span>
            
            {/* Solved Badge */}
            {question.is_solved && (
              <span className="flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                #حل شده
              </span>
            )}

            {/* Unpublished Answers Badge */}
            {(question.unpublished_answers_count || 0) > 0 && (
              <BaseBadge
                variant="warning"
                size="sm"
                className="flex items-center gap-1 border border-yellow-300 dark:border-yellow-500"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="hidden md:inline">{question.unpublished_answers_count} پاسخ منتشر نشده</span>
                <span className="md:hidden">{question.unpublished_answers_count}</span>
              </BaseBadge>
            )}

            {/* Comments Count Badge */}
            {(question.comments_count || 0) > 0 && (
              <BaseBadge
                variant="info"
                size="sm"
                className="flex items-center gap-1 border border-blue-300 dark:border-blue-500"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="hidden md:inline">{question.comments_count} نظر</span>
                <span className="md:hidden">{question.comments_count}</span>
              </BaseBadge>
            )}

            {/* Unpublished Comments Badge */}
            {(question.unpublished_comments_count || 0) > 0 && (
              <BaseBadge
                variant="warning"
                size="sm"
                className="flex items-center gap-1 border border-yellow-300 dark:border-yellow-500"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="hidden md:inline">{question.unpublished_comments_count} نظر منتشر نشده</span>
                <span className="md:hidden">{question.unpublished_comments_count}</span>
              </BaseBadge>
            )}
          </div>

          {/* Unpublished Badge */}
          {!question.published && (
            <BaseBadge
              variant="warning"
              size="sm"
              className="flex items-center gap-1 border border-yellow-300 dark:border-yellow-500 ml-auto mr-2"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.981-1.743 2.981H4.42c-1.53 0-2.493-1.647-1.743-2.981l5.58-9.92zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-6a1 1 0 00-.993.883L9 8v3a1 1 0 001.993.117L11 11V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              منتشر نشده
            </BaseBadge>
          )}
        </div>
      </div>
    </BaseCard>
  );
}
