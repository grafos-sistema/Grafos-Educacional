'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SkipLink } from '@/components/ui/SkipLink';
import { AuthenticatedShellSkeleton } from '@/components/layout/AuthenticatedRouteSkeleton';
import {
  AuthenticatedNavigationProvider,
  useAuthenticatedNavigation,
} from '@/components/layout/AuthenticatedNavigationProvider';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'desktop-sidebar-collapsed';

function AuthenticatedContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isNavigating } = useAuthenticatedNavigation();

  return (
    <div className="mt-4" suppressHydrationWarning>
      {isNavigating ? <AuthenticatedShellSkeletonContent /> : children}
    </div>
  );
}

function AuthenticatedShellSkeletonContent() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-64 max-w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-7 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-12 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>

        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 dark:border-gray-700/80 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex-1 space-y-2">
                <div className="h-5 w-56 max-w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.mustChangePassword) {
      router.replace('/reset-password');
    }
  }, [isAuthenticated, isLoading, router, user?.mustChangePassword]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    setIsDesktopSidebarCollapsed(storedValue === 'true');
  }, []);

  const handleDesktopSidebarCollapsedChange = (collapsed: boolean) => {
    setIsDesktopSidebarCollapsed(collapsed);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
    }
  };

  if (isLoading) {
    return <AuthenticatedShellSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SkipLink />
      <AuthenticatedNavigationProvider>
        <div className="flex h-screen overflow-hidden bg-secondary-50" suppressHydrationWarning>
          {/* Sidebar */}
          <Sidebar
            isDesktopCollapsed={isDesktopSidebarCollapsed}
            onDesktopCollapsedChange={handleDesktopSidebarCollapsedChange}
          />

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden" suppressHydrationWarning>
            {/* Header */}
            <Header />

            {/* Page content */}
            <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
            <div className="py-6 px-4 sm:px-6 lg:px-8 pt-16 lg:pt-6" suppressHydrationWarning>
              <Breadcrumbs />
              <AuthenticatedContent>{children}</AuthenticatedContent>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-secondary-200 py-3 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
              <p className="text-xs sm:text-sm text-secondary-500">
                © 2025 Grafos - Plataforma Educacional.
              </p>
              <span className="hidden sm:inline text-secondary-300">•</span>
              <p className="text-xs sm:text-sm text-secondary-500">
                Todos os direitos reservados.
              </p>
            </div>
          </footer>
        </div>
      </div>
      </AuthenticatedNavigationProvider>
    </>
  );
}
