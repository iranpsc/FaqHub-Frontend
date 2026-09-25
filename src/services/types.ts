// Type definitions for API responses

export interface Question {
  [key: string]: unknown;
  id: string;
  title: string;
  content: string;
  slug: string;
  views?: number;
  views_count?: number;
  answers_count?: number;
  unpublished_answers_count?: number;
  comments_count?: number;
  unpublished_comments_count?: number;
  votes_count?: number;
  is_solved: boolean;
  is_pinned_by_user?: boolean;
  is_featured_by_user?: boolean;
  published?: boolean;
  published_at?: string;
  pinned_at?: string;
  featured_at?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username?: string;
    name: string;
    image?: string | null;
    image_url?: string | null;
    score?: number;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Tag[];
  votes?: {
    upvotes: number | number[];
    downvotes: number | number[];
    score: number;
    user_vote: string | null;
  };
  can?: {
    publish?: boolean;
    update?: boolean;
    delete?: boolean;
    feature?: boolean;
    unfeature?: boolean;
  };
}

export interface User {
  id: string;
  username?: string;
  name: string;
  email?: string;
  mobile?: string;
  image?: string | null;
  image_url?: string | null;
  online: boolean;
  score?: number;
  level_name?: string;
  level?: string;
  questions_count?: number;
  answers_count?: number;
  comments_count?: number;
  login_notification_enabled?: boolean;
  created_at: string;
  recent_questions?: Question[];
  [key: string]: unknown;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  questions_count?: number;
  children_count?: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  questions_count: number;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface Answer {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  is_correct: boolean;
  votes_count?: number;
  comments?: Comment[];
  comments_count?: number;
  user: {
    id: string;
    username?: string;
    name: string;
    image?: string | null;
    image_url?: string | null;
    score: number;
  };
  votes: {
    upvotes: number;
    downvotes: number;
    score: number;
    user_vote: string | null;
  };
  can: {
    update?: boolean;
    delete?: boolean;
    publish?: boolean;
    toggle_correctness?: boolean;
  };
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  user: {
    id: string;
    username?: string;
    name: string;
    image?: string | null;
    image_url?: string | null;
    score: number;
  };
  votes: {
    upvotes: number;
    downvotes: number;
    user_vote: string | null;
  };
  can: {
    update?: boolean;
    delete?: boolean;
    publish?: boolean;
  };
}

export interface DailyActivity {
  id: string;
  type: 'question' | 'answer' | 'comment' | 'vote' | 'publish' | 'feature';
  user_name: string;
  user_id: string | number | null;
  user_image?: string | null;
  title?: string;
  slug?: string;
  question_id?: string | number;
  category_name?: string;
  description: string;
  created_at: string;
  url?: string | null;
  is_correct?: boolean;
  month?: string;
  user_url?: string;
  vote_type?: 'up' | 'down';
  is_featured?: boolean;
}

export interface ActivityPeriod {
  start_date: string;
  end_date: string;
  months: number;
  offset: number;
}

export interface ActivityLimits {
  questions: number;
  answers: number;
  comments: number;
}

export interface ActivityPagination {
  limit: number;
  offset: number;
  next_offset: number;
  has_more: boolean;
  total: number;
}

export type ActivityGroupedData = Record<string, DailyActivity[]>;

export interface ActivityApiResponse extends ApiResponse<DailyActivity[]> {
  grouped_data?: ActivityGroupedData;
  pagination?: ActivityPagination;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface VoteData {
  upvotes: number;
  downvotes: number;
  userVote: string | null;
  user_vote?: string | null; // Keep both for compatibility
  message?: string;
}

export interface VoteChangedData {
  type: 'question' | 'answer' | 'comment';
  id: string;
  votes: {
    upvotes: number;
    downvotes: number;
    user_vote: string | null;
  };
}

export interface AnswerCorrectnessData {
  answerId: string;
  isCorrect: boolean;
}

export interface CommentData {
  id?: string;
  content?: string;
  user?: {
    id: string;
    name: string;
    image?: string | null;
    image_url?: string | null;
  };
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

// CKEditor types
export interface CKEditorLoader {
  file: Promise<File>;
  upload: () => Promise<{ default: string }>;
}

export interface CKEditorInstance {
  getData: () => string;
  setData: (data: string) => void;
  plugins: {
    get: (pluginName: string) => {
      createUploadAdapter: (loader: CKEditorLoader) => CKEditorUploadAdapter;
    };
  };
}

export interface CKEditorUploadAdapter {
  upload: () => Promise<{ default: string }>;
}

export interface CKEditorEvent {
  name: string;
  source: CKEditorInstance;
}

// API parameter types
export interface ApiParams {
  page?: number;
  per_page?: number;
  search?: string;
  category?: string;
  tag?: string;
  sort?: string;
  filter?: string;
  [key: string]: string | number | undefined;
}

export interface VoteResponse {
  upvotes: number;
  downvotes: number;
  user_vote: string | null;
}

export interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

export interface QuestionActionResponse {
  is_pinned_by_user?: boolean;
  pinned_at?: string | null;
  is_featured_by_user?: boolean;
  featured_at?: string | null;
  is_correct?: boolean;
}
