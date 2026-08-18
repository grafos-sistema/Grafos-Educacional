import api from '@/lib/api';
import { supabase } from '@/lib/supabase';

export interface TeacherClass {
  id: string;
  classSubjectId?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours?: number;
  assignmentType?: 'subject';
  assignmentLabel?: string;
  class: {
    id: string;
    name: string;
    grade: string;
    isActive: boolean;
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

type ApiTeacherClass = {
  id: string;
  classSubjectId?: string;
  classId?: string;
  subjectId?: string;
  teacherId?: string;
  weeklyHours?: number | null;
  assignmentLabel?: string;
  class?: TeacherClass['class'];
  subject?: TeacherClass['subject'];
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
    const response = await api.get<ApiTeacherClass[]>(`/teachers/${teacherId}/classes`);
    return (response as unknown as ApiTeacherClass[]).map((item) => ({
      id: item.classSubjectId ?? item.id,
      classSubjectId: item.classSubjectId ?? item.id,
      classId: item.classId ?? item.class?.id ?? '',
      subjectId: item.subjectId ?? item.subject?.id ?? '',
      teacherId: item.teacherId ?? teacherId,
      weeklyHours: item.weeklyHours ?? undefined,
      assignmentType: 'subject' as const,
      assignmentLabel: item.assignmentLabel ?? 'Disciplina atribuída',
      class: {
        id: item.class?.id ?? item.classId ?? '',
        name: item.class?.name ?? '',
        grade: item.class?.grade ?? '',
        // The API already returns the class status. Preserve it instead of
        // dropping it while adapting the response for the teacher screens.
        isActive: item.class?.isActive !== false,
        section: item.class?.section ?? undefined,
        shift: item.class?.shift ?? undefined,
        academicYear: item.class?.academicYear ?? undefined,
        course: item.class?.course ?? undefined,
        _count: item.class?._count ?? { enrollments: 0 },
      },
      subject: item.subject
        ? {
            id: item.subject.id,
            name: item.subject.name ?? '',
            code: item.subject.code ?? undefined,
            color: item.subject.color ?? undefined,
          }
        : undefined,
    }));
  },

  /**
   * Listar disciplinas do professor
   */
  async getTeacherSubjects(teacherId: string): Promise<DbTeacherSubject['subject'][]> {
    const { data, error } = await supabase
      .from('teacher_subjects')
      .select('subject:subjects(id, name, code, color, description)')
      .eq('teacherId', teacherId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown as DbTeacherSubject[])
      .map((row) => row.subject)
      .filter((subject): subject is NonNullable<DbTeacherSubject['subject']> => Boolean(subject));
  },
};
