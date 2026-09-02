'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { UserRole } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { parentsService, ParentStudent } from '@/services/parents.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import {
  DashboardAvatar,
  DashboardEmpty,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatus,
} from '@/components/dashboard/DashboardUI';

export default function PaisDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const activeRole = user?.activeProfile ?? user?.role;

  const { data: parentProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['parent-profile', user?.id],
    queryFn: () => usersService.findOne(user!.id),
    enabled: !!user?.id && activeRole === UserRole.PARENT,
  });

  const { data: children, isLoading: loadingChildren } = useQuery<ParentStudent[]>({
    queryKey: ['parent-children', parentProfile?.parentProfile?.id],
    queryFn: () => parentsService.getChildren(parentProfile!.parentProfile!.id),
    enabled: !!parentProfile?.parentProfile?.id,
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  const isLoading = loadingProfile || loadingChildren;
  const selectedChild = children?.find((child) => child.student.id === selectedChildId) || children?.[0];

  const openChildSection = (section: 'grades' | 'attendance' | 'schedule' | 'subjects') => {
    const childId = selectedChild?.student.userId;
    if (!childId) return;

    const destination = section === 'subjects'
      ? `/responsaveis/children/${childId}`
      : `/responsaveis/children/${childId}/${section}`;
    router.push(destination);
  };

  const childLinks = [
    { title: 'Notas', description: 'Acompanhe as avaliações', icon: ClipboardDocumentCheckIcon, section: 'grades' as const },
    { title: 'Frequência', description: 'Veja a presença', icon: CalendarDaysIcon, section: 'attendance' as const },
    { title: 'Horários', description: 'Consulte a grade', icon: ClockIcon, section: 'schedule' as const },
    { title: 'Disciplinas', description: 'Veja as matérias', icon: AcademicCapIcon, section: 'subjects' as const },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Portal da família"
        title={`Olá, ${user.firstName}`}
        description="Acompanhe os principais dados escolares dos seus filhos."
      />

      {isLoading ? (
        <DashboardSection title="Meus filhos" description="Carregando os vínculos escolares...">
          <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
        </DashboardSection>
      ) : !children || children.length === 0 ? (
        <DashboardSection title="Meus filhos">
          <DashboardEmpty
            icon={UserGroupIcon}
            title="Nenhum filho vinculado"
            description="Quando o vínculo for realizado pela secretaria, os dados do aluno aparecerão aqui."
          />
        </DashboardSection>
      ) : (
        <>
          {children.length > 1 && (
            <DashboardSection title="Selecione um filho" description="Escolha qual aluno deseja acompanhar.">
              <div className="flex flex-wrap gap-2">
                {children.map((child) => {
                  const isSelected = (selectedChild?.student.id || '') === child.student.id;
                  return (
                    <button
                      key={child.student.id}
                      type="button"
                      onClick={() => setSelectedChildId(child.student.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition ${isSelected ? 'border-primary-500 bg-primary-50 text-primary-800 dark:border-primary-400 dark:bg-primary-950/40 dark:text-primary-200' : 'border-slate-200 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'}`}
                    >
                      <DashboardAvatar src={child.student.avatar} firstName={child.student.firstName} lastName={child.student.lastName} size="sm" />
                      <span className="text-sm font-medium">{child.student.firstName} {child.student.lastName}</span>
                    </button>
                  );
                })}
              </div>
            </DashboardSection>
          )}

          {selectedChild && (
            <DashboardSection
              title="Aluno selecionado"
              description="Acesse as informações do período letivo atual."
              action={
                <Button variant="ghost" size="sm" onClick={() => router.push(`/responsaveis/children/${selectedChild.student.userId}`)} rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
                  Ver detalhes
                </Button>
              }
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <DashboardAvatar src={selectedChild.student.avatar} firstName={selectedChild.student.firstName} lastName={selectedChild.student.lastName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-white">{selectedChild.student.firstName} {selectedChild.student.lastName}</h2>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                      {selectedChild.enrollments[0]?.class.name || 'Sem turma vinculada'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <DashboardStatus tone={selectedChild.student.isActive ? 'green' : 'slate'}>
                        {selectedChild.student.isActive ? 'Aluno ativo' : 'Aluno inativo'}
                      </DashboardStatus>
                      <span className="text-xs text-slate-500 dark:text-slate-400">Matrícula {selectedChild.student.registrationNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
                  <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Turmas</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedChild.enrollments.length}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Disciplinas</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedChild.subjectsCount}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Alertas</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{selectedChild.alerts.length}</p>
                  </div>
                </div>
              </div>
            </DashboardSection>
          )}

          <DashboardSection title="Acompanhar aluno" description="Escolha uma área para consultar agora.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {childLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.title}
                    type="button"
                    onClick={() => openChildSection(link.section)}
                    className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
                  >
                    <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700 group-hover:bg-primary-100 group-hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-primary-950 dark:group-hover:text-primary-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">{link.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{link.description}</span>
                    </span>
                    <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </DashboardSection>

          {children.length > 1 && (
            <DashboardSection title="Resumo dos filhos" description="Selecione outro aluno acima para trocar o acompanhamento.">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {children.map((child) => (
                  <button
                    key={child.student.id}
                    type="button"
                    onClick={() => setSelectedChildId(child.student.id)}
                    className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
                  >
                    <DashboardAvatar src={child.student.avatar} firstName={child.student.firstName} lastName={child.student.lastName} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{child.student.firstName} {child.student.lastName}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{child.enrollments[0]?.class.name || 'Sem turma vinculada'}</span>
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{child.alerts.length} alertas</span>
                    <ArrowRightIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </DashboardSection>
          )}
        </>
      )}
    </div>
  );
}
