'use client';

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

export function AuthenticatedPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-8 w-64 max-w-full" />
        <SkeletonBlock className="h-4 w-96 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <SkeletonBlock className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-7 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
          <SkeletonBlock className="h-12 w-full" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-700/80 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-56 max-w-full" />
                <SkeletonBlock className="h-4 w-80 max-w-full" />
              </div>
              <SkeletonBlock className="h-10 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthenticatedShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-secondary-50" suppressHydrationWarning>
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-secondary-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-secondary-200 px-6">
          <SkeletonBlock className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {Array.from({ length: 3 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              {Array.from({ length: 4 }).map((__, itemIndex) => (
                <SkeletonBlock key={itemIndex} className="h-10 w-full" />
              ))}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-secondary-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="hidden items-center gap-3 lg:flex">
            <SkeletonBlock className="h-10 w-10 rounded-lg" />
            <div className="hidden space-y-2 md:block">
              <SkeletonBlock className="h-4 w-28" />
              <SkeletonBlock className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-10 w-36" />
            <SkeletonBlock className="h-10 w-10 rounded-full" />
            <SkeletonBlock className="h-10 w-44" />
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8" suppressHydrationWarning>
            <div className="mb-4 hidden items-center gap-2 md:flex">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-3 w-3 rounded-full" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <AuthenticatedPageSkeleton />
          </div>
        </main>

        <footer className="border-t border-secondary-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <SkeletonBlock className="h-3 w-40" />
            <SkeletonBlock className="hidden h-3 w-3 rounded-full sm:block" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        </footer>
      </div>
    </div>
  );
}
