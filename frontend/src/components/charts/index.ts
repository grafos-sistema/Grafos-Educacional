/**
 * Lazy loaded chart components
 * Melhora performance ao carregar charts apenas quando necessário
 */

import { lazyLoad } from '@/components/ui/LazyLoad';

// Lazy load dos charts pesados
export const BarChart = lazyLoad(
  () => import('./BarChart')
);

export const PieChart = lazyLoad(
  () => import('./PieChart')
);

export const LineChart = lazyLoad(
  () => import('./LineChart')
);

// Export default mantido para compatibilidade
export { default as BarChartSync } from './BarChart';
export { default as PieChartSync } from './PieChart';
export { default as LineChartSync } from './LineChart';
