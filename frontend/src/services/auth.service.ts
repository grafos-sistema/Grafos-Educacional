import api from '@/lib/api';
import { getApiBaseUrl, getApiConfigurationMessage } from '@/lib/api-url';
import {
  clearCurrentUserProfileCache,
  fetchCurrentUserProfile,
  fetchUserInstitutions,
} from '@/lib/auth-profile';
import { supabase } from '@/lib/supabase';
import { AuthResponse, LoginCredentials, User, PublicRegisterData } from '@/types/user.types';

export interface UserInstitutionOption {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  isActive: boolean;
  isPrimary: boolean;
  isCurrent: boolean;
}

export const authService = {
  /**
   * Public self-registration
   */
  async publicRegister(data: PublicRegisterData): Promise<AuthResponse> {
    if (!getApiBaseUrl()) {
      throw new Error(getApiConfigurationMessage());
    }

    const response = await api.post<AuthResponse>('/auth/public-register', data);
    return response as unknown as AuthResponse;
  },

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Falha ao autenticar com o Supabase');
    }

    const user = await fetchCurrentUserProfile();

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user,
    };
  },

  /**
   * Logout user (client-side only - no API call needed)
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    clearCurrentUserProfileCache();
  },

  /**
   * Get current user profile
   */
  async getProfile(options?: { forceRefresh?: boolean }): Promise<User> {
    return fetchCurrentUserProfile(options);
  },

  /**
   * Refresh authentication token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new Error(error?.message || 'Não foi possível renovar a sessão');
    }

    const user = await fetchCurrentUserProfile();

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user,
    };
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });

    if (error) {
      throw error;
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(_token: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        mustChangePassword: false,
      },
    });
    if (error) {
      throw error;
    }
    clearCurrentUserProfileCache();
  },

  /**
   * Change password (authenticated user)
   */
  async changePassword(_currentPassword: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        mustChangePassword: false,
      },
    });
    if (error) {
      throw error;
    }
    clearCurrentUserProfileCache();
  },

  /**
   * Verify if token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return !!user;
    } catch {
      return false;
    }
  },

  /**
   * Get full user profile with institutions
   */
  async getFullProfile(): Promise<User> {
    return this.getProfile();
  },

  /**
   * Get user institutions
   */
  async getInstitutions(): Promise<UserInstitutionOption[]> {
    return fetchUserInstitutions();
  },

  /**
   * Switch active institution
   */
  async switchInstitution(institutionId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const {
      data: { session, user },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session || !user) {
      throw new Error('Sessão do Supabase não encontrada');
    }

    const profile = await fetchCurrentUserProfile();

    const { error: updateError } = await supabase
      .from('users')
      .update({
        institutionId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      throw updateError;
    }

    clearCurrentUserProfileCache();

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    };
  },
};
