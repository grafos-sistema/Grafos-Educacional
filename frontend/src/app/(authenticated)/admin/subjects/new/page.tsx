'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { subjectsService } from '@/services/subjects.service';
import { CreateSubjectDto } from '@/types/subject.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SubjectNameSelector } from '@/components/subjects/SubjectNameSelector';
import { SubjectColorPicker } from '@/components/subjects/SubjectColorPicker';
import {
  isCatalogSubject,
  normalizeSubjectCode,
  suggestUniqueSubjectCode,
} from '@/lib/constants/subject-options';
import { DEFAULT_SUBJECT_COLOR } from '@/lib/constants/subject-colors';

export default function NewSubjectPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SUBJECT_COLOR);
  const [isCustomSubjectName, setIsCustomSubjectName] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [lastSuggestedCode, setLastSuggestedCode] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError: setFormError,
    clearErrors,
    watch,
  } = useForm<CreateSubjectDto>();

  const watchedName = watch('name') ?? '';
  const watchedCode = watch('code') ?? '';

  const { data: existingSubjectsData } = useQuery({
    queryKey: ['subject-codes', user?.institutionId],
    queryFn: () =>
      subjectsService.findAll({
        institutionId: user!.institutionId,
        limit: 1000,
        page: 1,
      }),
    enabled: Boolean(user?.institutionId),
  });

  const existingCodes = useMemo(
    () =>
      (existingSubjectsData?.data ?? [])
        .map((subject) => normalizeSubjectCode(subject.code ?? ''))
        .filter(Boolean),
    [existingSubjectsData?.data]
  );

  const applySuggestedCode = (nextName: string) => {
    const trimmedName = nextName.trim();

    if (!trimmedName) {
      if (!codeManuallyEdited || watchedCode === lastSuggestedCode) {
        setValue('code', '');
        setLastSuggestedCode('');
      }
      return;
    }

    const suggestedCode = suggestUniqueSubjectCode(trimmedName, existingCodes);

    if (!codeManuallyEdited || !watchedCode || watchedCode === lastSuggestedCode) {
      setValue('code', suggestedCode, { shouldValidate: true });
      setLastSuggestedCode(suggestedCode);
    }
  };

  const handleSubjectNameChange = (nextName: string) => {
    if (isCatalogSubject(nextName)) {
      setIsCustomSubjectName(false);
    }

    setValue('name', nextName, { shouldValidate: true });
    clearErrors('name');
    applySuggestedCode(nextName);
  };

  const handleSelectSubject = (subject: { name: string }) => {
    setIsCustomSubjectName(false);
    handleSubjectNameChange(subject.name);
  };

  useEffect(() => {
    const normalizedCode = normalizeSubjectCode(watchedCode);

    if (!normalizedCode) {
      clearErrors('code');
      return;
    }

    if (existingCodes.includes(normalizedCode)) {
      setFormError('code', {
        type: 'manual',
        message: 'Já existe uma disciplina com este código',
      });
      return;
    }

    clearErrors('code');
  }, [clearErrors, existingCodes, setFormError, watchedCode]);

  const onSubmit = async (data: CreateSubjectDto) => {
    if (!user?.institutionId) {
      setPageError('Instituição não encontrada');
      return;
    }

    setIsSubmitting(true);
    setPageError(null);

    try {
      if (!data.name?.trim()) {
        setFormError('name', { type: 'manual', message: 'Nome é obrigatório' });
        setIsSubmitting(false);
        return;
      }

      if (!isCustomSubjectName && !isCatalogSubject(data.name)) {
        setFormError('name', {
          type: 'manual',
          message: 'Selecione uma disciplina da lista ou use a opcao de cadastrar o nome digitado',
        });
        setIsSubmitting(false);
        return;
      }

      const normalizedCode = normalizeSubjectCode(data.code ?? '');
      if (normalizedCode && existingCodes.includes(normalizedCode)) {
        setFormError('code', {
          type: 'manual',
          message: 'Já existe uma disciplina com este código',
        });
        setIsSubmitting(false);
        return;
      }

      const subjectData = {
        ...data,
        name: data.name.trim(),
        code: normalizedCode || undefined,
        color: selectedColor,
        institutionId: user.institutionId,
      };

      await subjectsService.create(subjectData);
      toast.success('Disciplina criada com sucesso!');
      router.push('/admin/subjects');
    } catch (err: any) {
      console.error('Erro ao criar disciplina:', err);
      const errorMsg = err?.message || 'Erro ao criar disciplina. Tente novamente.';
      setPageError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Nova Disciplina
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados para criar uma nova disciplina
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Erro geral */}
          {pageError && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-400 text-sm">{pageError}</p>
            </div>
          )}

          {/* Informações básicas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações da Disciplina
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="hidden"
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              <input
                type="hidden"
                {...register('code')}
              />
              <div className="md:col-span-3">
                <SubjectNameSelector
                  value={watchedName}
                  error={errors.name?.message}
                  onValueChange={handleSubjectNameChange}
                  onSelectSubject={handleSelectSubject}
                  onSelectCustomValue={(customValue) => {
                    setIsCustomSubjectName(true);
                    handleSubjectNameChange(customValue);
                  }}
                />
              </div>
              <div className="md:col-span-1">
                <Input
                  label="Código"
                  value={watchedCode}
                  onChange={(event) => {
                    setCodeManuallyEdited(true);
                    setValue('code', normalizeSubjectCode(event.target.value), {
                      shouldValidate: true,
                    });
                  }}
                  error={errors.code?.message}
                  placeholder="Ex: MAT"
                />
              </div>
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
            <SubjectColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              description="Escolha uma cor para identificar visualmente a disciplina em horários e calendários."
            />
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('isActive')}
                defaultChecked={true}
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
              Criar Disciplina
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
