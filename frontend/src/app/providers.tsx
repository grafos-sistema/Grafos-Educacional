'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HeroUIProvider } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useKeyboardFocus } from '@/hooks/useKeyboardFocus';

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Detect keyboard navigation for enhanced focus indicators
  useKeyboardFocus();

  // Evitar hydration mismatch renderizando Toaster apenas no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <HeroUIProvider navigate={router.push}>
      <QueryClientProvider client={queryClient}>
        {mounted && (
          <Toaster
            position="top-right"
            reverseOrder={false}
            containerStyle={{
              zIndex: 9999,
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '14px',
              },
              success: {
                duration: 3333,
                iconTheme: {
                  primary: '#33A551',
                  secondary: '#fff',
                },
                ariaProps: {
                  role: 'status',
                  'aria-live': 'polite',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                ariaProps: {
                  role: 'alert',
                  'aria-live': 'assertive',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
                ariaProps: {
                  role: 'status',
                  'aria-live': 'polite',
                },
              },
            }}
          />
        )}
        {children}
      </QueryClientProvider>
    </HeroUIProvider>
  );
}
