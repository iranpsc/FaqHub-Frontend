'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { BaseAvatar } from '../ui/BaseAvatar';
import { userAvatarSrc } from '@/lib/avatar';
import { VoteButtons } from '../ui/VoteButtons';
import { BaseEditor } from '../ui/BaseEditor';
import { SanitizedContent } from '../ui/SanitizedContent';
import { CommentsSection } from './CommentsSection';
import { useAuth } from '../../contexts/AuthContext';
import { useAnswers } from '../../hooks/useAnswers';
import { useSweetAlert } from '../../hooks/useSweetAlert';
import { Answer, VoteData, VoteChangedData, AnswerCorrectnessData, CommentData, PaginationMeta } from '../../services/types';

interface AnswersSectionProps {
  questionId: string;
  answers: Answer[];
  onAnswerAdded: () => void;
  onVoteChanged: (voteData: VoteChangedData) => void;
  onAnswerCorrectnessChanged: (data: AnswerCorrectnessData) => void;
  onCommentAdded: (commentData: CommentData) => void;
}

export function AnswersSection({
  questionId,
  answers,
  onAnswerAdded,
  onVoteChanged,
  onAnswerCorrectnessChanged,
  onCommentAdded
}: AnswersSectionProps) {
  const { isAuthenticated } = useAuth();
  const {
    isSubmitting: isSubmittingAnswer,
    isUpdating: isUpdatingAnswer,
    isDeleting: isDeletingAnswer,
    addAnswer: addAnswerApi,
    updateAnswer,
    deleteAnswer: deleteAnswerApi,
    publishAnswer: publishAnswerApi,
    toggleAnswerCorrectness: toggleAnswerCorrectnessApi,
    fetchAnswers: fetchAnswersApi
  } = useAnswers();
  const { fire } = useSweetAlert();

  const [newAnswer, setNewAnswer] = useState('');
  const [editingAnswer, setEditingAnswer] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPublishingAnswer, setIsPublishingAnswer] = useState<string | null>(null);
  const [isTogglingCorrectness, setIsTogglingCorrectness] = useState<string | null>(null);

  // Pagination state
  const [paginatedAnswers, setPaginatedAnswers] = useState<Answer[]>([]);
  const [answersPagination, setAnswersPagination] = useState<PaginationMeta | null>(null);
  const [currentAnswersPage, setCurrentAnswersPage] = useState(1);
  const [isLoadingMoreAnswers, setIsLoadingMoreAnswers] = useState(false);
  const [usePagination, setUsePagination] = useState(false);

  // Filtering state
  const defaultFilter = 'newest';
  const [selectedFilter, setSelectedFilter] = useState(defaultFilter);
  const [showFilters, setShowFilters] = useState(false);
  const filterWrapper = useRef<HTMLDivElement>(null);

  const filterOptions = [
    { value: 'newest', label: 'جدیدترین' },
    { value: 'oldest', label: 'قدیمی‌ترین' },
    { value: 'votes', label: 'بیشترین رای' },
    { value: 'comments', label: 'بیشترین نظر' },
    { value: 'correct', label: 'پاسخ‌های صحیح' }
  ];

  const currentFilterLabel = filterOptions.find(o => o.value === selectedFilter)?.label || 'جدیدترین';
  const showClearFilter = selectedFilter !== defaultFilter;

  // Computed properties
  const hasMoreAnswers = usePagination && answersPagination && answersPagination.current_page < answersPagination.last_page;

  // Use either paginated answers or props answers based on mode
  const displayAnswers = usePagination ? paginatedAnswers : answers;
  const { login } = useAuth();
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  // Sort answers based on selected filter
  const sortedAnswers = displayAnswers.filter(answer => {
    // Filter for correct answers only
    if (selectedFilter === 'correct') {
      return answer.is_correct;
    }
    return true;
  }).sort((a, b) => {
    switch (selectedFilter) {
      case 'votes':
        const aScore = (a.votes?.upvotes || 0) - (a.votes?.downvotes || 0);
        const bScore = (b.votes?.upvotes || 0) - (b.votes?.downvotes || 0);
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'comments':
        const aComments = a.comments ? a.comments.length : (a.comments_count || 0);
        const bComments = b.comments ? b.comments.length : (b.comments_count || 0);
        if (bComments !== aComments) return bComments - aComments;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const formatNumber = (num: number) => new Intl.NumberFormat('fa-IR').format(num);

  const formatRelativeDate = (dateString: string) => {
    const englishAgoMatch = dateString.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i);
    if (englishAgoMatch) {
      const [, amount, unit] = englishAgoMatch;
      const unitMap: Record<string, string> = {
        second: 'ثانیه',
        minute: 'دقیقه',
        hour: 'ساعت',
        day: 'روز',
        week: 'هفته',
        month: 'ماه',
        year: 'سال',
      };
      return `${amount} ${unitMap[unit.toLowerCase()]} پیش`;
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString.replace(/\s*ago\s*/gi, ' پیش');
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'همین الان';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} دقیقه پیش`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ساعت پیش`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} روز پیش`;
    }

    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const canUpdate = (answer: Answer) => {
    return !!(answer?.can?.update);
  };

  const canDelete = (answer: Answer) => {
    return !!(answer?.can?.delete);
  };

  const selectFilter = async (value: string) => {
    await changeFilter(value);
    setShowFilters(false);
  };

  const changeFilter = async (filter: string) => {
    if (selectedFilter === filter) return;
    setSelectedFilter(filter);
    if (usePagination) {
      await fetchPaginatedAnswers(1, false);
    }
  };

  const fetchPaginatedAnswers = useCallback(async (page = 1, append = false) => {
    const result = await fetchAnswersApi(questionId, page);
    if (result.success && result.data) {
      if (append) {
        setPaginatedAnswers(prev => [...prev, ...result.data]);
      } else {
        setPaginatedAnswers(result.data);
      }
      setAnswersPagination(result.meta);
      setCurrentAnswersPage(page);
    }
  }, [fetchAnswersApi, questionId, setPaginatedAnswers, setAnswersPagination, setCurrentAnswersPage]);

  const loadMoreAnswers = async () => {
    if (!hasMoreAnswers || isLoadingMoreAnswers) return;
    setIsLoadingMoreAnswers(true);
    try {
      await fetchPaginatedAnswers(currentAnswersPage + 1, true);
    } finally {
      setIsLoadingMoreAnswers(false);
    }
  };

  const initializePagination = useCallback(async () => {
    if (answers.length === 0) {
      setUsePagination(true);
      await fetchPaginatedAnswers();
    }
  }, [answers.length, fetchPaginatedAnswers]);

  const toggleFilterDropdown = () => {
    setShowFilters(!showFilters);
  };

  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (!filterWrapper.current) return;
      if (!filterWrapper.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    initializePagination();
  }, [initializePagination]);

  const submitAnswer = async () => {
    if (!newAnswer.trim()) return;

    const result = await addAnswerApi(questionId, newAnswer);
    if (result.success) {
      setNewAnswer('');
      onAnswerAdded();
      if (usePagination) {
        await fetchPaginatedAnswers(1, false);
      }
    }
  };

  const startEdit = (answer: Answer) => {
    setEditingAnswer(answer.id);
    setEditContent(answer.content);
  };

  const cancelEdit = () => {
    setEditingAnswer(null);
    setEditContent('');
  };

  const saveEdit = async (answer: Answer) => {
    if (!editContent.trim()) return;

    const result = await updateAnswer(answer.id, editContent);
    if (result.success) {
      cancelEdit();
      onAnswerAdded();
      if (usePagination) {
        await fetchPaginatedAnswers(currentAnswersPage, false);
      }
    }
  };

  const deleteAnswerAction = async (answer: Answer) => {
    const result = await fire({
      title: 'آیا مطمئن هستید؟',
      text: 'آیا مطمئن هستید که میخواهید این پاسخ را حذف کنید؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'بله، حذف کن!',
      cancelButtonText: 'انصراف',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    const deleteResult = await deleteAnswerApi(answer.id);
    if (deleteResult.success) {
      onAnswerAdded();

      // If using internal pagination, refetch to remove the deleted answer from the list
      if (usePagination) {
        const targetPage = Math.max(1, currentAnswersPage);
        await fetchPaginatedAnswers(targetPage, false);
      }
    }
  };

  const handleAnswerVoteChanged = (answerId: string, voteData: VoteData) => {
    onVoteChanged({
      type: 'answer',
      id: answerId,
      votes: {
        upvotes: voteData.upvotes,
        downvotes: voteData.downvotes,
        user_vote: voteData.userVote
      }
    });
    if (usePagination) {
      const index = paginatedAnswers.findIndex(a => a.id === answerId);
      if (index !== -1) {
        const updated = { ...paginatedAnswers[index] } as Answer;
        updated.votes = {
          upvotes: voteData.upvotes,
          downvotes: voteData.downvotes,
          score: voteData.upvotes - voteData.downvotes,
          user_vote: voteData.userVote
        };
        const newList = [...paginatedAnswers];
        newList[index] = updated;
        setPaginatedAnswers(newList);
      }
    }
  };

  const publishAnswer = async (answer: Answer) => {
    setIsPublishingAnswer(answer.id);
    try {
      const result = await publishAnswerApi(answer.id);
      if (result.success) {
        onAnswerAdded();

        // If using internal pagination, refresh list to reflect publish state
        if (usePagination) {
          await fetchPaginatedAnswers(currentAnswersPage, false);
        }
      }
    } catch (error) {
      console.error('Error publishing answer:', error);
    } finally {
      setIsPublishingAnswer(null);
    }
  };

  const toggleAnswerCorrectness = async (answer: Answer, event: React.ChangeEvent<HTMLInputElement>) => {
    setIsTogglingCorrectness(answer.id);
    try {
      const result = await toggleAnswerCorrectnessApi(answer.id);
      if (result.success && result.data) {
        // Emit event to parent to update question solved status and answer locally
        onAnswerCorrectnessChanged({
          answerId: answer.id,
          isCorrect: result.data.is_correct as boolean
        });

        // Update local state immediately
        answer.is_correct = result.data.is_correct as boolean;
        if (result.data.can) {
          // Refresh permission (may become false after marking correct)
          if (!answer.can) answer.can = {};
          answer.can.toggle_correctness = (result.data.can as Record<string, unknown>).toggle_correctness as boolean;
        }
      }
    } catch (error) {
      // Revert checkbox state on error
      event.target.checked = !event.target.checked;
      console.error('Error toggling answer correctness:', error);
    } finally {
      setIsTogglingCorrectness(null);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        پاسخ‌ها ({usePagination ? (answersPagination?.total || sortedAnswers.length) : sortedAnswers.length})
      </h3>

      {/* Filters Dropdown */}
      <div className="mb-6 relative" ref={filterWrapper}>
        <button
          onClick={toggleFilterDropdown}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-200"
        >
          <span>مرتب سازی بر اساس:</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">{currentFilterLabel}</span>
          <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showFilters && (
          <div className="absolute z-30 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded shadow-lg overflow-hidden">
            <ul className="py-1 text-sm">
              {filterOptions.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => selectFilter(option.value)}
                    className={`w-full text-right px-4 py-2 flex items-center justify-between gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${selectedFilter === option.value
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-200'
                      }`}
                  >
                    <span>{option.label}</span>
                    {selectedFilter === option.value && <span className="text-xs">✓</span>}
                  </button>
                </li>
              ))}
              {showClearFilter && (
                <li>
                  <button
                    onClick={() => selectFilter(defaultFilter)}
                    className="w-full text-right px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs"
                  >
                    حذف فیلتر (بازنشانی)
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Add Answer Form */}
      {isAuthenticated ? (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            پاسخ خود را ثبت کنید
          </h4>
          <form onSubmit={(e) => { e.preventDefault(); submitAnswer(); }}>
            <BaseEditor
              value={newAnswer}
              onChange={setNewAnswer}
              placeholder="پاسخ خود را بنویسید..."
              imageUpload={true}
              rtl={true}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={!newAnswer.trim() || isSubmittingAnswer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingAnswer ? 'در حال ارسال...' : 'ارسال پاسخ'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-8 border border-gray-200 dark:border-gray-600 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            برای ثبت پاسخ، لطفا وارد <span className='text-blue-500 cursor-pointer' onClick={handleLogin} > حساب کاربری</span> خود شوید.
          </p>
        </div>
      )}

      {/* Answers List */}
      <div className="space-y-8">
        {sortedAnswers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            هنوز پاسخی ثبت نشده است. اولین نفری باشید که پاسخ می‌دهد!
          </div>
        ) : (
          sortedAnswers.map((answer) => (
            <div
              key={answer.id}
              className={"bg-white dark:bg-gray-800 rounded-lg shadow-sm w-full min-w-0 overflow-hidden"}
            >
              <div className={`p-4 sm:p-8 ${answer.is_correct ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                <div className="flex items-start gap-3 sm:gap-5 min-w-0">
                  {answer.user ? (
                    <Link
                      href={`/authors/${answer.user?.username ?? answer.user?.id}`}
                      className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded group"
                      title={`نمایش پروفایل ${answer.user?.name || ''}`}
                    >
                      <BaseAvatar
                        src={userAvatarSrc(answer.user)}
                        name={answer.user?.name}
                        size="md"
                        className="transition-transform group-hover:scale-105"
                      />
                    </Link>
                  ) : (
                    <BaseAvatar
                      src={undefined}
                      name="کاربر ناشناس"
                      size="md"
                      className="flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-row sm:flex-row justify-between gap-2">
                      <div className="flex flex-col justify-start min-w-0">
                        {answer.user ? (
                          <Link
                            href={`/authors/${answer.user?.username ?? answer.user?.id}`}
                            className="font-medium text-gray-900 dark:text-gray-100 truncate hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                          >
                            {answer.user?.name}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            کاربر ناشناس
                          </span>
                        )}
                        <span className="text-xs md:text-sm text-blue-600 whitespace-nowrap">
                          امتیاز: {formatNumber(answer.user?.score || 0)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatRelativeDate(answer.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Answer Content - full row on small screens */}
                {editingAnswer !== answer.id ? (
                  <div className="mt-4 sm:mt-6 w-full overflow-hidden">
                    <SanitizedContent
                      content={answer.content}
                      className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 break-words"
                    />
                  </div>
                ) : (
                  <div className="mt-4 sm:mt-6 w-full">
                    <BaseEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="پاسخ خود را ویرایش کنید..."
                      imageUpload={true}
                      rtl={true}
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => saveEdit(answer)}
                        disabled={!editContent.trim() || isUpdatingAnswer}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isUpdatingAnswer ? 'در حال ذخیره...' : 'ذخیره'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 sm:px-8 py-4 flex flex-row flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-6 flex-wrap min-w-0">
                  {answer.is_correct && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                      تایید شده
                    </span>
                  )}
                  {!answer.published && (
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                      منتشر نشده
                    </span>
                  )}
                  {answer.can?.publish && (
                    <button
                      onClick={() => publishAnswer(answer)}
                      disabled={isPublishingAnswer === answer.id}
                      className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {isPublishingAnswer === answer.id ? 'در حال انتشار...' : 'انتشار'}
                    </button>
                  )}
                  {canUpdate(answer) && (
                    <button
                      onClick={() => startEdit(answer)}
                      className="text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                    >
                      ویرایش
                    </button>
                  )}
                  {canDelete(answer) && (
                    <button
                      onClick={() => deleteAnswerAction(answer)}
                      disabled={isDeletingAnswer === answer.id}
                      className="text-sm text-red-600 hover:text-red-800 whitespace-nowrap"
                    >
                      {isDeletingAnswer === answer.id ? 'در حال حذف...' : 'حذف'}
                    </button>
                  )}
                  {answer.can?.toggle_correctness && (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        id={`correctness-${answer.id}`}
                        checked={answer.is_correct}
                        onChange={(e) => toggleAnswerCorrectness(answer, e)}
                        disabled={isTogglingCorrectness === answer.id}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors disabled:opacity-50"
                      />
                      <label
                        htmlFor={`correctness-${answer.id}`}
                        className={`text-sm cursor-pointer transition-colors select-none ${answer.is_correct
                            ? 'text-green-600 dark:text-green-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400'
                          } ${isTogglingCorrectness === answer.id ? 'opacity-50' : ''}`}
                      >
                        {isTogglingCorrectness === answer.id
                          ? 'در حال تغییر...'
                          : 'پاسخ صحیح'
                        }
                      </label>
                    </div>
                  )}
                </div>

                {/* Voting Section */}
                <div className="flex justify-end flex-shrink-0">
                  <VoteButtons
                    resourceType="answer"
                    resourceId={answer.id}
                    initialUpvotes={answer.votes?.upvotes || 0}
                    initialDownvotes={answer.votes?.downvotes || 0}
                    initialUserVote={answer.votes?.user_vote}
                    onVoteChanged={(voteData) => handleAnswerVoteChanged(answer.id, voteData)}
                  />
                </div>
              </div>

              {/* Answer Comments Section */}
              <div className="px-2 sm:px-4 pb-4">
                <CommentsSection
                  answerId={answer.id}
                  parentType="answer"
                  onCommentAdded={() => onCommentAdded({})}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More Answers Button */}
      {hasMoreAnswers && (
        <div className="text-center mt-6">
          <button
            onClick={loadMoreAnswers}
            disabled={isLoadingMoreAnswers}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMoreAnswers ? 'در حال بارگذاری...' : 'نمایش پاسخ‌های بیشتر'}
          </button>
        </div>
      )}
    </div>
  );
}
