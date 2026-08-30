'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BaseAvatar } from '../ui/BaseAvatar';
import { VoteButtons } from '../ui/VoteButtons';
import { useAuth } from '../../contexts/AuthContext';
import { useComments } from '../../hooks/useComments';
import { useSweetAlert } from '../../hooks/useSweetAlert';
import { Comment, VoteData } from '../../services/types';

interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
}

interface CommentsSectionProps {
  questionId?: string;
  answerId?: string;
  parentType: 'question' | 'answer';
  onCommentAdded?: () => void;
}

export function CommentsSection({ 
  questionId, 
  answerId, 
  parentType, 
  onCommentAdded 
}: CommentsSectionProps) {
  const { isAuthenticated } = useAuth();
  const {
    comments,
    isSubmitting,
    isUpdating,
    isDeleting,
    addComment: addCommentApi,
    updateComment,
    deleteComment: deleteCommentApi,
    publishComment: publishCommentApi,
    fetchComments
  } = useComments();
  const { fire } = useSweetAlert();

  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPublishingComment, setIsPublishingComment] = useState<string | null>(null);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentsPagination, setCommentsPagination] = useState<PaginationMeta | null>(null);
  const [currentCommentsPage, setCurrentCommentsPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const parentId = parentType === 'question' ? questionId : answerId;

  const hasMoreComments = commentsPagination && commentsPagination.current_page < commentsPagination.last_page;
  const { login } = useAuth();
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  const fetchCommentsData = useCallback(async (parentId: string, parentType: 'question' | 'answer', page = 1) => {
    const result = await fetchComments(parentId, parentType);
    if (result && result.success) {
      // Assuming the API returns pagination metadata
      setCommentsPagination(result.meta || null);
      setCurrentCommentsPage(page);
      // Comments are managed by the hook, so we don't need to update them here
    }
  }, [fetchComments]);

  useEffect(() => {
    if (parentId) {
      fetchCommentsData(parentId, parentType);
    }
  }, [parentId, parentType, fetchCommentsData]);

  const loadMoreComments = async () => {
    if (!hasMoreComments || isLoadingMore || !parentId) return;
    setIsLoadingMore(true);
    try {
      await fetchCommentsData(parentId, parentType as 'question' | 'answer', currentCommentsPage + 1);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('fa-IR').format(num);

  const handleCommentVoteChanged = (_commentId: string, _voteData: VoteData) => {
    // Vote changes are reflected by the hook
  };

  const submitComment = async () => {
    if (!newComment.trim() || !parentId) return;
    
    const result = await addCommentApi(parentId, newComment, parentType);
    if (result.success) {
      // Add the new comment to the top of the list
      // Note: This assumes the hook doesn't automatically update the comments list
      // If it does, we might need to access the comments state differently
      setNewComment('');
      setShowCommentBox(false);
      // Update pagination total if we have pagination data
      if (commentsPagination) {
        setCommentsPagination({ ...commentsPagination, total: commentsPagination.total + 1 });
      }
      onCommentAdded?.();
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const saveEdit = async (comment: Comment) => {
    if (!editContent.trim()) return;
    
    const result = await updateComment(comment.id, editContent);
    if (result.success) {
      cancelEdit();
    }
  };

  const deleteComment = async (comment: Comment) => {
    const result = await fire({
      title: 'حذف نظر',
      text: 'آیا مطمئن هستید که می‌خواهید این نظر را حذف کنید؟',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'بله، حذف کن',
      cancelButtonText: 'انصراف',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      const deleteResult = await deleteCommentApi(comment.id);
      if (deleteResult.success) {
        // Comment will be removed from the list by the hook
      }
    }
  };

  const publishComment = async (comment: Comment) => {
    setIsPublishingComment(comment.id);
    try {
      const result = await publishCommentApi(comment.id);
      if (result.success) {
        // Comment published status will be updated by the hook
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error publishing comment:', error);
      }
    } finally {
      setIsPublishingComment(null);
    }
  };

  return (
    <div className={`${
      parentType === 'question'
        ? 'bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6 w-full min-w-0 overflow-hidden'
        : 'mt-4 border-t border-gray-200 dark:border-gray-600 pt-4 w-full min-w-0'
    }`}>
      <h2 className={`${
        parentType === 'question'
          ? 'text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4'
          : 'text-sm font-medium text-gray-900 dark:text-gray-100 mb-3'
      }`}>
        نظرات {parentType === 'question' ? 'کاربران' : ''} ({commentsPagination?.total || comments.length})
      </h2>

      {/* Comments List */}
      <div className={`${parentType === 'question' ? 'space-y-4 mb-6' : 'space-y-3 mb-4'}`}>
        {comments.length === 0 ? (
          <div className={`${
            parentType === 'question'
              ? 'text-center py-8 text-gray-500 dark:text-gray-400'
              : 'text-center py-4 text-gray-500 dark:text-gray-400 text-sm'
          }`}>
            هنوز نظری ثبت نشده است{parentType === 'question' ? '. اولین نفری باشید که نظر می‌دهد!' : '.'}
          </div>
        ) : (
          comments.map((comment: Comment) => (
            <div
              key={comment.id}
              className={`${
                parentType === 'question'
                  ? 'bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4'
                  : 'bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                {comment.user ? (
                  <Link
                    href={`/authors/${comment.user?.username ?? comment.user?.id}`}
                    className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded group"
                    title={`نمایش پروفایل ${comment.user?.name || ''}`}
                  >
                    <BaseAvatar
                      src={comment.user?.image_url}
                      name={comment.user?.name}
                      size={parentType === 'question' ? 'sm' : 'xs'}
                      className="transition-transform group-hover:scale-105"
                    />
                  </Link>
                ) : (
                  <BaseAvatar
                    src={undefined}
                    name="کاربر ناشناس"
                    size={parentType === 'question' ? 'sm' : 'xs'}
                    className="flex-shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className={`${
                    parentType === 'question'
                      ? 'flex flex-wrap items-center gap-2'
                      : 'flex flex-wrap items-center gap-2'
                  }`}>
                    {comment.user ? (
                      <Link
                        href={`/authors/${comment.user?.username ?? comment.user?.id}`}
                        className={`${
                          parentType === 'question'
                            ? 'font-medium text-gray-900 dark:text-gray-100 truncate hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
                            : 'font-medium text-gray-900 dark:text-gray-100 text-sm truncate hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
                        }`}
                      >
                        {comment.user?.name}
                      </Link>
                    ) : (
                      <span className={`${
                        parentType === 'question'
                          ? 'font-medium text-gray-900 dark:text-gray-100 truncate'
                          : 'font-medium text-gray-900 dark:text-gray-100 text-sm truncate'
                      }`}>
                        کاربر ناشناس
                      </span>
                    )}

                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      امتیاز: {formatNumber(comment.user?.score || 0)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{comment.created_at}</span>
                    {comment.updated_at !== comment.created_at && (
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        (ویرایش شده: {comment.updated_at})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Comment Content - full row */}
              {editingComment !== comment.id ? (
                <p className="mt-2 w-full text-gray-700 dark:text-gray-300 text-sm leading-relaxed break-words overflow-wrap-anywhere">
                  {comment.content}
                </p>
              ) : (
                <div className={`mt-2 w-full ${parentType === 'question' ? 'mb-3' : 'mb-2'}`}>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={parentType === 'question' ? 3 : 2}
                    className={`${
                      parentType === 'question'
                        ? 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm resize-none'
                        : 'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm resize-none'
                    }`}
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveEdit(comment)}
                      disabled={!editContent.trim() || isUpdating}
                      className={`${
                        parentType === 'question'
                          ? 'px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50'
                          : 'px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50'
                      }`}
                    >
                      {isUpdating ? 'در حال ذخیره...' : 'ذخیره'}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className={`${
                        parentType === 'question'
                          ? 'px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600'
                          : 'px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600'
                      }`}
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              )}

              {/* Actions - full row */}
              <div className={`${
                parentType === 'question'
                  ? 'flex flex-row flex-wrap items-center justify-between gap-3 mt-2 w-full'
                  : 'flex flex-row flex-wrap items-center justify-between gap-2 mt-2 w-full'
              }`}>
                    {/* Publish */}
                    <div className="flex items-center gap-2">
                      {!comment.published && (
                        <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 whitespace-nowrap">
                          منتشر نشده
                        </span>
                      )}
                      {comment.can?.publish && (
                        <button
                          onClick={() => publishComment(comment)}
                          disabled={isPublishingComment === comment.id}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          {isPublishingComment === comment.id ? 'در حال انتشار...' : 'انتشار'}
                        </button>
                      )}
                    </div>

                    {/* Voting */}
                    <VoteButtons
                      resourceType="comment"
                      resourceId={comment.id}
                      initialUpvotes={comment.votes?.upvotes || 0}
                      initialDownvotes={comment.votes?.downvotes || 0}
                      initialUserVote={comment.votes?.user_vote}
                      size="small"
                      onVoteChanged={(voteData: VoteData) => handleCommentVoteChanged(comment.id, voteData)}
                    />

                    {/* Edit/Delete */}
                    {comment.can?.update && (
                      <div className="flex items-center gap-2">
                        {editingComment !== comment.id && (
                          <button
                            onClick={() => startEdit(comment)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            ✏️ ویرایش
                          </button>
                        )}
                      </div>
                    )}

                    {comment.can?.delete && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteComment(comment)}
                          className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                          disabled={isDeleting === comment.id}
                        >
                          🗑️ {isDeleting === comment.id ? 'در حال حذف...' : 'حذف'}
                        </button>
                      </div>
                    )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show More Comments */}
      {hasMoreComments && (
        <div className="text-center mb-4">
          <button
            onClick={loadMoreComments}
            disabled={isLoadingMore}
            className={`${
              parentType === 'question'
                ? 'px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                : 'px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isLoadingMore ? 'در حال بارگذاری...' : 'نمایش نظرات بیشتر'}
          </button>
        </div>
      )}

      {/* Add Comment */}
      {isAuthenticated ? (
        <>
          {/* دکمه باز کردن فرم */}
          {!showCommentBox && (
            <div className="text-center mt-4">
              <button
                onClick={() => setShowCommentBox(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                ثبت نظر جدید
              </button>
            </div>
          )}

          {/* فرم نظر دادن */}
          {showCommentBox && (
            <div className={`${
              parentType === 'question'
                ? 'border-t border-gray-200 dark:border-gray-600 pt-4'
                : 'border-t border-gray-200 dark:border-gray-600 pt-3'
            }`}>
              {parentType === 'question' && (
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  دیدگاه خود را وارد کنید...
                </h4>
              )}
              <form onSubmit={(e) => { e.preventDefault(); submitComment(); }} className={`${parentType === 'question' ? 'space-y-3' : 'space-y-2'}`}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={parentType === 'question' ? 3 : 2}
                  placeholder="نظر خود را بنویسید..."
                  className={`${
                    parentType === 'question'
                      ? 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm resize-none'
                      : 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm resize-none'
                  }`}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCommentBox(false)}
                    className="px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'در حال ارسال...' : 'ارسال نظر'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      ) : (
        /* Login prompt */
        <div className={`${
          parentType === 'question'
            ? 'border-t border-gray-200 dark:border-gray-600 pt-4 text-center'
            : 'border-t border-gray-200 dark:border-gray-600 pt-3 text-center'
        }`}>
          <p className={`${
            parentType === 'question'
              ? 'text-gray-600 dark:text-gray-400 text-sm'
              : 'text-gray-600 dark:text-gray-400 text-xs'
          }`}>
            برای ثبت نظر، لطفا وارد  <span className='text-blue-500 cursor-pointer' onClick={handleLogin}>حساب کاربری </span> خود شوید.
          </p>
        </div>
      )}
    </div>
  );
}

