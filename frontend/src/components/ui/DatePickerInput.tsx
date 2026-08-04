'use client';

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface DatePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  error?: string;
  describedBy?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

type PickerType = 'date' | 'datetime-local';

const WEEKDAY_LABELS = ['do', 'se', 'te', 'qu', 'qu', 'se', 'sa'];
const DEFAULT_PLACEHOLDER = 'dd/mm/aaaa';
const DEFAULT_DATE_TIME_PLACEHOLDER = 'dd/mm/aaaa as hh:mm';
const MONTH_LABELS = [
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
const TIME_SLOT_INTERVAL_MINUTES = 30;

const getPickerType = (type?: string): PickerType =>
  type === 'datetime-local' ? 'datetime-local' : 'date';

const getDatePart = (value?: string | null) => {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
};

const parseIsoDate = (value?: string | null) => {
  const datePart = getDatePart(value);
  if (!datePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const parseDateTimeValue = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTimeLocalValue = (date: Date) => {
  const isoDate = formatIsoDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${isoDate}T${hours}:${minutes}`;
};

const formatDisplayDate = (value?: string | null, pickerType: PickerType = 'date') => {
  const date =
    pickerType === 'datetime-local' ? parseDateTimeValue(value) : parseIsoDate(value);
  if (!date) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(pickerType === 'datetime-local'
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  });
};

const parseDisplayDateInput = (rawValue: string, pickerType: PickerType) => {
  const sanitizedValue = rawValue.trim();
  if (!sanitizedValue) {
    return null;
  }

  if (pickerType === 'datetime-local') {
    const normalizedValue = sanitizedValue
      .replace(/\s+as\s+/i, ' ')
      .replace(/\s+/g, ' ');
    const match = normalizedValue.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2}))?$/
    );

    if (!match) {
      return null;
    }

    const [, day, month, year, hours = '00', minutes = '00'] = match;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hours),
      Number(minutes),
      0,
      0
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    if (
      parsedDate.getFullYear() !== Number(year) ||
      parsedDate.getMonth() !== Number(month) - 1 ||
      parsedDate.getDate() !== Number(day) ||
      parsedDate.getHours() !== Number(hours) ||
      parsedDate.getMinutes() !== Number(minutes)
    ) {
      return null;
    }

    return parsedDate;
  }

  const match = sanitizedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getFullYear() !== Number(year) ||
    parsedDate.getMonth() !== Number(month) - 1 ||
    parsedDate.getDate() !== Number(day)
  ) {
    return null;
  }

  return parsedDate;
};

const isSameDay = (first: Date | null, second: Date | null) => {
  if (!first || !second) return false;
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const getRoundedNow = () => {
  const now = new Date();
  now.setSeconds(0, 0);

  const roundedMinutes =
    Math.ceil(now.getMinutes() / TIME_SLOT_INTERVAL_MINUTES) * TIME_SLOT_INTERVAL_MINUTES;

  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    now.setMinutes(roundedMinutes, 0, 0);
  }

  return now;
};

const buildDateWithTime = (date: Date, minutesSinceMidnight: number) => {
  const hours = Math.floor(minutesSinceMidnight / 60);
  const minutes = minutesSinceMidnight % 60;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
};

const getMinutesSinceMidnight = (date: Date) => date.getHours() * 60 + date.getMinutes();

const formatTimeLabel = (minutesSinceMidnight: number) => {
  const hours = Math.floor(minutesSinceMidnight / 60);
  const minutes = minutesSinceMidnight % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const DatePickerInput = forwardRef<HTMLInputElement, DatePickerInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onBlur,
      name,
      required,
      disabled,
      id,
      min,
      max,
      className = '',
      placeholder,
      describedBy,
      error,
      leftIcon,
      rightIcon,
      type,
      ...props
    },
    ref
  ) => {
    const pickerType = getPickerType(type);
    const isDateTimePicker = pickerType === 'datetime-local';
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '');
    const [isOpen, setIsOpen] = useState(false);
    const [openSelector, setOpenSelector] = useState<'month' | 'year' | null>(null);
    const [portalPosition, setPortalPosition] = useState<{
      top: number;
      left: number;
      width: number;
    } | null>(null);

    const triggerRef = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const textInputRef = useRef<HTMLInputElement | null>(null);
    const monthListRef = useRef<HTMLDivElement | null>(null);
    const yearListRef = useRef<HTMLDivElement | null>(null);
    const selectedMonthRef = useRef<HTMLButtonElement | null>(null);
    const selectedYearRef = useRef<HTMLButtonElement | null>(null);
    const selectedTimeRef = useRef<HTMLButtonElement | null>(null);

    const selectedValue = value !== undefined ? value : uncontrolledValue;
    const selectedDate = isDateTimePicker
      ? parseDateTimeValue(selectedValue)
      : parseIsoDate(selectedValue);
    const minDate = parseIsoDate(min);
    const maxDate = parseIsoDate(max);
    const minDateTime = parseDateTimeValue(min);
    const maxDateTime = parseDateTimeValue(max);
    const today = useMemo(() => new Date(), []);
    const [visibleMonth, setVisibleMonth] = useState<Date>(selectedDate ?? today);
    const [draftDate, setDraftDate] = useState<Date | null>(selectedDate ?? null);
    const [draftTimeMinutes, setDraftTimeMinutes] = useState<number>(
      selectedDate ? getMinutesSinceMidnight(selectedDate) : getMinutesSinceMidnight(getRoundedNow())
    );
    const [inputText, setInputText] = useState<string>(() =>
      formatDisplayDate(selectedValue, pickerType)
    );

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useEffect(() => {
      setInputText(formatDisplayDate(selectedValue, pickerType));
    }, [pickerType, selectedValue]);

    useEffect(() => {
      if (openSelector === 'month') {
        selectedMonthRef.current?.scrollIntoView({
          block: 'nearest',
        });
      }

      if (openSelector === 'year') {
        selectedYearRef.current?.scrollIntoView({
          block: 'center',
        });
      }
    }, [openSelector]);

    useEffect(() => {
      if (isOpen && isDateTimePicker) {
        selectedTimeRef.current?.scrollIntoView({
          block: 'nearest',
        });
      }
    }, [draftTimeMinutes, isDateTimePicker, isOpen]);

    useEffect(() => {
      if (!isOpen) return;

      const updatePosition = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const preferredWidth = isDateTimePicker ? 560 : 340;
        const left = Math.min(
          window.innerWidth - preferredWidth - 16,
          Math.max(16, rect.left)
        );

        setPortalPosition({
          top: rect.bottom + 8,
          left,
          width: preferredWidth,
        });
      };

      const handlePointerDown = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          triggerRef.current?.contains(target) ||
          panelRef.current?.contains(target)
        ) {
          return;
        }
        setIsOpen(false);
        setOpenSelector(null);
        onBlur?.({
          target: inputRef.current,
          currentTarget: inputRef.current,
        } as React.FocusEvent<HTMLInputElement>);
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
    }, [isDateTimePicker, isOpen, onBlur]);

    const emitChange = (nextValue: string) => {
      if (value === undefined) {
        setUncontrolledValue(nextValue);
      }

      if (inputRef.current) {
        inputRef.current.value = nextValue;
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
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const isDateDisabled = (date: Date) => {
      const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (minDate) {
        const minNormalized = new Date(
          minDate.getFullYear(),
          minDate.getMonth(),
          minDate.getDate()
        );
        if (normalized < minNormalized) return true;
      }

      if (maxDate) {
        const maxNormalized = new Date(
          maxDate.getFullYear(),
          maxDate.getMonth(),
          maxDate.getDate()
        );
        if (normalized > maxNormalized) return true;
      }

      return false;
    };

    const isDateTimeDisabled = (date: Date) => {
      if (minDateTime && date < minDateTime) {
        return true;
      }

      if (maxDateTime && date > maxDateTime) {
        return true;
      }

      return false;
    };

    const selectDate = (date: Date) => {
      if (isDateDisabled(date)) return;

      if (isDateTimePicker) {
        setDraftDate(date);
        setVisibleMonth(date);
        return;
      }

      const nextValue = formatIsoDate(date);
      emitChange(nextValue);
      setVisibleMonth(date);
      setIsOpen(false);
      setOpenSelector(null);
      onBlur?.({
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.FocusEvent<HTMLInputElement>);
    };

    const applyDateTime = () => {
      const baseDate = draftDate ?? selectedDate ?? getRoundedNow();
      const nextDateTime = buildDateWithTime(baseDate, draftTimeMinutes);

      if (isDateTimeDisabled(nextDateTime)) {
        return;
      }

      emitChange(formatDateTimeLocalValue(nextDateTime));
      setIsOpen(false);
      setOpenSelector(null);
      onBlur?.({
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.FocusEvent<HTMLInputElement>);
    };

    const closePicker = () => {
      setIsOpen(false);
      setOpenSelector(null);
      onBlur?.({
        target: inputRef.current,
        currentTarget: inputRef.current,
      } as React.FocusEvent<HTMLInputElement>);
    };

    const commitTypedValue = () => {
      const parsedDate = parseDisplayDateInput(inputText, pickerType);

      if (!inputText.trim()) {
        emitChange('');
        setDraftDate(null);
        setVisibleMonth(today);
        return;
      }

      if (!parsedDate) {
        setInputText(formatDisplayDate(selectedValue, pickerType));
        return;
      }

      if (pickerType === 'datetime-local') {
        if (isDateTimeDisabled(parsedDate)) {
          setInputText(formatDisplayDate(selectedValue, pickerType));
          return;
        }

        setDraftDate(parsedDate);
        setDraftTimeMinutes(getMinutesSinceMidnight(parsedDate));
        setVisibleMonth(parsedDate);
        emitChange(formatDateTimeLocalValue(parsedDate));
        return;
      }

      if (isDateDisabled(parsedDate)) {
        setInputText(formatDisplayDate(selectedValue, pickerType));
        return;
      }

      setDraftDate(parsedDate);
      setVisibleMonth(parsedDate);
      emitChange(formatIsoDate(parsedDate));
    };

    const monthOptions = MONTH_LABELS.map((label, index) => ({
      label,
      value: index,
    }));

    const selectedYear = selectedDate?.getFullYear() ?? today.getFullYear();
    const minYear = minDate?.getFullYear() ?? selectedYear - 100;
    const maxYear = maxDate?.getFullYear() ?? selectedYear + 30;
    const startYear = Math.min(minYear, selectedYear - 20);
    const endYear = Math.max(maxYear, selectedYear + 20);
    const yearOptions = Array.from(
      { length: endYear - startYear + 1 },
      (_, index) => startYear + index
    );

    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(monthStart.getDate() - monthStart.getDay());

    const days = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(calendarStart);
      date.setDate(calendarStart.getDate() + index);
      return date;
    });

    const fieldIcon = leftIcon ?? <CalendarDaysIcon className="h-5 w-5" />;
    const trailingIcon = rightIcon ?? <CalendarDaysIcon className="h-5 w-5" />;
    const calendarSelectedDate = isDateTimePicker ? draftDate : selectedDate;
    const timeOptions = useMemo(
      () =>
        Array.from(
          { length: (24 * 60) / TIME_SLOT_INTERVAL_MINUTES },
          (_, index) => index * TIME_SLOT_INTERVAL_MINUTES
        ),
      []
    );
    const draftDateTime =
      isDateTimePicker && draftDate
        ? buildDateWithTime(draftDate, draftTimeMinutes)
        : null;
    const footerDateLabel =
      draftDateTime?.toLocaleDateString('pt-BR') ??
      today.toLocaleDateString('pt-BR');

    const selectorButtonClassName =
      'inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-white';
    const monthSelectorButtonClassName = `${selectorButtonClassName} min-w-[124px] justify-between`;
    const yearSelectorButtonClassName = `${selectorButtonClassName} min-w-[88px] justify-between`;

    const selectorPanelClassName =
      'absolute top-12 z-20 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2 shadow-xl ring-1 ring-black/5 hide-scrollbar';

    return (
      <>
        <input
          {...props}
          ref={inputRef}
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          value={selectedValue}
          onChange={() => undefined}
          type="text"
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div
          ref={triggerRef}
          className={`
            relative flex h-12 w-full items-center rounded-lg border-2 bg-white px-4 text-left shadow-sm transition-all duration-200
            dark:bg-gray-800
            ${error
              ? 'border-red-500 focus:ring-4 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-900/30'
              : 'border-gray-300 hover:border-primary-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:border-gray-600 dark:focus:ring-primary-900/30'
            }
            ${disabled ? 'cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
        >
          <span className="pointer-events-none absolute left-4 flex items-center text-gray-400">
            {fieldIcon}
          </span>
          <input
            ref={textInputRef}
            type="text"
            value={inputText}
            disabled={disabled}
            placeholder={placeholder || (isDateTimePicker ? DEFAULT_DATE_TIME_PLACEHOLDER : DEFAULT_PLACEHOLDER)}
            aria-describedby={describedBy}
            onChange={(event) => setInputText(event.target.value)}
            onBlur={() => {
              commitTypedValue();
              onBlur?.({
                target: inputRef.current,
                currentTarget: inputRef.current,
              } as React.FocusEvent<HTMLInputElement>);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commitTypedValue();
              }
            }}
            className={`
              h-full w-full bg-transparent pl-7 pr-10 text-sm outline-none
              ${inputText ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
          />
          <button
            type="button"
            disabled={disabled}
            aria-label="Abrir seletor de data"
            onClick={() => {
              if (disabled) return;
              if (isOpen) {
                closePicker();
                return;
              }

              const baseDate = selectedDate ?? getRoundedNow();
              setVisibleMonth(baseDate);
              setDraftDate(baseDate);
              setDraftTimeMinutes(getMinutesSinceMidnight(baseDate));
              setOpenSelector(null);
              setIsOpen(true);
            }}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-primary-400"
          >
            {trailingIcon}
          </button>
        </div>

        {isOpen &&
          portalPosition &&
          createPortal(
            <div
              ref={panelRef}
              className="fixed z-[120] rounded-2xl border border-gray-200 bg-white p-4 text-gray-900 shadow-2xl ring-1 ring-black/5"
              style={{
                top: portalPosition.top,
                left: portalPosition.left,
                width: isDateTimePicker ? 560 : 340,
              }}
            >
              <div className={isDateTimePicker ? 'grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]' : ''}>
                <div className="min-w-0">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
                        )
                      }
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <div className="relative flex items-center gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSelector((current) => (current === 'month' ? null : 'month'))
                          }
                          className={monthSelectorButtonClassName}
                        >
                          <span>{monthOptions[visibleMonth.getMonth()]?.label}</span>
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </button>

                        {openSelector === 'month' && (
                          <div
                            ref={monthListRef}
                            className={`${selectorPanelClassName} left-0 w-full min-w-[124px]`}
                          >
                            <div className="space-y-1">
                              {monthOptions.map((month) => {
                                const isActive = month.value === visibleMonth.getMonth();
                                return (
                                  <button
                                    key={month.value}
                                    type="button"
                                    ref={isActive ? selectedMonthRef : null}
                                    onClick={() => {
                                      setVisibleMonth(
                                        new Date(visibleMonth.getFullYear(), month.value, 1)
                                      );
                                      setOpenSelector(null);
                                    }}
                                    className={`
                                      flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-sm transition
                                      ${isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                      }
                                    `}
                                  >
                                    <span className="w-full text-center">{month.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSelector((current) => (current === 'year' ? null : 'year'))
                          }
                          className={yearSelectorButtonClassName}
                        >
                          <span>{visibleMonth.getFullYear()}</span>
                          <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                        </button>

                        {openSelector === 'year' && (
                          <div
                            ref={yearListRef}
                            className={`${selectorPanelClassName} left-0 w-full min-w-[88px]`}
                          >
                            <div className="space-y-1">
                              {yearOptions.map((year) => {
                                const isActive = year === visibleMonth.getFullYear();
                                return (
                                  <button
                                    key={year}
                                    type="button"
                                    ref={isActive ? selectedYearRef : null}
                                    onClick={() => {
                                      setVisibleMonth(
                                        new Date(year, visibleMonth.getMonth(), 1)
                                      );
                                      setOpenSelector(null);
                                    }}
                                    className={`
                                      flex w-full items-center justify-center rounded-xl px-3 py-2 text-center text-sm transition
                                      ${isActive
                                        ? 'bg-slate-900 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                      }
                                    `}
                                  >
                                    <span className="w-full text-center">{year}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
                        )
                      }
                      className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 pb-3 text-center text-xs font-medium lowercase tracking-[0.12em] text-gray-500">
                    {WEEKDAY_LABELS.map((label, index) => (
                      <div key={`${label}-${index}`}>{label}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    {days.map((date) => {
                      const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                      const isSelected = isSameDay(date, calendarSelectedDate);
                      const isToday = isSameDay(date, today);
                      const isDisabled = isDateDisabled(date);

                      return (
                        <button
                          key={date.toISOString()}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => selectDate(date)}
                          className={`
                            flex h-11 w-full items-center justify-center border-r border-b border-gray-200 text-sm font-medium transition
                            [&:nth-child(7n)]:border-r-0
                            [&:nth-last-child(-n+7)]:border-b-0
                            ${isSelected
                              ? 'bg-gray-50 text-gray-900'
                              : isToday
                                ? 'bg-primary-50 text-primary-600'
                                : isCurrentMonth
                                  ? 'text-gray-900 hover:bg-gray-50'
                                  : 'text-gray-300 hover:bg-gray-50'
                            }
                            ${isDisabled ? 'cursor-not-allowed opacity-30' : ''}
                          `}
                        >
                          <span
                            className={`
                              flex h-8 w-8 items-center justify-center rounded-full
                              ${isSelected
                                ? 'bg-primary-600 text-white shadow-sm'
                                : isToday
                                  ? 'font-semibold text-primary-600'
                                  : ''
                              }
                            `}
                          >
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isDateTimePicker && (
                  <div className="min-w-0 border-t border-gray-200 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-700">Horários disponíveis</h4>
                      <span className="text-xs text-gray-400">30 min</span>
                    </div>
                    <div className="max-h-[292px] space-y-2 overflow-y-auto pr-1 hide-scrollbar">
                      {timeOptions.map((timeOption) => {
                        const baseDate = draftDate ?? selectedDate ?? getRoundedNow();
                        const candidateDateTime = buildDateWithTime(baseDate, timeOption);
                        const isSelectedTime = timeOption === draftTimeMinutes;
                        const isDisabledTime = isDateTimeDisabled(candidateDateTime);

                        return (
                          <button
                            key={timeOption}
                            type="button"
                            ref={isSelectedTime ? selectedTimeRef : null}
                            disabled={isDisabledTime}
                            onClick={() => setDraftTimeMinutes(timeOption)}
                            className={`
                              flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold transition
                              ${isSelectedTime
                                ? 'border-primary-500 bg-primary-600 text-white shadow-sm'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                              }
                              ${isDisabledTime ? 'cursor-not-allowed opacity-40' : ''}
                            `}
                          >
                            {formatTimeLabel(timeOption)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {isDateTimePicker && (
                <div className="mt-4 flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-700">
                      {footerDateLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const now = getRoundedNow();
                        setDraftDate(now);
                        setDraftTimeMinutes(getMinutesSinceMidnight(now));
                        setVisibleMonth(now);
                      }}
                      className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    >
                      Hoje
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={closePicker}
                      className="inline-flex h-11 items-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={applyDateTime}
                      disabled={!draftDate || (draftDateTime ? isDateTimeDisabled(draftDateTime) : true)}
                      className="inline-flex h-11 items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>,
            document.body
          )}
      </>
    );
  }
);

DatePickerInput.displayName = 'DatePickerInput';
