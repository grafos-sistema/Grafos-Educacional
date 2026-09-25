'use client';

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

function parseMonth(value: string) {
  const [year, month] = value.split('-').map(Number);
  const today = new Date();
  return new Date(
    Number.isInteger(year) ? year : today.getFullYear(),
    Number.isInteger(month) && month >= 1 && month <= 12 ? month - 1 : today.getMonth(),
    1,
  );
}

function formatMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function MonthPicker({ value, onChange, label = 'Mês/Ano', disabled = false }: MonthPickerProps) {
  const selectedMonth = parseMonth(value);
  const monthLabel = `${MONTHS[selectedMonth.getMonth()]} de ${selectedMonth.getFullYear()}`;

  const moveMonth = (amount: number) => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + amount);
    onChange(formatMonth(nextMonth));
  };

  return (
    <div className="w-full">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="flex h-12 items-center gap-2 rounded-[5px] border border-[#e3e5e9] bg-white px-2 shadow-sm dark:border-gray-600 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          disabled={disabled}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div
          className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100"
          aria-live="polite"
        >
          <CalendarDaysIcon className="h-5 w-5 shrink-0 text-primary-600 dark:text-primary-400" />
          <span className="truncate capitalize">{monthLabel}</span>
        </div>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          disabled={disabled}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-primary-50 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
