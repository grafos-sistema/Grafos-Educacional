'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { classesService } from '@/services/classes.service';
import { gradesService } from '@/services/grades.service';
import { attendancesService } from '@/services/attendances.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePrefetch } from '@/hooks/usePrefetch';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function AlunoDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Prefetch rotas prováveis para navegação rápida
  usePrefetch({
    routes: ['/aluno/grades', '/aluno/attendance', '/aluno/subjects', '/aluno/schedule', '/perfil'],
    delay: 2000, // Aguarda 2s após carregamento
  });

  // Buscar dados consolidados do aluno - OTIMIZADO
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-dashboard-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // Buscar turmas limitadas (estudante geralmente tem poucas turmas ativas)
        const classesResponse = await classesService.findAll({
          institutionId: user?.institutionId,
          limit: 20,
          isActive: true,
        });

        // Buscar matrículas e disciplinas em paralelo
        const enrollmentPromises = classesResponse.data.map(async (classItem) => {
          try {
            const [enrollments, subjects] = await Promise.all([
              classesService.getEnrollments(classItem.id).catch(() => []),
              classesService.getClassSubjects(classItem.id).catch(() => []),
            ]);

            const studentEnrollment = enrollments.find(e => e.studentId === user.id);

            if (studentEnrollment) {
              return {
                enrollment: { ...studentEnrollment, class: classItem },
                subjects: subjects.map(s => ({ ...s, class: classItem })),
              };
            }
            return null;
          } catch {
            return null;
          }
        });

        const results = await Promise.all(enrollmentPromises);
        const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);

        return {
          enrollments: validResults.map(r => r.enrollment),
          subjects: validResults.flatMap(r => r.subjects),
        };
      } catch (error) {
        console.error('Error fetching student data:', error);
        return null;
      }
    },
    enabled: !!user?.id && user?.role === UserRole.STUDENT,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const enrollments = studentData?.enrollments || [];
  const classSubjects = studentData?.subjects || [];

  // Fetch grades for alerts
  const { data: grades } = useQuery({
    queryKey: ['student-all-grades-dashboard', user?.studentProfile?.id],
    queryFn: async () => {
      if (!user?.studentProfile?.id) return [];
      return await gradesService.getStudentGrades(user.studentProfile.id);
    },
    enabled: !!user?.studentProfile?.id,
  });

  // Fetch attendance for alerts
  const { data: attendances } = useQuery({
    queryKey: ['student-all-attendances-dashboard', user?.studentProfile?.id],
    queryFn: async () => {
      if (!user?.studentProfile?.id) return [];
      return await attendancesService.getStudentAttendances(user.studentProfile.id);
    },
    enabled: !!user?.studentProfile?.id,
  });

  // Calculate alerts
  const alerts: Array<{
    type: string;
    severity: string;
    subjectName: string | undefined;
    message: string;
    value: string;
    color: string;
  }> = [];
  if (grades && attendances && classSubjects) {
    classSubjects.forEach((subject) => {
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

      // Check for issues
      if (averageGrade !== null && averageGrade < 6) {
        alerts.push({
          type: 'grade',
          severity: 'high',
          subjectName: subject.subject?.name,
          message: `Nota baixa em ${subject.subject?.name}`,
          value: averageGrade.toFixed(1),
          color: 'red',
        });
      }

      if (attendanceRate !== null && attendanceRate < 60) {
        alerts.push({
          type: 'attendance',
          severity: 'high',
          subjectName: subject.subject?.name,
          message: `Presença crítica em ${subject.subject?.name}`,
          value: `${attendanceRate.toFixed(0)}%`,
          color: 'red',
        });
      } else if (attendanceRate !== null && attendanceRate < 75) {
        alerts.push({
          type: 'attendance',
          severity: 'medium',
          subjectName: subject.subject?.name,
          message: `Atenção na presença em ${subject.subject?.name}`,
          value: `${attendanceRate.toFixed(0)}%`,
          color: 'yellow',
        });
      }
    });
  }

  // Calcular estatísticas
  const totalClasses = enrollments?.length || 0;
  const totalSubjects = classSubjects?.length || 0;
  const totalTeachers = new Set(classSubjects?.map(s => s.teacherId)).size;

  const stats = [
    {
      name: 'Minhas Turmas',
      value: totalClasses,
      subtitle: totalClasses > 0 ? 'Matriculado' : 'Sem matrícula',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      href: '/aluno/classes',
    },
    {
      name: 'Disciplinas',
      value: totalSubjects,
      subtitle: 'Total de matérias',
      icon: BookOpenIcon,
      color: 'bg-green-500',
      href: '/aluno/subjects',
    },
    {
      name: 'Professores',
      value: totalTeachers,
      subtitle: 'Lecionam para mim',
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Frequência',
      value: '-',
      subtitle: 'Em desenvolvimento',
      icon: ClockIcon,
      color: 'bg-orange-500',
      href: '/aluno/attendance',
    },
  ];

  const quickActions = [
    {
      title: 'Minhas Notas',
      description: 'Ver notas de todas as disciplinas',
      icon: ClipboardDocumentCheckIcon,
      href: '/aluno/grades',
      color: 'bg-green-500',
    },
    {
      title: 'Frequência',
      description: 'Acompanhar presença nas aulas',
      icon: ClockIcon,
      href: '/aluno/attendance',
      color: 'bg-blue-500',
    },
    {
      title: 'Horário',
      description: 'Ver grade de horários',
      icon: CalendarDaysIcon,
      href: '/aluno/schedule',
      color: 'bg-purple-500',
    },
    {
      title: 'Disciplinas',
      description: 'Ver todas as disciplinas',
      icon: BookOpenIcon,
      href: '/aluno/subjects',
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
          Portal do Aluno
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Olá, {user.firstName}! Bem-vindo ao seu portal.
        </p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="bg-gradient-to-r from-yellow-50 to-red-50 dark:from-yellow-900/10 dark:to-red-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Alertas de Desempenho
                </h3>
                <div className="space-y-2">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between px-3 py-2 rounded-md ${
                        alert.color === 'red'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{alert.message}</span>
                      <span className="text-sm font-bold">{alert.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                  {alerts.length === 1
                    ? '1 alerta encontrado'
                    : `${alerts.length} alertas encontrados`}
                  . Acesse suas disciplinas para mais detalhes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          Acesso Rápido
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
      {classSubjects && classSubjects.length > 0 && grades && (
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart - Performance by Subject */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Desempenho por Disciplina
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={classSubjects.slice(0, 6).map((subject) => {
                  const subjectGrades = grades.filter(
                    (g: any) => g.classSubjectId === subject.id && g.status === 'PUBLISHED'
                  );
                  const avgGrade = subjectGrades.length > 0
                    ? subjectGrades.reduce((sum: number, g: any) => sum + g.value, 0) / subjectGrades.length
                    : 0;
                  return {
                    subject: subject.subject?.name?.substring(0, 10) || 'N/A',
                    nota: Math.round(avgGrade * 10) / 10,
                    fullMark: 10,
                  };
                })}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} />
                  <Radar
                    name="Suas Notas"
                    dataKey="nota"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart - Grades by Subject */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrophyIcon className="h-5 w-5 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notas por Matéria
                </h2>
              </div>
              <BarChart
                data={classSubjects.map((subject) => {
                  const subjectGrades = grades.filter(
                    (g: any) => g.classSubjectId === subject.id && g.status === 'PUBLISHED'
                  );
                  const avgGrade = subjectGrades.length > 0
                    ? subjectGrades.reduce((sum: number, g: any) => sum + g.value, 0) / subjectGrades.length
                    : 0;
                  return {
                    materia: subject.subject?.name?.substring(0, 15) || 'N/A',
                    'Nota Média': Math.round(avgGrade * 10) / 10,
                  };
                })}
                xKey="materia"
                yKeys={[
                  { key: 'Nota Média', name: 'Nota Média', color: '#10B981' },
                ]}
                height={300}
              />
            </div>
          </div>

          {/* Attendance Distribution */}
          {attendances && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClockIcon className="h-5 w-5 text-purple-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Distribuição de Frequência
                  </h2>
                </div>
                <PieChart
                  data={[
                    {
                      name: 'Presente',
                      value: attendances.filter((a: any) => a.status === 'PRESENT').length,
                    },
                    {
                      name: 'Ausente',
                      value: attendances.filter((a: any) => a.status === 'ABSENT').length,
                    },
                    {
                      name: 'Atrasado',
                      value: attendances.filter((a: any) => a.status === 'LATE').length,
                    },
                    {
                      name: 'Justificado',
                      value: attendances.filter((a: any) => a.status === 'EXCUSED').length,
                    },
                  ].filter((item) => item.value > 0)}
                  colors={['#10B981', '#EF4444', '#F59E0B', '#3B82F6']}
                  height={300}
                />
              </div>

              {/* Summary Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AcademicCapIcon className="h-5 w-5 text-orange-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resumo de Desempenho
                  </h2>
                </div>
                <div className="space-y-4">
                  {classSubjects.map((subject) => {
                    const subjectGrades = grades.filter(
                      (g: any) => g.classSubjectId === subject.id && g.status === 'PUBLISHED'
                    );
                    const avgGrade = subjectGrades.length > 0
                      ? subjectGrades.reduce((sum: number, g: any) => sum + g.value, 0) / subjectGrades.length
                      : 0;

                    const subjectAttendances = attendances.filter((a: any) => a.classSubjectId === subject.id);
                    const presentCount = subjectAttendances.filter((a: any) => a.status === 'PRESENT').length;
                    const attendanceRate = subjectAttendances.length > 0
                      ? (presentCount / subjectAttendances.length) * 100
                      : 0;

                    return (
                      <div key={subject.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {subject.subject?.name}
                          </span>
                          <Badge
                            variant={avgGrade >= 7 ? 'success' : avgGrade >= 5 ? 'warning' : 'error'}
                            size="sm"
                          >
                            {avgGrade >= 7 ? 'Ótimo' : avgGrade >= 5 ? 'Regular' : 'Atenção'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Média: </span>
                            <span className={`font-semibold ${
                              avgGrade >= 7 ? 'text-green-600' :
                              avgGrade >= 5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {avgGrade.toFixed(1)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Presença: </span>
                            <span className={`font-semibold ${
                              attendanceRate >= 85 ? 'text-green-600' :
                              attendanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {attendanceRate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Classes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Minhas Turmas
            </h2>
            {enrollments && enrollments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/aluno/classes')}
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
          ) : enrollments && enrollments.length > 0 ? (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <UserGroupIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {enrollment.class.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {enrollment.class.course?.name} • {enrollment.class.grade}
                      </div>
                    </div>
                    <Badge
                      variant={enrollment.class.isActive ? 'success' : 'error'}
                      size="sm"
                    >
                      {enrollment.class.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                Você ainda não está matriculado em nenhuma turma
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                Entre em contato com a secretaria
              </p>
            </div>
          )}
        </div>

        {/* My Subjects */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Minhas Disciplinas
            </h2>
            {classSubjects && classSubjects.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/aluno/subjects')}
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
          ) : classSubjects && classSubjects.length > 0 ? (
            <div className="space-y-2">
              {classSubjects.slice(0, 5).map((subject) => (
                <div
                  key={subject.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center gap-3"
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: subject.subject?.color
                        ? `${subject.subject.color}20`
                        : '#E5E7EB',
                    }}
                  >
                    <BookOpenIcon
                      className="h-5 w-5"
                      style={{ color: subject.subject?.color || '#6B7280' }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {subject.subject?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Prof. {subject.teacher?.firstName} {subject.teacher?.lastName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma disciplina encontrada
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
