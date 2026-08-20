import { supabase } from '@/lib/supabase';
import api from '@/lib/api';

export interface ClassSchedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  effectiveRoom?: string;
  classId: string;
  classSubjectId: string;
  class?: {
    id: string;
    name: string;
    baseRoom?: string;
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

type MaybeArray<T> = T | T[] | null;

type DbClassSchedule = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  classId: string;
  classSubjectId: string;
  class?: MaybeArray<{ id: string; name: string; baseRoom: string | null }>;
  classSubject?: MaybeArray<{
    id: string;
    subject?: MaybeArray<{ id: string; name: string; code: string | null; color: string | null }>;
    teacher?: MaybeArray<{
      id: string;
      user?: MaybeArray<{ firstName: string; lastName: string }>;
    }>;
  }>;
};

function firstRelation<T>(value?: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapSchedule(row: DbClassSchedule): ClassSchedule {
  const classItem = firstRelation(row.class);
  const classSubject = firstRelation(row.classSubject);
  const subject = firstRelation(classSubject?.subject);
  const teacher = firstRelation(classSubject?.teacher);
  const teacherUser = firstRelation(teacher?.user);

  return {
    id: row.id,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    room: row.room ?? undefined,
    effectiveRoom: row.room ?? classItem?.baseRoom ?? classItem?.name ?? undefined,
    classId: row.classId,
    classSubjectId: row.classSubjectId,
    class: classItem
      ? {
          ...classItem,
          baseRoom: classItem.baseRoom ?? undefined,
        }
      : undefined,
    classSubject: subject && classSubject
      ? {
          id: classSubject.id,
          subject: {
            id: subject.id,
            name: subject.name,
            code: subject.code ?? undefined,
            color: subject.color ?? undefined,
          },
          teacher: teacher && teacherUser
            ? {
                id: teacher.id,
                user: teacherUser,
              }
            : undefined,
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
        'id, dayOfWeek, startTime, endTime, room, classId, classSubjectId, class:classes(id, name, baseRoom), classSubject:class_subjects(id, subject:subjects(id, name, code, color), teacher:teachers(id, user:users(firstName, lastName)))'
      )
      .eq('classId', classId)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbClassSchedule[]).map(mapSchedule);
  },

  /**
   * Busca a grade pela API autenticada. É o caminho usado pelo portal do
   * aluno, pois a consulta direta ao Supabase depende de políticas RLS de
   * relações aninhadas e pode ocultar horários válidos.
   */
  async getClassSchedulesFromApi(classId: string): Promise<ClassSchedule[]> {
    // A API registra essa rota como /classes/:classId/schedules. O prefixo
    // /schedules é reservado para buscar, editar ou remover um horário por ID.
    const response = await api.get<DbClassSchedule[]>(`/classes/${classId}/schedules`);
    return ((response as unknown as DbClassSchedule[]) ?? []).map(mapSchedule);
  },

  /**
   * Buscar grade de horários de uma disciplina específica
   */
  async getClassSubjectSchedules(classSubjectId: string): Promise<ClassSchedule[]> {
    const { data, error } = await supabase
      .from('class_schedules')
      .select(
        'id, dayOfWeek, startTime, endTime, room, classId, classSubjectId, class:classes(id, name, baseRoom), classSubject:class_subjects(id, subject:subjects(id, name, code, color), teacher:teachers(id, user:users(firstName, lastName)))'
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
