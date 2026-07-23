'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { coursesService } from '@/services/courses.service';
import { UpdateCourseDto } from '@/types/course.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Select } from '@/components/ui/Select';
import { courseLevelOptions } from '@/lib/constants/course-options';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar curso
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => coursesService.findOne(courseId),
    enabled: !!courseId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateCourseDto>();

  // Preencher formulário quando curso carregar
  useEffect(() => {
    if (course) {
      reset({
        name: course.name,
        code: course.code || '',
        level: course.level || '',
        duration: course.duration,
        description: course.description || '',
        isActive: course.isActive,
      });
    }
  }, [course, reset]);

  const onSubmit = async (data: UpdateCourseDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData = {
        ...data,
        duration: data.duration ? parseInt(data.duration.toString()) : undefined,
      };

      await coursesService.update(courseId, updateData);
      toast.success('Curso atualizado com sucesso!');
      router.push(`/admin/courses/${courseId}`);
    } catch (err: any) {
      console.error('Erro ao atualizar curso:', err);
      const errorMsg = err?.message || 'Erro ao atualizar curso. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          leftIcon={<ArrowLeftIcon className="h-5 w-5" />}
          className="mb-4"
        >
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Editar Curso
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize as informações do curso
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Erro geral */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Informações básicas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações do Curso
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Ex: Ensino Fundamental I"
              />
              <Input
                label="Código"
                {...register('code')}
                error={errors.code?.message}
                placeholder="EF1"
              />
              <Select
                label="Nível"
                options={courseLevelOptions}
                {...register('level')}
                error={errors.level?.message}
              />
              <Input
                label="Duração (anos)"
                type="number"
                {...register('duration', {
                  min: { value: 1, message: 'Duração deve ser maior que 0' },
                  max: { value: 20, message: 'Duração deve ser menor que 20' },
                })}
                error={errors.duration?.message}
                placeholder="5"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white p-3"
              placeholder="Descreva o curso..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Curso ativo
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Cursos ativos podem ter turmas criadas
            </p>
          </div>

          {/* Ações */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
