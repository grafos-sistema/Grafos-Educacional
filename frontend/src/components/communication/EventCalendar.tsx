'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Event } from '@/types/communication.types';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = Array.from({ length: 12 }, (_, month) => month);

const typeLabels: Record<string, string> = {
  MEETING: 'Reunião',
  EXAM: 'Prova',
  HOLIDAY: 'Feriado',
  SCHOOL_BREAK: 'Recesso escolar',
  SCHOOL_EVENT: 'Evento escolar',
  PARENT_MEETING: 'Reunião de pais',
  PARENT_TEACHER_CONFERENCE: 'Reunião de pais',
  SPORTS: 'Esportivo',
  SPORTS_EVENT: 'Esportivo',
  CULTURAL: 'Cultural',
  CULTURAL_EVENT: 'Cultural',
  FIELD_TRIP: 'Passeio escolar',
  ENROLLMENT_PERIOD: 'Período de matrícula',
  REPORT_CARD: 'Entrega de boletins',
  OTHER: 'Outro',
};

const typeColors: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info'> = {
  MEETING: 'info',
  EXAM: 'error',
  HOLIDAY: 'success',
  SCHOOL_BREAK: 'success',
  SCHOOL_EVENT: 'warning',
  PARENT_MEETING: 'info',
  PARENT_TEACHER_CONFERENCE: 'info',
  SPORTS: 'success',
  SPORTS_EVENT: 'success',
  CULTURAL: 'warning',
  CULTURAL_EVENT: 'warning',
  FIELD_TRIP: 'warning',
  ENROLLMENT_PERIOD: 'info',
  REPORT_CARD: 'info',
  OTHER: 'default',
};

function getEventsForDay(events: Event[], date: Date) {
  return events.filter((event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate ?? event.startDate);
    return date >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
      date <= new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
  });
}

function formatEventTime(event: Event) {
  if (event.isAllDay) return 'Dia inteiro';

  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const startTime = format(start, 'HH:mm');
  const endTime = end ? format(end, 'HH:mm') : '';
  return endTime && endTime !== startTime ? `${startTime}–${endTime}` : startTime;
}

interface EventCalendarProps {
  year: number;
  events: Event[];
  onYearChange: (year: number) => void;
}

export function EventCalendar({ year, events, onYearChange }: EventCalendarProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(
    today.getFullYear() === year ? today : new Date(year, 0, 1)
  );

  const eventDays = useMemo(() => {
    const days = new Map<string, Event[]>();

    events.forEach((event) => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate ?? event.startDate);
      const firstDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      eachDayOfInterval({ start: firstDay, end: lastDay }).forEach((day) => {
        const key = format(day, 'yyyy-MM-dd');
        days.set(key, [...(days.get(key) ?? []), event]);
      });
    });

    return days;
  }, [events]);

  const selectedEvents = getEventsForDay(events, selectedDate);

  const changeYear = (nextYear: number) => {
    onYearChange(nextYear);
    setSelectedDate(new Date(nextYear, selectedDate.getMonth(), 1));
  };

  const selectToday = () => {
    onYearChange(today.getFullYear());
    setSelectedDate(today);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/70">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectToday}>
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Ano anterior"
            onClick={() => changeYear(year - 1)}
            className="!min-w-10 !px-2"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Próximo ano"
            onClick={() => changeYear(year + 1)}
            className="!min-w-10 !px-2"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
          <span className="ml-2 text-2xl font-semibold text-slate-900 dark:text-white">{year}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <CalendarDaysIcon className="h-5 w-5" />
          <span>{events.length} evento(s) neste ano</span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
          {MONTHS.map((month) => {
            const monthDate = new Date(year, month, 1);
            const monthStart = startOfMonth(monthDate);
            const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
            const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));

            return (
              <div key={month}>
                <h3 className="mb-3 text-base font-semibold capitalize text-slate-800 dark:text-slate-100">
                  {format(monthDate, 'MMMM', { locale: ptBR })}
                </h3>

                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {WEEKDAYS.map((weekday, index) => (
                    <span key={`${weekday}-${index}`} className="pb-1 text-[11px] font-medium text-slate-400">
                      {weekday}
                    </span>
                  ))}

                  {days.map((day) => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventDays.get(dayKey) ?? [];
                    const isCurrentMonth = isSameMonth(day, monthDate);
                    const isToday = isSameDay(day, today);
                    const isSelected = isSameDay(day, selectedDate);

                    return (
                      <button
                        key={dayKey}
                        type="button"
                        onClick={() => setSelectedDate(day)}
                        className={`relative flex h-8 items-center justify-center rounded-full text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1 ${
                          isCurrentMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'
                        } ${isSelected ? 'bg-primary-50 ring-2 ring-primary-500 dark:bg-primary-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} ${
                          isToday && !isSelected ? 'font-bold text-primary-700 dark:text-primary-300' : ''
                        }`}
                        aria-label={`${format(day, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}${dayEvents.length ? `, ${dayEvents.length} evento(s)` : ''}`}
                      >
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${isToday ? 'bg-primary-600 font-semibold text-white' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="absolute bottom-0.5 h-1.5 w-1.5 rounded-full bg-primary-500" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5 dark:border-slate-700">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Eventos do dia
              </p>
              <h3 className="mt-1 text-lg font-semibold capitalize text-slate-900 dark:text-white">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {selectedEvents.length} evento(s)
            </span>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
              Não há eventos programados neste dia.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {selectedEvents.map((event) => (
                <article key={event.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{event.title}</h4>
                    <Badge variant={typeColors[event.type] ?? 'default'} size="sm">
                      {typeLabels[event.type] ?? event.type}
                    </Badge>
                  </div>
                  {event.description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.description}</p> : null}
                  <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                    <p>{formatEventTime(event)}</p>
                    {event.location ? (
                      <p className="flex items-center gap-1.5">
                        <MapPinIcon className="h-4 w-4" />
                        {event.location}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
