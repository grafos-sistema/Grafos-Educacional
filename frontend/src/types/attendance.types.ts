// Attendance Types

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export interface Attendance {
  id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
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

  classId: string;
  class?: {
    id: string;
    name: string;
    grade: string;
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

export interface CreateAttendanceDto {
  date: string;
  status: AttendanceStatus;
  notes?: string;
  studentId: string;
  classId: string;
  classSubjectId: string;
  teacherId: string;
}

export interface UpdateAttendanceDto {
  status?: AttendanceStatus;
  notes?: string;
}

export interface BulkAttendanceDto {
  date: string;
  classId: string;
  classSubjectId: string;
  teacherId: string;
  attendances: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

export interface AttendanceFilters {
  studentId?: string;
  classId?: string;
  classSubjectId?: string;
  teacherId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  attendanceRate: number;
}
