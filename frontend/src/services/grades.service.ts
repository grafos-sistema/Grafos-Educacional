import {
  Grade,
  CreateGradeDto,
  UpdateGradeDto,
  BulkGradeDto,
  GradeFilters,
  StudentGradeReport,
  GradeStats,
  GradeStatus,
} from '@/types/grade.types';
import { PaginatedResponse } from '@/types/common.types';
import { supabase } from '@/lib/supabase';

export const gradesService = {
  mapGrade(row: any): Grade {
    const studentUser = row.student?.user;
    const teacherUser = row.teacher?.user;
    const cs = row.classSubject;
    const csSubject = cs?.subject;
    const csClass = cs?.class;

    return {
      id: row.id,
      value: row.value,
      weight: row.weight,
      examType: row.examType,
      examDate: row.examDate ?? undefined,
      description: row.description ?? undefined,
      status: row.status,
      publishedAt: row.publishedAt ?? undefined,
      observations: row.observations ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      studentId: row.studentId,
      student: row.student
        ? {
            id: row.student.id,
            user: {
              id: studentUser?.id ?? '',
              firstName: studentUser?.firstName ?? '',
              lastName: studentUser?.lastName ?? '',
              name: studentUser?.name ?? `${studentUser?.firstName ?? ''} ${studentUser?.lastName ?? ''}`.trim(),
              avatar: studentUser?.avatar ?? undefined,
            },
          }
        : undefined,
      classSubjectId: row.classSubjectId,
      classSubject: csSubject && csClass
        ? {
            id: cs.id,
            subject: {
              id: csSubject.id,
              name: csSubject.name,
              code: csSubject.code ?? undefined,
              color: csSubject.color ?? undefined,
            },
            class: {
              id: csClass.id,
              name: csClass.name,
              grade: csClass.grade,
            },
          }
        : undefined,
      academicPeriodId: row.academicPeriodId,
      academicPeriod: row.academicPeriod
        ? {
            id: row.academicPeriod.id,
            name: row.academicPeriod.name,
            type: row.academicPeriod.type,
            orderNumber: row.academicPeriod.orderNumber,
          }
        : undefined,
      teacherId: row.teacherId,
      teacher: row.teacher
        ? {
            id: row.teacher.id,
            user: {
              id: teacherUser?.id ?? '',
              firstName: teacherUser?.firstName ?? '',
              lastName: teacherUser?.lastName ?? '',
              name: teacherUser?.name ?? `${teacherUser?.firstName ?? ''} ${teacherUser?.lastName ?? ''}`.trim(),
            },
          }
        : undefined,
    };
  },

  /**
   * Buscar todas as notas com filtros
   */
  async findAll(filters?: GradeFilters): Promise<PaginatedResponse<Grade>> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('grades')
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), classSubject:class_subjects(id, subject:subjects(id, name, code, color), class:classes(id, name, grade)), academicPeriod:academic_periods(id, name, type, orderNumber), teacher:teachers(id, user:users(id, firstName, lastName, name))',
        { count: 'exact' }
      )
      .order('examDate', { ascending: false })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (filters?.studentId) query = query.eq('studentId', filters.studentId);
    if (filters?.classSubjectId) query = query.eq('classSubjectId', filters.classSubjectId);
    if (filters?.academicPeriodId) query = query.eq('academicPeriodId', filters.academicPeriodId);
    if (filters?.teacherId) query = query.eq('teacherId', filters.teacherId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.examType) query = query.eq('examType', filters.examType);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: (data ?? []).map((row) => gradesService.mapGrade(row)),
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
   * Buscar nota por ID
   */
  async findOne(id: string): Promise<Grade> {
    const { data, error } = await supabase
      .from('grades')
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), classSubject:class_subjects(id, subject:subjects(id, name, code, color), class:classes(id, name, grade)), academicPeriod:academic_periods(id, name, type, orderNumber), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return gradesService.mapGrade(data);
  },

  /**
   * Criar nota individual
   */
  async create(dto: CreateGradeDto): Promise<Grade> {
    const now = new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      value: dto.value,
      weight: dto.weight ?? 1,
      examType: dto.examType,
      examDate: dto.examDate ?? null,
      description: dto.description ?? null,
      status: dto.status ?? GradeStatus.PENDING,
      publishedAt: null,
      observations: dto.observations ?? null,
      studentId: dto.studentId,
      classSubjectId: dto.classSubjectId,
      academicPeriodId: dto.academicPeriodId,
      teacherId: dto.teacherId,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('grades')
      .insert(payload)
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), classSubject:class_subjects(id, subject:subjects(id, name, code, color), class:classes(id, name, grade)), academicPeriod:academic_periods(id, name, type, orderNumber), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .single();

    if (error) throw error;
    return gradesService.mapGrade(data);
  },

  /**
   * Criar notas em lote (mÃºltiplos alunos de uma vez)
   */
  async createBulk(dto: BulkGradeDto): Promise<Grade[]> {
    const now = new Date().toISOString();
    const payload = dto.grades.map((g) => ({
      id: crypto.randomUUID(),
      value: g.value,
      weight: dto.weight ?? 1,
      examType: dto.examType,
      examDate: dto.examDate ?? null,
      description: dto.description ?? null,
      status: GradeStatus.PENDING,
      publishedAt: null,
      observations: g.observations ?? null,
      studentId: g.studentId,
      classSubjectId: dto.classSubjectId,
      academicPeriodId: dto.academicPeriodId,
      teacherId: dto.teacherId,
      createdAt: now,
      updatedAt: now,
    }));

    const { data, error } = await supabase
      .from('grades')
      .insert(payload)
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), classSubject:class_subjects(id, subject:subjects(id, name, code, color), class:classes(id, name, grade)), academicPeriod:academic_periods(id, name, type, orderNumber), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      );

    if (error) throw error;
    return (data ?? []).map((row) => gradesService.mapGrade(row));
  },

  /**
   * Atualizar nota
   */
  async update(id: string, dto: UpdateGradeDto): Promise<Grade> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('grades')
      .update({ ...dto, updatedAt: now })
      .eq('id', id)
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), classSubject:class_subjects(id, subject:subjects(id, name, code, color), class:classes(id, name, grade)), academicPeriod:academic_periods(id, name, type, orderNumber), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .single();

    if (error) throw error;
    return gradesService.mapGrade(data);
  },

  /**
   * Publicar nota (tornar visÃ­vel para aluno)
   */
  async publish(id: string): Promise<Grade> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('grades')
      .update({ status: GradeStatus.PUBLISHED, publishedAt: now, updatedAt: now })
      .eq('id', id)
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), classSubject:class_subjects(id, subject:subjects(id, name, code, color), class:classes(id, name, grade)), academicPeriod:academic_periods(id, name, type, orderNumber), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .single();

    if (error) throw error;
    return gradesService.mapGrade(data);
  },

  /**
   * Deletar nota
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Buscar notas de um aluno
   */
  async getStudentGrades(studentId: string, filters?: GradeFilters): Promise<Grade[]> {
    const result = await gradesService.findAll({
      ...filters,
      studentId,
      page: 1,
      limit: 1000,
    });
    return result.data;
  },

  /**
   * Buscar boletim completo do aluno
   */
  async getStudentReport(
    studentId: string,
    academicYearId?: string
  ): Promise<StudentGradeReport[]> {
    let academicPeriodIds: string[] | null = null;

    if (academicYearId) {
      const { data: periods, error: periodsError } = await supabase
        .from('academic_periods')
        .select('id')
        .eq('academicYearId', academicYearId);

      if (periodsError) throw periodsError;
      academicPeriodIds = (periods ?? []).map((p: any) => p.id);
    }

    let query = supabase
      .from('grades')
      .select(
        'id, value, weight, examType, examDate, description, status, publishedAt, observations, createdAt, updatedAt, studentId, classSubjectId, academicPeriodId, teacherId, student:students(id, registrationNumber, user:users(id, firstName, lastName, name)), classSubject:class_subjects(id, subject:subjects(id, name, color)), academicPeriod:academic_periods(id, name)',
      )
      .eq('studentId', studentId);

    if (academicPeriodIds && academicPeriodIds.length > 0) {
      query = query.in('academicPeriodId', academicPeriodIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const reports = new Map<string, StudentGradeReport>();

    for (const row of rows as any[]) {
      const student = row.student;
      const studentUser = student?.user;
      const subject = row.classSubject?.subject;
      const period = row.academicPeriod;

      if (!student || !subject || !period) continue;

      const key = `${subject.id}:${period.id}`;
      const existing = reports.get(key);

      const grade: Grade = {
        id: row.id,
        value: row.value,
        weight: row.weight,
        examType: row.examType,
        examDate: row.examDate ?? undefined,
        description: row.description ?? undefined,
        status: row.status,
        publishedAt: row.publishedAt ?? undefined,
        observations: row.observations ?? undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        studentId: row.studentId,
        classSubjectId: row.classSubjectId,
        academicPeriodId: row.academicPeriodId,
        teacherId: row.teacherId,
      };

      if (!existing) {
        reports.set(key, {
          student: {
            id: student.id,
            name: studentUser?.name ?? `${studentUser?.firstName ?? ''} ${studentUser?.lastName ?? ''}`.trim(),
            registrationNumber: student.registrationNumber,
          },
          subject: {
            id: subject.id,
            name: subject.name,
            color: subject.color ?? undefined,
          },
          period: {
            id: period.id,
            name: period.name,
          },
          grades: [grade],
          average: 0,
          totalWeight: 0,
          status: 'pending',
        });
      } else {
        existing.grades.push(grade);
      }
    }

    for (const report of reports.values()) {
      let weightedSum = 0;
      let totalWeight = 0;
      let hasPending = false;

      for (const g of report.grades) {
        hasPending = hasPending || g.status === GradeStatus.PENDING;
        const w = typeof g.weight === 'number' ? g.weight : 0;
        totalWeight += w;
        weightedSum += g.value * w;
      }

      report.totalWeight = totalWeight;
      report.average = totalWeight > 0 ? weightedSum / totalWeight : 0;

      if (hasPending) {
        report.status = 'pending';
      } else {
        report.status = report.average >= 6 ? 'approved' : 'failed';
      }
    }

    return Array.from(reports.values());
  },

  /**
   * Buscar notas de uma turma/disciplina
   */
  async getClassSubjectGrades(classSubjectId: string): Promise<Grade[]> {
    const result = await gradesService.findAll({
      classSubjectId,
      page: 1,
      limit: 1000,
    });
    return result.data;
  },

  /**
   * Obter estatÃ­sticas de notas
   */
  async getStats(filters: GradeFilters): Promise<GradeStats> {
    let query = supabase
      .from('grades')
      .select('value, status');

    if (filters.studentId) query = query.eq('studentId', filters.studentId);
    if (filters.classSubjectId) query = query.eq('classSubjectId', filters.classSubjectId);
    if (filters.academicPeriodId) query = query.eq('academicPeriodId', filters.academicPeriodId);
    if (filters.teacherId) query = query.eq('teacherId', filters.teacherId);

    const { data, error } = await query.range(0, 9999);
    if (error) throw error;

    const values: number[] = [];
    let pendingCount = 0;
    let approvedCount = 0;
    let failedCount = 0;

    for (const row of data ?? []) {
      const value = (row as any).value as number;
      const status = (row as any).status as GradeStatus;
      values.push(value);

      if (status === GradeStatus.PENDING) pendingCount += 1;
      else if (value >= 6) approvedCount += 1;
      else failedCount += 1;
    }

    const totalGrades = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const average = totalGrades > 0 ? sum / totalGrades : 0;
    const highest = totalGrades > 0 ? Math.max(...values) : 0;
    const lowest = totalGrades > 0 ? Math.min(...values) : 0;

    return {
      totalGrades,
      average,
      highest,
      lowest,
      approvedCount,
      failedCount,
      pendingCount,
    };
  },
};
