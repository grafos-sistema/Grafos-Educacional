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

type DbClass = Omit<Class, 'course' | 'academicYear' | 'mainTeacher' | '_count'> & {
  course?: { id: string; name: string } | null;
  academicYear?: { id: string; name: string; year: number } | null;
  mainTeacher?: { id: string; user?: { id: string; firstName: string; lastName: string; email: string } | null } | null;
};

type DbClassSubject = {
  id: string;
  weeklyHours: number | null;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
  subject?: any | null;
  teacher?: { user?: any | null } | null;
};

type DbEnrollment = {
  id: string;
  enrollmentDate: string;
  isActive: boolean;
  classId: string;
  studentId: string;
  createdAt?: string;
  updatedAt?: string;
  student?: {
    id: string;
    userId: string;
    registrationNumber: string;
    enrollmentNumber?: string | null;
    isActive: boolean;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      cpf?: string | null;
      avatar?: string | null;
    } | null;
  } | null;
};

function mapClassSubject(row: DbClassSubject): ClassSubject {
  return {
    id: row.id,
    weeklyHours: row.weeklyHours ?? undefined,
    classId: row.classId,
    subjectId: row.subjectId,
    teacherId: row.teacherId ?? '',
    subject: (row.subject ?? undefined) as any,
    teacher: (row.teacher?.user ?? undefined) as any,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEnrollment(row: DbEnrollment): ClassEnrollment {
  const student = row.student;
  const user = student?.user;

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

export const classesService = {
  /**
   * Listar todas as turmas com paginaÃ§Ã£o e filtros
   */
  async findAll(params: ClassesFilterParams = {}): Promise<PaginatedClasses> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const institutionId =
      params.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    let query = supabase
      .from('classes')
      .select(
        'id, name, grade, section, shift, maxStudents, isActive, institutionId, courseId, academicYearId, mainTeacherId, createdAt, updatedAt, course:courses(id, name), academicYear:academic_years(id, name, year), mainTeacher:teachers(id, user:users(id, firstName, lastName, email))',
        { count: 'exact' }
      )
      .eq('institutionId', institutionId)
      .order('name', { ascending: true })
      .range(from, to);

    if (params.courseId) {
      query = query.eq('courseId', params.courseId);
    }

    if (params.academicYearId) {
      query = query.eq('academicYearId', params.academicYearId);
    }

    if (typeof params.isActive === 'boolean') {
      query = query.eq('isActive', params.isActive);
    }

    if (params.search && params.search.trim().length > 0) {
      const term = params.search.trim();
      query = query.or(
        `name.ilike.%${term}%,grade.ilike.%${term}%,section.ilike.%${term}%`
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const classes = (data ?? []) as DbClass[];
    const classIds = classes.map((c) => c.id);

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

    const mapped: Class[] = classes.map((row) => ({
      ...(row as any),
      course: row.course ?? undefined,
      academicYear: row.academicYear ?? undefined,
      mainTeacher: row.mainTeacher
        ? {
            id: row.mainTeacher.id,
            user: row.mainTeacher.user ?? undefined,
          }
        : undefined,
      _count: {
        enrollments: enrollmentsCountByClassId.get(row.id) ?? 0,
      },
    }));

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  },

  /**
   * Buscar turma por ID
   */
  async findOne(id: string): Promise<Class> {
    const { data, error } = await supabase
      .from('classes')
      .select(
        'id, name, grade, section, shift, maxStudents, isActive, institutionId, courseId, academicYearId, mainTeacherId, createdAt, updatedAt, course:courses(id, name), academicYear:academic_years(id, name, year), mainTeacher:teachers(id, user:users(id, firstName, lastName, email))'
      )
      .eq('id', id)
      .single();

    if (error) throw error;

    const row = data as DbClass;

    const { data: enrollments, error: enrollmentsError, count } = await supabase
      .from('class_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('classId', id)
      .eq('isActive', true);

    if (enrollmentsError) throw enrollmentsError;
    void enrollments;

    return {
      ...(row as any),
      course: row.course ?? undefined,
      academicYear: row.academicYear ?? undefined,
      mainTeacher: row.mainTeacher
        ? {
            id: row.mainTeacher.id,
            user: row.mainTeacher.user ?? undefined,
          }
        : undefined,
      _count: {
        enrollments: count ?? 0,
      },
    } as Class;
  },

  /**
   * Criar nova turma
   */
  async create(data: CreateClassDto): Promise<Class> {
    const now = new Date().toISOString();
    const institutionId =
      data.institutionId ?? (await fetchCurrentUserProfile()).institutionId;

    const payload = {
      id: crypto.randomUUID(),
      name: data.name,
      grade: data.grade,
      section: data.section,
      shift: data.shift,
      maxStudents: data.maxStudents,
      isActive: data.isActive ?? true,
      institutionId,
      courseId: data.courseId,
      academicYearId: data.academicYearId,
      mainTeacherId: data.mainTeacherId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('classes')
      .insert(payload)
      .select(
        'id, name, grade, section, shift, maxStudents, isActive, institutionId, courseId, academicYearId, mainTeacherId, createdAt, updatedAt, course:courses(id, name), academicYear:academic_years(id, name, year), mainTeacher:teachers(id, user:users(id, firstName, lastName, email))'
      )
      .single();

    if (error) throw error;
    return (await this.findOne((created as any).id)) as Class;
  },

  /**
   * Atualizar turma
   */
  async update(id: string, data: UpdateClassDto): Promise<Class> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('classes')
      .update({ ...data, updatedAt: now })
      .eq('id', id);

    if (error) throw error;
    return this.findOne(id);
  },

  /**
   * Remover turma (soft delete)
   */
  async remove(id: string): Promise<Class> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('classes')
      .update({ isActive: false, updatedAt: now })
      .eq('id', id);

    if (error) throw error;
    return this.findOne(id);
  },

  /**
   * Excluir turma permanentemente
   */
  async removePermanently(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/classes/${id}/permanent`);
    return response.data;
  },

  /**
   * Listar disciplinas da turma
   */
  async getClassSubjects(classId: string): Promise<ClassSubject[]> {
    const { data, error } = await supabase
      .from('class_subjects')
      .select(
        'id, weeklyHours, classId, subjectId, teacherId, createdAt, updatedAt, subject:subjects(*), teacher:teachers(id, user:users(*))'
      )
      .eq('classId', classId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return ((data ?? []) as DbClassSubject[]).map(mapClassSubject);
  },

  /**
   * Adicionar disciplina Ã  turma
   */
  async addSubject(data: CreateClassSubjectDto): Promise<ClassSubject> {
    const now = new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      classId: data.classId,
      subjectId: data.subjectId,
      teacherId: data.teacherId,
      weeklyHours: data.weeklyHours ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const { data: created, error } = await supabase
      .from('class_subjects')
      .insert(payload)
      .select(
        'id, weeklyHours, classId, subjectId, teacherId, createdAt, updatedAt, subject:subjects(*), teacher:teachers(id, user:users(*))'
      )
      .single();

    if (error) throw error;
    return mapClassSubject(created as DbClassSubject);
  },

  /**
   * Remover disciplina da turma
   */
  async removeSubject(classSubjectId: string): Promise<void> {
    const { error } = await supabase
      .from('class_subjects')
      .delete()
      .eq('id', classSubjectId);

    if (error) throw error;
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
    return ((data ?? []) as DbEnrollment[]).map(mapEnrollment);
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
    return mapEnrollment(created as DbEnrollment);
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
