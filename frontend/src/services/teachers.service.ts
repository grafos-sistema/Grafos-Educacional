import { supabase } from '@/lib/supabase';

export interface TeacherClass {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours?: number;
  class: {
    id: string;
    name: string;
    grade: string;
    section?: string;
    shift?: string;
    academicYear?: {
      id: string;
      year: number;
      name: string;
    };
    course?: {
      id: string;
      name: string;
    };
    _count?: {
      enrollments: number;
    };
  };
  subject: {
    id: string;
    name: string;
    code?: string;
    color?: string;
  };
}

type DbTeacherClass = {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours: number | null;
  class?: {
    id: string;
    name: string;
    grade: string;
    section: string | null;
    shift: string | null;
    academicYear?: { id: string; year: number; name: string } | null;
    course?: { id: string; name: string } | null;
  } | null;
  subject?: { id: string; name: string; code: string | null; color: string | null } | null;
};

type DbTeacherSubject = {
  subject?: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
    description: string | null;
  } | null;
};

export const teachersService = {
  /**
   * Listar turmas que o professor leciona
   */
  async getTeacherClasses(teacherId: string): Promise<TeacherClass[]> {
    const { data, error } = await supabase
      .from('class_subjects')
      .select(
        'id, classId, subjectId, teacherId, weeklyHours, class:classes(id, name, grade, section, shift, academicYear:academic_years(id, year, name), course:courses(id, name)), subject:subjects(id, name, code, color)'
      )
      .eq('teacherId', teacherId);

    if (error) throw error;

    const rows = (data ?? []) as DbTeacherClass[];
    const classIds = Array.from(new Set(rows.map((row) => row.classId)));
    const enrollmentsCountByClassId = new Map<string, number>();

    if (classIds.length > 0) {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('class_enrollments')
        .select('classId')
        .in('classId', classIds)
        .eq('isActive', true);

      if (enrollmentsError) throw enrollmentsError;

      for (const item of enrollments ?? []) {
        const classId = (item as any).classId as string;
        enrollmentsCountByClassId.set(
          classId,
          (enrollmentsCountByClassId.get(classId) ?? 0) + 1
        );
      }
    }

    return rows.map((row) => ({
      id: row.id,
      classId: row.classId,
      subjectId: row.subjectId,
      teacherId: row.teacherId,
      weeklyHours: row.weeklyHours ?? undefined,
      class: {
        id: row.class?.id ?? row.classId,
        name: row.class?.name ?? '',
        grade: row.class?.grade ?? '',
        section: row.class?.section ?? undefined,
        shift: row.class?.shift ?? undefined,
        academicYear: row.class?.academicYear ?? undefined,
        course: row.class?.course ?? undefined,
        _count: {
          enrollments: enrollmentsCountByClassId.get(row.classId) ?? 0,
        },
      },
      subject: {
        id: row.subject?.id ?? row.subjectId,
        name: row.subject?.name ?? '',
        code: row.subject?.code ?? undefined,
        color: row.subject?.color ?? undefined,
      },
    }));
  },

  /**
   * Listar disciplinas do professor
   */
  async getTeacherSubjects(teacherId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(id, name, code, color, description)')
      .eq('teacherId', teacherId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbTeacherSubject[])
      .map((row) => row.subject)
      .filter(Boolean) as any[];
  },
};
