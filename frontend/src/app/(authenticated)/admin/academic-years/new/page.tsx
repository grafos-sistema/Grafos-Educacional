'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { academicYearsService } from '@/services/academic-years.service';
import { CreateAcademicYearDto } from '@/types/academic.types';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { buildIsoDate, getDayOptions, monthOptions } from '@/lib/academic-calendar';

type NewAcademicYearFormValues = Omit<CreateAcademicYearDto, 'year' | 'startDate' | 'endDate'> & {
  year: string;
  startDate: string;
  endDate: string;
  startDay: string;
  startMonth: string;
  endDay: string;
  endMonth: string;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 21 }, (_, index) => {
  const year = currentYear - 10 + index;
  return {
    value: String(year),
    label: String(year),
  };
});
const allDayOptions = Array.from({ length: 31 }, (_, index) => {
  const day = index + 1;
  return {
    value: String(day),
    label: String(day).padStart(2, '0'),
  };
});

export default function NewAcademicYearPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NewAcademicYearFormValues>({
    defaultValues: {
      year: String(currentYear),
      name: `Ano Letivo ${currentYear}`,
      isActive: true,
      startDay: '',
      startMonth: '',
      endDay: '',
      endMonth: '',
      startDate: '',
      endDate: '',
    },
  });

  const selectedYear = Number(watch('year')) || currentYear;
  const startMonth = watch('startMonth');
  const startDay = watch('startDay');
  const endMonth = watch('endMonth');
  const endDay = watch('endDay');
  const startDate = watch('startDate');

  const startDayOptions = useMemo(
    () => getDayOptions(selectedYear, startMonth),
    [selectedYear, startMonth],
  );
  const endDayOptions = useMemo(
    () => getDayOptions(selectedYear, endMonth),
    [selectedYear, endMonth],
  );

  useEffect(() => {
    if (
      startMonth &&
      startDay &&
      !startDayOptions.some((option) => option.value === startDay)
    ) {
      setValue('startDay', '');
    }
  }, [setValue, startDay, startDayOptions, startMonth]);

  useEffect(() => {
    if (
      endMonth &&
      endDay &&
      !endDayOptions.some((option) => option.value === endDay)
    ) {
      setValue('endDay', '');
    }
  }, [endDay, endDayOptions, setValue, endMonth]);

  useEffect(() => {
    const nextStartDate = buildIsoDate(selectedYear, startMonth, startDay);
    setValue('startDate', nextStartDate, {
      shouldValidate: false,
    });

    if (nextStartDate) {
      clearErrors('startDate');
    }
  }, [clearErrors, selectedYear, setValue, startDay, startMonth]);

  useEffect(() => {
    const nextEndDate = buildIsoDate(selectedYear, endMonth, endDay);
    setValue('endDate', nextEndDate, {
      shouldValidate: false,
    });

    if (nextEndDate) {
      clearErrors('endDate');
    }
  }, [clearErrors, endDay, endMonth, selectedYear, setValue]);

  const onSubmit = async (data: NewAcademicYearFormValues) => {
    if (!user?.institutionId) {
      setError('Instituição não encontrada');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const academicYearData = {
        year: parseInt(data.year, 10),
        name: data.name.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        institutionId: user.institutionId,
      };

      await academicYearsService.create(academicYearData);
      await queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast.success('Ano letivo criado com sucesso!');
      router.push('/admin/academic-years');
    } catch (err: any) {
      console.error('Erro ao criar ano letivo:', err);
      const errorMsg = err?.message || 'Erro ao criar ano letivo. Tente novamente.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gerar nome automático baseado no ano
  const generateName = (year: number) => {
    return `Ano Letivo ${year}`;
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
          Novo Ano Letivo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Preencha os dados para criar um novo ano letivo
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
              <Select
                label="Ano"
                options={yearOptions}
                {...register('year', {
                  required: 'Ano é obrigatório',
                })}
                error={errors.year?.message}
                required
              />
              <Input
                label="Nome"
                {...register('name', { required: 'Nome é obrigatório' })}
                error={errors.name?.message}
                placeholder={generateName(selectedYear)}
                helpText={`Sugestão: ${generateName(selectedYear)}`}
                required
              />
            </div>
          </div>

          {/* Datas */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Período do Ano Letivo
            </h2>
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
              O ano foi definido como <strong>{selectedYear}</strong>. Agora escolha apenas o mês e o dia.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Início do ano letivo
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Select
                    label="Dia"
                    options={[
                      { value: '', label: 'Selecione...' },
                      ...(startMonth ? startDayOptions : allDayOptions),
                    ]}
                    {...register('startDay')}
                    required
                  />
                  <Select
                    label="Mês"
                    options={[{ value: '', label: 'Selecione...' }, ...monthOptions]}
                    {...register('startMonth')}
                    required
                  />
                </div>
                <input
                  type="hidden"
                  {...register('startDate', {
                    required: 'Selecione o mês e o dia de início',
                  })}
                />
                {errors.startDate?.message ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.startDate.message}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Término do ano letivo
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <Select
                    label="Dia"
                    options={[
                      { value: '', label: 'Selecione...' },
                      ...(endMonth ? endDayOptions : allDayOptions),
                    ]}
                    {...register('endDay')}
                    required
                  />
                  <Select
                    label="Mês"
                    options={[{ value: '', label: 'Selecione...' }, ...monthOptions]}
                    {...register('endMonth')}
                    required
                  />
                </div>
                <input
                  type="hidden"
                  {...register('endDate', {
                    required: 'Selecione o mês e o dia de término',
                    validate: (value) => {
                      if (startDate && value && new Date(value) <= new Date(startDate)) {
                        return 'Data de término deve ser posterior à data de início';
                      }
                      return true;
                    },
                  })}
                />
                {errors.endDate?.message ? (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.endDate.message}</p>
                ) : null}
              </div>
            </div>
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
                Ano letivo ativo
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Anos letivos ativos podem receber matrículas e ter turmas criadas
            </p>
          </div>

          {/* Dica */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-400 text-sm">
              <strong>Dica:</strong> Após criar o ano letivo, você poderá adicionar os
              períodos acadêmicos (semestres, bimestres, trimestres, etc.) na página de
              detalhes.
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
              Criar Ano Letivo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
