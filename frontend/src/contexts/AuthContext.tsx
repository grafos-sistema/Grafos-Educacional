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

  // Initialize auth state on mount
  useEffect(() => {
    const syncPersistedSession = async (
      storedAccessToken: string,
      storedRefreshToken: string | null
    ) => {
      try {
        const profile = await authService.getProfile({ forceRefresh: true });
        storeLogin(profile, storedAccessToken, storedRefreshToken || '');
      } catch (error) {
        if (storedRefreshToken) {
          try {
            const refreshResponse = await authService.refreshToken(storedRefreshToken);
            const profile = await authService.getProfile({ forceRefresh: true });
            storeLogin(profile, refreshResponse.accessToken, refreshResponse.refreshToken);
            return;
          } catch {
            clearCurrentUserProfileCache();
          }
        }

        storeLogout();
      }
    };

    const initAuth = async () => {
      const storeState = useAuthStore.getState();
      const { accessToken: cookieAccessToken, refreshToken: cookieRefreshToken } = clientCookies.getAuthTokens();
      const storedAccessToken = storeState.accessToken ?? cookieAccessToken;
      const storedRefreshToken = storeState.refreshToken ?? cookieRefreshToken;
      const hasPersistedSession = Boolean(
        storeState.user && storeState.isAuthenticated && storedAccessToken
      );

      if (!hasPersistedSession) {
        setLoading(true);
      }

      if (hasPersistedSession) {
        setLoading(false);
        setIsInitialized(true);
        void syncPersistedSession(storedAccessToken as string, storedRefreshToken ?? null);
        return;
      }

      if (storedAccessToken) {
        try {
          // Verify token and get user profile
          const profile = await authService.getProfile({ forceRefresh: true });
          storeLogin(profile, storedAccessToken, storedRefreshToken || '');
        } catch (error) {
          // Token is invalid, try to refresh
          if (storedRefreshToken) {
            try {
              const refreshResponse = await authService.refreshToken(storedRefreshToken);
              const profile = await authService.getProfile({ forceRefresh: true });
              storeLogin(profile, refreshResponse.accessToken, refreshResponse.refreshToken);
            } catch (refreshError) {
              // Refresh failed, clear auth state
              clearCurrentUserProfileCache();
              console.error('Token refresh failed:', refreshError);
              storeLogout();
            }
          } else {
            // No refresh token, clear auth state
            clearCurrentUserProfileCache();
            console.error('Token validation failed:', error);
            storeLogout();
          }
        }
      } else {
        // No token found
        clearCurrentUserProfileCache();
        storeLogout();
      }

      setLoading(false);
      setIsInitialized(true);
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, storeLogin, storeLogout, setLoading]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);

      // Store user and tokens
      storeLogin(response.user, response.accessToken, response.refreshToken);

      if (response.user.mustChangePassword) {
        router.push('/reset-password');
        setLoading(false);
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
      } else {
        // Single profile, redirect to intended page or dashboard
        const redirectPath = from && from !== '/login' ? from : getRedirectPathByRole(response.user.role);
        router.push(redirectPath);
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Helper function to determine redirect path based on role
  const getRedirectPathByRole = (role: string): string => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';
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
