'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { enrollmentsService } from '@/services/enrollments.service';
import { usersService } from '@/services/users.service';
import { UserRole } from '@/types/user.types';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ClassStudentsManagerProps {
  classId: string;
  institutionId?: string | null;
  maxStudents?: number | null;
}

export function ClassStudentsManager({
  classId,
  institutionId,
  maxStudents,
}: ClassStudentsManagerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const { data: enrollmentData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['class-enrollments', classId],
    queryFn: () => enrollmentsService.findAll({ classId, isActive: true, limit: 1000 }),
    enabled: Boolean(classId),
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-student-options', institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: institutionId as string,
        role: UserRole.STUDENT,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(institutionId),
  });

  const enrollments = enrollmentData?.data ?? [];
  const enrolledStudentIds = useMemo(() => new Set(enrollments.map((item) => item.studentId)), [enrollments]);
  const availableStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return (studentsData?.data ?? [])
      .filter((student) => student.studentProfile?.id && !enrolledStudentIds.has(student.studentProfile.id))
      .filter((student) => {
        if (!normalizedSearch) return true;
        return `${student.firstName} ${student.lastName} ${student.email} ${student.cpf ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => `${left.firstName} ${left.lastName}`.localeCompare(`${right.firstName} ${right.lastName}`));
  }, [enrolledStudentIds, search, studentsData?.data]);

  const createMutation = useMutation({
    mutationFn: () => enrollmentsService.syncStudentClass(selectedStudentId, classId),
    onSuccess: async () => {
      setSelectedStudentId('');
      await queryClient.invalidateQueries({ queryKey: ['class-enrollments', classId] });
      await queryClient.invalidateQueries({ queryKey: ['class', classId] });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      await queryClient.invalidateQueries({ queryKey: ['student-class-enrollment', selectedStudentId] });
      toast.success('Aluno vinculado à turma com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Não foi possível vincular o aluno.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsService.remove(enrollmentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-enrollments', classId] });
      await queryClient.invalidateQueries({ queryKey: ['class', classId] });
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Aluno removido da turma com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Não foi possível remover o aluno da turma.');
    },
  });

  const isLoading = isLoadingEnrollments || isLoadingStudents;
  const isFull = Boolean(maxStudents && enrollments.length >= maxStudents);

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <UserGroupIcon className="mt-0.5 h-6 w-6 text-violet-600 dark:text-violet-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alunos da turma</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Vincule ou remova alunos diretamente nesta turma. O vínculo é salvo na matrícula acadêmica.
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {enrollments.length}{maxStudents ? ` / ${maxStudents}` : ''} aluno(s)
        </span>
      </div>

      {isLoading ? (
        <LoadingSpinner size="sm" text="Carregando alunos..." />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr,1fr,auto] md:items-end">
            <Input
              label="Buscar aluno"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
              placeholder="Nome, email ou CPF"
            />
            <Select
              label="Aluno"
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              disabled={isFull}
              options={[
                { value: '', label: isFull ? 'Capacidade máxima atingida' : 'Selecione um aluno' },
                ...availableStudents.map((student) => ({
                  value: student.studentProfile!.id,
                  label: `${student.firstName} ${student.lastName}`,
                })),
              ]}
            />
            <Button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={!selectedStudentId || createMutation.isPending || isFull}
              isLoading={createMutation.isPending}
            >
              Vincular aluno
            </Button>
          </div>

          {enrollments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Nenhum aluno vinculado a esta turma.
            </p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-white">
                      {enrollment.student?.firstName} {enrollment.student?.lastName}
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      {enrollment.student?.registrationNumber || enrollment.student?.email || 'Matrícula sem número'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMutation.mutate(enrollment.id)}
                    disabled={removeMutation.isPending}
                    className="rounded p-2 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    title="Remover aluno da turma"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
