import api from '@/lib/api';

export interface TeacherAttendance {
  id: string;
  date: string;
  checkInTime: string;
  notes?: string;
  teacherId: string;
  classId: string;
  classSubjectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherScheduleItem {
  classId: string;
  className: string;
  classSubjectId: string;
  subjectName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
}

export interface TeacherStats {
  total: number;
  byMonth: Record<string, number>;
}

export const teacherAttendancesService = {
  /**
   * Buscar histórico do professor logado
   */
  async getMyAttendances(filters?: {
    month?: number;
    year?: number;
    classSubjectId?: string;
  }): Promise<TeacherAttendance[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.classSubjectId)
      params.append('classSubjectId', filters.classSubjectId);

    const { data } = await api.get<TeacherAttendance[]>(
      `/teacher-attendances/my?${params.toString()}`,
    );
    return data;
  },

  /**
   * Buscar histórico de um professor específico (admin/coordenador)
   */
  async getTeacherAttendances(
    teacherId: string,
    filters?: { month?: number; year?: number; classSubjectId?: string },
  ): Promise<TeacherAttendance[]> {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.classSubjectId)
      params.append('classSubjectId', filters.classSubjectId);

    const { data } = await api.get<TeacherAttendance[]>(
      `/teacher-attendances/teacher/${teacherId}?${params.toString()}`,
    );
    return data;
  },

  /**
   * Buscar grade horária do professor
   */
  async getTeacherSchedule(
    teacherId: string,
  ): Promise<TeacherScheduleItem[]> {
    const { data } = await api.get<TeacherScheduleItem[]>(
      `/teacher-attendances/schedules/${teacherId}`,
    );
    return data;
  },

  /**
   * Buscar estatísticas do professor
   */
  async getTeacherStats(
    teacherId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<TeacherStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const { data } = await api.get<TeacherStats>(
      `/teacher-attendances/stats/${teacherId}?${params.toString()}`,
    );
    return data;
  },
};
