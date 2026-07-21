'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { subjectsService } from '@/services/subjects.service';
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
    <div className="p-6 max-w-4xl mx-auto">
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
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Cor
                </label>
                {subject.color ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                      {subject.color}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-900 dark:text-gray-100">-</span>
                )}
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

      {/* Preview da Cor */}
      {subject.color && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Preview da Cor
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Veja como a disciplina aparecerá em horários e calendários
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card exemplo */}
            <div
              className="p-4 rounded-lg border-l-4"
              style={{
                borderLeftColor: subject.color,
                backgroundColor: `${subject.color}10`,
              }}
            >
              <div className="flex items-center gap-3">
                <BookOpenIcon
                  className="h-6 w-6"
                  style={{ color: subject.color }}
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {subject.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Segunda-feira, 08:00 - 09:00
                  </div>
                </div>
              </div>
            </div>

            {/* Badge exemplo */}
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${subject.color}20`,
                  color: subject.color,
                }}
              >
                {subject.name}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Badge de horário
              </span>
            </div>
          </div>
        </div>
      )}

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
