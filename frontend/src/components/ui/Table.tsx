'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({
  data,
  columns,
  onRowClick,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'Nenhum resultado encontrado',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 dark:bg-gray-800 rounded mb-2"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={clsx(
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider',
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(item);
                }
              }}
              tabIndex={onRowClick ? 0 : undefined}
              role={onRowClick ? 'button' : undefined}
              className={clsx(
                onRowClick &&
                  'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500',
                'group'
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
