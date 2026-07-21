// Lesson Content Types
export interface LessonContent {
  id: string;
  date: string;
  title: string;
  content: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  homework?: string;
  observations?: string;
  classSubjectId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  classSubject?: {
    id: string;
    class: {
      id: string;
      name: string;
    };
    subject: {
      id: string;
      name: string;
      color?: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateLessonContentDto {
  date: string;
  title: string;
  content: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  homework?: string;
  observations?: string;
  classSubjectId: string;
  teacherId: string;
}

export interface UpdateLessonContentDto {
  date?: string;
  title?: string;
  content?: string;
  objectives?: string;
  methodology?: string;
  resources?: string;
  homework?: string;
  observations?: string;
}

// Lesson Plan Types
export enum LessonPlanStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface LessonPlan {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  objectives: string;
  content: string;
  methodology: string;
  resources: string;
  assessment: string;
  status: LessonPlanStatus;
  observations?: string;
  rejectionReason?: string;
  classSubjectId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  classSubject?: {
    id: string;
    class: {
      id: string;
      name: string;
    };
    subject: {
      id: string;
      name: string;
      color?: string;
    };
  };
  teacher?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateLessonPlanDto {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  objectives: string;
  content: string;
  methodology: string;
  resources: string;
  assessment: string;
  observations?: string;
  classSubjectId: string;
  teacherId: string;
}

export interface UpdateLessonPlanDto {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  objectives?: string;
  content?: string;
  methodology?: string;
  resources?: string;
  assessment?: string;
  observations?: string;
  status?: LessonPlanStatus;
  rejectionReason?: string;
}
