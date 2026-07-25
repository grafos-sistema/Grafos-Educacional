/**
 * Loading Spinner Component
 * Skeleton-based fallback for lazy-loaded components and async sections
 */

export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const containerClasses = {
    sm: 'min-h-[96px] max-w-xs',
    md: 'min-h-[160px] max-w-md',
    lg: 'min-h-[220px] max-w-2xl',
  };

  const headerClasses = {
    sm: 'h-4 w-24',
    md: 'h-5 w-32',
    lg: 'h-6 w-40',
  };

  const lineClasses = {
    sm: ['h-3 w-full', 'h-3 w-4/5', 'h-3 w-2/3'],
    md: ['h-4 w-full', 'h-4 w-5/6', 'h-4 w-3/4'],
    lg: ['h-4 w-full', 'h-4 w-11/12', 'h-4 w-5/6', 'h-4 w-2/3'],
  };

  return (
    <div
      className={`mx-auto flex w-full flex-col justify-center gap-4 ${containerClasses[size]}`}
      role="status"
      aria-label="Carregando"
    >
      <div className={`${headerClasses[size]} animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700`} />
      <div className="space-y-3">
        {lineClasses[size].map((className, index) => (
          <div
            key={`${size}-${index}`}
            className={`${className} animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700`}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
      <span className="sr-only">{text || 'Carregando...'}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text="Carregando página..." />
    </div>
  );
}
