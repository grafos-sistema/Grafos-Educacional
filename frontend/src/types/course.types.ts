export interface Course {
  id: string;
  name: string;
  description?: string;
  code?: string;
  level?: string;
  duration?: number;
  isActive: boolean;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  name: string;
  description?: string;
  code?: string;
  level?: string;
  duration?: number;
  institutionId: string;
  isActive?: boolean;
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  code?: string;
  level?: string;
  duration?: number;
  isActive?: boolean;
}

export interface PaginatedCourses {
  data: Course[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
