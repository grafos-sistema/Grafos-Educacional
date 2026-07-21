'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { academicYearsService } from '@/services/academic-years.service';
import { UpdateAcademicYearDto } from '@/types/academic.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function EditAcademicYearPage() {
  const router = useRouter();
  const params = useParams();
  const academicYearId = params?.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar ano letivo
  const { data: academicYear, isLoading } = useQuery({
    queryKey: ['academic-year', academicYearId],
    queryFn: () => academicYearsService.findOne(academicYearId),
    enabled: !!academicYearId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UpdateAcademicYearDto>();

  const startDate = watch('startDate');

  // Preencher formulário quando ano letivo carregar
  useEffect(() => {
    if (academicYear) {
      reset({
        year: academicYear.year,
        name: academicYear.name,
        startDate: new Date(academicYear.startDate).toISOString().split('T')[0],
        endDate: new Date(academicYear.endDate).toISOString().split('T')[0],
        isActive: academicYear.isActive,
      });
    }
  }, [academicYear, reset]);

  const onSubmit = async (data: UpdateAcademicYearDto) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const updateData = {
        ...data,
        year: data.year ? parseInt(data.year.toString()) : undefined,
      };

      await academicYearsService.update(academicYearId, updateData);
      toast.success('Ano letivo atualizado com sucesso!');
      router.push(`/admin/academic-years/${academicYearId}`);
    } catch (err: any) {
      console.error('Erro ao atualizar ano letivo:', err);
      const errorMsg = err?.message || 'Erro ao atualizar ano letivo. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Carregando ano letivo..." />
      </div>
    );
  }

  if (!academicYear) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600 dark:text-gray-400">
          Ano letivo não encontrado
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
          Editar Ano Letivo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Atualize as informações do ano letivo
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
              Informações do Ano Letivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Ano"
                type="number"
                {...register('year', {
                  min: { value: 2000, message: 'Ano deve ser maior que 2000' },
                  max: { value: 2100, message: 'Ano deve ser menor que 2100' },
                })}
                error={errors.year?.message}
                placeholder="2024"
              />
              <Input
                label="Nome"
                {...register('name')}
                error={errors.name?.message}
                placeholder="Ano Letivo 2024"
                helpText="Ex: Ano Letivo 2024, 2024/2025"
              />
            </div>
          </div>

          {/* Datas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Período do Ano Letivo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Data de Início"
                type="date"
                {...register('startDate')}
                error={errors.startDate?.message}
              />
              <Input
                label="Data de Término"
                type="date"
                {...register('endDate', {
                  validate: (value) => {
                    if (
                      startDate &&
                      value &&
                      new Date(value) <= new Date(startDate)
                    ) {
                      return 'Data de término deve ser posterior à data de início';
                    }
                    return true;
                  },
                })}
                error={errors.endDate?.message}
              />
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
                Ano letivo ativo
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Anos letivos ativos podem receber matrículas e ter turmas criadas
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
