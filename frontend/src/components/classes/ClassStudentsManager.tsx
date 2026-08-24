'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { enrollmentsService } from '@/services/enrollments.service';
import { usersService } from '@/services/users.service';
import { UserRole } from '@/types/user.types';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/stores/authStore';

interface ClassStudentsManagerProps {
  classId: string;
  institutionId?: string | null;
  maxStudents?: number | null;
  readOnly?: boolean;
}

function userName(user: { firstName?: string; lastName?: string }) {
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Aluno';
}

function StudentAvatar({
  avatar,
  name,
}: {
  avatar?: string | null;
  name: string;
}) {
  return avatar ? (
    <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
  ) : (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function ClassStudentsManager({
  classId,
  institutionId,
  maxStudents,
  readOnly = false,
}: ClassStudentsManagerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile ?? user?.role;
  const canManageStudents =
    !readOnly &&
    [
      UserRole.SUPER_ADMIN_GLOBAL,
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTION_ADMIN,
      UserRole.DIRECTOR,
      UserRole.COORDINATOR,
    ].includes(currentRole as UserRole);
  const [search, setSearch] = useState('');

  const { data: enrollmentData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['class-enrollments', classId],
    queryFn: () =>
      enrollmentsService.findAll({ classId, isActive: true, limit: 1000 }),
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
    enabled: Boolean(institutionId && canManageStudents),
  });

  const enrollments = enrollmentData?.data ?? [];
  const enrolledStudentIds = useMemo(
    () => new Set(enrollments.map((item) => item.studentId)),
    [enrollments],
  );
  const availableStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return [];

    return (studentsData?.data ?? [])
      .filter(
        (student) =>
          student.studentProfile?.id &&
          !enrolledStudentIds.has(student.studentProfile.id),
      )
      .filter((student) =>
        `${student.firstName} ${student.lastName} ${student.email} ${student.cpf ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch),
      )
      .sort((left, right) =>
        userName(left).localeCompare(userName(right), 'pt-BR'),
      )
      .slice(0, 8);
  }, [enrolledStudentIds, search, studentsData?.data]);

  const createMutation = useMutation({
    mutationFn: (studentId: string) =>
      enrollmentsService.syncStudentClass(studentId, classId),
    onSuccess: async (_data, studentId) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['class-enrollments', classId],
        }),
        queryClient.invalidateQueries({ queryKey: ['class', classId] }),
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
        queryClient.invalidateQueries({
          queryKey: ['student-class-enrollment', studentId],
        }),
      ]);
      toast.success('Aluno vinculado à turma com sucesso!');
      setSearch('');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível vincular o aluno.',
      );
    },
  });

  const removeMutation = useMutation({
    mutationFn: (enrollmentId: string) => enrollmentsService.remove(enrollmentId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['class-enrollments', classId],
        }),
        queryClient.invalidateQueries({ queryKey: ['class', classId] }),
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
      ]);
      toast.success('Aluno removido da turma com sucesso!');
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Não foi possível remover o aluno da turma.',
      );
    },
  });

  const isLoading = isLoadingEnrollments || isLoadingStudents;
  const isFull = Boolean(maxStudents && enrollments.length >= maxStudents);
  const isBusy = createMutation.isPending || removeMutation.isPending;

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <UserGroupIcon className="mt-0.5 h-6 w-6 text-violet-600 dark:text-violet-400" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Alunos da turma
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {readOnly
                ? 'Consulte os alunos matriculados nesta turma.'
                : 'Consulte os alunos matriculados e, pela Direção ou Coordenação, gerencie os vínculos.'}
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
          {canManageStudents && (
            <div className="mb-6">
              <Input
                label="Buscar aluno para vincular"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                leftIcon={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
                placeholder="Nome, e-mail ou CPF"
                disabled={isBusy || isFull}
              />
              {isFull ? (
                <p className="mt-2 text-xs text-amber-700">
                  A capacidade máxima desta turma foi atingida.
                </p>
              ) : search.trim() && availableStudents.length > 0 ? (
                <div className="mt-2 space-y-2 rounded-xl border border-gray-200 p-2 dark:border-gray-700">
                  {availableStudents.map((student) => {
                    const studentId = student.studentProfile!.id;
                    const name = userName(student);
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      >
                        <StudentAvatar avatar={student.avatar} name={name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {name}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {student.studentProfile?.registrationNumber || student.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Vincular ${name} à turma`}
                          title="Vincular aluno"
                          onClick={() => createMutation.mutate(studentId)}
                          disabled={isBusy}
                          className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : search.trim() ? (
                <p className="mt-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nenhum aluno disponível corresponde à busca.
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Digite o nome, e-mail ou CPF para encontrar um aluno disponível.
                </p>
              )}
            </div>
          )}

          {enrollments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Nenhum aluno vinculado a esta turma.
            </p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => {
                const name = userName(enrollment.student ?? {});
                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StudentAvatar
                        avatar={enrollment.student?.avatar}
                        name={name}
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {name}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.student?.registrationNumber ||
                            enrollment.student?.email ||
                            'Matrícula sem número'}
                        </p>
                      </div>
                    </div>
                    {canManageStudents && (
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(enrollment.id)}
                        disabled={isBusy}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/30"
                        title="Remover aluno da turma"
                        aria-label={`Remover ${name} da turma`}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
