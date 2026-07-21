'use client';

import React, { forwardRef } from 'react';
import { IMaskInput } from 'react-imask';

export interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  helpText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  mask: string;
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
      block w-full px-3 py-2
      border rounded-md shadow-sm
      focus:outline-none focus:ring-2 focus:ring-offset-0
      disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-800
      ${error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600 dark:text-red-400'
        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
      }
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
    `.trim().replace(/\s+/g, ' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
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
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-400 dark:text-gray-500 sm:text-sm">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
  phone: '(00) 00000-0000',
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
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
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
