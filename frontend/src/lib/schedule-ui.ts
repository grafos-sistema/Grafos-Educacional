'use client';

export const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Segunda-feira', shortLabel: 'Segunda', abbr: 'SEG' },
  { value: 'TUESDAY', label: 'Terça-feira', shortLabel: 'Terça', abbr: 'TER' },
  { value: 'WEDNESDAY', label: 'Quarta-feira', shortLabel: 'Quarta', abbr: 'QUA' },
  { value: 'THURSDAY', label: 'Quinta-feira', shortLabel: 'Quinta', abbr: 'QUI' },
  { value: 'FRIDAY', label: 'Sexta-feira', shortLabel: 'Sexta', abbr: 'SEX' },
  { value: 'SATURDAY', label: 'Sábado', shortLabel: 'Sábado', abbr: 'SÁB' },
  { value: 'SUNDAY', label: 'Domingo', shortLabel: 'Domingo', abbr: 'DOM' },
] as const;

export const DAY_LABELS: Record<string, string> = Object.fromEntries(
  DAYS_OF_WEEK.map((day) => [day.value, day.shortLabel])
);

export function sortByTime<T extends { startTime: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.startTime.localeCompare(b.startTime));
}

export function getUniqueTimeSlots<T extends { startTime: string }>(items: T[]): string[] {
  return Array.from(new Set(items.map((item) => item.startTime))).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function getDurationInHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return endHour - startHour + (endMinute - startMinute) / 60;
}

export function formatHours(value: number) {
  return `${value.toFixed(1).replace('.', ',')}h`;
}

export function formatMonthYear(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
}

export function getRelativeWeekDayPosition(dayOfWeek: string) {
  return DAYS_OF_WEEK.findIndex((day) => day.value === dayOfWeek);
}

export function getNextScheduleItem<
  T extends { dayOfWeek: string; startTime: string; endTime: string }
>(items: T[], referenceDate = new Date()) {
  if (items.length === 0) return null;

  const currentDay = referenceDate.getDay();
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const normalizedCurrentDay = currentDay === 0 ? 6 : currentDay - 1;

  const upcoming = items
    .map((item) => {
      const dayIndex = getRelativeWeekDayPosition(item.dayOfWeek);
      const [hour, minute] = item.startTime.split(':').map(Number);
      const startMinutes = hour * 60 + minute;
      const dayDistance =
        dayIndex < normalizedCurrentDay
          ? dayIndex + 7 - normalizedCurrentDay
          : dayIndex - normalizedCurrentDay;
      const minutesUntil =
        dayDistance === 0 ? startMinutes - currentMinutes : dayDistance * 24 * 60 + startMinutes - currentMinutes;

      return { item, minutesUntil };
    })
    .filter((entry) => entry.minutesUntil >= 0)
    .sort((a, b) => a.minutesUntil - b.minutesUntil);

  return upcoming[0]?.item ?? null;
}

export function getCurrentScheduleItem<
  T extends { dayOfWeek: string; startTime: string; endTime: string }
>(items: T[], referenceDate = new Date()) {
  const currentDay = referenceDate.getDay();
  const normalizedCurrentDay = currentDay === 0 ? 'SUNDAY' : DAYS_OF_WEEK[currentDay - 1]?.value;
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();

  return (
    items.find((item) => {
      if (item.dayOfWeek !== normalizedCurrentDay) return false;
      const [startHour, startMinute] = item.startTime.split(':').map(Number);
      const [endHour, endMinute] = item.endTime.split(':').map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      return currentMinutes >= start && currentMinutes <= end;
    }) ?? null
  );
}

export function findScheduleConflicts<
  T extends { id: string; dayOfWeek: string; startTime: string; endTime: string }
>(items: T[]) {
  const conflicts = new Set<string>();

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const current = items[i];
      const next = items[j];

      if (current.dayOfWeek !== next.dayOfWeek) continue;

      const currentStart = current.startTime;
      const currentEnd = current.endTime;
      const nextStart = next.startTime;
      const nextEnd = next.endTime;

      const overlaps = currentStart < nextEnd && nextStart < currentEnd;
      if (overlaps) {
        conflicts.add(current.id);
        conflicts.add(next.id);
      }
    }
  }

  return conflicts;
}
