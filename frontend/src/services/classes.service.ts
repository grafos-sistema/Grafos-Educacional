import {
  Class,
  CreateClassDto,
  UpdateClassDto,
  PaginatedClasses,
  CreateClassSubjectDto,
  CreateClassEnrollmentDto,
  ClassSubject,
  ClassEnrollment,
} from '@/types/class.types';
import api from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { fetchCurrentUserProfile } from '@/lib/auth-profile';

export interface ClassesFilterParams {
  page?: number;
  limit?: number;
  institutionId?: string;
  courseId?: string;
  academicYearId?: string;
  search?: string;
  isActive?: boolean;
}

type MaybeArray<T> = T | T[] | null;

type DbClass = Omit<Class, 'course' | 'academicYear' | 'mainTeacher' | '_count'> & {
  course?: MaybeArray<{ id: string; name: string }>;
  academicYear?: MaybeArray<{ id: string; name: string; year: number }>;
  mainTeacher?: MaybeArray<{
    id: string;
    user?: MaybeArray<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>;
  }>;
};

type DbClassSubject = {
  id: string;
  scheduledMinutes?: number;
  scheduledClassCount?: number;
  schedules?: Array<{
    id: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
  subject?: MaybeArray<any>;
  teacher?: MaybeArray<{ user?: MaybeArray<any> }>;
};

type DbEnrollment = {
  id: string;
  enrollmentDate: string;
  isActive: boolean;
  classId: string;
  studentId: string;
  createdAt?: string;
  updatedAt?: string;
  student?: MaybeArray<{
    id: string;
    userId: string;
    registrationNumber: string;
    enrollmentNumber?: string | null;
    isActive: boolean;
    user?: MaybeArray<{
      firstName: string;
      lastName: string;
      email: string;
      cpf?: string | null;
      avatar?: string | null;
    }>;
  }>;
};

type ApiEnrollment = {
  id: string;
  enrollmentDate: string;
  isActive: boolean;
  studentId: string;
  student?: {
    id: string;
    userId: string;
    registrationNumber: string;
    enrollmentNumber?: string | null;
    isActive: boolean;
    firstName: string;
    lastName: string;
    email: string;
    cpf?: string | null;
    avatar?: string | null;
  };
};

function firstRelation<T>(value?: MaybeArray<T>): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapClassRow(
  row: DbClass,
  enrollmentsCountByClassId?: Map<string, number>
): Class {
  const course = firstRelation(row.course);
  const academicYear = firstRelation(row.academicYear);
  const mainTeacher = firstRelation(row.mainTeacher);
  const mainTeacherUser = firstRelation(mainTeacher?.user);

  return {
    ...(row as any),
    course: course ?? undefined,
    academicYear: academicYear ?? undefined,
    mainTeacher: mainTeacher
      ? {
          id: mainTeacher.id,
          user: mainTeacherUser ?? undefined,
        }
      : undefined,
    _count: {
      enrollments: enrollmentsCountByClassId?.get(row.id) ?? 0,
    },
  };
}

function mapClassSubject(row: DbClassSubject): ClassSubject {
  const teacher = firstRelation(row.teacher);
  const teacherUser = firstRelation(teacher?.user) ?? (teacher as any);
  return {
    id: row.id,
    scheduledMinutes: row.scheduledMinutes ?? 0,
    scheduledClassCount: row.scheduledClassCount ?? row.schedules?.length ?? 0,
    schedules: row.schedules ?? [],
    classId: row.classId,
    subjectId: row.subjectId,
    teacherId: row.teacherId ?? undefined,
    subject: (firstRelation(row.subject) ?? undefined) as any,
    teacher: (teacherUser ?? undefined) as any,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEnrollment(row: DbEnrollment): ClassEnrollment {
  const student = firstRelation(row.student);
  const user = firstRelation(student?.user);

  return {
    id: row.id,
    enrollmentDate: row.enrollmentDate,
    isActive: row.isActive,
    classId: row.classId,
    studentId: row.studentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    student: student
      ? {
          id: student.id,
          userId: student.userId,
          registrationNumber: student.registrationNumber,
          enrollmentNumber: student.enrollmentNumber ?? undefined,
          isActive: student.isActive,
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          email: user?.email ?? '',
          cpf: user?.cpf ?? undefined,
          avatar: user?.avatar ?? undefined,
        }
      : undefined,
  };
}

function mapApiEnrollment(row: ApiEnrollment, classId: string): ClassEnrollment {
  return {
    id: row.id,
    enrollmentDate: row.enrollmentDate,
    isActive: row.isActive,
    classId,
    studentId: row.studentId,
    student: row.student
      ? {
          id: row.student.id,
          userId: row.student.userId,
          registrationNumber: row.student.registrationNumber,
          enrollmentNumber: row.student.enrollmentNumber ?? undefined,
          isActive: row.student.isActive,
          firstName: row.student.firstName ?? '',
          lastName: row.student.lastName ?? '',
          email: row.student.email ?? '',
          cpf: row.student.cpf ?? undefined,
          avatar: row.student.avatar ?? undefined,
        }
      : undefined,
  };
}

export const classesService = {
  /**
   * Listar todas as turmas com paginaÃ§Ã£o e filtros
   */
  async findAll(params: ClassesFilterParams = {}): Promise<PaginatedClasses> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    return (await api.get<PaginatedClasses>('/classes', {
      params: {
        page,
        limit,
        institutionId: params.institutionId,
        courseId: params.courseId,
        academicYearId: params.academicYearId,
        search: params.search?.trim() || undefined,
        isActive: params.isActive,
      },
    })) as unknown as PaginatedClasses;
  },

  /**
   * Buscar turma por ID
   */
  async findOne(id: string): Promise<Class> {
    return (await api.get<Class>(`/classes/${id}`)) as unknown as Class;
  },

  /**
   * Criar nova turma
   */
  async create(data: CreateClassDto): Promise<Class> {
    return (await api.post<Class>('/classes', data)) as unknown as Class;
  },

  /**
   * Atualizar turma
   */
  async update(id: string, data: UpdateClassDto): Promise<Class> {
    return (await api.patch<Class>(`/classes/${id}`, {
      ...data,
      baseRoom: data.baseRoom === undefined ? undefined : data.baseRoom || null,
    })) as unknown as Class;
  },

  /**
   * Remover turma (soft delete)
   */
  async remove(id: string): Promise<Class> {
    return (await api.delete<Class>(`/classes/${id}`)) as unknown as Class;
  },

  /**
   * Excluir turma permanentemente
   */
  async removePermanently(id: string): Promise<{ message: string }> {
    return (await api.delete<{ message: string }>(
      `/classes/${id}/permanent`
    )) as unknown as { message: string };
  },

  /**
   * Listar disciplinas da turma
   */
  async getClassSubjects(classId: string): Promise<ClassSubject[]> {
    const response = await api.get<DbClassSubject[]>(`/classes/${classId}/subjects`);
    const data = response as unknown as DbClassSubject[];
    return (data ?? []).map(mapClassSubject);
  },

  /**
   * Adicionar disciplina Ã  turma
   */
  async addSubject(data: CreateClassSubjectDto): Promise<ClassSubject> {
    const created = (await api.post<any>(`/classes/${data.classId}/subjects`, {
      subjectId: data.subjectId,
      teacherId: data.teacherId || undefined,
    })) as any;

    return {
      id: created.id,
      scheduledMinutes: created.scheduledMinutes ?? 0,
      scheduledClassCount: created.scheduledClassCount ?? 0,
      schedules: created.schedules ?? [],
      classId: created.classId,
      subjectId: created.subjectId,
      teacherId: created.teacherId ?? undefined,
      subject: created.subject ?? undefined,
      teacher: created.teacher?.user ?? undefined,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  /**
   * Remover disciplina da turma
   */
  async removeSubject(classSubjectId: string): Promise<void> {
    await api.delete(`/class-subjects/${classSubjectId}`);
  },

  /**
   * Listar alunos matriculados
   */
  async getEnrollments(classId: string): Promise<ClassEnrollment[]> {
    const { data, error } = await supabase
      .from('class_enrollments')
      .select(
        'id, enrollmentDate, isActive, classId, studentId, createdAt, updatedAt, student:students(id, userId, registrationNumber, enrollmentNumber, isActive, user:users(firstName, lastName, email, cpf, avatar))'
      )
      .eq('classId', classId)
      .order('enrollmentDate', { ascending: false });

    if (error) throw error;
    return (((data ?? []) as unknown) as DbEnrollment[]).map(mapEnrollment);
  },

  /**
   * Lista matrículas pela API autenticada, com os dados completos do aluno.
   * Usado nos fluxos pedagógicos em que o professor precisa visualizar nome,
   * e-mail e foto sem depender de uma relação aninhada bloqueada por RLS.
   */
  async getEnrollmentsFromApi(classId: string): Promise<ClassEnrollment[]> {
    const response = await api.get<ApiEnrollment[]>(`/classes/${classId}/enrollments`);
    return ((response as unknown as ApiEnrollment[]) ?? []).map((row) =>
      mapApiEnrollment(row, classId),
    );
  },

  /**
   * Matricular aluno
   */
  async enrollStudent(data: CreateClassEnrollmentDto): Promise<ClassEnrollment> {
    const now = new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      classId: data.classId,
      studentId: data.studentId,
      enrollmentDate: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('class_enrollments')
      .insert(payload)
      .select(
        'id, enrollmentDate, isActive, classId, studentId, createdAt, updatedAt, student:students(id, userId, registrationNumber, enrollmentNumber, isActive, user:users(firstName, lastName, email, cpf, avatar))'
      )
      .single();

    if (error) throw error;
    return mapEnrollment((created as unknown) as DbEnrollment);
  },

  /**
   * Remover matrÃ­cula
   */
  async unenrollStudent(classId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('classId', classId)
      .eq('studentId', studentId);

    if (error) throw error;
  },

  /**
   * Remover matrÃ­cula por ID
   */
  async removeEnrollment(enrollmentId: string): Promise<void> {
    const { error } = await supabase
      .from('class_enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) throw error;
  },
};
