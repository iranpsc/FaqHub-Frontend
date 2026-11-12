import { cookies } from 'next/headers';

import type { AuthUser } from '@/types/auth';
import { SERVER_API_URL } from '@/lib/apiConfig';

const AUTH_COOKIE_NAME = 'auth_token';
const SERVER_API_BASE_URL = SERVER_API_URL;

interface ServerAuthState {
  user: AuthUser | null;
  token: string | null;
}

export async function getServerAuth(): Promise<ServerAuthState> {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!tokenCookie?.value) {
    return { user: null, token: null };
  }

  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${tokenCookie.value}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { user: null, token: null };
    }

    const user = (await response.json()) as AuthUser;
    return { user, token: tokenCookie.value };
  } catch (error) {
    console.error('Failed to resolve server auth state:', error);
    return { user: null, token: null };
  }
}

