'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { usersService } from '@/services/users.service';
import { gradesService } from '@/services/grades.service';
import { attendancesService } from '@/services/attendances.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AttendanceStatus } from '@/types/attendance.types';

export default function CoordinatorMonitoringPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedClassId, setSelectedClassId] = useState('');

  // Buscar turmas
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-monitoring', user?.institutionId],
    queryFn: async () => {
      const response = await classesService.findAll({
        institutionId: user?.institutionId,
        limit: 100,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  // Buscar alunos da turma selecionada
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments-monitoring', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      return await classesService.getEnrollments(selectedClassId);
    },
    enabled: !!selectedClassId,
  });

  // Buscar disciplinas da turma selecionada
  const { data: classSubjects, isLoading: loadingSubjects } = useQuery({
    queryKey: ['class-subjects-monitoring', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      return await classesService.getClassSubjects(selectedClassId);
    },
    enabled: !!selectedClassId,
  });

  // Buscar notas da turma
  const { data: classGrades, isLoading: loadingGrades } = useQuery({
    queryKey: ['class-grades-monitoring', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId || !classSubjects || classSubjects.length === 0) return [];

      const allGrades = await Promise.all(
        classSubjects.map(async (cs) => {
          try {
            return await gradesService.getClassSubjectGrades(cs.id);
          } catch {
            return [];
          }
        })
      );

      return allGrades.flat();
    },
    enabled: !!selectedClassId && !!classSubjects && classSubjects.length > 0,
  });

  // Buscar frequências da turma
  const { data: classAttendances, isLoading: loadingAttendances } = useQuery({
    queryKey: ['class-attendances-monitoring', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId || !classSubjects || classSubjects.length === 0) return [];

      const allAttendances = await Promise.all(
        classSubjects.map(async (cs) => {
          try {
            return await attendancesService.getClassSubjectAttendances(cs.id);
          } catch {
            return [];
          }
        })
      );

      return allAttendances.flat();
    },
    enabled: !!selectedClassId && !!classSubjects && classSubjects.length > 0,
  });

  const selectedClass = classesData?.data.find((c) => c.id === selectedClassId);

  const isLoading = loadingClasses || loadingEnrollments || loadingSubjects || loadingGrades || loadingAttendances;

  // Calcular estatísticas reais
  const stats = useMemo(() => {
    const totalStudents = enrollments?.length || 0;

    // Calcular média geral de notas
    const averageGrade = classGrades && classGrades.length > 0
      ? classGrades.reduce((sum, g) => sum + (g.value || 0), 0) / classGrades.length
      : 0;

    // Calcular taxa média de presença
    const totalAttendances = classAttendances?.length || 0;
    const presentCount = classAttendances?.filter(
      a => a.status === AttendanceStatus.PRESENT
    ).length || 0;
    const averageAttendance = totalAttendances > 0
      ? (presentCount / totalAttendances) * 100
      : 0;

    // Calcular alunos em risco (média < 6 OU presença < 75%)
    const studentsAtRisk = enrollments?.filter(enrollment => {
      const studentGrades = classGrades?.filter(g => g.studentId === enrollment.studentId) || [];
      const studentAvg = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + (g.value || 0), 0) / studentGrades.length
        : 0;

      const studentAttendances = classAttendances?.filter(a => a.studentId === enrollment.studentId) || [];
      const studentTotal = studentAttendances.length;
      const studentPresent = studentAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
      const studentAttendanceRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0;

      return studentAvg < 6 || studentAttendanceRate < 75;
    }).length || 0;

    return {
      totalStudents,
      studentsAtRisk,
      averageAttendance,
      averageGrade,
    };
  }, [enrollments, classGrades, classAttendances]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/coordinator/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Monitoramento de Desempenho
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Acompanhe o desempenho acadêmico dos alunos
            </p>
          </div>
        </div>
      </div>

      {/* Filtro de Turma */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <Select
          label="Selecione uma Turma"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          required
          options={[
            { value: '', label: 'Selecione...' },
            ...(classesData?.data.map((classItem) => ({
              value: classItem.id,
              label: `${classItem.name} - ${classItem.academicYear?.year}`,
            })) || []),
          ]}
        />
      </div>

      {!selectedClassId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Selecione uma turma
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Escolha uma turma para visualizar as estatísticas de desempenho
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Carregando dados..." />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <UserGroupIcon className="h-8 w-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.totalStudents}</div>
              <div className="text-blue-100 text-sm">Total de Alunos</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 opacity-80" />
                {stats.studentsAtRisk > 0 && (
                  <Badge variant="error" className="bg-white/20 text-white border-white/30">
                    Alerta
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold mb-1">{stats.studentsAtRisk}</div>
              <div className="text-red-100 text-sm">Alunos em Risco</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <CheckCircleIcon className="h-8 w-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">{stats.averageAttendance}%</div>
              <div className="text-green-100 text-sm">Frequência Média</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <ChartBarIcon className="h-8 w-8 opacity-80" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {stats.averageGrade.toFixed(1)}
              </div>
              <div className="text-purple-100 text-sm">Média Geral</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alunos Necessitando Atenção */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Alunos Necessitando Atenção
                </h2>
              </div>

              {stats.studentsAtRisk === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Todos os alunos estão com desempenho satisfatório
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrollments
                    ?.filter(enrollment => {
                      // Filtrar alunos realmente em risco
                      const studentGrades = classGrades?.filter(g => g.studentId === enrollment.studentId) || [];
                      const studentAvg = studentGrades.length > 0
                        ? studentGrades.reduce((sum, g) => sum + (g.value || 0), 0) / studentGrades.length
                        : 0;

                      const studentAttendances = classAttendances?.filter(a => a.studentId === enrollment.studentId) || [];
                      const studentTotal = studentAttendances.length;
                      const studentPresent = studentAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
                      const studentAttendanceRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0;

                      return studentAvg < 6 || studentAttendanceRate < 75;
                    })
                    .slice(0, 5)
                    .map((enrollment) => {
                      // Calcular dados reais do aluno
                      const studentGrades = classGrades?.filter(g => g.studentId === enrollment.studentId) || [];
                      const studentAvg = studentGrades.length > 0
                        ? studentGrades.reduce((sum, g) => sum + (g.value || 0), 0) / studentGrades.length
                        : 0;

                      const studentAttendances = classAttendances?.filter(a => a.studentId === enrollment.studentId) || [];
                      const studentTotal = studentAttendances.length;
                      const studentPresent = studentAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
                      const studentAttendanceRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0;

                      const issues = [];
                      if (studentAvg < 6) issues.push('notas baixas');
                      if (studentAttendanceRate < 75) issues.push('frequência crítica');

                      return (
                      <div
                        key={enrollment.id}
                        className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {enrollment.student?.firstName}{' '}
                            {enrollment.student?.lastName}
                          </h3>
                          <Badge variant="error" size="sm">
                            Atenção
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>Média: {studentAvg.toFixed(1)}</span>
                          <span>Frequência: {studentAttendanceRate.toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                          {issues.length > 0 ? issues.join(' e ') : 'Atenção necessária'}
                        </p>
                      </div>
                      );
                    })}
                  {stats.studentsAtRisk > 5 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      + {stats.studentsAtRisk - 5} aluno(s) necessitando atenção
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Disciplinas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <AcademicCapIcon className="h-6 w-6 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Disciplinas da Turma
                </h2>
              </div>

              {!classSubjects || classSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    Nenhuma disciplina atribuída
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {classSubjects.map((classSubject, index) => {
                    // Calcular média real da disciplina
                    const subjectGrades = classGrades?.filter(g => g.classSubjectId === classSubject.id) || [];
                    const subjectAverage = subjectGrades.length > 0
                      ? subjectGrades.reduce((sum, g) => sum + (g.value || 0), 0) / subjectGrades.length
                      : 0;
                    const isLow = subjectAverage < 6;

                    return (
                      <div
                        key={classSubject.id}
                        className={`p-4 rounded-lg border ${
                          isLow
                            ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {classSubject.subject?.name}
                          </h3>
                          {isLow && (
                            <Badge variant="warning" size="sm">
                              Baixo
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Prof. {classSubject.teacher?.firstName}{' '}
                          {classSubject.teacher?.lastName}
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span
                            className={
                              isLow
                                ? 'text-yellow-700 dark:text-yellow-300'
                                : 'text-green-700 dark:text-green-300'
                            }
                          >
                            Média: {subjectAverage.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lista Completa de Alunos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <UserGroupIcon className="h-6 w-6 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Todos os Alunos da Turma
              </h2>
            </div>

            {!enrollments || enrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum aluno matriculado nesta turma
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Média
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Frequência
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {enrollments.map((enrollment, index) => {
                      // Calcular média e presença reais do aluno
                      const studentGrades = classGrades?.filter(g => g.studentId === enrollment.studentId) || [];
                      const studentAverage = studentGrades.length > 0
                        ? studentGrades.reduce((sum, g) => sum + (g.value || 0), 0) / studentGrades.length
                        : 0;

                      const studentAttendances = classAttendances?.filter(a => a.studentId === enrollment.studentId) || [];
                      const studentTotal = studentAttendances.length;
                      const studentPresent = studentAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
                      const studentAttendanceRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0;

                      const isAtRisk = studentAverage < 6 || studentAttendanceRate < 75;

                      return (
                        <tr
                          key={enrollment.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {enrollment.student?.firstName}{' '}
                            {enrollment.student?.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            -
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={
                                studentAverage < 6
                                  ? 'text-red-600 dark:text-red-400 font-semibold'
                                  : 'text-gray-900 dark:text-white'
                              }
                            >
                              {studentAverage.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={
                                studentAttendanceRate < 75
                                  ? 'text-red-600 dark:text-red-400 font-semibold'
                                  : 'text-gray-900 dark:text-white'
                              }
                            >
                              {studentAttendanceRate.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {isAtRisk ? (
                              <Badge variant="error" size="sm">
                                Atenção
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Normal
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
