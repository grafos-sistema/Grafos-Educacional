'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { teacherSubjectsService, TeacherSubject } from '@/services/teacher-subjects.service';
import { subjectsService } from '@/services/subjects.service';
import {
  BookOpenIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  description?: string;
  isActive: boolean;
}

export default function MySubjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch all subjects from institution
  const { data: allSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects', user?.institutionId],
    queryFn: async () => {
      if (!user?.institutionId) return [];
      const response = await subjectsService.findAll({
        institutionId: user.institutionId,
        isActive: true,
        limit: 100,
      });
      return response.data || [];
    },
    enabled: !!user?.institutionId,
  });

  // Fetch teacher's configured subjects
  const { data: mySubjects = [], isLoading: loadingMySubjects } = useQuery({
    queryKey: ['my-subjects'],
    queryFn: () => teacherSubjectsService.getMySubjects(),
  });

  // Initialize selected subjects when data loads
  useEffect(() => {
    if (mySubjects.length > 0) {
      const subjectIds = mySubjects.map((ts: TeacherSubject) => ts.subjectId);
      setSelectedSubjects(subjectIds);
    }
  }, [mySubjects]);

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (subjectIds: string[]) =>
      teacherSubjectsService.syncMySubjects(subjectIds),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['my-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-performance'] });
      queryClient.invalidateQueries({ queryKey: ['all-classes'] });
      toast.success('Disciplinas atualizadas com sucesso!');
      setHasChanges(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar disciplinas');
    },
  });

  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      const newSelection = prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId];

      // Check if there are changes
      const originalIds = mySubjects.map((ts: TeacherSubject) => ts.subjectId);
      const hasChanged =
        newSelection.length !== originalIds.length ||
        newSelection.some((id) => !originalIds.includes(id));
      setHasChanges(hasChanged);

      return newSelection;
    });
  };

  const handleSave = () => {
    syncMutation.mutate(selectedSubjects);
  };

  const handleCancel = () => {
    const originalIds = mySubjects.map((ts: TeacherSubject) => ts.subjectId);
    setSelectedSubjects(originalIds);
    setHasChanges(false);
  };

  const isLoading = loadingSubjects || loadingMySubjects;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Minhas Disciplinas
          </h1>
          <p className="mt-2 text-sm text-secondary-600">
            Configure quais disciplinas você leciona. Isso determinará quais turmas
            serão exibidas para você.
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg bg-primary-50 p-4 border border-primary-100">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-primary-400 flex-shrink-0" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary-800">
              Como funciona?
            </h3>
            <div className="mt-2 text-sm text-primary-700">
              <p>
                Selecione as disciplinas que você leciona. Após salvar, você verá
                automaticamente todas as turmas da instituição que possuem essas
                disciplinas na grade curricular.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg border border-secondary-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-6 w-6 text-secondary-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Disciplinas Disponíveis
                  </dt>
                  <dd className="text-lg font-semibold text-secondary-900">
                    {allSubjects.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-secondary-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-success-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Disciplinas Selecionadas
                  </dt>
                  <dd className="text-lg font-semibold text-secondary-900">
                    {selectedSubjects.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border border-secondary-200">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-secondary-500 truncate">
                    Não Selecionadas
                  </dt>
                  <dd className="text-lg font-semibold text-secondary-900">
                    {allSubjects.length - selectedSubjects.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="bg-white shadow rounded-lg border border-secondary-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-secondary-900 mb-4">
            Selecione suas disciplinas
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-20 bg-secondary-100 rounded-lg"
                />
              ))}
            </div>
          ) : allSubjects.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">
                Nenhuma disciplina disponível
              </h3>
              <p className="mt-1 text-sm text-secondary-500">
                Não há disciplinas cadastradas na instituição.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allSubjects.map((subject: Subject) => {
                const isSelected = selectedSubjects.includes(subject.id);
                return (
                  <button
                    key={subject.id}
                    onClick={() => handleToggleSubject(subject.id)}
                    className={`
                      relative flex items-start p-4 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500/20'
                          : 'border-secondary-200 hover:border-secondary-300 hover:bg-secondary-50'
                      }
                    `}
                  >
                    {/* Color indicator */}
                    {subject.color && (
                      <div
                        className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                        style={{ backgroundColor: subject.color }}
                      />
                    )}

                    <div className="flex-1 min-w-0 ml-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? 'text-primary-900'
                              : 'text-secondary-900'
                          }`}
                        >
                          {subject.name}
                        </span>
                        {subject.code && (
                          <span className="text-xs text-secondary-500">
                            ({subject.code})
                          </span>
                        )}
                      </div>
                      {subject.description && (
                        <p className="mt-1 text-xs text-secondary-500 line-clamp-2">
                          {subject.description}
                        </p>
                      )}
                    </div>

                    {/* Checkbox indicator */}
                    <div
                      className={`
                        flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center
                        ${
                          isSelected
                            ? 'bg-primary-500 border-primary-500'
                            : 'border-secondary-300'
                        }
                      `}
                    >
                      {isSelected && (
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasChanges && (
          <div className="bg-secondary-50 px-4 py-3 sm:px-6 border-t border-secondary-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-600">
                Você tem alterações não salvas
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-2 border border-secondary-300 shadow-sm text-sm font-medium rounded-md text-secondary-700 bg-white hover:bg-secondary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={syncMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {syncMutation.isPending ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
