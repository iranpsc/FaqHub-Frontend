import { useState, useCallback } from 'react';
import { apiService } from '@/services/api';
import { Comment } from '@/services/types';

export function useComments(initialComments: Comment[] = []) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchComments = useCallback(async (
    parentId: string,
    parentType: 'question' | 'answer',
    page: number = 1,
    append: boolean = false
  ) => {
    setIsLoading(true);
    try {
      const response = await apiService.getComments(parentId, parentType, page);
      setComments((previous) => append ? [...previous, ...(response.data || [])] : (response.data || []));
      return { success: true, data: response.data, meta: response.meta };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { success: false, error: error instanceof Error ? error.message : 'خطا در بارگذاری نظرات' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addComment = useCallback(async (parentId: string, content: string, parentType: 'question' | 'answer') => {
    setIsSubmitting(true);
    try {
      const result = await apiService.addComment(parentId, content, parentType);
      if (result.success && result.data) {
        setComments(prev => [result.data as unknown as Comment, ...prev]);
      }
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطا در ایجاد نظر' 
      };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateComment = useCallback(async (commentId: string, content: string) => {
    setIsUpdating(true);
    try {
      const result = await apiService.updateComment(commentId, content);
      if (result.success && result.data) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: result.data!.content as string, updated_at: result.data!.updated_at as string }
            : comment
        ));
      }
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطا در ویرایش نظر' 
      };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const deleteComment = useCallback(async (commentId: string) => {
    setIsDeleting(commentId);
    try {
      const result = await apiService.deleteComment(commentId);
      if (result.success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
      }
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطا در حذف نظر' 
      };
    } finally {
      setIsDeleting(null);
    }
  }, []);

  const publishComment = useCallback(async (commentId: string) => {
    try {
      const result = await apiService.publishComment(commentId);
      if (result.success) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, published: true }
            : comment
        ));
      }
      return result;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'خطا در انتشار نظر' 
      };
    }
  }, []);

  return {
    comments,
    isLoading,
    isSubmitting,
    isUpdating,
    isDeleting,
    fetchComments,
    addComment,
    updateComment,
    deleteComment,
    publishComment
  };
}
