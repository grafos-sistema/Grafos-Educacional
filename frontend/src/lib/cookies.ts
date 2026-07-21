/**
 * Cookie utilities for client and server-side access
 */

// Client-side cookie operations
export const clientCookies = {
  set: (name: string, value: string, days: number = 7) => {
    if (typeof window === 'undefined') return;

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    // Only add Secure flag for HTTPS
    const isSecure = window.location.protocol === 'https:';
    const secureFlag = isSecure ? ';Secure' : '';

    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax${secureFlag}`;
  },

  get: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
  },

  remove: (name: string) => {
    if (typeof window === 'undefined') return;
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  },

  // Auth-specific methods
  setAuthTokens: (accessToken: string, refreshToken: string) => {
    clientCookies.set('accessToken', accessToken, 1); // 1 day
    clientCookies.set('refreshToken', refreshToken, 7); // 7 days
  },

  setUserRole: (role: string) => {
    clientCookies.set('userRole', role, 7);
  },

  getAuthTokens: () => {
    return {
      accessToken: clientCookies.get('accessToken'),
      refreshToken: clientCookies.get('refreshToken'),
    };
  },

  getUserRole: (): string | null => {
    return clientCookies.get('userRole');
  },

  clearAuthTokens: () => {
    clientCookies.remove('accessToken');
    clientCookies.remove('refreshToken');
    clientCookies.remove('userRole');
  },
};

// Server-side cookie operations (for middleware)
export const serverCookies = {
  get: (cookieHeader: string, name: string): string | null => {
    if (!cookieHeader) return null;
    
    const nameEQ = name + '=';
    const ca = cookieHeader.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
  },

  getAuthTokens: (cookieHeader: string) => {
    return {
      accessToken: serverCookies.get(cookieHeader, 'accessToken'),
      refreshToken: serverCookies.get(cookieHeader, 'refreshToken'),
    };
  },

  getUserRole: (cookieHeader: string): string | null => {
    return serverCookies.get(cookieHeader, 'userRole');
  },
};
