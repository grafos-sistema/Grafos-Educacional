'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { User, LoginCredentials } from '@/types/user.types';
import { clientCookies } from '@/lib/cookies';
import { clearCurrentUserProfileCache } from '@/lib/auth-profile';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken, refreshToken, isAuthenticated, login: storeLogin, logout: storeLogout, setLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  // #region debug-point infinite-loading-local-auth-context
  const dbgUrl =
    process.env.NEXT_PUBLIC_DEBUG_SERVER_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:7777/event' : '');
  const dbgSession = process.env.NEXT_PUBLIC_DEBUG_SESSION_ID || 'infinite-loading-local';
  const dbgEmit = (name: string, payload?: Record<string, unknown>) => {
    if (!dbgUrl) return;
    fetch(dbgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ts: Date.now(),
        sessionId: dbgSession,
        source: 'frontend',
        scope: 'AuthContext',
        name,
        payload: payload ?? {},
      }),
    }).catch(() => {});
  };
  // #endregion debug-point infinite-loading-local-auth-context

  // Initialize auth state on mount
  useEffect(() => {
    const syncPersistedSession = async (
      storedAccessToken: string,
      storedRefreshToken: string | null
    ) => {
      try {
        dbgEmit('syncPersistedSession:start', {
          hasAccessToken: Boolean(storedAccessToken),
          hasRefreshToken: Boolean(storedRefreshToken),
        });
        const profile = await authService.getProfile();
        storeLogin(profile, storedAccessToken, storedRefreshToken || '');
        dbgEmit('syncPersistedSession:success', {
          role: profile?.role,
          hasInstitutionId: Boolean((profile as any)?.institutionId),
        });
      } catch {
        if (storedRefreshToken) {
          try {
            dbgEmit('syncPersistedSession:refresh:start');
            const refreshResponse = await authService.refreshToken(storedRefreshToken);
            const profile = await authService.getProfile();
            storeLogin(profile, refreshResponse.accessToken, refreshResponse.refreshToken);
            dbgEmit('syncPersistedSession:refresh:success', {
              role: profile?.role,
              hasInstitutionId: Boolean((profile as any)?.institutionId),
            });
            return;
          } catch {
            clearCurrentUserProfileCache();
            dbgEmit('syncPersistedSession:refresh:failed');
          }
        }

        storeLogout();
        dbgEmit('syncPersistedSession:logout');
      }
    };

    const initAuth = async () => {
      dbgEmit('initAuth:start');
      const storeState = useAuthStore.getState();
      const { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken } = clientCookies.getAuthTokens();
      const storedAccessToken = storeState.accessToken ?? cookieAccessToken;
      const storedRefreshToken = storeState.refreshToken ?? cookieRefreshToken;
      const hasPersistedSession = Boolean(
        storeState.user && storeState.isAuthenticated && storedAccessToken
      );

      if (!hasPersistedSession) {
        setLoading(true);
        dbgEmit('initAuth:setLoading', { value: true });
      }

      if (hasPersistedSession) {
        setLoading(false);
        setIsInitialized(true);
        dbgEmit('initAuth:hasPersistedSession', {
          storeIsAuthenticated: Boolean(storeState.isAuthenticated),
          storeHasUser: Boolean(storeState.user),
          hasStoredAccessToken: Boolean(storedAccessToken),
        });
        void syncPersistedSession(storedAccessToken as string, storedRefreshToken ?? null);
        return;
      }

      if (storedAccessToken) {
        try {
          // Verify token and get user profile
          dbgEmit('initAuth:getProfile:start', { path: typeof window !== 'undefined' ? window.location.pathname : 'ssr' });
          const profile = await authService.getProfile();
          storeLogin(profile, storedAccessToken, storedRefreshToken || '');
          dbgEmit('initAuth:getProfile:success', {
            role: profile?.role,
            hasInstitutionId: Boolean((profile as any)?.institutionId),
          });
        } catch (error) {
          // Token is invalid, try to refresh
          if (storedRefreshToken) {
            try {
              dbgEmit('initAuth:refresh:start');
              const refreshResponse = await authService.refreshToken(storedRefreshToken);
              const profile = await authService.getProfile();
              storeLogin(profile, refreshResponse.accessToken, refreshResponse.refreshToken);
              dbgEmit('initAuth:refresh:success', {
                role: profile?.role,
                hasInstitutionId: Boolean((profile as any)?.institutionId),
              });
            } catch (refreshError) {
              // Refresh failed, clear auth state
              clearCurrentUserProfileCache();
              console.error('Token refresh failed:', refreshError);
              storeLogout();
              dbgEmit('initAuth:refresh:failed');
            }
          } else {
            // No refresh token, clear auth state
            clearCurrentUserProfileCache();
            console.error('Token validation failed:', error);
            storeLogout();
            dbgEmit('initAuth:tokenInvalid:noRefresh');
          }
        }
      } else {
        // No token found
        clearCurrentUserProfileCache();
        storeLogout();
        dbgEmit('initAuth:noToken');
      }

      setLoading(false);
      setIsInitialized(true);
      dbgEmit('initAuth:done');
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, storeLogin, storeLogout, setLoading]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      dbgEmit('login:start', { path: typeof window !== 'undefined' ? window.location.pathname : 'ssr' });
      const response = await authService.login(credentials);
      const currentPath = window.location.pathname;

      if (
        response.user.role === 'SUPER_ADMIN_GLOBAL' &&
        currentPath !== '/security'
      ) {
        try {
          await authService.logout();
        } catch {
          // Mesmo sem conseguir invalidar remotamente, bloqueia o acesso localmente
        }

        clearCurrentUserProfileCache();
        storeLogout();
        dbgEmit('login:blockedNonSecurity', { currentPath });
        throw new Error('O Super Admin Global deve acessar exclusivamente pela rota /security.');
      }

      // Store user and tokens
      storeLogin(response.user, response.accessToken, response.refreshToken);
      dbgEmit('login:stored', {
        role: response.user?.role,
        hasInstitutionId: Boolean((response.user as any)?.institutionId),
      });

      if (response.user.mustChangePassword) {
        router.push('/reset-password');
        setLoading(false);
        dbgEmit('login:redirect', { to: '/reset-password' });
        return;
      }

      // Check if user has multiple profiles
      const user = response.user;
      const profiles = [];

      // Count available profiles
      if (user.role) profiles.push(user.role);
      if (user.teacherProfile?.isActive) profiles.push('TEACHER');
      if (user.studentProfile?.isActive) profiles.push('STUDENT');
      if (user.parentProfile?.isActive) profiles.push('PARENT');

      // Remove duplicates
      const uniqueProfiles = Array.from(new Set(profiles));

      // Check for redirect URL from query params
      const searchParams = new URLSearchParams(window.location.search);
      const from = searchParams.get('from');

      // If multiple profiles, go to profile selection
      if (uniqueProfiles.length > 1) {
        router.push(from && from !== '/login' ? from : '/select-profile');
        dbgEmit('login:redirect', { to: from && from !== '/login' ? from : '/select-profile' });
      } else {
        // Single profile, redirect to intended page or dashboard
        const redirectPath = from && from !== '/login' ? from : getRedirectPathByRole(response.user.role);
        router.push(redirectPath);
        dbgEmit('login:redirect', { to: redirectPath });
      }

      setLoading(false);
      dbgEmit('login:done');
    } catch (error) {
      setLoading(false);
      dbgEmit('login:failed', { message: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  };

  // Helper function to determine redirect path based on role
  const getRedirectPathByRole = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
      case 'SUPER_ADMIN_GLOBAL':
        return '/communication';
      case 'INSTITUTION_ADMIN':
        return '/admin/dashboard';
      case 'COORDINATOR':
        return '/coordinator/dashboard';
      case 'TEACHER':
        return '/professor/dashboard';
      case 'STUDENT':
        return '/aluno/dashboard';
      case 'PARENT':
        return '/responsaveis/dashboard';
      default:
        return '/dashboard';
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      storeLogout();

      // Redirect to login (profile selection)
      router.push('/');
    }
  };

  const refreshProfile = async () => {
    if (!accessToken) return;

    try {
      const profile = await authService.getProfile({ forceRefresh: true });
      storeLogin(profile, accessToken, refreshToken || '');
    } catch (error) {
      console.error('Failed to refresh profile:', error);
      // If profile refresh fails, logout user
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading: useAuthStore((state) => state.isLoading),
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
