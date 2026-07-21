'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { institutionsService } from '@/services/institutions.service';
import { UpdateInstitutionDto } from '@/types/institution.types';

interface EditInstitutionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditInstitutionPage({ params }: EditInstitutionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: institution, isLoading, error } = useQuery({
    queryKey: ['institution', id],
    queryFn: () => institutionsService.findOne(id),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateInstitutionDto>();

  useEffect(() => {
    if (institution) {
      reset({
        name: institution.name,
        slug: institution.slug,
        city: institution.city || '',
        state: institution.state || '',
        isActive: institution.isActive.toString() as any,
      });
    }
  }, [institution, reset]);

  const onSubmit = async (data: UpdateInstitutionDto) => {
    try {
      setIsSubmitting(true);
      await institutionsService.update(id, {
        ...data,
        isActive: data.isActive === true || data.isActive === 'true' as any,
      });
      toast.success('Instituição atualizada com sucesso!');
      router.push('/super-admin/institutions');
    } catch (error: any) {
      console.error('Erro ao atualizar instituição:', error);
      toast.error(error.message || 'Erro ao atualizar instituição. Verifique os dados fornecidos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>Instituição não encontrada ou erro ao carregar.</p>
        <Button onClick={() => router.back()} className="mt-4" variant="secondary">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Editar Instituição
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Atualize os dados da escola "{institution.name}"
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <Input
                label="Nome da Instituição *"
                placeholder="Ex: Escola Estadual Machado de Assis"
                {...register('name', { required: 'Nome é obrigatório' })}
                error={errors.name?.message}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <Input
                label="Slug (Identificador na URL) *"
                placeholder="Ex: escola-machado-de-assis"
                {...register('slug', { 
                  required: 'Slug é obrigatório',
                  pattern: {
                    value: /^[a-z0-9-]+$/,
                    message: 'Apenas letras minúsculas, números e hifens',
                  }
                })}
                error={errors.slug?.message}
                helpText="Usado para o link de acesso da escola. Apenas letras minúsculas sem acento, números e hifens."
              />
            </div>

            <div>
              <Input
                label="Cidade"
                placeholder="Ex: São Paulo"
                {...register('city')}
              />
            </div>

            <div>
              <Input
                label="Estado (UF)"
                placeholder="Ex: SP"
                maxLength={2}
                {...register('state')}
              />
            </div>

            <div>
              <Select
                label="Status *"
                {...register('isActive')}
                options={[
                  { value: 'true', label: 'Ativo' },
                  { value: 'false', label: 'Inativo' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
