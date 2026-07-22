import axios from 'axios';
import { clientCookies } from './cookies';
import { getApiBaseUrl, getApiConfigurationMessage } from './api-url';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

const apiBaseUrl = getApiBaseUrl();
const AUTH_ROUTES_THAT_REQUIRE_RELOGIN = ['/auth/profile', '/auth/refresh', '/auth/logout'];

const shouldForceLogoutOnUnauthorized = (requestUrl?: string): boolean => {
  if (!requestUrl) return false;

  return AUTH_ROUTES_THAT_REQUIRE_RELOGIN.some((route) => requestUrl.includes(route));
};

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 33330,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from cookies
    const { accessToken } = clientCookies.getAuthTokens();
    const storeAccessToken = useAuthStore.getState().accessToken;
    const resolvedAccessToken = accessToken || storeAccessToken;

    if (resolvedAccessToken) {
      config.headers.Authorization = `Bearer ${resolvedAccessToken}`;
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
    if (error.response) {
      // Server responded with error status
      const { status, data, config } = error.response;

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
            const unauthorizedMsg = data?.message || 'Não autorizado para acessar este recurso';
            toast.error(unauthorizedMsg);
            console.error('Unauthorized:', unauthorizedMsg);
          }
          break;

        case 403:
          // Forbidden - user doesn't have permission
          const forbiddenMsg = data?.message || 'Você não tem permissão para acessar este recurso';
          toast.error(forbiddenMsg);
          console.error('Access denied:', forbiddenMsg);
          break;

        case 404:
          // Not found
          const notFoundMsg = data?.message || 'Recurso não encontrado';
          toast.error(notFoundMsg);
          console.error('Resource not found:', notFoundMsg);
          break;

        case 409:
          // Conflict (e.g., duplicate record)
          const conflictMsg = data?.message || 'Registro duplicado';
          if (Array.isArray(conflictMsg)) {
            conflictMsg.forEach(msg => toast.error(msg));
          } else {
            toast.error(conflictMsg);
          }
          console.error('Conflict:', conflictMsg);
          break;

        case 422:
        case 400:
          // Validation error
          const validationMsg = data?.message || 'Erro de validação';
          // Se for array de mensagens, mostrar todas
          if (Array.isArray(validationMsg)) {
            validationMsg.forEach(msg => toast.error(msg));
          } else {
            toast.error(validationMsg);
          }
          console.error('Validation error:', validationMsg);
          break;

        case 500:
          // Server error
          const serverMsg = data?.message || 'Erro interno do servidor. Tente novamente mais tarde.';
          toast.error(serverMsg);
          console.error('Server error:', serverMsg);
          break;

        default:
          const defaultMsg = data?.message || 'Erro ao processar requisição';
          toast.error(defaultMsg);
          console.error('API error:', defaultMsg);
      }

      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Request made but no response received
      const networkMsg =
        !api.defaults.baseURL && typeof window !== 'undefined'
          ? getApiConfigurationMessage()
          : 'Erro de conexão. Verifique sua internet e tente novamente.';
      toast.error(networkMsg);
      console.error('Network error - no response received');
      return Promise.reject({ message: networkMsg });
    } else {
      // Error setting up request
      const requestMsg = error.message || 'Erro ao processar requisição';
      toast.error(requestMsg);
      console.error('Request error:', requestMsg);
      return Promise.reject({ message: requestMsg });
    }
  }
);

export default api;
export { apiBaseUrl };
