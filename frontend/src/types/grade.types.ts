// Grade Types

export enum GradeStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  FINAL = 'FINAL',
}

export interface Grade {
  id: string;
  value: number;
  weight: number;
  examType: string;
  examDate?: string;
  description?: string;
  status: GradeStatus;
  publishedAt?: string;
  observations?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  studentId: string;
  student?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      name: string;
      avatar?: string;
    };
  };

  classSubjectId: string;
  classSubject?: {
    id: string;
    subject: {
      id: string;
      name: string;
      code?: string;
      color?: string;
    };
    class: {
      id: string;
      name: string;
      grade: string;
    };
  };

  academicPeriodId: string;
  academicPeriod?: {
    id: string;
    name: string;
    type: string;
    orderNumber: number;
  };

  teacherId: string;
  teacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      name: string;
    };
  };
}

export interface CreateGradeDto {
  value: number;
  weight?: number;
  examType: string;
  examDate?: string;
  description?: string;
  status?: GradeStatus;
  observations?: string;
  studentId: string;
  classSubjectId: string;
  academicPeriodId: string;
  teacherId: string;
}

export interface UpdateGradeDto {
  value?: number;
  weight?: number;
  examType?: string;
  examDate?: string;
  description?: string;
  status?: GradeStatus;
  publishedAt?: string;
  observations?: string;
}

export interface BulkGradeDto {
  examType: string;
  examDate?: string;
  description?: string;
  weight?: number;
  classSubjectId: string;
  academicPeriodId: string;
  teacherId: string;
  grades: {
    studentId: string;
    value: number;
    observations?: string;
  }[];
}

export interface GradeFilters {
  studentId?: string;
  classSubjectId?: string;
  academicPeriodId?: string;
  teacherId?: string;
  status?: GradeStatus;
  examType?: string;
  page?: number;
  limit?: number;
}

export interface StudentGradeReport {
  student: {
    id: string;
    name: string;
    registrationNumber: string;
  };
  subject: {
    id: string;
    name: string;
    color?: string;
  };
  period: {
    id: string;
    name: string;
  };
  grades: Grade[];
  average: number;
  totalWeight: number;
  status: 'approved' | 'failed' | 'pending';
}

export interface GradeStats {
  totalGrades: number;
  average: number;
  highest: number;
  lowest: number;
  approvedCount: number;
  failedCount: number;
  pendingCount: number;
}
