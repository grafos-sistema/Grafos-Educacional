'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { subjectsService } from '@/services/subjects.service';
import { UpdateSubjectDto } from '@/types/subject.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Cores predefinidas para disciplinas
const predefinedColors = [
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#10B981', label: 'Verde' },
  { value: '#14B8A6', label: 'Turquesa' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#6366F1', label: 'Índigo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#64748B', label: 'Cinza' },
];

export default function EditSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(predefinedColors[5].value);

  // Buscar disciplina
  const { data: subject, isLoading } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectsService.findOne(subjectId),
    enabled: !!subjectId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateSubjectDto>();

  // Preencher formulário quando disciplina carregar
  useEffect(() => {
    if (subject) {
      reset({
        name: subject.name,
        code: subject.code || '',
        description: subject.description || '',
        color: subject.color || '',
        isActive: subject.isActive,
      });
      if (subject.color) {
        setSelectedColor(subject.color);
      }
    }
  }, [subject, reset]);

  const onSubmit = async (data: UpdateSubjectDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData = {
        ...data,
        color: selectedColor,
      };

      await subjectsService.update(subjectId, updateData);
      toast.success('Disciplina atualizada com sucesso!');
      router.push(`/admin/subjects/${subjectId}`);
    } catch (err: any) {
      console.error('Erro ao atualizar disciplina:', err);
      const errorMsg = err?.message || 'Erro ao atualizar disciplina. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Editar Disciplina
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize as informações da disciplina
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
              Informações da Disciplina
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Ex: Matemática, Português, História"
              />
              <Input
                label="Código"
                {...register('code')}
                error={errors.code?.message}
                placeholder="MAT, PORT, HIST"
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
              rows={3}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white p-3"
              placeholder="Descreva a disciplina..."
            />
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Cor da Disciplina
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Escolha uma cor para identificar visualmente a disciplina em horários e calendários
            </p>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
              {predefinedColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                    selectedColor === color.value
                      ? 'border-gray-900 dark:border-white ring-2 ring-offset-2 ring-blue-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Cor selecionada:
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {selectedColor}
                </span>
              </div>
            </div>
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
                Disciplina ativa
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Disciplinas ativas podem ser atribuídas a turmas
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
