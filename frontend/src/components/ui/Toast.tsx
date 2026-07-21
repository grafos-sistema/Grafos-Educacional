import { useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ type, title, message, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon,
  };

  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-400',
      icon: 'text-green-600 dark:text-green-400',
      title: 'text-green-900 dark:text-green-100',
      message: 'text-green-700 dark:text-green-300',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-400',
      icon: 'text-red-600 dark:text-red-400',
      title: 'text-red-900 dark:text-red-100',
      message: 'text-red-700 dark:text-red-300',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-400',
      icon: 'text-yellow-600 dark:text-yellow-400',
      title: 'text-yellow-900 dark:text-yellow-100',
      message: 'text-yellow-700 dark:text-yellow-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
      title: 'text-blue-900 dark:text-blue-100',
      message: 'text-blue-700 dark:text-blue-300',
    },
  };

  const Icon = icons[type] || InformationCircleIcon;
  const style = styles[type] || styles.info;

  return (
    <div
      className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-lg p-4 mb-3 animate-slide-up`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className={`h-6 w-6 ${style.icon}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${style.title}`}>{title}</p>
          {message && <p className={`mt-1 text-sm ${style.message}`}>{message}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
          aria-label="Fechar notificação"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// Container for toasts
export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 w-full max-w-sm pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
