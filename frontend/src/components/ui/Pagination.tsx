import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { PaginationMeta } from '@/types/common.types';

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages, hasPreviousPage, hasNextPage, total, limit } = meta;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Se tiver poucas páginas, mostra todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre mostra primeira página
      pages.push(1);

      // Calcula o range de páginas ao redor da página atual
      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);

      // Adiciona "..." se necessário
      if (startPage > 2) {
        pages.push('...');
      }

      // Adiciona as páginas do meio
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Adiciona "..." se necessário
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Sempre mostra última página
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className={clsx(
            'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
            hasPreviousPage
              ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          )}
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className={clsx(
            'relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
            hasNextPage
              ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          )}
        >
          Próxima
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando <span className="font-medium">{startItem}</span> até{' '}
            <span className="font-medium">{endItem}</span> de{' '}
            <span className="font-medium">{total}</span> resultados
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
            aria-label="Pagination"
          >
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={!hasPreviousPage}
              className={clsx(
                'relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600',
                hasPreviousPage
                  ? 'hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                  : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only">Anterior</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>

            {getPageNumbers().map((pageNumber, index) =>
              pageNumber === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(Number(pageNumber))}
                  className={clsx(
                    'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 dark:ring-gray-600',
                    pageNumber === page
                      ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                  )}
                >
                  {pageNumber}
                </button>
              )
            )}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={!hasNextPage}
              className={clsx(
                'relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600',
                hasNextPage
                  ? 'hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                  : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only">Próxima</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
