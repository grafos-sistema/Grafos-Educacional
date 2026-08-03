'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { BRAZILIAN_UF_OPTIONS } from '@/lib/constants/document-options';
import { institutionsService } from '@/services/institutions.service';
import { CreateInstitutionDto } from '@/types/institution.types';

export default function NewInstitutionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateInstitutionDto>({
    defaultValues: {
      isActive: true,
    },
  });

  const onSubmit = async (data: CreateInstitutionDto) => {
    try {
      setIsSubmitting(true);
      await institutionsService.create({
        ...data,
        isActive: data.isActive === true || data.isActive === 'true' as any,
      });
      toast.success('Instituição cadastrada com sucesso!');
      router.push('/super-admin/institutions');
    } catch (error: any) {
      console.error('Erro ao cadastrar instituição:', error);
      toast.error(error.message || 'Erro ao cadastrar instituição. Verifique se o slug já está em uso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nova Instituição
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Cadastre a instituição base que será gerenciada pelo Super Admin Global
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <Input
                label="Nome da Instituição *"
                placeholder="Ex: SESI"
                {...register('name', { required: 'Nome é obrigatório' })}
                error={errors.name?.message}
              />
            </div>

            <div>
              <Input
                label="CNPJ"
                placeholder="Ex: 12.345.678/0001-90"
                {...register('cnpj')}
              />
            </div>

            <div>
              <Input
                label="Email Institucional"
                placeholder="Ex: contato@escola.com.br"
                type="email"
                {...register('email')}
              />
            </div>

            <div>
              <Input
                label="Telefone"
                placeholder="Ex: (11) 99999-9999"
                {...register('phone')}
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

            <div className="col-span-1 md:col-span-2">
              <Input
                label="Endereço"
                placeholder="Ex: Av. Principal, 1000"
                {...register('address')}
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
              <Select
                label="Estado (UF)"
                options={[{ value: '', label: 'Selecione a UF' }, ...BRAZILIAN_UF_OPTIONS]}
                {...register('state')}
              />
            </div>

            <div>
              <Input
                label="CEP"
                placeholder="Ex: 01000-000"
                {...register('zipCode')}
              />
            </div>

            <div>
              <Input
                label="País"
                placeholder="Brasil"
                {...register('country')}
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
              Cadastrar Instituição
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
