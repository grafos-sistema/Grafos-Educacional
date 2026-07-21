import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  helpText?: string; // Alias para compatibilidade
  placeholder?: string;
  leftIcon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      helpText,
      placeholder,
      leftIcon,
      className = '',
      id,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const helperMessage = helperText || helpText;

    // Use placeholder as label if no label is provided
    const displayLabel = label || placeholder;

    // Generate unique IDs for accessibility
    const selectId = id || `select-${React.useId()}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperMessage && !error ? `${selectId}-helper` : undefined;
    const describedBy = errorId || helperId;

    return (
      <div className="w-full">
        {/* Label separado e acima */}
        {displayLabel && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {displayLabel}
            {required && <span className="text-red-500 ml-1" aria-label="obrigatório">*</span>}
          </label>
        )}

        {/* Select */}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}

          <select
            ref={ref}
            id={selectId}
            required={required}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required ? 'true' : undefined}
            className={`
              block w-full h-12 rounded-lg
              px-4 pr-10 ${leftIcon ? 'pl-11' : ''}
              text-sm text-gray-900 dark:text-white
              bg-white dark:bg-gray-800
              border-2
              ${error
                ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-900/30'
              }
              shadow-sm
              transition-all duration-200
              focus:outline-none
              appearance-none
              cursor-pointer
              ${disabled ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-60' : ''}
              ${className}
            `}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Ícone de seta customizado */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

Select.displayName = 'Select';
