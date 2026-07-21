import React, { forwardRef } from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
  helpText?: string; // Alias para compatibilidade
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      leftIcon,
      rightIcon,
      error,
      helperText,
      helpText,
      className = '',
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const helperMessage = helperText || helpText;

    // Generate unique IDs for accessibility
    const inputId = id || `input-${React.useId()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperMessage && !error ? `${inputId}-helper` : undefined;
    const describedBy = errorId || helperId;

    return (
      <div className="w-full">
        {/* Label separado e acima */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="obrigatório">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            required={required}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required ? 'true' : undefined}
            className={`
              block w-full h-12 rounded-lg
              px-4 ${leftIcon ? 'pl-11' : ''} ${rightIcon ? 'pr-11' : ''}
              text-sm text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-500
              bg-white dark:bg-gray-800
              border-2
              ${error
                ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30'
              }
              shadow-sm
              transition-all duration-200
              focus:outline-none
              ${disabled ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60' : ''}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Mensagens de ajuda/erro */}
        {error && (
          <p id={errorId} className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperMessage && !error && (
          <p id={helperId} className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {helperMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
