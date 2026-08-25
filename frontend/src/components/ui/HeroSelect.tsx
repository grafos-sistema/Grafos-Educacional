'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

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
  helpText?: string;
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
      value,
      defaultValue,
      onChange,
      onBlur,
      name,
      ...props
    },
    ref
  ) => {
    const helperMessage = helperText || helpText;
    const displayLabel = label || placeholder;
    const generatedId = React.useId();
    const selectId = id || `select-${generatedId}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperMessage && !error ? `${selectId}-helper` : undefined;
    const describedBy = errorId || helperId;

    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [portalPosition, setPortalPosition] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);
    const [uncontrolledValue, setUncontrolledValue] = useState<string>(
      defaultValue !== undefined ? String(defaultValue) : String(options[0]?.value ?? '')
    );

    const selectedValue = value !== undefined ? String(value) : uncontrolledValue;
    const selectedOption = useMemo(
      () => options.find((option) => option.value === selectedValue),
      [options, selectedValue]
    );

    useImperativeHandle(ref, () => hiddenSelectRef.current as HTMLSelectElement);

    useEffect(() => {
      if (!isOpen) return;

      const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;

        setPortalPosition({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width,
        });
      };

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) {
          return;
        }

        setIsOpen(false);
        onBlur?.({
          target: hiddenSelectRef.current,
          currentTarget: hiddenSelectRef.current,
        } as React.FocusEvent<HTMLSelectElement>);
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      document.addEventListener('mousedown', handlePointerDown);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        document.removeEventListener('mousedown', handlePointerDown);
      };
    }, [isOpen, onBlur]);

    const emitChange = (nextValue: string) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue);
      }

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = nextValue;
      }

      onChange?.({
        target: {
          value: nextValue,
          name,
        },
        currentTarget: {
          value: nextValue,
          name,
        },
      } as React.ChangeEvent<HTMLSelectElement>);
    };

    return (
      <div className="w-full">
        {displayLabel && (
          <label
            htmlFor={selectId}
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {displayLabel}
            {required && <span className="ml-1 text-red-500" aria-label="obrigatório">*</span>}
          </label>
        )}

        <select
          {...props}
          ref={hiddenSelectRef}
          id={selectId}
          name={name}
          required={required}
          disabled={disabled}
          value={selectedValue}
          onChange={() => undefined}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-describedby={describedBy}
          onClick={() => {
            if (disabled) return;
            setIsOpen((current) => !current);
          }}
          className={`
            relative flex h-12 w-full items-center rounded-[5px] border bg-white px-4 text-left shadow-sm transition-all duration-200
            dark:bg-gray-800
            ${error
              ? 'border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-900/30'
              : 'border-[#e3e5e9] hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:focus:ring-primary-900/30'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            ${className}
          `}
        >
          {leftIcon && (
            <span className="pointer-events-none absolute left-4 flex items-center text-gray-400">
              {leftIcon}
            </span>
          )}
          <span
            className={`block flex-1 truncate ${leftIcon ? 'pl-7' : ''} pr-8 text-sm ${
              selectedOption?.value
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            {selectedOption?.label || placeholder || 'Selecione uma opção'}
          </span>
          <span className="pointer-events-none absolute right-3 text-gray-400">
            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {isOpen &&
          portalPosition &&
          createPortal(
            <div
              ref={panelRef}
              className="fixed z-[120] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-800"
              style={{
                top: portalPosition.top,
                left: portalPosition.left,
                width: portalPosition.width,
              }}
            >
              <div className="max-h-72 space-y-1 overflow-y-auto hide-scrollbar">
                {options.map((option) => {
                  const isSelected = option.value === selectedValue;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) return;
                        emitChange(option.value);
                        setIsOpen(false);
                        onBlur?.({
                          target: hiddenSelectRef.current,
                          currentTarget: hiddenSelectRef.current,
                        } as React.FocusEvent<HTMLSelectElement>);
                      }}
                      className={`
                        flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition
                        ${isSelected
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700'
                        }
                        ${option.disabled ? 'cursor-not-allowed opacity-50' : ''}
                      `}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )}

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
