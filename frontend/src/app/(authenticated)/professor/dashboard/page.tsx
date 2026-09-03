'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useTeacherClassSubjects } from '@/hooks/useTeacherClassSubjects';
import { useTeacherSubjects } from '@/hooks/useTeacherSubjects';
import { formatScheduleLoad } from '@/lib/schedule-load';
import { ROLE_LABELS } from '@/constants/roles';
import {
  DashboardEmpty,
  DashboardPageHeader,
  DashboardSection,
  DashboardStat,
} from '@/components/dashboard/DashboardUI';

export default function ProfessorDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: teacherSubjects = [], isLoading } = useTeacherClassSubjects();
  const {
    data: assignedSubjects = [],
    isLoading: isLoadingAssignedSubjects,
  } = useTeacherSubjects();

  const classGroups = useMemo(() => {
    const groups = new Map<string, {
      classId: string;
      name: string;
      grade?: string;
      studentCount: number;
      subjects: string[];
    }>();

    teacherSubjects.forEach((item) => {
      const existing = groups.get(item.classId);
      const subjectName = item.subject?.name || 'Disciplina não informada';
      if (existing) {
        if (!existing.subjects.includes(subjectName)) existing.subjects.push(subjectName);
        return;
      }

      groups.set(item.classId, {
        classId: item.classId,
        name: item.class?.name || 'Turma sem nome',
        grade: item.class?.grade,
        studentCount: item.class?._count?.enrollments || 0,
        subjects: [subjectName],
      });
    });

    return Array.from(groups.values());
  }, [teacherSubjects]);

  const scheduledMinutes = teacherSubjects.reduce((total, item) => total + (item.scheduledMinutes ?? 0), 0);
  const scheduledClassCount = teacherSubjects.reduce((total, item) => total + (item.scheduledClassCount ?? 0), 0);
  const totalStudents = classGroups.reduce((total, group) => total + group.studentCount, 0);
  const totalSubjects = new Set(assignedSubjects.map((item) => item.subjectId)).size;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    );
  }

  const routines = [
    {
      title: 'Lançar frequência',
      description: 'Registre a presença da turma na aula de hoje',
      icon: ClockIcon,
      href: '/professor/attendance',
    },
    {
      title: 'Lançar notas',
      description: 'Atualize as avaliações dos alunos',
      icon: ClipboardDocumentCheckIcon,
      href: '/professor/grades',
    },
    {
      title: 'Registrar conteúdo',
      description: 'Informe o conteúdo ministrado',
      icon: BookOpenIcon,
      href: '/professor/lesson-contents',
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Portal do professor"
        title={`Olá, Prof. ${user.firstName}`}
        description={
          <>
            <span className="block font-medium text-primary-600 dark:text-primary-400">
              {ROLE_LABELS[user.activeProfile ?? user.role] ?? 'Professor'}
            </span>
            <span className="mt-1 block">
              Acesse suas turmas e execute as rotinas pedagógicas do dia.
            </span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat label="Minhas turmas" value={classGroups.length} helper={`${totalStudents} alunos`} icon={UsersIcon} tone="blue" onClick={() => router.push('/professor/my-classes')} />
        <DashboardStat label="Disciplinas" value={isLoadingAssignedSubjects ? '…' : totalSubjects} helper="Componentes vinculados" icon={BookOpenIcon} tone="green" onClick={() => router.push('/professor/my-subjects')} />
        <DashboardStat label="Alunos" value={totalStudents} helper="Nas minhas turmas" icon={UserGroupIcon} tone="purple" />
        <DashboardStat label="Carga semanal" value={formatScheduleLoad(scheduledMinutes, scheduledClassCount)} helper="Calculada pela grade de horários" icon={AcademicCapIcon} tone="amber" />
      </div>

      <DashboardSection title="Rotinas pedagógicas" description="Atalhos para as tarefas mais usadas.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {routines.map((routine) => {
            const Icon = routine.icon;
            return (
              <button
                key={routine.title}
                type="button"
                onClick={() => router.push(routine.href)}
                className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:border-primary-300 hover:bg-primary-50/40 dark:border-slate-700 dark:hover:border-primary-700 dark:hover:bg-primary-950/20"
              >
                <span className="rounded-lg bg-slate-100 p-2.5 text-slate-700 group-hover:bg-primary-100 group-hover:text-primary-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-primary-950 dark:group-hover:text-primary-300">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">{routine.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{routine.description}</span>
                </span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </DashboardSection>

      <DashboardSection
        title="Minhas turmas"
        description="Turmas agrupadas para você encontrar cada disciplina rapidamente."
        action={
          <Button variant="ghost" size="sm" onClick={() => router.push('/professor/my-classes')} rightIcon={<ArrowRightIcon className="h-4 w-4" />}>
            Ver todas
          </Button>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
        ) : classGroups.length === 0 ? (
          <DashboardEmpty
            icon={UsersIcon}
            title="Nenhuma turma vinculada"
            description="A direção ou a coordenação precisa vincular suas disciplinas às turmas."
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classGroups.slice(0, 8).map((group) => (
              <button
                key={group.classId}
                type="button"
                onClick={() => router.push(`/professor/classes/${group.classId}`)}
                className="flex w-full items-center gap-3 py-3 text-left first:pt-0 last:pb-0"
              >
                <span className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <UsersIcon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{group.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                    {group.subjects.join(' · ')}{group.grade ? ` · ${group.grade}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{group.studentCount} alunos</span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
