export enum ObservationType {
  PEDAGOGICAL = 'PEDAGOGICAL',
  BEHAVIORAL = 'BEHAVIORAL',
  SOCIAL = 'SOCIAL',
  HEALTH = 'HEALTH',
  OTHER = 'OTHER',
}

export enum ObservationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Observation {
  id: string;
  studentId: string;
  authorId: string;
  type: ObservationType;
  priority: ObservationPriority;
  title: string;
  description: string;
  isPrivate: boolean;
  date: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  student?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
    registrationNumber: string;
  };
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CreateObservationDto {
  studentId: string;
  type: ObservationType;
  priority: ObservationPriority;
  title: string;
  description: string;
  isPrivate?: boolean;
  date: string;
}

export interface UpdateObservationDto {
  type?: ObservationType;
  priority?: ObservationPriority;
  title?: string;
  description?: string;
  isPrivate?: boolean;
  date?: string;
}

export interface ObservationFilters {
  studentId?: string;
  authorId?: string;
  type?: ObservationType;
  priority?: ObservationPriority;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
