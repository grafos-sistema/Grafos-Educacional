'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  BookOpenIcon,
  UserIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { classesService } from '@/services/classes.service';
import { gradesService } from '@/services/grades.service';
import { attendancesService } from '@/services/attendances.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Class } from '@/types/class.types';

interface SubjectStats {
  subjectId: string;
  averageGrade: number | null;
  attendanceRate: number | null;
  totalClasses: number;
  presentCount: number;
}

const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch student's classes
  // TODO: Need proper API endpoint to fetch student's enrolled classes
  const { data: classes, isLoading: loadingClasses } = useQuery<Class[]>({
    queryKey: ['student-classes', user?.id],
    queryFn: async (): Promise<Class[]> => {
      // Temporary: Return empty until proper endpoint is available
      return [];
    },
    enabled: !!user?.id,
  });

  // Fetch subjects for each class
  const { data: allSubjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['student-all-subjects', classes?.map((c) => c.id)],
    queryFn: async () => {
      if (!classes || classes.length === 0) return [];

      const subjectsPromises = classes.map(async (classItem) => {
        try {
          const subjects = await classesService.getClassSubjects(classItem.id);
          return subjects.map((subject) => ({
            ...subject,
            class: classItem,
          }));
        } catch {
          return [];
        }
      });

      const subjectsArrays = await Promise.all(subjectsPromises);
      return subjectsArrays.flat();
    },
    enabled: !!classes && classes.length > 0,
  });

  // Fetch grades for statistics
  const { data: grades } = useQuery({
    queryKey: ['student-all-grades', user?.studentProfile?.id],
    queryFn: async () => {
      if (!user?.studentProfile?.id) return [];
      return await gradesService.getStudentGrades(user.studentProfile.id);
    },
    enabled: !!user?.studentProfile?.id,
  });

  // Fetch attendance for statistics
  const { data: attendances } = useQuery({
    queryKey: ['student-all-attendances', user?.studentProfile?.id],
    queryFn: async () => {
      if (!user?.studentProfile?.id) return [];
      return await attendancesService.getStudentAttendances(user.studentProfile.id);
    },
    enabled: !!user?.studentProfile?.id,
  });

  // Calculate statistics per subject
  const subjectStats = new Map<string, SubjectStats>();

  if (grades && attendances && allSubjects) {
    allSubjects.forEach((subject) => {
      // Calculate average grade
      const subjectGrades = grades.filter(
        (g) => g.classSubjectId === subject.id && g.status === 'PUBLISHED'
      );
      const averageGrade =
        subjectGrades.length > 0
          ? subjectGrades.reduce((sum, g) => sum + g.value * g.weight, 0) /
            subjectGrades.reduce((sum, g) => sum + g.weight, 0)
          : null;

      // Calculate attendance rate
      const subjectAttendances = attendances.filter((a) => a.classSubjectId === subject.id);
      const presentCount = subjectAttendances.filter((a) => a.status === 'PRESENT').length;
      const attendanceRate =
        subjectAttendances.length > 0 ? (presentCount / subjectAttendances.length) * 100 : null;

      subjectStats.set(subject.id, {
        subjectId: subject.id,
        averageGrade,
        attendanceRate,
        totalClasses: subjectAttendances.length,
        presentCount,
      });
    });
  }

  const isLoading = loadingClasses || loadingSubjects;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/aluno/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Minhas Disciplinas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualize todas as disciplinas que você está cursando
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando disciplinas..." />
        </div>
      ) : allSubjects && allSubjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allSubjects.map((subject) => {
            const stats = subjectStats.get(subject.id);
            const gradeColor =
              stats?.averageGrade !== null && stats?.averageGrade !== undefined
                ? stats.averageGrade >= 7
                  ? 'text-green-600 dark:text-green-400'
                  : stats.averageGrade >= 5
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
                : 'text-gray-400';

            const attendanceColor =
              stats?.attendanceRate !== null && stats?.attendanceRate !== undefined
                ? stats.attendanceRate >= 75
                  ? 'text-green-600 dark:text-green-400'
                  : stats.attendanceRate >= 60
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
                : 'text-gray-400';

            // Check for warnings
            const hasLowGrade =
              stats?.averageGrade !== null &&
              stats?.averageGrade !== undefined &&
              stats.averageGrade < 6;
            const hasLowAttendance =
              stats?.attendanceRate !== null &&
              stats?.attendanceRate !== undefined &&
              stats.attendanceRate < 75;
            const hasCriticalAttendance =
              stats?.attendanceRate !== null &&
              stats?.attendanceRate !== undefined &&
              stats.attendanceRate < 60;

            return (
              <div
                key={subject.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Subject Header */}
                <div
                  className="p-4 border-l-4"
                  style={{
                    borderLeftColor: subject.subject?.color || '#6B7280',
                    backgroundColor: subject.subject?.color
                      ? `${subject.subject.color}10`
                      : '#F3F4F6',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        backgroundColor: subject.subject?.color
                          ? `${subject.subject.color}20`
                          : '#E5E7EB',
                      }}
                    >
                      <BookOpenIcon
                        className="h-6 w-6"
                        style={{ color: subject.subject?.color || '#6B7280' }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {subject.subject?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {subject.subject?.code && `${subject.subject.code} • `}
                        {subject.class?.name}
                      </p>
                      {/* Warning Badges */}
                      {(hasLowGrade || hasLowAttendance) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {hasLowGrade && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              Nota baixa ({stats?.averageGrade?.toFixed(1)})
                            </span>
                          )}
                          {hasCriticalAttendance ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              Presença crítica ({stats?.attendanceRate?.toFixed(0)}%)
                            </span>
                          ) : (
                            hasLowAttendance && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                                Atenção na presença ({stats?.attendanceRate?.toFixed(0)}%)
                              </span>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject Details */}
                <div className="p-4 space-y-4">
                  {/* Teacher */}
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {subject.teacher?.firstName} {subject.teacher?.lastName}
                    </span>
                  </div>

                  {/* TODO: Schedule section removed - not yet implemented in backend */}

                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Average Grade */}
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <ChartBarIcon className="h-4 w-4" />
                        <span>Média</span>
                      </div>
                      <div className={`text-xl font-bold ${gradeColor}`}>
                        {stats?.averageGrade !== null && stats?.averageGrade !== undefined
                          ? stats.averageGrade.toFixed(1)
                          : '--'}
                      </div>
                    </div>

                    {/* Attendance Rate */}
                    <div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Presença</span>
                      </div>
                      <div className={`text-xl font-bold ${attendanceColor}`}>
                        {stats?.attendanceRate !== null && stats?.attendanceRate !== undefined
                          ? `${stats.attendanceRate.toFixed(0)}%`
                          : '--'}
                      </div>
                      {stats?.totalClasses && stats.totalClasses > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {stats.presentCount} / {stats.totalClasses} aulas
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/aluno/grades')}
                      className="text-xs"
                    >
                      Ver Notas
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/aluno/attendance')}
                      className="text-xs"
                    >
                      Ver Frequência
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <AcademicCapIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Nenhuma disciplina encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Você ainda não está matriculado em nenhuma disciplina
          </p>
        </div>
      )}
    </div>
  );
}
