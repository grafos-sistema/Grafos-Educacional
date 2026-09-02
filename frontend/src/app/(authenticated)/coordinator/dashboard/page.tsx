'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { lessonPlansService } from '@/services/lesson-plans.service';
import { classesService } from '@/services/classes.service';
import { usersService } from '@/services/users.service';
import { LessonPlanStatus } from '@/types/lesson.types';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  DashboardEmpty,
  DashboardPageHeader,
  DashboardSection,
  DashboardStat,
} from '@/components/dashboard/DashboardUI';

export default function CoordinatorDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: lessonPlans, isLoading: loadingPlans } = useQuery({
    queryKey: ['lesson-plans-all', user?.institutionId],
    queryFn: async () => (await lessonPlansService.findAll({ limit: 100 })).data || [],
    enabled: !!user?.institutionId,
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes-all', user?.institutionId],
    queryFn: () => classesService.findAll({ institutionId: user?.institutionId, limit: 100 }),
    enabled: !!user?.institutionId,
  });

  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers', user?.institutionId],
    queryFn: () => usersService.findAll({ institutionId: user?.institutionId, role: UserRole.TEACHER, limit: 100 }),
    enabled: !!user?.institutionId,
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', user?.institutionId],
    queryFn: () => usersService.findAll({ institutionId: user?.institutionId, role: UserRole.STUDENT, limit: 100 }),
    enabled: !!user?.institutionId,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  const isLoading = loadingPlans || loadingClasses || loadingTeachers || loadingStudents;
  const pendingPlans = lessonPlans?.filter((plan) => plan.status === LessonPlanStatus.SUBMITTED).slice(0, 6) || [];
  const pendingCount = lessonPlans?.filter((plan) => plan.status === LessonPlanStatus.SUBMITTED).length || 0;
  const approvedCount = lessonPlans?.filter((plan) => plan.status === LessonPlanStatus.APPROVED).length || 0;

  const accessLinks = [
    {
      title: 'Aprovar planos de aula',
      description: pendingCount > 0 ? `${pendingCount} aguardando análise` : 'Nenhum plano pendente',
      icon: DocumentTextIcon,
      href: '/coordinator/lesson-plans',
      count: pendingCount,
    },
    {
      title: 'Monitorar desempenho',
      description: 'Acompanhe notas e frequência',
      icon: ClipboardDocumentListIcon,
      href: '/coordinator/monitoring',
    },
    {
      title: 'Professores',
      description: 'Disciplinas e turmas vinculadas',
      icon: AcademicCapIcon,
      href: '/coordinator/professores',
      count: teachersData?.meta.total || 0,
    },
    {
      title: 'Alunos',
      description: 'Consultar alunos da instituição',
      icon: UserGroupIcon,
      href: '/coordinator/alunos',
      count: studentsData?.meta.total || 0,
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Coordenação pedagógica"
        title={`Olá, ${user.firstName}`}
        description="Veja o que precisa de acompanhamento e acesse as rotinas pedagógicas."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="Planos pendentes"
          value={pendingCount}
          helper={`${approvedCount} aprovados`}
          icon={DocumentTextIcon}
          tone="amber"
          onClick={() => router.push('/coordinator/lesson-plans')}
        />
        <DashboardStat
          label="Turmas"
          value={classesData?.meta.total || 0}
          helper="Turmas da instituição"
          icon={UsersIcon}
          tone="blue"
          onClick={() => router.push('/admin/classes')}
        />
        <DashboardStat
          label="Professores"
          value={teachersData?.meta.total || 0}
          helper="Corpo docente"
          icon={AcademicCapIcon}
          tone="green"
          onClick={() => router.push('/coordinator/professores')}
        />
        <DashboardStat
          label="Alunos"
          value={studentsData?.meta.total || 0}
          helper="Alunos cadastrados"
          icon={UserGroupIcon}
          tone="purple"
          onClick={() => router.push('/coordinator/alunos')}
        />
      </div>

      {isLoading ? (
        <DashboardSection title="Acompanhamento" description="Carregando as informações pedagógicas...">
          <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
        </DashboardSection>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <DashboardSection
            title="Acompanhe agora"
            description="Planos de aula enviados pelos professores para análise."
            action={
              <Button variant="ghost" size="sm" onClick={() => router.push('/coordinator/lesson-plans')} rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
                Ver todos
              </Button>
            }
          >
            {pendingPlans.length === 0 ? (
              <DashboardEmpty
                icon={CheckCircleIcon}
                title="Tudo em dia"
                description="Não há planos de aula aguardando aprovação."
              />
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingPlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => router.push('/coordinator/lesson-plans')}
                    className="flex w-full items-start gap-3 py-3 text-left first:pt-0 last:pb-0"
                  >
                    <span className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      <DocumentTextIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{plan.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>{plan.teacher?.user?.firstName} {plan.teacher?.user?.lastName}</span>
                        <span className="inline-flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />{new Date(plan.startDate).toLocaleDateString('pt-BR')}</span>
                      </span>
                    </span>
                    <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </DashboardSection>

          <DashboardSection title="Acessos pedagógicos" description="Rotinas usadas pela coordenação.">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {accessLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.title}
                    type="button"
                    onClick={() => router.push(link.href)}
                    className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
                  >
                    <span className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Icon className="h-5 w-5" aria-hidden="true" /></span>
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
      )}
    </div>
  );
}
