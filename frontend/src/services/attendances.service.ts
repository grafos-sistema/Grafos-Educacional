import {
  Attendance,
  CreateAttendanceDto,
  UpdateAttendanceDto,
  BulkAttendanceDto,
  AttendanceFilters,
  AttendanceStats,
  AttendanceStatus,
} from '@/types/attendance.types';
import { PaginatedResponse } from '@/types/common.types';
import { supabase } from '@/lib/supabase';

export const attendancesService = {
  buildDateRangeFilters(filters?: AttendanceFilters) {
    const hasExactDate = typeof filters?.date === 'string' && filters.date.trim().length > 0;
    const hasStart = typeof filters?.startDate === 'string' && filters.startDate.trim().length > 0;
    const hasEnd = typeof filters?.endDate === 'string' && filters.endDate.trim().length > 0;

    if (!hasExactDate && !hasStart && !hasEnd) {
      return null;
    }

    const toDayStart = (dateOnly: string) => `${dateOnly}T00:00:00`;
    const addDays = (dateOnly: string, days: number) => {
      const base = new Date(`${dateOnly}T00:00:00Z`);
      base.setUTCDate(base.getUTCDate() + days);
      const yyyy = base.getUTCFullYear();
      const mm = String(base.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(base.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (hasExactDate) {
      const d = filters!.date!.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const next = addDays(d, 1);
        return { gte: toDayStart(d), lt: toDayStart(next) };
      }
      return { eq: d };
    }

    const start = hasStart ? filters!.startDate!.trim() : null;
    const end = hasEnd ? filters!.endDate!.trim() : null;

    const range: { gte?: string; lt?: string } = {};
    if (start && /^\d{4}-\d{2}-\d{2}$/.test(start)) {
      range.gte = toDayStart(start);
    } else if (start) {
      range.gte = start;
    }

    if (end && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
      const next = addDays(end, 1);
      range.lt = toDayStart(next);
    } else if (end) {
      range.lt = end;
    }

    return range;
  },

  mapAttendance(row: any): Attendance {
    const studentUser = row.student?.user;
    const teacherUser = row.teacher?.user;
    const classRow = row.class;
    const cs = row.classSubject;
    const csSubject = cs?.subject;

    return {
      id: row.id,
      date: row.date,
      status: row.status,
      notes: row.notes ?? undefined,
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
      classId: row.classId,
      class: classRow
        ? {
            id: classRow.id,
            name: classRow.name,
            grade: classRow.grade,
          }
        : undefined,
      classSubjectId: row.classSubjectId,
      classSubject: csSubject
        ? {
            id: cs.id,
            subject: {
              id: csSubject.id,
              name: csSubject.name,
              code: csSubject.code ?? undefined,
              color: csSubject.color ?? undefined,
            },
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
   * Buscar todas as frequÃªncias com filtros
   */
  async findAll(filters?: AttendanceFilters): Promise<PaginatedResponse<Attendance>> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('attendances')
      .select(
        'id, date, status, notes, createdAt, updatedAt, studentId, classId, classSubjectId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), class:classes(id, name, grade), classSubject:class_subjects(id, subject:subjects(id, name, code, color)), teacher:teachers(id, user:users(id, firstName, lastName, name))',
        { count: 'exact' }
      )
      .order('date', { ascending: false })
      .range(from, to);

    if (filters?.studentId) query = query.eq('studentId', filters.studentId);
    if (filters?.classId) query = query.eq('classId', filters.classId);
    if (filters?.classSubjectId) query = query.eq('classSubjectId', filters.classSubjectId);
    if (filters?.teacherId) query = query.eq('teacherId', filters.teacherId);
    if (filters?.status) query = query.eq('status', filters.status);

    const dateRange = attendancesService.buildDateRangeFilters(filters);
    if (dateRange) {
      if ('eq' in dateRange && dateRange.eq) {
        query = query.eq('date', dateRange.eq);
      }
      if ('gte' in dateRange && dateRange.gte) {
        query = query.gte('date', dateRange.gte);
      }
      if ('lt' in dateRange && dateRange.lt) {
        query = query.lt('date', dateRange.lt);
      }
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      data: (data ?? []).map((row) => attendancesService.mapAttendance(row)),
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
   * Buscar frequÃªncia por ID
   */
  async findOne(id: string): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendances')
      .select(
        'id, date, status, notes, createdAt, updatedAt, studentId, classId, classSubjectId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), class:classes(id, name, grade), classSubject:class_subjects(id, subject:subjects(id, name, code, color)), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return attendancesService.mapAttendance(data);
  },

  /**
   * Criar frequÃªncia individual
   */
  async create(dto: CreateAttendanceDto): Promise<Attendance> {
    const now = new Date().toISOString();
    const payload = {
      id: crypto.randomUUID(),
      date: dto.date,
      status: dto.status,
      notes: dto.notes ?? null,
      studentId: dto.studentId,
      classId: dto.classId,
      classSubjectId: dto.classSubjectId,
      teacherId: dto.teacherId,
      createdAt: now,
      updatedAt: now,
    };

    const { data, error } = await supabase
      .from('attendances')
      .insert(payload)
      .select(
        'id, date, status, notes, createdAt, updatedAt, studentId, classId, classSubjectId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), class:classes(id, name, grade), classSubject:class_subjects(id, subject:subjects(id, name, code, color)), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .single();

    if (error) throw error;
    return attendancesService.mapAttendance(data);
  },

  /**
   * Criar frequÃªncias em lote (mÃºltiplos alunos de uma vez)
   */
  async createBulk(dto: BulkAttendanceDto): Promise<Attendance[]> {
    const now = new Date().toISOString();
    const payload = dto.attendances.map((item) => ({
      id: crypto.randomUUID(),
      date: dto.date,
      status: item.status,
      notes: item.notes ?? null,
      studentId: item.studentId,
      classId: dto.classId,
      classSubjectId: dto.classSubjectId,
      teacherId: dto.teacherId,
      createdAt: now,
      updatedAt: now,
    }));

    const { data, error } = await supabase
      .from('attendances')
      .insert(payload)
      .select(
        'id, date, status, notes, createdAt, updatedAt, studentId, classId, classSubjectId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), class:classes(id, name, grade), classSubject:class_subjects(id, subject:subjects(id, name, code, color)), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      );

    if (error) throw error;
    return (data ?? []).map((row) => attendancesService.mapAttendance(row));
  },

  /**
   * Atualizar frequÃªncia
   */
  async update(id: string, dto: UpdateAttendanceDto): Promise<Attendance> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('attendances')
      .update({ ...dto, updatedAt: now })
      .eq('id', id)
      .select(
        'id, date, status, notes, createdAt, updatedAt, studentId, classId, classSubjectId, teacherId, student:students(id, user:users(id, firstName, lastName, name, avatar)), class:classes(id, name, grade), classSubject:class_subjects(id, subject:subjects(id, name, code, color)), teacher:teachers(id, user:users(id, firstName, lastName, name))'
      )
      .single();

    if (error) throw error;
    return attendancesService.mapAttendance(data);
  },

  /**
   * Deletar frequÃªncia
   */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('attendances').delete().eq('id', id);
    if (error) throw error;
  },

  /**
   * Buscar frequÃªncias de um aluno em uma disciplina
   */
  async getStudentAttendances(
    studentId: string,
    classSubjectId?: string
  ): Promise<Attendance[]> {
    const result = await attendancesService.findAll({
      studentId,
      classSubjectId,
      page: 1,
      limit: 1000,
    });
    return result.data;
  },

  /**
   * Buscar frequÃªncias de uma turma em uma data especÃ­fica
   */
  async getClassAttendanceByDate(
    classId: string,
    classSubjectId: string,
    date: string
  ): Promise<Attendance[]> {
    const result = await attendancesService.findAll({
      classId,
      classSubjectId,
      date,
      page: 1,
      limit: 1000,
    });
    return result.data;
  },

  /**
   * Buscar frequências de uma turma/disciplina
   */
  async getClassSubjectAttendances(classSubjectId: string): Promise<Attendance[]> {
    const result = await attendancesService.findAll({
      classSubjectId,
      page: 1,
      limit: 1000,
    });
    return result.data;
  },

  /**
   * Obter estatÃ­sticas de frequÃªncia
   */
  async getStats(filters: AttendanceFilters): Promise<AttendanceStats> {
    const buildCountQuery = (status?: AttendanceStatus) => {
      let query = supabase
        .from('attendances')
        .select('id', { count: 'exact', head: true });

      if (filters.studentId) query = query.eq('studentId', filters.studentId);
      if (filters.classId) query = query.eq('classId', filters.classId);
      if (filters.classSubjectId) query = query.eq('classSubjectId', filters.classSubjectId);
      if (filters.teacherId) query = query.eq('teacherId', filters.teacherId);

      const dateRange = attendancesService.buildDateRangeFilters(filters);
      if (dateRange) {
        if ('eq' in dateRange && dateRange.eq) {
          query = query.eq('date', dateRange.eq);
        }
        if ('gte' in dateRange && dateRange.gte) {
          query = query.gte('date', dateRange.gte);
        }
        if ('lt' in dateRange && dateRange.lt) {
          query = query.lt('date', dateRange.lt);
        }
      }

      if (status) query = query.eq('status', status);
      return query;
    };

    const [
      presentResult,
      absentResult,
      lateResult,
      excusedResult,
    ] = await Promise.all([
      buildCountQuery(AttendanceStatus.PRESENT),
      buildCountQuery(AttendanceStatus.ABSENT),
      buildCountQuery(AttendanceStatus.LATE),
      buildCountQuery(AttendanceStatus.EXCUSED),
    ]);

    if ((presentResult as any).error) throw (presentResult as any).error;
    if ((absentResult as any).error) throw (absentResult as any).error;
    if ((lateResult as any).error) throw (lateResult as any).error;
    if ((excusedResult as any).error) throw (excusedResult as any).error;

    const totalPresent = (presentResult as any).count ?? 0;
    const totalAbsent = (absentResult as any).count ?? 0;
    const totalLate = (lateResult as any).count ?? 0;
    const totalExcused = (excusedResult as any).count ?? 0;

    const total = totalPresent + totalAbsent + totalLate + totalExcused;
    const attendanceRate = total > 0 ? (totalPresent / total) * 100 : 0;

    return {
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      attendanceRate,
    };
  },
};
