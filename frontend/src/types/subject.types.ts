export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  isActive: boolean;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  classSubjects?: Array<{
    id: string;
    scheduledMinutes?: number;
    scheduledClassCount?: number;
    schedules?: Array<{
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    class?: {
      id: string;
      name: string;
      grade?: string;
      section?: string | null;
      shift?: string | null;
      isActive?: boolean;
      course?: { id: string; name: string } | null;
    };
    teacher?: {
      id: string;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email?: string | null;
        phone?: string | null;
        avatar?: string | null;
      } | null;
    } | null;
  }>;
}

export interface CreateSubjectDto {
  name: string;
  code?: string;
  description?: string;
  color?: string;
  institutionId: string;
  isActive?: boolean;
}

export interface UpdateSubjectDto {
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface PaginatedSubjects {
  data: Subject[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
