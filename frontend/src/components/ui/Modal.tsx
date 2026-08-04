'use client';

import { useEffect, type ReactNode } from 'react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  [key: string]: unknown;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  contentClassName,
  overlayClassName,
  closeOnOverlayClick = true,
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={joinClasses(
        'fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/10 p-4 py-6 backdrop-blur-sm',
        overlayClassName
      )}
      onClick={() => {
        if (closeOnOverlayClick) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={joinClasses(
          'relative flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950',
          sizeClasses[size],
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {(title || description || showCloseButton) && (
          <div className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                {title ? (
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {description}
                  </p>
                ) : null}
              </div>

              {showCloseButton ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Fechar modal"
                >
                  ×
                </button>
              ) : null}
            </div>
          </div>
        )}

        <div className={joinClasses('min-h-0 overflow-y-auto px-5 py-5', contentClassName)}>
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
