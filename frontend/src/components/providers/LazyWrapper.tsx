/**
 * Lazy Wrapper Component
 * Wraps lazy-loaded components with Suspense and error boundary
 */

import { Suspense, type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageLoader } from '@/components/ui/LoadingSpinner';

interface LazyWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
