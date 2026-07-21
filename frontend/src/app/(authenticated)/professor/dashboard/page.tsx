'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  AcademicCapIcon,
  CalendarIcon,
  UserGroupIcon,
  BookOpenIcon,
  ArrowRightIcon,
  ClockIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { gradesService } from '@/services/grades.service';
import { attendancesService } from '@/services/attendances.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePrefetch } from '@/hooks/usePrefetch';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { AttendanceStatus } from '@/types/attendance.types';

export default function ProfessorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Prefetch rotas prováveis para navegação rápida
  usePrefetch({
    routes: ['/professor/my-classes', '/professor/grades', '/professor/attendance', '/perfil', '/configuracoes'],
    delay: 2000, // Aguarda 2s após carregamento
  });

  // Buscar disciplinas configuradas pelo professor
  const { data: myConfiguredSubjects = [], isLoading: loadingMySubjects } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: () => teacherSubjectsService.getMySubjects(),
  });

  // Buscar todas as turmas da instituição
  const { data: allClasses = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['all-classes', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await classesService.findAll({
        institutionId: user.institutionId,
        isActive: true,
        limit: 200,
      });
      return response.data || [];
    },
    enabled: !!user?.institutionId,
  });

  // IDs das disciplinas configuradas para usar como dependência
  const configuredSubjectIds = myConfiguredSubjects.map(ts => ts.subjectId).sort().join(',');
  const classIds = allClasses.map(c => c.id).sort().join(',');

  // Buscar disciplinas de cada turma e filtrar pelas disciplinas configuradas
  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['classes-with-subjects', user?.institutionId, configuredSubjectIds, classIds],
    queryFn: async () => {
      if (!myConfiguredSubjects.length || !allClasses.length) return [];

      const subjectIds = myConfiguredSubjects.map(ts => ts.subjectId);

      const results = await Promise.all(
        allClasses.map(async (classItem) => {
          try {
            const classSubjects = await classesService.getClassSubjects(classItem.id);

            // Filtrar disciplinas que o professor leciona
            return classSubjects
              .filter(cs => subjectIds.includes(cs.subjectId))
              .map(cs => ({
                ...cs,
                class: classItem,
              }));
          } catch {
            return [];
          }
        })
      );

      // Deduplica por classSubject id
      const flat = results.flat();
      return flat.filter((item, index, self) =>
        index === self.findIndex(s => s.id === item.id)
      );
    },
    enabled: myConfiguredSubjects.length > 0 && allClasses.length > 0,
  });

  const isLoading = loadingMySubjects || loadingClasses || loadingSubjects;

  // IDs para dependência
  const subjectIds = teacherSubjects?.map(s => s.id).sort().join(',') || '';

  // Buscar notas e frequências para cada turma/disciplina
  const performanceQueries = useQuery({
    queryKey: ['teacher-performance', user?.id, subjectIds],
    queryFn: async () => {
      if (!teacherSubjects || teacherSubjects.length === 0) return [];

      const performanceData = await Promise.all(
        teacherSubjects.map(async (classSubject) => {
          try {
            // Buscar notas e frequências em paralelo
            const [gradesData, attendancesData] = await Promise.all([
              gradesService.getClassSubjectGrades(classSubject.id).catch(() => []),
              attendancesService.getClassSubjectAttendances(classSubject.id).catch(() => []),
            ]);

            const grades = gradesData || [];
            const attendances = attendancesData || [];

            // Calcular média de notas
            const averageGrade = grades.length > 0
              ? grades.reduce((sum, g) => sum + (g.value || 0), 0) / grades.length
              : 0;

            // Calcular taxa de presença
            const totalAttendances = attendances.length;
            const presentCount = attendances.filter(
              a => a.status === AttendanceStatus.PRESENT
            ).length;
            const attendanceRate = totalAttendances > 0
              ? (presentCount / totalAttendances) * 100
              : 0;

            return {
              classSubjectId: classSubject.id,
              className: classSubject.class?.name || 'N/A',
              subjectName: classSubject.subject?.name || 'N/A',
              averageGrade,
              attendanceRate,
              totalStudents: classSubject.class?._count?.enrollments || 0,
              totalGrades: grades.length,
            };
          } catch (error) {
            console.error(`Error fetching data for ${classSubject.id}:`, error);
            return {
              classSubjectId: classSubject.id,
              className: classSubject.class?.name || 'N/A',
              subjectName: classSubject.subject?.name || 'N/A',
              averageGrade: 0,
              attendanceRate: 0,
              totalStudents: classSubject.class?._count?.enrollments || 0,
              totalGrades: 0,
            };
          }
        })
      );

      return performanceData;
    },
    enabled: !!teacherSubjects && teacherSubjects.length > 0,
  });

  const performanceData = performanceQueries.data;

  // Calcular estatísticas
  const uniqueClasses = new Set(teacherSubjects?.map(s => s.classId)).size;
  const totalStudents = teacherSubjects?.reduce((acc, s) => {
    return acc + (s.class?._count?.enrollments || 0);
  }, 0) || 0;

  const stats = [
    {
      name: 'Minhas Turmas',
      value: uniqueClasses || 0,
      subtitle: `${totalStudents} alunos`,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      href: '/professor/my-classes',
    },
    {
      name: 'Disciplinas',
      value: myConfiguredSubjects.length,
      subtitle: `${teacherSubjects?.length || 0} aulas`,
      icon: BookOpenIcon,
      color: 'bg-green-500',
      href: '/professor/my-subjects',
    },
    {
      name: 'Carga Horária',
      value: teacherSubjects?.reduce((acc, s) => acc + (s.weeklyHours || 0), 0) || 0,
      subtitle: 'Horas/semana',
      icon: ClockIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Aulas Hoje',
      value: '-',
      subtitle: 'Em desenvolvimento',
      icon: CalendarIcon,
      color: 'bg-orange-500',
    },
  ];

  const quickActions = [
    {
      title: 'Minhas Turmas',
      description: 'Ver todas as turmas que leciono',
      icon: UserGroupIcon,
      href: '/professor/my-classes',
      color: 'bg-blue-500',
    },
    {
      title: 'Frequência',
      description: 'Lançar presença dos alunos',
      icon: ClockIcon,
      href: '/professor/attendance',
      color: 'bg-green-500',
    },
    {
      title: 'Notas',
      description: 'Registrar notas e avaliações',
      icon: AcademicCapIcon,
      href: '/professor/grades',
      color: 'bg-purple-500',
    },
    {
      title: 'Conteúdo',
      description: 'Registrar conteúdo ministrado',
      icon: BookOpenIcon,
      href: '/professor/lesson-contents',
      color: 'bg-orange-500',
    },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Portal do Professor
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bem-vindo, Prof. {user.firstName} {user.lastName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.name}
              onClick={() => stat.href && router.push(stat.href)}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 transition-all text-left ${
                stat.href ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
              }`}
              disabled={!stat.href}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.name}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="text-left bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group border border-gray-100 dark:border-gray-700"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Performance Charts */}
      {performanceData && performanceData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Average Grades Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Desempenho por Turma
              </h2>
            </div>
            <BarChart
              data={performanceData.map((p) => ({
                turma: `${p.className} - ${p.subjectName}`.substring(0, 20),
                'Média': p.averageGrade,
              }))}
              xKey="turma"
              yKeys={[
                { key: 'Média', name: 'Média de Notas', color: '#3B82F6' },
              ]}
              height={300}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Média geral:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(performanceData.reduce((sum, p) => sum + p.averageGrade, 0) / performanceData.length).toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClockIcon className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Taxa de Presença
              </h2>
            </div>
            <BarChart
              data={performanceData.map((p) => ({
                turma: `${p.className} - ${p.subjectName}`.substring(0, 20),
                'Presença (%)': p.attendanceRate,
              }))}
              xKey="turma"
              yKeys={[
                { key: 'Presença (%)', name: 'Taxa de Presença', color: '#10B981' },
              ]}
              height={300}
            />
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Média de presença:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {(performanceData.reduce((sum, p) => sum + p.attendanceRate, 0) / performanceData.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Summary Table */}
      {performanceData && performanceData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrophyIcon className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumo de Desempenho
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Turma
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Disciplina
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Alunos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Média
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Presença
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {performanceData.map((perf, index) => (
                  <tr key={`${perf.classSubjectId}-${index}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {perf.className}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {perf.subjectName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">
                      {perf.totalStudents}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`font-semibold ${
                        perf.averageGrade >= 7 ? 'text-green-600' :
                        perf.averageGrade >= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {perf.averageGrade.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <span className={`font-semibold ${
                        perf.attendanceRate >= 85 ? 'text-green-600' :
                        perf.attendanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {perf.attendanceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {perf.averageGrade >= 6 && perf.attendanceRate >= 75 ? (
                        <Badge variant="success" size="sm">Ótimo</Badge>
                      ) : perf.averageGrade >= 5 && perf.attendanceRate >= 60 ? (
                        <Badge variant="warning" size="sm">Regular</Badge>
                      ) : (
                        <Badge variant="error" size="sm">Atenção</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Classes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Minhas Turmas e Disciplinas
          </h2>
          {teacherSubjects && teacherSubjects.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/professor/my-classes')}
              rightIcon={<ArrowRightIcon className="h-4 w-4" />}
            >
              Ver todas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : teacherSubjects && teacherSubjects.length > 0 ? (
          <div className="space-y-3">
            {teacherSubjects.slice(0, 5).map((classSubject, index) => (
              <button
                key={`${classSubject.id}-${index}`}
                onClick={() => router.push(`/professor/classes/${classSubject.classId}`)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="p-2 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: classSubject.subject?.color
                        ? `${classSubject.subject.color}20`
                        : '#E5E7EB',
                    }}
                  >
                    <BookOpenIcon
                      className="h-5 w-5"
                      style={{ color: classSubject.subject?.color || '#6B7280' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {classSubject.subject?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {classSubject.class?.name}
                      {classSubject.weeklyHours && ` • ${classSubject.weeklyHours}h/semana`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={classSubject.class?.isActive ? 'success' : 'error'}
                    size="sm"
                  >
                    {classSubject.class?.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {classSubject.class?._count?.enrollments || 0} alunos
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
              Você ainda não está atribuído a nenhuma turma
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs">
              Entre em contato com o administrador
            </p>
          </div>
        )}
      </div>
    </>
  );
}
