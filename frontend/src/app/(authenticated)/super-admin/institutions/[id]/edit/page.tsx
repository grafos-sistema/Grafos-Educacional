'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import {
  InstitutionFormTabs,
  type InstitutionFormValues,
} from '@/components/institutions/InstitutionFormTabs';
import { resolveInstitutionUnitDirectors } from '@/lib/institution-unit-directors';
import { institutionsService } from '@/services/institutions.service';

interface EditInstitutionPageProps {
  params: Promise<{ id: string }>;
}

const normalizeIsActive = (value?: InstitutionFormValues['isActive']) =>
  value === true || value === 'true';

export default function EditInstitutionPage({ params }: EditInstitutionPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: institution, isLoading, error } = useQuery({
    queryKey: ['institution', id],
    queryFn: () => institutionsService.findOne(id),
  });

  const form = useForm<InstitutionFormValues>();
  const { reset } = form;

  useEffect(() => {
    if (institution) {
      reset({
        name: institution.name,
        slug: institution.slug,
        cnpj: institution.cnpj || '',
        email: institution.email || '',
        phone: institution.phone || '',
        website: institution.website || '',
        logo: institution.logo || '',
        isActive: institution.isActive ? 'true' : 'false',
        units:
          institution.units?.map((unit) => ({
            id: unit.id,
            name: unit.name || '',
            managerName: unit.managerName || '',
            directorUserId: unit.directorUserId || '',
            directorMode: unit.directorUserId ? 'link' : 'none',
            directorFirstName: '',
            directorLastName: '',
            directorCpf: '',
            directorEmail: '',
            directorPhone: '',
            email: unit.email || '',
            phone: unit.phone || '',
            zipCode: unit.zipCode || '',
            address: unit.address || '',
            numero: unit.numero || '',
            complemento: unit.complemento || '',
            city: unit.city || '',
            state: unit.state || '',
            isActive: unit.isActive,
          })) || [
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
      });
    }
  }, [institution, reset]);

  const onSubmit = async (data: InstitutionFormValues) => {
    try {
      setIsSubmitting(true);
      const persistedUnits = institution?.units ?? [];
      const unitsWithDirectors = await resolveInstitutionUnitDirectors(
        id,
        persistedUnits,
        data.units
      );

      await institutionsService.update(id, {
        ...data,
        isActive: normalizeIsActive(data.isActive),
        units: unitsWithDirectors,
      });
      toast.success('Instituição atualizada com sucesso!');
      router.push('/super-admin/institutions');
    } catch (error: unknown) {
      console.error('Erro ao atualizar instituição:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar instituição. Verifique os dados fornecidos.';
      toast.error(message);
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
            Editar Instituição
          </h1>
        </div>
        <p className="ml-12 text-sm text-gray-600 dark:text-gray-400">
          Atualize os dados cadastrais da instituição &quot;{institution.name}&quot;.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <InstitutionFormTabs form={form} institutionId={id} />

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
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
