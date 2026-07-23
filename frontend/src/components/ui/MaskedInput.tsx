'use client';

import React, { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  mask: any;
  maskChar?: string | null;
  alwaysShowMask?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAccept?: (value: string, maskRef: any) => void;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    {
      label,
      error,
      helpText,
      leftIcon,
      rightIcon,
      mask,
      maskChar = '_',
      alwaysShowMask = false,
      onChange,
      onAccept,
      className = '',
      name,
      placeholder,
      disabled,
      value,
      defaultValue,
      ...props
    },
    ref
  ) => {
    const baseInputClasses = `
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
      disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:opacity-60
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <span className="text-gray-400 dark:text-gray-500 sm:text-sm">
                {leftIcon}
              </span>
            </div>
          )}

          <IMaskInput
            mask={mask as any}
            lazy={!alwaysShowMask}
            placeholderChar={maskChar || '_'}
            unmask={false}
            onAccept={(value, maskRef) => {
              if (onAccept) {
                onAccept(value, maskRef);
              }
              if (onChange) {
                const event = {
                  target: {
                    value: value,
                    name: name,
                  },
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(event);
              }
            }}
            inputRef={ref}
            name={name}
            placeholder={placeholder}
            disabled={disabled}
            value={value as string | undefined}
            defaultValue={defaultValue as string | undefined}
            className={`${baseInputClasses} ${className}`}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className="text-gray-400 dark:text-gray-500 sm:text-sm">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

// Predefined masks (formato IMask)
export const masks = {
  cpf: '000.000.000-00',
  phone: [
    { mask: '(00) 0000-0000' },
    { mask: '(00) 0 0000-0000' },
  ],
  cep: '00000-000',
  date: '00/00/0000',
};

// Utility function to remove mask characters
export const removeMask = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

// Utility function to format CPF
export const formatCPF = (value: string): string => {
  const numbers = removeMask(value);
  if (numbers.length <= 11) {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return value;
};

// Utility function to format phone
export const formatPhone = (value: string): string => {
  const numbers = removeMask(value);
  if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d)(\d{4})(\d{4})/, '($1) $2 $3-$4');
  }
  return value;
};

// Utility function to format CEP
export const formatCEP = (value: string): string => {
  const numbers = removeMask(value);
  if (numbers.length <= 8) {
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return value;
};

// Utility function to validate CPF
export const validateCPF = (value: string): boolean => {
  const cpf = removeMask(value);

  // CPF must have 11 digits
  if (cpf.length !== 11) {
    return false;
  }

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cpf.charAt(9))) {
    return false;
  }

  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cpf.charAt(10))) {
    return false;
  }

  return true;
};
