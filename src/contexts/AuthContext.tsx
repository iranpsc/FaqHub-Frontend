'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import type { AuthUser } from '@/types/auth';

type User = AuthUser;

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  can: (permission: string, resource?: unknown) => boolean;
  getInitials: (name?: string) => string;
  fetchUser: (tokenOverride?: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  initialToken?: string | null;
}

export function AuthProvider({ children, initialUser = null, initialToken = null }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setTokenState] = useState<string | null>(initialToken);
  const [isLoading, setIsLoading] = useState(() => !(initialUser && initialToken));
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isLogoutLoading, setIsLogoutLoading] = useState(false);
  
  // Track prior auth state to emit login/logout only on transitions
  const wasAuthenticatedRef = useRef(Boolean(initialToken && initialUser));
  // Deduplicate in-flight /me requests
  const fetchUserInFlightRef = useRef<Promise<User | null> | null>(null);
  // Prevent duplicate initialization
  const hasInitializedRef = useRef(false);

  const isAuthenticated = !!token && !!user;

  // Custom event system for auth state changes
  const dispatchAuthEvent = useCallback((eventType: string, detail?: unknown) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(eventType, { detail }));
      }
    } catch (error) {
      console.warn('Failed to dispatch auth event:', error);
    }
  }, []);

  const syncAuthCookie = useCallback(async (tokenValue: string | null) => {
    try {
      if (typeof window === 'undefined') return;

      if (tokenValue) {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ token: tokenValue }),
        });
      } else {
        await fetch('/api/auth/session', {
          method: 'DELETE',
          credentials: 'same-origin',
        });
      }
    } catch (error) {
      console.warn('Failed to sync auth cookie:', error);
    }
  }, []);

  // Enhanced token setter with events
  const setTokenWithEvents = useCallback((newToken: string | null, options?: { syncCookie?: boolean }) => {
    const shouldSyncCookie = options?.syncCookie ?? true;

    setTokenState(newToken);
    try {
      if (newToken) {
        localStorage.setItem('auth_token', newToken);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.warn('Failed to persist auth token:', error);
    }

    if (shouldSyncCookie) {
      void syncAuthCookie(newToken);
    }

    // Dispatch token change event
    dispatchAuthEvent('auth:token', { token: newToken });
  }, [dispatchAuthEvent, syncAuthCookie]);

  // Enhanced user setter with events
  const setUserWithEvents = useCallback((userData: User | null) => {
    setUser(userData);
    try {
      if (userData) {
        localStorage.setItem('auth_user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('auth_user');
      }
    } catch (error) {
      console.warn('Failed to dispatch auth event:', error);
    }

    // Emit auth:login only on transition from guest -> authenticated
    const isNowAuthenticated = !!(token && userData);
    if (!wasAuthenticatedRef.current && isNowAuthenticated) {
      dispatchAuthEvent('auth:login', { user: userData });
    }
    wasAuthenticatedRef.current = isNowAuthenticated;
  }, [dispatchAuthEvent, token]);

  // Deduplicated fetchUser function
  const fetchUser = useCallback(async (authToken?: string): Promise<User | null> => {
    const tokenToUse = authToken || token;
    if (!tokenToUse) return null;

    // Deduplicate concurrent calls
    if (fetchUserInFlightRef.current) {
      return fetchUserInFlightRef.current;
    }

    fetchUserInFlightRef.current = (async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUserWithEvents(userData);
          return userData;
        } else {
          // Token is invalid, clear it
          setTokenWithEvents(null);
          setUserWithEvents(null);
          dispatchAuthEvent('auth:logout');
          return null;
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setTokenWithEvents(null);
        setUserWithEvents(null);
        dispatchAuthEvent('auth:logout');
        return null;
      } finally {
        fetchUserInFlightRef.current = null;
      }
    })();

    return fetchUserInFlightRef.current;
  }, [dispatchAuthEvent, setTokenWithEvents, setUserWithEvents, token]);

  // Initialize auth state, prioritizing server-provided values and keeping client storage/cookies in sync
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Prevent duplicate initialization
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      if (typeof window === 'undefined') {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        // First, check for token in URL (OAuth redirects) to avoid duplicate fetchUser calls
        let tokenFromUrl = null;
        try {
          if (window.location.hash && window.location.hash.length > 1) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            tokenFromUrl = hashParams.get('token');
          }
          if (!tokenFromUrl) {
            const urlParams = new URLSearchParams(window.location.search);
            tokenFromUrl = urlParams.get('token');
          }
        } catch (error) {
          console.warn('Failed to extract auth token from URL:', error);
        }

        if (tokenFromUrl) {
          // Handle OAuth redirect with token in URL
          setTokenWithEvents(tokenFromUrl);
          // Clean the URL
          const cleanPath = window.location.pathname;
          window.history.replaceState({}, document.title, cleanPath);
          await fetchUser(tokenFromUrl);
        } else if (initialToken) {
          // Handle server-provided initial token
          localStorage.setItem('auth_token', initialToken);

          if (initialUser) {
            localStorage.setItem('auth_user', JSON.stringify(initialUser));
            wasAuthenticatedRef.current = true;
          } else {
            localStorage.removeItem('auth_user');
            await fetchUser(initialToken);
          }
        } else {
          // Handle stored token from localStorage
          const storedToken = localStorage.getItem('auth_token');
          const storedUser = localStorage.getItem('auth_user');

          if (storedToken) {
            setTokenWithEvents(storedToken, { syncCookie: false }); // Avoid extra sync on init

            if (storedUser) {
              try {
                const parsedUser = JSON.parse(storedUser);
                setUserWithEvents(parsedUser);
              } catch (parseError) {
                console.error('Failed to parse stored user data:', parseError);
                localStorage.removeItem('auth_user');
                await fetchUser(storedToken);
              }
            } else {
              await fetchUser(storedToken);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setTokenWithEvents(null);
        setUserWithEvents(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - initialToken and initialUser are props and won't change

  useEffect(() => {
    wasAuthenticatedRef.current = !!(token && user);
  }, [token, user]);


  // Login function
  const login = async () => {
    setIsLoginLoading(true);
    try {
      // Send current path as intended URL to backend
      const intendedUrl = window.location.href;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiBaseUrl}/auth/redirect`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ intended_url: intendedUrl })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.redirect_url;
      } else {
        console.error('Failed to get redirect URL');
        throw new Error('Failed to get redirect URL');
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoginLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    setIsLogoutLoading(true);
    if (token) {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        await fetch(`${apiBaseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setTokenWithEvents(null);
    setUserWithEvents(null);

    // Clean URL
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Broadcast logout so any listener can react
    dispatchAuthEvent('auth:logout');
    setIsLogoutLoading(false);
  };

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUserWithEvents(updatedUser);
    }
  };

  // Permission checking
  const can = (permission: string, resource?: unknown) => {
    if (!user || !isAuthenticated) {
      return false;
    }

    // Basic permission checking logic
    if (resource && typeof resource === 'object' && resource !== null && 'user' in resource && user) {
      const resourceWithUser = resource as { user: { id: string } };
      return resourceWithUser.user.id === user.id;
    }

    // You can extend this with more sophisticated permission logic
    return false;
  };

  // Get user initials
  const getInitials = (name?: string) => {
    const nameToUse = name || user?.name;
    if (!nameToUse) return '?';
    return nameToUse
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Enhanced cross-tab synchronization and event listeners
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        const newToken = localStorage.getItem('auth_token');
        if (newToken !== token) {
          setTokenWithEvents(newToken);
          if (newToken) {
            fetchUser(newToken);
          } else {
            setUserWithEvents(null);
            dispatchAuthEvent('auth:logout');
          }
        }
      }
      if (e.key === 'auth_user') {
        try {
          const newUser = e.newValue ? JSON.parse(e.newValue) : null;
          setUser(newUser);
        } catch (error) {
          console.warn('Failed to parse user data from localStorage:', error);
          setUser(null);
        }
      }
    };

    // React to explicit auth logout events (e.g., from API interceptors on 401)
    const handleAuthLogout = () => {
      setTokenWithEvents(null);
      setUserWithEvents(null);
    };

    // React to token change broadcasts within same tab
    const handleAuthToken = (e: CustomEvent) => {
      const nextToken = e?.detail?.token || null;
      if (nextToken !== token) {
        setTokenWithEvents(nextToken);
        if (nextToken) {
          // Ensure we have fresh user data
          fetchUser(nextToken);
        } else {
          setUserWithEvents(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:logout', handleAuthLogout);
    window.addEventListener('auth:token', handleAuthToken as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:logout', handleAuthLogout);
      window.removeEventListener('auth:token', handleAuthToken as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Only depend on token to avoid recreating listeners unnecessarily

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isLoginLoading,
    isLogoutLoading,
    login,
    logout,
    updateUser,
    can,
    getInitials,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
