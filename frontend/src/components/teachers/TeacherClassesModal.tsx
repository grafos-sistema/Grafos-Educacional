'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpenIcon, TrashIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { classesService } from '@/services/classes.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { teachersService, type TeacherClass } from '@/services/teachers.service';
import { useAuthStore } from '@/stores/authStore';

interface TeacherClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string | null;
  teacherName?: string;
}

export function TeacherClassesModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
}: TeacherClassesModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['teacher-classes-modal', 'classes', user?.institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId: user?.institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: isOpen && Boolean(user?.institutionId),
  });

  const { data: teacherSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['teacher-subjects', teacherId],
    queryFn: () => teacherSubjectsService.getByTeacher(teacherId!),
    enabled: isOpen && Boolean(teacherId),
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['coordinator-teacher-classes', teacherId],
    queryFn: () => teachersService.getTeacherClasses(teacherId!),
    enabled: isOpen && Boolean(teacherId),
  });

  const classOptions = useMemo(
    () => [
      { value: '', label: 'Selecione uma turma...' },
      ...(classesData?.data ?? []).map((item) => ({
        value: item.id,
        label: `${item.name} — ${item.grade}${item.shift ? ` • ${item.shift}` : ''}`,
      })),
    ],
    [classesData?.data]
  );

  const subjectOptions = useMemo(
    () => [
      { value: '', label: 'Selecione uma disciplina...' },
      ...teacherSubjects.map((item) => ({
        value: item.subjectId,
        label: `${item.subject.name}${item.subject.code ? ` (${item.subject.code})` : ''}`,
      })),
    ],
    [teacherSubjects]
  );

  const selectedPairAlreadyExists = assignments.some(
    (item) => item.classId === selectedClassId && item.subjectId === selectedSubjectId
  );

  const refreshAssignmentQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['coordinator-teacher-classes', teacherId] }),
      queryClient.invalidateQueries({ queryKey: ['teacher-classes', teacherId] }),
      queryClient.invalidateQueries({ queryKey: ['teacher-class-subjects'] }),
    ]);
  };

  const addMutation = useMutation({
    mutationFn: () => {
      if (!teacherId || !selectedClassId || !selectedSubjectId) {
        throw new Error('Selecione a turma e a disciplina.');
      }

      return classesService.addSubject({
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId,
        weeklyHours: weeklyHours ? Number(weeklyHours) : undefined,
      });
    },
    onSuccess: async () => {
      await refreshAssignmentQueries();
      setSelectedClassId('');
      setSelectedSubjectId('');
      setWeeklyHours('');
      toast.success('Turma vinculada ao professor com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível vincular a turma ao professor.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (assignment: TeacherClass) =>
      classesService.removeSubject(assignment.classSubjectId ?? assignment.id),
    onSuccess: async () => {
      await refreshAssignmentQueries();
      toast.success('Vínculo removido com sucesso!');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível remover o vínculo.');
    },
  });

  const isLoading = loadingClasses || loadingSubjects || loadingAssignments;
  const isMutating = addMutation.isPending || removeMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Turmas do professor"
      description={teacherName ? `Vincule ${teacherName} às turmas em que ele lecionará.` : undefined}
      size="lg"
      footer={(
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isMutating}>
            Fechar
          </Button>
        </div>
      )}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Só aparecem as disciplinas previamente habilitadas para este professor. Escolha a turma,
            a disciplina e, se desejar, informe a carga horária.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Select
              label="Turma"
              options={classOptions}
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              disabled={isLoading || isMutating}
            />
            <Select
              label="Disciplina"
              options={subjectOptions}
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              disabled={isLoading || isMutating || teacherSubjects.length === 0}
            />
            <Input
              label="Carga horária semanal"
              type="number"
              min={1}
              value={weeklyHours}
              onChange={(event) => setWeeklyHours(event.target.value)}
              disabled={isMutating}
              placeholder="Opcional"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => addMutation.mutate()}
              isLoading={addMutation.isPending}
              disabled={isLoading || isMutating || !selectedClassId || !selectedSubjectId || selectedPairAlreadyExists}
            >
              Vincular turma
            </Button>
          </div>
          {selectedPairAlreadyExists ? (
            <p className="mt-2 text-right text-xs text-amber-700 dark:text-amber-300">
              Esta disciplina já está vinculada a esta turma.
            </p>
          ) : null}
        </div>

        {isLoading ? (
          <LoadingSpinner size="md" text="Carregando turmas vinculadas..." />
        ) : assignments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
            <BookOpenIcon className="mx-auto mb-3 h-10 w-10 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nenhuma turma vinculada a este professor.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.classSubjectId ?? assignment.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900 dark:text-white">
                    {assignment.class.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {assignment.subject?.name || 'Disciplina'}
                    {assignment.class.shift ? ` • ${assignment.class.shift}` : ''}
                    {assignment.weeklyHours ? ` • ${assignment.weeklyHours}h/semana` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(assignment)}
                  disabled={isMutating}
                  aria-label={`Remover ${assignment.class.name}`}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
