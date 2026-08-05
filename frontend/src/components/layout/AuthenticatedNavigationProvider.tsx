'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

type AuthenticatedNavigationContextValue = {
  isNavigating: boolean;
  startNavigation: (targetLocation?: string) => void;
  stopNavigation: () => void;
};

const AuthenticatedNavigationContext = createContext<
  AuthenticatedNavigationContextValue | undefined
>(undefined);

const defaultAuthenticatedNavigationValue: AuthenticatedNavigationContextValue = {
  isNavigating: false,
  startNavigation: () => undefined,
  stopNavigation: () => undefined,
};

export function AuthenticatedNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<string | null>(null);
  const currentLocation = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const previousLocationRef = useRef(currentLocation);
  const fallbackTimeoutRef = useRef<number | null>(null);

  // #region debug-point menu-nav-bounce-authenticated-navigation
  const dbgEnabled =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('dbg');
  const dbgUrl =
    process.env.NEXT_PUBLIC_DEBUG_SERVER_URL ||
    (dbgEnabled ? 'http://127.0.0.1:7777/event' : '');
  const dbgSession =
    process.env.NEXT_PUBLIC_DEBUG_SESSION_ID || 'menu-nav-bounce';
  const dbgEmit = (name: string, payload?: Record<string, unknown>) => {
    if (!dbgUrl) return;
    fetch(dbgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ts: Date.now(),
        sessionId: dbgSession,
        source: 'frontend',
        scope: 'AuthenticatedNavigationProvider',
        name,
        payload: payload ?? {},
      }),
    }).catch(() => {});
  };
  // #endregion debug-point menu-nav-bounce-authenticated-navigation

  const clearFallbackTimeout = useCallback(() => {
    if (fallbackTimeoutRef.current !== null) {
      window.clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  const startNavigation = useCallback((targetLocation?: string) => {
    if (targetLocation && targetLocation === currentLocation) {
      dbgEmit('startNavigation:noop', { targetLocation, currentLocation });
      return;
    }

    clearFallbackTimeout();
    setPendingLocation(targetLocation ?? null);
    setIsNavigating(true);
    dbgEmit('startNavigation:set', {
      targetLocation: targetLocation ?? null,
      currentLocation,
    });
    fallbackTimeoutRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      setPendingLocation(null);
      fallbackTimeoutRef.current = null;
      dbgEmit('startNavigation:timeout', {
        pendingLocation: targetLocation ?? null,
        currentLocation: `${window.location.pathname}${window.location.search}`,
      });
    }, 15000);
  }, [clearFallbackTimeout, currentLocation]);

  const stopNavigation = useCallback(() => {
    clearFallbackTimeout();
    setIsNavigating(false);
    setPendingLocation(null);
    dbgEmit('stopNavigation', {
      currentLocation: `${window.location.pathname}${window.location.search}`,
    });
  }, [clearFallbackTimeout]);

  useEffect(() => {
    dbgEmit('route:change', {
      previous: previousLocationRef.current,
      current: currentLocation,
      isNavigating,
      pendingLocation,
    });
    if (!isNavigating) {
      previousLocationRef.current = currentLocation;
      return;
    }

    const routeChanged = previousLocationRef.current !== currentLocation;
    const reachedTarget = pendingLocation ? currentLocation === pendingLocation : routeChanged;

    if (reachedTarget) {
      dbgEmit('route:reachedTarget', {
        previous: previousLocationRef.current,
        current: currentLocation,
        pendingLocation,
        routeChanged,
      });
      stopNavigation();
    }

    previousLocationRef.current = currentLocation;
  }, [currentLocation, isNavigating, pendingLocation, stopNavigation]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;

      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const currentLocation = `${window.location.pathname}${window.location.search}`;
      const nextLocation = `${url.pathname}${url.search}`;

      if (currentLocation === nextLocation) return;

      dbgEmit('documentClick:navigate', {
        currentLocation,
        nextLocation,
        href,
      });
      startNavigation(nextLocation);
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [startNavigation]);

  useEffect(() => {
    return () => clearFallbackTimeout();
  }, [clearFallbackTimeout]);

  const value = useMemo(
    () => ({
      isNavigating,
      startNavigation,
      stopNavigation,
    }),
    [isNavigating, startNavigation, stopNavigation]
  );

  return (
    <AuthenticatedNavigationContext.Provider value={value}>
      {children}
    </AuthenticatedNavigationContext.Provider>
  );
}

export function useAuthenticatedNavigation() {
  return (
    useContext(AuthenticatedNavigationContext) ??
    defaultAuthenticatedNavigationValue
  );
}
