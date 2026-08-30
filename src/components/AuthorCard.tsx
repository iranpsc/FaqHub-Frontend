'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from '@/services/types';

export type AuthorStatType = 'questions' | 'answers' | 'comments';

interface AuthorCardProps {
  author: User;
  onClick?: (author: User) => void;
  activeStat?: AuthorStatType;
  onStatClick?: (stat: AuthorStatType) => void;
}

export function AuthorCard({
  author,
  onClick,
  activeStat = 'questions',
  onStatClick,
}: AuthorCardProps) {
  const [imageError, setImageError] = useState(false);

  const authorImage = imageError || !author.image_url 
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&size=64&background=3b82f6&color=fff&bold=true`
    : author.image_url;

  const formatNumber = (num: number = 0) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleStatClick = (e: React.MouseEvent, stat: AuthorStatType) => {
    e.stopPropagation();
    onStatClick?.(stat);
  };

  const interactiveClass = onStatClick
    ? ' cursor-pointer hover:ring-2 hover:ring-offset-1 dark:hover:ring-offset-gray-800'
    : '';

  const statBoxClass: Record<AuthorStatType, string> = {
    questions: onStatClick && activeStat === 'questions'
      ? 'rounded-lg p-3 cursor-pointer transition-all duration-200 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800'
      : `rounded-lg p-3 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50${interactiveClass}${onStatClick ? ' hover:ring-blue-400' : ''}`,
    answers: onStatClick && activeStat === 'answers'
      ? 'rounded-lg p-3 cursor-pointer transition-all duration-200 bg-green-50 dark:bg-green-900/30 ring-2 ring-green-500 ring-offset-1 dark:ring-offset-gray-800'
      : `rounded-lg p-3 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50${interactiveClass}${onStatClick ? ' hover:ring-green-400' : ''}`,
    comments: onStatClick && activeStat === 'comments'
      ? 'rounded-lg p-3 cursor-pointer transition-all duration-200 bg-purple-50 dark:bg-purple-900/30 ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-gray-800'
      : `rounded-lg p-3 transition-all duration-200 bg-gray-50 dark:bg-gray-700/50${interactiveClass}${onStatClick ? ' hover:ring-purple-400' : ''}`,
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-300
                 cursor-pointer transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
      onClick={() => onClick?.(author)}
    >
      {/* Author Header */}
      <div className="p-6">
        <div className="flex flex-col items-center space-y-2">
          {/* Avatar */}
          <div className="relative">
            <Image 
              src={authorImage} 
              alt={author.name} 
              width={64} 
              height={64}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              onError={handleImageError}
            />
            {/* Level Badge */}
            <div className="absolute -bottom-1 -left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full
                          font-semibold shadow-lg border-2 border-white dark:border-gray-800">
              {author.level || author.level_name || '1'}
            </div>
          </div>

          {/* Author Name */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1 text-center">
            {author.name}
          </h2>

          {/* Score */}
          <div className="flex items-center">
            امتیاز:
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {author.score || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          {/* Questions Count */}
          <div
            role={onStatClick ? 'button' : undefined}
            tabIndex={onStatClick ? 0 : undefined}
            className={statBoxClass.questions}
            onClick={(e) => onStatClick && handleStatClick(e, 'questions')}
            onKeyDown={(e) => {
              if (onStatClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                e.stopPropagation();
                onStatClick('questions');
              }
            }}
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatNumber(author.questions_count)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              سوالات
            </div>
          </div>

          {/* Answers Count */}
          <div
            role={onStatClick ? 'button' : undefined}
            tabIndex={onStatClick ? 0 : undefined}
            className={statBoxClass.answers}
            onClick={(e) => onStatClick && handleStatClick(e, 'answers')}
            onKeyDown={(e) => {
              if (onStatClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                e.stopPropagation();
                onStatClick('answers');
              }
            }}
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatNumber(author.answers_count)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              پاسخ‌ها
            </div>
          </div>

          {/* Comments Count */}
          <div
            role={onStatClick ? 'button' : undefined}
            tabIndex={onStatClick ? 0 : undefined}
            className={statBoxClass.comments}
            onClick={(e) => onStatClick && handleStatClick(e, 'comments')}
            onKeyDown={(e) => {
              if (onStatClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                e.stopPropagation();
                onStatClick('comments');
              }
            }}
          >
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatNumber(author.comments_count)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              نظرات
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
