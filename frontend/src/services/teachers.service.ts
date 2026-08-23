import api from "@/lib/api";
import { supabase } from "@/lib/supabase";

export interface TeacherClass {
  id: string;
  classSubjectId?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  scheduledMinutes?: number;
  scheduledClassCount?: number;
  assignmentType?: "subject";
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
  scheduledMinutes?: number;
  scheduledClassCount?: number;
  assignmentLabel?: string;
  class?: TeacherClass["class"];
  subject?: TeacherClass["subject"];
};

export interface TeacherListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  teacherProfile: {
    id: string;
    userId: string;
    specialization?: string | null;
    registrationNumber?: string | null;
    isActive: boolean;
  };
  scheduledMinutes: number;
  scheduledClassCount: number;
}

type ApiTeacherListItem = {
  id: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  } | null;
  specialization?: string | null;
  registrationNumber?: string | null;
  isActive: boolean;
  scheduledMinutes?: number;
  scheduledClassCount?: number;
};

type TeacherListResponse = {
  data: ApiTeacherListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
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
   * Lista professores com a carga atual calculada pela grade horária.
   */
  async findAll(
    params: {
      page?: number;
      limit?: number;
      institutionId?: string;
      search?: string;
      isActive?: boolean;
    } = {},
  ): Promise<{
    data: TeacherListItem[];
    meta: TeacherListResponse["meta"];
  }> {
    const response = await api.get<TeacherListResponse>("/teachers", {
      params,
    });
    const result = response as unknown as TeacherListResponse;

    return {
      data: (result.data ?? []).map((item) => ({
        id: item.user?.id ?? item.id,
        firstName: item.user?.firstName ?? "",
        lastName: item.user?.lastName ?? "",
        email: item.user?.email ?? "",
        avatar: item.user?.avatar ?? null,
        teacherProfile: {
          id: item.id,
          userId: item.user?.id ?? "",
          specialization: item.specialization,
          registrationNumber: item.registrationNumber,
          isActive: item.isActive,
        },
        scheduledMinutes: item.scheduledMinutes ?? 0,
        scheduledClassCount: item.scheduledClassCount ?? 0,
      })),
      meta: result.meta,
    };
  },

  /**
   * Listar turmas que o professor leciona
   */
  async getTeacherClasses(teacherId: string): Promise<TeacherClass[]> {
    const response = await api.get<ApiTeacherClass[]>(
      `/teachers/${teacherId}/classes`,
    );
    return (response as unknown as ApiTeacherClass[]).map((item) => ({
      id: item.classSubjectId ?? item.id,
      classSubjectId: item.classSubjectId ?? item.id,
      classId: item.classId ?? item.class?.id ?? "",
      subjectId: item.subjectId ?? item.subject?.id ?? "",
      teacherId: item.teacherId ?? teacherId,
      scheduledMinutes: item.scheduledMinutes ?? 0,
      scheduledClassCount: item.scheduledClassCount ?? 0,
      assignmentType: "subject" as const,
      assignmentLabel: item.assignmentLabel ?? "Disciplina atribuída",
      class: {
        id: item.class?.id ?? item.classId ?? "",
        name: item.class?.name ?? "",
        grade: item.class?.grade ?? "",
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
            name: item.subject.name ?? "",
            code: item.subject.code ?? undefined,
            color: item.subject.color ?? undefined,
          }
        : undefined,
    }));
  },

  /**
   * Listar disciplinas do professor
   */
  async getTeacherSubjects(
    teacherId: string,
  ): Promise<DbTeacherSubject["subject"][]> {
    const { data, error } = await supabase
      .from("teacher_subjects")
      .select("subject:subjects(id, name, code, color, description)")
      .eq("teacherId", teacherId)
      .order("createdAt", { ascending: true });

    if (error) throw error;
    return ((data ?? []) as unknown as DbTeacherSubject[])
      .map((row) => row.subject)
      .filter((subject): subject is NonNullable<DbTeacherSubject["subject"]> =>
        Boolean(subject),
      );
  },
};
