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
