/**
 * Performance Optimization Utilities
 *
 * Helpers for lazy loading, memoization, and performance monitoring
 */

import React, { lazy, ComponentType } from 'react';

/**
 * Lazy load a component with retry logic
 *
 * @example
 * const LazyDashboard = lazyWithRetry(() => import('./Dashboard'));
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed && retries > 0) {
        // Assuming module chunk failed to load, force refresh the page
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
        // Return a dummy component to satisfy TypeScript
        // This will never actually render as the page will reload
        return { default: (() => null) as any as T };
      }

      // If we've already tried refreshing or run out of retries, throw the error
      throw error;
    }
  });
}

/**
 * Debounce function calls
 *
 * @example
 * const debouncedSearch = debounce((query: string) => search(query), 300);
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function calls
 *
 * @example
 * const throttledScroll = throttle((e) => handleScroll(e), 100);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Create a memoized selector function
 *
 * @example
 * const selectUserName = createSelector(
 *   (state) => state.user,
 *   (user) => user.name
 * );
 */
export function createSelector<T, R>(
  selector: (state: T) => any,
  transform: (selected: any) => R
): (state: T) => R {
  let lastInput: any;
  let lastResult: R;

  return (state: T) => {
    const input = selector(state);

    if (input === lastInput) {
      return lastResult;
    }

    lastInput = input;
    lastResult = transform(input);
    return lastResult;
  };
}

/**
 * Measure component render performance
 *
 * @example
 * const MeasuredComponent = measurePerformance(MyComponent, 'MyComponent');
 */
export function measurePerformance<P extends object>(
  Component: ComponentType<P>,
  componentName: string
): ComponentType<P> {
  if (process.env.NODE_ENV === 'production') {
    return Component;
  }

  return function MeasuredComponent(props: P) {
    const startTime = performance.now();

    // Use useEffect equivalent
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;

        if (renderTime > 16) {
          // Log slow renders (>16ms = <60fps)
          console.warn(
            `[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms`
          );
        }
      }, 0);
    }

    return React.createElement(Component, props);
  };
}

/**
 * Intersection Observer hook for lazy loading
 *
 * @example
 * const ref = useIntersectionObserver(() => {
 *   loadMoreData();
 * });
 */
export function createIntersectionObserver(
  callback: () => void,
  options?: IntersectionObserverInit
): (node: Element | null) => void {
  let observer: IntersectionObserver | null = null;

  return (node: Element | null) => {
    if (observer) observer.disconnect();

    if (node) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      }, options);

      observer.observe(node);
    }
  };
}

/**
 * Prefetch data or components
 *
 * @example
 * prefetch(() => import('./HeavyComponent'));
 */
export function prefetch(
  importFn: () => Promise<any>,
  delay = 0
): void {
  if (typeof window === 'undefined') return;

  setTimeout(() => {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        importFn().catch(() => {
          // Silently fail - this is just a prefetch
        });
      });
    } else {
      setTimeout(() => {
        importFn().catch(() => {
          // Silently fail
        });
      }, 0);
    }
  }, delay);
}

/**
 * Check if code splitting is supported
 */
export const supportsCodeSplitting = typeof Promise !== 'undefined';

/**
 * Optimize image loading
 *
 * @example
 * <img {...getOptimizedImageProps('/images/hero.jpg', 800)} alt="Hero" />
 */
export function getOptimizedImageProps(
  src: string,
  width?: number,
  height?: number
) {
  return {
    src,
    loading: 'lazy' as const,
    decoding: 'async' as const,
    ...(width && { width }),
    ...(height && { height }),
  };
}

/**
 * Virtual scrolling helper - calculates visible range
 *
 * @example
 * const { start, end } = getVisibleRange(scrollTop, itemHeight, containerHeight, totalItems);
 */
export function getVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const end = Math.min(totalItems, start + visibleCount + overscan * 2);

  return { start, end };
}
