'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { enrollmentsService } from '@/services/enrollments.service';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface StudentClassEnrollmentManagerProps {
  studentId: string;
  studentUserId?: string;
  institutionId?: string | null;
}

export function StudentClassEnrollmentManager({
  studentId,
  studentUserId,
  institutionId,
}: StudentClassEnrollmentManagerProps) {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('');

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['student-class-options', institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId: institutionId as string,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(institutionId),
  });

  const { data: enrollmentData, isLoading: isLoadingEnrollment } = useQuery({
    queryKey: ['student-class-enrollment', studentId],
    queryFn: () => enrollmentsService.findAll({ studentId, isActive: true, limit: 1000 }),
    enabled: Boolean(studentId),
  });

  const activeEnrollment = enrollmentData?.data?.[0];

  useEffect(() => {
    setSelectedClassId(activeEnrollment?.classId ?? '');
  }, [activeEnrollment?.classId]);

  const classOptions = useMemo(
    () => [
      { value: '', label: 'Aluno sem turma' },
      ...(classesData?.data ?? []).map((classItem) => ({
        value: classItem.id,
        label: `${classItem.name} • ${classItem.grade}${classItem.shift ? ` • ${classItem.shift}` : ''}`,
      })),
    ],
    [classesData?.data]
  );

  const syncMutation = useMutation({
    mutationFn: () => enrollmentsService.syncStudentClass(studentId, selectedClassId || undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-class-enrollment', studentId] });
      if (studentUserId) {
        await queryClient.invalidateQueries({ queryKey: ['user', studentUserId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success(selectedClassId ? 'Aluno vinculado à turma com sucesso!' : 'Aluno removido da turma com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Não foi possível atualizar a turma do aluno.');
    },
  });

  const hasChanged = (activeEnrollment?.classId ?? '') !== selectedClassId;

  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex items-start gap-3">
        <AcademicCapIcon className="mt-0.5 h-6 w-6 text-primary-600 dark:text-primary-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Turma do aluno</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Escolha a turma oficial da matrícula. Se o aluno já estiver em outra turma, o vínculo será transferido.
          </p>
        </div>
      </div>

      {isLoadingClasses || isLoadingEnrollment ? (
        <LoadingSpinner size="sm" text="Carregando turmas..." />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Select
              label="Turma"
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              options={classOptions}
              disabled={!institutionId}
            />
          </div>
          <Button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={!hasChanged || syncMutation.isPending || !institutionId}
            isLoading={syncMutation.isPending}
          >
            Salvar turma
          </Button>
        </div>
      )}
    </div>
  );
}
