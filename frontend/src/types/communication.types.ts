// Announcement Types
export enum AnnouncementPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Legacy target enum for backwards compatibility
export enum AnnouncementTarget {
  ALL = 'ALL',
  TEACHERS = 'TEACHERS',
  STUDENTS = 'STUDENTS',
  PARENTS = 'PARENTS',
  COORDINATORS = 'COORDINATORS',
  SPECIFIC_CLASS = 'SPECIFIC_CLASS',
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetRoles: string[];
  isPublished: boolean;
  publishedAt?: string;
  expiresAt?: string;
  attachments?: string;
  institutionId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  institution?: {
    id: string;
    name: string;
  };
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  priority: string;
  targetRoles: string[];
  institutionId: string;
  expiresAt?: string;
  attachments?: string[];
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  priority?: string;
  targetRoles?: string[];
  institutionId?: string;
  expiresAt?: string;
  attachments?: string[];
}

export interface AnnouncementFilters {
  targetRole?: string;
  priority?: string;
  onlyPublished?: boolean;
  onlyActive?: boolean;
  institutionId?: string;
  page?: number;
  limit?: number;
}

// Event Types
export enum EventType {
  MEETING = 'MEETING',
  EXAM = 'EXAM',
  HOLIDAY = 'HOLIDAY',
  SCHOOL_EVENT = 'SCHOOL_EVENT',
  PARENT_MEETING = 'PARENT_MEETING',
  SPORTS = 'SPORTS',
  CULTURAL = 'CULTURAL',
  OTHER = 'OTHER',
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isAllDay: boolean;
  color?: string;
  academicYearId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  academicYear?: {
    id: string;
    name: string;
    institution?: {
      id: string;
      name: string;
    };
  };
}

export interface CreateEventDto {
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  location?: string;
  isAllDay?: boolean;
  color?: string;
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  academicYearId?: string;
  location?: string;
  isAllDay?: boolean;
  color?: string;
}

export interface EventFilters {
  type?: string;
  institutionId?: string;
  academicYearId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}
