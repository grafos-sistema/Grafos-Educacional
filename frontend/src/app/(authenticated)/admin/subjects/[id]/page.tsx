'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { subjectsService } from '@/services/subjects.service';
import { teacherSubjectsService } from '@/services/teacher-subjects.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function SubjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;

  // Buscar disciplina
  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectsService.findOne(subjectId),
    enabled: !!subjectId,
  });
  const { data: subjectTeachers = [], isLoading: isLoadingTeachers } = useQuery(
    {
      queryKey: ['subject-teachers', subjectId],
      queryFn: () => teacherSubjectsService.getBySubject(subjectId),
      enabled: Boolean(subjectId),
    },
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando disciplina..." />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Disciplina não encontrada
        </div>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/subjects')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Detalhes da Disciplina
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Informações completas da disciplina
            </p>
          </div>
          <Button
            onClick={() => router.push(`/admin/subjects/${subjectId}/edit`)}
            leftIcon={<PencilIcon className="h-5 w-5" />}
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Informações da Disciplina */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-lg"
            style={{
              backgroundColor: subject.color ? `${subject.color}20` : '#E5E7EB',
            }}
          >
            <BookOpenIcon
              className="h-8 w-8"
              style={{ color: subject.color || '#6B7280' }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {subject.name}
              </h2>
              <Badge variant={subject.isActive ? 'success' : 'error'}>
                {subject.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Código
                </label>
                <span className="text-gray-900 dark:text-gray-100">
                  {subject.code || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {subject.description && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Descrição
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {subject.description}
          </p>
        </div>
      )}

      {/* Professores vinculados */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Professores da disciplina
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Professores vinculados a esta disciplina e seus dados de contato.
            </p>
          </div>
          <Badge variant="info">{subjectTeachers.length}</Badge>
        </div>
        {isLoadingTeachers ? (
          <div className="py-6">
            <LoadingSpinner size="sm" text="Carregando professores..." />
          </div>
        ) : subjectTeachers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            Nenhum professor foi vinculado a esta disciplina.
          </p>
        ) : (
          <div className="space-y-3">
            {subjectTeachers.map((link) => {
              const teacher = link.teacher?.user;
              const name = teacher
                ? `${teacher.firstName} ${teacher.lastName}`.trim()
                : 'Professor';
              return (
                <div
                  key={link.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {teacher?.avatar ? (
                      <img
                        src={teacher.avatar}
                        alt={name}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {name}
                      </p>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {teacher?.email ||
                          teacher?.phone ||
                          'Contato não informado'}
                      </p>
                    </div>
                  </div>
                  {teacher?.id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/users/${teacher.id}`)
                      }
                      aria-label={`Visualizar perfil de ${name}`}
                      title="Visualizar perfil"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Informações do Sistema */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Informações do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1">
              Data de Criação
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(subject.createdAt)}
            </span>
          </div>
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1">
              Última Atualização
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(subject.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
