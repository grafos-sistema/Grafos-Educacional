import { Suspense, ComponentType, lazy } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LazyLoadProps {
  fallback?: React.ReactNode;
}

/**
 * Wrapper para lazy loading com Suspense
 * Reduz o bundle inicial e melhora performance
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" text="Carregando..." />
          </div>
        )
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Suspense wrapper standalone para uso direto
 */
export function LazyLoad({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" text="Carregando..." />
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}
