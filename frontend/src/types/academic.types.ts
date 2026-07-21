export enum AcademicPeriodType {
  SEMESTER = 'SEMESTER',
  TRIMESTER = 'TRIMESTER',
  QUARTER = 'QUARTER',
  BIMESTER = 'BIMESTER',
  ANNUAL = 'ANNUAL',
}

export interface AcademicPeriod {
  id: string;
  name: string;
  type: AcademicPeriodType;
  startDate: string;
  endDate: string;
  orderNumber: number;
  isActive: boolean;
  academicYearId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  institutionId: string;
  createdAt: string;
  updatedAt: string;
  periods?: AcademicPeriod[];
}

export interface AcademicYearDeleteImpact {
  academicYearId: string;
  name: string;
  year: number;
  directRelations: {
    periods: number;
    classes: number;
    events: number;
  };
  dependentRelations: {
    lessonPlans: number;
    grades: number;
    enrollments: number;
    schedules: number;
    attendances: number;
    activities: number;
    rankings: number;
    examAssignments: number;
  };
  samples: {
    periods: Array<{ id: string; name: string; isActive: boolean }>;
    classes: Array<{ id: string; name: string; isActive: boolean }>;
    events: Array<{ id: string; title: string; startDate: string }>;
  };
}

export interface CreateAcademicYearDto {
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  institutionId: string;
  isActive?: boolean;
}

export interface UpdateAcademicYearDto {
  year?: number;
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CreateAcademicPeriodDto {
  name: string;
  type: AcademicPeriodType;
  startDate: string;
  endDate: string;
  orderNumber: number;
  academicYearId: string;
  isActive?: boolean;
}

export interface UpdateAcademicPeriodDto {
  name?: string;
  type?: AcademicPeriodType;
  startDate?: string;
  endDate?: string;
  orderNumber?: number;
  isActive?: boolean;
}

export interface PaginatedAcademicYears {
  data: AcademicYear[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PaginatedAcademicPeriods {
  data: AcademicPeriod[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
