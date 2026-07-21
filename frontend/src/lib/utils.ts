import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR');
}

/**
 * Format date and time to Brazilian format (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR');
}

/**
 * Format grade score with max score (e.g., "8.5/10")
 */
export function formatScore(score: number, maxScore: number): string {
  return `${score.toFixed(1)}/${maxScore.toFixed(1)}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep/delay utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
