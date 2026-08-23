'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AcademicCapIcon, TrashIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { subjectsService } from '@/services/subjects.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/hooks/useToast';

interface SubjectClassesManagerProps {
  subjectId: string;
  institutionId: string;
  subjectName?: string;
}

export function SubjectClassesManager({
  subjectId,
  institutionId,
  subjectName,
}: SubjectClassesManagerProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile || user?.role;
  const canManage = currentRole === UserRole.DIRECTOR || currentRole === UserRole.COORDINATOR;
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [removingLinkId, setRemovingLinkId] = useState<string | null>(null);

  const { data: subject, isLoading: loadingSubject } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectsService.findOne(subjectId),
    enabled: Boolean(subjectId),
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', 'subject-class-manager', institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(institutionId),
  });

  const { data: subjectTeachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teacher-subjects', 'subject', subjectId],
    queryFn: () => teacherSubjectsService.getBySubject(subjectId),
    enabled: Boolean(subjectId) && canManage,
  });

  const linkedClassIds = useMemo(
    () => new Set((subject?.classSubjects ?? []).map((link) => link.class?.id).filter(Boolean)),
    [subject?.classSubjects],
  );

  const availableClasses = useMemo(
    () => [
      { value: '', label: 'Selecione uma turma' },
      ...(classesData?.data ?? [])
        .filter((item) => !linkedClassIds.has(item.id))
        .map((item) => ({
          value: item.id,
          label: [item.course?.name, item.name, item.shift].filter(Boolean).join(' • '),
        })),
    ],
    [classesData?.data, linkedClassIds],
  );

  const teacherOptions = useMemo(
    () => [
      { value: '', label: 'Sem professor definido' },
      ...subjectTeachers
        .filter((item) => Boolean(item.teacher?.id))
        .map((item) => ({
          value: item.teacher!.id,
          label: item.teacher?.user
            ? `${item.teacher.user.firstName} ${item.teacher.user.lastName}`.trim()
            : 'Professor',
        })),
    ],
    [subjectTeachers],
  );

  const resetForm = () => {
    setClassId('');
    setTeacherId('');
    setWeeklyHours('');
  };

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['subject', subjectId] }),
      queryClient.invalidateQueries({ queryKey: ['subjects'] }),
      queryClient.invalidateQueries({ queryKey: ['class-subjects'] }),
      queryClient.invalidateQueries({ queryKey: ['teacher-classes'] }),
      queryClient.invalidateQueries({ queryKey: ['classes'] }),
    ]);
  };

  const addMutation = useMutation({
    mutationFn: () => {
      if (!canManage) {
        throw new Error('Somente a Direção e a Coordenação podem vincular disciplinas às turmas.');
      }
      if (!classId) throw new Error('Selecione uma turma para continuar.');
      return classesService.addSubject({
        classId,
        subjectId,
        teacherId: teacherId || undefined,
        weeklyHours: weeklyHours ? Number(weeklyHours) : undefined,
      });
    },
    onSuccess: async () => {
      await invalidate();
      resetForm();
      toast.success('Disciplina vinculada à turma com sucesso!');
    },
    onError: (error: any) => toast.error(error?.message || 'Não foi possível vincular a disciplina.'),
  });

  const removeMutation = useMutation({
    mutationFn: (linkId: string) => {
      if (!canManage) {
        throw new Error('Somente a Direção e a Coordenação podem remover vínculos de disciplinas.');
      }
      return classesService.removeSubject(linkId);
    },
    onSuccess: async () => {
      await invalidate();
      setRemovingLinkId(null);
      toast.success('Vínculo removido da disciplina.');
    },
    onError: (error: any) => toast.error(error?.message || 'Não foi possível remover o vínculo.'),
  });

  const isLoading = loadingSubject || loadingClasses || (canManage && loadingTeachers);
  const isBusy = addMutation.isPending || removeMutation.isPending;
  const links = subject?.classSubjects ?? [];

  return (
    <>
      <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Turmas com esta disciplina
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {canManage
                ? `Defina em quais turmas ${subjectName ? `a disciplina ${subjectName}` : 'esta disciplina'} será ministrada e, se desejar, o professor responsável.`
                : 'Consulte as turmas em que esta disciplina foi distribuída.'}
            </p>
          </div>
          <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {links.length} turma(s)
          </span>
        </div>

        {canManage && (
          <div className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-primary-100 bg-primary-50/40 p-4 dark:border-primary-900/40 dark:bg-primary-900/10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_auto] lg:items-end">
            <Select
              label="Turma"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              options={availableClasses}
              disabled={isLoading || isBusy}
            />
            <Select
              label="Professor da disciplina"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              options={teacherOptions}
              disabled={!classId || loadingTeachers || isBusy}
            />
            <Input
              label="Horas/semana"
              type="number"
              min="1"
              max="40"
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(event.target.value)}
              placeholder="Ex.: 4"
              disabled={isBusy}
            />
            <Button
              onClick={() => addMutation.mutate()}
              isLoading={addMutation.isPending}
              disabled={isLoading || isBusy || !classId}
              className="w-full lg:w-auto"
            >
              Adicionar turma
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" text="Carregando turmas..." />
          </div>
        ) : links.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <AcademicCapIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta disciplina ainda não foi vinculada a nenhuma turma.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const classInfo = link.class;
              const teacher = link.teacher?.user;
              const teacherName = teacher
                ? `${teacher.firstName} ${teacher.lastName}`.trim()
                : 'Professor não definido';
              return (
                <div
                  key={link.id}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {classInfo?.name ?? 'Turma'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {[classInfo?.course?.name, classInfo?.grade, classInfo?.shift]
                        .filter(Boolean)
                        .join(' • ') || 'Dados acadêmicos não informados'}
                      {link.weeklyHours ? ` • ${link.weeklyHours}h/semana` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {teacher?.avatar ? (
                      <img src={teacher.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {teacherName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{teacherName}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {teacher?.email || 'Sem contato informado'}
                      </p>
                    </div>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemovingLinkId(link.id)}
                        leftIcon={<TrashIcon className="h-4 w-4" />}
                        disabled={isBusy}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={Boolean(removingLinkId)}
        onClose={() => setRemovingLinkId(null)}
        onConfirm={() => removingLinkId && removeMutation.mutate(removingLinkId)}
        title="Remover disciplina da turma"
        message="Este vínculo será removido. Os horários que usam essa disciplina podem precisar de revisão."
        confirmText="Remover"
      />
    </>
  );
}
