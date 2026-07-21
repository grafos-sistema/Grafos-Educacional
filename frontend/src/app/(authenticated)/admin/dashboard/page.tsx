'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { subjectsService } from '@/services/subjects.service';
import { UserRole } from '@/types/user.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePrefetch } from '@/hooks/usePrefetch';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Prefetch rotas prováveis para navegação rápida
  usePrefetch({
    routes: ['/admin/users', '/admin/classes', '/admin/subjects', '/perfil', '/configuracoes'],
    delay: 2000, // Aguarda 2s após carregamento
  });

  // Buscar estatísticas de estudantes
  const { data: studentsData } = useQuery({
    queryKey: ['students-stats', user?.institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.STUDENT,
        limit: 1,
      }),
    enabled: !!user?.institutionId,
  });

  // Buscar estatísticas de professores
  const { data: teachersData } = useQuery({
    queryKey: ['teachers-stats', user?.institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.TEACHER,
        limit: 1,
      }),
    enabled: !!user?.institutionId,
  });

  // Buscar estatísticas de turmas
  const { data: classesData } = useQuery({
    queryKey: ['classes-stats', user?.institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId: user?.institutionId,
        limit: 1,
      }),
    enabled: !!user?.institutionId,
  });

  // Buscar estatísticas de cursos
  const { data: coursesData } = useQuery({
    queryKey: ['courses-stats', user?.institutionId],
    queryFn: () =>
      coursesService.findAll({
        institutionId: user?.institutionId,
        limit: 1,
      }),
    enabled: !!user?.institutionId,
  });

  // Buscar turmas recentes
  const { data: recentClasses, isLoading: loadingClasses } = useQuery({
    queryKey: ['recent-classes', user?.institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId: user?.institutionId,
        limit: 5,
        page: 1,
      }),
    enabled: !!user?.institutionId,
  });

  const stats = [
    {
      name: 'Total de Alunos',
      value: studentsData?.meta.total || 0,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      href: '/admin/users?role=STUDENT',
    },
    {
      name: 'Professores',
      value: teachersData?.meta.total || 0,
      icon: AcademicCapIcon,
      color: 'bg-green-500',
      href: '/admin/users?role=TEACHER',
    },
    {
      name: 'Turmas',
      value: classesData?.meta.total || 0,
      icon: UsersIcon,
      color: 'bg-purple-500',
      href: '/admin/classes',
    },
    {
      name: 'Cursos',
      value: coursesData?.meta.total || 0,
      icon: BuildingLibraryIcon,
      color: 'bg-orange-500',
      href: '/admin/courses',
    },
  ];

  const quickActions = [
    {
      title: 'Novo Usuário',
      description: 'Cadastrar aluno, professor ou responsável',
      icon: UserGroupIcon,
      href: '/admin/users/new',
      color: 'bg-blue-500',
    },
    {
      title: 'Nova Turma',
      description: 'Criar uma nova turma',
      icon: UsersIcon,
      href: '/admin/classes/new',
      color: 'bg-purple-500',
    },
    {
      title: 'Novo Curso',
      description: 'Cadastrar um novo curso',
      icon: BuildingLibraryIcon,
      href: '/admin/courses/new',
      color: 'bg-orange-500',
    },
    {
      title: 'Nova Disciplina',
      description: 'Adicionar uma disciplina',
      icon: BookOpenIcon,
      href: '/admin/subjects/new',
      color: 'bg-green-500',
    },
  ];

  const managementLinks = [
    {
      title: 'Usuários',
      description: 'Gerenciar alunos, professores e responsáveis',
      icon: UserGroupIcon,
      href: '/admin/users',
      count: (studentsData?.meta.total || 0) + (teachersData?.meta.total || 0),
    },
    {
      title: 'Turmas',
      description: 'Gerenciar turmas e matrículas',
      icon: UsersIcon,
      href: '/admin/classes',
      count: classesData?.meta.total || 0,
    },
    {
      title: 'Cursos',
      description: 'Gerenciar cursos oferecidos',
      icon: BuildingLibraryIcon,
      href: '/admin/courses',
      count: coursesData?.meta.total || 0,
    },
    {
      title: 'Disciplinas',
      description: 'Gerenciar disciplinas',
      icon: BookOpenIcon,
      href: '/admin/subjects',
      count: 0,
    },
    {
      title: 'Anos Letivos',
      description: 'Gerenciar períodos acadêmicos',
      icon: CalendarIcon,
      href: '/admin/academic-years',
      count: 0,
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
          Painel Administrativo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Bem-vindo de volta, {user.firstName}! Aqui está um resumo da sua instituição.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.name}
              onClick={() => router.push(stat.href)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <ArrowTrendingUpIcon className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {stat.name}
              </h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString('pt-BR')}
              </p>
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

      {/* Visualizações Administrativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribuição de Usuários */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            Distribuição de Usuários
          </h2>
          <PieChart
            data={[
              {
                name: 'Alunos',
                value: studentsData?.meta.total || 0,
              },
              {
                name: 'Professores',
                value: teachersData?.meta.total || 0,
              },
            ].filter((item) => item.value > 0)}
            colors={['#3B82F6', '#8B5CF6']}
            height={250}
          />
        </div>

        {/* Overview de Recursos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BuildingLibraryIcon className="h-5 w-5 text-green-600" />
            Recursos Institucionais
          </h2>
          <BarChart
            data={[
              { recurso: 'Turmas', 'Quantidade': classesData?.meta.total || 0 },
              { recurso: 'Cursos', 'Quantidade': coursesData?.meta.total || 0 },
            ]}
            xKey="recurso"
            yKeys={[
              { key: 'Quantidade', name: 'Total', color: '#10B981' },
            ]}
            height={250}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Classes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Turmas Recentes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/classes')}
            >
              Ver todas
            </Button>
          </div>

          {loadingClasses ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" />
            </div>
          ) : recentClasses && recentClasses.data.length > 0 ? (
            <div className="space-y-3">
              {recentClasses.data.map((classItem) => (
                <button
                  key={classItem.id}
                  onClick={() => router.push(`/admin/classes/${classItem.id}`)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                      <UsersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {classItem.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {classItem.course?.name} • {classItem.grade}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={classItem.isActive ? 'success' : 'error'} size="sm">
                      {classItem.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {classItem._count?.enrollments || 0} alunos
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma turma cadastrada
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/admin/classes/new')}
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="mt-3"
              >
                Criar primeira turma
              </Button>
            </div>
          )}
        </div>

        {/* Management Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Gerenciamento
          </h2>
          <div className="space-y-2">
            {managementLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.title}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {link.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {link.description}
                      </div>
                    </div>
                  </div>
                  {link.count > 0 && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
