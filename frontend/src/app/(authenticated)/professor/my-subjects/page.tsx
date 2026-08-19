'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpenIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { teacherSubjectsService, TeacherSubject } from '@/services/teacher-subjects.service';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function MySubjectsPage() {
  const { user } = useAuthStore();
  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['my-subjects', user?.teacherProfile?.id],
    queryFn: () => teacherSubjectsService.getMySubjects(),
    enabled: Boolean(user?.teacherProfile?.id),
    staleTime: 60_000,
  });

  const uniqueSubjects = Array.from(
    new Map(subjects.map((assignment: TeacherSubject) => [assignment.subjectId, assignment])).values()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Minhas Disciplinas</h1>
        <p className="mt-2 text-sm text-secondary-600">
          Visualização das disciplinas atribuídas ao seu perfil pela coordenação ou direção.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-secondary-200 bg-white p-5 shadow">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="h-6 w-6 text-secondary-400" />
            <div>
              <p className="text-sm font-medium text-secondary-500">Disciplinas atribuídas</p>
              <p className="text-2xl font-semibold text-secondary-900">{uniqueSubjects.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-secondary-200 bg-white p-5 shadow">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-6 w-6 text-success-500" />
            <div>
              <p className="text-sm font-medium text-secondary-500">Vínculos ativos</p>
              <p className="text-2xl font-semibold text-secondary-900">{subjects.length}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-secondary-200 bg-white shadow">
        <div className="border-b border-secondary-200 px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-secondary-900">
            Visualização das minhas disciplinas
          </h2>
          <p className="mt-1 text-sm text-secondary-500">
            Esta lista é somente para consulta. A atribuição é feita pela coordenação ou pela direção.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Carregando disciplinas..." />
            </div>
          ) : uniqueSubjects.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpenIcon className="mx-auto h-12 w-12 text-secondary-400" />
              <h3 className="mt-2 text-sm font-medium text-secondary-900">
                Nenhuma disciplina atribuída
              </h3>
              <p className="mt-1 text-sm text-secondary-500">
                Solicite à coordenação ou à direção a atribuição das disciplinas que você leciona.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uniqueSubjects.map((assignment: TeacherSubject) => (
                <div
                  key={assignment.subjectId}
                  className="relative rounded-lg border border-secondary-200 p-4"
                >
                  {assignment.subject.color && (
                    <span
                      className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
                      style={{ backgroundColor: assignment.subject.color }}
                    />
                  )}
                  <div className="pl-2">
                    <p className="font-medium text-secondary-900">{assignment.subject.name}</p>
                    {assignment.subject.code && (
                      <p className="mt-1 text-xs text-secondary-500">
                        Código: {assignment.subject.code}
                      </p>
                    )}
                    {assignment.subject.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-secondary-500">
                        {assignment.subject.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
