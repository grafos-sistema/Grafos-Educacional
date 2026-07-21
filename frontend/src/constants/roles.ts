import { UserRole } from '@/types/user.types';

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrador',
  [UserRole.INSTITUTION_ADMIN]: 'Administrador da Instituição',
  [UserRole.COORDINATOR]: 'Coordenador',
  [UserRole.TEACHER]: 'Professor',
  [UserRole.STUDENT]: 'Aluno',
  [UserRole.PARENT]: 'Responsável',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-800',
  [UserRole.INSTITUTION_ADMIN]: 'bg-blue-100 text-blue-800',
  [UserRole.COORDINATOR]: 'bg-green-100 text-green-800',
  [UserRole.TEACHER]: 'bg-yellow-100 text-yellow-800',
  [UserRole.STUDENT]: 'bg-orange-100 text-orange-800',
  [UserRole.PARENT]: 'bg-pink-100 text-pink-800',
};

// Role hierarchy - higher index = more permissions
export const ROLE_HIERARCHY = [
  UserRole.STUDENT,
  UserRole.PARENT,
  UserRole.TEACHER,
  UserRole.COORDINATOR,
  UserRole.INSTITUTION_ADMIN,
  UserRole.SUPER_ADMIN,
];

// Permission system
export enum Permission {
  // Users
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  EDIT_USERS = 'EDIT_USERS',
  DELETE_USERS = 'DELETE_USERS',

  // Institutions
  VIEW_INSTITUTIONS = 'VIEW_INSTITUTIONS',
  CREATE_INSTITUTIONS = 'CREATE_INSTITUTIONS',
  EDIT_INSTITUTIONS = 'EDIT_INSTITUTIONS',
  DELETE_INSTITUTIONS = 'DELETE_INSTITUTIONS',

  // Students
  VIEW_STUDENTS = 'VIEW_STUDENTS',
  CREATE_STUDENTS = 'CREATE_STUDENTS',
  EDIT_STUDENTS = 'EDIT_STUDENTS',
  DELETE_STUDENTS = 'DELETE_STUDENTS',
  VIEW_OWN_STUDENT_DATA = 'VIEW_OWN_STUDENT_DATA',

  // Teachers
  VIEW_TEACHERS = 'VIEW_TEACHERS',
  CREATE_TEACHERS = 'CREATE_TEACHERS',
  EDIT_TEACHERS = 'EDIT_TEACHERS',
  DELETE_TEACHERS = 'DELETE_TEACHERS',

  // Classes
  VIEW_CLASSES = 'VIEW_CLASSES',
  CREATE_CLASSES = 'CREATE_CLASSES',
  EDIT_CLASSES = 'EDIT_CLASSES',
  DELETE_CLASSES = 'DELETE_CLASSES',
  VIEW_OWN_CLASSES = 'VIEW_OWN_CLASSES',

  // Subjects
  VIEW_SUBJECTS = 'VIEW_SUBJECTS',
  CREATE_SUBJECTS = 'CREATE_SUBJECTS',
  EDIT_SUBJECTS = 'EDIT_SUBJECTS',
  DELETE_SUBJECTS = 'DELETE_SUBJECTS',

  // Grades
  VIEW_GRADES = 'VIEW_GRADES',
  CREATE_GRADES = 'CREATE_GRADES',
  EDIT_GRADES = 'EDIT_GRADES',
  DELETE_GRADES = 'DELETE_GRADES',
  PUBLISH_GRADES = 'PUBLISH_GRADES',
  VIEW_OWN_GRADES = 'VIEW_OWN_GRADES',

  // Attendance
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',
  CREATE_ATTENDANCE = 'CREATE_ATTENDANCE',
  EDIT_ATTENDANCE = 'EDIT_ATTENDANCE',
  DELETE_ATTENDANCE = 'DELETE_ATTENDANCE',
  VIEW_OWN_ATTENDANCE = 'VIEW_OWN_ATTENDANCE',

  // Content
  VIEW_CONTENT = 'VIEW_CONTENT',
  CREATE_CONTENT = 'CREATE_CONTENT',
  EDIT_CONTENT = 'EDIT_CONTENT',
  DELETE_CONTENT = 'DELETE_CONTENT',

  // Activities
  VIEW_ACTIVITIES = 'VIEW_ACTIVITIES',
  CREATE_ACTIVITIES = 'CREATE_ACTIVITIES',
  EDIT_ACTIVITIES = 'EDIT_ACTIVITIES',
  DELETE_ACTIVITIES = 'DELETE_ACTIVITIES',

  // Reports
  VIEW_REPORTS = 'VIEW_REPORTS',
  GENERATE_REPORTS = 'GENERATE_REPORTS',

  // Dashboard
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
}

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),

  [UserRole.INSTITUTION_ADMIN]: [
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.VIEW_STUDENTS,
    Permission.CREATE_STUDENTS,
    Permission.EDIT_STUDENTS,
    Permission.DELETE_STUDENTS,
    Permission.VIEW_TEACHERS,
    Permission.CREATE_TEACHERS,
    Permission.EDIT_TEACHERS,
    Permission.DELETE_TEACHERS,
    Permission.VIEW_CLASSES,
    Permission.CREATE_CLASSES,
    Permission.EDIT_CLASSES,
    Permission.DELETE_CLASSES,
    Permission.VIEW_SUBJECTS,
    Permission.CREATE_SUBJECTS,
    Permission.EDIT_SUBJECTS,
    Permission.DELETE_SUBJECTS,
    Permission.VIEW_GRADES,
    Permission.PUBLISH_GRADES,
    Permission.VIEW_ATTENDANCE,
    Permission.VIEW_CONTENT,
    Permission.VIEW_ACTIVITIES,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_DASHBOARD,
  ],

  [UserRole.COORDINATOR]: [
    Permission.VIEW_USERS,
    Permission.VIEW_STUDENTS,
    Permission.CREATE_STUDENTS,
    Permission.EDIT_STUDENTS,
    Permission.VIEW_TEACHERS,
    Permission.VIEW_CLASSES,
    Permission.CREATE_CLASSES,
    Permission.EDIT_CLASSES,
    Permission.VIEW_SUBJECTS,
    Permission.VIEW_GRADES,
    Permission.PUBLISH_GRADES,
    Permission.VIEW_ATTENDANCE,
    Permission.VIEW_CONTENT,
    Permission.VIEW_ACTIVITIES,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_DASHBOARD,
  ],

  [UserRole.TEACHER]: [
    Permission.VIEW_STUDENTS,
    Permission.VIEW_TEACHERS,
    Permission.VIEW_OWN_CLASSES,
    Permission.VIEW_SUBJECTS,
    Permission.VIEW_GRADES,
    Permission.CREATE_GRADES,
    Permission.EDIT_GRADES,
    Permission.VIEW_ATTENDANCE,
    Permission.CREATE_ATTENDANCE,
    Permission.EDIT_ATTENDANCE,
    Permission.VIEW_CONTENT,
    Permission.CREATE_CONTENT,
    Permission.EDIT_CONTENT,
    Permission.VIEW_ACTIVITIES,
    Permission.CREATE_ACTIVITIES,
    Permission.EDIT_ACTIVITIES,
    Permission.VIEW_REPORTS,
    Permission.VIEW_DASHBOARD,
  ],

  [UserRole.STUDENT]: [
    Permission.VIEW_OWN_STUDENT_DATA,
    Permission.VIEW_OWN_CLASSES,
    Permission.VIEW_OWN_GRADES,
    Permission.VIEW_OWN_ATTENDANCE,
    Permission.VIEW_CONTENT,
    Permission.VIEW_ACTIVITIES,
    Permission.VIEW_DASHBOARD,
  ],

  [UserRole.PARENT]: [
    Permission.VIEW_OWN_STUDENT_DATA,
    Permission.VIEW_OWN_GRADES,
    Permission.VIEW_OWN_ATTENDANCE,
    Permission.VIEW_CONTENT,
    Permission.VIEW_DASHBOARD,
  ],
};

// Helper functions
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission));
}

export function isRoleHigherOrEqual(userRole: UserRole, compareRole: UserRole): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const compareIndex = ROLE_HIERARCHY.indexOf(compareRole);
  return userIndex >= compareIndex;
}

export function canManageRole(userRole: UserRole, targetRole: UserRole): boolean {
  // Super admin can manage all roles
  if (userRole === UserRole.SUPER_ADMIN) return true;

  // Institution admin can manage all except super admin
  if (userRole === UserRole.INSTITUTION_ADMIN && targetRole !== UserRole.SUPER_ADMIN) {
    return true;
  }

  return false;
}
