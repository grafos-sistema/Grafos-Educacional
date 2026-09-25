'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { enrollmentsService } from '@/services/enrollments.service';
import { usersService } from '@/services/users.service';
import { UserRole } from '@/types/user.types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const { data: enrollmentData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['class-enrollments', classId],
    queryFn: () =>
      enrollmentsService.findAll({ classId, isActive: true, limit: 1000 }),
    enabled: Boolean(classId),
  });

  const { data: activeInstitutionEnrollments, isLoading: isLoadingInstitutionEnrollments } = useQuery({
    queryKey: ['active-institution-enrollments', institutionId],
    queryFn: () =>
      enrollmentsService.findAll({
        institutionId: institutionId as string,
        isActive: true,
        limit: 1000,
      }),
    enabled: Boolean(institutionId && canManageStudents),
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
  const enrolledInAnotherClassStudentIds = useMemo(
    () =>
      new Set(
        (activeInstitutionEnrollments?.data ?? [])
          .filter((enrollment) => enrollment.classId !== classId)
          .map((enrollment) => enrollment.studentId),
      ),
    [activeInstitutionEnrollments?.data, classId],
  );
  const availableStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return (studentsData?.data ?? [])
      .filter(
        (student) =>
          student.studentProfile?.id &&
          !enrolledStudentIds.has(student.studentProfile.id) &&
          !enrolledInAnotherClassStudentIds.has(student.studentProfile.id),
      )
      .filter((student) => {
        if (!normalizedSearch) return true;
        return `${student.firstName} ${student.lastName} ${student.email} ${student.cpf ?? ''}`
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) =>
        userName(left).localeCompare(userName(right), 'pt-BR'),
      )
      .slice(0, 50);
  }, [enrolledInAnotherClassStudentIds, enrolledStudentIds, search, studentsData?.data]);

  const bulkCreateMutation = useMutation({
    mutationFn: () =>
      enrollmentsService.createBulk({
        classId,
        studentIds: selectedStudentIds,
      }),
    onSuccess: async (createdEnrollments) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['class-enrollments', classId],
        }),
        queryClient.invalidateQueries({ queryKey: ['class', classId] }),
        queryClient.invalidateQueries({ queryKey: ['classes'] }),
        queryClient.invalidateQueries({
          queryKey: ['active-institution-enrollments', institutionId],
        }),
      ]);
      toast.success(
        `${createdEnrollments.length} aluno(s) vinculado(s) à turma com sucesso!`,
      );
      setSearch('');
      setSelectedStudentIds([]);
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
        queryClient.invalidateQueries({
          queryKey: ['active-institution-enrollments', institutionId],
        }),
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

  const isLoading =
    isLoadingEnrollments || isLoadingInstitutionEnrollments || isLoadingStudents;
  const isFull = Boolean(maxStudents && enrollments.length >= maxStudents);
  const remainingCapacity = maxStudents
    ? Math.max(maxStudents - enrollments.length, 0)
    : Number.POSITIVE_INFINITY;
  const visibleStudentIds = availableStudents
    .map((student) => student.studentProfile?.id)
    .filter((studentId): studentId is string => Boolean(studentId));
  const selectedVisibleCount = visibleStudentIds.filter((studentId) =>
    selectedStudentIds.includes(studentId),
  ).length;
  const allVisibleSelected =
    visibleStudentIds.length > 0 && selectedVisibleCount === visibleStudentIds.length;

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }
      if (current.length >= remainingCapacity) return current;
      return [...current, studentId];
    });
  };

  const toggleVisibleStudents = () => {
    setSelectedStudentIds((current) => {
      if (allVisibleSelected) {
        const visibleIds = new Set(visibleStudentIds);
        return current.filter((studentId) => !visibleIds.has(studentId));
      }

      const next = [...current];
      for (const studentId of visibleStudentIds) {
        if (next.includes(studentId)) continue;
        if (next.length >= remainingCapacity) break;
        next.push(studentId);
      }
      return next;
    });
  };

  const isBusy = bulkCreateMutation.isPending || removeMutation.isPending;

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
                label="Adicionar alunos à turma"
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
              ) : availableStudents.length > 0 ? (
                <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-2 border-b border-gray-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Selecione os alunos que deseja vincular
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedStudentIds.length > 0
                          ? `${selectedStudentIds.length} selecionado(s)`
                          : 'Você pode selecionar vários de uma vez.'}
                        {Number.isFinite(remainingCapacity)
                          ? ` Restam ${remainingCapacity} vaga(s).`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleVisibleStudents}
                      disabled={
                        isBusy ||
                        visibleStudentIds.length === 0 ||
                        (!allVisibleSelected && selectedStudentIds.length >= remainingCapacity)
                      }
                      className="self-start rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto dark:text-violet-300 dark:hover:bg-violet-900/30"
                    >
                      {allVisibleSelected ? 'Desmarcar exibidos' : 'Selecionar exibidos'}
                    </button>
                  </div>
                  <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                  {availableStudents.map((student) => {
                      const studentId = student.studentProfile!.id;
                      const name = userName(student);
                      const isSelected = selectedStudentIds.includes(studentId);
                      return (
                      <label
                        key={student.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
                          isSelected
                            ? 'border-violet-300 bg-violet-50 dark:border-violet-700 dark:bg-violet-900/20'
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudent(studentId)}
                          disabled={isBusy || (!isSelected && selectedStudentIds.length >= remainingCapacity)}
                          className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          aria-label={`Selecionar ${name}`}
                        />
                        <StudentAvatar avatar={student.avatar} name={name} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900 dark:text-white">
                            {name}
                          </p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {student.studentProfile?.registrationNumber || student.email}
                          </p>
                        </div>
                        {isSelected ? (
                          <CheckIcon className="h-5 w-5 shrink-0 text-violet-600 dark:text-violet-300" />
                        ) : null}
                      </label>
                      );
                    })}
                  </div>
                  {availableStudents.length === 50 ? (
                    <p className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      Mostrando até 50 alunos disponíveis. Use a busca para refinar a lista.
                    </p>
                  ) : null}
                  {selectedStudentIds.length > 0 ? (
                    <div className="flex flex-col gap-3 border-t border-gray-200 px-3 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedStudentIds.length} aluno(s) pronto(s) para vincular.
                      </p>
                      <Button
                        type="button"
                        onClick={() => bulkCreateMutation.mutate()}
                        disabled={isBusy}
                      >
                        {bulkCreateMutation.isPending ? 'Vinculando...' : 'Vincular selecionados'}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : search.trim() ? (
                <p className="mt-2 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Nenhum aluno disponível corresponde à busca.
                </p>
              ) : (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Nenhum aluno disponível para vincular a esta turma.
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
