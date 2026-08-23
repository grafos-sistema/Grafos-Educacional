export type ScheduleSlot = {
  startTime: string;
  endTime: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Calcula a carga semanal real a partir dos intervalos cadastrados na grade.
 * O campo legado ClassSubject.weeklyHours não participa desse cálculo.
 */
export function calculateScheduleLoad(schedules: ScheduleSlot[]) {
  const scheduledMinutes = schedules.reduce((total, schedule) => {
    const duration =
      timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime);
    return total + (duration > 0 ? duration : 0);
  }, 0);

  return {
    scheduledMinutes,
    scheduledClassCount: schedules.length,
  };
}
