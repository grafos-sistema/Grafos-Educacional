// Announcement Types
export enum AnnouncementPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
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
  targetStudentIds?: string[];
  targetParentIds?: string[];
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
  targetStudentIds?: string[];
  targetParentIds?: string[];
  scheduledFor?: string;
  expiresAt?: string;
  attachments?: string[];
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  priority?: string;
  targetRoles?: string[];
  institutionId?: string;
  targetStudentIds?: string[];
  targetParentIds?: string[];
  scheduledFor?: string;
  expiresAt?: string;
  attachments?: string[];
}

export interface AnnouncementFilters {
  search?: string;
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
  SCHOOL_BREAK = 'SCHOOL_BREAK',
  PARENT_TEACHER_CONFERENCE = 'PARENT_TEACHER_CONFERENCE',
  SPORTS_EVENT = 'SPORTS_EVENT',
  CULTURAL_EVENT = 'CULTURAL_EVENT',
  FIELD_TRIP = 'FIELD_TRIP',
  ENROLLMENT_PERIOD = 'ENROLLMENT_PERIOD',
  REPORT_CARD = 'REPORT_CARD',
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
  locationType?: 'SCHOOL' | 'EXTERNAL' | 'ONLINE' | string;
  isAllDay: boolean;
  color?: string;
  isGeneral?: boolean;
  audienceRoles?: string[];
  courseIds?: string[];
  classIds?: string[];
  requiresRsvp?: boolean;
  attachments?: EventAttachment[];
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

export interface EventAttachment {
  path: string;
  name: string;
  mimeType: string;
  size: number;
  signedUrl?: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  location?: string;
  locationType?: 'SCHOOL' | 'EXTERNAL' | 'ONLINE' | string;
  isAllDay?: boolean;
  color?: string;
  isGeneral?: boolean;
  audienceRoles?: string[];
  courseIds?: string[];
  classIds?: string[];
  requiresRsvp?: boolean;
  attachments?: EventAttachment[];
}

export interface UpdateEventDto {
  title?: string;
  description?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  academicYearId?: string;
  location?: string;
  locationType?: 'SCHOOL' | 'EXTERNAL' | 'ONLINE' | string;
  isAllDay?: boolean;
  color?: string;
  isGeneral?: boolean;
  audienceRoles?: string[];
  courseIds?: string[];
  classIds?: string[];
  requiresRsvp?: boolean;
  attachments?: EventAttachment[];
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
