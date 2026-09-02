'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  PlusIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { classesService } from '@/services/classes.service';
import { coursesService } from '@/services/courses.service';
import { UserRole } from '@/types/user.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import {
  DashboardEmpty,
  DashboardPageHeader,
  DashboardSection,
  DashboardStat,
} from '@/components/dashboard/DashboardUI';
import { usePrefetch } from '@/hooks/usePrefetch';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();

  usePrefetch({
    routes: ['/admin/users', '/admin/classes', '/admin/subjects', '/perfil', '/configuracoes'],
    delay: 2000,
  });

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

  const { data: classesData } = useQuery({
    queryKey: ['classes-stats', user?.institutionId],
    queryFn: () => classesService.findAll({ institutionId: user?.institutionId, limit: 1 }),
    enabled: !!user?.institutionId,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses-stats', user?.institutionId],
    queryFn: () => coursesService.findAll({ institutionId: user?.institutionId, limit: 1 }),
    enabled: !!user?.institutionId,
  });

  const { data: recentClasses, isLoading: loadingClasses } = useQuery({
    queryKey: ['recent-classes', user?.institutionId],
    queryFn: () => classesService.findAll({ institutionId: user?.institutionId, limit: 5, page: 1 }),
    enabled: !!user?.institutionId,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  const shortcuts = [
    {
      title: 'Novo usuário',
      description: 'Aluno, professor ou responsável',
      icon: UserGroupIcon,
      href: '/admin/users/new',
    },
    {
      title: 'Nova turma',
      description: 'Organize uma nova turma',
      icon: UsersIcon,
      href: '/admin/classes/new',
    },
    {
      title: 'Novo curso',
      description: 'Cadastre um curso',
      icon: BuildingLibraryIcon,
      href: '/admin/courses/new',
    },
    {
      title: 'Nova disciplina',
      description: 'Adicione uma disciplina',
      icon: BookOpenIcon,
      href: '/admin/subjects/new',
    },
  ];

  const managementLinks = [
    {
      title: 'Usuários',
      description: 'Alunos, professores e responsáveis',
      icon: UserGroupIcon,
      href: '/admin/users',
      count: (studentsData?.meta.total || 0) + (teachersData?.meta.total || 0),
    },
    {
      title: 'Turmas',
      description: 'Turmas e matrículas',
      icon: UsersIcon,
      href: '/admin/classes',
      count: classesData?.meta.total || 0,
    },
    {
      title: 'Cursos',
      description: 'Cursos oferecidos pela instituição',
      icon: BuildingLibraryIcon,
      href: '/admin/courses',
      count: coursesData?.meta.total || 0,
    },
    {
      title: 'Disciplinas',
      description: 'Componentes curriculares',
      icon: BookOpenIcon,
      href: '/admin/subjects',
    },
    {
      title: 'Anos letivos',
      description: 'Períodos acadêmicos',
      icon: CalendarIcon,
      href: '/admin/academic-years',
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Gestão escolar"
        title={`Olá, ${user.firstName}`}
        description="Acompanhe a estrutura da instituição e acesse as tarefas mais frequentes."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="Alunos ativos"
          value={(studentsData?.meta.total || 0).toLocaleString('pt-BR')}
          helper="Acessar alunos"
          icon={UserGroupIcon}
          tone="blue"
          onClick={() => router.push('/admin/users?role=STUDENT')}
        />
        <DashboardStat
          label="Professores"
          value={(teachersData?.meta.total || 0).toLocaleString('pt-BR')}
          helper="Acessar professores"
          icon={AcademicCapIcon}
          tone="green"
          onClick={() => router.push('/admin/users?role=TEACHER')}
        />
        <DashboardStat
          label="Turmas"
          value={(classesData?.meta.total || 0).toLocaleString('pt-BR')}
          helper="Gerenciar turmas"
          icon={UsersIcon}
          tone="purple"
          onClick={() => router.push('/admin/classes')}
        />
        <DashboardStat
          label="Cursos"
          value={(coursesData?.meta.total || 0).toLocaleString('pt-BR')}
          helper="Gerenciar cursos"
          icon={BuildingLibraryIcon}
          tone="amber"
          onClick={() => router.push('/admin/courses')}
        />
      </div>

      <DashboardSection
        title="Atalhos"
        description="Comece por uma tarefa comum da rotina escolar."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <button
                key={shortcut.title}
                type="button"
                onClick={() => router.push(shortcut.href)}
                className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
              >
                <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700 transition group-hover:bg-primary-100 group-hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-primary-950 dark:group-hover:text-primary-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{shortcut.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{shortcut.description}</span>
                </span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </DashboardSection>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardSection
          title="Turmas recentes"
          description="Acesse rapidamente as últimas turmas cadastradas."
          action={
            <Button variant="ghost" size="sm" onClick={() => router.push('/admin/classes')} rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
              Ver todas
            </Button>
          }
        >
          {loadingClasses ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
          ) : recentClasses && recentClasses.data.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentClasses.data.map((classItem) => (
                <button
                  key={classItem.id}
                  type="button"
                  onClick={() => router.push(`/admin/classes/${classItem.id}`)}
                  className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
                >
                  <span className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <UsersIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{classItem.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                      {classItem.course?.name || 'Curso não informado'}{classItem.grade ? ` · ${classItem.grade}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{classItem._count?.enrollments || 0} alunos</span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <DashboardEmpty
              icon={UsersIcon}
              title="Nenhuma turma cadastrada"
              description="Crie a primeira turma para começar a organizar as matrículas."
              action={<Button size="sm" onClick={() => router.push('/admin/classes/new')} leftIcon={<PlusIcon className="h-4 w-4" />}>Criar turma</Button>}
            />
          )}
        </DashboardSection>

        <DashboardSection title="Gerenciamento" description="Acesse os cadastros estruturais da instituição.">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {managementLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.title}
                  type="button"
                  onClick={() => router.push(link.href)}
                  className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
                >
                  <Icon className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900 dark:text-white">{link.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{link.description}</span>
                  </span>
                  {link.count !== undefined && <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{link.count}</span>}
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </DashboardSection>
      </div>
    </div>
  );
}
