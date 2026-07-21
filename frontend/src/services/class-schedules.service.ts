import { supabase } from '@/lib/supabase';

export interface ClassSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  classId: string;
  classSubjectId: string;
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
  };
}

type DbClassSchedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  classId: string;
  classSubjectId: string;
  class?: { id: string; name: string } | null;
  classSubject?: {
    id: string;
    subject?: { id: string; name: string; code: string | null; color: string | null } | null;
  } | null;
};

function mapSchedule(row: DbClassSchedule): ClassSchedule {
  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    room: row.room ?? undefined,
    classId: row.classId,
    classSubjectId: row.classSubjectId,
    class: row.class ?? undefined,
    classSubject: row.classSubject?.subject
      ? {
          id: row.classSubject.id,
          subject: {
            id: row.classSubject.subject.id,
            name: row.classSubject.subject.name,
            code: row.classSubject.subject.code ?? undefined,
            color: row.classSubject.subject.color ?? undefined,
          },
        }
      : undefined,
  };
}

export const classSchedulesService = {
  /**
   * Buscar grade de horários de uma turma
   */
  async getClassSchedules(classId: string): Promise<ClassSchedule[]> {
    const { data, error } = await supabase
      .from('class_schedules')
      .select(
        'id, dayOfWeek, startTime, endTime, room, classId, classSubjectId, class:classes(id, name), classSubject:class_subjects(id, subject:subjects(id, name, code, color))'
      )
      .eq('classId', classId)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbClassSchedule[]).map(mapSchedule);
  },

  /**
   * Buscar grade de horários de uma disciplina específica
   */
  async getClassSubjectSchedules(classSubjectId: string): Promise<ClassSchedule[]> {
    const { data, error } = await supabase
      .from('class_schedules')
      .select(
        'id, dayOfWeek, startTime, endTime, room, classId, classSubjectId, class:classes(id, name), classSubject:class_subjects(id, subject:subjects(id, name, code, color))'
      )
      .eq('classSubjectId', classSubjectId)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbClassSchedule[]).map(mapSchedule);
  },

  /**
   * Calcular aulas programadas em um período
   */
  calculateScheduledClasses(
    schedules: ClassSchedule[],
    startDate: Date,
    endDate: Date
  ): number {
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    let count = 0;

    // Iterar sobre cada dia no período
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = daysOfWeek[currentDate.getDay()];

      // Verificar se há aula neste dia da semana
      const hasClassThisDay = schedules.some(schedule => schedule.dayOfWeek === dayOfWeek);
      if (hasClassThisDay) {
        count++;
      }

      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  },

  /**
   * Obter horários formatados para exibição
   */
  getFormattedSchedules(schedules: ClassSchedule[]): Record<string, ClassSchedule[]> {
    const daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const grouped: Record<string, ClassSchedule[]> = {};

    daysOrder.forEach(day => {
      grouped[day] = schedules
        .filter(s => s.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return grouped;
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
   * Obter abreviação do dia da semana
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
};
