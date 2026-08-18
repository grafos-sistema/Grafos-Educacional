'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AcademicCapIcon, CheckCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { classesService } from '@/services/classes.service';
import { subjectsService } from '@/services/subjects.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types/user.types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ClassSubjectsManager } from '@/components/classes/ClassSubjectsManager';
import { useToast } from '@/hooks/useToast';

export default function AcademicDistributionPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuthStore();
  const currentRole = user?.activeProfile || user?.role;
  const canAccess = currentRole === UserRole.COORDINATOR || currentRole === UserRole.SUPER_ADMIN;
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['academic-distribution', 'teachers', user?.institutionId],
    queryFn: () =>
      usersService.findAll({
        institutionId: user?.institutionId,
        role: UserRole.TEACHER,
        isActive: true,
        hasTeacherProfile: true,
        limit: 1000,
      }),
    enabled: canAccess && Boolean(user?.institutionId),
  });

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery({
    queryKey: ['academic-distribution', 'subjects', user?.institutionId],
    queryFn: () =>
      subjectsService.findAll({
        institutionId: user?.institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: canAccess && Boolean(user?.institutionId),
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['academic-distribution', 'classes', user?.institutionId],
    queryFn: () =>
      classesService.findAll({
        institutionId: user?.institutionId,
        isActive: true,
        limit: 1000,
      }),
    enabled: canAccess && Boolean(user?.institutionId),
  });

  const { data: teacherSubjects = [], isLoading: loadingTeacherSubjects } = useQuery({
    queryKey: ['academic-distribution', 'teacher-subjects', teacherId],
    queryFn: () => teacherSubjectsService.getByTeacher(teacherId),
    enabled: canAccess && Boolean(teacherId),
  });

  useEffect(() => {
    setSelectedSubjectIds(teacherSubjects.map((item) => item.subjectId));
  }, [teacherId, teacherSubjects]);

  useEffect(() => {
    const requestedTeacherId = new URLSearchParams(window.location.search).get('teacherId');
    if (requestedTeacherId) {
      setTeacherId(requestedTeacherId);
    }
  }, []);

  const teacherOptions = useMemo(
    () => [
      { value: '', label: 'Selecione um professor' },
      ...(teachersData?.data ?? []).map((teacher) => ({
        value: teacher.teacherProfile?.id ?? '',
        label: `${teacher.firstName} ${teacher.lastName}`,
      })).filter((option) => option.value),
    ],
    [teachersData?.data]
  );

  const classOptions = useMemo(
    () => [
      { value: '', label: 'Selecione uma turma' },
      ...(classesData?.data ?? []).map((classItem) => ({
        value: classItem.id,
        label: `${classItem.name} • ${classItem.grade}${classItem.section ? ` • ${classItem.section}` : ''}`,
      })),
    ],
    [classesData?.data]
  );

  const subjectMutation = useMutation({
    mutationFn: () => teacherSubjectsService.syncTeacherSubjects(teacherId, selectedSubjectIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['academic-distribution', 'teacher-subjects', teacherId] });
      await queryClient.invalidateQueries({ queryKey: ['teacher-subjects', 'subject'] });
      toast.success('Disciplinas do professor atualizadas com sucesso.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Não foi possível atualizar as disciplinas do professor.');
    },
  });

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800">
          Esta área é exclusiva da Coordenação e do Super Admin.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Distribuição Acadêmica</h1>
        <p className="mt-2 max-w-3xl text-gray-600 dark:text-gray-400">
          Primeiro defina quais disciplinas cada professor pode lecionar. Depois distribua essas disciplinas nas turmas e indique o professor responsável.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <AcademicCapIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Professor e disciplinas</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Este vínculo representa a habilitação do professor, não uma turma específica.
              </p>
            </div>
          </div>

          <Select
            label="Professor"
            value={teacherId}
            onChange={(event) => setTeacherId(event.target.value)}
            options={teacherOptions}
            disabled={loadingTeachers || subjectMutation.isPending}
          />

          {teacherId && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Disciplinas habilitadas</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Selecione uma ou mais.</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{selectedSubjectIds.length} selecionada(s)</span>
              </div>

              {loadingSubjects || loadingTeacherSubjects ? (
                <LoadingSpinner size="sm" text="Carregando disciplinas..." />
              ) : subjectsData?.data.length ? (
                <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                  {subjectsData.data.map((subject) => {
                    const selected = selectedSubjectIds.includes(subject.id);
                    return (
                      <label
                        key={subject.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          selected
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                            : 'border-gray-200 hover:border-blue-200 dark:border-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSubject(subject.id)}
                          disabled={subjectMutation.isPending}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="min-w-0 text-sm text-gray-800 dark:text-gray-200">
                          {subject.name}
                          {subject.code ? <span className="ml-1 text-xs text-gray-500">({subject.code})</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                  Nenhuma disciplina ativa foi cadastrada nesta instituição.
                </p>
              )}

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">Atualize sempre que a atuação do professor mudar.</span>
                <Button
                  onClick={() => subjectMutation.mutate()}
                  isLoading={subjectMutation.isPending}
                  disabled={subjectMutation.isPending || loadingTeacherSubjects}
                  leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                >
                  Salvar disciplinas
                </Button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <UserGroupIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Turma, disciplina e professor</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Escolha uma turma abaixo para distribuir as disciplinas e a carga horária.
              </p>
            </div>
          </div>

          <Select
            label="Turma"
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            options={classOptions}
            disabled={loadingClasses}
          />

          {!classId ? (
            <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Selecione uma turma para abrir a distribuição de Disciplinas + Professores.
            </div>
          ) : null}
        </section>
      </div>

      {classId ? (
        <ClassSubjectsManager
          classId={classId}
          title="Disciplinas da turma selecionada"
          description="Adicione uma disciplina, escolha um professor habilitado para ela e informe a carga horária semanal."
          emptyDescription="Esta turma ainda não possui disciplinas distribuídas."
        />
      ) : null}
    </div>
  );
}
