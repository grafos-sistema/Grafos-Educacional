import api from '@/lib/api';

export interface Schedule {
  id: string;
  classId: string;
  classSubjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: string;
    name: string;
  };
  classSubject?: {
    id: string;
    subject: {
      id: string;
      name: string;
      code?: string;
      color?: string;
    };
    teacher?: {
      id: string;
      user: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface CreateScheduleDto {
  classId: string;
  classSubjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface UpdateScheduleDto {
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  room?: string;
}

export const schedulesService = {
  /**
   * Criar horário na grade da turma
   */
  async create(dto: CreateScheduleDto): Promise<Schedule> {
    // api interceptor já retorna response.data
    const data = await api.post<Schedule>(`/classes/${dto.classId}/schedules`, dto);
    return data as Schedule;
  },

  /**
   * Buscar grade horária completa da turma
   */
  async findByClass(classId: string): Promise<Schedule[]> {
    // api interceptor já retorna response.data
    const data = await api.get<Schedule[]>(`/classes/${classId}/schedules`);
    return (data as Schedule[]) || [];
  },

  /**
   * Buscar horário específico por ID
   */
  async findOne(id: string): Promise<Schedule> {
    // api interceptor já retorna response.data
    const data = await api.get<Schedule>(`/schedules/${id}`);
    return data as Schedule;
  },

  /**
   * Atualizar horário
   */
  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    // api interceptor já retorna response.data
    const data = await api.patch<Schedule>(`/schedules/${id}`, dto);
    return data as Schedule;
  },

  /**
   * Remover horário da grade
   */
  async remove(id: string): Promise<void> {
    // api interceptor já retorna response.data
    await api.delete(`/schedules/${id}`);
  },

  /**
   * Validar se há conflito de horário
   * (Pode ser usado localmente antes de enviar ao backend)
   */
  hasTimeConflict(
    schedules: Schedule[],
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): boolean {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    return schedules.some((schedule) => {
      if (schedule.id === excludeId) return false;
      if (schedule.dayOfWeek !== dayOfWeek) return false;

      const scheduleStart = this.timeToMinutes(schedule.startTime);
      const scheduleEnd = this.timeToMinutes(schedule.endTime);

      // Verifica se há sobreposição
      return (
        (start >= scheduleStart && start < scheduleEnd) ||
        (end > scheduleStart && end <= scheduleEnd) ||
        (start <= scheduleStart && end >= scheduleEnd)
      );
    });
  },

  /**
   * Converter horário HH:mm para minutos
   */
  timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Formatar minutos para HH:mm
   */
  minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  },

  /**
   * Traduzir dia da semana
   */
  translateDayOfWeek(day: string): string {
    const translations: Record<string, string> = {
      MONDAY: 'Segunda-feira',
      TUESDAY: 'Terça-feira',
      WEDNESDAY: 'Quarta-feira',
      THURSDAY: 'Quinta-feira',
      FRIDAY: 'Sexta-feira',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo',
    };
    return translations[day] || day;
  },

  /**
   * Obter abreviação do dia
   */
  getDayAbbreviation(day: string): string {
    const abbreviations: Record<string, string> = {
      MONDAY: 'SEG',
      TUESDAY: 'TER',
      WEDNESDAY: 'QUA',
      THURSDAY: 'QUI',
      FRIDAY: 'SEX',
      SATURDAY: 'SÁB',
      SUNDAY: 'DOM',
    };
    return abbreviations[day] || day;
  },

  /**
   * Ordenar horários por dia da semana e horário
   */
  sortSchedules(schedules: Schedule[]): Schedule[] {
    const dayOrder: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    return [...schedules].sort((a, b) => {
      const dayDiff = dayOrder[a.dayOfWeek] - dayOrder[b.dayOfWeek];
      if (dayDiff !== 0) return dayDiff;

      return this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime);
    });
  },

  /**
   * Agrupar horários por dia da semana
   */
  groupByDay(schedules: Schedule[]): Record<string, Schedule[]> {
    const grouped: Record<string, Schedule[]> = {};

    schedules.forEach((schedule) => {
      if (!grouped[schedule.dayOfWeek]) {
        grouped[schedule.dayOfWeek] = [];
      }
      grouped[schedule.dayOfWeek].push(schedule);
    });

    return grouped;
  },
};
