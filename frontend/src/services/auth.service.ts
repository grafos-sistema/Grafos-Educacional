import api from '@/lib/api';
import { getApiBaseUrl, getApiConfigurationMessage } from '@/lib/api-url';
import {
  clearCurrentUserProfileCache,
  fetchCurrentUserProfile,
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
      const normalizedMessage = error?.message?.trim().toLowerCase() ?? '';
      const normalizedCode = error?.code?.trim().toLowerCase() ?? '';

      if (
        normalizedCode === 'invalid_credentials' ||
        normalizedMessage.includes('invalid login credentials')
      ) {
        throw new Error('Email ou senha incorretos. Confira os dados e tente novamente.');
      }

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
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (currentPassword === newPassword) {
      throw new Error('A nova senha deve ser diferente da senha atual.');
    }

    const {
      data: { user: authUser },
      error: authUserError,
    } = await supabase.auth.getUser();

    if (authUserError || !authUser?.email) {
      throw new Error('Sessão do usuário não encontrada. Faça login novamente.');
    }

    // A troca obrigatória acontece em uma sessão autenticada no Supabase. Revalidar
    // a senha atual antes do update evita que a mesma senha seja aceita como nova
    // e impede que uma tentativa com senha incorreta pareça ter dado certo.
    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: currentPassword,
    });

    if (verificationError) {
      throw new Error('Senha atual incorreta.');
    }

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
    // A consulta direta a user_institutions via REST estava gerando 502/CORS
    // intermitente no navegador. O backend já possui essa consulta com Prisma e
    // também devolve a instituição principal; use-o como fonte única para o menu.
    const response = await api.get<UserInstitutionOption[]>('/auth/institutions', {
      headers: { 'x-skip-error-toast': '1' },
    });
    return response as unknown as UserInstitutionOption[];
  },

  /**
   * Switch active institution
   */
  async switchInstitution(institutionId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
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
