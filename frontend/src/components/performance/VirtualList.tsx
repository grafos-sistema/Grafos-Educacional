/**
 * Virtual List Component
 *
 * Renderiza apenas os itens visíveis na tela + overscan,
 * melhorando drasticamente a performance para listas grandes (>1000 itens).
 *
 * Usa o algoritmo de virtual scrolling para calcular qual
 * parte da lista deve ser renderizada.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getVisibleRange } from '@/lib/utils/performance';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcula quais itens devem ser renderizados
  const { start, end } = getVisibleRange(
    scrollTop,
    itemHeight,
    containerHeight,
    items.length,
    overscan
  );

  // Altura total da lista (todos os itens)
  const totalHeight = items.length * itemHeight;

  // Offset para posicionar os itens visíveis corretamente
  const offsetY = start * itemHeight;

  // Itens visíveis
  const visibleItems = items.slice(start, end);

  // Handler de scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Lista vazia
  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Container total (altura de todos os itens) */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Container dos itens visíveis */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={start + index}
              style={{ height: itemHeight }}
              className="virtual-list-item"
            >
              {renderItem(item, start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Example usage:
 *
 * const items = Array.from({ length: 10000 }, (_, i) => ({
 *   id: i,
 *   name: `Item ${i}`,
 * }));
 *
 * <VirtualList
 *   items={items}
 *   itemHeight={60}
 *   containerHeight={600}
 *   renderItem={(item) => (
 *     <div className="p-4 border-b">
 *       {item.name}
 *     </div>
 *   )}
 * />
 */
