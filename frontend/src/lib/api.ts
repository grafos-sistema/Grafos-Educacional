import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { clientCookies } from './cookies';
import { getApiBaseUrl, getApiConfigurationMessage } from './api-url';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import {
  getFriendlyErrorInfo,
  presentFriendlyError,
  type FriendlyErrorInfo,
} from '@/lib/friendly-error';

const apiBaseUrl = getApiBaseUrl();
const AUTH_ROUTES_THAT_REQUIRE_RELOGIN = ['/auth/profile', '/auth/refresh', '/auth/logout'];
const DEFAULT_TOKEN_CLOCK_SKEW_MS = 30_000;

const shouldForceLogoutOnUnauthorized = (requestUrl?: string): boolean => {
  if (!requestUrl) return false;

  return AUTH_ROUTES_THAT_REQUIRE_RELOGIN.some((route) => requestUrl.includes(route));
};

const isExpiredToken = (token: string, skewMs = DEFAULT_TOKEN_CLOCK_SKEW_MS): boolean => {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token);
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000 - skewMs;
  } catch {
    return false;
  }
};

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 33330,
});

const shouldSuppressFriendlyError = (config?: any): boolean => {
  if (!config) return false;

  const headers = config.headers ?? {};
  let value: unknown;

  if (headers && typeof headers === 'object') {
    const maybeHeaders = headers as any;
    if (typeof maybeHeaders.get === 'function') {
      value = maybeHeaders.get('x-skip-error-toast') ?? maybeHeaders.get('X-Skip-Error-Toast');
    } else {
      const record = maybeHeaders as Record<string, unknown>;
      const key = Object.keys(record).find((item) => item.toLowerCase() === 'x-skip-error-toast');
      value = key ? record[key] : undefined;
    }
  }

  return value === '1' || value === 1 || (config as any).skipFriendlyError === true;
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    // Get token from cookies
    const { accessToken } = clientCookies.getAuthTokens();
    const storeAccessToken = useAuthStore.getState().accessToken;
    const headerAuth =
      (config.headers as any)?.Authorization || (config.headers as any)?.authorization;

    let resolvedAccessToken = accessToken || storeAccessToken;
    if (resolvedAccessToken && isExpiredToken(resolvedAccessToken)) {
      resolvedAccessToken = null;
    }

    if (!resolvedAccessToken) {
      const { data } = await supabase.auth.getSession();
      let sessionAccessToken = data.session?.access_token ?? null;
      let sessionRefreshToken = data.session?.refresh_token ?? null;

      if (sessionAccessToken && isExpiredToken(sessionAccessToken)) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        sessionAccessToken = refreshed.session?.access_token ?? null;
        sessionRefreshToken = refreshed.session?.refresh_token ?? null;
      }

      resolvedAccessToken = sessionAccessToken;

      if (resolvedAccessToken) {
        useAuthStore.getState().setTokens(resolvedAccessToken, sessionRefreshToken);
      }
    }

    if (!headerAuth && resolvedAccessToken) {
      config.headers.Authorization = `Bearer ${resolvedAccessToken}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else if (!config.headers['Content-Type'] && !config.headers['content-type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const suppressFriendlyError = shouldSuppressFriendlyError(error?.config);
    if (error.response) {
      // Server responded with error status
      const { status, data, config } = error.response;
      const suppressFriendlyError = shouldSuppressFriendlyError(config);

      switch (status) {
        case 401:
          // Only auth bootstrap/profile endpoints should force a logout flow.
          // Other API modules may still be unavailable while the Supabase session is valid.
          if (config && !config._retry && shouldForceLogoutOnUnauthorized(config.url)) {
            config._retry = true;

            const { refreshToken } = clientCookies.getAuthTokens();

            if (refreshToken) {
              // TODO: Fix circular dependency with authService
              // For now, just clear tokens and redirect
              if (typeof window !== 'undefined') {
                toast.error('Sessão expirada. Faça login novamente.');
                clientCookies.clearAuthTokens();
                localStorage.removeItem('user');
                window.location.href = '/';
              }
            } else {
              // No refresh token, clear tokens and redirect to login
              if (typeof window !== 'undefined') {
                toast.error('Não autorizado. Faça login novamente.');
                clientCookies.clearAuthTokens();
                localStorage.removeItem('user');
                window.location.href = '/';
              }
            }
          } else {
            if (!suppressFriendlyError) {
              const info = presentFriendlyError(
                { message: data?.message || 'Não autorizado para acessar este recurso' },
                'Voce precisa entrar novamente para continuar.'
              );
              console.error('Unauthorized:', info.rawMessage);
            }
          }
          break;

        case 403:
          // Forbidden - user doesn't have permission
          if (!suppressFriendlyError) {
            const friendlyInfo = presentFriendlyError(
              { message: data?.message || 'Você não tem permissão para acessar este recurso' },
              'Voce nao tem permissao para acessar esse recurso.'
            );
            const handledError = error as {
              __friendlyHandled?: boolean;
              __friendlyErrorInfo?: FriendlyErrorInfo;
            };
            handledError.__friendlyHandled = true;
            handledError.__friendlyErrorInfo = friendlyInfo;
          }
          break;

        case 404:
          // Not found
          if (!suppressFriendlyError) {
            const notFoundInfo = presentFriendlyError(
              { message: data?.message || 'Recurso não encontrado' },
              'Nao encontramos as informacoes solicitadas.'
            );
            console.error('Resource not found:', notFoundInfo.rawMessage);
          }
          break;

        case 409:
          // Conflict (e.g., duplicate record)
          if (!suppressFriendlyError) {
            const conflictInfo = presentFriendlyError(
              { message: data?.message || 'Registro duplicado' },
              'Ja existe um cadastro com uma dessas informacoes.'
            );
            console.error('Conflict:', conflictInfo.rawMessage);
          }
          break;

        case 422:
        case 400:
          // Validation error
          if (!suppressFriendlyError) {
            const validationInfo = presentFriendlyError(
              { message: data?.message || 'Erro de validação' },
              'Revise os dados informados e tente novamente.'
            );
            console.error('Validation error:', validationInfo.rawMessage);
          }
          break;

        case 500:
          // Server error
          if (!suppressFriendlyError) {
            const serverInfo = presentFriendlyError(
              { message: data?.message || 'Erro interno do servidor. Tente novamente mais tarde.' },
              'O sistema nao conseguiu concluir a acao agora. Tente novamente em instantes.'
            );
            console.error('Server error:', serverInfo.rawMessage);
          }
          break;

        default:
          if (!suppressFriendlyError) {
            const defaultInfo = presentFriendlyError(
              { message: data?.message || 'Erro ao processar requisição' },
              'Nao foi possivel concluir a acao solicitada.'
            );
            console.error('API error:', defaultInfo.rawMessage);
          }
      }

      const friendlyInfo = getFriendlyErrorInfo(
        { message: data?.message },
        'Nao foi possivel concluir a acao solicitada.'
      );

      return Promise.reject({
        ...(typeof error.response.data === 'object' && error.response.data !== null
          ? error.response.data
          : { message: data?.message }),
        __friendlyHandled: true,
        __friendlyErrorInfo: friendlyInfo,
      });
    } else if (error.request) {
      // Request made but no response received
      const networkMsg =
        !api.defaults.baseURL && typeof window !== 'undefined'
          ? getApiConfigurationMessage()
          : 'Erro de conexão. Verifique sua internet e tente novamente.';
      if (!suppressFriendlyError) {
        presentFriendlyError({ message: networkMsg }, networkMsg);
      }
      if (!suppressFriendlyError) {
        console.error('Network error - no response received');
      }
      return Promise.reject({
        message: networkMsg,
        __friendlyHandled: true,
        __friendlyErrorInfo: getFriendlyErrorInfo({ message: networkMsg }, networkMsg),
      });
    } else {
      // Error setting up request
      const requestMsg = error.message || 'Erro ao processar requisição';
      presentFriendlyError({ message: requestMsg }, 'Nao foi possivel concluir a acao solicitada.');
      console.error('Request error:', requestMsg);
      return Promise.reject({
        message: requestMsg,
        __friendlyHandled: true,
        __friendlyErrorInfo: getFriendlyErrorInfo({ message: requestMsg }),
      });
    }
  }
);

export default api;
export { apiBaseUrl };
