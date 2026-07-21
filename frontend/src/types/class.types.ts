import { Subject } from './subject.types';
import { User } from './user.types';

export interface Class {
  id: string;
  name: string;
  grade: string;
  section?: string;
  shift?: string;
  maxStudents?: number;
  isActive: boolean;
  institutionId: string;
  courseId: string;
  academicYearId: string;
  mainTeacherId?: string;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    name: string;
  };
  academicYear?: {
    id: string;
    name: string;
    year: number;
  };
  mainTeacher?: {
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  _count?: {
    enrollments: number;
  };
}

export interface ClassSubject {
  id: string;
  weeklyHours?: number;
  classId: string;
  subjectId: string;
  teacherId: string;
  subject?: Subject;
  teacher?: User;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollment {
  id: string;
  enrollmentDate: string;
  isActive: boolean;
  classId: string;
  studentId: string;
  student?: {
    id: string;
    userId: string;
    registrationNumber: string;
    enrollmentNumber?: string;
    isActive: boolean;
    firstName: string;
    lastName: string;
    email: string;
    cpf?: string;
    avatar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassDto {
  name: string;
  grade: string;
  section?: string;
  shift?: string;
  maxStudents?: number;
  institutionId: string;
  courseId: string;
  academicYearId: string;
  mainTeacherId?: string;
  isActive?: boolean;
}

export interface UpdateClassDto {
  name?: string;
  grade?: string;
  section?: string;
  shift?: string;
  maxStudents?: number;
  courseId?: string;
  academicYearId?: string;
  mainTeacherId?: string;
  isActive?: boolean;
}

export interface CreateClassSubjectDto {
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours?: number;
}

export interface CreateClassEnrollmentDto {
  classId: string;
  studentId: string;
}

export interface PaginatedClasses {
  data: Class[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
