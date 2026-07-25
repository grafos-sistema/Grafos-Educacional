import { supabase } from '@/lib/supabase';

export interface TeacherClass {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours?: number;
  assignmentType?: 'subject' | 'main_teacher';
  assignmentLabel?: string;
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
  subject?: {
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

type DbMainTeacherClass = {
  id: string;
  name: string;
  grade: string;
  section: string | null;
  shift: string | null;
  academicYear?: { id: string; year: number; name: string } | null;
  course?: { id: string; name: string } | null;
};

export const teachersService = {
  /**
   * Listar turmas que o professor leciona
   */
  async getTeacherClasses(teacherId: string): Promise<TeacherClass[]> {
    const [
      { data: classSubjectData, error: classSubjectError },
      { data: mainTeacherData, error: mainTeacherError },
    ] = await Promise.all([
      supabase
        .from('class_subjects')
        .select(
          'id, classId, subjectId, teacherId, weeklyHours, class:classes(id, name, grade, section, shift, academicYear:academic_years(id, year, name), course:courses(id, name)), subject:subjects(id, name, code, color)'
        )
        .eq('teacherId', teacherId),
      supabase
        .from('classes')
        .select(
          'id, name, grade, section, shift, academicYear:academic_years(id, year, name), course:courses(id, name)'
        )
        .eq('mainTeacherId', teacherId)
        .eq('isActive', true),
    ]);

    if (classSubjectError) throw classSubjectError;
    if (mainTeacherError) throw mainTeacherError;

    const rows = (classSubjectData ?? []) as DbTeacherClass[];
    const mainTeacherRows = (mainTeacherData ?? []) as DbMainTeacherClass[];
    const classIds = Array.from(
      new Set([
        ...rows.map((row) => row.classId),
        ...mainTeacherRows.map((row) => row.id),
      ])
    );
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

    const classSubjectAssignments = rows.map((row) => ({
      id: row.id,
      classId: row.classId,
      subjectId: row.subjectId,
      teacherId: row.teacherId,
      weeklyHours: row.weeklyHours ?? undefined,
      assignmentType: 'subject' as const,
      assignmentLabel: 'Disciplina atribuída',
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

    const classIdsWithSubjectAssignment = new Set(
      classSubjectAssignments.map((item) => item.classId)
    );

    const mainTeacherAssignments = mainTeacherRows
      .filter((row) => !classIdsWithSubjectAssignment.has(row.id))
      .map((row) => ({
        id: `main-teacher-${row.id}`,
        classId: row.id,
        subjectId: '',
        teacherId,
        assignmentType: 'main_teacher' as const,
        assignmentLabel: 'Professor Titular',
        class: {
          id: row.id,
          name: row.name,
          grade: row.grade,
          section: row.section ?? undefined,
          shift: row.shift ?? undefined,
          academicYear: row.academicYear ?? undefined,
          course: row.course ?? undefined,
          _count: {
            enrollments: enrollmentsCountByClassId.get(row.id) ?? 0,
          },
        },
        subject: undefined,
      }));

    return [...classSubjectAssignments, ...mainTeacherAssignments];
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
