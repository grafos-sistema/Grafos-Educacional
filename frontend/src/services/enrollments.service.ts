import api from '@/lib/api';
import { PaginatedResponse } from '@/types/common.types';
import { ClassEnrollment } from '@/types/class.types';

export interface EnrollmentFilters {
  page?: number;
  limit?: number;
  classId?: string;
  studentId?: string;
  institutionId?: string;
  isActive?: boolean;
}

type ApiEnrollment = {
  id: string;
  enrollmentDate: string;
  isActive: boolean;
  classId: string;
  studentId: string;
  createdAt?: string;
  updatedAt?: string;
  class?: {
    id: string;
    name: string;
    grade?: string | null;
    section?: string | null;
    shift?: string | null;
    course?: {
      id: string;
      name: string;
      code?: string | null;
    } | null;
    academicYear?: {
      id: string;
      year: number;
    } | null;
  } | null;
  student?: {
    id: string;
    enrollmentNumber?: string | null;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      cpf?: string | null;
      avatar?: string | null;
    } | null;
  } | null;
};

function buildQueryString(filters: EnrollmentFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

function mapEnrollment(row: ApiEnrollment): ClassEnrollment {
  return {
    id: row.id,
    enrollmentDate: row.enrollmentDate,
    isActive: row.isActive,
    classId: row.classId,
    studentId: row.studentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    class: row.class
      ? {
          id: row.class.id,
          name: row.class.name,
          grade: row.class.grade ?? undefined,
          section: row.class.section ?? undefined,
          shift: row.class.shift ?? undefined,
          course: row.class.course
            ? {
                id: row.class.course.id,
                name: row.class.course.name,
                code: row.class.course.code ?? undefined,
              }
            : undefined,
          academicYear: row.class.academicYear
            ? {
                id: row.class.academicYear.id,
                year: row.class.academicYear.year,
              }
            : undefined,
        }
      : undefined,
    student: row.student
      ? {
          id: row.student.id,
          userId: row.student.user?.id ?? '',
          registrationNumber: row.student.enrollmentNumber ?? '',
          enrollmentNumber: row.student.enrollmentNumber ?? undefined,
          isActive: row.isActive,
          firstName: row.student.user?.firstName ?? '',
          lastName: row.student.user?.lastName ?? '',
          email: row.student.user?.email ?? '',
          cpf: row.student.user?.cpf ?? undefined,
          avatar: row.student.user?.avatar ?? undefined,
        }
      : undefined,
  };
}

export const enrollmentsService = {
  async findAll(
    filters: EnrollmentFilters = {}
  ): Promise<PaginatedResponse<ClassEnrollment>> {
    const response = (await api.get<PaginatedResponse<ApiEnrollment>>(
      `/enrollments${buildQueryString(filters)}`
    )) as unknown as PaginatedResponse<ApiEnrollment>;

    return {
      ...response,
      data: (response.data ?? []).map(mapEnrollment),
    };
  },

  async create(data: { classId: string; studentId: string }): Promise<ClassEnrollment> {
    const response = (await api.post<ApiEnrollment>('/enrollments', data)) as unknown as ApiEnrollment;
    return mapEnrollment(response);
  },

  async transfer(id: string, data: { newClassId: string }): Promise<ClassEnrollment> {
    const response = (await api.patch<ApiEnrollment>(
      `/enrollments/${id}/transfer`,
      data
    )) as unknown as ApiEnrollment;
    return mapEnrollment(response);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/enrollments/${id}`);
  },

  async syncStudentClass(studentId: string, classId?: string): Promise<void> {
    const current = await this.findAll({ studentId, isActive: true, limit: 1000 });
    const matching = classId
      ? current.data.find((enrollment) => enrollment.classId === classId)
      : undefined;

    if (classId && !matching) {
      const currentEnrollment = current.data[0];
      if (currentEnrollment) {
        await this.transfer(currentEnrollment.id, { newClassId: classId });
      } else {
        await this.create({ classId, studentId });
      }
    }

    const activeAfterSync = classId
      ? (await this.findAll({ studentId, isActive: true, limit: 1000 })).data
      : current.data;

    for (const enrollment of activeAfterSync) {
      if (!classId || enrollment.classId !== classId) {
        await this.remove(enrollment.id);
      }
    }
  },
};
