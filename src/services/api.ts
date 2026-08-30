import {
  ApiResponse,
  Question,
  User,
  Category,
  Tag,
  PaginatedResponse,
  DailyActivity,
  ActivityApiResponse,
  Answer,
  Comment,
  ApiParams,
  VoteResponse,
  ApiError,
  QuestionActionResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const SERVER_API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.faqhub.ir/api'
    : 'http://localhost:8000/api';

const isDevelopment = process.env.NODE_ENV === 'development';
const CLIENT_TIMEOUT_MS = 30_000;
const SERVER_TIMEOUT_MS = isDevelopment ? 10_000 : 30_000;

/** In-flight server GET requests: same URL reuses one request (deduplication) */
const serverRequestCache = new Map<string, Promise<unknown>>();

export const API_ERROR_MESSAGES = {
  AUTH_REQUIRED: 'احراز هویت لازم است. لطفاً دوباره وارد شوید.',
  HTTP: (status: number) => `خطای سرور (کد ${status})`,
  CONNECTION_DEV: `امکان اتصال به سرور پشتیبان در ${API_BASE_URL} وجود ندارد. لطفاً مطمئن شوید بک‌اند لاراول روی پورت ۸۰۰۰ در حال اجرا است.`,
  CONNECTION_PROD: `امکان اتصال به API در ${API_BASE_URL} وجود ندارد. ممکن است سرور از دسترس خارج باشد.`,
  TIMEOUT: `مهلت درخواست به پایان رسید: سرور API در ${API_BASE_URL} ظرف ۳۰ ثانیه پاسخ نداد.`,
  TIMEOUT_SERVER: (timeout: number, endpoint: string) =>
    `مهلت درخواست پس از ${timeout} میلی‌ثانیه برای ${endpoint} به پایان رسید.`,
  NETWORK: (endpoint: string) => `خطای شبکه در اتصال به API: ${endpoint}`,
  CREATE_QUESTION: 'خطا در ایجاد سوال',
  UPDATE_QUESTION: 'خطا در ویرایش سوال',
  DELETE_QUESTION: 'خطا در حذف سوال',
  CREATE_TAG: 'خطا در ایجاد برچسب',
  UPDATE_IMAGE: 'خطا در به‌روزرسانی عکس پروفایل',
  UPDATE_SETTINGS: 'خطا در به‌روزرسانی تنظیمات',
  CREATE_ANSWER: 'خطا در ایجاد پاسخ',
  UPDATE_ANSWER: 'خطا در ویرایش پاسخ',
  DELETE_ANSWER: 'خطا در حذف پاسخ',
  PUBLISH_ANSWER: 'خطا در انتشار پاسخ',
  TOGGLE_ANSWER_CORRECTNESS: 'خطا در تغییر وضعیت صحیح بودن پاسخ',
  CREATE_COMMENT: 'خطا در ایجاد نظر',
  UPDATE_COMMENT: 'خطا در ویرایش نظر',
  DELETE_COMMENT: 'خطا در حذف نظر',
  PUBLISH_COMMENT: 'خطا در انتشار نظر',
  VOTE: 'خطا در رأی دادن',
  VOTE_CONFLICT: 'شما قبلاً به این مورد رأی داده‌اید',
  PUBLISH_QUESTION: 'خطا در انتشار سوال',
  PIN_QUESTION: 'خطا در پین کردن سوال',
  UNPIN_QUESTION: 'خطا در برداشتن پین سوال',
  FEATURE_QUESTION: 'خطا در ویژه کردن سوال',
  UNFEATURE_QUESTION: 'خطا در برداشتن ویژگی سوال',
  FETCH_ACTIVITY: 'خطا در دریافت فعالیت‌ها',
} as const;

type MutationResult<T = undefined> = {
  success: boolean;
  data?: T;
  error?: string;
};

class HttpError extends Error {
  response: { status: number; data: unknown };

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'HttpError';
    this.response = { status, data };
  }
}

function getServerRequestCacheKey(endpoint: string, options: RequestInit): string | null {
  if (typeof window !== 'undefined') return null;
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET' || options.body !== undefined) return null;
  return endpoint;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function processParams(params: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  );
}

function buildQueryString(params: Record<string, unknown> = {}): string {
  return new URLSearchParams(processParams(params)).toString();
}

function withQuery(path: string, params: Record<string, unknown> = {}): string {
  const queryString = buildQueryString(params);
  return queryString ? `${path}?${queryString}` : path;
}

function extractErrorMessage(errorData: unknown, fallback: string): string {
  if (errorData && typeof errorData === 'object' && 'message' in errorData) {
    const message = (errorData as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return fallback;
}

function getErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiError;
  return (
    apiError?.response?.data?.message ||
    (error instanceof Error ? error.message : undefined) ||
    apiError?.message ||
    fallback
  );
}

function clearClientAuth(): void {
  if (!isBrowser()) return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  window.dispatchEvent(new CustomEvent('auth:logout'));
}

function applyHeaders(target: Headers, source?: HeadersInit): void {
  if (!source) return;

  if (source instanceof Headers) {
    source.forEach((value, key) => target.set(key, value));
    return;
  }

  if (Array.isArray(source)) {
    for (const [key, value] of source) {
      if (value !== undefined) target.set(key, value);
    }
    return;
  }

  Object.entries(source).forEach(([key, value]) => {
    if (value !== undefined) target.set(key, value as string);
  });
}

async function parseJsonIfPresent<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const hasJsonContent = contentType?.includes('application/json');
  const hasContent =
    response.status !== 204 && response.headers.get('content-length') !== '0';

  if (hasJsonContent && hasContent) {
    return (await response.json()) as T;
  }

  return { success: true } as T;
}

async function parseErrorBody(response: Response): Promise<unknown> {
  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
  } catch {
    // Ignore parse failures; caller uses fallback message
  }
  return null;
}

function mapActiveUser(user: User): User {
  return {
    ...user,
    image_url: user.image_url || ((user as Record<string, unknown>).image as string),
    online: true,
    created_at: user.created_at || new Date().toISOString(),
  };
}

function isConnectionError(error: unknown): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes('fetch') || error.message.includes('Failed to fetch'))
  );
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'TimeoutError')
  );
}

function isNetworkCodeError(error: unknown): boolean {
  const code = (error as Error & { code?: string })?.code;
  return code === 'ETIMEDOUT' || code === 'ECONNREFUSED' || code === 'ENOTFOUND';
}

export function isAuthError(error: unknown): boolean {
  if (error instanceof HttpError && error.response.status === 401) {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.message.includes(API_ERROR_MESSAGES.AUTH_REQUIRED) ||
      error.message.includes('Authentication required')
    );
  }
  return false;
}

class ApiService {
  private getAuthToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem('auth_token');
  }

  private async wrapMutation<T>(
    action: () => Promise<T>,
    fallbackError: string
  ): Promise<MutationResult<T>> {
    try {
      const data = await action();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, fallbackError) };
    }
  }

  private async wrapAction(
    action: () => Promise<void>,
    fallbackError: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await action();
      return { success: true };
    } catch (error) {
      return { success: false, error: getErrorMessage(error, fallbackError) };
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAuthToken();
    const isFormData = options.body instanceof FormData;

    const config: RequestInit = {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          clearClientAuth();
          throw new HttpError(API_ERROR_MESSAGES.AUTH_REQUIRED, 401);
        }

        const errorData = await parseErrorBody(response);
        const errorMessage = extractErrorMessage(
          errorData,
          API_ERROR_MESSAGES.HTTP(response.status)
        );
        throw new HttpError(errorMessage, response.status, errorData);
      }

      return parseJsonIfPresent<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (isDevelopment) {
        console.error('API request failed:', error);
        console.error('Request URL:', url);
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('API request failed:', msg);
      }

      if (isConnectionError(error)) {
        throw new Error(
          isDevelopment
            ? API_ERROR_MESSAGES.CONNECTION_DEV
            : API_ERROR_MESSAGES.CONNECTION_PROD
        );
      }

      if (isAbortError(error)) {
        throw new Error(API_ERROR_MESSAGES.TIMEOUT);
      }

      throw error;
    }
  }

  // Categories API
  async getPopularCategories(limit: number = 15): Promise<Category[]> {
    const response = await this.request<{ data: Category[] }>(
      `/categories/popular?limit=${limit}`
    );
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await this.request<{ data: Category[] }>('/categories');
    return response.data;
  }

  async getCategoriesPaginated(page: number = 1): Promise<PaginatedResponse<Category>> {
    return this.request<PaginatedResponse<Category>>(`/categories?page=${page}`);
  }

  async getCategory(slug: string): Promise<Category & { children?: Category[] }> {
    const response = await this.request<{ data: Category & { children?: Category[] } }>(
      `/categories/${slug}`
    );
    return response.data;
  }

  async getCategoryQuestions(
    slug: string,
    page: number = 1
  ): Promise<PaginatedResponse<Question>> {
    return this.request<PaginatedResponse<Question>>(
      `/categories/${slug}/questions?page=${page}`
    );
  }

  // Questions API
  async getQuestions(
    params: Record<string, unknown> = {}
  ): Promise<PaginatedResponse<Question>> {
    return this.request<PaginatedResponse<Question>>(withQuery('/questions', params));
  }

  async getRecommendedQuestions(limit: number = 15): Promise<Question[]> {
    const response = await this.request<{ data: Question[] }>(
      `/questions/recommended?limit=${limit}`
    );
    return response.data;
  }

  async getPopularQuestions(
    limit: number = 15,
    period: string = 'week'
  ): Promise<Question[]> {
    const response = await this.request<{ data: Question[] }>(
      `/questions/popular?period=${period}&limit=${limit}`
    );
    return response.data;
  }

  async searchQuestions(query: string, limit: number = 50): Promise<Question[]> {
    const q = encodeURIComponent(query);
    const response = await this.request<{
      success: boolean;
      data: Record<string, unknown> | Question[];
      message?: string;
    }>(`/questions/search?q=${q}&limit=${limit}`);

    const payload = response.data;
    if (Array.isArray(payload)) return payload as Question[];
    if (payload && Array.isArray(payload.data)) return payload.data as Question[];
    return [];
  }

  async getQuestion(id: string): Promise<Question> {
    return this.request<Question>(`/questions/${id}`);
  }

  async getQuestionBySlug(slug: string): Promise<Question> {
    const response = await this.request<{ data: Question }>(`/questions/${slug}`);
    return response.data;
  }

  async createQuestion(questionData: {
    title: string;
    content: string;
    category_id: string;
    tags?: Array<{ id: number } | { name: string }>;
  }): Promise<MutationResult<Question>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Question }>('/questions', {
        method: 'POST',
        body: JSON.stringify(questionData),
      });
      return response.data;
    }, API_ERROR_MESSAGES.CREATE_QUESTION);
  }

  async updateQuestion(
    id: string,
    questionData: {
      title: string;
      content: string;
      category_id: string;
      tags?: Array<{ id: number } | { name: string }>;
    }
  ): Promise<MutationResult<Question>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Question }>(`/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(questionData),
      });
      return response.data;
    }, API_ERROR_MESSAGES.UPDATE_QUESTION);
  }

  async deleteQuestion(id: string): Promise<{ success: boolean; error?: string }> {
    return this.wrapAction(
      () => this.request(`/questions/${id}`, { method: 'DELETE' }).then(() => undefined),
      API_ERROR_MESSAGES.DELETE_QUESTION
    );
  }

  // Users API
  async getActiveUsers(limit: number = 10): Promise<User[]> {
    const response = await this.request<{ data: User[] }>(
      `/dashboard/active-users?limit=${limit}`
    );
    return response.data.map(mapActiveUser);
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Tags API
  async getTags(params: Record<string, unknown> = {}): Promise<Tag[]> {
    const response = await this.request<{ data: Tag[] }>(withQuery('/tags', params));
    return response.data;
  }

  async getTagsPaginated(
    params: ApiParams = {}
  ): Promise<{ success: boolean; data: PaginatedResponse<Tag>; error?: string }> {
    const response = await this.request<PaginatedResponse<Tag>>(withQuery('/tags', params));
    return { success: true, data: response };
  }

  async getTag(slug: string): Promise<Tag> {
    return this.request<Tag>(`/tags/${slug}`);
  }

  async getTagQuestions(
    slug: string,
    page: number = 1
  ): Promise<PaginatedResponse<Question> & { tag: Tag }> {
    return this.request<PaginatedResponse<Question> & { tag: Tag }>(
      `/tags/${slug}/questions?page=${page}`
    );
  }

  async createTag(name: string): Promise<MutationResult<Tag>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Tag }>('/tags', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      return response.data;
    }, API_ERROR_MESSAGES.CREATE_TAG);
  }

  // Authors API
  async getAuthors(params: Record<string, unknown> = {}): Promise<PaginatedResponse<User>> {
    return this.request<PaginatedResponse<User>>(withQuery('/authors', params));
  }

  async getAuthor(username: string): Promise<User> {
    const response = await this.request<{ data: User }>(`/authors/${username}`);
    return response.data;
  }

  async getAuthorQuestions(
    username: string,
    page: number = 1,
    type: 'questions' | 'answers' | 'comments' = 'questions'
  ): Promise<PaginatedResponse<Question>> {
    const params = new URLSearchParams({ page: String(page), type });
    return this.request<PaginatedResponse<Question>>(
      `/authors/${username}/questions?${params.toString()}`
    );
  }

  // Dashboard API
  async getDashboardStats(): Promise<{
    totalQuestions: number;
    totalAnswers: number;
    totalUsers: number;
    solvedQuestions: number;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        totalQuestions: number;
        totalAnswers: number;
        totalUsers: number;
        solvedQuestions: number;
      };
    }>('/dashboard/stats');
    return response.data;
  }

  // Authentication API
  async getAuthRedirect(intendedUrl: string): Promise<{ redirect_url: string }> {
    return this.request<{ redirect_url: string }>('/auth/redirect', {
      method: 'POST',
      body: JSON.stringify({ intended_url: intendedUrl }),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
  }

  // User Profile API
  async getUserProfile(): Promise<User> {
    const response = await this.request<{
      id: string;
      name: string;
      email: string;
      mobile?: string;
      image: string | null;
      score: number;
      online: boolean;
      login_notification_enabled: boolean;
      created_at: string;
    }>('/user/profile');

    return {
      id: response.id,
      name: response.name,
      email: response.email,
      mobile: response.mobile,
      image_url: response.image || '',
      online: response.online,
      score: response.score,
      login_notification_enabled: response.login_notification_enabled,
      level_name: 'تازه‌کار',
      questions_count: 0,
      answers_count: 0,
      comments_count: 0,
      created_at: response.created_at,
    };
  }

  async getUserStats(): Promise<{
    questionsCount: number;
    answersCount: number;
    commentsCount: number;
  }> {
    return this.request<{
      questionsCount: number;
      answersCount: number;
      commentsCount: number;
    }>('/user/stats');
  }

  async getUserActivity(): Promise<
    Array<{
      id: string;
      type: 'question' | 'answer' | 'comment' | 'vote';
      description: string;
      created_at: string;
      question_slug?: string;
    }>
  > {
    return this.request<
      Array<{
        id: string;
        type: 'question' | 'answer' | 'comment' | 'vote';
        description: string;
        created_at: string;
        question_slug?: string;
      }>
    >('/user/activity');
  }

  async updateUserImage(
    file: File
  ): Promise<MutationResult<{ image_url: string }>> {
    return this.wrapMutation(async () => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await this.request<{ message: string; image_url: string }>(
        '/user/update-image',
        { method: 'POST', body: formData }
      );

      return { image_url: response.image_url };
    }, API_ERROR_MESSAGES.UPDATE_IMAGE);
  }

  async updateUserSettings(settings: {
    login_notification_enabled: boolean;
  }): Promise<MutationResult<{ login_notification_enabled: boolean }>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{
        message: string;
        login_notification_enabled: boolean;
      }>('/user/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      });

      return { login_notification_enabled: response.login_notification_enabled };
    }, API_ERROR_MESSAGES.UPDATE_SETTINGS);
  }

  // Answers API
  async getQuestionAnswers(
    questionId: string,
    page: number = 1
  ): Promise<PaginatedResponse<Answer>> {
    return this.request<PaginatedResponse<Answer>>(
      `/questions/${questionId}/answers?page=${page}`
    );
  }

  async addAnswer(
    questionId: string,
    content: string
  ): Promise<MutationResult<Record<string, unknown>>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Record<string, unknown> }>(
        `/questions/${questionId}/answers`,
        { method: 'POST', body: JSON.stringify({ content }) }
      );
      return response.data;
    }, API_ERROR_MESSAGES.CREATE_ANSWER);
  }

  async updateAnswer(
    answerId: string,
    content: string
  ): Promise<MutationResult<Record<string, unknown>>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Record<string, unknown> }>(
        `/answers/${answerId}`,
        { method: 'PUT', body: JSON.stringify({ content }) }
      );
      return response.data;
    }, API_ERROR_MESSAGES.UPDATE_ANSWER);
  }

  async deleteAnswer(answerId: string): Promise<{ success: boolean; error?: string }> {
    return this.wrapAction(
      () => this.request(`/answers/${answerId}`, { method: 'DELETE' }).then(() => undefined),
      API_ERROR_MESSAGES.DELETE_ANSWER
    );
  }

  async publishAnswer(answerId: string): Promise<{ success: boolean; error?: string }> {
    return this.wrapAction(
      () =>
        this.request(`/answers/${answerId}/publish`, { method: 'POST' }).then(() => undefined),
      API_ERROR_MESSAGES.PUBLISH_ANSWER
    );
  }

  async toggleAnswerCorrectness(
    answerId: string
  ): Promise<MutationResult<Record<string, unknown>>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Record<string, unknown> }>(
        `/answers/${answerId}/toggle-correctness`,
        { method: 'POST' }
      );
      return response.data;
    }, API_ERROR_MESSAGES.TOGGLE_ANSWER_CORRECTNESS);
  }

  // Comments API
  async getComments(
    parentId: string,
    parentType: 'question' | 'answer',
    page: number = 1
  ): Promise<PaginatedResponse<Comment>> {
    return this.request<PaginatedResponse<Comment>>(
      `/${parentType}s/${parentId}/comments?page=${page}`
    );
  }

  async addComment(
    parentId: string,
    content: string,
    parentType: 'question' | 'answer'
  ): Promise<MutationResult<Record<string, unknown>>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Record<string, unknown> }>(
        `/${parentType}s/${parentId}/comments`,
        { method: 'POST', body: JSON.stringify({ content }) }
      );
      return response.data;
    }, API_ERROR_MESSAGES.CREATE_COMMENT);
  }

  async updateComment(
    commentId: string,
    content: string
  ): Promise<MutationResult<Record<string, unknown>>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{ data: Record<string, unknown> }>(
        `/comments/${commentId}`,
        { method: 'PUT', body: JSON.stringify({ content }) }
      );
      return response.data;
    }, API_ERROR_MESSAGES.UPDATE_COMMENT);
  }

  async deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    return this.wrapAction(
      () => this.request(`/comments/${commentId}`, { method: 'DELETE' }).then(() => undefined),
      API_ERROR_MESSAGES.DELETE_COMMENT
    );
  }

  async publishComment(commentId: string): Promise<{ success: boolean; error?: string }> {
    return this.wrapAction(
      () =>
        this.request(`/comments/${commentId}/publish`, { method: 'POST' }).then(() => undefined),
      API_ERROR_MESSAGES.PUBLISH_COMMENT
    );
  }

  // Voting API
  async vote(
    resourceType: 'question' | 'answer' | 'comment',
    resourceId: string,
    voteType: 'up' | 'down'
  ): Promise<{
    success: boolean;
    data?: VoteResponse;
    error?: string;
    message?: string;
    status?: number;
  }> {
    try {
      const response = await this.request<{ data: VoteResponse }>(
        `/${resourceType}s/${resourceId}/vote`,
        { method: 'POST', body: JSON.stringify({ type: voteType }) }
      );
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const errorObj = error as Error & {
        response?: { status: number; data?: { message?: string } };
      };

      if (errorObj.response?.status === 409) {
        return {
          success: false,
          error: 'conflict',
          message: errorObj.response?.data?.message || API_ERROR_MESSAGES.VOTE_CONFLICT,
          status: 409,
        };
      }

      const fallback = API_ERROR_MESSAGES.VOTE;
      return {
        success: false,
        error: error instanceof Error ? error.message : fallback,
        message: errorObj.response?.data?.message || (error instanceof Error ? error.message : fallback),
        status: errorObj.response?.status,
      };
    }
  }

  // Question Actions API
  async publishQuestion(questionId: string): Promise<MutationResult<Question>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{
        success: boolean;
        data: Question;
        message: string;
      }>(`/questions/${questionId}/publish`, { method: 'POST' });
      return response.data;
    }, API_ERROR_MESSAGES.PUBLISH_QUESTION);
  }

  async pinQuestion(questionId: string): Promise<MutationResult<QuestionActionResponse>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{
        success: boolean;
        message: string;
        is_pinned_by_user: boolean;
        pinned_at: string;
      }>(`/questions/${questionId}/pin`, { method: 'POST' });

      return {
        is_pinned_by_user: response.is_pinned_by_user,
        pinned_at: response.pinned_at || undefined,
      };
    }, API_ERROR_MESSAGES.PIN_QUESTION);
  }

  async unpinQuestion(questionId: string): Promise<MutationResult<QuestionActionResponse>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{
        success: boolean;
        message: string;
        is_pinned_by_user: boolean;
        pinned_at: string | null;
      }>(`/questions/${questionId}/pin`, { method: 'DELETE' });

      return {
        is_pinned_by_user: response.is_pinned_by_user,
        pinned_at: response.pinned_at || undefined,
      };
    }, API_ERROR_MESSAGES.UNPIN_QUESTION);
  }

  async featureQuestion(questionId: string): Promise<MutationResult<QuestionActionResponse>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{
        success: boolean;
        message: string;
        is_featured_by_user: boolean;
        featured_at: string;
      }>(`/questions/${questionId}/feature`, { method: 'POST' });

      return {
        is_featured_by_user: response.is_featured_by_user,
        featured_at: response.featured_at || undefined,
      };
    }, API_ERROR_MESSAGES.FEATURE_QUESTION);
  }

  async unfeatureQuestion(questionId: string): Promise<MutationResult<QuestionActionResponse>> {
    return this.wrapMutation(async () => {
      const response = await this.request<{
        success: boolean;
        message: string;
        is_featured_by_user: boolean;
        featured_at: string | null;
      }>(`/questions/${questionId}/feature`, { method: 'DELETE' });

      return {
        is_featured_by_user: response.is_featured_by_user,
        featured_at: response.featured_at || undefined,
      };
    }, API_ERROR_MESSAGES.UNFEATURE_QUESTION);
  }

  // Activity API
  async getActivity(
    params: { limit?: number; offset?: number } = {}
  ): Promise<ActivityApiResponse> {
    try {
      const endpoint = withQuery('/dashboard/activity', {
        limit: params.limit,
        offset: params.offset,
      });

      if (!isBrowser()) {
        return await this.serverRequest<ActivityApiResponse>(
          endpoint,
          {},
          SERVER_TIMEOUT_MS
        );
      }

      return await this.request<ActivityApiResponse>(endpoint);
    } catch (error: unknown) {
      if (isDevelopment) {
        console.error('getActivity error:', error);
      }

      return {
        success: false,
        data: [] as DailyActivity[],
        error: getErrorMessage(error, API_ERROR_MESSAGES.FETCH_ACTIVITY),
      };
    }
  }

  // Server-side compatible methods (no browser APIs)
  async serverRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout: number = SERVER_TIMEOUT_MS
  ): Promise<T> {
    const url = `${SERVER_API_BASE_URL}${endpoint}`;
    const cacheKey = getServerRequestCacheKey(endpoint, options);

    if (cacheKey) {
      const pending = serverRequestCache.get(cacheKey);
      if (pending) return pending as Promise<T>;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers = new Headers({
      Accept: 'application/json',
      Connection: 'keep-alive',
    });

    applyHeaders(headers, options.headers);

    const hasBody = options.body !== undefined && options.body !== null;
    const shouldSetContentType =
      hasBody && !(options.body instanceof FormData) && !headers.has('Content-Type');

    if (shouldSetContentType) {
      headers.set('Content-Type', 'application/json');
    }

    if (!isBrowser()) {
      try {
        const { cookies: getCookies, headers: getHeaders } = await import('next/headers');
        const cookieStore = await getCookies();

        const cookiePairs = cookieStore
          .getAll()
          .map(({ name, value }) => `${name}=${value}`);

        if (cookiePairs.length > 0) {
          headers.set('Cookie', cookiePairs.join('; '));
        }

        if (!headers.has('Authorization')) {
          const token =
            cookieStore.get('auth_token')?.value ??
            cookieStore.get('AuthToken')?.value ??
            cookieStore.get('token')?.value ??
            null;

          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          } else {
            const incomingHeaders = await getHeaders();
            const incomingAuthHeader = incomingHeaders.get('authorization');
            if (incomingAuthHeader) {
              headers.set('Authorization', incomingAuthHeader);
            }
          }
        }
      } catch (error) {
        if (isDevelopment) {
          console.warn('Failed to apply server-side auth headers:', error);
        }
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    const doRequest = async (): Promise<T> => {
      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`Server API request failed: ${url}`);
          console.error(`Status: ${response.status} ${response.statusText}`);

          const errorData = await parseErrorBody(response);
          if (errorData) {
            console.error(`Response body: ${JSON.stringify(errorData)}`);
          }

          throw new HttpError(
            extractErrorMessage(errorData, API_ERROR_MESSAGES.HTTP(response.status)),
            response.status,
            errorData
          );
        }

        return parseJsonIfPresent<T>(response);
      } catch (error) {
        clearTimeout(timeoutId);

        if (isAbortError(error)) {
          const errorMsg = API_ERROR_MESSAGES.TIMEOUT_SERVER(timeout, endpoint);
          if (isDevelopment) {
            console.error('Server API request timeout:', errorMsg);
          }
          throw new Error(errorMsg);
        }

        if (isNetworkCodeError(error)) {
          const errorMsg = API_ERROR_MESSAGES.NETWORK(endpoint);
          if (isDevelopment) {
            console.error('Server API network error:', errorMsg, error);
          }
          throw new Error(errorMsg);
        }

        if (isDevelopment) {
          console.error('Server API request failed:', endpoint, error);
        }

        throw error;
      }
    };

    if (cacheKey) {
      const promise = doRequest().finally(() => {
        serverRequestCache.delete(cacheKey);
      });
      serverRequestCache.set(cacheKey, promise);
      return promise as Promise<T>;
    }

    return doRequest();
  }

  // Server-side question methods
  async getQuestionBySlugServer(slug: string): Promise<Question> {
    const response = await this.serverRequest<{ data: Question }>(`/questions/${slug}`);
    return response.data;
  }

  async getQuestionAnswersServer(questionId: string): Promise<PaginatedResponse<Answer>> {
    return this.serverRequest<PaginatedResponse<Answer>>(
      `/questions/${questionId}/answers`
    );
  }

  async getQuestionsServer(
    params: Record<string, unknown> = {}
  ): Promise<PaginatedResponse<Question>> {
    return this.serverRequest<PaginatedResponse<Question>>(withQuery('/questions', params));
  }

  async getActiveUsersServer(limit: number = 10): Promise<User[]> {
    const response = await this.serverRequest<{ data: User[] }>(
      `/dashboard/active-users?limit=${limit}`
    );
    return response.data.map(mapActiveUser);
  }

  async getTagQuestionsServer(
    slug: string,
    page: number = 1
  ): Promise<PaginatedResponse<Question> & { tag: Tag }> {
    return this.serverRequest<PaginatedResponse<Question> & { tag: Tag }>(
      `/tags/${slug}/questions?page=${page}`
    );
  }

  async getTagsPaginatedServer(
    params: Record<string, unknown> = {}
  ): Promise<PaginatedResponse<Tag>> {
    return this.serverRequest<PaginatedResponse<Tag>>(withQuery('/tags', params));
  }

  // Server-side category methods
  async getCategoriesPaginatedServer(
    params: Record<string, unknown> = {}
  ): Promise<PaginatedResponse<Category>> {
    return this.serverRequest<PaginatedResponse<Category>>(withQuery('/categories', params));
  }

  async getCategoryServer(slug: string): Promise<Category & { children?: Category[] }> {
    return this.serverRequest<Category & { children?: Category[] }>(`/categories/${slug}`);
  }

  async getCategoryQuestionsServer(
    slug: string,
    page: number = 1
  ): Promise<PaginatedResponse<Question> & { category: Category }> {
    return this.serverRequest<PaginatedResponse<Question> & { category: Category }>(
      `/categories/${slug}/questions?page=${page}`
    );
  }

  // Server-side author methods
  async getAuthorsServer(
    params: Record<string, unknown> = {}
  ): Promise<PaginatedResponse<User>> {
    return this.serverRequest<PaginatedResponse<User>>(withQuery('/authors', params));
  }

  async getAuthorServer(username: string): Promise<User> {
    const response = await this.serverRequest<{ data: User }>(`/authors/${username}`);
    return response.data;
  }

  async getAuthorQuestionsServer(
    username: string,
    page: number = 1,
    type: 'questions' | 'answers' | 'comments' = 'questions'
  ): Promise<PaginatedResponse<Question> & { author: User }> {
    const params = new URLSearchParams({ page: String(page), type });
    return this.serverRequest<PaginatedResponse<Question> & { author: User }>(
      `/authors/${username}/questions?${params.toString()}`
    );
  }

  // Server-side activity methods
  async getActivityServer(
    params: { limit?: number; offset?: number } = {}
  ): Promise<{
    success: boolean;
    data: DailyActivity[];
    grouped_data: { [month: string]: DailyActivity[] };
    error?: string;
  }> {
    try {
      const response = await this.serverRequest<{
        success: boolean;
        data: DailyActivity[];
        grouped_data: { [month: string]: DailyActivity[] };
        error?: string;
      }>(
        withQuery('/dashboard/activity', {
          limit: params.limit,
          offset: params.offset,
        })
      );

      return {
        success: response.success || false,
        data: Array.isArray(response.data) ? response.data : [],
        grouped_data:
          response.grouped_data && typeof response.grouped_data === 'object'
            ? response.grouped_data
            : {},
        error: response.error,
      };
    } catch (error: unknown) {
      console.error('Activity server request failed:', error);
      return {
        success: false,
        data: [] as DailyActivity[],
        grouped_data: {},
        error: getErrorMessage(error, API_ERROR_MESSAGES.FETCH_ACTIVITY),
      };
    }
  }
}

export const apiService = new ApiService();

export type {
  Question,
  User,
  Category,
  Tag,
  PaginatedResponse,
  ApiResponse,
  DailyActivity,
  Answer,
  Comment,
};
