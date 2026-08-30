'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BaseModal } from './ui/BaseModal';
import { BaseInput } from './ui/BaseInput';
import { BaseSelect } from './ui/BaseSelect';
import { BaseEditor } from './ui/BaseEditor';
import { BaseButton } from './ui/BaseButton';
import { useQuestions } from '@/hooks/useQuestions';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { Question, Category, Tag, ApiParams } from '@/services/types';
import Swal from 'sweetalert2';
import { apiService } from '@/services/api';
import { htmlToPlainText } from '@/lib/sanitize';

interface QuestionModalProps {
  visible: boolean;
  questionToEdit?: Question | null;
  onClose: () => void;
  onQuestionCreated?: (question: Question) => void;
  onQuestionUpdated?: (question: Question) => void;
}

interface FormData {
  id: string | null;
  category: Category | null;
  title: string;
  content: string;
  tags: Tag[];
}

export function QuestionModal({
  visible,
  questionToEdit,
  onClose,
  onQuestionCreated,
  onQuestionUpdated,
}: QuestionModalProps) {
  const [form, setForm] = useState<FormData>({
    id: null,
    category: null,
    title: '',
    content: '',
    tags: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    isSubmitting,
    createQuestion,
    updateQuestion,
  } = useQuestions({}, false); // Don't fetch questions on mount

  const {
    categories,
    fetchCategoriesPaginated,
    refetch: fetchCategories,
  } = useCategories(undefined, false); // Don't fetch categories on mount

  const {
    tags,
    refetch: fetchTags,
  } = useTags();

  const isEditMode = !!form.id;

  // Local option stores to support pagination/append like Vue's BaseSelect2
  const [categoryOptions, setCategoryOptions] = useState<Category[]>([]);
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const requestedTagsRef = useRef(false);
  const formTagsRef = useRef(form.tags);
  const tagsRef = useRef(tags);
  formTagsRef.current = form.tags;
  tagsRef.current = tags;

  // Fetch categories when modal becomes visible
  useEffect(() => {
    if (visible && categories.length === 0) {
      fetchCategories();
    }
  }, [visible, categories.length, fetchCategories]);

  useEffect(() => {
    if (Array.isArray(categories)) {
      setCategoryOptions(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (Array.isArray(tags)) {
      setTagOptions(tags);
    }
  }, [tags]);

  // Load tags when modal opens (guarded to once per open, even in StrictMode)
  useEffect(() => {
    if (visible && !requestedTagsRef.current && tagOptions.length === 0) {
      requestedTagsRef.current = true;
      fetchTags();
    }
  }, [visible, tagOptions.length, fetchTags]);

  // Reset guard when modal closes
  useEffect(() => {
    if (!visible) {
      requestedTagsRef.current = false;
    }
  }, [visible]);

  // Populate form when questionToEdit or options change (to resolve category by id if needed)
  useEffect(() => {
    if (questionToEdit) {
      const resolvedCategory: Category | null = questionToEdit.category
        ? {
            ...questionToEdit.category,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        : (categoryOptions.find(c => c.id === questionToEdit.category?.id) || null);

      setForm({
        id: questionToEdit.id,
        title: questionToEdit.title || '',
        content: questionToEdit.content || '',
        category: resolvedCategory,
        tags: questionToEdit.tags || [],
      });
    } else {
      resetForm();
    }
  }, [questionToEdit, categoryOptions]);

  const resetForm = () => {
    setForm({
      id: null,
      category: null,
      title: '',
      content: '',
      tags: [],
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.category) {
      newErrors.category = 'لطفا دسته‌بندی را انتخاب کنید';
    }

    if (!form.title.trim()) {
      newErrors.title = 'لطفا عنوان سوال را وارد کنید';
    }

    // Check if content has actual text (not just HTML tags)
    const textContent = htmlToPlainText(form.content);
    if (!textContent) {
      newErrors.content = 'لطفا شرح سوال را وارد کنید';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    const questionData = {
      title: form.title.trim(),
      content: form.content, // Keep HTML content as is
      category_id: form.category!.id,
      tags: form.tags.map(tag => tag.name || tag.id.toString()),
    };

    try {
      let result;
      if (isEditMode) {
        result = await updateQuestion(form.id!, questionData);
      } else {
        result = await createQuestion(questionData);
      }

      if (result.success && result.data) {
        await Swal.fire({
          title: 'موفقیت!',
          text: `سوال شما با موفقیت ${isEditMode ? 'ویرایش' : 'ثبت'} شد.`,
          icon: 'success',
          confirmButtonText: 'باشه',
        });

        resetForm();
        onClose();
        
        if (isEditMode) {
          onQuestionUpdated?.(result.data);
        } else {
          onQuestionCreated?.(result.data);
        }
      } else {
        await Swal.fire({
          title: 'خطا!',
          text: result?.error || 'خطایی رخ داده است',
          icon: 'error',
          confirmButtonText: 'باشه',
        });
      }
    } catch (error: unknown) {
      await Swal.fire({
        title: 'خطا!',
        text: error instanceof Error ? error.message : 'خطایی رخ داده است',
        icon: 'error',
        confirmButtonText: 'باشه',
      });
    }
  };

  const handleFetchCategories = async (page: number, search?: string) => {
    const result = await fetchCategoriesPaginated(page, search);
    if (!result.success) {
      await Swal.fire({
        title: 'خطا!',
        text: result.error || 'خطا در بارگذاری دسته‌بندی‌ها',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }
    if (Array.isArray(result.data)) {
      setCategoryOptions(prev => {
        const map = new Map(prev.map(c => [c.id, c]));
        result.data!.forEach(c => {
          if (!map.has(c.id)) map.set(c.id, c);
        });
        return Array.from(map.values());
      });
    }
  };

  const handleFetchTags = useCallback(async (page: number, search?: string) => {
    try {
      const trimmedSearch = search?.trim() ?? '';

      // Empty search: restore full tag list (from cache or API)
      if (page === 1 && !trimmedSearch) {
        const allTags = tagsRef.current.length > 0
          ? tagsRef.current
          : await apiService.getTags({});

        setTagOptions(() => {
          const map = new Map<string, Tag>();
          formTagsRef.current.forEach(t => map.set(t.id, t));
          allTags.forEach(t => map.set(t.id, t));
          return Array.from(map.values());
        });
        return;
      }

      const params: ApiParams = { page, per_page: 10, query: trimmedSearch };

      const result = await apiService.getTagsPaginated(params);
      if (!result.success) {
        await Swal.fire({
          title: 'خطا!',
          text: result.error || 'خطا در بارگذاری برچسب‌ها',
          icon: 'error',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
        });
        return;
      }
      const pageItems = result.data.data || [];
      setTagOptions(prev => {
        const map = new Map<string, Tag>();

        formTagsRef.current.forEach(t => map.set(t.id, t));

        if (page === 1) {
          pageItems.forEach(t => map.set(t.id, t));
        } else {
          prev.forEach(t => map.set(t.id, t));
          pageItems.forEach(t => map.set(t.id, t));
        }

        return Array.from(map.values());
      });
    } catch (err: unknown) {
      await Swal.fire({
        title: 'خطا!',
        text: err instanceof Error ? err.message : 'خطا در بارگذاری برچسب‌ها',
        icon: 'error',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  }, []);

  const handleAddTag = (tagName: string) => {
    // Avoid duplicates in selected tags (case-insensitive)
    const existsInForm = form.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (existsInForm) return;

    // Create a local tag object immediately (like Vue implementation)
    // The actual API call will happen when the question is submitted
    const newTag: Tag = {
      id: tagName, // Use name as temporary ID
      name: tagName,
      slug: tagName.toLowerCase().replace(/\s+/g, '-'), // Generate slug
      questions_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to form tags
    setForm(prev => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }));

    // Add to options for future searches
    setTagOptions(prev => {
      if (prev.find(t => t.id === newTag.id)) return prev;
      return [...prev, newTag];
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCategoryChange = (value: any) => {
    const category = Array.isArray(value) ? value[0] : value;
    setForm(prev => ({ ...prev, category }));
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, title: e.target.value }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handleContentChange = (content: string) => {
    setForm(prev => ({ ...prev, content }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTagsChange = (value: any) => {
    const tagObjects = Array.isArray(value) ? value : (value ? [value] : []);
    setForm(prev => ({ ...prev, tags: tagObjects }));
  };

  return (
    <BaseModal
      visible={visible}
      title={isEditMode ? 'ویرایش سوال' : 'سوال خود را وارد کنید'}
      subtitle="مشخصات مربوط به سوال خود را در کادرهای زیر وارد کنید."
      size="4xl"
      closable={true}
      closeOnBackdrop={true}
      closeOnEscape={true}
      onClose={onClose}
      footer={
        <BaseButton
          type="submit"
          form="question-form"
          disabled={isSubmitting}
          rounded="lg"
          className="px-6 py-2"
        >
          {isSubmitting ? (
            `در حال ${isEditMode ? 'ویرایش' : 'ثبت'}...`
          ) : (
            `${isEditMode ? 'ویرایش سوال' : 'ثبت سوال'}`
          )}
        </BaseButton>
      }
    >
      <div className="overflow-y-auto max-h-[60vh] pr-2" style={{ direction: 'rtl' }}>
        <form onSubmit={handleSubmit} id="question-form">
          <div className="space-y-6">
            {/* Category */}
            <div>
              <BaseSelect<Category>
                value={form.category}
                options={categoryOptions}
                onChange={handleCategoryChange}
                label="دسته بندی"
                placeholder="انتخاب دسته بندی"
                searchable={true}
                paginated={true}
                onFetchMore={handleFetchCategories}
                error={errors.category}
                required
              />
            </div>

            {/* Title */}
            <div>
              <BaseInput
                id="title"
                value={form.title}
                onChange={handleTitleChange}
                label="عنوان سوال"
                placeholder="عنوان سوال خود را وارد کنید..."
                error={errors.title}
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                شرح سوال
              </label>
        <BaseEditor
          value={form.content}
          onChange={handleContentChange}
          imageUpload={true}
          rtl={true}
        />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <BaseSelect<Tag>
                value={form.tags}
                options={tagOptions}
                onChange={handleTagsChange}
                label="برچسب ها"
                placeholder="برای سوال خود برچسب وارد کنید..."
                multiple={true}
                taggable={true}
                onTagAdd={handleAddTag}
                searchable={true}
                paginated={true}
                onFetchMore={handleFetchTags}
                error={errors.tags}
              />
              <p className="text-xs text-gray-500 mt-1">
                مثال: سوالی درباره کود مناسب درختان نوشته اید پس برچسب ها
                میتواند (کود مناسب، تغذیه درختان، مواد غذایی برای درخت، کود برای رشد درخت، رشد بهتر درخت)
                باشد.
              </p>
            </div>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
