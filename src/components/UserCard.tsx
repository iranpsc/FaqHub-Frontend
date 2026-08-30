'use client';

import { BaseAvatar } from './ui/BaseAvatar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User } from '@/services/api';

interface UserCardProps {
  user: User;
  className?: string;
  inSlider?: boolean;
}

export function UserCard({ user, className, inSlider = false }: UserCardProps) {
  const router = useRouter();
  const formatNumber = (number: number | undefined) => {
    if (!number && number !== 0) return '0';
    
    const num = parseInt(number.toString());
    if (num >= 1000000) {
      return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) {
      return Math.floor(num / 1000) + 'K';
    }
    return num.toString();
  };

  // Use username for the link, fall back to id if username is not available
  const authorLink = user.username ? `/authors/${user.username}` : `/authors/${user.id}`;

  const cardClassName = `bg-white dark:bg-gray-800 px-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col hover:transform hover:-translate-y-0.5 ${className || ''}`;

  const cardContent = (
      <div className={cardClassName}>
        {/* User Avatar */}
        <div className="mb-3">
          <BaseAvatar 
            src={user.image_url} 
            name={user.name} 
            size="2xl" 
            className="mx-auto" 
          />
        </div>

        {/* User Name */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {user.name}
        </h3>

        {/* User Score Badge */}
        <div className="flex justify-center mb-4">
          <span className="inline-flex items-center px-3 py-1 pt-[5px] rounded-full text-gray-800 dark:text-gray-200 text-sm font-bold border border-gray-300 dark:border-gray-500">
            <span className="text-xs md:text-sm font-normal">امتیاز</span>
            <span className="font-normal text-xs md:text-sm mx-1">: {formatNumber(user.score)}</span>
          </span>
        </div>

        {/* User Level Badge */}
        {user.level_name && (
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm font-medium border border-green-300 dark:border-green-600">
              <span className="ml-2">{user.level_name}</span>
              <span className="ml-2 text-xs font-normal">سطح</span>
            </span>
          </div>
        )}

        {/* Answers Count */}
        <div className="mb-2 flex gap-[6px] items-center mx-auto">
          <svg className="inline w-5 h-5 text-blue-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 3v-3a2 2 0 01-1-1.732V5zm2-1a1 1 0 00-1 1v8c0 .265.105.52.293.707L5 16.414V15a1 1 0 011-1h9a1 1 0 001-1V5a1 1 0 00-1-1H4z" />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">پاسخ داده شده : </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatNumber(user.answers_count)}
          </span>
        </div>

        {/* Comments Count */}
        <div className="mb-4 flex gap-[6px] items-center mx-auto">
          <svg className="inline w-5 h-5 text-green-500 dark:text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 10c0 3.866-3.582 7-8 7a8.96 8.96 0 01-3.468-.664l-3.17.634a1 1 0 01-1.18-1.18l.634-3.17A8.96 8.96 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zm-8-5C6.134 5 3 7.239 3 10c0 1.13.47 2.19 1.32 3.07a1 1 0 01.26.95l-.37 1.85 1.85-.37a1 1 0 01.95.26A6.96 6.96 0 0010 15c3.866 0 7-2.239 7-5s-3.134-5-7-5z" />
          </svg>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">نظر داده شده : </span>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {formatNumber(user.comments_count)}
          </span>
        </div>

        {/* Divider */}
        <hr className="border-t border-gray-200 dark:border-gray-700 my-4" />

        {/* Footer Chat Button */}
        <div className="mt-auto">
          <button
            className="flex w-full justify-between items-center px-4 py-3 rounded-lg bg-blue-200 dark:bg-gray-900 text-yellow-400 font-bold transition-colors focus:outline-none gap-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Implement chat functionality
            }}
          >
            <div>
              <span className="mr-2 text-blue-600 dark:text-yellow-400">گفتگو</span>
            </div>
            <div>
              <svg className="w-5 h-5 text-blue-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 10c0 3.866-3.582 7-8 7a8.96 8.96 0 01-3.468-.664l-3.17.634a1 1 0 01-1.18-1.18l.634-3.17A8.96 8.96 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zm-8-5C6.134 5 3 7.239 3 10c0 1.13.47 2.19 1.32 3.07a1 1 0 01.26.95l-.37 1.85 1.85-.37a1 1 0 01.95.26A6.96 6.96 0 0010 15c3.866 0 7-2.239 7-5s-3.134-5-7-5z" />
              </svg>
            </div>
          </button>
        </div>
      </div>
  );

  if (inSlider) {
    return (
      <div
        className="block h-full"
        onClick={() => router.push(authorLink)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            router.push(authorLink);
          }
        }}
        role="link"
        tabIndex={0}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link href={authorLink} className="block h-full">
      {cardContent}
    </Link>
  );
}
