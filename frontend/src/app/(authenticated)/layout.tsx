'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { SkipLink } from '@/components/ui/SkipLink';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'desktop-sidebar-collapsed';

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
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.mustChangePassword) {
      router.push('/reset-password');
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700" suppressHydrationWarning>
        <div className="text-center" suppressHydrationWarning>
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SkipLink />
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
            <div className="mt-4" suppressHydrationWarning>
              {children}
            </div>
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
    </>
  );
}
