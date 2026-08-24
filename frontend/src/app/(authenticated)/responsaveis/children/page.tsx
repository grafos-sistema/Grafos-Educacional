'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { parentsService, ParentStudent } from '@/services/parents.service';
import { UserRole } from '@/types/user.types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const activeRole = user?.activeProfile ?? user?.role;

  const { data: parentProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['parent-profile', user?.id],
    queryFn: () => usersService.findOne(user!.id),
    enabled: !!user?.id && activeRole === UserRole.PARENT,
  });

  const { data: children, isLoading: loadingChildren } = useQuery<ParentStudent[]>({
    queryKey: ['parent-children', parentProfile?.parentProfile?.id],
    queryFn: () => parentsService.getChildren(parentProfile!.parentProfile!.id),
    enabled: !!parentProfile?.parentProfile?.id,
  });

  if (!user || loadingProfile || loadingChildren) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Carregando filhos..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/responsaveis/dashboard')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Meus Filhos
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Consulte os alunos vinculados ao seu perfil.
        </p>
      </div>

      {!children || children.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-gray-800">
          <UsersIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nenhum filho vinculado
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Entre em contato com a secretaria para conferir o vínculo do aluno.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {children.map(({ student, enrollments, subjectsCount }) => {
            const initials = `${student.firstName?.[0] ?? ''}${student.lastName?.[0] ?? ''}`.toUpperCase();

            return (
              <article
                key={student.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-lg font-bold text-white">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={`Foto de ${student.firstName} ${student.lastName}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      initials || <AcademicCapIcon className="h-7 w-7" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Matrícula: {student.registrationNumber || 'Não informada'}
                    </p>
                  </div>
                  <Badge variant={student.isActive ? 'success' : 'error'} size="sm">
                    {student.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="mb-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                    <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <UserGroupIcon className="h-4 w-4" />
                      Turmas
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {enrollments.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                    <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <BookOpenIcon className="h-4 w-4" />
                      Disciplinas
                    </div>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {subjectsCount}
                    </p>
                  </div>
                </div>

                <div className="mb-5 space-y-2">
                  {enrollments.length > 0 ? (
                    enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                        <span>{enrollment.class.name}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {enrollment.class.course?.name ?? 'Curso não informado'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Nenhuma turma ativa encontrada.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/responsaveis/children/${student.id}`)}
                  >
                    Ver detalhes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/responsaveis/children/${student.id}/grades`)}
                  >
                    Notas
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
