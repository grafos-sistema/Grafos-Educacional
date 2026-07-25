/**
 * usePrefetch Hook
 *
 * Prefetch de rotas prováveis para melhorar a navegação.
 * Usa requestIdleCallback para não bloquear a thread principal.
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PrefetchOptions {
  routes: string[];
  delay?: number;
  onHover?: boolean;
}

export function usePrefetch({ routes, delay = 2000, onHover = false }: PrefetchOptions) {
  const router = useRouter();

  useEffect(() => {
    // O Next.js já prefetcha links visíveis por padrão em produção.
    // Desligamos esse prefetch manual automático para não competir com
    // as requisições críticas da rota atual.
    if (!onHover || routes.length === 0) return;

    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          routes.forEach((route) => {
            router.prefetch(route);
          });
        });
      } else {
        setTimeout(() => {
          routes.forEach((route) => {
            router.prefetch(route);
          });
        }, 0);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [routes, delay, router]);
}

/**
 * Hook para prefetch on hover
 */
export function usePrefetchOnHover(route: string) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(route);
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Example usage:
 *
 * // Prefetch manual/condicional
 * usePrefetch({
 *   routes: ['/dashboard', '/profile', '/settings'],
 *   delay: 2000,
 *   onHover: true,
 * });
 *
 * // Prefetch on hover
 * const prefetchProps = usePrefetchOnHover('/admin/users');
 * <Link href="/admin/users" {...prefetchProps}>
 *   Usuários
 * </Link>
 */
