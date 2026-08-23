export type ScheduleSlot = {
  startTime: string;
  endTime: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function calculateScheduleMinutes(
  schedules?: ScheduleSlot[] | null,
): number {
  return (schedules ?? []).reduce((total, schedule) => {
    const duration = timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime);
    return total + (duration > 0 ? duration : 0);
  }, 0);
}

export function formatScheduleLoad(
  scheduledMinutes?: number | null,
  scheduledClassCount?: number | null,
): string {
  const count = scheduledClassCount ?? 0;
  if (count === 0) return 'Sem horário definido';

  const minutes = scheduledMinutes ?? 0;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const duration = [
    hours > 0 ? `${hours}h` : '',
    remainingMinutes > 0 ? `${remainingMinutes}min` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return duration ? `${duration} · ${count} horário(s)` : `${count} horário(s)`;
}
