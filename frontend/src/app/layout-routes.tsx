/**
 * Lazy-loaded route components for better performance
 *
 * This file centralizes all lazy-loaded routes to enable:
 * - Code splitting
 * - Faster initial page load
 * - Better bundle optimization
 */

import { lazyWithRetry } from '@/lib/utils/performance';

// Admin routes
export const AdminDashboard = lazyWithRetry(() => import('./(authenticated)/admin/dashboard/page'));
export const AdminUsers = lazyWithRetry(() => import('./(authenticated)/admin/users/page'));
export const AdminClasses = lazyWithRetry(() => import('./(authenticated)/admin/classes/page'));
export const AdminSubjects = lazyWithRetry(() => import('./(authenticated)/admin/subjects/page'));
export const AdminCourses = lazyWithRetry(() => import('./(authenticated)/admin/courses/page'));
export const AdminAcademicYears = lazyWithRetry(() => import('./(authenticated)/admin/academic-years/page'));
export const AdminRankings = lazyWithRetry(() => import('./(authenticated)/admin/rankings/page'));
export const AdminIDEB = lazyWithRetry(() => import('./(authenticated)/admin/ideb/page'));

// Professor routes
export const ProfessorDashboard = lazyWithRetry(() => import('./(authenticated)/professor/dashboard/page'));
export const ProfessorAttendance = lazyWithRetry(() => import('./(authenticated)/professor/attendance/page'));
export const ProfessorGrades = lazyWithRetry(() => import('./(authenticated)/professor/grades/page'));
export const ProfessorLessonPlans = lazyWithRetry(() => import('./(authenticated)/professor/lesson-plans/page'));
export const ProfessorQuestionBank = lazyWithRetry(() => import('./(authenticated)/professor/question-bank/page'));
export const ProfessorSimulados = lazyWithRetry(() => import('./(authenticated)/professor/simulados/page'));

// Aluno routes
export const AlunoDashboard = lazyWithRetry(() => import('./(authenticated)/aluno/dashboard/page'));
export const AlunoGrades = lazyWithRetry(() => import('./(authenticated)/aluno/grades/page'));
export const AlunoAttendance = lazyWithRetry(() => import('./(authenticated)/aluno/attendance/page'));
export const AlunoSchedule = lazyWithRetry(() => import('./(authenticated)/aluno/schedule/page'));
export const AlunoSimulados = lazyWithRetry(() => import('./(authenticated)/aluno/simulados/page'));
export const AlunoSubjects = lazyWithRetry(() => import('./(authenticated)/aluno/subjects/page'));

// Coordinator routes
export const CoordinatorDashboard = lazyWithRetry(() => import('./(authenticated)/coordinator/dashboard/page'));
export const CoordinatorObservations = lazyWithRetry(() => import('./(authenticated)/coordinator/observations/page'));
export const CoordinatorMonitoring = lazyWithRetry(() => import('./(authenticated)/coordinator/monitoring/page'));

// Parent routes
export const ParentDashboard = lazyWithRetry(() => import('./(authenticated)/responsaveis/dashboard/page'));

// Super Admin routes
export const SuperAdminDashboard = lazyWithRetry(() => import('./(authenticated)/super-admin/dashboard/page'));
export const SuperAdminQuestions = lazyWithRetry(() => import('./(authenticated)/super-admin/questions/page'));
export const SuperAdminCategories = lazyWithRetry(() => import('./(authenticated)/super-admin/question-categories/page'));

// Common routes
export const Profile = lazyWithRetry(() => import('./(authenticated)/perfil/page'));
export const Settings = lazyWithRetry(() => import('./(authenticated)/configuracoes/page'));
export const Communication = lazyWithRetry(() => import('./(authenticated)/communication/page'));
