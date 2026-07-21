'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { lessonPlansService } from '@/services/lesson-plans.service';
import { classesService } from '@/services/classes.service';
import { usersService } from '@/services/users.service';
import { LessonPlanStatus } from '@/types/lesson.types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Buscar planos de aula pendentes
  const { data: lessonPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['lesson-plans-all', user?.institutionId],
    queryFn: async () => {
      const response = await lessonPlansService.findAll({
        limit: 100,
      });
      return response.data || [];
    },
    enabled: !!user?.institutionId,
  });

  // Buscar turmas
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-all', user?.institutionId],
    queryFn: async () => {
      const response = await classesService.findAll({
        institutionId: user?.institutionId,
        limit: 100,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  // Buscar professores
  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', user?.institutionId],
    queryFn: async () => {
      const response = await usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.TEACHER,
        limit: 100,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  // Buscar alunos
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', user?.institutionId],
    queryFn: async () => {
      const response = await usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.STUDENT,
        limit: 100,
      });
      return response;
    },
    enabled: !!user?.institutionId,
  });

  // Calcular estatísticas
  const stats = {
    pendingPlans: lessonPlans?.filter((p) => p.status === LessonPlanStatus.SUBMITTED)
      .length || 0,
    approvedPlans: lessonPlans?.filter((p) => p.status === LessonPlanStatus.APPROVED)
      .length || 0,
    rejectedPlans: lessonPlans?.filter((p) => p.status === LessonPlanStatus.REJECTED)
      .length || 0,
    totalClasses: classesData?.meta.total || 0,
    totalTeachers: teachersData?.meta.total || 0,
    totalStudents: studentsData?.meta.total || 0,
  };

  const isLoading =
    loadingPlans || loadingClasses || loadingTeachers || loadingStudents;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando dashboard..." />
      </div>
    );
  }

  const pendingPlans = lessonPlans?.filter(
    (p) => p.status === LessonPlanStatus.SUBMITTED
  ).slice(0, 5) || [];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Pedagógico
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bem-vindo(a), {user?.firstName}! Acompanhe as atividades pedagógicas da
          instituição
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Planos Pendentes */}
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="h-8 w-8 opacity-80" />
            <Badge variant="warning" className="bg-white/20 text-white border-white/30">
              Pendente
            </Badge>
          </div>
          <div className="text-3xl font-bold mb-1">{stats.pendingPlans}</div>
          <div className="text-yellow-100 text-sm">Planos Aguardando Aprovação</div>
        </div>

        {/* Planos Aprovados */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <CheckCircleIcon className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.approvedPlans}</div>
          <div className="text-green-100 text-sm">Planos Aprovados</div>
        </div>

        {/* Turmas */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <UserGroupIcon className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalClasses}</div>
          <div className="text-blue-100 text-sm">Turmas Ativas</div>
        </div>

        {/* Professores */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <AcademicCapIcon className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold mb-1">{stats.totalTeachers}</div>
          <div className="text-purple-100 text-sm">Professores</div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="primary"
            onClick={() => router.push('/coordinator/lesson-plans')}
            leftIcon={<DocumentTextIcon className="h-5 w-5" />}
            className="justify-start"
          >
            <div className="flex items-center justify-between w-full">
              <span>Aprovar Planos</span>
              {stats.pendingPlans > 0 && (
                <Badge variant="error" size="sm">
                  {stats.pendingPlans}
                </Badge>
              )}
            </div>
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/coordinator/monitoring')}
            leftIcon={<ChartBarIcon className="h-5 w-5" />}
            className="justify-start"
          >
            Monitorar Desempenho
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push('/coordinator/observations')}
            leftIcon={<DocumentTextIcon className="h-5 w-5" />}
            className="justify-start"
          >
            Observações de Alunos
          </Button>
        </div>
      </div>

      {/* Visualizações Pedagógicas */}
      {lessonPlans && classesData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Status dos Planos de Aula */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              Status dos Planos de Aula
            </h2>
            <PieChart
              data={[
                {
                  name: 'Pendentes',
                  value: stats.pendingPlans,
                },
                {
                  name: 'Aprovados',
                  value: stats.approvedPlans,
                },
                {
                  name: 'Rejeitados',
                  value: stats.rejectedPlans,
                },
              ].filter((item) => item.value > 0)}
              colors={['#F59E0B', '#10B981', '#EF4444']}
              height={250}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingPlans}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Pendentes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.approvedPlans}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Aprovados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{stats.rejectedPlans}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Rejeitados</div>
              </div>
            </div>
          </div>

          {/* Distribuição de Turmas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-purple-600" />
              Distribuição de Turmas
            </h2>
            <BarChart
              data={(() => {
                const gradeCount: Record<string, number> = {};
                classesData?.data.forEach((cls: any) => {
                  const grade = cls.grade || 'Não definido';
                  gradeCount[grade] = (gradeCount[grade] || 0) + 1;
                });
                return Object.entries(gradeCount).map(([grade, count]) => ({
                  serie: grade,
                  'Quantidade': count,
                }));
              })()}
              xKey="serie"
              yKeys={[
                { key: 'Quantidade', name: 'Turmas', color: '#8B5CF6' },
              ]}
              height={250}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total de turmas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{stats.totalClasses}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overview de Professores e Alunos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-green-600" />
          Visão Geral da Instituição
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
            <UserGroupIcon className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalClasses}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Turmas Ativas</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {classesData?.data.filter((c: any) => c.isActive).length || 0} ativas
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
            <AcademicCapIcon className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.totalTeachers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Professores</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Corpo docente
            </div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
            <UserGroupIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.totalStudents}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Alunos Matriculados</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {stats.totalClasses > 0
                ? `~${Math.round(stats.totalStudents / stats.totalClasses)} por turma`
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planos Pendentes de Aprovação */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Planos Pendentes
            </h2>
            <Badge variant="warning">{stats.pendingPlans}</Badge>
          </div>

          {pendingPlans.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum plano pendente de aprovação
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer"
                  onClick={() => router.push('/coordinator/lesson-plans')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {plan.title}
                    </h3>
                    <Badge variant="warning" size="sm">
                      Pendente
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                    {plan.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>
                        {plan.teacher?.user?.firstName} {plan.teacher?.user?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {new Date(plan.startDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {stats.pendingPlans > 5 && (
                <Button
                  variant="ghost"
                  onClick={() => router.push('/coordinator/lesson-plans')}
                  className="w-full"
                >
                  Ver todos ({stats.pendingPlans})
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Resumo Institucional */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumo Institucional
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Alunos
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total matriculados
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalStudents}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <AcademicCapIcon className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Professores
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Corpo docente
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalTeachers}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Planos Aprovados
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Este período
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approvedPlans}
              </span>
            </div>

            {stats.rejectedPlans > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Planos Rejeitados
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Necessitam revisão
                    </p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.rejectedPlans}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
