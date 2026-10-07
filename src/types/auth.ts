export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  image?: string | null;
  image_url?: string | null;
  score?: number;
  online?: boolean;
  login_notification_enabled?: boolean;
  [key: string]: unknown;
}

