'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  PencilIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { coursesService } from '@/services/courses.service';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  // Buscar curso
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesService.findOne(courseId),
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando curso..." />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Curso não encontrado
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
          onClick={() => router.push('/admin/courses')}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Detalhes do Curso
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Informações completas do curso
            </p>
          </div>
          <Button
            onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
            leftIcon={<PencilIcon className="h-5 w-5" />}
          >
            Editar
          </Button>
        </div>
      </div>

      {/* Informações do Curso */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {course.name}
              </h2>
              <Badge variant={course.isActive ? 'success' : 'error'}>
                {course.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Código
                </label>
                <span className="text-gray-900 dark:text-gray-100">
                  {course.code || '-'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Nível
                </label>
                <span className="text-gray-900 dark:text-gray-100">
                  {course.level || '-'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Duração
                </label>
                <span className="text-gray-900 dark:text-gray-100">
                  {course.duration ? `${course.duration} ano(s)` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {course.description && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Descrição
          </h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {course.description}
          </p>
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
              {formatDate(course.createdAt)}
            </span>
          </div>
          <div>
            <label className="block text-gray-500 dark:text-gray-400 mb-1">
              Última Atualização
            </label>
            <span className="text-gray-900 dark:text-gray-100">
              {formatDate(course.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
