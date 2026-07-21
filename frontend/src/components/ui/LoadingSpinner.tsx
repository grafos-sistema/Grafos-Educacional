/**
 * Loading Spinner Component
 * Used as fallback for lazy-loaded components
 */

export function LoadingSpinner({ size = 'md', text }: { size?: 'sm' | 'md' | 'lg'; text?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-primary-600`}
        role="status"
        aria-label="Carregando"
      />
      {text && <p className="text-sm text-gray-600 dark:text-gray-400">{text}</p>}
      <span className="sr-only">Carregando...</span>
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
