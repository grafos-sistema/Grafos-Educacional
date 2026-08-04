'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import {
  InstitutionFormTabs,
  type InstitutionFormValues,
} from '@/components/institutions/InstitutionFormTabs';
import { institutionsService } from '@/services/institutions.service';

const normalizeIsActive = (value?: InstitutionFormValues['isActive']) =>
  value === true || value === 'true';

export default function NewInstitutionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InstitutionFormValues>({
    defaultValues: {
      isActive: true,
      units: [
        {
          name: '',
          managerName: '',
          directorUserId: '',
          directorMode: 'none',
          directorFirstName: '',
          directorLastName: '',
          directorCpf: '',
          directorEmail: '',
          directorPhone: '',
          email: '',
          phone: '',
          zipCode: '',
          address: '',
          numero: '',
          complemento: '',
          city: '',
          state: '',
          isActive: true,
        },
      ],
    },
  });

  const onSubmit = async (data: InstitutionFormValues) => {
    try {
      setIsSubmitting(true);
      await institutionsService.create({
        ...data,
        isActive: normalizeIsActive(data.isActive),
      });

      toast.success('Instituição cadastrada com sucesso!');
      router.push('/super-admin/institutions');
    } catch (error: unknown) {
      console.error('Erro ao cadastrar instituição:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao cadastrar instituição. Verifique se o slug já está em uso.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6 pt-1">
        <div className="mb-1 flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full p-2"
            aria-label="Voltar"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Nova Instituição
          </h1>
        </div>
        <p className="ml-12 text-sm text-gray-600 dark:text-gray-400">
          Cadastre a instituição base que será gerenciada pelo Super Admin Global.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <InstitutionFormTabs form={form} />

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
  );
}
